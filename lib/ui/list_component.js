var Component = require('./component'),
    $ = Component.$;

var ListComponent = Component.extend({
  'element'       : 'ol',
  'defaultValue'  : [],
  'tabindex'      : '0',
  'autoSelect'    : true,
  'selectedClass' : 'selected',
  'disabledClass' : 'disabled',
  'itemTemplate'  : function(item) { return $('<li></li>').text(item); },
  'init' : function(node, options) {
    this.node.on('click', 'li', this.onClickItem.bind(this));
    this.node.on('dblclick', 'li', this.onDblClickItem.bind(this));
    this.node.on('keydown', this.onKeydown.bind(this));
    this.node.on('keypress', this.onKeypress.bind(this));

    this.enable();
  },
  'afterInit' : function() {
    updateList.call(this, this.options.defaultValue);
  },
  'onChange' : function(values, oldValues) {
    updateList.call(this, values);
  }
});

function updateList(values) {

  this.node.children().remove();

  // detach from parent
  var items = $(),
      component = this,
      template = this.options.itemTemplate;

  values.forEach(function(item) {
    items = items.add(template(item, component));
  });

  var parent = this.node.parent(),
      next = this.node.next();

  this.node.remove();
  this.node.children().remove();
  this.node.append(items);

  if (next.length > 0) {
    this.node.insertBefore(next);
  } else {
    this.node.appendTo(parent);
  }

  if (this.options.autoSelect) {
    this.selectItem(this.node.children().first());
  }

}

ListComponent.prototype.disable = function() {
  this.node.addClass(this.options.disabledClass);
  this.node.attr('tabindex', null);
};

ListComponent.prototype.enable = function() {
  this.node.removeClass(this.options.disabledClass);
  this.node.attr('tabindex', this.options.tabindex);
};

ListComponent.prototype.isDisabled = function() {
  return !this.isEnabled();
};

ListComponent.prototype.isEnabled = function() {
  return !this.node.hasClass(this.options.disabledClass);
};

ListComponent.prototype.onKeydown = function(e) {
  if (this.isDisabled()) {
    return;
  }

  if (e.which == 38) { // up
    e.preventDefault();
    this.selectPrevious();
    return false;
  } else if (e.which == 40) { // down
    e.preventDefault();
    this.selectNext();
    return false;
  }
};

ListComponent.prototype.onKeypress = function(e) {
  if (this.isDisabled()) {
    return;
  }

  if (e.which == 13) {
    e.preventDefault();
    e.stopPropagation();
    this.submitItem(this.getSelectedItem());
    return false;
  }

};

ListComponent.prototype.getSelectedItem = function() {
  return this.node.find('.' + this.options.selectedClass);
};

ListComponent.prototype.onClickItem = function(e) {
  if (this.isDisabled()) {
    return;
  }

  this.selectItem($(e.currentTarget));
};

ListComponent.prototype.onDblClickItem = function(e) {

  if (this.isDisabled()) {
    return;
  }

  var target = $(e.currentTarget);

  this.selectItem(target);
  this.submitItem(target);
};


ListComponent.prototype.selectNext = function() {
  var next = this.getSelectedItem().next();

  if (next.length > 0) {
    this.selectItem(next);
  }

};

ListComponent.prototype.selectPrevious = function() {
  var previous = this.getSelectedItem().prev();

  if (previous.length > 0) {
    this.selectItem(previous);
  }
};

ListComponent.prototype.reselectSelectedItem = function() {
  var selected = this.getSelectedItem();
  if (selected.length > 0) {
    this.selectItem(selected);
  }
};

ListComponent.prototype.selectItem = function(selected) {
  var current = this.getSelectedItem(),
      values = this.getValue(),
      currentIndex = current.index(),
      selectedIndex = selected.index();

  current.removeClass(this.options.selectedClass);
  selected.addClass(this.options.selectedClass);

  if (current.length > 0) {
    this.emit('deselect', values[currentIndex], currentIndex, current);
  }

  if (selected.length > 0) {
    this.emit('select', values[selectedIndex], selectedIndex, selected);    
  }

};

ListComponent.prototype.submitItem = function(item) {
  var index = item.index(),
      value = this.getValue()[index];

  if (value) {
    this.emit('submit', value, index, item);
  }

};

module.exports = ListComponent;