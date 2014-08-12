var $ = require('zepto-browserify').$;

function stringifyJson(object, node) {
    if (!node) {
      node = $('<code></code>').addClass('compact');
    }

    if ($.isPlainObject(object)) {
      node.append("{");
      var trailing = "";
      for(var key in object) {
        node.append(trailing);
        trailing = ", ";
        node.append($('<span></span>').addClass('key').text('"' + key + '"')).append(": ");
        stringifyJson(object[key], node);
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
        stringifyJson(object[i], node);

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
  }

module.exports = {
  stringifyJson: stringifyJson
};