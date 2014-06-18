var Component = require('./component'),
    querystring = require('querystring');

var RequestViewer = Component.extend({
  'container' : '#requests',
  'loadingClass' : 'loading',
  'errorClass' : 'error',
  'init' : function() {

    this.container = $(this.options.container);
    this.node.append($("<header><code></code><code></code><span></span></header>"));

    this.header = this.node.find('header');
    var codes = this.header.find('code');

    this.method = codes.eq(0);
    this.path = codes.eq(1);
    this.query = codes.eq(2);

    this.status = this.node.find('header > span');
    this.node.prependTo(this.container);

    this.onResponse = this.onResponse.bind(this);

  },
  'onChange' : function(request) {

    this.method.text(request.method);
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

};

RequestViewer.prototype.onResponse = function(err, response) {

  this.node.removeClass(this.options.loadingClass);

  this.end_time = ts();
  this.ellapsed = this.end_time - this.start_time;

  var body = null;

  if (err) {
    console.error("Error", err);
    this.node.addClass(this.options.errorClass);
    if (err.errorType !== 'abort') {
      this.status.text(err.status + " – " + err.error);

    } else {
      this.status.text("Error");
    }
    body = err.body;
  } else {
    this.status.text(this.ellapsed + 'ms');
    body = response;
  }

  if (body) {
    $('<div></div>').append(this.stringify(body)).addClass('compact').appendTo(this.node);
  }



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

function ts() {
  return (new Date()).getTime();
}


module.exports = RequestViewer;