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
