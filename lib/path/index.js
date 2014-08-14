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

function DefaultPath() {
  var part = new Part("path", {label:"", type:"param", editable:true});
  part.toString = function(values) {
    return this.encode(values.path || "");
  };
  this.parts = [part];
}

DefaultPath.prototype = Object.create(Path.prototype);

function QueryPart() {
  Part.call(this, 'query', { type:"param", label:'query', editable:true});
}

QueryPart.prototype = Object.create(Part.prototype);

QueryPart.prototype.toString = function(values) {
  return values.query || '';
};

module.exports.Path = Path;
module.exports.Part = Part;
module.exports.DefaultPath = DefaultPath;
module.exports.QueryPart = QueryPart;
