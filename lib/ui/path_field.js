var Component = require('./component'),
    $ = Component.$,
    LookupPane = require('./lookup_pane'),
    fn = require('fn'),
    noop = function(){},
    util = require('util');


var PathField = Component.extend({
  'decorators'  :'#method,#submit,#search,#parts,#lookup',
  'submit'      :'#submit',
  'search'      :'#search',
  'container'   :'#parts',
  'lookup'      :'#lookup',
  'activeClass' :'active',
  'onSearch'    :noop,
  'onSelect'    :noop,
  'itemTemplate':function(item){
    return $("<li></li>").text("item");
  },
  'init':function() {
    this.values = {'path':''};

    this.node.on('click', this.options.submit, this.buildPath.bind(this));
    this.node.on('click', this.options.search, this.onSearch.bind(this));

    this.node.on('keydown', this.options.submit, this.detectActive.bind(this));
    this.node.on('keypress', this.options.submit, this.onSubmitKeypress.bind(this));

    this.partsNode = this.node.find(this.options.container);

    this.lookupPane = new LookupPane($(this.options.lookup), {
      template: this.options.itemTemplate
    });

    this.last_query = null;
    this.cancel_search = noop;


    this.search = fn.rateLimit(200, (function(q){
      this.options.onSearch(q, fn.arglock(this.onResults, q).bind(this));
    }).bind(this));

    this.lookupPane.on('select', this.options.onSelect);

    this.keyListener = this.onKeydown.bind(this);

    $(document).on('keydown', this.keyListener);
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

    this.last_query = null;
  }
});

PathField.prototype.reset = function() {

  if (this.hasSelection()) {
    Component.prototype.reset.apply(this);
  } else {
    this.last_query = null;
    debug_on_search = true;
    this.cancel_search();
    this.lookupPane.reset();
    this.lookupPane.hide();
  }

};

PathField.prototype.clearNodes = function() {
  this.partsNode.children().not(this.options.decorators).remove();
};

PathField.prototype.hasSelection = function() {
  return this.options.defaultValue !== this.value;
};

PathField.prototype.hasPath = function() {

  return this.value.toString(this.values) !== "";

};

PathField.prototype.buildPath = function() {

  if (this.hasPath()) {
    this.cancel_search();
    this.emit('submit', this.value.toString(this.values), this.hasSelection() ? this.value : null);
  }

};

PathField.prototype.setFieldValue = function(name, value) {

  var field = this.getField(name),
      $node = $(field.node);

  this.values[name] = value;
  $node.text(value);

  if (value && value !== '') {
    $node.addClass('modified');
  }

};

PathField.prototype.getField = function(name) {

  for (var i = 0; i < this.focusable_parts.length; i++) {
    var part = this.focusable_parts[i];
    if (name == part.part.name) {
      return part;
    }
  }
  return null;
};

PathField.prototype.setParam = function(name, value) {
  if(this.values[name] != value) {

    this.values[name] = value;
    this.emit('changeParams', this.values);

    this.performSearch();

  }
};

PathField.prototype.performSearch = function() {

  if (this.hasSelection()) return;

  var query = decodeURI(this.value.toString(this.values));

  if (this.last_query === query) {
    return;
  }

  this.last_query = query;

  this.cancel_search();
  this.cancel_search = this.search(query);

};

PathField.prototype.requery = function() {
  this.last_query = null;
  this.performSearch();
};

PathField.prototype.getParam = function(name) {
  return this.values[name] || "";
};

PathField.prototype.onSearch = function() {
  if (this.hasSelection()) {
    this.reset();
  }
  this.focus();
};

PathField.prototype.onResults = function(query, results) {
  // TODO: make sure we're waiting for the same query
  this.lookupPane.displayResults(results);
};

PathField.prototype.focus = function(part) {

  if (!part) {
    part = this.focusable_parts[0];
  }

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

};

PathField.prototype.detectActive = function(e) {

  var submit = this.node.find(this.options.submit),
      cls = this.options.activeClass;

  if (e.which == 13 || e.which == 32) {
    if (e.type == 'keydown') {
      // prevent window from receiving
      e.stopPropagation();

      if (!this.hasPath()) {
        return;
      }

      submit.addClass(cls);
      setTimeout(function() {
        submit.removeClass(cls);
      }, 100);
    }
  }


};

PathField.prototype.onSubmitKeypress = function(e) {

  if (e.which == 13 || e.which == 32) { // return or space
    e.stopPropagation();
    this.buildPath();
    return false;
  }

};

PathField.prototype.onFocusPart = function(part, node) {

  clearTimeout(this.blur_timeout);
  if (!this.hasSelection()) {
    this.performSearch();
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
              .appendTo(this.partsNode);

  if (part.options.editable) {
    var last_part = field.focusable_parts[field.focusable_parts.length - 1],
        focusable = {node:node.get(0), part:part, previous:last_part},
        value = field.getParam(part.name),
        modified = value && value !== "";

    if (last_part) last_part.next = focusable;
    field.focusable_parts.push(focusable);
    node
      .text(value)
      .toggleClass('modified', modified)
      .attr('contenteditable', true)
      .attr("tabindex", 1)
      .attr("data-label", part.getLabel())
      .on('paste', function(e){
        e.preventDefault();
        document.execCommand('insertText', false, e.clipboardData.getData('text/plain'));
        if (node.text() !== '') {
          node.addClass('modified');
        }
        return false;
      })
      .on('keydown', function(e) {
        var hasSelection = field.hasSelection();
        if (!hasSelection) {
          field.lookupPane.ignoreMouse();
        }

        if (e.which == 38 && !hasSelection) { // up
          e.preventDefault();
          field.lookupPane.highlightPrevious();
          return;
        } else if (e.which == 40 && !hasSelection) { // down
          e.preventDefault();
          field.performSearch();
          field.lookupPane.show();
          field.lookupPane.highlightNext();
          return;
        } else if (e.which == 13) { // return
          e.preventDefault();
          // an endpoint is applied OR the user didn't selected one from the dropdown list
          if (hasSelection || !field.lookupPane.selectCurrent()){
            field.lookupPane.hide();

            if (focusable.next) {
              field.focus(focusable.next);
              return false;
            }

            field.buildPath();
            field.detectActive(e);
          }
          return false;
        } else if (e.which == 27 && !hasSelection) {
          field.preventSearch = true;
        }

        if (e.which == 8 && !node.hasClass('modified')) {
          e.preventDefault();
          if (focusable.previous) {
            field.focus(focusable.previous);
            return false;
          }

          if (field.hasSelection()) {
            field.reset();
            return false;
          }

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
