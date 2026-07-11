import {test} from 'node:test';
import throttle from './index.js';

test('calls the function immediately on the first invocation', t => {
	const callback = t.mock.fn();
	const throttled = throttle(callback, 100);

	throttled();

	t.assert.strictEqual(callback.mock.calls.length, 1);
});

test('returns the result of the most recent execution', t => {
	t.mock.timers.enable({apis: ['setTimeout', 'Date'], now: 1_000_000});
	const throttled = throttle(value => value * 2, 100);

	t.assert.strictEqual(throttled(1), 2, 'The leading call returns its own result');
	t.assert.strictEqual(throttled(5), 2, 'A deferred call returns the previous result');

	t.mock.timers.tick(100);
	t.assert.strictEqual(throttled(9), 10, 'After the trailing call, the latest result is returned');
});

test('calls at most once per interval, with a trailing call', t => {
	t.mock.timers.enable({apis: ['setTimeout', 'Date'], now: 1_000_000});
	const callback = t.mock.fn();
	const throttled = throttle(callback, 100);

	throttled();
	throttled();
	throttled();
	t.assert.strictEqual(callback.mock.calls.length, 1, 'Only the leading call runs immediately');

	t.mock.timers.tick(100);
	t.assert.strictEqual(callback.mock.calls.length, 2, 'The trailing call runs after the wait');
});

test('does not call again within the wait time', t => {
	t.mock.timers.enable({apis: ['setTimeout', 'Date'], now: 1_000_000});
	const callback = t.mock.fn();
	const throttled = throttle(callback, 100);

	throttled();
	t.mock.timers.tick(50);
	throttled();

	t.assert.strictEqual(callback.mock.calls.length, 1);
});

test('allows another immediate call once the wait has elapsed', t => {
	t.mock.timers.enable({apis: ['setTimeout', 'Date'], now: 1_000_000});
	const callback = t.mock.fn();
	const throttled = throttle(callback, 100);

	throttled();
	t.mock.timers.tick(110);
	throttled();

	t.assert.strictEqual(callback.mock.calls.length, 2);
});

test('preserves the last context', t => {
	t.mock.timers.enable({apis: ['setTimeout', 'Date'], now: 1_000_000});
	let context;
	const throttled = throttle(function () {
		context = this; // eslint-disable-line unicorn/no-this-assignment
	}, 100);

	const foo = {};
	const bar = {};
	throttled.call(foo);
	throttled.call(bar);
	t.assert.strictEqual(context, foo, 'The leading call uses the first context');

	t.mock.timers.tick(100);
	t.assert.strictEqual(context, bar, 'The trailing call uses the last context');
});

test('preserves the last arguments', t => {
	t.mock.timers.enable({apis: ['setTimeout', 'Date'], now: 1_000_000});
	let lastArguments;
	const throttled = throttle((...arguments_) => {
		lastArguments = arguments_;
	}, 100);

	throttled(1);
	throttled(2);
	throttled(3);
	t.assert.deepStrictEqual(lastArguments, [1], 'The leading call uses the first arguments');

	t.mock.timers.tick(100);
	t.assert.deepStrictEqual(lastArguments, [3], 'The trailing call uses the last arguments');
});

test('with zero wait, calls the function on every invocation', t => {
	const callback = t.mock.fn();
	const throttled = throttle(callback, 0);

	throttled();
	throttled();
	throttled();

	t.assert.strictEqual(callback.mock.calls.length, 3);
});

test('functions with different wait times operate independently', t => {
	t.mock.timers.enable({apis: ['setTimeout', 'Date'], now: 1_000_000});
	const callback1 = t.mock.fn();
	const callback2 = t.mock.fn();
	const throttled1 = throttle(callback1, 50);
	const throttled2 = throttle(callback2, 150);

	throttled1();
	throttled2();
	t.mock.timers.tick(60); // Just over the first wait, but under the second.
	throttled1();
	throttled2();

	t.assert.strictEqual(callback1.mock.calls.length, 2);
	t.assert.strictEqual(callback2.mock.calls.length, 1);
});

test('throttling is unaffected by system time jumps', t => {
	t.mock.timers.enable({apis: ['setTimeout', 'Date'], now: 1_000_000});
	const callback = t.mock.fn();
	const throttled = throttle(callback, 100);

	const originalNow = Date.now;
	Date.now = () => originalNow() + 1000; // Simulate a time jump forward.

	throttled();
	throttled();

	Date.now = originalNow;

	t.assert.strictEqual(callback.mock.calls.length, 1);

	t.mock.timers.tick(100);
	t.assert.strictEqual(callback.mock.calls.length, 2);
});

test('validates the arguments', t => {
	t.assert.throws(() => {
		throttle(undefined, 0);
	}, TypeError);

	t.assert.throws(() => {
		throttle(() => {});
	}, TypeError);

	t.assert.throws(() => {
		throttle(() => {}, -1);
	}, TypeError);

	t.assert.throws(() => {
		throttle(() => {}, Infinity);
	}, TypeError);
});
