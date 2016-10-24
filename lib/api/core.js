var $ = require('zepto-browserify').$;

var name = 'WP REST API';

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
    // Drop the /wp/v2 or /wpcom/v2
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

        computedPath = computedPath || '/';
        var docs = guessEndpointDocumentation(method, data.namespace, computedPath);

        var endpoint = {
           group: docs.group,
           description: docs.description,
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

function guessEndpointDocumentation(method, namespace, computedPath) {
  // Try to guess some info about the endpoints
  var group = '';
  var groupPlural = '';
  var groupSingular = '';
  var description = '';

  var verbMatch = computedPath.match(/^(\/?sites\/[\$\w.]+)?\/([\w-]*)(\/|$)/);

  if (verbMatch) {
    group = verbMatch[2];
    switch (group) {
      case 'media':
        groupPlural = 'media items';
        break;
      case 'feedback':
        groupPlural = 'feedback posts';
        break;
      case 'types':
        groupPlural = 'post types';
        break;
      case 'statuses':
        groupPlural = 'post statuses';
        break;
      default:
        groupPlural = group;
        break;
    }

    if (group === 'statuses') {
      groupSingular = 'post status';
    } else if (group === 'sites' || computedPath === '/') {
      group = 'auto-discovery';
    } else {
      groupSingular = groupPlural.replace(/ies$/, 'y').replace(/s$/, '');
    }

    function getDescription() {
      if (group === 'auto-discovery') {
        if (computedPath === '/') {
          return 'List endpoints in the ' + namespace + ' namespace';
        } else {
          return 'List endpoints in the ' + namespace + ' namespace (site-specific)';
        }
      }

      if (namespace === 'wp/v2') {
        if (group === 'settings') {
          switch (method) {
            case 'GET':
              return 'Get site settings';
            default:
              return 'Edit site settings';
          }
        }

        if (/\/users\/me$/.test(computedPath)) {
          return 'Get the current user';
        }

        if (/\/revisions(\/|$)/.test(computedPath)) {
          groupPlural = 'revisions of a ' + groupSingular;
          groupSingular = 'revision of a ' + groupSingular;
        }

        if (/\$(id|status|taxonomy|type)$/.test(computedPath)) {
          switch (method) {
            case 'GET':
              return 'Get a ' + groupSingular;
            case 'POST':
            case 'PUT':
            case 'PATCH':
              return 'Edit a ' + groupSingular;
            case 'DELETE':
              return 'Delete a ' + groupSingular;
          }
        } else {
          switch (method) {
            case 'GET':
              return 'List ' + groupPlural;
            case 'POST':
              return 'Create a ' + groupSingular;
          }
        }
      }
    }

    description = getDescription() || '';
  }

  return {
    group: group,
    description: description,
  };
}

module.exports = {
  name: name,
  baseUrl: baseUrl,
  getRequestUrl: getRequestUrl,
  getDiscoveryUrl: getDiscoveryUrl,
  parseEndpoints: parseEndpoints,
  loadVersions: loadVersions
};
