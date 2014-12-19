var liquidmetal = require('liquidmetal');


onmessage = function(e) {

  var start = new Date().getTime(),
      query = e.data.query,
      index = e.data.index,
      term = query.replace(/\//g, ' ').toUpperCase().trim(),
      ranked = index.map(function(endpoint) {

        try {
          var i = endpoint.description.indexOf(" ", 16),
              source = endpoint.search_source || [endpoint.path_labeled.replace(/\//g, ' '), endpoint.group, endpoint.description.substring(0,i)].join(' ').toUpperCase().trim(),
              score = liquidmetal.score(source, term);
              endpoint.search_source = source;
              return [score, source, endpoint];
        } catch (error) {
          if (console && console.warn) {
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

      }),
      results = ranked.map(function(e){ return e[2]; }),
      end = new Date().getTime();

  postMessage({query: query, results: results, ms: end-start});
};

