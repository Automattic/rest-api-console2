var events = require('events'),
    util = require('util'),
    noop = function() {},
    componentOptions = {
      'init'         : noop,
      'beforeChange' : function() { return arguments[0]; },
      'afterChange'  : noop,
      'onChange'     : noop,
      'onReset'      : noop,
      'element'      : 'div',
      'className'    : ''
    },
    $ = require('zepto-browserify').$;

function Component(node, options) {

  events.EventEmitter.apply(this, arguments);

  this.$ = $;

  this.node = $(node);

  this.options = options;

  this.node.addClass(this.options.className);

  if (this.options.init) this.options.init.apply(this, [this.node, this.options]);


  this.setValue(this.options.defaultValue);

  if (this.options.afterInit) this.options.afterInit.apply(this);

}

Component.$ = $;

util.inherits(Component, events.EventEmitter);

Component.prototype.focus = function() {
  this.node.focus();
};

Component.prototype.setValue = function(value) {

  var oldValue = this.value;

  value = this.options.beforeChange.call(this, value);

  if (value === this.value) return this.getValue();

  this.value = value;

  this.options.onChange.call(this, this.value, oldValue);
  this.emit('change', this.value, oldValue);
  this.options.afterChange.call(this, this.value);

  return this.getValue();

};

Component.prototype.getValue = function() {
  return this.value;
};

Component.prototype.reset = function() {
  this.setValue(this.options.defaultValue);
  this.options.onReset.apply(this);
  this.emit('reset');
};

Component.extend = function(defaultOptions) {
  var ctr = function(node, options) {
    if ($.isPlainObject(node)) {
      options = node;
      node = null;
    }
    var opts = {};
    $.extend(opts, componentOptions, defaultOptions, options);

    if (!node) {
      node = $('<' + opts.element + '></' + opts.element + '>');
    }

    Component.call(this, node, opts);
  };

  util.inherits(ctr, Component);

  return ctr;
};

module.exports = Component;
