const test = require('ava');
const throttle = require('./index.js');

const delay = async duration => new Promise(resolve => {
	setTimeout(resolve, duration);
});

function counter() {
	function count() {
		count.callCount++;
	}

	count.callCount = 0;
	return count;
}

test('throttled function is called at most once per interval', async t => {
	const count = counter();
	const wait = 100;
	const total = 300;
	const throttled = throttle(count, wait);
	const interval = setInterval(throttled, 20);

	await delay(total);
	clearInterval(interval);

	// Using floor since the first call happens immediately
	const expectedCalls = 1 + Math.floor((total - wait) / wait);
	t.is(count.callCount, expectedCalls, 'Should call function based on total time and wait interval');
});

test('throttled function executes final call after wait time', async t => {
	const count = counter();
	const wait = 100;
	const throttled = throttle(count, wait);
	throttled();
	throttled();

	t.is(count.callCount, 1, 'Should call once immediately');

	await delay(wait + 10);
	t.is(count.callCount, 2, 'Should call again after wait interval');
});

test('throttled function preserves last context', async t => {
	let context;
	const wait = 100;
	const throttled = throttle(function () {
		context = this; // eslint-disable-line unicorn/no-this-assignment
	}, wait);

	const foo = {};
	const bar = {};
	throttled.call(foo);
	throttled.call(bar);

	t.is(context, foo, 'Context should be first call context initially');

	await delay(wait + 5);
	t.is(context, bar, 'Context should be last call context after wait');
});

test('throttled function preserves last arguments', async t => {
	let arguments_;
	const wait = 100;
	const throttled = throttle((...localArguments) => {
		arguments_ = localArguments;
	}, wait);

	throttled(1);
	throttled(2);

	t.is(arguments_[0], 1, 'Arguments should be from first call initially');

	await delay(wait + 5);
	t.is(arguments_[0], 2, 'Arguments should be from last call after wait');
});

test('throttled function handles rapid succession calls', async t => {
	const count = counter();
	const wait = 50;
	const throttled = throttle(count, wait);

	throttled();
	throttled();
	throttled();

	t.is(count.callCount, 1, 'Should call once immediately despite multiple rapid calls');

	await delay(wait + 10);
	t.is(count.callCount, 2, 'Should call again after wait interval');
});

test('throttled function responds to different arguments', async t => {
	let lastArg;
	const wait = 50;
	const throttled = throttle(arg => {
		lastArg = arg;
	}, wait);

	throttled(1);
	throttled(2);
	throttled(3);

	t.is(lastArg, 1, 'Should capture first argument initially');

	await delay(wait + 10);
	t.is(lastArg, 3, 'Should capture last argument after wait interval');
});

test('throttled function handles repeated calls post-wait', async t => {
	const count = counter();
	const wait = 50;
	const throttled = throttle(count, wait);

	throttled();
	await delay(wait + 10);
	throttled();

	t.is(count.callCount, 2, 'Should allow a call after wait period has elapsed');
});

test('throttled function does not call function within wait time', async t => {
	const count = counter();
	const wait = 100;
	const throttled = throttle(count, wait);

	throttled();
	await delay(wait / 2);
	throttled();

	t.is(count.callCount, 1, 'Should not call function again within wait time');
});

test('throttled function with zero wait time calls function immediately each time', t => {
	const count = counter();
	const wait = 0;
	const throttled = throttle(count, wait);

	throttled();
	throttled();
	throttled();

	t.is(count.callCount, 3, 'Should call function immediately on each invocation with zero wait time');
});

test('throttled function with large wait time delays subsequent calls appropriately', async t => {
	const count = counter();
	const wait = 1000; // 1 second
	const throttled = throttle(count, wait);

	throttled();
	t.is(count.callCount, 1, 'Should call function immediately for the first time');

	// Attempt a call before the wait time elapses
	await delay(500);
	throttled();
	t.is(count.callCount, 1, 'Should not call function again before wait time elapses');

	// Check after the wait time
	await delay(600); // Total 1100ms
	t.is(count.callCount, 2, 'Should call function again after wait time elapses');
});

test('throttled function handles calls from different contexts', async t => {
	const wait = 100;

	const throttled = throttle(function () {
		this.callCount = (this.callCount ?? 0) + 1;
	}, wait);

	const objectA = {};
	const objectB = {};

	throttled.call(objectA);
	throttled.call(objectB);

	t.is(objectA.callCount, 1, 'Should call function with first context immediately');
	t.is(objectB.callCount, undefined, 'Should not call function with second context immediately');

	await delay(wait + 10);
	t.is(objectB.callCount, 1, 'Should call function with second context after wait time');
});

test('throttled function allows immediate invocation after wait time from last call', async t => {
	const count = counter();
	const wait = 100;
	const throttled = throttle(count, wait);

	throttled();
	await delay(wait + 10);
	throttled();

	t.is(count.callCount, 2, 'Should allow immediate invocation after wait time from last call');
});

test('throttled function handles rapid calls with short delays', async t => {
	const count = counter();
	const wait = 100;
	const throttled = throttle(count, wait);

	throttled();
	await delay(30);
	throttled();
	await delay(30);
	throttled();

	t.is(count.callCount, 1, 'Should only call once despite rapid calls with short delays');

	await delay(wait);
	t.is(count.callCount, 2, 'Should call again after wait time');
});

test('throttled function with extremely short wait time behaves correctly', async t => {
	const count = counter();
	const wait = 1; // 1 millisecond
	const throttled = throttle(count, wait);

	throttled();
	throttled();
	throttled();

	await delay(5); // Slightly longer than the wait time
	t.true(count.callCount >= 1, 'Should call at least once with extremely short wait time');
});

test('simultaneous throttled functions with different wait times operate independently', async t => {
	const count1 = counter();
	const count2 = counter();
	const wait1 = 50;
	const wait2 = 150;
	const throttled1 = throttle(count1, wait1);
	const throttled2 = throttle(count2, wait2);

	throttled1();
	throttled2();
	await delay(60); // Just over wait1, but under wait2
	throttled1();
	throttled2();

	t.is(count1.callCount, 2, 'First throttled function should be called twice');
	t.is(count2.callCount, 1, 'Second throttled function should be called once');
});

test('throttled functions with side effects only apply effects once per interval', async t => {
	let sideEffectCounter = 0;
	const incrementSideEffect = () => {
		sideEffectCounter++;
	};

	const wait = 100;
	const throttledIncrement = throttle(incrementSideEffect, wait);

	throttledIncrement();
	throttledIncrement();
	throttledIncrement();

	t.is(sideEffectCounter, 1, 'Side effect should only have occurred once');

	await delay(wait + 10);
	t.is(sideEffectCounter, 2, 'Side effect should occur again after wait time');
});

test('throttled function handles system time changes', async t => {
	const count = counter();
	const wait = 100;
	const throttled = throttle(count, wait);

	const originalNow = Date.now;
	Date.now = () => originalNow() + 1000; // Simulate a time jump forward

	throttled();
	throttled();

	Date.now = originalNow; // Reset Date.now to original

	t.is(count.callCount, 1, 'Should respect throttling despite time change');

	await delay(wait);
	t.is(count.callCount, 2, 'Should allow a call after wait time');
});
