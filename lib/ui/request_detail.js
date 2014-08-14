var Component = require('./component'),
    ListComponent = require('./list_component'),
    $ = Component.$,
    RequestHeader = require('./request_header'),
    JsonBrowser = require('./json_browser');

var RequestDetail = Component.extend({
  'enabledClass' : 'display',
  'overlayClass' : 'overlay',
  'className' : 'log',
  'types' : {
    'Browse' : (function() {
      var browser = new JsonBrowser();
      return function(request) {
        browser.setValue(request.response);
        return browser.node;
      };
    })(),
    'Raw' : function(request) {
      return $("<pre></pre>")
        .text(JSON.stringify(request.response, null, "  "));
    }
  },
  'init' : function() {
    var self = this;

    this.header = new RequestHeader();
    this.node.attr('tabindex', '-1');
    this.node.removeClass(this.options.enabledClass);

    this.header.node.prepend($('<span></span>').click(this.dismiss.bind(this)));

    this.responseListener = this.onResponse.bind(this);
    this.clickOutsideListener = this.onClickOutside.bind(this);

    this.overlay = $('<div></div>')
                      .addClass(this.options.overlayClass)
                      .appendTo('body');

    this.types = [];

    for(var type in this.options.types) {
      this.types.push(type);
    }

    this.menu = new ListComponent({defaultValue: this.types, className: 'view-segment'});
    this.node.append(this.menu.node);

    this.menu.on('select', updateResponseView.bind(this));

    this.view = $('<div></div>').appendTo(this.node).addClass('viewer');

  },
  'onChange' : function(request) {
    request.once('response', this.responseListener);
    this.header.setValue(request.getValue());
    this.selectedType = null;
    this.rendered = {};
    this.onResponse(request.responseError, request.response, request.xhr);
  }
});

function updateResponseView(type) {

  this.view.children().remove();

  if (!this.rendered[type]) {
    this.rendered[type] = this.options.types[type](this.getValue());
  }

  this.view.append(this.rendered[type]);

}

RequestDetail.prototype.onResponse = function(err, response) {
  if (!err && !response) {
    return;
  }

  if (response) {
    this.menu.reselectSelectedItem();
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