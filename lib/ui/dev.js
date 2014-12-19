var Component = require('./component'),
    $ = Component.$,
    fn = require('fn');

var Dev = Component.extend({
  'defaultValue' : false,
  'sequence' : [38, 38, 40, 40, 37, 39, 37, 39, 66, 65],
  'init' : function() {
    this.wait = fn.rateLimit(1000, timeout.bind(this));
    this.keyListener = keyListener.bind(this);
    this.cancelTimeout = function(){};
    this.reset();
    $(document).on('keydown', this.keyListener);
  },
  'onChange' : function(dev) {
    if (dev) {
      $(document).off('keydown', this.keyListener);
    }
  }
});

Dev.prototype.filterEndpoints = function(endpoints) {
  var isDev = this.getValue();

  if (isDev) {
    return endpoints;
  }

  return endpoints.filter(function(endpoint) {
    return endpoint.group != "__do_not_document";
  });
};

Dev.prototype.reset = function() {
  this.sequence = this.options.sequence.slice();
  this.cancelTimeout();
};

Dev.prototype.success = function() {
  this.setValue(true);
};

function keyListener(e) {
  this.cancelTimeout = this.wait();

  if (e.which === this.sequence[0]) {
    this.sequence.shift();
    if (this.sequence.length === 0) {
      this.success();
    }
  } else {
    this.reset();
  }
}

function timeout() {
  this.reset();
}

module.exports = Dev;