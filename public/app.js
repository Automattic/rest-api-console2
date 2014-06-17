(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

module.exports = {
  arglock: arglock,
  when: when,
  counts: counts,
  debounce: debounce,
  times: times,
  rateLimit: rateLimit
};

function when(check, fn){

  var args = [].slice.call(arguments, 2);

  return function(){
    if (check()) return fn.apply(this, args.concat([].slice.call(arguments)));
  };

}

function debounce(every, fn){

  var args = [].slice.call(arguments, 2),
      count = 0,
      debouncer = function(){
        count ++;
        return count % every === 0;
      };

  return when.apply(this, [debouncer, fn].concat(args));
}

function counts(times, fn){

  var args = [].slice.call(arguments, 2),
    count = 0,
    counter = function(){
      if (count == times) return true;
      count ++;
      return false;
    };

  return when.apply(this, [counter, fn].concat(args));

}

function arglock(){
  var slice = [].slice,
      args = slice.apply(arguments);

  if (args.length === 0 || typeof(args[0]) != 'function') throw new Error("first argument must be a function");

  var fn = args.shift();

  return function(){
    return fn.apply(this, args.concat(slice.apply(arguments)));
  };
}

function times(count, fn){

  var args = [].slice.call(arguments, 2),
      multiplied = function(){
        var results = [];
        for (var i = 0; i < count; i++) {
          results.push(fn.apply(this, args));
        }
        return results;
      };

  return multiplied;

}

function rateLimit(wait, fn) {

  var clear,
      limited = function() {
        if (clear) clear();

        var args = arguments,
        timeoutId = setTimeout(function(){
          fn.apply(this, args);
        }, wait);

        clear = function() {
          clearTimeout(timeoutId);
        };

        return clear;

      };

  return limited;

}
},{}],2:[function(require,module,exports){
var PATH_SEPERATOR = "/",
    VARIABLE_INDICATOR = "$",
    part_builder = require('./part_builder'),
    builder = part_builder(),
    Part = require('./part').Part;

function Path(path, params) {

  if (!params) params = {};

  this.path = path;

  this.parts = reduceParts(path, function(part) {
    return builder.build(part, params);
  });

}

Path.prototype.toString = function(values) {
  var s = "";
  for (var i = 0; i < this.parts.length; i++) {
    var part = this.parts[i];
    s += part.toString(values);
  }
  return s;
};

function reduceParts(path, onPart) {
  var i = 0,
    parts = [],
    push = function(part) {
      if (part) parts.push(part);
    };
  do {
    var $ = path.indexOf(VARIABLE_INDICATOR, i),
      $end = path.indexOf(PATH_SEPERATOR, $);

    // no variable left, the remainder is a single part
    if ($ === -1) {
      push(onPart(path.slice(i)));
      break;
    }

    // variable is not at the beginning, there's a prefix
    if ($ > i) {
      push(onPart(path.slice(i, $)));
    }

    // there are no more segments, the rest is a variable
    if ($end === -1) {
      push(onPart(path.slice($)));
      break;
    }

    push(onPart(path.slice($, $end)));

    i = $end;

  } while(i<path.length);

  return parts;
}

DefaultPath = function() {
  var part = new Part("path", {label:"", type:"param", editable:true});
  part.toString = function(values) {
    return this.encode(values.path || "");
  };
  this.parts = [part];
};

DefaultPath.prototype = Object.create(Path.prototype);

module.exports.Path = Path;
module.exports.DefaultPath = DefaultPath;

},{"./part":3,"./part_builder":4}],3:[function(require,module,exports){
function Part(name, options) {
  this.name = name;
  this.options = options || {};
  this.type = this.options.type || "";
  this.label = this.options.label;
  this.editable = this.options.editable || false;
  this.encode = this.options.encode || function(val) { return encodeURI(val); };
}

Part.prototype.toString = function(values) {
  if (values) {
    var param = values[this.name];
    if (param) {
      return this.encode(param);
    } else {
      return this.name;
    }
  } else {
    return this.name;
  }
};

Part.prototype.getLabel = function() {
  return this.label;
};

Part.prototype.getType = function() {
  return this.type;
};

module.exports = function() {
  
};

module.exports.Part = Part;
},{}],4:[function(require,module,exports){
var Part = require('./part').Part;

function PartBuilder (builders) {
  this.builders = builders;
}

PartBuilder.prototype.build = function build(part, params) {

  var path_part;

  for (var i = 0; i < this.builders.length; i++) {
    path_part = this.builders[i](part, params);
    if (path_part) {
      return path_part;
    }
  }

};

function paramType(part, params) {
  if (part.indexOf('$') === 0) {
    return new Part(part, {type:'param', label:part, editable:true, meta:params[part], encode:function(v) {
      return encodeURIComponent(v);
    }});
  }
}

function segmentType(part, params) {
  return new Part(part, {type:'segment', label:part, editable:false});
}

function PathPart () {
  
}

module.exports = function(){
  
};

module.exports = function() {
  return new PartBuilder([paramType, segmentType]);
};

module.exports.PartBuilder = PartBuilder;
module.exports.PathPart = PathPart;

},{"./part":3}],5:[function(require,module,exports){
var events = require('events'),
    util = require('util'),
    noop = function() {},
    componentOptions = {
      'init'         : noop,
      'beforeChange' : function() { return arguments[0]; },
      'afterChange'  : noop,
      'onChange'     : noop,
      'onReset'      : noop,
      'element'      : 'div'
    };

function Component(node, options) {

  events.EventEmitter.apply(this, arguments);

  this.node = $(node);
  this.options = options;

  if (this.options.init) this.options.init.apply(this);

  this.setValue(this.options.defaultValue);

}

util.inherits(Component, events.EventEmitter);

Component.prototype.setValue = function(value) {

  var oldValue = this.value;

  value = this.options.beforeChange.call(this, value);

  if (value === this.value) return;

  this.value = value;

  this.options.onChange.call(this, this.value, oldValue);
  this.emit('change', this.value, oldValue);
  this.options.afterChange.call(this, this.value);

};

Component.prototype.getValue = function() {
  return this.value;
};

Component.prototype.reset = function() {
  this.setValue(this.options.defaultValue);
  this.options.onReset.apply(this);
  this.emit('reset');
};

Component.extend = function(defaultOptions) {
  var ctr = function(node, options) {
    if ($.isPlainObject(node)) {
      options = node;
      node = null;
    }
    var opts = {};
    $.extend(opts, componentOptions, defaultOptions, options);

    if (!node) {
      node = $('<' + opts.element + '></' + opts.element + '>');
    }

    Component.call(this, node, opts);
  };

  util.inherits(ctr, Component);

  return ctr;
};

module.exports = Component;

},{"events":23,"util":30}],6:[function(require,module,exports){
var path = require('../path'),
    PathField = require('./path_field'),
    LookupPane = require('./lookup_pane'),
    MethodSelector = require('./method_selector'),
    ParamBuilder = require('./param_builder'),
    RequestViewer = require('./request_viewer'),
    Tip = require('./tip'),
    liquidemetal = require('liquidmetal'),
    wpcom = require('wpcom-proxy-request'),
    querystring = require('querystring');

if (!window) throw new Error("Not a browser window.");

$(function() {

  var endpoints = [],
      methodSelector = new MethodSelector($('#method'), {'container':$('#methods'),'label':$('#method span')}),
      queryBuilder = new ParamBuilder($('#query'), {'title':'Query'}),
      bodyBuilder = new ParamBuilder($('#body'), {'title':'Body'}),
      tip = new Tip('#tip'),
      pathField = new PathField($('#path'), {
        'defaultValue':new path.DefaultPath(),
        'itemTemplate': function(item) {
          var listItem = $("<li></li>"),
              method = $("<span></span>").text(item.method).appendTo(listItem),
              path = $("<code></code>").text(item.path_labeled).appendTo(listItem.append(" ")),
              group = $("<strong></strong>").text(item.group).appendTo(listItem.append(" ")),
              description = $("<em></em>").text(item.description).appendTo(listItem.append(" "));

          return listItem;
        },
        'onSelect': function(endpoint) {
          var endpointPath = new path.Path(endpoint.path_labeled, endpoint.request.path);
          pathField.setValue(endpointPath);
          methodSelector.setValue(endpoint.method);
          methodSelector.disable();

          queryBuilder.setValue(endpoint.request.query);

          bodyBuilder.setValue(endpoint.request.body);
        },
        'onSearch': function(q){
            var term = q.replace(/\//g, ' ').toUpperCase().trim(),
                ranked = endpoints.map(function(endpoint) {

                  try {
                    var i = endpoint.description.indexOf(" ", 16),
                        source = endpoint.search_source || [endpoint.path_labeled.replace(/\//g, ' '), endpoint.group, endpoint.description.substring(0,i)].join(' ').toUpperCase().trim(),
                        score = liquidemetal.score(source, term);
                        endpoint.search_source = source;
                        return [score, source, endpoint];
                  } catch (error) {
                    if (console && console.error) {
                      console.warn("Failed to score endpoint", endpoint, error.message);
                    }
                    return [0, '', endpoint];
                  }

            }).filter(function(score){
              return score[0] > 0;
            }).sort(function(a, b) {
              if (a[0] == b[0]) return 0;

              if (a[0] > b[0]) return -1;

              return 1;

            });

            return ranked.map(function(e) {
              return e[2];
            });

          } // onSearch function
        } // PathField options
      ), // PathField constructor
      upgraded = false,
      queue = [],
      send = function(request) {
        if (upgraded) {
          wpcom(request.getValue(), request.onResponse);
          request.sent();
        } else {
          queue.push(request);
        }
      };

  wpcom({metaAPI: { accessAllUsersBlogs: true }}, function(err, response) {
    if (err) {
      throw err;
    }

    upgraded = true;

    queue.each(send);

  });

  bodyBuilder.disable();

  methodSelector.on('enabled', function(){
    methodSelector.node.attr('tabindex','1').addClass('enabled');
  });

  methodSelector.on('disabled', function(){
    methodSelector.node.attr('tabindex', null).removeClass('enabled');
  });

  methodSelector.on('change', function() {
    pathField.focus();

    if (methodSelector.getValue() === 'GET') {
      bodyBuilder.disable();
    } else {
      bodyBuilder.enable();
    }
  });

  pathField.on('reset', function(){
    methodSelector.enable();
    queryBuilder.reset();
    bodyBuilder.reset();
    tip.reset();
  });

  pathField.focus();

  // global hotkeys
  $(document).on('keydown', function(e) {

    if (e.which == 77 && e.ctrlKey && !e.altKey && !e.shiftKey && !e.metaKey) { // 'm' + ctrl
      e.preventDefault();
      methodSelector.toggle();
      return false;
    }

    if (e.which == 191 && e.ctrlKey && !e.altKey && !e.shiftKey && !e.metaKey) { // '/' + ctrl
      e.preventDefault();
      pathField.focus();
      return false;
    }

  });

  $.getJSON("help.json", function(response) {
    endpoints = response.body;
  });

  bodyBuilder.on('disable', function() {
    bodyBuilder.node.addClass('disabled');
  });

  bodyBuilder.on('enable', function() {
    bodyBuilder.node.removeClass('disabled');
  });

  var onTip = tip.setValue.bind(tip);

  pathField.on('tip', onTip);
  queryBuilder.on('tip', onTip);
  bodyBuilder.on('tip', onTip);

  try {
    endpoints = JSON.parse(localStorage.endpoints);
  } catch (e) {
    // no valid endpoints
  } finally {
    if (!$.isArray(endpoints)) {
      delete localStorage.endpoints;
      endpoints = [];
    }
  }

  wpcom('/help', function(error, response) {
    localStorage.endpoints = JSON.stringify(response);
    endpoints = response;
  });

  pathField.on('submit', function(path){
    var method = methodSelector.getValue(),
        query = queryBuilder.getQuery(),
        body = bodyBuilder.getQuery(),
        request = {method:method,path:path,query:query,body:body},
        viewer = new RequestViewer({
          'container' : '#requests'
        });

    var queryIndex = path.indexOf('?');
    if (queryIndex !== -1) {
      try {
        request.query = $.extend(query, querystring.parse(path.slice(queryIndex + 1)));
      } catch(e) {
        // could not parse the query from the path, drop it
        console.log("Couldn't parse it");
      }
      request.path = request.path.slice(0, queryIndex);
      console.log("Updated the query", queryIndex, request.path, request);
    }

    if (request.path.indexOf('/') !== 0) {
      request.path = "/" + request.path;
    }

    viewer.setValue(request);

    send(viewer);

  });

});
},{"../path":2,"./lookup_pane":7,"./method_selector":8,"./param_builder":9,"./path_field":10,"./request_viewer":11,"./tip":12,"liquidmetal":13,"querystring":28,"wpcom-proxy-request":14}],7:[function(require,module,exports){
var Component = require('./component');

LookupPane = Component.extend({
  'max'            : 10,
  'template'       : function(item){return $("<li></li>").text(item); },
  'highlightClass' : 'highlight',
  'defaultValue'   : $(),
  'init'           : function() {
    this.listNode = $("<ol></ol>").appendTo(this.node);
    this.node.on('mousedown', 'li', this.onClick.bind(this));
    this.node.on('mouseenter', 'li', this.onHover.bind(this));
    this.last_index = -1;
  },
  'onChange': function(value, oldValue) {

    if (oldValue) oldValue.removeClass(this.options.highlightClass);

    if (!value) {
      this.last_index = -1;
      return;
    }

    this.last_index = value.index();
    value.addClass(this.options.highlightClass);
  }
});

LookupPane.prototype.displayResults = function(results) {

  var listNode = this.listNode,
      template = this.options.template;

  this.clearResults();

  this.results = results.slice(0,this.options.max);

  var items = $([]);
  this.results.forEach(function(item) {
    items = items.add(template(item));
  });

  listNode.append(items);

  this.show();

  if (this.last_index === -1) {
    return;
  }

  if (this.last_index > items.length - 1) {
    this.last_index = 0;
  }

  listNode.children().eq(this.last_index).addClass(this.options.highlightClass);

};

LookupPane.prototype.hide = function() {
  this.node.hide();
};

LookupPane.prototype.show = function() {
  this.node.show();
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
  this.setValue($(e.currentTarget));
  this.selectCurrent();
  return false;
};

LookupPane.prototype.selectCurrent = function() {

  var index = this.getValue().index(),
      result = this.results ? this.results[index] : false;

  if (!result) return false;

  this.emit('select', result);

  return true;

};

LookupPane.prototype.highlightNext = function() {
  var current = this.getValue(),
      next = current.next();

    if (next.length === 0) {
      next = this.listNode.children().first();
    }

    this.setValue(next);

};

LookupPane.prototype.highlightPrevious = function() {
  var current = this.getValue(),
      prev = current.prev();

    if (prev.length === 0) {
      prev = this.listNode.children().last();
    }

    this.setValue(prev);

};

LookupPane.prototype.onHover = function(e) {
  this.setValue($(e.currentTarget));
};

module.exports = LookupPane;
},{"./component":5}],8:[function(require,module,exports){
var Component = require('./component');

var MethodSelector = Component.extend({
  'values'         : ['GET', 'POST'],
  'defaultValue'   : 'GET',
  'container'      : this.node,
  'label'          : this.node,
  'highlightClass' : 'highlight',
  'disabledClass'  : 'disabled',
  'init' : function() {

    this.enabled = true;

    this.container = this.options.container;

    this.container.hide();

    this.node.on('focus', this.onFocus.bind(this));
    this.node.on('blur', this.onBlur.bind(this));
    this.node.on('mouseleave', this.onLeave.bind(this));
    this.node.on('click', this.onClick.bind(this));
    this.node.on('mousedown', 'li', this.onClickOption.bind(this));

    this.keyListener = this.onKeypress.bind(this);

    this.setValue(this.options.values[0]);

    this.emit('enabled');
  },
  'onChange' : function(value, oldValue) {
    this.options.label.text(value);
    this.refreshItems();
  }
});

MethodSelector.prototype.disable = function() {
  this.enabled = false;
  this.emit('disabled');
};

MethodSelector.prototype.enable = function() {
  this.enabled = true;
  this.emit('enabled');
};

MethodSelector.prototype.onFocus = function() {
  this.focused = true;
  this.showOptions();
};

MethodSelector.prototype.onBlur = function() {
  this.focused = false;
  this.hideOptions();
};

MethodSelector.prototype.onLeave = function() {
  this.node.blur();
};

MethodSelector.prototype.showOptions = function() {

  if (!this.enabled) return;

  this.refreshItems();

  this.container.show();
  $(document).on('keydown', this.keyListener);

};

MethodSelector.prototype.hideOptions = function() {
  this.container.hide();
  $(document).off('keydown', this.keyListener);
};

MethodSelector.prototype.onKeypress = function(e) {

  if (e.which == 38) {
    e.preventDefault();
    return false;
  }

  if (e.which == 40) {
    e.preventDefault();
    return false;
  }

  if (e.which == 13) {
    e.preventDefault();
    e.stopImmediatePropagation();
    this.selectHighlighted();
    return false;
  }

  if (e.which == 27) {
    this.node.blur();
    e.preventDefault();
    return false;
  }

};

MethodSelector.prototype.onClick = function(e) {
  e.preventDefault();
  this.showOptions();

  return false;

};

MethodSelector.prototype.onClickOption = function(e) {

  var val = $(e.currentTarget).text();

  this.setValue(val);

  this.hideOptions();
};

MethodSelector.prototype.setValue = function(v) {

  if (!this.enabled) return;

  Component.prototype.setValue.apply(this, arguments);

};

MethodSelector.prototype.refreshItems = function() {
  this.removeItems();
  this.addItems();
  this.highlightNext();
};

MethodSelector.prototype.addItems = function() {

  var list = $('<ul></ul>'),
      current = this.getValue();

  this.options.values.forEach(function(v){
    if(v === current) return;

    list.append($("<li></li>").text(v));
  });

  list.appendTo(this.container);

};

MethodSelector.prototype.removeItems = function() {

  this.container.find('ul').remove();

};

MethodSelector.prototype.getHighlighted = function() {
  return this.container.find('li.' + this.options.highlightClass);
};

MethodSelector.prototype.selectHighlighted = function() {
  var highlighted = this.getHighlighted();

  if (highlighted.length > 0) {
    this.setValue(highlighted.text());
  }

};

MethodSelector.prototype.highlightNext = function() {
  var highlighted = this.getHighlighted(),
      next = highlighted.next();

  if (highlighted.length === 0) {
    next = this.container.find('li').first();
  }

  highlighted.removeClass(this.options.highlightClass);
  next.addClass(this.options.highlightClass);

};

MethodSelector.prototype.highlightPrev = function() {
  var highlighted = this.getHighlighted(),
      prev = highlighted.prev();

  if (highlighted.length === 0) {
    prev = this.container.find('li').last();
  }

  highlighted.removeClass(this.options.highlightClass);
  prev.addClass(this.options.highlightClass);
  
};

MethodSelector.prototype.toggle = function() {

  var current = this.getValue(),
      i = this.options.values.indexOf(current);

    if (i === this.options.values.length - 1) {
      i = -1;
    }

    i++;
    this.setValue(this.options.values[i]);

};

module.exports = MethodSelector;
},{"./component":5}],9:[function(require,module,exports){
var Component = require('./component'),
    querystring = require('querystring'),
    fn = require('../fn');

var ParamBuilder = Component.extend({
  'title'      : null,
  'rawClass'   : 'raw',
  'tableClass' : 'table',
  'init'       : function() {
    this.enabled = true;

    this.node.append($("<header></header>").text(this.options.title));

    this.focusListener = this.onFocus.bind(this);
    this.changeListener = this.onChange.bind(this);
    this.inputListener = this.onInput.bind(this);
    this.pasteListener = this.onPaste.bind(this);

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
  return this.setupInput(node, format).on('focus', fn.arglock(this.focusListener, tip));
};

ParamBuilder.prototype.setParam = function(name, value) {


  if (value === "") {
    delete this.params[name];
  } else {
    this.params[name] = value;
  }

  this.emit('change');

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

ParamBuilder.prototype.onFocus = function(tip) {
  this.emit('tip', tip);
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

  var node = e.currentTarget,
      scroller = $(node);

  this.updateScroller();

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
},{"../fn":1,"./component":5,"querystring":28}],10:[function(require,module,exports){
var Component = require('./component'),
    LookupPane = require('./lookup_pane'),
    fn = require('../fn'),
    noop = function(){},
    util = require('util');


var PathField = Component.extend({
  'decorators'  :'#method,#submit,#search,#parts,#lookup',
  'submit'      :'#submit',
  'search'      :'#search',
  'container'   :'#parts',
  'lookup'      :'#lookup',
  'onSearch'    :noop,
  'onSelect'    :noop,
  'itemTemplate':function(item){
    return $("<li></li>").text("item");
  },
  'init':function() {
    this.values = {};

    this.node.on('click', this.options.submit, this.buildPath.bind(this));
    this.node.on('click', this.options.search, this.onSearch.bind(this));
    this.partsNode = this.node.find(this.options.container);

    this.lookupPane = new LookupPane($("#lookup"), {
      template: this.options.itemTemplate
    });

    this.last_query = "";
    this.cancel_search = noop;

    this.search = fn.rateLimit(200, (function(q){
      var results = this.options.onSearch(q);
      this.lookupPane.displayResults(results);
    }).bind(this));

    this.lookupPane.on('select', this.options.onSelect);

    this.keyListener = this.onKeydown.bind(this);

    $(document).on('keydown', this.onKeydown.bind(this));
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

    this.last_query = "";
  }
});

PathField.prototype.clearNodes = function() {
  this.partsNode.children().not(this.options.decorators).remove();
};

PathField.prototype.hasSelection = function() {
  return this.options.defaultValue !== this.value;
};

PathField.prototype.buildPath = function() {

  this.emit('submit', this.value.toString(this.values));

};

PathField.prototype.setParam = function(name, value) {
  if(this.values[name] != value) {
    this.values[name] = value;

    this.performSearch();

  }
};

PathField.prototype.performSearch = function() {

  if (this.hasSelection()) return;

  var query = decodeURI(this.value.toString(this.values));

  if (query === "") {
    this.last_query = "";
    this.cancel_search();
    this.lookupPane.reset();
    return;
  }

  if (this.last_query === query) {
    return;
  }

  this.last_query = query;

  this.cancel_search();
  this.cancel_search = this.search(query);

};

PathField.prototype.getParam = function(name) {
  return this.values[name] || "";
};

PathField.prototype.onSearch = function() {
  if (!this.hasSelection()) {
    this.emit('search');
  } else {
    this.reset();
    this.focus();
  }
};

PathField.prototype.focus = function() {

  var part = this.focusable_parts[0];

  if (part) $(part.node).focus();

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

  if (e.which == 27) {

    if (hasSelection) {
      e.preventDefault();
      this.reset();
    } else {
      this.lookupPane.reset();
      this.lookupPane.hide();
    }

    return false;
  }

};

PathField.prototype.onFocusPart = function(part, node) {
  clearTimeout(this.blur_timeout);
  if (!this.hasSelection()) {
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
              .insertBefore(this.partsNode.children(this.options.search));

  if (part.options.editable) {
    field.focusable_parts.push({node:node.get(0), part:part});
    node.text(field.getParam(part.name));
    node
      .attr('contenteditable', true)
      .attr("tabindex", 1)
      .attr("data-label", part.getLabel())
      .on('paste', function(e){
        e.preventDefault();
        document.execCommand('insertText', false, e.clipboardData.getData('text/plain'));
        return false;
      })
      .on('keydown', function(e) {
        var hasSelection = field.hasSelection();
        if (e.which == 38 && !hasSelection) { // up
          e.preventDefault();
          field.lookupPane.highlightPrevious();
          return;
        } else if (e.which == 40 && !hasSelection) { // down
          e.preventDefault();
          field.lookupPane.highlightNext();
          return;
        } else if (e.which == 13) {
          e.preventDefault();
          if (!hasSelection) field.lookupPane.selectCurrent();
          return false;
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

},{"../fn":1,"./component":5,"./lookup_pane":7,"util":30}],11:[function(require,module,exports){
var Component = require('./component'),
    querystring = require('querystring');

var RequestViewer = Component.extend({
  'container' : '#requests',
  'loadingClass' : 'loading',
  'init' : function() {

    this.container = $(this.options.container);
    this.node.append($("<header><code></code><code></code><span></span></header>"));

    var codes = this.node.find('header > code');

    this.method = codes.eq(0);
    this.path = codes.eq(1);
    this.query = codes.eq(2);

    this.status = this.node.find('header > span');
    this.node.prependTo(this.container);

    this.onResponse = this.onResponse.bind(this);

  },
  'onChange' : function(request) {

    this.method.text(request.method);
    this.path.text(request.path);

    var query = querystring.stringify(request.query);

    if (query !== '') {
      this.path.append($('<em></em>').text("?" + query));
    }

  }
});

RequestViewer.prototype.sent = function() {

  this.start_time = ts();

  this.node.addClass(this.options.loadingClass);

};

RequestViewer.prototype.onResponse = function(err, response) {

  this.node.removeClass(this.options.loadingClass);

  this.end_time = ts();
  if (err) {
    console.error("Error", err);
  } else {
    console.log("Response", response);
  }

  this.ellapsed = this.end_time - this.start_time;

  this.status.text(this.ellapsed + 'ms');

};

function ts() {
  return (new Date()).getTime();
}

module.exports = RequestViewer;
},{"./component":5,"querystring":28}],12:[function(require,module,exports){
var Component = require('./component'),
    fn = require('../fn');

var Tip = Component.extend({
  'opacity' : '0.9',
  'init' : function() {
    this.header = this.node.find('header');
    this.name = this.header.find('code');
    this.type = this.header.find('em');
    this.anchor = this.node.find('.anchor');
    this.cancel = function() {};
    this.contextBlurListener = this.hide.bind(this);

    this.positionDelayed = fn.rateLimit(200, this.positionTip.bind(this));

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
    }
  }
});

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

  context.one('blur', this.contextBlurListener);

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
},{"../fn":1,"./component":5}],13:[function(require,module,exports){
/**
 * LiquidMetal, version: 1.2.1 (2012-04-21)
 *
 * A mimetic poly-alloy of Quicksilver's scoring algorithm, essentially
 * LiquidMetal.
 *
 * For usage and examples, visit:
 * http://github.com/rmm5t/liquidmetal
 *
 * Licensed under the MIT:
 * http://www.opensource.org/licenses/mit-license.php
 *
 * Copyright (c) 2009-2012, Ryan McGeary (ryan -[at]- mcgeary [*dot*] org)
 */
(function(global) {
  var SCORE_NO_MATCH = 0.0;
  var SCORE_MATCH = 1.0;
  var SCORE_TRAILING = 0.8;
  var SCORE_TRAILING_BUT_STARTED = 0.9;
  var SCORE_BUFFER = 0.85;
  var WORD_SEPARATORS = " \t_-";

  var LiquidMetal = {
    lastScore: null,
    lastScoreArray: null,

    score: function(string, abbrev) {
      // short circuits
      if (abbrev.length === 0) return SCORE_TRAILING;
      if (abbrev.length > string.length) return SCORE_NO_MATCH;

      // match & score all
      var allScores = [];
      var search = string.toLowerCase();
      abbrev = abbrev.toLowerCase();
      this._scoreAll(string, search, abbrev, -1, 0, [], allScores);

      // complete miss
      if (allScores.length == 0) return 0;

      // sum per-character scores into overall scores,
      // selecting the maximum score
      var maxScore = 0.0, maxArray = [];
      for (var i = 0; i < allScores.length; i++) {
        var scores = allScores[i];
        var scoreSum = 0.0;
        for (var j = 0; j < string.length; j++) { scoreSum += scores[j]; }
        if (scoreSum > maxScore) {
          maxScore = scoreSum;
          maxArray = scores;
        }
      }

      // normalize max score by string length
      // s. t. the perfect match score = 1
      maxScore /= string.length;

      // record maximum score & score array, return
      this.lastScore = maxScore;
      this.lastScoreArray = maxArray;
      return maxScore;
    },

    _scoreAll: function(string, search, abbrev, searchIndex, abbrIndex, scores, allScores) {
      // save completed match scores at end of search
      if (abbrIndex == abbrev.length) {
        // add trailing score for the remainder of the match
        var started = (search.charAt(0) == abbrev.charAt(0));
        var trailScore = started ? SCORE_TRAILING_BUT_STARTED : SCORE_TRAILING;
        fillArray(scores, trailScore, scores.length, string.length);
        // save score clone (since reference is persisted in scores)
        allScores.push(scores.slice(0));
        return;
      }

      // consume current char to match
      var c = abbrev.charAt(abbrIndex);
      abbrIndex++;

      // cancel match if a character is missing
      var index = search.indexOf(c, searchIndex);
      if (index == -1) return;

      // match all instances of the abbreviaton char
      var scoreIndex = searchIndex; // score section to update
      while ((index = search.indexOf(c, searchIndex+1)) != -1) {
        // score this match according to context
        if (isNewWord(string, index)) {
          scores[index-1] = 1;
          fillArray(scores, SCORE_BUFFER, scoreIndex+1, index-1);
        }
        else if (isUpperCase(string, index)) {
          fillArray(scores, SCORE_BUFFER, scoreIndex+1, index);
        }
        else {
          fillArray(scores, SCORE_NO_MATCH, scoreIndex+1, index);
        }
        scores[index] = SCORE_MATCH;

        // consume matched string and continue search
        searchIndex = index;
        this._scoreAll(string, search, abbrev, searchIndex, abbrIndex, scores, allScores);
      }
    }
  };

  function isUpperCase(string, index) {
    var c = string.charAt(index);
    return ("A" <= c && c <= "Z");
  }

   function isNewWord(string, index) {
    var c = string.charAt(index-1);
    return (WORD_SEPARATORS.indexOf(c) != -1);
  }

  function fillArray(array, value, from, to) {
    for (var i = from; i < to; i++) { array[i] = value; }
    return array;
  }

  // Export as AMD...
  if (typeof define === 'function' && define.amd) {
    define(function () { return LiquidMetal; });
  }

  // ...or as a node module
  else if (typeof module !== 'undefined' && module.exports) {
    module.exports = LiquidMetal;
  }

  else {
    global.LiquidMetal = LiquidMetal;
  }
})(typeof window !== 'undefined' ? window : this);

},{}],14:[function(require,module,exports){

/**
 * Module dependencies.
 */

var uid = require('uid');
var event = require('component-event');
var Promise = require('promise');
var debug = require('debug')('wpcom-proxy-request');

/**
 * Export `request` function.
 */

module.exports = Promise.nodeify(request);

/**
 * WordPress.com REST API base endpoint.
 */

var proxyOrigin = 'https://public-api.wordpress.com';

/**
 * "Origin" of the current HTML page.
 */

var origin = window.location.protocol + '//' + window.location.hostname;
debug('using "origin": %s', origin);

/**
 * Reference to the <iframe> DOM element.
 * Gets set in the install() function.
 */

var iframe;

/**
 * Set to `true` upon the iframe's "load" event.
 */

var loaded = false;

/**
 * Array of buffered API requests. Added to when API requests are done before the
 * proxy <iframe> is "loaded", and fulfilled once the "load" DOM event on the
 * iframe occurs.
 */

var buffered;

/**
 * In-flight API request Promise instances.
 */

var requests = {};

/**
 * Performs a "proxied REST API request". This happens by calling
 * `iframe.postMessage()` on the proxy iframe instance, which from there
 * takes care of WordPress.com user authentication (via the currently
 * logged user's cookies).
 *
 * @param {Object|String} params
 * @api public
 */

function request (params) {
  debug('request()', params);

  if ('string' == typeof params) {
    params = { path: params };
  }

  // inject the <iframe> upon the first proxied API request
  if (!iframe) install();

  // generate a uid for this API request
  var id = uid();
  params.callback = id;
  params.supports_args = true; // supports receiving variable amount of arguments

  // force uppercase "method" since that's what the <iframe> is expecting
  params.method = String(params.method || 'GET').toUpperCase();

  debug('params object:', params);

  var req = new Promise(function (resolve, reject) {
    if (loaded) {
      submitRequest(params, resolve, reject);
    } else {
      debug('buffering API request since proxying <iframe> is not yet loaded');
      buffered.push([ params, resolve, reject ]);
    }
  });

  // store the `params` object so that "onmessage" can access it again
  requests[id] = params;

  return req;
}

/**
 * Calls the postMessage() function on the <iframe>, and afterwards add the
 * `resolve` and `reject` functions to the "params" object (after it's been
 * serialized into the iframe context).
 *
 * @param {Object} params
 * @param {Function} resolve
 * @param {Function} reject
 * @api private
 */

function submitRequest (params, resolve, reject) {
  debug('sending API request to proxy <iframe>:', params);

  iframe.contentWindow.postMessage(params, proxyOrigin);

  // needs to be added after the `.postMessage()` call otherwise
  // a DOM error is thrown
  params.resolve = resolve;
  params.reject = reject;
}

/**
 * Injects the proxy <iframe> instance in the <body> of the current
 * HTML page.
 *
 * @api private
 */

function install () {
  debug('install()');
  if (iframe) uninstall();

  buffered = [];

  // listen to messages sent to `window`
  event.bind(window, 'message', onmessage);

  // create the <iframe>
  iframe = document.createElement('iframe');

  // set `loaded` to true once the "load" event happens
  event.bind(iframe, 'load', onload);

  // set `src` and hide the iframe
  iframe.src = proxyOrigin + '/wp-admin/rest-proxy/#' + origin;
  iframe.style.display = 'none';

  // inject the <iframe> into the <body>
  document.body.appendChild(iframe);
}

/**
 * The proxy <iframe> instance's "load" event callback function.
 *
 * @param {Event} e
 * @api private
 */

function onload (e) {
  debug('proxy <iframe> "load" event');
  loaded = true;

  // flush any buffered API calls
  for (var i = 0; i < buffered.length; i++) {
    submitRequest.apply(null, buffered[i]);
  }
  buffered = null;
}

/**
 * The main `window` object's "message" event callback function.
 *
 * @param {Event} e
 * @api private
 */

function onmessage (e) {
  debug('onmessage');

  // safeguard...
  if (e.origin !== proxyOrigin) {
    debug('ignoring message... %s !== %s', e.origin, proxyOrigin);
    return;
  }

  var data = e.data;
  if (!data || !data.length) {
    debug('`e.data` doesn\'t appear to be an Array, bailing...');
    return;
  }

  var id = data[data.length - 1];
  var params = requests[id];
  delete requests[id];

  var body = data[0];
  var statusCode = data[1];
  var headers = data[2];
  debug('got %s status code for URL: %s', statusCode, params.path);

  if (body && headers) {
    body._headers = headers;
  }

  if (null == statusCode || 2 === Math.floor(statusCode / 100)) {
    // 2xx status code, success
    params.resolve(body);
  } else {
    // any other status code is a failure
    var err = new Error();
    err.statusCode = statusCode;
    for (var i in body) err[i] = body[i];
    if (body.error) err.name = toTitle(body.error) + 'Error';

    params.reject(err);
  }
}

function toTitle (str) {
  if (!str || 'string' !== typeof str) return '';
  return str.replace(/((^|_)[a-z])/g, function ($1) {
    return $1.toUpperCase().replace('_', '');
  });
}

},{"component-event":15,"debug":16,"promise":20,"uid":22}],15:[function(require,module,exports){
var bind = window.addEventListener ? 'addEventListener' : 'attachEvent',
    unbind = window.removeEventListener ? 'removeEventListener' : 'detachEvent',
    prefix = bind !== 'addEventListener' ? 'on' : '';

/**
 * Bind `el` event `type` to `fn`.
 *
 * @param {Element} el
 * @param {String} type
 * @param {Function} fn
 * @param {Boolean} capture
 * @return {Function}
 * @api public
 */

exports.bind = function(el, type, fn, capture){
  el[bind](prefix + type, fn, capture || false);
  return fn;
};

/**
 * Unbind `el` event `type`'s callback `fn`.
 *
 * @param {Element} el
 * @param {String} type
 * @param {Function} fn
 * @param {Boolean} capture
 * @return {Function}
 * @api public
 */

exports.unbind = function(el, type, fn, capture){
  el[unbind](prefix + type, fn, capture || false);
  return fn;
};
},{}],16:[function(require,module,exports){

/**
 * This is the web browser implementation of `debug()`.
 *
 * Expose `debug()` as the module.
 */

exports = module.exports = require('./debug');
exports.log = log;
exports.formatArgs = formatArgs;
exports.save = save;
exports.load = load;
exports.useColors = useColors;

/**
 * Colors.
 */

exports.colors = [
  'lightseagreen',
  'forestgreen',
  'goldenrod',
  'dodgerblue',
  'darkorchid',
  'crimson'
];

/**
 * Currently only WebKit-based Web Inspectors and the Firebug
 * extension (*not* the built-in Firefox web inpector) are
 * known to support "%c" CSS customizations.
 *
 * TODO: add a `localStorage` variable to explicitly enable/disable colors
 */

function useColors() {
  // is webkit? http://stackoverflow.com/a/16459606/376773
  return ('WebkitAppearance' in document.documentElement.style) ||
    // is firebug? http://stackoverflow.com/a/398120/376773
    (window.console && (console.firebug || (console.exception && console.table)));
}

/**
 * Map %j to `JSON.stringify()`, since no Web Inspectors do that by default.
 */

exports.formatters.j = function(v) {
  return JSON.stringify(v);
};


/**
 * Colorize log arguments if enabled.
 *
 * @api public
 */

function formatArgs() {
  var args = arguments;
  var useColors = this.useColors;

  args[0] = (useColors ? '%c' : '')
    + this.namespace
    + (useColors ? '%c ' : ' ')
    + args[0]
    + (useColors ? '%c ' : ' ')
    + '+' + exports.humanize(this.diff);

  if (!useColors) return args

  var c = 'color: ' + this.color;
  args = [args[0], c, ''].concat(Array.prototype.slice.call(args, 1));

  // the final "%c" is somewhat tricky, because there could be other
  // arguments passed either before or after the %c, so we need to
  // figure out the correct index to insert the CSS into
  var index = 0;
  var lastC = 0;
  args[0].replace(/%[a-z%]/g, function(match) {
    if ('%%' === match) return;
    index++;
    if ('%c' === match) {
      // we only are interested in the *last* %c
      // (the user may have provided their own)
      lastC = index;
    }
  });

  args.splice(lastC, 0, c);
  return args;
}

/**
 * Invokes `console.log()` when available.
 * No-op when `console.log` is not a "function".
 *
 * @api public
 */

function log() {
  // This hackery is required for IE8,
  // where the `console.log` function doesn't have 'apply'
  return 'object' == typeof console
    && 'function' == typeof console.log
    && Function.prototype.apply.call(console.log, console, arguments);
}

/**
 * Save `namespaces`.
 *
 * @param {String} namespaces
 * @api private
 */

function save(namespaces) {
  try {
    if (null == namespaces) {
      localStorage.removeItem('debug');
    } else {
      localStorage.debug = namespaces;
    }
  } catch(e) {}
}

/**
 * Load `namespaces`.
 *
 * @return {String} returns the previously persisted debug modes
 * @api private
 */

function load() {
  var r;
  try {
    r = localStorage.debug;
  } catch(e) {}
  return r;
}

/**
 * Enable namespaces listed in `localStorage.debug` initially.
 */

exports.enable(load());

},{"./debug":17}],17:[function(require,module,exports){

/**
 * This is the common logic for both the Node.js and web browser
 * implementations of `debug()`.
 *
 * Expose `debug()` as the module.
 */

exports = module.exports = debug;
exports.coerce = coerce;
exports.disable = disable;
exports.enable = enable;
exports.enabled = enabled;
exports.humanize = require('ms');

/**
 * The currently active debug mode names, and names to skip.
 */

exports.names = [];
exports.skips = [];

/**
 * Map of special "%n" handling functions, for the debug "format" argument.
 *
 * Valid key names are a single, lowercased letter, i.e. "n".
 */

exports.formatters = {};

/**
 * Previously assigned color.
 */

var prevColor = 0;

/**
 * Previous log timestamp.
 */

var prevTime;

/**
 * Select a color.
 *
 * @return {Number}
 * @api private
 */

function selectColor() {
  return exports.colors[prevColor++ % exports.colors.length];
}

/**
 * Create a debugger with the given `namespace`.
 *
 * @param {String} namespace
 * @return {Function}
 * @api public
 */

function debug(namespace) {

  // define the `disabled` version
  function disabled() {
  }
  disabled.enabled = false;

  // define the `enabled` version
  function enabled() {

    var self = enabled;

    // set `diff` timestamp
    var curr = +new Date();
    var ms = curr - (prevTime || curr);
    self.diff = ms;
    self.prev = prevTime;
    self.curr = curr;
    prevTime = curr;

    // add the `color` if not set
    if (null == self.useColors) self.useColors = exports.useColors();
    if (null == self.color && self.useColors) self.color = selectColor();

    var args = Array.prototype.slice.call(arguments);

    args[0] = exports.coerce(args[0]);

    if ('string' !== typeof args[0]) {
      // anything else let's inspect with %o
      args = ['%o'].concat(args);
    }

    // apply any `formatters` transformations
    var index = 0;
    args[0] = args[0].replace(/%([a-z%])/g, function(match, format) {
      // if we encounter an escaped % then don't increase the array index
      if (match === '%%') return match;
      index++;
      var formatter = exports.formatters[format];
      if ('function' === typeof formatter) {
        var val = args[index];
        match = formatter.call(self, val);

        // now we need to remove `args[index]` since it's inlined in the `format`
        args.splice(index, 1);
        index--;
      }
      return match;
    });

    if ('function' === typeof exports.formatArgs) {
      args = exports.formatArgs.apply(self, args);
    }
    var logFn = exports.log || enabled.log || console.log.bind(console);
    logFn.apply(self, args);
  }
  enabled.enabled = true;

  var fn = exports.enabled(namespace) ? enabled : disabled;

  fn.namespace = namespace;

  return fn;
}

/**
 * Enables a debug mode by namespaces. This can include modes
 * separated by a colon and wildcards.
 *
 * @param {String} namespaces
 * @api public
 */

function enable(namespaces) {
  exports.save(namespaces);

  var split = (namespaces || '').split(/[\s,]+/);
  var len = split.length;

  for (var i = 0; i < len; i++) {
    if (!split[i]) continue; // ignore empty strings
    namespaces = split[i].replace('*', '.*?');
    if (namespaces[0] === '-') {
      exports.skips.push(new RegExp('^' + namespaces.substr(1) + '$'));
    } else {
      exports.names.push(new RegExp('^' + namespaces + '$'));
    }
  }
}

/**
 * Disable debug output.
 *
 * @api public
 */

function disable() {
  exports.enable('');
}

/**
 * Returns true if the given mode name is enabled, false otherwise.
 *
 * @param {String} name
 * @return {Boolean}
 * @api public
 */

function enabled(name) {
  var i, len;
  for (i = 0, len = exports.skips.length; i < len; i++) {
    if (exports.skips[i].test(name)) {
      return false;
    }
  }
  for (i = 0, len = exports.names.length; i < len; i++) {
    if (exports.names[i].test(name)) {
      return true;
    }
  }
  return false;
}

/**
 * Coerce `val`.
 *
 * @param {Mixed} val
 * @return {Mixed}
 * @api private
 */

function coerce(val) {
  if (val instanceof Error) return val.stack || val.message;
  return val;
}

},{"ms":18}],18:[function(require,module,exports){
/**
 * Helpers.
 */

var s = 1000;
var m = s * 60;
var h = m * 60;
var d = h * 24;
var y = d * 365.25;

/**
 * Parse or format the given `val`.
 *
 * Options:
 *
 *  - `long` verbose formatting [false]
 *
 * @param {String|Number} val
 * @param {Object} options
 * @return {String|Number}
 * @api public
 */

module.exports = function(val, options){
  options = options || {};
  if ('string' == typeof val) return parse(val);
  return options.long
    ? long(val)
    : short(val);
};

/**
 * Parse the given `str` and return milliseconds.
 *
 * @param {String} str
 * @return {Number}
 * @api private
 */

function parse(str) {
  var match = /^((?:\d+)?\.?\d+) *(ms|seconds?|s|minutes?|m|hours?|h|days?|d|years?|y)?$/i.exec(str);
  if (!match) return;
  var n = parseFloat(match[1]);
  var type = (match[2] || 'ms').toLowerCase();
  switch (type) {
    case 'years':
    case 'year':
    case 'y':
      return n * y;
    case 'days':
    case 'day':
    case 'd':
      return n * d;
    case 'hours':
    case 'hour':
    case 'h':
      return n * h;
    case 'minutes':
    case 'minute':
    case 'm':
      return n * m;
    case 'seconds':
    case 'second':
    case 's':
      return n * s;
    case 'ms':
      return n;
  }
}

/**
 * Short format for `ms`.
 *
 * @param {Number} ms
 * @return {String}
 * @api private
 */

function short(ms) {
  if (ms >= d) return Math.round(ms / d) + 'd';
  if (ms >= h) return Math.round(ms / h) + 'h';
  if (ms >= m) return Math.round(ms / m) + 'm';
  if (ms >= s) return Math.round(ms / s) + 's';
  return ms + 'ms';
}

/**
 * Long format for `ms`.
 *
 * @param {Number} ms
 * @return {String}
 * @api private
 */

function long(ms) {
  return plural(ms, d, 'day')
    || plural(ms, h, 'hour')
    || plural(ms, m, 'minute')
    || plural(ms, s, 'second')
    || ms + ' ms';
}

/**
 * Pluralization helper.
 */

function plural(ms, n, name) {
  if (ms < n) return;
  if (ms < n * 1.5) return Math.floor(ms / n) + ' ' + name;
  return Math.ceil(ms / n) + ' ' + name + 's';
}

},{}],19:[function(require,module,exports){
'use strict';

var asap = require('asap')

module.exports = Promise
function Promise(fn) {
  if (typeof this !== 'object') throw new TypeError('Promises must be constructed via new')
  if (typeof fn !== 'function') throw new TypeError('not a function')
  var state = null
  var value = null
  var deferreds = []
  var self = this

  this.then = function(onFulfilled, onRejected) {
    return new Promise(function(resolve, reject) {
      handle(new Handler(onFulfilled, onRejected, resolve, reject))
    })
  }

  function handle(deferred) {
    if (state === null) {
      deferreds.push(deferred)
      return
    }
    asap(function() {
      var cb = state ? deferred.onFulfilled : deferred.onRejected
      if (cb === null) {
        (state ? deferred.resolve : deferred.reject)(value)
        return
      }
      var ret
      try {
        ret = cb(value)
      }
      catch (e) {
        deferred.reject(e)
        return
      }
      deferred.resolve(ret)
    })
  }

  function resolve(newValue) {
    try { //Promise Resolution Procedure: https://github.com/promises-aplus/promises-spec#the-promise-resolution-procedure
      if (newValue === self) throw new TypeError('A promise cannot be resolved with itself.')
      if (newValue && (typeof newValue === 'object' || typeof newValue === 'function')) {
        var then = newValue.then
        if (typeof then === 'function') {
          doResolve(then.bind(newValue), resolve, reject)
          return
        }
      }
      state = true
      value = newValue
      finale()
    } catch (e) { reject(e) }
  }

  function reject(newValue) {
    state = false
    value = newValue
    finale()
  }

  function finale() {
    for (var i = 0, len = deferreds.length; i < len; i++)
      handle(deferreds[i])
    deferreds = null
  }

  doResolve(fn, resolve, reject)
}


function Handler(onFulfilled, onRejected, resolve, reject){
  this.onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : null
  this.onRejected = typeof onRejected === 'function' ? onRejected : null
  this.resolve = resolve
  this.reject = reject
}

/**
 * Take a potentially misbehaving resolver function and make sure
 * onFulfilled and onRejected are only called once.
 *
 * Makes no guarantees about asynchrony.
 */
function doResolve(fn, onFulfilled, onRejected) {
  var done = false;
  try {
    fn(function (value) {
      if (done) return
      done = true
      onFulfilled(value)
    }, function (reason) {
      if (done) return
      done = true
      onRejected(reason)
    })
  } catch (ex) {
    if (done) return
    done = true
    onRejected(ex)
  }
}

},{"asap":21}],20:[function(require,module,exports){
'use strict';

//This file contains then/promise specific extensions to the core promise API

var Promise = require('./core.js')
var asap = require('asap')

module.exports = Promise

/* Static Functions */

function ValuePromise(value) {
  this.then = function (onFulfilled) {
    if (typeof onFulfilled !== 'function') return this
    return new Promise(function (resolve, reject) {
      asap(function () {
        try {
          resolve(onFulfilled(value))
        } catch (ex) {
          reject(ex);
        }
      })
    })
  }
}
ValuePromise.prototype = Object.create(Promise.prototype)

var TRUE = new ValuePromise(true)
var FALSE = new ValuePromise(false)
var NULL = new ValuePromise(null)
var UNDEFINED = new ValuePromise(undefined)
var ZERO = new ValuePromise(0)
var EMPTYSTRING = new ValuePromise('')

Promise.from = Promise.cast = function (value) {
  if (value instanceof Promise) return value

  if (value === null) return NULL
  if (value === undefined) return UNDEFINED
  if (value === true) return TRUE
  if (value === false) return FALSE
  if (value === 0) return ZERO
  if (value === '') return EMPTYSTRING

  if (typeof value === 'object' || typeof value === 'function') {
    try {
      var then = value.then
      if (typeof then === 'function') {
        return new Promise(then.bind(value))
      }
    } catch (ex) {
      return new Promise(function (resolve, reject) {
        reject(ex)
      })
    }
  }

  return new ValuePromise(value)
}
Promise.denodeify = function (fn, argumentCount) {
  argumentCount = argumentCount || Infinity
  return function () {
    var self = this
    var args = Array.prototype.slice.call(arguments)
    return new Promise(function (resolve, reject) {
      while (args.length && args.length > argumentCount) {
        args.pop()
      }
      args.push(function (err, res) {
        if (err) reject(err)
        else resolve(res)
      })
      fn.apply(self, args)
    })
  }
}
Promise.nodeify = function (fn) {
  return function () {
    var args = Array.prototype.slice.call(arguments)
    var callback = typeof args[args.length - 1] === 'function' ? args.pop() : null
    try {
      return fn.apply(this, arguments).nodeify(callback)
    } catch (ex) {
      if (callback === null || typeof callback == 'undefined') {
        return new Promise(function (resolve, reject) { reject(ex) })
      } else {
        asap(function () {
          callback(ex)
        })
      }
    }
  }
}

Promise.all = function () {
  var args = Array.prototype.slice.call(arguments.length === 1 && Array.isArray(arguments[0]) ? arguments[0] : arguments)

  return new Promise(function (resolve, reject) {
    if (args.length === 0) return resolve([])
    var remaining = args.length
    function res(i, val) {
      try {
        if (val && (typeof val === 'object' || typeof val === 'function')) {
          var then = val.then
          if (typeof then === 'function') {
            then.call(val, function (val) { res(i, val) }, reject)
            return
          }
        }
        args[i] = val
        if (--remaining === 0) {
          resolve(args);
        }
      } catch (ex) {
        reject(ex)
      }
    }
    for (var i = 0; i < args.length; i++) {
      res(i, args[i])
    }
  })
}

/* Prototype Methods */

Promise.prototype.done = function (onFulfilled, onRejected) {
  var self = arguments.length ? this.then.apply(this, arguments) : this
  self.then(null, function (err) {
    asap(function () {
      throw err
    })
  })
}

Promise.prototype.nodeify = function (callback) {
  if (callback === null || typeof callback == 'undefined') return this

  this.then(function (value) {
    asap(function () {
      callback(null, value)
    })
  }, function (err) {
    asap(function () {
      callback(err)
    })
  })
}

Promise.prototype.catch = function (onRejected) {
  return this.then(null, onRejected);
}


Promise.resolve = function (value) {
  return new Promise(function (resolve) { 
    resolve(value);
  });
}

Promise.reject = function (value) {
  return new Promise(function (resolve, reject) { 
    reject(value);
  });
}

Promise.race = function (values) {
  return new Promise(function (resolve, reject) { 
    values.map(function(value){
      Promise.cast(value).then(resolve, reject);
    })
  });
}

},{"./core.js":19,"asap":21}],21:[function(require,module,exports){
(function (process){

// Use the fastest possible means to execute a task in a future turn
// of the event loop.

// linked list of tasks (single, with head node)
var head = {task: void 0, next: null};
var tail = head;
var flushing = false;
var requestFlush = void 0;
var isNodeJS = false;

function flush() {
    /* jshint loopfunc: true */

    while (head.next) {
        head = head.next;
        var task = head.task;
        head.task = void 0;
        var domain = head.domain;

        if (domain) {
            head.domain = void 0;
            domain.enter();
        }

        try {
            task();

        } catch (e) {
            if (isNodeJS) {
                // In node, uncaught exceptions are considered fatal errors.
                // Re-throw them synchronously to interrupt flushing!

                // Ensure continuation if the uncaught exception is suppressed
                // listening "uncaughtException" events (as domains does).
                // Continue in next event to avoid tick recursion.
                if (domain) {
                    domain.exit();
                }
                setTimeout(flush, 0);
                if (domain) {
                    domain.enter();
                }

                throw e;

            } else {
                // In browsers, uncaught exceptions are not fatal.
                // Re-throw them asynchronously to avoid slow-downs.
                setTimeout(function() {
                   throw e;
                }, 0);
            }
        }

        if (domain) {
            domain.exit();
        }
    }

    flushing = false;
}

if (typeof process !== "undefined" && process.nextTick) {
    // Node.js before 0.9. Note that some fake-Node environments, like the
    // Mocha test runner, introduce a `process` global without a `nextTick`.
    isNodeJS = true;

    requestFlush = function () {
        process.nextTick(flush);
    };

} else if (typeof setImmediate === "function") {
    // In IE10, Node.js 0.9+, or https://github.com/NobleJS/setImmediate
    if (typeof window !== "undefined") {
        requestFlush = setImmediate.bind(window, flush);
    } else {
        requestFlush = function () {
            setImmediate(flush);
        };
    }

} else if (typeof MessageChannel !== "undefined") {
    // modern browsers
    // http://www.nonblocking.io/2011/06/windownexttick.html
    var channel = new MessageChannel();
    channel.port1.onmessage = flush;
    requestFlush = function () {
        channel.port2.postMessage(0);
    };

} else {
    // old browsers
    requestFlush = function () {
        setTimeout(flush, 0);
    };
}

function asap(task) {
    tail = tail.next = {
        task: task,
        domain: isNodeJS && process.domain,
        next: null
    };

    if (!flushing) {
        flushing = true;
        requestFlush();
    }
};

module.exports = asap;


}).call(this,require("K/m7xv"))
},{"K/m7xv":25}],22:[function(require,module,exports){
/**
 * Export `uid`
 */

module.exports = uid;

/**
 * Create a `uid`
 *
 * @param {String} len
 * @return {String} uid
 */

function uid(len) {
  len = len || 7;
  return Math.random().toString(35).substr(2, len);
}

},{}],23:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      } else {
        throw TypeError('Uncaught, unspecified "error" event.');
      }
      return false;
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        len = arguments.length;
        args = new Array(len - 1);
        for (i = 1; i < len; i++)
          args[i - 1] = arguments[i];
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    len = arguments.length;
    args = new Array(len - 1);
    for (i = 1; i < len; i++)
      args[i - 1] = arguments[i];

    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    var m;
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.listenerCount = function(emitter, type) {
  var ret;
  if (!emitter._events || !emitter._events[type])
    ret = 0;
  else if (isFunction(emitter._events[type]))
    ret = 1;
  else
    ret = emitter._events[type].length;
  return ret;
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}],24:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],25:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            var source = ev.source;
            if ((source === window || source === null) && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
}

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}],26:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

// If obj.hasOwnProperty has been overridden, then calling
// obj.hasOwnProperty(prop) will break.
// See: https://github.com/joyent/node/issues/1707
function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

module.exports = function(qs, sep, eq, options) {
  sep = sep || '&';
  eq = eq || '=';
  var obj = {};

  if (typeof qs !== 'string' || qs.length === 0) {
    return obj;
  }

  var regexp = /\+/g;
  qs = qs.split(sep);

  var maxKeys = 1000;
  if (options && typeof options.maxKeys === 'number') {
    maxKeys = options.maxKeys;
  }

  var len = qs.length;
  // maxKeys <= 0 means that we should not limit keys count
  if (maxKeys > 0 && len > maxKeys) {
    len = maxKeys;
  }

  for (var i = 0; i < len; ++i) {
    var x = qs[i].replace(regexp, '%20'),
        idx = x.indexOf(eq),
        kstr, vstr, k, v;

    if (idx >= 0) {
      kstr = x.substr(0, idx);
      vstr = x.substr(idx + 1);
    } else {
      kstr = x;
      vstr = '';
    }

    k = decodeURIComponent(kstr);
    v = decodeURIComponent(vstr);

    if (!hasOwnProperty(obj, k)) {
      obj[k] = v;
    } else if (isArray(obj[k])) {
      obj[k].push(v);
    } else {
      obj[k] = [obj[k], v];
    }
  }

  return obj;
};

var isArray = Array.isArray || function (xs) {
  return Object.prototype.toString.call(xs) === '[object Array]';
};

},{}],27:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

var stringifyPrimitive = function(v) {
  switch (typeof v) {
    case 'string':
      return v;

    case 'boolean':
      return v ? 'true' : 'false';

    case 'number':
      return isFinite(v) ? v : '';

    default:
      return '';
  }
};

module.exports = function(obj, sep, eq, name) {
  sep = sep || '&';
  eq = eq || '=';
  if (obj === null) {
    obj = undefined;
  }

  if (typeof obj === 'object') {
    return map(objectKeys(obj), function(k) {
      var ks = encodeURIComponent(stringifyPrimitive(k)) + eq;
      if (isArray(obj[k])) {
        return map(obj[k], function(v) {
          return ks + encodeURIComponent(stringifyPrimitive(v));
        }).join(sep);
      } else {
        return ks + encodeURIComponent(stringifyPrimitive(obj[k]));
      }
    }).join(sep);

  }

  if (!name) return '';
  return encodeURIComponent(stringifyPrimitive(name)) + eq +
         encodeURIComponent(stringifyPrimitive(obj));
};

var isArray = Array.isArray || function (xs) {
  return Object.prototype.toString.call(xs) === '[object Array]';
};

function map (xs, f) {
  if (xs.map) return xs.map(f);
  var res = [];
  for (var i = 0; i < xs.length; i++) {
    res.push(f(xs[i], i));
  }
  return res;
}

var objectKeys = Object.keys || function (obj) {
  var res = [];
  for (var key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) res.push(key);
  }
  return res;
};

},{}],28:[function(require,module,exports){
'use strict';

exports.decode = exports.parse = require('./decode');
exports.encode = exports.stringify = require('./encode');

},{"./decode":26,"./encode":27}],29:[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],30:[function(require,module,exports){
(function (process,global){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(global.process)) {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  if (process.noDeprecation === true) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnviron;
exports.debuglog = function(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = require('./support/isBuffer');

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = require('inherits');

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

}).call(this,require("K/m7xv"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./support/isBuffer":29,"K/m7xv":25,"inherits":24}]},{},[6])