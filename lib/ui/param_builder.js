var Component      = require('./component'),
    FormatSelector = require('./format_selector'),
    ParamFormatter = require('./param_formatter'),
    querystring    = require('querystring'),
    fn             = require('fn'),
    $              = Component.$;

var ParamBuilder = Component.extend({
  'title'      : null,
  'rawClass'   : 'raw',
  'tableClass' : 'table',
  'formatOptions' : [],
  'init'       : function() {
    this.enabled = true;

    var header = $("<header></header>");
    header.append($('<span><span>').text(this.options.title));
    this.node.append(header);

    this.formatSelector = new FormatSelector($('<ul></ul>').appendTo(header), {
      options: this.options.formatOptions
    });

    this.formatContainer = $('<div></div>').addClass('formatter').appendTo(this.node);

    this.formatSelector.on('change', (function(value, oldValue) {
      this.formatContainer.children().remove();
      this.formatContainer.append(value.node);
      if (value.onSelect) {
        value.onSelect();
      }
    }).bind(this));

    this.params = {};

  },
  'afterInit' : function() {
    this.formatSelector.selectFirstOption();
  },
  'beforeChange' : function(value) {
    if ($.isArray(value)) {
      return null;
    }
    return value;
  },
  'onChange' : function(value, oldValue) {

    this.formatSelector.eachFormat(function(format) {
      format.setValue(value);
    });

    return;
  }
});

ParamBuilder.prototype.enable = function() {
  this.enabled = true;
  this.emit('enable');
};

ParamBuilder.prototype.disable = function() {
  this.enabled = false;
  this.emit('disable');
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

ParamBuilder.prototype.setFormatOptions = function(options) {
  this.formatSelector.setOptions(options);
  this.formatSelector.selectFirstOption();
}

module.exports = ParamBuilder;