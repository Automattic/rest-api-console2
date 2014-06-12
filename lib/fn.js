
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