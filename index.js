
module.exports = function(fn, ms){
  var ok = true;
  return function(){
    if (!ok) return;

    // invoke
    fn.apply(this, arguments);

    // timeout
    ok = false;
    setTimeout(function(){
      ok = true;
    }, ms);
  }
};
