var events = require('events'),
    util = require('util'),
    querystring = require('querystring'),
    fn = require('../fn');

function ParamBuilder(node, options) {
  events.EventEmitter.apply(this);

  this.enabled = true;

  this.options = $.extend({
    'title'      : null,
    'rawClass'   : 'raw',
    'tableClass' : 'table'
  }, options);

  this.node = node;

  this.node.append($("<header></header>").text(this.options.title));

  this.focusListener = this.onFocus.bind(this);
  this.blurListener = this.onBlur.bind(this);
  this.changeListener = this.onChange.bind(this);
  this.inputListener = this.onInput.bind(this);
  this.pasteListener = this.onPaste.bind(this);

  this.table = $('<table></table>').addClass(this.options.tableClass).appendTo(node);
  this.raw = $('<div></div>')
    .addClass(this.options.rawClass)
    .appendTo(node);

  this.setupInput(this.raw, function(builder, e){
    builder.rawParams = builder.raw.text();
  });

  this.params = {};

  this.table.hide();
}

util.inherits(ParamBuilder, events.EventEmitter);

ParamBuilder.prototype.setupInput = function(field, func) {

  if (!func) {
    formatter = function(){};
  }

  field
    .attr("contenteditable",true)
    .attr("tabindex","1")
    .on('focus', this.focusListener)
    .on('blur', this.blurListener)
    .on('keydown', this.inputListener)
    .on('keyup', fn.arglock(this.changeListener, func))
    .on('paste', this.pasteListener);

  return field;
};

ParamBuilder.prototype.setupFieldInput = function(name, node) {

  var format = function(builder) {
    builder.setParam(name, node.text());
  };

  return this.setupInput(node, format);
};

ParamBuilder.prototype.setParam = function(name, value) {

  if (value === "") {
    delete this.params[name];
  } else {
    this.params[name] = value;
  }

  this.raw.text(querystring.stringify(this.params));
  this.emit('change');

};

ParamBuilder.prototype.getParam = function(name) {
  var value = this.params[name];

  return value || "";

};

ParamBuilder.prototype.setValue = function(v) {

  var rows = $([]);

  if (!$.isPlainObject(v)) {
    v = {};
    this.table.hide();
    this.raw.show();
    return;
  }

  this.table.show();
  this.raw.hide();

  for(var name in v) {
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

};

ParamBuilder.prototype.enable = function() {

  this.enabled = true;

  this.table.find('div').add(this.raw.find('div'))
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

ParamBuilder.prototype.onFocus = function() {
};

ParamBuilder.prototype.onBlur = function() {
};

ParamBuilder.prototype.onChange = function(fn, e) {
  var target = $(e.currentTarget),
      query = querystring.parse(target.text());

  fn(this, e);
  
};

ParamBuilder.prototype.reset = function() {
  this.setValue(null);
};

ParamBuilder.prototype.onInput = function(e) {
  if (e.which === 13) {
    e.preventDefault();
    return false;
  }
};

ParamBuilder.prototype.onPaste = function(e) {

  var content = e.clipboardData.getData('text/plain');
  e.preventDefault();
  document.execCommand('insertText', false, content);
  return false;

};

module.exports = ParamBuilder;