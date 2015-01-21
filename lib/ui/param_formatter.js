var Component   = require('./component'),
    fn          = require('fn'),
    querystring = require('querystring'),
    $           = Component.$;

var listeners = {
  'onFocus' : function() {
    this.focusedTip = tip;
    this.emit('tip', tip);
  },
  'onBlur' : function() {
    this.focusedTip = null;
  },
  'onChange' : function(fn, e) {
    var target = $(e.currentTarget),
        query = querystring.parse(target.text());

    if (fn) fn(this, e);

  },
  'onInput' : function(e) {
    if (e.which === 13) {
      document.execCommand('insertHTML', false, '<br><br>');
      e.preventDefault();
      return false;
    }
  },
  'onPaste' : function(e) {
    var content = e.clipboardData.getData('text/plain');
    e.preventDefault();
    document.execCommand('insertHTML', false, content.replace(/\n$/, '<br><br>').replace(/\n/g, '<br>'));
    return false;
  },
  'setupInput' : function(field, func) {
    if (!func) {
      formatter = function(){};
    }

    field
      .attr("contenteditable",true)
      .attr("tabindex","1")
      .on('keydown', this.onInput.bind(this))
      .on('keyup', fn.arglock(this.onChange.bind(this), func))
      .on('paste', this.onPaste.bind(this));

    return field;
  }
};

var ParamFormatter = function() {
  
};

var QueryStringFormatter = Component.extend({
  'name' : 'URL Encoded',
  'className' : 'raw',
  'init' : function() {
    this.setupInput(this.node);
  }
}, listeners);

var JSONFormatter = Component.extend({
  'name' : 'JSON',
  'className' : 'raw',
  'init' : function() {
    this.setupInput(this.node);
  }
}, listeners);

var FormFormatter = Component.extend({
  'name' : 'Form',
  'init' : function() {

    this.focusListener  = this.onFocus.bind(this);
    this.blurListener   = this.onBlur.bind(this);
    this.changeListener = this.onChange.bind(this);
    this.inputListener  = this.onInput.bind(this);
    this.pasteListener  = this.onPaste.bind(this);

    this.scrollCancel = function(){};
    this.scrollCalculator = fn.rateLimit(100, this.scrollIntoView.bind(this));

    this.section  = $('<div></div>').addClass('container').appendTo(this.node);
    this.scroller = $('<div></div>').addClass('scroller').appendTo(this.section);

    this.table = $('<table></table>').addClass(this.options.tableClass).appendTo(this.scroller);
    this.scroller.on('scroll', this.onScroll.bind(this));

    this.params = {};

  },
  'onChange' : function(value, oldValue) {
    var rows = $([]);

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
}, listeners);

FormFormatter.prototype.enable = function() {

  this.enabled = true;

  this.table.find('div').add(this.raw)
    .attr('contenteditable', true)
    .attr('tabindex', '1');

  this.emit('enable');

};

FormFormatter.prototype.disable = function() {

  this.enabled = false;
  // remove all focusability
  this.table.find('div').add(this.raw)
    .attr('contenteditable', null)
    .attr('tabindex', null);

  this.emit('disable');

};

FormFormatter.prototype.onScroll = function(e) {

  if (this.focusedTip) {
    this.emit('tip', null);
  }

  this.updateScroller();

  this.scrollCancel();
  this.scrollCancel = this.scrollCalculator();

};

FormFormatter.prototype.scrollIntoView = function() {

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

FormFormatter.prototype.updateScroller = function() {

  var node      = this.scroller.get(0),
      scrollTop = node.scrollTop,
      atTop     = scrollTop === 0,
      atBottom  = node.scrollHeight - scrollTop === node.clientHeight;

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

FormFormatter.prototype.onChange = function() {
  this.updateScroller();    
};

FormFormatter.prototype.setupFieldInput = function(name, node) {

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

FormFormatter.prototype.onSelect = function() {
  this.updateScroller();
};

FormFormatter.prototype.getParam = function(name) {
  var value = this.params[name];

  return value || "";

};

FormFormatter.prototype.setParam = function(name, value) {

  if (value === "") {
    delete this.params[name];
  } else {
    this.params[name] = value;
  }

  this.emit('changeParams', this.params);

};

FormFormatter.prototype.getParams = function() {
  var params = {};

  for(var param in this.value) {
    if (this.params[param] && this.params[param] !== "") {
      params[param] = this.params[param];
    }
  }

  return params;
};

FormFormatter.prototype.setParams = function(params) {
  this.params = params;

  for(var field in this.fields) {
    $(this.fields[field]).text(this.params[field] || '');
  }

};

ParamFormatter.queryString = ParamFormatter.query = function() {
  return new QueryStringFormatter();
};

ParamFormatter.json = function() {
  return new JSONFormatter();
};

ParamFormatter.form = function() {
  return new FormFormatter();
};

module.exports = ParamFormatter;