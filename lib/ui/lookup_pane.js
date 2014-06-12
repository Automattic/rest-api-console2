var events = require('events'),
    util = require('util');

function LookupPane(node, options) {
  events.EventEmitter.apply(this);
  this.node = node;
  this.options = $.extend({ 'max' : 10, 'fuck' : 'me', 'template': function(item){ return $("<li></li>").text(item); }}, options);
  this.listNode = $("<ol></ol>").appendTo(this.node);
  this.node.on('click', 'li', this.onClick.bind(this));
}

util.inherits(LookupPane, events.EventEmitter);

LookupPane.prototype.displayResults = function(results) {

  var listNode = this.listNode,
      template = this.options.template;

  this.clearResults();

  this.results = results.slice(0,this.options.max);
  this.results.forEach(function(item) {
    listNode.append(template(item));
  });

};

LookupPane.prototype.hide = function() {
  this.clearResults();
};

LookupPane.prototype.clearResults = function() {
  this.listNode.children().remove();
  this.results = [];
};

LookupPane.prototype.onClick = function(e) {

  var index = $(e.currentTarget).index();

  e.preventDefault();

  this.emit('select', this.results[index]);
  this.clearResults();
};

module.exports = LookupPane;