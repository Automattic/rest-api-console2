
if (!window) throw new Error("Not a browser window.");

var path = require('./path'),
    ui = require('./ui'),
    querystring = require('querystring'),
    dev = new ui.Dev(),
    liquidemetal = require('liquidmetal'),
    querystring = require('querystring'),
    $ = require('zepto-browserify').$,
    proxy = require('wpcom-proxy-request');

$(function() {

proxy({ metaAPI: { accessAllUsersBlogs: true }}, function(err, response) {
  if (err !== null) {
    throw err;
  }
});

var referencePanel = new ui.ReferencePanel('#reference', {
      'defaultValue' : [],
      'filter' : dev.filterEndpoints.bind(dev),
      'onSelect' : function(endpoint) {
        referencePanel.close();
        selectEndpoint(endpoint);
      }
    }),
    methodSelector = new ui.MethodSelector($('#method'), {'container':$('#methods'),'label':$('#method span')}),
    queryBuilder = new ui.ParamBuilder($('#query'), {'title':'Query'}),
    bodyBuilder = new ui.ParamBuilder($('#body'), {'title':'Body'}),
    tip = new ui.Tip('#tip'),
    pathField = new ui.PathField($('#path'), {
      'defaultValue':new path.DefaultPath(),
      'itemTemplate': function(item) {
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
      'onSearch': referencePanel.onSearch
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
    },
    send = function(request, callback) {

      proxy(request, callback);

      // $.ajax({
      //   type: request.method,
      //   url: 'https://public-api.wordpress.com/rest/v1.1' + request.path + (request.query ? "?" + request.query : '' ),
      //   data: request.method == 'GET' ? null : request.body,
      //   headers: $.extend({'accept':'application/json'}, authPanel.getAuthorizeHeaders()),
      //   success: function(data, status, xhr) {
      //     callback(null, data, xhr);
      //   },
      //   error: function(xhr, errorType, error) {
      //     var body = xhr.response;
      //
      //     try {
      //       body = JSON.parse(body);
      //     } catch (e) {
      //       // not valid json
      //     }
      //     callback({
      //       status: xhr.status,
      //       error: error,
      //       errorType: errorType,
      //       body: body,
      //     }, null, xhr);
      //   }
      // });

    },
    sendRequest = function (request, callback) {
      var viewer = new ui.RequestViewer({
            'container' : '#requests'
          });

      if (request.path && request.path.indexOf('/') !== 0) {
        request.path = "/" + request.path;
      }

      request.path = request.path.charAt(request.path.length - 1) == '?' ? request.path.substring(0, request.path.length-1) : request.path;
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
    },
    authPanel = new ui.AuthPanel('#auth', {
      'onCheckToken' : function(auth, callback) {
        sendRequest({path:'/v1/me'}, callback);
      }
    }),
    refreshEndpoints = function() {
      var versions = ['1', '1.1'];
      $.each(versions, function(idx, version){
        $.ajax({
          url: 'https://public-api.wordpress.com/rest/v' + version + '/help',
          headers: {'accept': 'application/json'},
          success: function(data) {
            var versionData = {};
            versionData[version] = data;
            referencePanel.setValue(versionData);
          }
        });
      });
    };

authPanel.checkProxyAuth();

bodyBuilder.disable();

methodSelector.on('enabled', function(){
  methodSelector.node.attr('tabindex','1').addClass('enabled');
});

methodSelector.on('disabled', function(){
  methodSelector.node.attr('tabindex', null).removeClass('enabled');
});

methodSelector.on('change', function() {
  pathField.focus();

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

pathField.focus();

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

  if (e.which == 191 && !e.ctrlKey && !e.altKey && e.shiftKey && !e.metaKey) { // shift + / or "?"
    referencePanel.toggle();
    return false;
  }


  if (e.which == 27) { // esc
    e.preventDefault();
    e.stopPropagation();

    if (referencePanel.isOpen()) {
      referencePanel.close();
      return false;
    }

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

referencePanel.on('change', function(value, oldValue) {
  localStorage.endpoints = JSON.stringify(value);
});

// Load endpoint from cache
try {
  referencePanel.setValue(JSON.parse(localStorage.endpoints));
} catch (e) {
  delete localStorage.endpoints;
}

// Load endpoints from server
refreshEndpoints();
setInterval(refreshEndpoints, 60000);

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

pathField.on('search', function() {
  referencePanel.toggle();
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

}); // $();