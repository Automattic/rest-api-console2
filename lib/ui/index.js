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
        endpoint = null,
        pathField = new PathField($('#path'), {'default_path':new path.DefaultPath()}),
        lookupPane = new LookupPane($("#lookup"), {
          template: function(item) {
            var listItem = $("<li></li>");
            listItem.append($("<span></span>").text([item.group, item.path_labeled].join(' ')));
            return listItem;
          }
        }),
        search = fn.rateLimit(200, function(q){

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

          results = ranked.map(function(e) {
            return e[2];
          });

          lookupPane.displayResults(results);

        }),
        cancelSearch = function(){};

    pathField.on('submit', function(){
      // console.log.apply(console, arguments);
    });

    pathField.on('clear', function() {
      endpoint = null;
    });

    lookupPane.on('select', function(item) {
      var endpointPath = new path.Path(item.path_labeled, item.request.path);

      endpoint = item;
      pathField.setValue(endpointPath);

    });

    var lastv = "";
    pathField.on('change', function(v) {
      v = decodeURI(v);

      // we currently have an endpoint
      if (endpoint !== null) {
        return;
      }

      if (v === "") {
        if (cancelSearch) cancelSearch();
        lookupPane.hide();
        return;
      }

      if (v === lastv) {
        return;
      }

      lastv = v;

      cancelSearch = search(v);

    });

  }));

});