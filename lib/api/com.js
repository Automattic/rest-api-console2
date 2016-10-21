var $ = require('zepto-browserify').$;

var name = '.COM API';

var baseUrl = 'https://public-api.wordpress.com/rest';

function getRequestUrl(request) {
  var version = request.version || '1';
  return baseUrl + '/v' + version + request.path;
}

function getDiscoveryUrl(version) {
  return baseUrl + '/v' + version + '/help';
}

function parseEndpoints(data, version) {
  return $.map(data, function(endpoint, index) {
    endpoint.path_format = '/v' + version + endpoint.path_format;
    endpoint.path_labeled = '/v' + version + endpoint.path_labeled;
    return endpoint;
  });
}

module.exports = {
  name: name,
  hasVersions: true,
  baseUrl: baseUrl,
  getRequestUrl: getRequestUrl,
  getDiscoveryUrl: getDiscoveryUrl,
  parseEndpoints: parseEndpoints
};
