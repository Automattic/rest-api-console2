var Component = require('./component'),
    ListComponent = require('./list_component'),
    liquidemetal = require('liquidmetal'),
    fn = require('fn');

var ReferencePanel = Component.extend({
  'openClass' : 'open',
  'onSelect' : function(){},
  'init' : function(node, options) {
    this.onSearch = this.search.bind(this);

    this.groupsList = new ListComponent({
      'className' : 'groups',
      'itemTemplate':function(item){
        return $('<li></li>').append($("<span></span>").text(item));
      }
    });

    this.groupsList.on('select', this.updateEndpoints.bind(this));

    this.endpointsList = new ListComponent({
      'className' : 'endpoints',
      'itemTemplate' : function(item) {
        return $('<li></li>').text(item.method + " " + (item.path_labeled || "?"));
      }
    });

    this.endpointsList.on('select', this.updateDetail.bind(this));
    this.endpointsList.on('submit', this.selectEndpoint.bind(this));

    this.groupsList.node.appendTo($('<div></div>').appendTo(this.node));

    this.endpointsList.node.appendTo($('<div></div>').appendTo(this.node));
    this.detail = $('<div></div>').appendTo(this.node);
  },
  'onChange' : function(value, oldValue) {
    var groups = [],
        group_endpoints = {};

    value.forEach(function(endpoint) {
      var group = endpoint.group;

      if (groups.indexOf(group) === -1) {
        groups.push(group);
      }

      if (!group_endpoints[group]) {
        group_endpoints[group] = [];
      }

      group_endpoints[group].push(endpoint);

    });

    groups.sort();

    this.groups = groups;
    this.group_endpoints = group_endpoints;

    this.groupsList.setValue(groups);
    this.endpointsList.setValue(value);

  }
});

ReferencePanel.prototype.toggle = function() {
  this.node.toggleClass(this.options.openClass);

  if (this.node.hasClass(this.options.openClass)) {
    this.onOpen();
  } else {
    this.onClose();
  }

};

ReferencePanel.prototype.isOpen = function() {
  return this.node.hasClass(this.options.openClass);
};


ReferencePanel.prototype.close = function() {
  if (this.isOpen()) {
    this.toggle();
  }
};

ReferencePanel.prototype.open = function() {
  if (!this.isOpen()) {
    this.toggle();
  }
};

ReferencePanel.prototype.onOpen = function() {
  this.groupsList.enable();
  this.endpointsList.enable();
  this.groupsList.node.focus();
};

ReferencePanel.prototype.onClose = function() {
  this.groupsList.disable();
  this.endpointsList.disable();  
};

ReferencePanel.prototype.updateEndpoints = function(group) {
  var endpoints = this.group_endpoints[group];
  this.endpointsList.setValue(endpoints);
};

ReferencePanel.prototype.updateDetail = function(endpoint) {
  this.detail.children().remove();
  $('<pre></pre>').appendTo(this.detail).text(JSON.stringify(endpoint, null, "  "));
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

ReferencePanel.prototype.selectEndpoint = function(endpoint) {
  this.options.onSelect(endpoint);
};

module.exports = ReferencePanel;
