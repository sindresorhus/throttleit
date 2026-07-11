export default function throttle(function_, wait) {
	if (typeof function_ !== 'function') {
		throw new TypeError(`Expected the first argument to be a \`function\`, got \`${typeof function_}\`.`);
	}

	if (!Number.isFinite(wait) || wait < 0) {
		throw new TypeError(`Expected the second argument to be a non-negative finite number, got \`${wait}\`.`);
	}

	let timeoutId;
	let lastCallTime = 0;
	let result;

	return function throttled(...arguments_) { // eslint-disable-line func-names
		clearTimeout(timeoutId);

		const now = Date.now();
		const timeSinceLastCall = now - lastCallTime;
		const delayForNextCall = wait - timeSinceLastCall;

		if (delayForNextCall <= 0) {
			lastCallTime = now;
			result = function_.apply(this, arguments_);
		} else {
			timeoutId = setTimeout(() => {
				lastCallTime = Date.now();
				result = function_.apply(this, arguments_);
			}, delayForNextCall);
		}

		return result;
	};
}
