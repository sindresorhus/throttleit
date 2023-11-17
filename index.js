function throttle(function_, wait) {
	let timeoutId;
	let lastCallTime = 0;

	return function throttled(...arguments_) { // eslint-disable-line func-names
		clearTimeout(timeoutId);

		const now = Date.now();
		const timeSinceLastCall = now - lastCallTime;
		const delayForNextCall = wait - timeSinceLastCall;

		if (delayForNextCall <= 0) {
			lastCallTime = now;
			function_.apply(this, arguments_);
		} else {
			timeoutId = setTimeout(() => {
				lastCallTime = Date.now();
				function_.apply(this, arguments_);
			}, delayForNextCall);
		}
	};
}

module.exports = throttle;
