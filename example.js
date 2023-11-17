const throttle = require('./index.js');

const onProgress = throttle(number => {
	console.log(`Progress: ${number}`);
}, 500);

let number = 0;
const intervalId = setInterval(() => {
	if (number > 100) {
		clearInterval(intervalId);
		return;
	}

	onProgress(number++);
}, 50);
