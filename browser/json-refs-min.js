(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.JsonRefs = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";var _={cloneDeep:require("lodash-compat/lang/cloneDeep"),each:require("lodash-compat/collection/each"),indexOf:require("lodash-compat/array/indexOf"),isArray:require("lodash-compat/lang/isArray"),isFunction:require("lodash-compat/lang/isFunction"),isPlainObject:require("lodash-compat/lang/isPlainObject"),isString:require("lodash-compat/lang/isString"),isUndefined:require("lodash-compat/lang/isUndefined"),map:require("lodash-compat/collection/map")},request=require("superagent"),traverse=window.traverse,remoteCache={},supportedSchemes=["http","https"],getRemoteJson=function(e,r,t){var n,i,o=e.split("#")[0],s=remoteCache[o];_.isUndefined(s)?(i=request.get(e).set("user-agent","whitlockjc/json-refs"),_.isUndefined(r.prepareRequest)||r.prepareRequest(i,e),i.buffer().end(function(i,a){if(i)n=i;else if(a.error)n=a.error;else if(_.isUndefined(r.processContent))try{s=JSON.parse(a.text)}catch(c){n=c}else try{s=r.processContent(a.text,e,a)}catch(c){n=c}remoteCache[o]=s,t(n,s)})):t(n,s)};module.exports.clearCache=function(){remoteCache={}};var isJsonReference=module.exports.isJsonReference=function(e){return _.isPlainObject(e)&&_.isString(e.$ref)},pathToPointer=module.exports.pathToPointer=function(e){if(_.isUndefined(e))throw new Error("path is required");if(!_.isArray(e))throw new Error("path must be an array");var r="#";return e.length>0&&(r+="/"+_.map(e,function(e){return e.replace(/~/g,"~0").replace(/\//g,"~1")}).join("/")),r},findRefs=module.exports.findRefs=function(e){if(_.isUndefined(e))throw new Error("json is required");if(!_.isPlainObject(e))throw new Error("json must be an object");return traverse(e).reduce(function(e){var r=this.node;return"$ref"===this.key&&isJsonReference(this.parent.node)&&(e[pathToPointer(this.path)]=r),e},{})},isRemotePointer=module.exports.isRemotePointer=function(e){if(_.isUndefined(e))throw new Error("ptr is required");if(!_.isString(e))throw new Error("ptr must be a string");return"#"!==e.charAt(0)},pathFromPointer=module.exports.pathFromPointer=function(e){if(_.isUndefined(e))throw new Error("ptr is required");if(!_.isString(e))throw new Error("ptr must be a string");var r=[];return isRemotePointer(e)?r=e:"#"===e.charAt(0)&&"#"!==e&&(r=_.map(e.substring(1).split("/"),function(e){return e.replace(/~0/g,"~").replace(/~1/g,"/")}),r.length>1&&r.shift()),r},resolveRefs=module.exports.resolveRefs=function e(r,t,n){if(arguments.length<3&&(n=arguments[1],t={}),_.isUndefined(r))throw new Error("json is required");if(!_.isPlainObject(r))throw new Error("json must be an object");if(!_.isPlainObject(t))throw new Error("options must be an object");if(_.isUndefined(n))throw new Error("done is required");if(!_.isFunction(n))throw new Error("done must be a function");if(!_.isUndefined(t.prepareRequest)&&!_.isFunction(t.prepareRequest))throw new Error("options.prepareRequest must be a function");if(!_.isUndefined(t.processContent)&&!_.isFunction(t.processContent))throw new Error("options.processContent must be a function");var i,o=!1,s=findRefs(r),a=function(e){return e.map(function(){this.circular&&this.update(traverse(this.node).map(function(){this.circular&&this.parent.remove()}))})},c={};if(Object.keys(s).length>0){i=traverse(_.cloneDeep(r));var u=function(e,r,t,n){var i,o,s,a={ref:t},u=!1;t=-1===t.indexOf("#")?"#":t.substring(t.indexOf("#")),o=pathFromPointer(n),i=o.slice(0,o.length-1),0===i.length?(u=!_.isUndefined(r.value),s=r.value,e.value=s):(u=!r.has(pathFromPointer(t)),s=r.get(pathFromPointer(t)),e.set(i,s)),u||(a.value=s),c[n]=a},f={};_.each(s,function(e,r){isRemotePointer(e)?(o=!0,f[r]=e):u(i,i,e,r)}),_.each(f,function(r,o){var s=r.split(":")[0],p=!0;return"."===r.charAt(0)?(n(new Error("Relative remote references are not yet supported")),!1):-1===_.indexOf(supportedSchemes,s)?(n(new Error("Unsupported remote reference scheme: "+s)),!1):(getRemoteJson(r,t,function(s,d){s?n(s):e(d,t,function(e,t){delete f[o],e?(n(e),p=!1):(u(i,traverse(t),r,o),Object.keys(f).length||n(void 0,a(i),c))})}),p)}),o||n(void 0,a(i),c)}else n(void 0,r,c)};
},{"lodash-compat/array/indexOf":2,"lodash-compat/collection/each":3,"lodash-compat/collection/map":5,"lodash-compat/lang/cloneDeep":48,"lodash-compat/lang/isArray":50,"lodash-compat/lang/isFunction":51,"lodash-compat/lang/isPlainObject":54,"lodash-compat/lang/isString":55,"lodash-compat/lang/isUndefined":57,"superagent":64}],2:[function(require,module,exports){
function indexOf(e,n,r){var a=e?e.length:0;if(!a)return-1;if("number"==typeof r)r=0>r?nativeMax(a+r,0):r;else if(r){var i=binaryIndex(e,n),t=e[i];return(n===n?n===t:t!==t)?i:-1}return baseIndexOf(e,n,r||0)}var baseIndexOf=require("../internal/baseIndexOf"),binaryIndex=require("../internal/binaryIndex"),nativeMax=Math.max;module.exports=indexOf;


},{"../internal/baseIndexOf":16,"../internal/binaryIndex":27}],3:[function(require,module,exports){
module.exports=require("./forEach");


},{"./forEach":4}],4:[function(require,module,exports){
function forEach(a,r,e){return"function"==typeof r&&"undefined"==typeof e&&isArray(a)?arrayEach(a,r):baseEach(a,bindCallback(r,e,3))}var arrayEach=require("../internal/arrayEach"),baseEach=require("../internal/baseEach"),bindCallback=require("../internal/bindCallback"),isArray=require("../lang/isArray");module.exports=forEach;


},{"../internal/arrayEach":7,"../internal/baseEach":12,"../internal/bindCallback":29,"../lang/isArray":50}],5:[function(require,module,exports){
function map(a,r,e){var i=isArray(a)?arrayMap:baseMap;return r=baseCallback(r,e,3),i(a,r)}var arrayMap=require("../internal/arrayMap"),baseCallback=require("../internal/baseCallback"),baseMap=require("../internal/baseMap"),isArray=require("../lang/isArray");module.exports=map;


},{"../internal/arrayMap":8,"../internal/baseCallback":9,"../internal/baseMap":21,"../lang/isArray":50}],6:[function(require,module,exports){
function arrayCopy(r,a){var o=-1,y=r.length;for(a||(a=Array(y));++o<y;)a[o]=r[o];return a}module.exports=arrayCopy;


},{}],7:[function(require,module,exports){
function arrayEach(r,a){for(var e=-1,n=r.length;++e<n&&a(r[e],e,r)!==!1;);return r}module.exports=arrayEach;


},{}],8:[function(require,module,exports){
function arrayMap(r,a){for(var e=-1,n=r.length,o=Array(n);++e<n;)o[e]=a(r[e],e,r);return o}module.exports=arrayMap;


},{}],9:[function(require,module,exports){
function baseCallback(e,a,r){var t=typeof e;return"function"==t?"undefined"!=typeof a&&isBindable(e)?bindCallback(e,a,r):e:null==e?identity:"object"==t?baseMatches(e):"undefined"==typeof a?baseProperty(e+""):baseMatchesProperty(e+"",a)}var baseMatches=require("./baseMatches"),baseMatchesProperty=require("./baseMatchesProperty"),baseProperty=require("./baseProperty"),bindCallback=require("./bindCallback"),identity=require("../utility/identity"),isBindable=require("./isBindable");module.exports=baseCallback;


},{"../utility/identity":63,"./baseMatches":22,"./baseMatchesProperty":23,"./baseProperty":24,"./bindCallback":29,"./isBindable":38}],10:[function(require,module,exports){
function baseClone(a,e,r,o,t,n,g){var b;if(r&&(b=t?r(a,o,t):r(a)),"undefined"!=typeof b)return b;if(!isObject(a))return a;var l=isArray(a);if(l){if(b=initCloneArray(a),!e)return arrayCopy(a,b)}else{var T=objToString.call(a),c=T==funcTag;if(T!=objectTag&&T!=argsTag&&(!c||t))return cloneableTags[T]?initCloneByTag(a,T,e):t?a:{};if(isHostObject(a))return t?a:{};if(b=initCloneObject(c?{}:a),!e)return baseCopy(a,b,keys(a))}n||(n=[]),g||(g=[]);for(var i=n.length;i--;)if(n[i]==a)return g[i];return n.push(a),g.push(b),(l?arrayEach:baseForOwn)(a,function(o,t){b[t]=baseClone(o,e,r,t,a,n,g)}),b}var arrayCopy=require("./arrayCopy"),arrayEach=require("./arrayEach"),baseCopy=require("./baseCopy"),baseForOwn=require("./baseForOwn"),initCloneArray=require("./initCloneArray"),initCloneByTag=require("./initCloneByTag"),initCloneObject=require("./initCloneObject"),isArray=require("../lang/isArray"),isHostObject=require("./isHostObject"),isObject=require("../lang/isObject"),keys=require("../object/keys"),argsTag="[object Arguments]",arrayTag="[object Array]",boolTag="[object Boolean]",dateTag="[object Date]",errorTag="[object Error]",funcTag="[object Function]",mapTag="[object Map]",numberTag="[object Number]",objectTag="[object Object]",regexpTag="[object RegExp]",setTag="[object Set]",stringTag="[object String]",weakMapTag="[object WeakMap]",arrayBufferTag="[object ArrayBuffer]",float32Tag="[object Float32Array]",float64Tag="[object Float64Array]",int8Tag="[object Int8Array]",int16Tag="[object Int16Array]",int32Tag="[object Int32Array]",uint8Tag="[object Uint8Array]",uint8ClampedTag="[object Uint8ClampedArray]",uint16Tag="[object Uint16Array]",uint32Tag="[object Uint32Array]",cloneableTags={};cloneableTags[argsTag]=cloneableTags[arrayTag]=cloneableTags[arrayBufferTag]=cloneableTags[boolTag]=cloneableTags[dateTag]=cloneableTags[float32Tag]=cloneableTags[float64Tag]=cloneableTags[int8Tag]=cloneableTags[int16Tag]=cloneableTags[int32Tag]=cloneableTags[numberTag]=cloneableTags[objectTag]=cloneableTags[regexpTag]=cloneableTags[stringTag]=cloneableTags[uint8Tag]=cloneableTags[uint8ClampedTag]=cloneableTags[uint16Tag]=cloneableTags[uint32Tag]=!0,cloneableTags[errorTag]=cloneableTags[funcTag]=cloneableTags[mapTag]=cloneableTags[setTag]=cloneableTags[weakMapTag]=!1;var objectProto=Object.prototype,objToString=objectProto.toString;module.exports=baseClone;


},{"../lang/isArray":50,"../lang/isObject":53,"../object/keys":58,"./arrayCopy":6,"./arrayEach":7,"./baseCopy":11,"./baseForOwn":15,"./initCloneArray":35,"./initCloneByTag":36,"./initCloneObject":37,"./isHostObject":39}],11:[function(require,module,exports){
function baseCopy(e,o,r){r||(r=o,o={});for(var a=-1,n=r.length;++a<n;){var t=r[a];o[t]=e[t]}return o}module.exports=baseCopy;


},{}],12:[function(require,module,exports){
function baseEach(e,r){var t=e?e.length:0;if(!isLength(t))return baseForOwn(e,r);for(var n=-1,a=toObject(e);++n<t&&r(a[n],n,a)!==!1;);return e}var baseForOwn=require("./baseForOwn"),isLength=require("./isLength"),toObject=require("./toObject");module.exports=baseEach;


},{"./baseForOwn":15,"./isLength":41,"./toObject":47}],13:[function(require,module,exports){
function baseFor(e,r,t){for(var o=-1,a=toObject(e),b=t(e),c=b.length;++o<c;){var n=b[o];if(r(a[n],n,a)===!1)break}return e}var toObject=require("./toObject");module.exports=baseFor;


},{"./toObject":47}],14:[function(require,module,exports){
function baseForIn(e,r){return baseFor(e,r,keysIn)}var baseFor=require("./baseFor"),keysIn=require("../object/keysIn");module.exports=baseForIn;


},{"../object/keysIn":59,"./baseFor":13}],15:[function(require,module,exports){
function baseForOwn(e,r){return baseFor(e,r,keys)}var baseFor=require("./baseFor"),keys=require("../object/keys");module.exports=baseForOwn;


},{"../object/keys":58,"./baseFor":13}],16:[function(require,module,exports){
function baseIndexOf(e,r,n){if(r!==r)return indexOfNaN(e,n);for(var f=n-1,a=e.length;++f<a;)if(e[f]===r)return f;return-1}var indexOfNaN=require("./indexOfNaN");module.exports=baseIndexOf;


},{"./indexOfNaN":34}],17:[function(require,module,exports){
function baseIsEqual(e,u,a,s,l,n){if(e===u)return 0!==e||1/e==1/u;var t=typeof e,o=typeof u;return"function"!=t&&"object"!=t&&"function"!=o&&"object"!=o||null==e||null==u?e!==e&&u!==u:baseIsEqualDeep(e,u,baseIsEqual,a,s,l,n)}var baseIsEqualDeep=require("./baseIsEqualDeep");module.exports=baseIsEqual;


},{"./baseIsEqualDeep":18}],18:[function(require,module,exports){
function baseIsEqualDeep(r,e,a,t,o,s,u){var b=isArray(r),c=isArray(e),g=arrayTag,i=arrayTag;b||(g=objToString.call(r),g==argsTag?g=objectTag:g!=objectTag&&(b=isTypedArray(r))),c||(i=objToString.call(e),i==argsTag?i=objectTag:i!=objectTag&&(c=isTypedArray(e)));var y=g==objectTag&&!isHostObject(r),j=i==objectTag&&!isHostObject(e),l=g==i;if(l&&!b&&!y)return equalByTag(r,e,g);var p=y&&hasOwnProperty.call(r,"__wrapped__"),T=j&&hasOwnProperty.call(e,"__wrapped__");if(p||T)return a(p?r.value():r,T?e.value():e,t,o,s,u);if(!l)return!1;s||(s=[]),u||(u=[]);for(var n=s.length;n--;)if(s[n]==r)return u[n]==e;s.push(r),u.push(e);var q=(b?equalArrays:equalObjects)(r,e,a,t,o,s,u);return s.pop(),u.pop(),q}var equalArrays=require("./equalArrays"),equalByTag=require("./equalByTag"),equalObjects=require("./equalObjects"),isArray=require("../lang/isArray"),isHostObject=require("./isHostObject"),isTypedArray=require("../lang/isTypedArray"),argsTag="[object Arguments]",arrayTag="[object Array]",objectTag="[object Object]",objectProto=Object.prototype,hasOwnProperty=objectProto.hasOwnProperty,objToString=objectProto.toString;module.exports=baseIsEqualDeep;


},{"../lang/isArray":50,"../lang/isTypedArray":56,"./equalArrays":31,"./equalByTag":32,"./equalObjects":33,"./isHostObject":39}],19:[function(require,module,exports){
function baseIsFunction(n){return"function"==typeof n||!1}module.exports=baseIsFunction;


},{}],20:[function(require,module,exports){
function baseIsMatch(r,e,a,t,o){var s=e.length;if(null==r)return!s;for(var n=-1,l=!o;++n<s;)if(l&&t[n]?a[n]!==r[e[n]]:!hasOwnProperty.call(r,e[n]))return!1;for(n=-1;++n<s;){var u=e[n];if(l&&t[n])var f=hasOwnProperty.call(r,u);else{var b=r[u],c=a[n];f=o?o(b,c,u):void 0,"undefined"==typeof f&&(f=baseIsEqual(c,b,o,!0))}if(!f)return!1}return!0}var baseIsEqual=require("./baseIsEqual"),objectProto=Object.prototype,hasOwnProperty=objectProto.hasOwnProperty;module.exports=baseIsMatch;


},{"./baseIsEqual":17}],21:[function(require,module,exports){
function baseMap(a,e){var r=[];return baseEach(a,function(a,s,u){r.push(e(a,s,u))}),r}var baseEach=require("./baseEach");module.exports=baseMap;


},{"./baseEach":12}],22:[function(require,module,exports){
function baseMatches(r){var e=keys(r),t=e.length;if(1==t){var a=e[0],o=r[a];if(isStrictComparable(o))return function(r){return null!=r&&r[a]===o&&hasOwnProperty.call(r,a)}}for(var s=Array(t),c=Array(t);t--;)o=r[e[t]],s[t]=o,c[t]=isStrictComparable(o);return function(r){return baseIsMatch(r,e,s,c)}}var baseIsMatch=require("./baseIsMatch"),isStrictComparable=require("./isStrictComparable"),keys=require("../object/keys"),objectProto=Object.prototype,hasOwnProperty=objectProto.hasOwnProperty;module.exports=baseMatches;


},{"../object/keys":58,"./baseIsMatch":20,"./isStrictComparable":43}],23:[function(require,module,exports){
function baseMatchesProperty(r,e){return isStrictComparable(e)?function(a){return null!=a&&a[r]===e}:function(a){return null!=a&&baseIsEqual(e,a[r],null,!0)}}var baseIsEqual=require("./baseIsEqual"),isStrictComparable=require("./isStrictComparable");module.exports=baseMatchesProperty;


},{"./baseIsEqual":17,"./isStrictComparable":43}],24:[function(require,module,exports){
function baseProperty(r){return function(e){return null==e?void 0:e[r]}}module.exports=baseProperty;


},{}],25:[function(require,module,exports){
var identity=require("../utility/identity"),metaMap=require("./metaMap"),baseSetData=metaMap?function(t,e){return metaMap.set(t,e),t}:identity;module.exports=baseSetData;


},{"../utility/identity":63,"./metaMap":44}],26:[function(require,module,exports){
function baseToString(n){return"string"==typeof n?n:null==n?"":n+""}module.exports=baseToString;


},{}],27:[function(require,module,exports){
function binaryIndex(e,n,r){var i=0,t=e?e.length:i;if("number"==typeof n&&n===n&&HALF_MAX_ARRAY_LENGTH>=t){for(;t>i;){var A=i+t>>>1,y=e[A];(r?n>=y:n>y)?i=A+1:t=A}return t}return binaryIndexBy(e,n,identity,r)}var binaryIndexBy=require("./binaryIndexBy"),identity=require("../utility/identity"),MAX_ARRAY_LENGTH=Math.pow(2,32)-1,HALF_MAX_ARRAY_LENGTH=MAX_ARRAY_LENGTH>>>1;module.exports=binaryIndex;


},{"../utility/identity":63,"./binaryIndexBy":28}],28:[function(require,module,exports){
function binaryIndexBy(n,e,o,r){e=o(e);for(var A=0,a=n?n.length:0,i=e!==e,t="undefined"==typeof e;a>A;){var f=floor((A+a)/2),M=o(n[f]),R=M===M;if(i)var _=R||r;else _=t?R&&(r||"undefined"!=typeof M):r?e>=M:e>M;_?A=f+1:a=f}return nativeMin(a,MAX_ARRAY_INDEX)}var floor=Math.floor,nativeMin=Math.min,MAX_ARRAY_LENGTH=Math.pow(2,32)-1,MAX_ARRAY_INDEX=MAX_ARRAY_LENGTH-1;module.exports=binaryIndexBy;


},{}],29:[function(require,module,exports){
function bindCallback(n,t,r){if("function"!=typeof n)return identity;if("undefined"==typeof t)return n;switch(r){case 1:return function(r){return n.call(t,r)};case 3:return function(r,e,u){return n.call(t,r,e,u)};case 4:return function(r,e,u,i){return n.call(t,r,e,u,i)};case 5:return function(r,e,u,i,c){return n.call(t,r,e,u,i,c)}}return function(){return n.apply(t,arguments)}}var identity=require("../utility/identity");module.exports=bindCallback;


},{"../utility/identity":63}],30:[function(require,module,exports){
(function (global){
function bufferClone(r){return bufferSlice.call(r,0)}var constant=require("../utility/constant"),isNative=require("../lang/isNative"),ArrayBuffer=isNative(ArrayBuffer=global.ArrayBuffer)&&ArrayBuffer,bufferSlice=isNative(bufferSlice=ArrayBuffer&&new ArrayBuffer(0).slice)&&bufferSlice,floor=Math.floor,Uint8Array=isNative(Uint8Array=global.Uint8Array)&&Uint8Array,Float64Array=function(){try{var r=isNative(r=global.Float64Array)&&r,e=new r(new ArrayBuffer(10),0,1)&&r}catch(a){}return e}(),FLOAT64_BYTES_PER_ELEMENT=Float64Array?Float64Array.BYTES_PER_ELEMENT:0;bufferSlice||(bufferClone=ArrayBuffer&&Uint8Array?function(r){var e=r.byteLength,a=Float64Array?floor(e/FLOAT64_BYTES_PER_ELEMENT):0,t=a*FLOAT64_BYTES_PER_ELEMENT,f=new ArrayBuffer(e);if(a){var n=new Float64Array(f,0,a);n.set(new Float64Array(r,0,a))}return e!=t&&(n=new Uint8Array(f,t),n.set(new Uint8Array(r,t))),f}:constant(null)),module.exports=bufferClone;


}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"../lang/isNative":52,"../utility/constant":62}],31:[function(require,module,exports){
function equalArrays(r,e,f,n,a,o,t){var u=-1,i=r.length,l=e.length,d=!0;if(i!=l&&!(a&&l>i))return!1;for(;d&&++u<i;){var s=r[u],v=e[u];if(d=void 0,n&&(d=a?n(v,s,u):n(s,v,u)),"undefined"==typeof d)if(a)for(var y=l;y--&&(v=e[y],!(d=s&&s===v||f(s,v,n,a,o,t))););else d=s&&s===v||f(s,v,n,a,o,t)}return!!d}module.exports=equalArrays;


},{}],32:[function(require,module,exports){
function equalByTag(e,a,r){switch(r){case boolTag:case dateTag:return+e==+a;case errorTag:return e.name==a.name&&e.message==a.message;case numberTag:return e!=+e?a!=+a:0==e?1/e==1/a:e==+a;case regexpTag:case stringTag:return e==a+""}return!1}var boolTag="[object Boolean]",dateTag="[object Date]",errorTag="[object Error]",numberTag="[object Number]",regexpTag="[object RegExp]",stringTag="[object String]";module.exports=equalByTag;


},{}],33:[function(require,module,exports){
function equalObjects(t,r,o,e,n,c,s){var u=keys(t),f=u.length,i=keys(r),a=i.length;if(f!=a&&!n)return!1;for(var y,p=-1;++p<f;){var l=u[p],v=hasOwnProperty.call(r,l);if(v){var b=t[l],j=r[l];v=void 0,e&&(v=n?e(j,b,l):e(b,j,l)),"undefined"==typeof v&&(v=b&&b===j||o(b,j,e,n,c,s))}if(!v)return!1;y||(y="constructor"==l)}if(!y){var O=t.constructor,h=r.constructor;if(O!=h&&"constructor"in t&&"constructor"in r&&!("function"==typeof O&&O instanceof O&&"function"==typeof h&&h instanceof h))return!1}return!0}var keys=require("../object/keys"),objectProto=Object.prototype,hasOwnProperty=objectProto.hasOwnProperty;module.exports=equalObjects;


},{"../object/keys":58}],34:[function(require,module,exports){
function indexOfNaN(r,e,n){for(var f=r.length,t=e+(n?0:-1);n?t--:++t<f;){var a=r[t];if(a!==a)return t}return-1}module.exports=indexOfNaN;


},{}],35:[function(require,module,exports){
function initCloneArray(t){var r=t.length,n=new t.constructor(r);return r&&"string"==typeof t[0]&&hasOwnProperty.call(t,"index")&&(n.index=t.index,n.input=t.input),n}var objectProto=Object.prototype,hasOwnProperty=objectProto.hasOwnProperty;module.exports=initCloneArray;


},{}],36:[function(require,module,exports){
(function (global){
function initCloneByTag(a,t,r){var e=a.constructor;switch(t){case arrayBufferTag:return bufferClone(a);case boolTag:case dateTag:return new e(+a);case float32Tag:case float64Tag:case int8Tag:case int16Tag:case int32Tag:case uint8Tag:case uint8ClampedTag:case uint16Tag:case uint32Tag:e instanceof e&&(e=ctorByTag[t]);var g=a.buffer;return new e(r?bufferClone(g):g,a.byteOffset,a.length);case numberTag:case stringTag:return new e(a);case regexpTag:var n=new e(a.source,reFlags.exec(a));n.lastIndex=a.lastIndex}return n}var bufferClone=require("./bufferClone"),boolTag="[object Boolean]",dateTag="[object Date]",numberTag="[object Number]",regexpTag="[object RegExp]",stringTag="[object String]",arrayBufferTag="[object ArrayBuffer]",float32Tag="[object Float32Array]",float64Tag="[object Float64Array]",int8Tag="[object Int8Array]",int16Tag="[object Int16Array]",int32Tag="[object Int32Array]",uint8Tag="[object Uint8Array]",uint8ClampedTag="[object Uint8ClampedArray]",uint16Tag="[object Uint16Array]",uint32Tag="[object Uint32Array]",reFlags=/\w*$/,ctorByTag={};ctorByTag[float32Tag]=global.Float32Array,ctorByTag[float64Tag]=global.Float64Array,ctorByTag[int8Tag]=global.Int8Array,ctorByTag[int16Tag]=global.Int16Array,ctorByTag[int32Tag]=global.Int32Array,ctorByTag[uint8Tag]=global.Uint8Array,ctorByTag[uint8ClampedTag]=global.Uint8ClampedArray,ctorByTag[uint16Tag]=global.Uint16Array,ctorByTag[uint32Tag]=global.Uint32Array,module.exports=initCloneByTag;


}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./bufferClone":30}],37:[function(require,module,exports){
function initCloneObject(n){var t=n.constructor;return"function"==typeof t&&t instanceof t||(t=Object),new t}module.exports=initCloneObject;


},{}],38:[function(require,module,exports){
function isBindable(e){var t=!(support.funcNames?e.name:support.funcDecomp);if(!t){var r=fnToString.call(e);support.funcNames||(t=!reFuncName.test(r)),t||(t=reThis.test(r)||isNative(e),baseSetData(e,t))}return t}var baseSetData=require("./baseSetData"),isNative=require("../lang/isNative"),support=require("../support"),reFuncName=/^\s*function[ \n\r\t]+\w/,reThis=/\bthis\b/,fnToString=Function.prototype.toString;module.exports=isBindable;


},{"../lang/isNative":52,"../support":61,"./baseSetData":25}],39:[function(require,module,exports){
var isHostObject=function(){try{Object({toString:0}+"")}catch(t){return function(){return!1}}return function(t){return"function"!=typeof t.toString&&"string"==typeof(t+"")}}();module.exports=isHostObject;


},{}],40:[function(require,module,exports){
function isIndex(n,E){return n=+n,E=null==E?MAX_SAFE_INTEGER:E,n>-1&&n%1==0&&E>n}var MAX_SAFE_INTEGER=Math.pow(2,53)-1;module.exports=isIndex;


},{}],41:[function(require,module,exports){
function isLength(e){return"number"==typeof e&&e>-1&&e%1==0&&MAX_SAFE_INTEGER>=e}var MAX_SAFE_INTEGER=Math.pow(2,53)-1;module.exports=isLength;


},{}],42:[function(require,module,exports){
function isObjectLike(e){return e&&"object"==typeof e||!1}module.exports=isObjectLike;


},{}],43:[function(require,module,exports){
function isStrictComparable(e){return e===e&&(0===e?1/e>0:!isObject(e))}var isObject=require("../lang/isObject");module.exports=isStrictComparable;


},{"../lang/isObject":53}],44:[function(require,module,exports){
(function (global){
var isNative=require("../lang/isNative"),WeakMap=isNative(WeakMap=global.WeakMap)&&WeakMap,metaMap=WeakMap&&new WeakMap;module.exports=metaMap;


}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"../lang/isNative":52}],45:[function(require,module,exports){
function shimIsPlainObject(t){var r;if(!isObjectLike(t)||objToString.call(t)!=objectTag||isHostObject(t)||!hasOwnProperty.call(t,"constructor")&&(r=t.constructor,"function"==typeof r&&!(r instanceof r))||!support.argsTag&&isArguments(t))return!1;var e;return support.ownLast?(baseForIn(t,function(t,r,o){return e=hasOwnProperty.call(o,r),!1}),e!==!1):(baseForIn(t,function(t,r){e=r}),"undefined"==typeof e||hasOwnProperty.call(t,e))}var baseForIn=require("./baseForIn"),isArguments=require("../lang/isArguments"),isHostObject=require("./isHostObject"),isObjectLike=require("./isObjectLike"),support=require("../support"),objectTag="[object Object]",objectProto=Object.prototype,hasOwnProperty=objectProto.hasOwnProperty,objToString=objectProto.toString;module.exports=shimIsPlainObject;


},{"../lang/isArguments":49,"../support":61,"./baseForIn":14,"./isHostObject":39,"./isObjectLike":42}],46:[function(require,module,exports){
function shimKeys(r){for(var e=keysIn(r),s=e.length,n=s&&r.length,t=n&&isLength(n)&&(isArray(r)||support.nonEnumStrings&&isString(r)||support.nonEnumArgs&&isArguments(r)),i=-1,o=[];++i<s;){var u=e[i];(t&&isIndex(u,n)||hasOwnProperty.call(r,u))&&o.push(u)}return o}var isArguments=require("../lang/isArguments"),isArray=require("../lang/isArray"),isIndex=require("./isIndex"),isLength=require("./isLength"),isString=require("../lang/isString"),keysIn=require("../object/keysIn"),support=require("../support"),objectProto=Object.prototype,hasOwnProperty=objectProto.hasOwnProperty;module.exports=shimKeys;


},{"../lang/isArguments":49,"../lang/isArray":50,"../lang/isString":55,"../object/keysIn":59,"../support":61,"./isIndex":40,"./isLength":41}],47:[function(require,module,exports){
function toObject(r){if(support.unindexedChars&&isString(r)){for(var t=-1,e=r.length,i=Object(r);++t<e;)i[t]=r.charAt(t);return i}return isObject(r)?r:Object(r)}var isObject=require("../lang/isObject"),isString=require("../lang/isString"),support=require("../support");module.exports=toObject;


},{"../lang/isObject":53,"../lang/isString":55,"../support":61}],48:[function(require,module,exports){
function cloneDeep(e,n,l){return n="function"==typeof n&&bindCallback(n,l,1),baseClone(e,!0,n)}var baseClone=require("../internal/baseClone"),bindCallback=require("../internal/bindCallback");module.exports=cloneDeep;


},{"../internal/baseClone":10,"../internal/bindCallback":29}],49:[function(require,module,exports){
function isArguments(e){var r=isObjectLike(e)?e.length:void 0;return isLength(r)&&objToString.call(e)==argsTag||!1}var isLength=require("../internal/isLength"),isObjectLike=require("../internal/isObjectLike"),support=require("../support"),argsTag="[object Arguments]",objectProto=Object.prototype,hasOwnProperty=objectProto.hasOwnProperty,objToString=objectProto.toString,propertyIsEnumerable=objectProto.propertyIsEnumerable;support.argsTag||(isArguments=function(e){var r=isObjectLike(e)?e.length:void 0;return isLength(r)&&hasOwnProperty.call(e,"callee")&&!propertyIsEnumerable.call(e,"callee")||!1}),module.exports=isArguments;


},{"../internal/isLength":41,"../internal/isObjectLike":42,"../support":61}],50:[function(require,module,exports){
var isLength=require("../internal/isLength"),isNative=require("./isNative"),isObjectLike=require("../internal/isObjectLike"),arrayTag="[object Array]",objectProto=Object.prototype,objToString=objectProto.toString,nativeIsArray=isNative(nativeIsArray=Array.isArray)&&nativeIsArray,isArray=nativeIsArray||function(r){return isObjectLike(r)&&isLength(r.length)&&objToString.call(r)==arrayTag||!1};module.exports=isArray;


},{"../internal/isLength":41,"../internal/isObjectLike":42,"./isNative":52}],51:[function(require,module,exports){
(function (global){
var baseIsFunction=require("../internal/baseIsFunction"),isNative=require("./isNative"),funcTag="[object Function]",objectProto=Object.prototype,objToString=objectProto.toString,Uint8Array=isNative(Uint8Array=global.Uint8Array)&&Uint8Array,isFunction=baseIsFunction(/x/)||Uint8Array&&!baseIsFunction(Uint8Array)?function(t){return objToString.call(t)==funcTag}:baseIsFunction;module.exports=isFunction;


}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"../internal/baseIsFunction":19,"./isNative":52}],52:[function(require,module,exports){
function isNative(t){return null==t?!1:objToString.call(t)==funcTag?reNative.test(fnToString.call(t)):isObjectLike(t)&&(isHostObject(t)?reNative:reHostCtor).test(t)||!1}var escapeRegExp=require("../string/escapeRegExp"),isHostObject=require("../internal/isHostObject"),isObjectLike=require("../internal/isObjectLike"),funcTag="[object Function]",reHostCtor=/^\[object .+?Constructor\]$/,objectProto=Object.prototype,fnToString=Function.prototype.toString,objToString=objectProto.toString,reNative=RegExp("^"+escapeRegExp(objToString).replace(/toString|(function).*?(?=\\\()| for .+?(?=\\\])/g,"$1.*?")+"$");module.exports=isNative;


},{"../internal/isHostObject":39,"../internal/isObjectLike":42,"../string/escapeRegExp":60}],53:[function(require,module,exports){
function isObject(t){var e=typeof t;return"function"==e||t&&"object"==e||!1}module.exports=isObject;


},{}],54:[function(require,module,exports){
var isArguments=require("./isArguments"),isNative=require("./isNative"),shimIsPlainObject=require("../internal/shimIsPlainObject"),support=require("../support"),objectTag="[object Object]",objectProto=Object.prototype,objToString=objectProto.toString,getPrototypeOf=isNative(getPrototypeOf=Object.getPrototypeOf)&&getPrototypeOf,isPlainObject=getPrototypeOf?function(t){if(!t||objToString.call(t)!=objectTag||!support.argsTag&&isArguments(t))return!1;var e=t.valueOf,o=isNative(e)&&(o=getPrototypeOf(e))&&getPrototypeOf(o);return o?t==o||getPrototypeOf(t)==o:shimIsPlainObject(t)}:shimIsPlainObject;module.exports=isPlainObject;


},{"../internal/shimIsPlainObject":45,"../support":61,"./isArguments":49,"./isNative":52}],55:[function(require,module,exports){
function isString(t){return"string"==typeof t||isObjectLike(t)&&objToString.call(t)==stringTag||!1}var isObjectLike=require("../internal/isObjectLike"),stringTag="[object String]",objectProto=Object.prototype,objToString=objectProto.toString;module.exports=isString;


},{"../internal/isObjectLike":42}],56:[function(require,module,exports){
function isTypedArray(a){return isObjectLike(a)&&isLength(a.length)&&typedArrayTags[objToString.call(a)]||!1}var isLength=require("../internal/isLength"),isObjectLike=require("../internal/isObjectLike"),argsTag="[object Arguments]",arrayTag="[object Array]",boolTag="[object Boolean]",dateTag="[object Date]",errorTag="[object Error]",funcTag="[object Function]",mapTag="[object Map]",numberTag="[object Number]",objectTag="[object Object]",regexpTag="[object RegExp]",setTag="[object Set]",stringTag="[object String]",weakMapTag="[object WeakMap]",arrayBufferTag="[object ArrayBuffer]",float32Tag="[object Float32Array]",float64Tag="[object Float64Array]",int8Tag="[object Int8Array]",int16Tag="[object Int16Array]",int32Tag="[object Int32Array]",uint8Tag="[object Uint8Array]",uint8ClampedTag="[object Uint8ClampedArray]",uint16Tag="[object Uint16Array]",uint32Tag="[object Uint32Array]",typedArrayTags={};typedArrayTags[float32Tag]=typedArrayTags[float64Tag]=typedArrayTags[int8Tag]=typedArrayTags[int16Tag]=typedArrayTags[int32Tag]=typedArrayTags[uint8Tag]=typedArrayTags[uint8ClampedTag]=typedArrayTags[uint16Tag]=typedArrayTags[uint32Tag]=!0,typedArrayTags[argsTag]=typedArrayTags[arrayTag]=typedArrayTags[arrayBufferTag]=typedArrayTags[boolTag]=typedArrayTags[dateTag]=typedArrayTags[errorTag]=typedArrayTags[funcTag]=typedArrayTags[mapTag]=typedArrayTags[numberTag]=typedArrayTags[objectTag]=typedArrayTags[regexpTag]=typedArrayTags[setTag]=typedArrayTags[stringTag]=typedArrayTags[weakMapTag]=!1;var objectProto=Object.prototype,objToString=objectProto.toString;module.exports=isTypedArray;


},{"../internal/isLength":41,"../internal/isObjectLike":42}],57:[function(require,module,exports){
function isUndefined(e){return"undefined"==typeof e}module.exports=isUndefined;


},{}],58:[function(require,module,exports){
var isLength=require("../internal/isLength"),isNative=require("../lang/isNative"),isObject=require("../lang/isObject"),shimKeys=require("../internal/shimKeys"),support=require("../support"),nativeKeys=isNative(nativeKeys=Object.keys)&&nativeKeys,keys=nativeKeys?function(e){if(e)var t=e.constructor,i=e.length;return"function"==typeof t&&t.prototype===e||("function"==typeof e?support.enumPrototypes:i&&isLength(i))?shimKeys(e):isObject(e)?nativeKeys(e):[]}:shimKeys;module.exports=keys;


},{"../internal/isLength":41,"../internal/shimKeys":46,"../lang/isNative":52,"../lang/isObject":53,"../support":61}],59:[function(require,module,exports){
function keysIn(r){if(null==r)return[];isObject(r)||(r=Object(r));var o=r.length;o=o&&isLength(o)&&(isArray(r)||support.nonEnumStrings&&isString(r)||support.nonEnumArgs&&isArguments(r))&&o||0;for(var n=r.constructor,t=-1,e=isFunction(n)&&n.prototype||objectProto,s=e===r,a=Array(o),i=o>0,u=support.enumErrorProps&&(r===errorProto||r instanceof Error),p=support.enumPrototypes&&isFunction(r);++t<o;)a[t]=t+"";for(var g in r)p&&"prototype"==g||u&&("message"==g||"name"==g)||i&&isIndex(g,o)||"constructor"==g&&(s||!hasOwnProperty.call(r,g))||a.push(g);if(support.nonEnumShadows&&r!==objectProto){var c=r===stringProto?stringTag:r===errorProto?errorTag:objToString.call(r),P=nonEnumProps[c]||nonEnumProps[objectTag];for(c==objectTag&&(e=objectProto),o=shadowProps.length;o--;){g=shadowProps[o];var b=P[g];s&&b||(b?!hasOwnProperty.call(r,g):r[g]===e[g])||a.push(g)}}return a}var arrayEach=require("../internal/arrayEach"),isArguments=require("../lang/isArguments"),isArray=require("../lang/isArray"),isFunction=require("../lang/isFunction"),isIndex=require("../internal/isIndex"),isLength=require("../internal/isLength"),isObject=require("../lang/isObject"),isString=require("../lang/isString"),support=require("../support"),arrayTag="[object Array]",boolTag="[object Boolean]",dateTag="[object Date]",errorTag="[object Error]",funcTag="[object Function]",numberTag="[object Number]",objectTag="[object Object]",regexpTag="[object RegExp]",stringTag="[object String]",shadowProps=["constructor","hasOwnProperty","isPrototypeOf","propertyIsEnumerable","toLocaleString","toString","valueOf"],errorProto=Error.prototype,objectProto=Object.prototype,stringProto=String.prototype,hasOwnProperty=objectProto.hasOwnProperty,objToString=objectProto.toString,nonEnumProps={};nonEnumProps[arrayTag]=nonEnumProps[dateTag]=nonEnumProps[numberTag]={constructor:!0,toLocaleString:!0,toString:!0,valueOf:!0},nonEnumProps[boolTag]=nonEnumProps[stringTag]={constructor:!0,toString:!0,valueOf:!0},nonEnumProps[errorTag]=nonEnumProps[funcTag]=nonEnumProps[regexpTag]={constructor:!0,toString:!0},nonEnumProps[objectTag]={constructor:!0},arrayEach(shadowProps,function(r){for(var o in nonEnumProps)if(hasOwnProperty.call(nonEnumProps,o)){var n=nonEnumProps[o];n[r]=hasOwnProperty.call(n,r)}}),module.exports=keysIn;


},{"../internal/arrayEach":7,"../internal/isIndex":40,"../internal/isLength":41,"../lang/isArguments":49,"../lang/isArray":50,"../lang/isFunction":51,"../lang/isObject":53,"../lang/isString":55,"../support":61}],60:[function(require,module,exports){
function escapeRegExp(e){return e=baseToString(e),e&&reHasRegExpChars.test(e)?e.replace(reRegExpChars,"\\$&"):e}var baseToString=require("../internal/baseToString"),reRegExpChars=/[.*+?^${}()|[\]\/\\]/g,reHasRegExpChars=RegExp(reRegExpChars.source);module.exports=escapeRegExp;


},{"../internal/baseToString":26}],61:[function(require,module,exports){
(function (global){
var isNative=require("./lang/isNative"),argsTag="[object Arguments]",objectTag="[object Object]",reThis=/\bthis\b/,arrayProto=Array.prototype,errorProto=Error.prototype,objectProto=Object.prototype,document=(document=global.window)&&document.document,objToString=objectProto.toString,propertyIsEnumerable=objectProto.propertyIsEnumerable,splice=arrayProto.splice,support={};!function(){var r=function(){this.x=1},o={0:1,length:1},t=[];r.prototype={valueOf:1,y:1};for(var e in new r)t.push(e);support.argsTag=objToString.call(arguments)==argsTag,support.enumErrorProps=propertyIsEnumerable.call(errorProto,"message")||propertyIsEnumerable.call(errorProto,"name"),support.enumPrototypes=propertyIsEnumerable.call(r,"prototype"),support.funcDecomp=!isNative(global.WinRTError)&&reThis.test(function(){return this}),support.funcNames="string"==typeof Function.name,support.nodeTag=objToString.call(document)!=objectTag,support.nonEnumStrings=!propertyIsEnumerable.call("x",0),support.nonEnumShadows=!/valueOf/.test(t),support.ownLast="x"!=t[0],support.spliceObjects=(splice.call(o,0,1),!o[0]),support.unindexedChars="x"[0]+Object("x")[0]!="xx";try{support.dom=11===document.createDocumentFragment().nodeType}catch(p){support.dom=!1}try{support.nonEnumArgs=!propertyIsEnumerable.call(arguments,1)}catch(p){support.nonEnumArgs=!0}}(0,0),module.exports=support;


}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./lang/isNative":52}],62:[function(require,module,exports){
function constant(n){return function(){return n}}module.exports=constant;


},{}],63:[function(require,module,exports){
function identity(t){return t}module.exports=identity;


},{}],64:[function(require,module,exports){
function noop(){}function isHost(t){var e={}.toString.call(t);switch(e){case"[object File]":case"[object Blob]":case"[object FormData]":return!0;default:return!1}}function getXHR(){if(root.XMLHttpRequest&&("file:"!=root.location.protocol||!root.ActiveXObject))return new XMLHttpRequest;try{return new ActiveXObject("Microsoft.XMLHTTP")}catch(t){}try{return new ActiveXObject("Msxml2.XMLHTTP.6.0")}catch(t){}try{return new ActiveXObject("Msxml2.XMLHTTP.3.0")}catch(t){}try{return new ActiveXObject("Msxml2.XMLHTTP")}catch(t){}return!1}function isObject(t){return t===Object(t)}function serialize(t){if(!isObject(t))return t;var e=[];for(var r in t)null!=t[r]&&e.push(encodeURIComponent(r)+"="+encodeURIComponent(t[r]));return e.join("&")}function parseString(t){for(var e,r,s={},i=t.split("&"),o=0,n=i.length;n>o;++o)r=i[o],e=r.split("="),s[decodeURIComponent(e[0])]=decodeURIComponent(e[1]);return s}function parseHeader(t){var e,r,s,i,o=t.split(/\r?\n/),n={};o.pop();for(var u=0,a=o.length;a>u;++u)r=o[u],e=r.indexOf(":"),s=r.slice(0,e).toLowerCase(),i=trim(r.slice(e+1)),n[s]=i;return n}function type(t){return t.split(/ *; */).shift()}function params(t){return reduce(t.split(/ *; */),function(t,e){var r=e.split(/ *= */),s=r.shift(),i=r.shift();return s&&i&&(t[s]=i),t},{})}function Response(t,e){e=e||{},this.req=t,this.xhr=this.req.xhr,this.text="HEAD"!=this.req.method?this.xhr.responseText:null,this.setStatusProperties(this.xhr.status),this.header=this.headers=parseHeader(this.xhr.getAllResponseHeaders()),this.header["content-type"]=this.xhr.getResponseHeader("content-type"),this.setHeaderProperties(this.header),this.body="HEAD"!=this.req.method?this.parseBody(this.text):null}function Request(t,e){var r=this;Emitter.call(this),this._query=this._query||[],this.method=t,this.url=e,this.header={},this._header={},this.on("end",function(){var t=null,e=null;try{e=new Response(r)}catch(s){t=new Error("Parser is unable to parse the response"),t.parse=!0,t.original=s}r.callback(t,e)})}function request(t,e){return"function"==typeof e?new Request("GET",t).end(e):1==arguments.length?new Request("GET",t):new Request(t,e)}var Emitter=require("emitter"),reduce=require("reduce"),root="undefined"==typeof window?this:window,trim="".trim?function(t){return t.trim()}:function(t){return t.replace(/(^\s*|\s*$)/g,"")};request.serializeObject=serialize,request.parseString=parseString,request.types={html:"text/html",json:"application/json",xml:"application/xml",urlencoded:"application/x-www-form-urlencoded",form:"application/x-www-form-urlencoded","form-data":"application/x-www-form-urlencoded"},request.serialize={"application/x-www-form-urlencoded":serialize,"application/json":JSON.stringify},request.parse={"application/x-www-form-urlencoded":parseString,"application/json":JSON.parse},Response.prototype.get=function(t){return this.header[t.toLowerCase()]},Response.prototype.setHeaderProperties=function(){var t=this.header["content-type"]||"";this.type=type(t);var e=params(t);for(var r in e)this[r]=e[r]},Response.prototype.parseBody=function(t){var e=request.parse[this.type];return e&&t&&t.length?e(t):null},Response.prototype.setStatusProperties=function(t){var e=t/100|0;this.status=t,this.statusType=e,this.info=1==e,this.ok=2==e,this.clientError=4==e,this.serverError=5==e,this.error=4==e||5==e?this.toError():!1,this.accepted=202==t,this.noContent=204==t||1223==t,this.badRequest=400==t,this.unauthorized=401==t,this.notAcceptable=406==t,this.notFound=404==t,this.forbidden=403==t},Response.prototype.toError=function(){var t=this.req,e=t.method,r=t.url,s="cannot "+e+" "+r+" ("+this.status+")",i=new Error(s);return i.status=this.status,i.method=e,i.url=r,i},request.Response=Response,Emitter(Request.prototype),Request.prototype.use=function(t){return t(this),this},Request.prototype.timeout=function(t){return this._timeout=t,this},Request.prototype.clearTimeout=function(){return this._timeout=0,clearTimeout(this._timer),this},Request.prototype.abort=function(){return this.aborted?void 0:(this.aborted=!0,this.xhr.abort(),this.clearTimeout(),this.emit("abort"),this)},Request.prototype.set=function(t,e){if(isObject(t)){for(var r in t)this.set(r,t[r]);return this}return this._header[t.toLowerCase()]=e,this.header[t]=e,this},Request.prototype.unset=function(t){return delete this._header[t.toLowerCase()],delete this.header[t],this},Request.prototype.getHeader=function(t){return this._header[t.toLowerCase()]},Request.prototype.type=function(t){return this.set("Content-Type",request.types[t]||t),this},Request.prototype.accept=function(t){return this.set("Accept",request.types[t]||t),this},Request.prototype.auth=function(t,e){var r=btoa(t+":"+e);return this.set("Authorization","Basic "+r),this},Request.prototype.query=function(t){return"string"!=typeof t&&(t=serialize(t)),t&&this._query.push(t),this},Request.prototype.field=function(t,e){return this._formData||(this._formData=new FormData),this._formData.append(t,e),this},Request.prototype.attach=function(t,e,r){return this._formData||(this._formData=new FormData),this._formData.append(t,e,r),this},Request.prototype.send=function(t){var e=isObject(t),r=this.getHeader("Content-Type");if(e&&isObject(this._data))for(var s in t)this._data[s]=t[s];else"string"==typeof t?(r||this.type("form"),r=this.getHeader("Content-Type"),this._data="application/x-www-form-urlencoded"==r?this._data?this._data+"&"+t:t:(this._data||"")+t):this._data=t;return e?(r||this.type("json"),this):this},Request.prototype.callback=function(t,e){var r=this._callback;return this.clearTimeout(),2==r.length?r(t,e):t?this.emit("error",t):void r(e)},Request.prototype.crossDomainError=function(){var t=new Error("Origin is not allowed by Access-Control-Allow-Origin");t.crossDomain=!0,this.callback(t)},Request.prototype.timeoutError=function(){var t=this._timeout,e=new Error("timeout of "+t+"ms exceeded");e.timeout=t,this.callback(e)},Request.prototype.withCredentials=function(){return this._withCredentials=!0,this},Request.prototype.end=function(t){var e=this,r=this.xhr=getXHR(),s=this._query.join("&"),i=this._timeout,o=this._formData||this._data;if(this._callback=t||noop,r.onreadystatechange=function(){return 4==r.readyState?0==r.status?e.aborted?e.timeoutError():e.crossDomainError():void e.emit("end"):void 0},r.upload&&(r.upload.onprogress=function(t){t.percent=t.loaded/t.total*100,e.emit("progress",t)}),i&&!this._timer&&(this._timer=setTimeout(function(){e.abort()},i)),s&&(s=request.serializeObject(s),this.url+=~this.url.indexOf("?")?"&"+s:"?"+s),r.open(this.method,this.url,!0),this._withCredentials&&(r.withCredentials=!0),"GET"!=this.method&&"HEAD"!=this.method&&"string"!=typeof o&&!isHost(o)){var n=request.serialize[this.getHeader("Content-Type")];n&&(o=n(o))}for(var u in this.header)null!=this.header[u]&&r.setRequestHeader(u,this.header[u]);return this.emit("request",this),r.send(o),this},request.Request=Request,request.get=function(t,e,r){var s=request("GET",t);return"function"==typeof e&&(r=e,e=null),e&&s.query(e),r&&s.end(r),s},request.head=function(t,e,r){var s=request("HEAD",t);return"function"==typeof e&&(r=e,e=null),e&&s.send(e),r&&s.end(r),s},request.del=function(t,e){var r=request("DELETE",t);return e&&r.end(e),r},request.patch=function(t,e,r){var s=request("PATCH",t);return"function"==typeof e&&(r=e,e=null),e&&s.send(e),r&&s.end(r),s},request.post=function(t,e,r){var s=request("POST",t);return"function"==typeof e&&(r=e,e=null),e&&s.send(e),r&&s.end(r),s},request.put=function(t,e,r){var s=request("PUT",t);return"function"==typeof e&&(r=e,e=null),e&&s.send(e),r&&s.end(r),s},module.exports=request;


},{"emitter":65,"reduce":66}],65:[function(require,module,exports){
function Emitter(t){return t?mixin(t):void 0}function mixin(t){for(var e in Emitter.prototype)t[e]=Emitter.prototype[e];return t}module.exports=Emitter,Emitter.prototype.on=Emitter.prototype.addEventListener=function(t,e){return this._callbacks=this._callbacks||{},(this._callbacks[t]=this._callbacks[t]||[]).push(e),this},Emitter.prototype.once=function(t,e){function i(){r.off(t,i),e.apply(this,arguments)}var r=this;return this._callbacks=this._callbacks||{},i.fn=e,this.on(t,i),this},Emitter.prototype.off=Emitter.prototype.removeListener=Emitter.prototype.removeAllListeners=Emitter.prototype.removeEventListener=function(t,e){if(this._callbacks=this._callbacks||{},0==arguments.length)return this._callbacks={},this;var i=this._callbacks[t];if(!i)return this;if(1==arguments.length)return delete this._callbacks[t],this;for(var r,s=0;s<i.length;s++)if(r=i[s],r===e||r.fn===e){i.splice(s,1);break}return this},Emitter.prototype.emit=function(t){this._callbacks=this._callbacks||{};var e=[].slice.call(arguments,1),i=this._callbacks[t];if(i){i=i.slice(0);for(var r=0,s=i.length;s>r;++r)i[r].apply(this,e)}return this},Emitter.prototype.listeners=function(t){return this._callbacks=this._callbacks||{},this._callbacks[t]||[]},Emitter.prototype.hasListeners=function(t){return!!this.listeners(t).length};


},{}],66:[function(require,module,exports){
module.exports=function(l,n,e){for(var r=0,t=l.length,u=3==arguments.length?e:l[r++];t>r;)u=n.call(null,u,l[r],++r,l);return u};


},{}]},{},[1])(1)
});