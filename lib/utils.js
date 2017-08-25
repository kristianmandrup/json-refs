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
var remoteCache = {};
var remoteTypes = ['relative', 'remote'];
var remoteUriTypes = ['absolute', 'uri'];
var uriDetailsCache = {};

// Load promises polyfill if necessary
/* istanbul ignore if */
if (typeof Promise === 'undefined') {
  require('native-promise-only');
}

/* Internal Functions */

function combineQueryParams(qs1, qs2) {
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

function combineURIs(u1, u2) {
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

function findAncestors(obj, path) {
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

function isRemote(refDetails) {
  return remoteTypes.indexOf(getRefType(refDetails)) > -1;
}

function isValid(refDetails) {
  return _.isUndefined(refDetails.error) && refDetails.type !== 'invalid';
}

function findValue(obj, path) {
  var value = obj;

  // Using this manual approach instead of _.get since we have to decodeURI the segments
  path.forEach(function (seg) {
    seg = decodeURI(seg);

    if (seg in value) {
      value = value[seg];
    } else {
      throw Error('JSON Pointer points to missing location: ' + pathToPtr(path));
    }
  });

  return value;
}

function getExtraRefKeys(ref) {
  return Object.keys(ref).filter(function (key) {
    return key !== '$ref';
  });
}

function getRefType(refDetails) {
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

function getRemoteDocument(url, options) {
  var cacheEntry = remoteCache[url];
  var allTasks = Promise.resolve();
  var loaderOptions = _.cloneDeep(options.loaderOptions || {});

  if (_.isUndefined(cacheEntry)) {
    // If there is no content processor, default to processing the raw response as JSON
    if (_.isUndefined(loaderOptions.processContent)) {
      loaderOptions.processContent = function (res, callback) {
        callback(undefined, JSON.parse(res.text));
      };
    }

    var location = decodeURI(url);

    // Attempt to load the resource using path-loader
    allTasks = options.pathLoader.load(decodeURI(url), loaderOptions);

    // Update the cache
    allTasks = allTasks
      .then(function (res) {
        remoteCache[url] = {
          value: res
        };

        return res;
      })
      .catch(function (err) {
        remoteCache[url] = {
          error: err
        };

        throw err;
      });
  } else {
    // Return the cached version
    allTasks = allTasks.then(function () {
      if (_.isError(cacheEntry.error)) {
        throw cacheEntry.error;
      } else {
        return cacheEntry.value;
      }
    });
  }

  // Return a cloned version to avoid updating the cache
  allTasks = allTasks.then(function (res) {
    return _.cloneDeep(res);
  });

  return allTasks;
}

function isRefLike(obj, throwWithDetails) {
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

function doResolvePath(location, options) {
  return path.resolve(process.cwd(), location)
}

function resolvePath(location, options = {}) {
  var resolve = options.resolvePath ? options.resolvePath : doResolvePath
  return resolve(process.cwd(), location)
}

function makeAbsolute(location, options) {
  options = options || {}
  if (location.indexOf('://') === -1 && !path.isAbsolute(location)) {
    return resolvePath(location)
  } else {
    return location;
  }
}

function makeRefFilter(options) {
  var refFilter;
  var validTypes;

  if (_.isArray(options.filter) || _.isString(options.filter)) {
    validTypes = _.isString(options.filter) ? [options.filter] : options.filter;
    refFilter = function (refDetails) {
      // Check the exact type or for invalid URIs, check its original type
      return validTypes.indexOf(refDetails.type) > -1 || validTypes.indexOf(getRefType(refDetails)) > -1;
    };
  } else if (_.isFunction(options.filter)) {
    refFilter = options.filter;
  } else if (_.isUndefined(options.filter)) {
    refFilter = function () {
      return true;
    };
  }

  return function (refDetails, path) {
    return (refDetails.type !== 'invalid' || options.includeInvalid === true) && refFilter(refDetails, path);
  };
}

function makeSubDocPath(options) {
  var subDocPath;

  if (_.isArray(options.subDocPath)) {
    subDocPath = options.subDocPath;
  } else if (_.isString(options.subDocPath)) {
    subDocPath = pathFromPtr(options.subDocPath);
  } else if (_.isUndefined(options.subDocPath)) {
    subDocPath = [];
  }

  return subDocPath;
}

function markMissing(refDetails, err) {
  refDetails.error = err.message;
  refDetails.missing = true;
}

function parseURI(uri) {
  // We decode first to avoid doubly encoding
  return URI.parse(encodeURI(decodeURI(uri)));
}

function buildRefModel(document, options, metadata) {
  var allTasks = Promise.resolve();
  var subDocPtr = pathToPtr(options.subDocPath);
  var absLocation = makeAbsolute(options.location, options);
  var relativeBase = path.dirname(options.location);
  var docDepKey = absLocation + subDocPtr;
  var refs;
  var rOptions;

  console.log('buildRefModel', {
    options,
    subDocPtr,
    absLocation,
    relativeBase
  })

  // Store the document in the metadata if necessary
  if (_.isUndefined(metadata.docs[absLocation])) {
    metadata.docs[absLocation] = document;
  }

  // If there are no dependencies stored for the location+subDocPath, we've never seen it before and will process it
  if (_.isUndefined(metadata.deps[docDepKey])) {
    metadata.deps[docDepKey] = {};

    // Find the references based on the options
    refs = findRefs(document, options);

    // Iterate over the references and process
    _.each(refs, function (refDetails, refPtr) {
      var refKey = makeAbsolute(options.location, options) + refPtr;
      var remoteLocation = isRemote(refDetails) ? combineURIs(relativeBase, refDetails.uri) : options.location;
      var anchor = '#' + (refDetails.uri.indexOf('#') > -1 ? refDetails.uri.split('#')[1] : '');

      var refdKey = refDetails.refdId = makeAbsolute(remoteLocation, options) + anchor;

      console.log('Iterate over the references and process', {
        refKey,
        remoteLocation,
        refdKey
      })

      // Record reference metadata
      metadata.refs[refKey] = refDetails;

      // Do not process invalid references
      if (!isValid(refDetails)) {
        console.log('invalid Ref', refDetails)
        return;
      }

      // Record dependency (relative to the document's sub-document path)
      metadata.deps[docDepKey][refPtr === subDocPtr ? '#' : refPtr.replace(subDocPtr + '/', '#/')] = refdKey;

      // Do not process directly-circular references (to an ancestor or self)
      if (refKey.indexOf(refdKey + '/') === 0) {
        refDetails.circular = true;
        console.log('circular', {
          refKey,
          refdKey
        })
        return;
      }

      // Prepare the options for subsequent processDocument calls
      rOptions = _.cloneDeep(options);

      rOptions.subDocPath = _.isUndefined(refDetails.uriDetails.fragment) ? [] :
        pathFromPtr(decodeURI(refDetails.uriDetails.fragment));

      // Resolve the reference
      if (isRemote(refDetails)) {
        console.log('is remote', refDetails)
        // Delete filter.options because all remote references should be fully resolved
        delete rOptions.filter;
        // The new location being referenced
        rOptions.location = refdKey.split('#')[0];

        allTasks = allTasks
          .then(function (nMetadata, nOptions) {
            return function () {
              var rAbsLocation = makeAbsolute(nOptions.location, options);
              var rDoc = nMetadata.docs[rAbsLocation];
              console.log({
                rAbsLocation
              })

              if (_.isUndefined(rDoc)) {
                // We have no cache so we must retrieve the document
                return getRemoteDocument(rAbsLocation, nOptions)
                  .catch(function (err) {
                    // Store the response in the document cache
                    nMetadata.docs[rAbsLocation] = err;

                    // Return the error to allow the subsequent `then` to handle both errors and successes
                    return err;
                  });
              } else {
                // We have already retrieved (or attempted to) the document and should use the cached version in the
                // metadata since it could already be processed some.
                return Promise.resolve()
                  .then(function () {
                    return rDoc;
                  });
              }
            };
          }(metadata, rOptions));
      } else {
        console.log('not remote', refDetails)
        allTasks = allTasks
          .then(function () {
            return document;
          });
      }

      // Process the remote document or the referenced portion of the local document
      allTasks = allTasks
        .then(function (nMetadata, nOptions, nRefDetails) {
          console.log('process remote')

          return function (doc) {
            if (_.isError(doc)) {
              markMissing(nRefDetails, doc);
            } else {
              // Wrapped in a try/catch since findRefs throws
              try {
                return buildRefModel(doc, nOptions, nMetadata)
                  .catch(function (err) {
                    markMissing(nRefDetails, err);
                  });
              } catch (err) {
                markMissing(nRefDetails, err);
              }
            }
          };
        }(metadata, rOptions, refDetails));
    });
  }

  return allTasks;
}

function setValue(obj, refPath, value) {
  findValue(obj, refPath.slice(0, refPath.length - 1))[decodeURI(refPath[refPath.length - 1])] = value;
}

function walk(ancestors, node, path, fn) {
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

function validateOptions(options, obj) {
  var locationParts;

  if (_.isUndefined(options)) {
    // Default to an empty options object
    options = {};
  } else {
    // Clone the options so we do not alter the ones passed in
    options = _.cloneDeep(options);
  }

  if (!_.isObject(options)) {
    throw new TypeError('options must be an Object');
  } else if (!_.isUndefined(options.resolveCirculars) &&
    !_.isBoolean(options.resolveCirculars)) {
    throw new TypeError('options.resolveCirculars must be a Boolean');
  } else if (!_.isUndefined(options.filter) &&
    !_.isArray(options.filter) &&
    !_.isFunction(options.filter) &&
    !_.isString(options.filter)) {
    throw new TypeError('options.filter must be an Array, a Function of a String');
  } else if (!_.isUndefined(options.includeInvalid) &&
    !_.isBoolean(options.includeInvalid)) {
    throw new TypeError('options.includeInvalid must be a Boolean');
  } else if (!_.isUndefined(options.location) &&
    !_.isString(options.location)) {
    throw new TypeError('options.location must be a String');
  } else if (!_.isUndefined(options.refPreProcessor) &&
    !_.isFunction(options.refPreProcessor)) {
    throw new TypeError('options.refPreProcessor must be a Function');
  } else if (!_.isUndefined(options.refPostProcessor) &&
    !_.isFunction(options.refPostProcessor)) {
    throw new TypeError('options.refPostProcessor must be a Function');
  } else if (!_.isUndefined(options.subDocPath) &&
    !_.isArray(options.subDocPath) &&
    !isPtr(options.subDocPath)) {
    // If a pointer is provided, throw an error if it's not the proper type
    throw new TypeError('options.subDocPath must be an Array of path segments or a valid JSON Pointer');
  }

  // Default to false for allowing circulars
  if (_.isUndefined(options.resolveCirculars)) {
    options.resolveCirculars = false;
  }

  options.filter = makeRefFilter(options);

  // options.location is not officially supported yet but will be when Issue 88 is complete
  if (_.isUndefined(options.location)) {
    options.location = makeAbsolute('./root.json', options);
  }

  locationParts = options.location.split('#');

  // If options.location contains a fragment, turn it into an options.subDocPath
  if (locationParts.length > 1) {
    options.subDocPath = '#' + locationParts[1];
  }

  // Just to be safe, remove any accidental fragment as it would break things
  options.location = combineURIs(options.location, undefined);

  // Set the subDocPath to avoid everyone else having to compute it
  options.subDocPath = makeSubDocPath(options);

  if (!_.isUndefined(obj)) {
    try {
      findValue(obj, options.subDocPath);
    } catch (err) {
      err.message = err.message.replace('JSON Pointer', 'options.subDocPath');

      throw err;
    }
  }

  return options;
}
