const api = require('./api')
const PathLoader = require('path-loader');

for (name of api.apiMethods) {
  factories[`create_${name}`] = function (options) {
    return api[name]
  }
}

factories.createPathLoader = function (options) {
  return PathLoader.createLoader ? PathLoader.createLoader(options) : PathLoader.load
}

module.exports = factories
