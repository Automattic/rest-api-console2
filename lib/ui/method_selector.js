var events = require('events'),
    util = require('util');

function MethodSelector(node, options) {
  events.EventEmitter.apply(this);

  this.node = node;

  this.options = $.extend({
    'values'         : ['GET', 'POST'],
    'container'      : this.node,
    'label'          : this.node,
    'highlightClass' : 'highlight',
    'disabledClass'  : 'disabled'
  }, options);

  this.enabled = true;

  this.container = this.options.container;

  this.container.hide();

  this.node.on('focus', this.onFocus.bind(this));
  this.node.on('blur', this.onBlur.bind(this));
  this.node.on('mouseleave', this.onLeave.bind(this));
  this.node.on('click', this.onClick.bind(this));
  this.node.on('mousedown', 'li', this.onClickOption.bind(this));

  this.keyListener = this.onKeypress.bind(this);

  this.setValue(this.options.values[0]);

  this.emit('enabled');

}

util.inherits(MethodSelector, events.EventEmitter);

MethodSelector.prototype.disable = function() {
  this.enabled = false;
  this.emit('disabled');
};

MethodSelector.prototype.enable = function() {
  this.enabled = true;
  this.emit('enabled');
};

MethodSelector.prototype.onFocus = function() {
  this.focused = true;
  this.showOptions();
};

MethodSelector.prototype.onBlur = function() {
  this.focused = false;
  this.hideOptions();
};

MethodSelector.prototype.onLeave = function() {
  this.node.blur();
};

MethodSelector.prototype.showOptions = function() {

  if (!this.enabled) return;

  this.refreshItems();

  this.container.show();
  $(document).on('keydown', this.keyListener);

};

MethodSelector.prototype.hideOptions = function() {
  this.container.hide();
  $(document).off('keydown', this.keyListener);
};

MethodSelector.prototype.onKeypress = function(e) {

  if (e.which == 38) {
    e.preventDefault();
    return false;
  }

  if (e.which == 40) {
    e.preventDefault();
    return false;
  }

  if (e.which == 13) {
    e.preventDefault();
    e.stopImmediatePropagation();
    this.selectHighlighted();
    return false;
  }

  if (e.which == 27) {
    this.node.blur();
    e.preventDefault();
    return false;
  }

};

MethodSelector.prototype.onClick = function(e) {
  e.preventDefault();
  this.showOptions();

  return false;

};

MethodSelector.prototype.onClickOption = function(e) {

  var val = $(e.currentTarget).text();

  this.setValue(val);

  this.hideOptions();
};

MethodSelector.prototype.setValue = function(v) {

  if (!this.enabled) return;

  var current = this.getValue();

  if (v === current) return;

  this.options.label.text(v);
  this.refreshItems();

  this.emit('change');

};

MethodSelector.prototype.getValue = function() {
  return this.options.label.text();
};

MethodSelector.prototype.refreshItems = function() {
  this.removeItems();
  this.addItems();
  this.highlightNext();
};

MethodSelector.prototype.addItems = function() {

  var list = $('<ul></ul>'),
      current = this.getValue();

  this.options.values.forEach(function(v){
    if(v === current) return;

    list.append($("<li></li>").text(v));
  });

  list.appendTo(this.container);

};

MethodSelector.prototype.removeItems = function() {

  this.container.find('ul').remove();

};

MethodSelector.prototype.getHighlighted = function() {
  return this.container.find('li.' + this.options.highlightClass);
};

MethodSelector.prototype.selectHighlighted = function() {
  var highlighted = this.getHighlighted();

  if (highlighted.length > 0) {
    this.setValue(highlighted.text());
  }

};

MethodSelector.prototype.highlightNext = function() {
  var highlighted = this.getHighlighted(),
      next = highlighted.next();

  if (highlighted.length === 0) {
    next = this.container.find('li').first();
  }

  highlighted.removeClass(this.options.highlightClass);
  next.addClass(this.options.highlightClass);

};

MethodSelector.prototype.highlightPrev = function() {
  var highlighted = this.getHighlighted(),
      prev = highlighted.prev();

  if (highlighted.length === 0) {
    prev = this.container.find('li').last();
  }

  highlighted.removeClass(this.options.highlightClass);
  prev.addClass(this.options.highlightClass);
  
};

MethodSelector.prototype.reset = function() {
  this.setValue(this.options.values[0]);
};

MethodSelector.prototype.toggle = function() {

  var current = this.getValue(),
      i = this.options.values.indexOf(current);

    if (i === this.options.values.length - 1) {
      i = -1;
    }

    i++;
    this.setValue(this.options.values[i]);

};

module.exports = MethodSelector;