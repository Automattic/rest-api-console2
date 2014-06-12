var path = require('../path'),
    PathField = require('./path_field'),
    LookupPane = require('./lookup_pane'),
    log = require('./log'),
    liquidemetal = require('liquidmetal'),
    fn = require('../fn');

if (!window) throw new Error("Not a browser window.");

$(function() {

  $.getJSON("help.json", log(function(response) {

    var endpoints = response.body,
        pathField = new PathField($('#path'), {
          'default_path':new path.DefaultPath(),
          'itemTemplate': function(item) {
            var listItem = $("<li></li>"),
                method = $("<span></span>").text(item.method).appendTo(listItem),
                path = $("<code></code>").text(item.path_labeled).appendTo(listItem),
                description = $("<p></p>").appendTo(listItem),
                group = $("<strong></strong>").text(item.group).appendTo(description);
      
            description.append(" " + item.description);
      
            return listItem;
          },
          'onSelect': function(endpoint) {
            console.log("Selecting", endpoint);
            var endpointPath = new path.Path(endpoint.path_labeled, endpoint.request.path);
            pathField.setValue(endpointPath);
          },
          'onSearch': function(q){
              var ranked = endpoints.map(function(endpoint) {
                var i = endpoint.description.indexOf(" ", 16),
                    source = [endpoint.group, endpoint.path_labeled, endpoint.description.substring(0,i)].join(' '),
                    score = liquidemetal.score(source, q);

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

    pathField.on('submit', function(path){
      console.log('submit', path);
    });

  }));

});