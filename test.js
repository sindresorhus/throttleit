var assert = require('assert');
var throttle = require('./');

describe('throttle', function(){
  var invoked = 0;
  var interval;
  function count(){
    invoked++;
  };

  afterEach(function(){
    invoked = 0;
    clearInterval(interval);
  });

  it('should throttle a function', function(done){
    var wait = 100;
    var total = 1000;
    var fn = throttle(count, wait);
    interval = setInterval(fn, 20);
    setTimeout(function(){
      assert(invoked === (total / wait));
      done();
    }, total + 5);
  });

  it('should throttle with a max', function(done){
    var wait = 100;
    var max = 3;
    var total = 1000;
    var fn = throttle(count, wait, max);
    interval = setInterval(fn, 20);
    setTimeout(function(){
      assert(invoked === ((total / wait) * max));
      done();
    }, total + 5);
  });
});