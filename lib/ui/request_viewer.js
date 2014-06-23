var Component = require('./component'),
    RequestHeader = require('./request_header'),
    fn = require('../fn');

var RequestViewer = Component.extend({
  'container'     : '#requests',
  'downloadLabel' : 'Download',
  'loadingClass'  : 'loading',
  'completeClass' : 'complete',
  'className'     : 'log',
  'errorClass'    : 'error',
  'init' : function() {

    this.container = $(this.options.container);

    this.node.attr('tabindex', '0');

    this.node.on('keypress', this.onKeypress.bind(this));
        
    this.node.on('click', this.onClick.bind(this));
    this.node.on('focus', fn.arglock(this.emit.bind(this), 'select', this));

    this.header = new RequestHeader();// this.node.find('header');
    this.disclosure = $('<div></div>');

    this.node.append(
      $("<div></div>").append(this.header.node).add(this.disclosure)
    );

    this.node.prependTo(this.container);

    this.onResponse = this.onResponse.bind(this);

    setTimeout(this.node.focus.bind(this.node), 1);

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
      status.text(err.status + " – " + err.error);
    } else {
      status.text("Client Error");
    }
    body = err.body;
  } else {
    status.text(this.ellapsed + 'ms');
    body = response;
  }

  if (body) {
    var download = $('<a></a>')
                      .attr('title', this.options.downloadLabel)
                      .attr('href', 'data:application/json,' + encodeURIComponent(JSON.stringify(body, null, "\t")))
                      .attr('download', 'response.json')
                      .attr('target', '_blank');

    $('<div></div>')
      .append(download.add(this.stringify(body)))
      .addClass('compact').appendTo(this.header.node.parent());
  }

  this.disclosure.children().remove();

  this.emit('response', err, response);

};

RequestViewer.prototype.stringify = function(object, node) {

  if (!node) {
    node = $('<code></code>').addClass('compact');
  }

  if ($.isPlainObject(object)) {
    node.append("{");
    var trailing = "";
    for(var key in object) {
      node.append(trailing);
      trailing = ", ";
      node.append($('<span></span>').addClass('key').text(key + ': '));
      // node.append(this.stringify(object[key]));
      this.stringify(object[key], node);
      if (node.text().length > 200) {
        node.append(" …}");
        return node;
      }
    }
    node.last().remove();
    node.append('}');
  } else if ($.isArray(object)) {
    node.append('[');
    for (var i = 0; i < object.length; i++) {
      if (i > 0) {
        node.append(', ');
      }
      this.stringify(object[i], node);

      if (node.text().length > 200) {
        node.append(' …]');
        return node;
      }

    }
    node.append(']');
  } else if (typeof object == 'string') {
    node.append($("<span></span>").addClass('string').text('"' + object.replace(/"/g, "\\\"") + '"'));
  } else {
    node.append($("<span></span>").addClass(typeof object).text(object));
  }

  return node;

};

RequestViewer.prototype.onKeypress = function(e) {

  var prevent = false;

  if (e.which == 106) { // j
    prevent = true;
    this.node.next().focus();
  } else if (e.which == 107) { // k
    prevent = true;
    this.node.prev().focus();
  } else if (e.which == 13 || e.which == 32) { // return or space
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

}

function ts() {
  return (new Date()).getTime();
}


module.exports = RequestViewer;