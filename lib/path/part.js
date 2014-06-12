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