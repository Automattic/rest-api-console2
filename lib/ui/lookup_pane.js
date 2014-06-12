var events = require('events'),
    util = require('util');

function LookupPane(node, options) {
  events.EventEmitter.apply(this);
  this.node = node;
  this.options = $.extend({
    'max'            : 10,
    'template'       : function(item){return $("<li></li>").text(item); },
    'highlightClass' : 'highlight'
  }, options);

  this.listNode = $("<ol></ol>").appendTo(this.node);
  this.node.on('click', 'li', this.onClick.bind(this));
  this.node.on('mouseenter', 'li', this.onHover.bind(this));
  this.last_index = 0;
}

util.inherits(LookupPane, events.EventEmitter);

LookupPane.prototype.displayResults = function(results) {

  var listNode = this.listNode,
      template = this.options.template;

  this.clearResults();

  this.results = results.slice(0,this.options.max);

  var items = $([]);
  this.results.forEach(function(item) {
    items = items.add(template(item));
  });

  listNode.append(items);

  if (this.last_index > items.length - 1) {
    this.last_index = items.length - 1;
  }

  listNode.children().eq(this.last_index).addClass(this.options.highlightClass);

};

LookupPane.prototype.hide = function() {
  this.clearResults();
};

LookupPane.prototype.clearResults = function() {
  this.listNode.children().remove();
  this.results = [];
};

LookupPane.prototype.onClick = function(e) {

  e.preventDefault();
  this.selectHighlighted();
  return false;
};

LookupPane.prototype.selectHighlighted = function() {

  var index = this.getHighlighted().index(),
      result = this.results[index];

  if (!result) return false;

  this.emit('select', result);
  this.clearResults();

  this.last_index = 0;

  return true;

};

LookupPane.prototype.getHighlighted = function() {
  return this.listNode.find('.' + this.options.highlightClass);
};

LookupPane.prototype.highlightNext = function() {
  var current = this.getHighlighted(),
      next = current.next();

    current.removeClass(this.options.highlightClass);

    if (next.length === 0) {
      next = this.listNode.children().first();
    }

    next.addClass(this.options.highlightClass);

    this.last_index = next.index();

};

LookupPane.prototype.highlightPrevious = function() {
  var current = this.getHighlighted(),
      prev = current.prev();

    current.removeClass(this.options.highlightClass);

    if (prev.length === 0) {
      prev = this.listNode.children().last();
    }

    prev.addClass(this.options.highlightClass);

    this.last_index = prev.index();
};

LookupPane.prototype.onHover = function(e) {
  var current = this.getHighlighted(),
      target = $(e.currentTarget);

  if (target.hasClass(this.options.highlightClass)) return;

  current.removeClass(this.options.highlightClass);
  target.addClass(this.options.highlightClass);

  this.last_index = target.index();

};

module.exports = LookupPane;