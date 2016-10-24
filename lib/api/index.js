var CoreApi = require('./core');
var ComApi = require('./com');

var APIs = {};
APIs[CoreApi.name] = CoreApi;
APIs[ComApi.name] = ComApi;

function getAvailableApis() {
  return [ComApi.name, CoreApi.name];
}

function getDefault() {
  return ComApi;
}

function get(name) {
  return APIs[name] ? APIs[name] : getDefault();
}

module.exports = {
  get: get,
  getAvailableApis: getAvailableApis,
  getDefault: getDefault
};
