var path = require('../path'),
    PathField = require('./path_field'),
    LookupPane = require('./lookup_pane'),
    MethodSelector = require('./method_selector'),
    ParamBuilder = require('./param_builder'),
    liquidemetal = require('liquidmetal');

if (!window) throw new Error("Not a browser window.");

$(function() {

  var endpoints = [],
      methodSelector = new MethodSelector($('#method'), {'container':$('#methods'),'label':$('#method span')}),
      queryBuilder = new ParamBuilder($('#query'), {'title':'Query'}),
      bodyBuilder = new ParamBuilder($('#body'), {'title':'Body'}),
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
              var i = endpoint.description.indexOf(" ", 16),
                  source = endpoint.search_source || [endpoint.path_labeled.replace(/\//g, ' '), endpoint.group, endpoint.description.substring(0,i)].join(' ').toUpperCase().trim(),
                  score = liquidemetal.score(source, term);

              endpoint.search_source = source;

              return [score, source, endpoint];
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
      ); // PathField constructor

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

  pathField.on('submit', function(path){
    console.log('submit', path);
  });

  pathField.on('reset', function(){
    methodSelector.enable();
    queryBuilder.reset();
    bodyBuilder.reset();
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

  $.getJSON("help.json", function(response) {
    endpoints = response.body;
  });

  bodyBuilder.on('disable', function() {
    bodyBuilder.node.addClass('disabled');
  });

  bodyBuilder.on('enable', function() {
    bodyBuilder.node.removeClass('disabled');
  });

});