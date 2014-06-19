var Component = require('./component'),
    LookupPane = require('./lookup_pane'),
    fn = require('../fn'),
    noop = function(){},
    util = require('util');


var PathField = Component.extend({
  'decorators'  :'#method,#submit,#search,#parts,#lookup',
  'submit'      :'#submit',
  'search'      :'#search',
  'container'   :'#parts',
  'lookup'      :'#lookup',
  'onSearch'    :noop,
  'onSelect'    :noop,
  'itemTemplate':function(item){
    return $("<li></li>").text("item");
  },
  'init':function() {
    this.values = {};

    this.node.on('click', this.options.submit, this.buildPath.bind(this));
    this.node.on('click', this.options.search, this.onSearch.bind(this));

    this.node.on('keypress', this.options.submit, this.onSubmitKeypress.bind(this));

    this.partsNode = this.node.find(this.options.container);

    this.lookupPane = new LookupPane($("#lookup"), {
      template: this.options.itemTemplate
    });

    this.last_query = "";
    this.cancel_search = noop;

    this.search = fn.rateLimit(200, (function(q){
      var results = this.options.onSearch(q);
      this.lookupPane.displayResults(results);
    }).bind(this));

    this.lookupPane.on('select', this.options.onSelect);

    this.keyListener = this.onKeydown.bind(this);

    $(document).on('keydown', this.onKeydown.bind(this));
  },
  'onChange' : function(path) {

    if (!path) {
      return;
    }

    this.clearNodes();

    if (this.hasSelection()) {
     this.node.addClass('endpoint');
    } else {
      this.node.removeClass('endpoint');
    }

    this.focusable_parts = [];
    path.parts.forEach(buildNode.bind(this));

    this.focus();

    if (this.hasSelection()) {
      this.lookupPane.hide();
    } else {
      this.lookupPane.show();
    }

    this.last_query = "";
  }
});

PathField.prototype.clearNodes = function() {
  this.partsNode.children().not(this.options.decorators).remove();
};

PathField.prototype.hasSelection = function() {
  return this.options.defaultValue !== this.value;
};

PathField.prototype.buildPath = function() {

  this.emit('submit', this.value.toString(this.values));

};

PathField.prototype.setParam = function(name, value) {
  if(this.values[name] != value) {
    this.values[name] = value;

    this.performSearch();

  }
};

PathField.prototype.performSearch = function() {

  if (this.hasSelection()) return;

  var query = decodeURI(this.value.toString(this.values));

  if (query === "") {
    this.last_query = "";
    this.cancel_search();
    this.lookupPane.reset();
    return;
  }

  if (this.last_query === query) {
    return;
  }

  this.last_query = query;

  this.cancel_search();
  this.cancel_search = this.search(query);

};

PathField.prototype.getParam = function(name) {
  return this.values[name] || "";
};

PathField.prototype.onSearch = function() {
  if (!this.hasSelection()) {
    this.emit('search');
  } else {
    this.reset();
    this.focus();
  }
};

PathField.prototype.focus = function() {

  var part = this.focusable_parts[0];

  if (part) {
    $(part.node).focus();
  } else {
    this.node.find(this.options.submit).focus();
  }

};

PathField.prototype.updateRange = function(part, node) {
  var range = document.createRange(),
      selection = window.getSelection(),
      value = this.getParam(part.name);

  if (value === "") {
    range.setStart(node, 0);
  } else {
    range.setStartAfter(node.firstChild);
  }

  selection.removeAllRanges();
  selection.addRange(range);
};

PathField.prototype.onKeydown = function(e) {

  var hasSelection = this.hasSelection();


  if (e.which == 13) {

    if (!hasSelection && this.lookupPane.selectCurrent()) {
      e.preventDefault();
      return false;
    }

  }

  if (e.which == 27) {

    if (hasSelection) {
      e.preventDefault();
      this.reset();
    } else {
      this.lookupPane.reset();
      this.lookupPane.hide();
    }

    return false;
  }

};

PathField.prototype.onSubmitKeypress = function(e) {

  if (e.which == 13 || e.which == 32) { // return or space
    this.buildPath();
  }

};

PathField.prototype.onFocusPart = function(part, node) {
  clearTimeout(this.blur_timeout);
  if (!this.hasSelection()) {
    this.lookupPane.show();
  }

  this.updateRange(part, node);
};

PathField.prototype.onBlurPart = function(part, node) {
  var field = this;
  this.blur_timeout = setTimeout(function(){
    if (!field.hasSelection()) {
      field.lookupPane.hide();
    }
  }, 10);
};

function buildNode(part) {

  var field = this,
      node = $("<div></div>")
              .text(part.getLabel())
              .addClass(part.getType())
              .insertBefore(this.partsNode.children(this.options.search));

  if (part.options.editable) {
    field.focusable_parts.push({node:node.get(0), part:part});
    node.text(field.getParam(part.name));
    node
      .attr('contenteditable', true)
      .attr("tabindex", 1)
      .attr("data-label", part.getLabel())
      .on('paste', function(e){
        e.preventDefault();
        document.execCommand('insertText', false, e.clipboardData.getData('text/plain'));
        return false;
      })
      .on('keydown', function(e) {
        var hasSelection = field.hasSelection();
        if (e.which == 38 && !hasSelection) { // up
          e.preventDefault();
          field.lookupPane.highlightPrevious();
          return;
        } else if (e.which == 40 && !hasSelection) { // down
          e.preventDefault();
          field.lookupPane.highlightNext();
          return;
        } else if (e.which == 13) { // return
          e.preventDefault();
          if (hasSelection || !field.lookupPane.selectCurrent()){
            field.buildPath();
            field.lookupPane.hide();
          }
          return false;
        }
      })
      .on('keypress', function(e) {
        if (e.charCode > 0 && !node.hasClass('modified')) {
          node.addClass('modified');
        }
      })
      .on('keyup', function() {
        field.setParam(part.name, node.text());
        if (field.getParam(part.name) === '') {
          node.removeClass('modified');
          node.html('');
        }
      })
      .on('focus', function() {
        var value = field.getParam(part.name);

        if (part.options.meta) {
          field.emit('tip', $.extend({name:part.name,context:node,position:'below'}, part.options.meta));
        }

        if (value !== '') {
          node.addClass('modified');
        }
        field.focused = true;
        field.onFocusPart(part, node.get(0));
      })
      .on('blur', function() {
        var val = field.getParam(part.name);
        field.focused = false;
        field.onBlurPart(part, node);
      });
  }

}

module.exports = PathField;
