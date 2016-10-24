
if (!window) throw new Error("Not a browser window.");

var config       = require('../config.json'),
    path         = require('./path'),
    ui           = require('./ui'),
    querystring  = require('querystring'),
    dev          = new ui.Dev(),
    querystring  = require('querystring'),
    $            = require('zepto-browserify').$,
    authScheme   = require('./auth')(config);

$(function() {

var authPanel = new ui.AuthPanel('#auth', {
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
        send({ version:'1.1', path:'/versions', query: "include_dev=true" }, function(err, response) {
          onLoad(err, response.versions, response.current_version);
        });
      },
      'onLoadEndpoints': function(version, onEndpoints) {
        // TODO: stash endpoints in local storage so we can load them immediately in the future
        $.ajax({
          headers: { 'accept': 'application/json' },
          url: "https://public-api.wordpress.com/rest/v" + version +"/help",
          success: function(data) {
            onEndpoints(null, $.map(data, function(endpoint, index) {
              endpoint.version = version;
              return endpoint;
            }));
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
        var listItem = $("<li></li>"),
            method = $("<span></span>").text(item.method).appendTo(listItem),
            path = $("<code></code>").text('/v' + item.version + item.path_labeled).appendTo(listItem.append(" ")),
            group = $("<strong></strong>").text(item.group).appendTo(listItem.append(" ")),
            description = $("<em></em>").text(item.description).appendTo(listItem.append(" "));

        return listItem;
      },
      'onSelect': function(endpoint) {
        selectEndpoint(endpoint);
      },
      'onSearch': referencePanel.onSearch,
    } // PathField options
    ), // PathField constructor
    selectEndpoint = function(endpoint) {
      var endpointPath = new path.Path('/v' + endpoint.version + endpoint.path_labeled, endpoint.request.path);

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
      // TODO: default to the version selected in the reference panel
      request.apiVersion = '1.1';
      // parse out the version from the path
      var versionReg = /^\/v([\d][^\/]{0,})\//;
      var parts = request.path.match(versionReg);
      if (parts) {
        request.apiVersion = parts[1];
        request.path = request.path.replace(versionReg, '/');
      }

      viewer.setValue(request);

      send(request, function(err, response, xhr){
        if (callback) {
          callback(err, response, xhr);
        }
        viewer.onResponse(err, response, xhr);
      });
      viewer.sent();
      return viewer;
    };

bodyBuilder.disable();

methodSelector.on('enabled', function(){
  methodSelector.node.attr('tabindex','1').addClass('enabled');
});

methodSelector.on('disabled', function(){
  methodSelector.node.attr('tabindex', null).removeClass('enabled');
});

methodSelector.on('change', function() {
  if (methodSelector.getValue() === 'GET') {
    bodyBuilder.disable();
  } else {
    bodyBuilder.enable();
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

  sendRequest(request).focus();

});


try {
  referencePanel.setHistory(JSON.parse(localStorage.history));
} catch(e) {
  // unable to load history
}

referencePanel.on('history', function(endpoints) {
  localStorage.history = JSON.stringify(endpoints);
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

}); // $();
