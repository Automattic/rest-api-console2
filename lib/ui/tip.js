var Component = require('./component'),
    fn = require('../fn');

var Tip = Component.extend({
  'init' : function() {
    this.header = this.node.find('header');
    this.name = this.header.find('code');
    this.type = this.header.find('em');
    this.anchor = this.node.find('.anchor');
    this.cancel = function() {};

    this.positionDelayed = fn.rateLimit(200, this.positionTip.bind(this));

    this.hide();
  },
  'onChange' : function(value, oldValue) {
    this.name.text(value.name);
    this.type.text(value.type);

    this.displayDescription(value.description);

    if (value.context) {
      this.cancel();
      this.cancel = this.positionDelayed(value.context, value.position);
    }
  }
});

Tip.prototype.positionTip = function(context, position) {

  var offset = context.offset(),
      positionCss = {},
      anchorCss = {};

  this.node.css({'opacity':'0', 'visibility': 'hidden'}).show();

  if (position === 'below') {
    positionCss = {top: offset.top + offset.height + 8, left: offset.left};
    anchorCss = { top: 0, left: 16};
  } else {
    positionCss = {top: offset.top, left: offset.width + offset.left + 8};
    anchorCss = { top: 16, left: 0};
  }

  positionCss.visibility = 'visible';
  positionCss.opacity = 0.9;

  this.anchor.css(anchorCss);
  this.node.css(positionCss);

  context.one('blur', this.hide.bind(this));

};

Tip.prototype.displayDescription = function(description) {
  var list = this.node.find('ul'),
      items = $();

  list.find('li').remove();

  if (!$.isPlainObject(description)) {
    this.formatDescription(description).appendTo(list);
    return;
  }
  
  for (var name in description) {
    items = items.add(this.formatDescription(name, description[name]));
  }

  list.append(items);

};

Tip.prototype.formatDescription = function(name, description) {

  var item = $('<li></li>'), def = '(default)';

  if (!description) {
    description = name;
  } else {
    item.append($('<code></code>').text(name)).append(' – ');
  }

  if (!description) {
    return item;
  }

  if (description.indexOf(def) === 0) {
    item.append($('<em></em>').text('default')).append(' ');
    description = description.slice(def.length);
  }

  return item.append($('<span></span>').text(description));

};

Tip.prototype.hide = function() {
  this.cancel();
  this.node.hide();
};

module.exports = Tip;