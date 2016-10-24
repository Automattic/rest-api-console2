var $ = require('zepto-browserify').$;

var name = 'WP.COM API';

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

function loadVersions(send, callback) {
  // Strange having to specify a version to retrieve versions :)
  send({
    path: '/versions',
    query: { include_dev: true },
    version: '1.1',
  }, function(err, response, xhr) {
    if (err) {
      callback({
        status: xhr.status,
        error: err,
        errorType: err,
        body: xhr.response,
      });
    } else {
      callback(
        undefined,
        response.versions.map(function(version) {
         return 'v' + version;
        }),
        'v' + response.current_version
      );
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
