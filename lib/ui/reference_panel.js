var Component = require('./component'),
    liquidemetal = require('liquidmetal');


var ReferencePanel = Component.extend({
  'openClass' : 'open',
  'init' : function(node, options) {
    this.onSearch = this.search.bind(this);    
  }
});

ReferencePanel.prototype.toggle = function() {
  this.node.toggleClass(this.options.openClass);
};

ReferencePanel.prototype.search = function(q) {

  var term = q.replace(/\//g, ' ').toUpperCase().trim(),
      ranked = this.getValue().map(function(endpoint) {

        try {
          var i = endpoint.description.indexOf(" ", 16),
              source = endpoint.search_source || [endpoint.path_labeled.replace(/\//g, ' '), endpoint.group, endpoint.description.substring(0,i)].join(' ').toUpperCase().trim(),
              score = liquidemetal.score(source, term);
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

  });

  return ranked.map(function(e) {
    return e[2];
  });

};

module.exports = ReferencePanel;
