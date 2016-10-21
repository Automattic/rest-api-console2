var Component = require('./component'),
    querystring = require('querystring'),
    apiFactory = require('../api'),
    $ = Component.$;


var RequestHeader = Component.extend({
  'element' : 'header',
  'init' : function() {
    this.apiNode = $('<code></code>').appendTo(this.node);
    this.method = $('<code></code>').appendTo(this.node);
    this.path = $('<code></code>').appendTo(this.node);
  },
  'onChange' : function(request) {
    var api = apiFactory.get(request.api);
    this.apiNode.text(api.name);
    this.method.text(request.method || 'GET');
    var pathText = request.version + request.path;
    this.path.text(pathText);

    var query = $.isPlainObject(request.query) ? querystring.stringify(request.query) : request.query;

    if (query && query !== '') {
      this.path.append($('<em></em>').text("?" + query));
    }
  }
});

module.exports = RequestHeader;
