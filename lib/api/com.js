var $ = require('zepto-browserify').$;

var name = '.COM API';

var baseUrl = 'https://public-api.wordpress.com/rest/';

function getRequestUrl(request) {
  var version = request.version || 'v1';
  return baseUrl + version + request.path;
}

function getDiscoveryUrl(version) {
  return baseUrl + version + '/help';
}

function parseEndpoints(data, version) {
  return data;
}

function loadVersions(callback) {
  // Strange having to specify a version to retrieve versions :)
  $.ajax({
    type: 'GET',
    url: baseUrl + 'v1.1/versions?include_dev=true',
    headers: $.extend({'accept':'application/json'}),
    success: function(data) {
      callback(
        undefined,
        data.versions.map(function(version) {
         return 'v' + version;
        }),
        'v' + data.current_version
      );
    },
    error: function(xhr, errorType, error) {
      callback({
        status: xhr.status,
        error: error,
        errorType: errorType,
        body: xhr.response,
      });
    }
  });
}

module.exports = {
  name: name,
  baseUrl: baseUrl,
  getRequestUrl: getRequestUrl,
  getDiscoveryUrl: getDiscoveryUrl,
  parseEndpoints: parseEndpoints,
  loadVersions: loadVersions
};
