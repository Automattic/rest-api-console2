var Component = require('./component'),
    $ = Component.$;

LookupPane = Component.extend({
  'max'            : 32,
  'template'       : function(item){return $("<li></li>").text(item); },
  'highlightClass' : 'highlight',
  'unselectableClass' : 'unselectable',
  'defaultValue'   : null,
  'init'           : function() {
    this.listNode = Component.$("<ol></ol>").appendTo(this.node);
    this.node.on('mousedown', 'li', this.onClick.bind(this));
    this.last_index = -1;
    this.enableMouse();
  },
  'onChange': function(value, oldValue) {

    if (oldValue) oldValue.removeClass(this.options.highlightClass);

    if (!value) {
      this.last_index = -1;
      return;
    }

    this.last_index = value.index();
    value.addClass(this.options.highlightClass);
    if (!this.disableScroll) {
      this.scrollSelectedToVisible();
    }

  }
});

LookupPane.prototype.displayResults = function(results, maxResults) {

  var listNode = this.listNode,
      template = this.options.template,
      max = maxResults === null ? this.options.max : maxResults;

  this.clearResults();

  this.results = results;

  var items = $([]);
  this.results.forEach(function(item) {
    items = items.add(template(item));
  });

  listNode.append(items);

  if (this.last_index === -1) {
    return;
  }

  if (this.last_index > items.length - 1) {
    this.last_index = 0;
  }

  this.highlightNearestSelectable(this.last_index);

};

LookupPane.prototype.hide = function() {
  this.node.hide();
};

LookupPane.prototype.show = function() {
  this.node.show();

  // set the max heigh of our node to screen height minus top
  var top = this.node.offset().top,
      height = $(window).height() - top - 8;
  
  this.listNode.css('max-height', height);

};

LookupPane.prototype.clearResults = function() {
  this.listNode.children().remove();
  this.results = [];
};

LookupPane.prototype.reset = function() {
  this.clearResults();
  this.last_index = -1;
};

LookupPane.prototype.onClick = function(e) {

  e.preventDefault();

  var current = $(e.currentTarget);

  if (current.hasClass(this.options.unselectableClass)) {
    return false;
  }

  this.setValue($(e.currentTarget));
  this.selectCurrent();
  return false;
};

LookupPane.prototype.selectCurrent = function() {

  if (!this.getValue()) {
    return false;
  }

  var index = this.getValue().index(),
      result = this.results ? this.results[index] : false;

  if (!result) return false;

  this.emit('select', result);

  return true;

};

LookupPane.prototype.highlightFirst = function() {
  this.highlightNearestSelectable(0);
};

LookupPane.prototype.highlightLast = function() {
  this.highlightNearestSelectable(this.listNode.children().length-1, -1);
};

LookupPane.prototype.highlightNearestSelectable = function(index, direction) {
  if (direction === null || direction === undefined) direction = 1;
  var children = this.listNode.children(),
      item = null;

  if (children.length === 0) {
    return this.setValue(null);
  }

  if (children.length === 1) {
    return this.setValue(children.eq(0));
  }


  do {
    item = children.eq(index);
    index += direction;

    if (index < 0 || index >= children.length) break;

  } while(item.length === 0 || item.hasClass(this.options.unselectableClass));

  this.setValue(item);

};

LookupPane.prototype.highlightNext = function() {
  var current = this.getValue(),
      next = null;

  if (!current) {
    return this.highlightFirst();
  }

  next = current.next();
  while(next.hasClass(this.options.unselectableClass)) {
    next = next.next();
  }

  if (next.length === 0) {
    return this.highlightFirst();
  }

  this.setValue(next);

};

LookupPane.prototype.highlightPrevious = function() {
  var current = this.getValue(),
      prev = null;

  if (!current) {
    this.highlightLast();
    return;
  }

  prev = current.prev();

  while(prev.hasClass(this.options.unselectableClass)) {
    prev = prev.prev();
  }

  if (prev.length === 0) {
    return this.highlightLast();
  }

  this.setValue(prev);

};

LookupPane.prototype.onHover = function(e) {
  this.disableScroll = true;
  this.setValue($(e.currentTarget));
  this.disableScroll = false;
};

LookupPane.prototype.scrollSelectedToVisible = function() {
  var current = this.getValue();

  if (!current) {
    this.node.scrollTop(0);
    return;
  }

  var node         = current,
      position     = node.position(),
      top          = node[0].offsetTop,
      itemHeight   = node[0].offsetHeight,
      bottom       = top + itemHeight,
      height       = this.listNode.height(),
      scrollTop    = this.listNode.scrollTop(),
      scrollBottom = scrollTop + this.listNode.height();

  if (top <= scrollTop) {
    this.listNode.scrollTop(top - itemHeight);
  } else if (bottom >= scrollBottom) {
    this.listNode.scrollTop(bottom - height + itemHeight);
  }


};

LookupPane.prototype.ignoreMouse = function() {
  this.node.off('mouseenter.lookup-pane');
  this.node.one('mousemove', this.enableMouse.bind(this));
};

LookupPane.prototype.enableMouse = function() {
  this.node.on('mouseenter.lookup-pane', 'li', this.onHover.bind(this));
};

module.exports = LookupPane;
