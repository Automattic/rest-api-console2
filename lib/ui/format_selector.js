var Component = require('./component'),
    $ = Component.$;

var FormatSelector = Component.extend({
  'options'       : [],
  'selectedClass' : 'selected',
  'menuItem'      : function(formatter) { return $('<li></li>').text(formatter.options.name); },
  'init'          : function() {
    this.renderOptions();
    this.node.on('click', 'li', (function(e) {
      var index = $(e.target).index();
      this.select(index);
    }).bind(this));
  },
});

FormatSelector.prototype.select = function(index) {
  this.node.children().removeClass(this.options.selectedClass);
  this.node.children().eq(index).addClass(this.options.selectedClass);
  this.setValue(this.options.options[index]);
};

FormatSelector.prototype.selectFirstOption = function() {
  if (this.options.options.length > 0) {
    this.select(0);
  }
};

FormatSelector.prototype.setOptions = function(options) {
  this.options.options = options;
  this.renderOptions();
};

FormatSelector.prototype.renderOptions = function() {

  this.node.children().remove();

  if (this.options.options.length <= 1) {
    return this.node.hide();
  } else {
    this.node.show();
  }

  var options = $([]);
  for (var i = 0; i < this.options.options.length; i++) {
    options = options.add(this.options.menuItem(this.options.options[i]));
  }

  this.node.append(options);

};

FormatSelector.prototype.eachFormat = function(cb) {
  this.options.options.forEach(cb);
};

module.exports = FormatSelector;