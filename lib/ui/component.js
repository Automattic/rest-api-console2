var events = require('events'),
    util = require('util'),
    noop = function() {},
    componentOptions = {
      'init'         : noop,
      'beforeChange' : function() { return arguments[0]; },
      'afterChange'  : noop,
      'onChange'     : noop,
      'onReset'      : noop
    };

function Component(node, options) {

  events.EventEmitter.apply(this, arguments);

  this.node = $(node);
  this.options = options;

  if (this.options.init) this.options.init.apply(this);

  this.setValue(this.options.defaultValue);

}

util.inherits(Component, events.EventEmitter);

Component.prototype.setValue = function(value) {

  var oldValue = this.value;

  value = this.options.beforeChange.call(this, value);

  if (value === this.value) return;

  this.value = value;

  this.options.onChange.call(this, this.value, oldValue);
  this.emit('change', this.value, oldValue);
  this.options.afterChange.call(this, this.value);

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
    var opts = {};
    $.extend(opts, componentOptions, defaultOptions, options);

    Component.call(this, node, opts);
  };

  util.inherits(ctr, Component);

  return ctr;
};

module.exports = Component;
