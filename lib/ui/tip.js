var Component = require('./component'),
    $ = Component.$,
    fn = require('fn');

var Tip = Component.extend({
  'opacity' : '0.9',
  'init' : function() {
    this.header = this.node.find('header');
    this.name = this.header.find('code');
    this.type = this.header.find('em');
    this.anchor = this.node.find('.anchor');
    this.cancel = function() {};
    this.cancelResize = function() {};
    this.contextBlurListener = this.onBlur.bind(this);
    this.resizeListener = this.onResize.bind(this);
    this.positionDelayed = fn.rateLimit(200, this.positionTip.bind(this));
    this.redisplay = fn.rateLimit(100, this.redisplayTip.bind(this));

    $(window).on('resize', this.resizeListener);

    this.hide();
  },
  'onChange' : function(value, oldValue) {

    if (this.currentContext) {
      this.currentContext.off('blur', this.contextBlurListener);
    }

    if (!value) {
      this.cancel();
      this.hide();
      return;
    }

    this.name.text(value.name);
    this.type.text(value.type);


    this.displayDescription(value.description);

    if (value.context) {

      this.currentContext = value.context;
      this.cancel();
      this.cancel = this.positionDelayed(value.context, value.position);

      value.context.one('blur', this.contextBlurListener);
    }
  }
});

Tip.prototype.redisplayTip = function() {

  if (!this.value) {
    return;
  }

  // detect if the item is offscreen or not
  var contextNode = this.value.context || null;

  if (!contextNode) {
    return;
  }

  this.options.onChange.call(this, this.value);
};

Tip.prototype.positionTip = function(context, position, attempts) {

  var offset = context.offset(),
      $body = $('body'),
      screen,
      bounds,
      positionCss = {},
      anchorCss = {},
      retry = false;

  attempts = attempts || [];
  position = position || 'right';

  this.node.hide();

  limit = {
    width: $body.width(),
    height: $body.height()
  };

  // layout to get width/height
  this.node.css({'opacity':'0', 'visibility': 'hidden', left:0, top:0, 'width': null}).show();

  // store the bounds
  bounds = this.node.offset();

  this.node.css({'width': bounds.width});

  // determine where it should go relative the context
  switch (position) {
  case 'above':
    positionCss = {top: offset.top - bounds.height - 8, left: offset.left };
    anchorCss = {top: bounds.height, left: 16};
    break;
  case 'below':
    positionCss = {top: offset.top + offset.height + 8, left: offset.left};
    anchorCss = { top: 0, left: 16};
    break;
  case 'right':
    positionCss = {top: offset.top, left: offset.width + offset.left + 8};
    anchorCss = { top: 16, left: 0};
    break;
  case 'left':
    positionCss = {top: offset.top, left: offset.left - bounds.width - 8};
    anchorCss = { top: 16, left: bounds.width };
    break;
  }

  this.anchor.css(anchorCss);
  this.node.css(positionCss);

  bounds = this.node.offset();
  bounds.right = bounds.left + bounds.width;
  bounds.bottom = bounds.top + bounds.height;

  switch (position) {
  case 'below':
    if (bounds.bottom > limit.height) {
      retry = 'right';
    }
    break;
  case 'above':
    if (bounds.top < 0) {
      retry = 'left';
    }
    break;
  case 'left':
    if (bounds.left < 0) {
      retry = 'below';
    }
    break;
  case 'right':
    if (bounds.right > limit.width) {
      retry = 'above';
    }
    break;
  }

  if (retry !== false) {
    if (attempts.indexOf(retry) === -1) {
      this.positionTip(context, retry, attempts.concat(position));
      return;
    }
  }

  var adjust, delta;

  if (bounds.right > limit.width - 8) {
    adjust = limit.width - bounds.width - 8;
    delta = adjust - bounds.left;

    this.node.css('left', adjust);
    this.anchor.css({'left': anchorCss.left - delta});
  }

  if (bounds.bottom > limit.height - 8) {
    adjust = Math.max(8,limit.height - bounds.height - 8);
    delta = adjust - bounds.top;

    this.node.css('top', adjust);
    this.anchor.css('top', anchorCss.top - delta);
  }

  this.node.css({'visibility':'visible', 'opacity':this.options.opacity});

};

Tip.prototype.displayDescription = function(description) {
  var list = this.node.find('ul'),
      items = $();

  list.find('li').remove();

  if (!Component.$.isPlainObject(description)) {
    this.formatDescription(description).appendTo(list);
    return;
  }
  
  for (var name in description) {
    items = items.add(this.formatDescription(name, description[name]));
  }

  list.append(items);

};

Tip.prototype.onResize = function() {

  this.cancel();
  this.node.hide();

  this.cancelResize();
  this.cancelResize = this.redisplay();

};

Tip.prototype.onBlur = function() {
  this.hide();
};

Tip.prototype.formatDescription = function(name, description) {

  var item = $('<li></li>'), def = '(default)', opt = 'Optional.';

  if (!description) {
    description = name;
  } else {
    item.append($('<code></code>').text(name)).append(' – ');
  }

  if (!description) {
    return item;
  }

  if (description.indexOf(def) === 0) {
    item.append($('<em></em>').text('Default'));
    description = description.slice(def.length);
    if (description.trim() !== '') {
      item.append(' – ');
    }
  }

  if (description.indexOf(opt) === 0) {
    item.append($('<em></em>').text('Optional')).append(' – ');
    description = description.slice(opt.length);
  }

  return item.append($('<span></span>').text(description));

};

Tip.prototype.hide = function() {
  this.value = null;
  this.cancel();
  this.node.hide();
};

module.exports = Tip;