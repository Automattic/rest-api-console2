var events = require('events'),
    util = require('util'),
    componentOptions = {
      'init' : function() {}
    };

function Component(node, options) {

  events.EventEmitter.apply(this, arguments);

  this.node = node;
  this.options = options;

  if (this.options.init) this.options.init.apply(this);

}

util.inherits(Component, events.EventEmitter);

module.exports = Component;

Component.extend = function(defaultOptions) {
  var ctr = function(node, options) {
    var opts = {};
    $.extend(opts, componentOptions, defaultOptions, options);

    Component.call(this, node, opts);
  };

  util.inherits(ctr, Component);

  return ctr;
};