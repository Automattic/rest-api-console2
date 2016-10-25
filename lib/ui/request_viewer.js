var Component = require('./component'),
    $ = Component.$,
    RequestHeader = require('./request_header'),
    JsonBrowser = require('./json_browser'),
    fn = require('fn'),
    util = require('./util');

var RequestViewer = Component.extend({
  'container'     : '#requests',
  'downloadLabel' : 'Download',
  'loadingClass'  : 'loading',
  'completeClass' : 'complete',
  'className'     : 'log',
  'errorClass'    : 'error',
  'init' : function() {

    this.container = $(this.options.container);

    this.header = new RequestHeader();
    this.disclosure = $('<div></div>');

    this.node.append(
      $("<div></div>").append(this.header.node).add(this.disclosure)
    );

    this.node.prependTo(this.container);

    this.onResponse = this.onResponse.bind(this);

  },
  'onChange' : function(request) {
    this.header.setValue(request);
  }
});

RequestViewer.prototype.sent = function() {

  this.start_time = ts();

  this.node.addClass(this.options.loadingClass);

  this.disclosure.append($('<div class="throbber"><div></div></div>'));

};

RequestViewer.prototype.onResponse = function(err, response) {

  var status = $('<span></span>').appendTo(this.header.node);

  this.response = response;
  this.responseError = err;

  this.node
        .removeClass(this.options.loadingClass)
        .addClass(this.options.completeClass);

  this.end_time = ts();
  this.ellapsed = this.end_time - this.start_time;

  var body = null;

  if (err) {
    this.node.addClass(this.options.errorClass);
    if (err.errorType !== 'abort') {
      status.text(err.status + " – " + (err.error || 'unknown error'));
    } else {
      status.text("Client Error");
    }
    body = err.body || {};
    if (err.status) {
      body.status = err.status;
    }
    if (err.error) {
      body.code = err.error;
    }
    if (err.message) {
      body.message = err.message;
    }
  } else {
    status.text(this.ellapsed + 'ms');
    body = response;
  }

  this.disclosure.children().remove();

  if (body) {
    var download = $('<a></a>')
                      .attr('title', this.options.downloadLabel)
                      .attr('href', 'data:application/json;charset=UTF-8,' + encodeURIComponent(JSON.stringify(body, null, "\t")))
                      .attr('download', this.getDownloadFileName())
                      .attr('target', '_blank'),
        browser = new JsonBrowser();


    this.disclosure.append(download);

    browser.setValue(body);

    $('<div></div>')
      .append(browser.node)
      .addClass('body').appendTo(this.header.node.parent());
  }


  this.emit('response', err, response);

};

RequestViewer.prototype.stringify = util.stringifyJson;

RequestViewer.prototype.getDownloadFileName = function() {
  var path = this.getValue().path;

  if (path.indexOf("/") === 0) {
    path = path.slice(1);
  }

  return path.replace(/\//g, '-') + '.json';
};

RequestViewer.prototype.onKeydown = function(e) {

  var prevent = false;

  if (e.which == 74 || e.which == 40) { // j
    prevent = true;
    this.node.next().focus();
  } else if (e.which == 75 || e.which == 38) { // k
    prevent = true;
    this.node.prev().focus();
  } else if (e.which == 13 || e.which == 32 || e.which == 39) { // return or space or right
    prevent = true;
    this.emit('open', this);
  }

  if (prevent) {
    e.preventDefault();
    return false;
  }
};

RequestViewer.prototype.onClick = function(e) {

  if ($(e.target).is('a[download]')) {
    // continue;
  } else {
    e.preventDefault();
    this.emit('open', this);
    return false;
  }

};

function ts() {
  return (new Date()).getTime();
}


module.exports = RequestViewer;
