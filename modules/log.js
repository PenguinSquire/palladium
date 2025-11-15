const fs = require('fs');
const { backend_url } = require('../config.json');

let tempLogs = {};

function paddedConsole(type, commandID, message) {
console.log(`${type.padStart(5)}: ${commandID} - ${message}`)
}
function addLogText(commandID, message) {
	if (tempLogs[commandID].text.length !== 0) {
		tempLogs[commandID].text += "\n";
	}

	tempLogs[commandID].text += message;
}
function addLog(type, commandID, message) {
	// Reset response array if undefined or not "egg"
	if (!tempLogs[commandID].response || tempLogs[commandID].response !== "egg") {
		tempLogs[commandID].response = type;
	}
	addLogText(commandID, message)
	paddedConsole(type, commandID, message)
}

module.exports = {
	info: (commandID, message) => {
		if (typeof tempLogs[commandID].text == "undefined")
			tempLogs[commandID].text = message;
		else
			tempLogs[commandID].text += `\n${message}`;
		paddedConsole(`INFO`, commandID, message)
	},
	warn: (commandID, message) => {
		addLog(`WARN`, commandID, message)
	},
	error: (commandID, message, err) => {
		addLog(`ERROR`, commandID, (message, err))
	},
	api: (commandID, err) => {
		addLog(`API`, commandID, err)
	},
	egg: (commandID, message) => {
		tempLogs[commandID].response = `egg`;
		paddedConsole(`egg`, commandID, message)
	},
	link: (commandID, message) => {
		const d = new Date();
		let paddedDay = ("00" + d.getDate()).slice(-2); // all padded variables are padded to 2 significant digits
		let month = d.getMonth() + 1 // month is zero indexed so you need to add 1
		let paddedMonth = ("00" + month).slice(-2);

		//initialize the tempLog object for this ID
		tempLogs[commandID] = { id: commandID, response: "INFO", text: "", link: message };
		paddedConsole(`${paddedMonth}/${paddedDay}`, commandID, message)
	},
	done: async (commandID) => {
		try {
			const response = await fetch(
				`${backend_url}/palladium/sendLog`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify(tempLogs[commandID]),
				}
			);

			const result = await response.json();
			console.log(result);
			alert(result.message);
			//document.getElementById("homeownerForm").reset();
		} catch (error) {
			console.error("Error:", error);
		}
		delete tempLogs[commandID];
	}
}