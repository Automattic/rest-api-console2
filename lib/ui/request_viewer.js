var Component = require('./component'),
    querystring = require('querystring');

var RequestViewer = Component.extend({
  'container'     : '#requests',
  'loadingClass'  : 'loading',
  'completeClass' : 'complete',
  'className'     : 'log',
  'errorClass'    : 'error',
  'init' : function() {

    this.container = $(this.options.container);

    this.node.attr('tabindex', '0');

    this.node.on('keypress', this.onKeypress.bind(this));

    this.node.append($("<div><header><code></code><code></code></header></div>"));

    this.header = this.node.find('header');
    this.disclosure = $('<div></div>').insertAfter(this.header.parent());

    var codes = this.header.find('code');

    this.method = codes.eq(0);
    this.path   = codes.eq(1);

    this.node.prependTo(this.container);

    this.onResponse = this.onResponse.bind(this);

    setTimeout(this.node.focus.bind(this.node), 1);

  },
  'onChange' : function(request) {

    this.method.text(request.method || 'GET');
    this.path.text(request.path);

    var query = querystring.stringify(request.query);

    if (query !== '') {
      this.path.append($('<em></em>').text("?" + query));
    }

  }
});

RequestViewer.prototype.sent = function() {

  this.start_time = ts();

  this.node.addClass(this.options.loadingClass);

  this.disclosure.append($('<div class="throbber"><div></div></div>'));

};

RequestViewer.prototype.onResponse = function(err, response) {

  var status = $('<span></span>').appendTo(this.header);

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
    $('<div></div>').append(this.stringify(body)).addClass('compact').appendTo(this.header.parent());
  }

  this.disclosure.children().remove();

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
  }

  if (prevent) {
    e.preventDefault();
    return false;
  }
};

function ts() {
  return (new Date()).getTime();
}


module.exports = RequestViewer;