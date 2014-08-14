var Component = require('./component'),
    $ = Component.$,
    util = require('./util'),
    stringifyJson = util.stringifyJson;


var JsonBrowser = Component.extend({
  'className' : 'json-browse',
  'compact' : false,
  'label' : '',
  'onChange' : function(json) {
    this.node.children().remove();


    if (this.options.compact === true) {
      $("<ol></ol>").append(buildRow(this.options.label, json)).appendTo(this.node);
    } else {
      render(json, true).appendTo(this.node);
    }

  }
});

function render(json, recursive) {

  recursive = recursive === true;

  if (!recursive) {
    var node = stringifyJson(json);

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

  var list = $("<ol></ol>").addClass('browse-object');

  recursive = recursive === true;

  for(var key in json) {
    list.append(buildRow($('<code></code>').text('"' + key + '"').append(': '), json[key], recursive));
  }

  return list;

}

function renderArray(json, recursive) {

  var list = $("<ol></ol>").addClass('browse-array');

  recursive = recursive === true;

  for (var i = 0; i < json.length; i++) {
    list.append(buildRow($('<code></code>').text(i).append(': '), json[i]));
  }

  return list;

}

function buildRow(key, value, recursive) {
  var row = $('<li></li>');

  row.append($("<span></span>").addClass('key').append(key))
     .append(render(value, recursive));

  makeExpandable(row, value);

  return row;
}

function isEmptyJson(json) {
  if ($.isArray(json) && json.length === 0) {
    return true;
  }

  for (var key in json) {
    if (json.hasOwnProperty(key)) return false;
  }

  return true;
}

function makeExpandable(node, json) {
  if (!$.isArray(json) && !$.isPlainObject(json)) {
    return;
  }

  if (isEmptyJson(json)) {
    return;
  }


  var compressed = node.find('.compact'),
      expanded = null;

  node.addClass('closed');

  node.on('click', 'span.key, .compact', function(e) {

    e.stopPropagation();
    e.preventDefault();

    if (expanded === null) {
      expanded = render(json, true);
    }

    if (node.hasClass('open')) {
      node.removeClass('open').addClass('closed');
      expanded.replaceWith(compressed);
    } else {
      node.removeClass('closed').addClass('open');
      compressed.replaceWith(expanded);
    }
    return false;
  });

}

module.exports = JsonBrowser;