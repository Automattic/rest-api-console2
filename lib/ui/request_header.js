var Component = require('./component'),
    querystring = require('querystring');
  

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

    var query = querystring.stringify(request.query);

    if (query !== '') {
      this.path.append($('<em></em>').text("?" + query));
    }
  }
});

module.exports = RequestHeader;