var Component = require('./component'),
    $ = Component.$,
    ListComponent = require('./list_component'),
    liquidemetal = require('liquidmetal'),
    fn = require('fn');

var ReferencePanel = Component.extend({
  'openClass' : 'open',
  'filter'    : function(){ return arguments[0]; },
  'onSelect' : function(){},
  'init' : function(node, options) {
    this.onSearch = this.search.bind(this);

    this.groupsList = new ListComponent({
      'tabindex' : '1',
      'className' : 'groups',
      'itemTemplate':function(item){
        return $('<li></li>').append($("<span></span>").text(item));
      }
    });

    this.endpointsList = new ListComponent({
      'tabindex' : '1',
      'className' : 'endpoints',
      'itemTemplate' : function(item) {
        return $('<li></li>').text(item.method + " " + (item.path_labeled || "?"));
      }
    });

    this.groupsList.on('select', this.updateEndpoints.bind(this));
    this.groupsList.on('submit', this.endpointsList.focus.bind(this.endpointsList));

    this.endpointsList.on('select', this.updateDetail.bind(this));
    this.endpointsList.on('submit', this.selectEndpoint.bind(this));

    this.groupsList.node.appendTo($('<div></div>').appendTo(this.node));

    this.endpointsList.node.appendTo($('<div></div>').appendTo(this.node));
    this.detail = $('<div></div>').appendTo(this.node);
  },
  'onChange' : function(value, oldValue) {
    var groups = [],
        group_endpoints = {};

    this.getEndpoints().forEach(function(endpoint) {
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

    groups.unshift('all');
    group_endpoints.all = value;
    this.groups = groups;
    this.group_endpoints = group_endpoints;

    this.groupsList.setValue(groups);
    this.endpointsList.setValue(value);

  }
});

ReferencePanel.prototype.refresh = function() {
  var endpoints = this.getValue();

  this.reset();
  this.setValue(endpoints);

};

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

ReferencePanel.prototype.getEndpoints = function() {
  return this.options.filter(this.getValue());
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
      ranked = this.getEndpoints().map(function(endpoint) {


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
