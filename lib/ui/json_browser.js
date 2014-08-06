var Component = require('./component'),
    $ = Component.$,
    util = require('./util'),
    stringifyJson = util.stringifyJson;


var JsonBrowser = Component.extend({
  'className' : 'json-browse',
  'init' : function() {
    this.node.on('click', function() {
      console.log("Clicked!");
    });
  },
  'onChange' : function(json) {
    this.node.children().remove();
    render(json).appendTo(this.node);
  }
});

function render(json, recursive) {

  recursive = recursive === true;

  if (!recursive) {
    var node = stringifyJson(json);

    if ($.isPlainObject(json) || $.isArray(json)) {
      node.addClass('expandable');
      node.data('json', json);
    }

    return node;

  }

  if ($.isPlainObject(json)) {
    return renderObject(json);
  }

  if ($.isArray(json)) {
    return renderArray(json);
  }

  return stringifyJson(json);

}

function renderObject(json, recursive) {

  var list = $("<dl></dl>").addClass('browse-object');

  recursive = recursive === true;

  for(var key in json) {
    var node = recursive ? render(json[key]) : util.stringifyJson(json[key]);
    list
      .append($("<dt></dt>").text(key))
      .append($("<dd></dd>").append(node));
  }

  return list;

}

function renderArray(json, recursive) {

  var list = $("<ol></ol>").addClass('browse-array');

  recursive = recursive === true;

  for (var i = 0; i < json.length; i++) {
    var node = recursive ? render(json[i]) : util.stringifyJson(json[i]);
    list.append($("<li></li>").append(render(json[i])));
  }

  return list;

}

module.exports = JsonBrowser;