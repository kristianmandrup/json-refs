/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2014 Jeremy Whitlock
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

'use strict';

/**
 * Various utilities for JSON References *(http://tools.ietf.org/html/draft-pbryan-zyp-json-ref-03)* and
 * JSON Pointers *(https://tools.ietf.org/html/rfc6901)*.
 *
 * @module JsonRefs
 */

// Cherry-pick lodash components to help with size
var _ = require('lodash');
var gl = require('graphlib');
var path = require('path');
var qs = require('querystring');
var slash = require('slash');
var URI = require('uri-js');

var badPtrTokenRegex = /~(?:[^01]|$)/g;
var remoteTypes = ['relative', 'remote'];
var remoteUriTypes = ['absolute', 'uri'];
var uriDetailsCache = {};

// Load promises polyfill if necessary
/* istanbul ignore if */
if (typeof Promise === 'undefined') {
  require('native-promise-only');
}

/* Internal Functions */

module.exports = class RefUtils {
  constructor(options, name) {
    this.name = name || 'RefUtils'
    this.options = options
  }

  log(msg, data) {
    console.log(this.name, msg, data || '')
  }

  log(msg, data) {
    console.log('RefUtils', msg, data || '')
  }

  combineQueryParams(qs1, qs2) {
    var combined = {};

    function mergeQueryParams(obj) {
      _.each(obj, function (val, key) {
        combined[key] = val;
      });
    }

    mergeQueryParams(qs.parse(qs1 || ''));
    mergeQueryParams(qs.parse(qs2 || ''));

    return Object.keys(combined).length === 0 ? undefined : qs.stringify(combined);
  }

  combineURIs(u1, u2) {
    // Convert Windows paths
    if (_.isString(u1)) {
      u1 = slash(u1);
    }

    if (_.isString(u2)) {
      u2 = slash(u2);
    }

    var u2Details = parseURI(_.isUndefined(u2) ? '' : u2);
    var u1Details;
    var combinedDetails;

    if (remoteUriTypes.indexOf(u2Details.reference) > -1) {
      combinedDetails = u2Details;
    } else {
      u1Details = _.isUndefined(u1) ? undefined : parseURI(u1);

      if (!_.isUndefined(u1Details)) {
        combinedDetails = u1Details;

        // Join the paths
        combinedDetails.path = slash(path.join(u1Details.path, u2Details.path));

        // Join query parameters
        combinedDetails.query = combineQueryParams(u1Details.query, u2Details.query);
      } else {
        combinedDetails = u2Details;
      }
    }

    // Remove the fragment
    combinedDetails.fragment = undefined;

    // For relative URIs, add back the '..' since it was removed above
    return (remoteUriTypes.indexOf(combinedDetails.reference) === -1 &&
      combinedDetails.path.indexOf('../') === 0 ? '../' : '') + URI.serialize(combinedDetails);
  }

  findAncestors(obj, path) {
    var ancestors = [];
    var node;

    if (path.length > 0) {
      node = obj;

      path.slice(0, path.length - 1).forEach(function (seg) {
        if (seg in node) {
          node = node[seg];

          ancestors.push(node);
        }
      });
    }

    return ancestors;
  }

  isRemote(refDetails) {
    return remoteTypes.indexOf(this.getRefType(refDetails)) > -1;
  }

  isValid(refDetails) {
    return _.isUndefined(refDetails.error) && refDetails.type !== 'invalid';
  }

  findValue(obj, path) {
    var value = obj;

    // Using this manual approach instead of _.get since we have to decodeURI the segments
    path.forEach((seg) => {
      seg = this.decodeURI(seg);

      if (seg in value) {
        value = value[seg];
      } else {
        throw Error('JSON Pointer points to missing location: ' + pathToPtr(path));
      }
    });

    return value;
  }

  getExtraRefKeys(ref) {
    return Object.keys(ref).filter(function (key) {
      return key !== '$ref';
    });
  }

  getRefType(refDetails) {
    var type;

    // Convert the URI reference to one of our types
    switch (refDetails.uriDetails.reference) {
      case 'absolute':
      case 'uri':
        type = 'remote';
        break;
      case 'same-document':
        type = 'local';
        break;
      default:
        type = refDetails.uriDetails.reference;
    }

    return type;
  }

  getRemoteDocument(url, options) {
    options = options || this.options
    var cacheEntry = remoteCache[url];
    var allTasks = Promise.resolve();
    var loaderOptions = _.cloneDeep(options.loaderOptions || {});

    if (_.isUndefined(cacheEntry)) {
      // If there is no content processor, default to processing the raw response as JSON
      if (_.isUndefined(loaderOptions.processContent)) {
        loaderOptions.processContent = (res, callback) => {
          callback(undefined, JSON.parse(res.text));
        };
      }

      var location = this.decodeURI(url);

      // Attempt to load the resource using path-loader
      allTasks = options.pathLoader.load(this.decodeURI(url), loaderOptions);

      // Update the cache
      allTasks = allTasks
        .then((res) => {
          remoteCache[url] = {
            value: res
          };

          return res;
        })
        .catch((err) => {
          remoteCache[url] = {
            error: err
          };

          throw err;
        });
    } else {
      // Return the cached version
      allTasks = allTasks.then(() => {
        if (_.isError(cacheEntry.error)) {
          throw cacheEntry.error;
        } else {
          return cacheEntry.value;
        }
      });
    }

    // Return a cloned version to avoid updating the cache
    allTasks = allTasks.then((res) => {
      return _.cloneDeep(res);
    });

    return allTasks;
  }

  isRefLike(obj, throwWithDetails) {
    var refLike = true;

    try {
      if (!_.isPlainObject(obj)) {
        throw new Error('obj is not an Object');
      } else if (!_.isString(obj.$ref)) {
        throw new Error('obj.$ref is not a String');
      }
    } catch (err) {
      if (throwWithDetails) {
        throw err;
      }

      refLike = false;
    }

    return refLike;
  }

  makeAbsolute(location, ) {
    options = options || {}
    if (location.indexOf('://') === -1 && !path.isAbsolute(location)) {
      return path.resolve(process.cwd(), location)
    } else {
      return location;
    }
  }

  makeRefFilter(options) {
    var refFilter;
    var validTypes;

    if (_.isArray(options.filter) || _.isString(options.filter)) {
      validTypes = _.isString(options.filter) ? [options.filter] : options.filter;
      refFilter = (refDetails) => {
        // Check the exact type or for invalid URIs, check its original type
        return validTypes.indexOf(refDetails.type) > -1 || validTypes.indexOf(this.getRefType(refDetails)) > -1;
      };
    } else if (_.isFunction(options.filter)) {
      refFilter = options.filter;
    } else if (_.isUndefined(options.filter)) {
      refFilter = function () {
        return true;
      };
    }

    return (refDetails, path) => {
      return (refDetails.type !== 'invalid' || options.includeInvalid === true) && this.refFilter(refDetails, path);
    };
  }

  markMissing(refDetails, err) {
    refDetails.error = err.message;
    refDetails.missing = true;
  }

  parseURI(uri) {
    // We decode first to avoid doubly encoding
    return URI.parse(this.encodeURI(this.decodeURI(uri)));
  }



  setValue(obj, refPath, value) {
    findValue(obj, refPath.slice(0, refPath.length - 1))[decodeURI(refPath[refPath.length - 1])] = value;
  }

  walk(ancestors, node, path, fn) {
    var processChildren = true;

    function walkItem(item, segment) {
      path.push(segment);
      walk(ancestors, item, path, fn);
      path.pop();
    }

    // Call the iteratee
    if (_.isFunction(fn)) {
      processChildren = fn(ancestors, node, path);
    }

    // We do not process circular objects again
    if (ancestors.indexOf(node) === -1) {
      ancestors.push(node);

      if (processChildren !== false) {
        if (_.isArray(node)) {
          node.forEach(function (member, index) {
            walkItem(member, index.toString());
          });
        } else if (_.isObject(node)) {
          _.each(node, function (cNode, key) {
            walkItem(cNode, key);
          });
        }
      }

      ancestors.pop();
    }
  }
}
