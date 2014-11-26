var Component = require('./component'),
    querystring = require('querystring'),
    $ = Component.$;
  

var RequestHeader = Component.extend({
  'element' : 'header',
  'init' : function() {
    this.node.append('<code></code><code></code>');

    var codes = this.node.find('code');

    this.method = codes.eq(0);
    this.path = codes.eq(1);

  },
  'onChange' : function(request) {

    this.method.text(request.method || 'GET');
    this.path.text(request.path);

    var query = $.isPlainObject(request.query) ? querystring.stringify(request.query) : request.query;

    if (query && query !== '') {
      this.path.append($('<em></em>').text("?" + query));
    }
  }
});

module.exports = RequestHeader;