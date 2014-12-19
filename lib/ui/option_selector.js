var Component = require('./component'),
    $ = Component.$;

var OptionSelector = Component.extend({
  'className'      : 'option_selector',
  'values'         : [],
  'labelClass'     : 'label',
  'optionsClass'   : 'options',
  'highlightClass' : 'highlight',
  'disabledClass'  : 'disabled',
  'tabIndex'       : 1,
  'label'          : function(value) { return value; },
  'optionLabel'    : function(value, index) {
    return value;
  },
  'init' : function() {

    this.enabled = true;

    this.label = $("<span></span>").addClass(this.options.labelClass).appendTo(this.node);
    this.container = $("<div></div>").addClass(this.options.optionsClass).appendTo(this.node);

    this.container.hide();

    this.node.on('focus', this.onFocus.bind(this));
    this.node.on('blur', this.onBlur.bind(this));
    this.node.on('mouseleave', this.onLeave.bind(this));
    this.node.on('mousedown', this.onDown.bind(this));
    this.node.on('click', this.onClick.bind(this));
    this.node.on('click', 'li', this.onClickOption.bind(this));

    this.keyListener = this.onKeypress.bind(this);

    if (this.options.values.length > 0 && this.options.defaultValue !== false) {
      this.options.defaultValue = this.options.values[0];
    }
    this.open = false;
    this.enable();
    this.setOptions(this.options.values);
    this.reset();
  },
  'onChange' : function(value, oldValue) {
    this.label.text(this.options.label(value ? value : ""));
    this.refreshItems();
  }
});

OptionSelector.prototype.disable = function() {
  this.enabled = false;
  this
    .node.addClass(this.options.disabledClass)
    .attr('tabIndex', null);
  
  this.emit('disabled');
};

OptionSelector.prototype.enable = function() {
  this.enabled = true;
  this
    .node.removeClass(this.options.disabledClass)
    .attr('tabIndex', this.options.tabIndex);
  this.emit('enabled');
};

OptionSelector.prototype.onFocus = function() {
  this.focused = true;
  this.showOptions();
};

OptionSelector.prototype.onBlur = function() {
  this.focused = false;
  this.hideOptions();
};

OptionSelector.prototype.onLeave = function() {
  this.node.blur();
};

OptionSelector.prototype.showOptions = function() {

  if (!this.enabled) return;

  this.open = true;

  this.refreshItems();

  this.container.show();
  this.node.off('keydown', this.keyListener);
  this.node.on('keydown', this.keyListener);

};

OptionSelector.prototype.hideOptions = function() {

  this.open = false;

  this.container.hide();
  this.node.off('keydown', this.keyListener);
};

OptionSelector.prototype.onKeypress = function(e) {
  if (e.which == 38) {
    e.preventDefault();
    this.highlightPrev();
    return false;
  }

  if (e.which == 40) {
    e.preventDefault();
    this.highlightNext();
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

OptionSelector.prototype.onDown = function() {
  this.closeOnClick = this.open;
}

OptionSelector.prototype.onClick = function(e) {
  e.preventDefault();
  if (this.closeOnClick) {
    this.node.blur();
  }
  return false;
};

OptionSelector.prototype.onClickOption = function(e) {
  e.preventDefault();
  var val = this.options.values[$(e.currentTarget).index()];
  this.setValue(val);
  return false;
};

OptionSelector.prototype.setValue = function(v) {

  if (!this.enabled) return;

  Component.prototype.setValue.apply(this, arguments);

};

OptionSelector.prototype.setOptions = function(options) {
  this.options.values = options;

  if (this.options.values.length <= 1) {
    this.disable();
  } else {
    this.enable();
  }

  if (this.open) {
    this.refreshItems();
  }
  
};

OptionSelector.prototype.refreshItems = function() {
  this.removeItems();
  this.addItems();
  this.highlightNext();
};

OptionSelector.prototype.addItems = function() {

  var list = $('<ul></ul>'),
      current = this.getValue(),
      optionLabel = this.options.optionLabel;

  this.options.values.forEach(function(v, i){
    var item = $("<li></li>"),
      label = optionLabel(v, i);

    if(v === current) item.addClass('selected');

    if (typeof label == 'string') {
      item.text(label);
    } else {
      item.append(label);
    }

    list.append(item);
  });

  list.appendTo(this.container);

};

OptionSelector.prototype.removeItems = function() {

  this.container.find('ul').remove();

};

OptionSelector.prototype.getHighlighted = function() {
  return this.container.find('li.' + this.options.highlightClass);
};

OptionSelector.prototype.selectHighlighted = function() {
  var highlighted = this.getHighlighted();

  if (highlighted.length > 0) {
    this.setValue(this.options.values[highlighted.index()]);
  }

};

OptionSelector.prototype.highlightNext = function() {
  var highlighted = this.getHighlighted(),
      next = highlighted.next('li');

  if (next.length === 0) {
    next = this.container.find('li').first();
  }

  highlighted.removeClass(this.options.highlightClass);
  next.addClass(this.options.highlightClass);

};

OptionSelector.prototype.highlightPrev = function() {
  var highlighted = this.getHighlighted(),
      prev = highlighted.prev('li');

  if (prev.length === 0) {
    prev = this.container.find('li').last();
  }

  highlighted.removeClass(this.options.highlightClass);
  prev.addClass(this.options.highlightClass);
  
};

OptionSelector.prototype.toggle = function() {

  var current = this.getValue(),
      i = this.options.values.indexOf(current);

    if (i === this.options.values.length - 1) {
      i = -1;
    }

    i++;
    this.setValue(this.options.values[i]);

};

module.exports = OptionSelector;