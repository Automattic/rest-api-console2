var WPApi = require('./wpapi');
var WPComApi = require('./wpcom');

var APIs = {};
APIs[WPApi.name] = WPApi;
APIs[WPComApi.name] = WPComApi;

function getAvailableApis() {
  return [WPComApi.name, WPApi.name];
}

function getDefault() {
  return WPComApi;
}

function get(name) {
  return APIs[name] ? APIs[name] : getDefault();
}

module.exports = {
  get: get,
  getAvailableApis: getAvailableApis,
  getDefault: getDefault
};
