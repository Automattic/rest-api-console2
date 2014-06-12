var events = require('events'),
    util = require('util');

function PathField(node, options) {
  events.EventEmitter.apply(this);

  this.node = node;
  this.options =  $.extend({ 'decorators' : '#method,#submit,#search', 'submit' : '#submit', 'search':'#search' }, options);
  this.values = {};

  this.node.on('click', this.options.submit, this.buildPath.bind(this));
  this.node.on('click', this.options.search, this.onSearch.bind(this));
  this.reset();
}

util.inherits(PathField, events.EventEmitter);

PathField.prototype.setValue = function(path) {
  this.clearNodes();

  this.path = path;

  if (!path) {
    return;
  }

  this.node.addClass('endpoint');
  path.parts.forEach(buildNode.bind(this));

  this.focus();

};

PathField.prototype.reset = function() {
  this.setValue(this.options.default_path);
  this.node.removeClass('endpoint');
  this.emit('clear');
};

PathField.prototype.clearNodes = function() {
  this.node.children().not(this.options.decorators).remove();
};

PathField.prototype.buildPath = function() {

  this.emit('submit', this.path.toString(this.values));

};

PathField.prototype.setParam = function(name, value) {
  if(this.values[name] != value) {
    this.values[name] = value;
    this.emit('change', this.path.toString(this.values));
  }
};

PathField.prototype.getParam = function(name) {
  return this.values[name] || "";
};

PathField.prototype.onSearch = function() {
  if (this.path === this.options.default_path) {
    this.emit('search');
  } else {
    this.reset();
    this.focus();
  }
};

PathField.prototype.focus = function() {

  var ele = this.node.children('.param').get(0);

  if (ele) {
    var range = document.createRange(),
        selection = window.getSelection();

    if (ele.firstChild && ele.firstChild.nodeType === document.TEXT_NODE) {
      range.setStartAfter(ele.firstChild);
    } else {
      range.setStart(ele);
    }


    selection.removeAllRanges();
    selection.addRange(range);
  }

};

function buildNode(part) {

  var field = this,
      node = $("<div></div>")
              .text(part.getLabel())
              .addClass(part.getType())
              .attr('contenteditable', part.options.editable)
              .insertBefore(this.node.children(this.options.search));

  if (part.options.editable) {
    node.text(field.getParam(part.name) || part.getLabel());
    node
      .on('keydown', function(e) {
        if (e.which == 13) {
          e.preventDefault();
          field.buildPath();
          return false;
        } else if (e.which == 27) {
          e.preventDefault();
          field.reset();
          return false;
        }
      })
      .on('keyup', function() {
        field.setParam(part.name, node.text());
      })
      .on('focus', function() {
        var value = field.getParam(part.name);
        if (value === '') {
          node.text('');
        }
        
      })
      .on('blur', function() {
        var val = field.getParam(part.name);
        if (!val || val === "") {
          node.text(part.getLabel());
        }
      });
  }

}

module.exports = PathField;
