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

  if (err) {
    console.error("Error", err);
    this.node.addClass(this.options.errorClass);
    this.status.text(err.statusCode >= 400 ? err.statusCode : 404);
  } else {
    console.log("Response", response);
    this.status.text(this.ellapsed + 'ms');
  }



};

function ts() {
  return (new Date()).getTime();
}

module.exports = RequestViewer;