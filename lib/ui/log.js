module.exports = function(callback) {
  if (callback) {
    return function (){
      console.log.apply(console, arguments);
      callback.apply(null, arguments);
    };    
  }
  console.log.apply(console, arguments);
};
