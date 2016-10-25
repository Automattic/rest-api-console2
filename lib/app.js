
if (!window) throw new Error("Not a browser window.");

var config       = require('../config.json'),
    path         = require('./path'),
    ui           = require('./ui'),
    querystring  = require('querystring'),
    dev          = new ui.Dev(),
    querystring  = require('querystring'),
    $            = require('zepto-browserify').$,
    authScheme   = require('./auth')(config),
    apiFactory   = require('./api'),
    events       = require('events');

$(function() {
var app = new events.EventEmitter(),
    apiSelector = new ui.OptionSelector($('#api-selector'), {
      values: apiFactory.getAvailableApis(),
      defaultValue: 'WP.COM API', // HTTP methods change when a new API is selected
    }),
    authPanel = new ui.AuthPanel('#auth', {
      'scheme': auth,
      'onCheckToken' : function(auth, callback) {
        sendRequest({path:'/v1/me'}, callback);
      }
    }),
    auth = authScheme(authPanel),
    send = auth.request.bind(auth),
    referencePanel = new ui.ReferencePanel({
      'search_url' : window.console_search_url,
      'defaultValue' : [],
      'versionSelector' : $('#versions'),
      'filter' : dev.filterEndpoints.bind(dev),
      'onSelect' : function(endpoint) {
        selectEndpoint(endpoint);
      },
      'onLoadVersions': function(onLoad) {
        var api = apiFactory.get(apiSelector.getValue());
        api.loadVersions(send, onLoad);
      },
      'onLoadEndpoints': function(version, onEndpoints) {
        // TODO: stash endpoints in local storage so we can load them immediately in the future
        var api = apiFactory.get(apiSelector.getValue());
        var endPointsUrl = api.getDiscoveryUrl(version);

        $.ajax({
          headers: { 'accept': 'application/json' },
          url: endPointsUrl,
          success: function(data) {
            onEndpoints(null, api.parseEndpoints(data, version));
          }
        });
      }
    }),
    methodSelector = new ui.OptionSelector($('#method'), { values: ['GET', 'POST'] } ),
    queryBuilder = new ui.ParamBuilder($('#query'), {'title':'Query'}),
    bodyBuilder = new ui.ParamBuilder($('#body'), {'title':'Body'}),
    tip = new ui.Tip('#tip'),
    pathField = new ui.PathField($('#path'), {
      'defaultValue':new path.DefaultPath(),
      'itemTemplate': function(item) {
        if (typeof item == 'string') {
          return $("<li></li>").addClass('group').addClass('unselectable').text(item);
        }
        if (item.loading === true) {
          return $("<li></li>").addClass('unselectable').addClass('loading').append($("<div><div></div></div>").addClass('throbber'));
        }
        if (item.history === true) {
          return $("<li></li>").addClass('unselectable').addClass('history').text(item.label).addClass('group');
        }
        var listItem = $("<li></li>");
        $("<span></span>").text(item.method).appendTo(listItem);
        listItem.append(' ');
        $("<code></code>").text(item.path_labeled).appendTo(listItem);
        listItem.append(' ');
        if (item.group && item.description) {
          $("<strong></strong>").text(item.group + ':').appendTo(listItem);
          listItem.append(' ');
        }
        if (item.description) {
          $("<em></em>").text(item.description).appendTo(listItem);
        }
        return listItem;
      },
      'onSelect': function(endpoint) {
        selectEndpoint(endpoint);
      },
      'onSearch': referencePanel.onSearch,
    } // PathField options
    ), // PathField constructor
    selectEndpoint = function(endpoint) {
      endpointPath = new path.Path(endpoint.path_labeled, endpoint.request.path);
      endpointPath.parts.push(new path.Part('?', {label:'?', type:'segment', editable:false}));
      endpointPath.parts.push(new path.QueryPart());

      pathField.setValue(endpointPath);
      methodSelector.setValue(endpoint.method);
      methodSelector.disable();
      queryBuilder.setValue(endpoint.request.query);
      bodyBuilder.setValue(endpoint.request.body);

      referencePanel.addHistory(endpoint);
    },
    sendRequest = function (request, callback) {
      var viewer = new ui.RequestViewer({
            'container' : '#requests'
          });

      if (request.path && request.path.indexOf('/') !== 0) {
        request.path = "/" + request.path;
      }

      request.path = request.path.charAt(request.path.length - 1) == '?' ? request.path.substring(0, request.path.length-1) : request.path;

      if (request.api === 'WP REST API') {
        // This tells rest-proxy to send a WP REST API request
        request.apiNamespace = request.version;
      } else {
        // TODO: default to the version selected in the reference panel
        request.apiVersion = '1.1';
        // parse out the version from the path
        var versionReg = /^\/v([\d][^\/]{0,})\//;
        var parts = request.path.match(versionReg);
        if (parts) {
          request.apiVersion = parts[1];
          request.path = request.path.replace(versionReg, '/');
        }
      }

      viewer.setValue(request);

      app.emit('send', request);

      send(request, function(err, response, xhr){
        if (callback) {
          callback(err, response, xhr);
        }
        viewer.onResponse(err, response, xhr);
        app.emit('response', err, response, xhr, request);
        if (err) {
          app.emit('error', err, request, xhr);
        } else {
          app.emit('success', response, request, xhr);
        }
      });
      viewer.sent();
      return viewer;
    };

apiSelector.on('change', function(){
  var apiName = apiSelector.getValue();
  referencePanel.switchApi(apiName);
  pathField.reset();
  if (apiName === 'WP REST API') {
    methodSelector.setOptions([
      'GET',
      'POST',
      'PUT',
      'PATCH',
      'DELETE',
    ]);
  } else {
    methodSelector.setOptions([
      'GET',
      'POST',
    ]);
  }
});

referencePanel.versionOption.on('change', function() {
  pathField.reset();
})

bodyBuilder.disable();

methodSelector.on('enabled', function(){
  methodSelector.node.attr('tabindex','1').addClass('enabled');
});

methodSelector.on('disabled', function(){
  methodSelector.node.attr('tabindex', null).removeClass('enabled');
});

methodSelector.on('change', function() {
  switch (methodSelector.getValue()) {
    case 'GET':
    case 'DELETE':
      bodyBuilder.disable();
      break;

    default:
      bodyBuilder.enable();
      break;
  }
});

pathField.on('reset', function(){
  methodSelector.enable();
  queryBuilder.reset();
  bodyBuilder.reset();
  tip.reset();
});

// global hotkeys
$(document).on('keydown', function(e) {

  if (e.which == 77 && e.ctrlKey && !e.altKey && !e.shiftKey && !e.metaKey) { // 'm' + ctrl
    e.preventDefault();
    methodSelector.toggle();
    return false;
  }

  if (e.which == 191 && e.ctrlKey && !e.altKey && !e.shiftKey && !e.metaKey) { // '/' + ctrl
    e.preventDefault();
    pathField.focus();
    return false;
  }

  if (e.which == 27) { // esc
    e.preventDefault();
    e.stopPropagation();

    pathField.reset();
    return false;
  }

});

bodyBuilder.on('disable', function() {
  bodyBuilder.node.addClass('disabled');
});

bodyBuilder.on('enable', function() {
  bodyBuilder.node.removeClass('disabled');
});

var onTip = tip.setValue.bind(tip);

pathField.on('tip', onTip);
queryBuilder.on('tip', onTip);
bodyBuilder.on('tip', onTip);

pathField.on('changeParams', function(params) {
  var query = params.query;
  queryBuilder.setParams(querystring.parse(query));
});

queryBuilder.on('changeParams', function(params){
  pathField.setFieldValue('query', $.param(params));
});

var a = document.createElement('a');
pathField.on('submit', function(path){
  var method = methodSelector.getValue(),
      body = bodyBuilder.getQuery(),
      request = {method:method, body:body};

  a.href = path;

  request.path = a.pathname;
  request.query = a.search.substring(1, a.search.length);
  request.api = apiSelector.getValue();
  request.version = referencePanel.getVersion();

  sendRequest(request).focus();
});


try {
  referencePanel.setHistory(JSON.parse(localStorage.history));
} catch(e) {
  // unable to load history
}

referencePanel.on('history', function(history) {
  localStorage.history = JSON.stringify(history);
});

referencePanel.on('change', function() {
  pathField.requery();
});

dev.on('change', function(dev) {
  if (dev) {
    console.log("Developer mode activated");
    localStorage.developer = 'a8c';
  } else {
    delete localStorage.developer;
  }

  referencePanel.refresh();

});

dev.setValue(localStorage.developer === 'a8c');

referencePanel.load();

window.send = sendRequest;

window.responses = [];
window.response = null;

function recordResponse(response) {
  window.response = response;
  window.responses.unshift(response);

  console.log('%c window.response ready with ' + Object.keys(response).length + ' keys. Previous responses in window.responses[].', 'color: #cccccc;');
}

app
.on('success', function(response) {
  recordResponse(response);
})
.on('error', function(error, request, xhr) {
  var errorDetails = {
    request: request,
    status: error.status,
    error: error,
    xhr: xhr,
  };
  console.warn(errorDetails);
  recordResponse(errorDetails);
});

}); // $();
