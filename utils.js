const beforeQuit = (callback) => {
	if (process.platform === "win32") {
		var rl = require("readline").createInterface({
			input: process.stdin,
			output: process.stdout
		});

		rl.on("SIGINT", function () {
			process.emit("SIGINT");
		});
	}

	process.on("SIGINT", async function () {
		await callback();
		process.exit();
	});
}

const isEmptyObject = (obj) => {
	return Object.keys(obj).length === 0 && obj.constructor === Object
}

const isEmptyArray = (arr) => {
	return arr === undefined || arr.length == 0
}

module.exports = { beforeQuit, isEmptyObject, isEmptyArray }
