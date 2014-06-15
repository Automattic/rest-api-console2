var Component = require('./component');

LookupPane = Component.extend({
  'max'            : 10,
  'template'       : function(item){return $("<li></li>").text(item); },
  'highlightClass' : 'highlight',
  'defaultValue'   : $(),
  'init'           : function() {
    this.listNode = $("<ol></ol>").appendTo(this.node);
    this.node.on('mousedown', 'li', this.onClick.bind(this));
    this.node.on('mouseenter', 'li', this.onHover.bind(this));
    this.last_index = -1;
  },
  'onChange': function(value, oldValue) {

    if (oldValue) oldValue.removeClass(this.options.highlightClass);

    if (!value) {
      this.last_index = -1;
      return;
    }

    this.last_index = value.index();
    value.addClass(this.options.highlightClass);
  }
});

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

  this.show();

  if (this.last_index === -1) {
    return;
  }

  if (this.last_index > items.length - 1) {
    this.last_index = 0;
  }

  listNode.children().eq(this.last_index).addClass(this.options.highlightClass);

};

LookupPane.prototype.hide = function() {
  this.node.hide();
};

LookupPane.prototype.show = function() {
  this.node.show();
};

LookupPane.prototype.clearResults = function() {
  this.listNode.children().remove();
  this.results = [];
};

LookupPane.prototype.reset = function() {
  this.clearResults();
  this.last_index = -1;
};

LookupPane.prototype.onClick = function(e) {

  e.preventDefault();
  this.setValue($(e.currentTarget));
  this.selectCurrent();
  return false;
};

LookupPane.prototype.selectCurrent = function() {

  var index = this.getValue().index(),
      result = this.results ? this.results[index] : false;

  if (!result) return false;

  this.emit('select', result);

  return true;

};

LookupPane.prototype.highlightNext = function() {
  var current = this.getValue(),
      next = current.next();

    if (next.length === 0) {
      next = this.listNode.children().first();
    }

    this.setValue(next);

};

LookupPane.prototype.highlightPrevious = function() {
  var current = this.getValue(),
      prev = current.prev();

    if (prev.length === 0) {
      prev = this.listNode.children().last();
    }

    this.setValue(prev);

};

LookupPane.prototype.onHover = function(e) {
  this.setValue($(e.currentTarget));
};

module.exports = LookupPane;