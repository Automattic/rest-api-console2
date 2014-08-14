var Component = require('./component'),
    $ = Component.$,
    querystring = require('querystring'),
    fn = require('fn');

var ParamBuilder = Component.extend({
  'title'      : null,
  'rawClass'   : 'raw',
  'tableClass' : 'table',
  'init'       : function() {
    this.enabled = true;

    this.node.append($("<header></header>").text(this.options.title));

    this.focusListener = this.onFocus.bind(this);
    this.blurListener = this.onBlur.bind(this);
    this.changeListener = this.onChange.bind(this);
    this.inputListener = this.onInput.bind(this);
    this.pasteListener = this.onPaste.bind(this);

    this.scrollCancel = function(){};
    this.scrollCalculator = fn.rateLimit(100, this.scrollIntoView.bind(this));

    this.section = $('<div></div>').addClass('container').appendTo(this.node);

    this.scroller = $('<div></div>').addClass('scroller').appendTo(this.section);

    this.table = $('<table></table>').addClass(this.options.tableClass).appendTo(this.scroller);
    this.raw = $('<div></div>')
      .addClass(this.options.rawClass)
      .appendTo(this.node);

    this.setupInput(this.raw, function(builder, e){
      builder.rawParams = builder.raw.text();
    });

    this.params = {};

    this.section.hide();

    this.scroller.on('scroll', this.onScroll.bind(this));
  },
  'beforeChange' : function(value) {
    if ($.isArray(value)) {
      return null;
    }

    return value;
  },
  'onChange' : function(value, oldValue) {

    var rows = $([]);

    if (!value) {
      this.section.hide();
      this.raw.show();
      return;
    }

    this.section.show();
    this.raw.hide();

    this.fields = {};

    for(var name in value) {
      rows = rows.add($("<tr></tr>")
        .append($("<th></th>").text(name))
        .append($("<td></td>").append(this.setupFieldInput(name, $("<div></div>").text(this.getParam(name))))
      ));
    }

    // remove all existing listeners from table editables
    this.table.find('div').off();
    // remove existing rows
    this.table.find('tr').remove();
    this.table.append(rows);
    this.table.on('click', 'th', function(e){
      $(e.currentTarget).parents('tr').find('div').focus();
    });

    this.updateScroller();
  }
});

ParamBuilder.prototype.setupInput = function(field, func) {

  if (!func) {
    formatter = function(){};
  }

  field
    .attr("contenteditable",true)
    .attr("tabindex","1")
    .on('keydown', this.inputListener)
    .on('keyup', fn.arglock(this.changeListener, func))
    .on('paste', this.pasteListener);

  return field;
};

ParamBuilder.prototype.setupFieldInput = function(name, node) {

  var format = function(builder) {
        var value = node.html().replace(/<br><br>$/, '\n').replace(/<br>/g, '\n').trim();
        builder.setParam(name, value);
      },
      tip = $.extend({name:name, context:node}, this.value[name]);

  this.fields[name] = node.eq(0);

  return this.setupInput(node, format)
          .on('focus', fn.arglock(this.focusListener, node, tip))
          .on('blur', fn.arglock(this.blurListener, node));
};

ParamBuilder.prototype.setParam = function(name, value) {

  if (value === "") {
    delete this.params[name];
  } else {
    this.params[name] = value;
  }

  this.emit('changeParams', this.params);

};

ParamBuilder.prototype.getParams = function() {
  var params = {};

  for(var param in this.value) {
    if (this.params[param] && this.params[param] !== "") {
      params[param] = this.params[param];
    }
  }

  return params;
};

ParamBuilder.prototype.setParams = function(params) {
  this.params = params;

  for(var field in this.fields) {
    $(this.fields[field]).text(this.params[field] || '');
  }

};

ParamBuilder.prototype.getParam = function(name) {
  var value = this.params[name];

  return value || "";

};

ParamBuilder.prototype.enable = function() {

  this.enabled = true;

  this.table.find('div').add(this.raw)
    .attr('contenteditable', true)
    .attr('tabindex', '1');

  this.emit('enable');

};

ParamBuilder.prototype.disable = function() {

  this.enabled = false;
  // remove all focusability
  this.table.find('div').add(this.raw)
    .attr('contenteditable', null)
    .attr('tabindex', null);

  this.emit('disable');

};

ParamBuilder.prototype.onFocus = function(editableNode, tip, e) {
  this.focusedTip = tip;
  this.emit('tip', tip);
};

ParamBuilder.prototype.onBlur = function(editableNode, e) {
  this.focusedTip = null;
};

ParamBuilder.prototype.onChange = function(fn, e) {
  var target = $(e.currentTarget),
      query = querystring.parse(target.text());

  fn(this, e);

  this.updateScroller();
};

ParamBuilder.prototype.onInput = function(e) {
  if (e.which === 13) {
    document.execCommand('insertHTML', false, '<br><br>');
    e.preventDefault();
    return false;
  }
};

ParamBuilder.prototype.onPaste = function(e) {

  var content = e.clipboardData.getData('text/plain');
  e.preventDefault();
  document.execCommand('insertHTML', false, content.replace(/\n$/, '<br><br>').replace(/\n/g, '<br>'));
  return false;

};

ParamBuilder.prototype.onScroll = function(e) {

  if (this.focusedTip) {
    this.emit('tip', null);
  }

  this.updateScroller();

  this.scrollCancel();
  this.scrollCancel = this.scrollCalculator();

};

ParamBuilder.prototype.scrollIntoView = function() {

  var node = this.scroller.get(0),
      scrollBounds = {
        top: node.scrollTop,
        bottom: node.clientHeight + node.scrollTop,
        height: node.clientHeight
      };

  if (this.focusedTip) {
    var position = this.focusedTip.context.position();

    position.bottom = position.top + this.focusedTip.context.height();

    if (position.bottom > 0 && position.top < scrollBounds.height) {
      this.emit('tip', this.focusedTip);
    }

  }
  
};

ParamBuilder.prototype.updateScroller = function() {

  var node = this.scroller.get(0),
      scrollTop = node.scrollTop,
      atTop = scrollTop === 0,
      atBottom = node.scrollHeight - scrollTop === node.clientHeight;

  if (this.section.hasClass('at-top') && !atTop) {
    this.section.removeClass('at-top');
  } else if (!this.section.hasClass('at-top') && atTop) {
    this.section.addClass('at-top');
  }

  if (this.section.hasClass('at-bottom') && !atBottom) {
    this.section.removeClass('at-bottom');
  } else if (!this.section.hasClass('at-bottom') && atBottom) {
    this.section.addClass('at-bottom');
  }

};

ParamBuilder.prototype.getQuery = function() {

  if (!this.value || this.value === '') {
    try {
      return querystring.parse(this.raw.text());
    } catch (e) {
      return {};
    }
  }

  return this.getParams();

};

module.exports = ParamBuilder;