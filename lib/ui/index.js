var path = require('../path'),
    PathField = require('./path_field'),
    LookupPane = require('./lookup_pane'),
    MethodSelector = require('./method_selector'),
    ParamBuilder = require('./param_builder'),
    RequestViewer = require('./request_viewer'),
    Tip = require('./tip'),
    liquidemetal = require('liquidmetal'),
    querystring = require('querystring');

if (!window) throw new Error("Not a browser window.");

$(function() {

  var endpoints = [],
      methodSelector = new MethodSelector($('#method'), {'container':$('#methods'),'label':$('#method span')}),
      queryBuilder = new ParamBuilder($('#query'), {'title':'Query'}),
      bodyBuilder = new ParamBuilder($('#body'), {'title':'Body'}),
      tip = new Tip('#tip'),
      pathField = new PathField($('#path'), {
        'defaultValue':new path.DefaultPath(),
        'itemTemplate': function(item) {
          var listItem = $("<li></li>"),
              method = $("<span></span>").text(item.method).appendTo(listItem),
              path = $("<code></code>").text(item.path_labeled).appendTo(listItem.append(" ")),
              group = $("<strong></strong>").text(item.group).appendTo(listItem.append(" ")),
              description = $("<em></em>").text(item.description).appendTo(listItem.append(" "));

          return listItem;
        },
        'onSelect': function(endpoint) {
          var endpointPath = new path.Path(endpoint.path_labeled, endpoint.request.path);
          pathField.setValue(endpointPath);
          methodSelector.setValue(endpoint.method);
          methodSelector.disable();

          queryBuilder.setValue(endpoint.request.query);

          bodyBuilder.setValue(endpoint.request.body);
        },
        'onSearch': function(q){
            var term = q.replace(/\//g, ' ').toUpperCase().trim(),
                ranked = endpoints.map(function(endpoint) {

                  try {
                    var i = endpoint.description.indexOf(" ", 16),
                        source = endpoint.search_source || [endpoint.path_labeled.replace(/\//g, ' '), endpoint.group, endpoint.description.substring(0,i)].join(' ').toUpperCase().trim(),
                        score = liquidemetal.score(source, term);
                        endpoint.search_source = source;
                        return [score, source, endpoint];
                  } catch (error) {
                    if (console && console.error) {
                      console.warn("Failed to score endpoint", endpoint, error.message);
                    }
                    return [0, '', endpoint];
                  }

            }).filter(function(score){
              return score[0] > 0;
            }).sort(function(a, b) {
              if (a[0] == b[0]) return 0;

              if (a[0] > b[0]) return -1;

              return 1;

            });

            return ranked.map(function(e) {
              return e[2];
            });

          } // onSearch function
        } // PathField options
      ), // PathField constructor
      upgraded = false,
      queue = [],
      send = function(request) {
        var opts = request.getValue();
        
        $.ajax({
          method: opts.method,
          url: 'https://public-api.wordpress.com/rest/v1' + [opts.path, $.param(opts.query)].join('?'),
          headers: {'accept':'application/json'},
          success: function(response) {
            request.onResponse(null, response);
          },
          error: function(xhr, errorType, error) {

            var body = xhr.response;

            try {
              body = JSON.parse(body);
            } catch (e) {
              // not valid json
            }

            request.onResponse({
              status: xhr.status,
              error: error,
              errorType: errorType,
              body: body
            }, null);
          }
        });

        request.sent();

      };

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

  try {
    endpoints = JSON.parse(localStorage.endpoints);
  } catch (e) {
    // no valid endpoints
  } finally {
    if (!$.isArray(endpoints)) {
      delete localStorage.endpoints;
      endpoints = [];
    }
  }

  $.ajax({
    url: 'https://public-api.wordpress.com/rest/v1/help',
    headers: {'accept':'application/json'},
    success: function(response) {
      localStorage.endpoints = JSON.stringify(response);
      endpoints = response;
    }
  });

  pathField.on('submit', function(path){
    var method = methodSelector.getValue(),
        query = queryBuilder.getQuery(),
        body = bodyBuilder.getQuery(),
        request = {method:method,path:path,query:query,body:body},
        viewer = new RequestViewer({
          'container' : '#requests'
        });

    var queryIndex = path.indexOf('?');
    if (queryIndex !== -1) {
      try {
        request.query = $.extend(query, querystring.parse(path.slice(queryIndex + 1)));
      } catch(e) {
        // could not parse the query from the path, drop it
      }
      request.path = request.path.slice(0, queryIndex);
    }

    if (request.path.indexOf('/') !== 0) {
      request.path = "/" + request.path;
    }

    viewer.setValue(request);

    send(viewer);

  });

});