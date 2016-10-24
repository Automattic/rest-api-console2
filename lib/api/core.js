var $ = require('zepto-browserify').$;

var name = 'CORE API';

var baseUrl = 'https://public-api.wordpress.com/';

var namespaces = [ 'wp/v2', 'wpcom/v2' ];

function getRequestUrl(request) {
  return baseUrl + request.version + request.path;
}

function getDiscoveryUrl(version) {
  return baseUrl + version;
}

function parseEndpoints(data) {
  var endpoints = [];

  $.each(data.routes, function(url, route) {
    // Drop the /wp/v2
    var rawpath = url.substr(data.namespace.length + 1);
    $.each(route.endpoints, function(_, rawEndpoint) {
      $.each(rawEndpoint.methods, function(_, method) {
        // Parsing Query
        var query = {};
        $.each(rawEndpoint.args, function(key, arg) {
          query[key] = {
            description: {
              view: arg.description
            }
          };
        });

        // Parsing path
        var path = {};
        var paramRegex = /\([^\(\)]*\)/g;
        var parameters = rawpath.match(paramRegex) || [];
        var computedPath = rawpath;
        $.each(parameters, function(_, param) {
          var paramDetailsRegex = /[^\<]*<([^\>]*)>\[([^\]]*)\][^]*/;
          var explodedParameter = param.match(paramDetailsRegex);
          var paramName = '$' + explodedParameter[1];
          path[paramName] = {
            description: '',
            type: explodedParameter[2]
          };
          computedPath = computedPath.replace(param, paramName);
        });

        var endpoint = {
           description: '',
           group: '',
           method: method,
           path_format: computedPath,
           path_labeled: computedPath,
           request: {
               body: [],
               query: query,
               path: path
           }
        };

        endpoints.push(endpoint);
      });
    });
  });

  return endpoints;
}

function loadVersions(send, callback) {
  callback(undefined, namespaces, namespaces[0]);
}

module.exports = {
  name: name,
  baseUrl: baseUrl,
  getRequestUrl: getRequestUrl,
  getDiscoveryUrl: getDiscoveryUrl,
  parseEndpoints: parseEndpoints,
  loadVersions: loadVersions
};
