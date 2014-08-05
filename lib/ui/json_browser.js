var Component = require('./component'),
    $ = Component.$;


var JsonBrowser = Component.extend({
  'init' : function() {
    this.node.on('click', function() {
      console.log("Clicked!");
    });
  },
  'onChange' : function(json) {
    this.node.children().remove();
    renderObject(json, false).appendTo(this.node);
  }
});

function render(json) {

  if (json === null) {
    return $("<em></em>").text("null").addClass('type-null');
  }

  if (json === false) {
    return $("<em></em>").text('false').addClass('type-bool');
  }

  if (json === true) {
    return $("<em></em>").text('true').addClass('type-bool');
  }

  if ($.isPlainObject(json)) {
    return renderObject(json);
  }

  if ($.isArray(json)) {
    return renderArray(json);
  }

  if (typeof json == 'string') {
    return $("<span></span>").text(json);
  }

  if (typeof json == 'number') {
    return $("<em></em>").text(json).addClass('type-number');
  }

  return $("<em></em>").text("Not implemented (" + (typeof json) + "): " + JSON.stringify(json)).css('color', 'red');
}

function renderObject(json, recursive) {

  var list = $("<dl></dl>");

  recursive = arguments.length > 1 ? recursive === true : true;

  for(var key in json) {
    var node = recursive ? render(json[key]) : $('<em></em>').text('preview it');
    list
      .append($("<dt></dt>").text(key))
      .append($("<dd></dd>").append(node));
  }

  return list;

}

function renderArray(json) {

  var list = $("<ol></ol>");

  for (var i = 0; i < json.length; i++) {
    list.append($("<li></li>").append(render(json[i])));
  }

  return list;

}

module.exports = JsonBrowser;