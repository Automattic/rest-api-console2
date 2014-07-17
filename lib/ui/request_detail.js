var Component = require('./component'),
    $ = Component.$,
    RequestHeader = require('./request_header');

var RequestDetail = Component.extend({
  'enabledClass' : 'display',
  'overlayClass' : 'overlay',
  'className' : 'log',
  'init' : function() {
    var self = this;

    this.header = new RequestHeader();
    this.node.attr('tabindex', '-1');
    this.node.removeClass(this.options.enabledClass);

    this.header.node.prepend($('<span></span>').click(this.dismiss.bind(this)));

    this.responseListener = this.onResponse.bind(this);
    this.clickOutsideListener = this.onClickOutside.bind(this);

    this.paneHolder = $('<div></div>').appendTo(this.node);

    this.overlay = $('<div></div>')
                      .addClass(this.options.overlayClass)
                      .appendTo('body');

  },
  'onChange' : function(request) {
    request.once('response', this.responseListener);
    this.header.setValue(request.getValue());
    this.paneHolder.children().remove();
    this.onResponse(request.responseError, request.response);
  }
});

RequestDetail.prototype.onResponse = function(err, response) {
  if (!err && !response) {
    return;
  }

  if (response) {
    $("<pre></pre>")
      .text(JSON.stringify(response, null, "  "))
      .appendTo(this.paneHolder);
  }

};

RequestDetail.prototype.isDisplayed = function() {
  return this.node.hasClass(this.options.enabledClass);
};

RequestDetail.prototype.displayRequest = function(req) {

  this.setValue(req);
  this.header.node.prependTo(this.node);

  if (this.isDisplayed()) {
    return;
  }


  this.node.addClass(this.options.enabledClass);
  this.overlay.addClass(this.options.enabledClass);

  var listener = this.clickOutsideListener;
  

  $('body').on('mousedown', listener);
  // setTimeout(function(e) {
  // }, 20);
  $('body').css({'overflow':'hidden'});

};

RequestDetail.prototype.dismiss = function() {
  this.node.removeClass(this.options.enabledClass);
  this.overlay.removeClass(this.options.enabledClass);

  this.getValue().removeListener('response', this.responseListener);
  $('body').css({'overflow':'auto'});

  $('body').off('mousedown', this.clickOutsideListener);
  this.getValue().node.focus();
};

RequestDetail.prototype.onClickOutside = function(e) {

  if (this.isDisplayed()) {
    var target = $(e.target);

    if (target.closest(this.node).length === 0) {
      e.preventDefault();
      e.stopPropagation();
      this.dismiss();
      return false;
    }
  }

};

module.exports = RequestDetail;