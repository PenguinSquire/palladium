const fs = require('fs');

function logToFile(message) {
    const logStream = fs.createWriteStream('./logs.txt', { flags: 'a' })
        .on('finish', function () {
            //console.log("Write Finish.");
        })
        .on('error', function (err) {
            console.log(err.stack);
        });
    logStream.write(`${message}\n`);
    logStream.end();
}
function sendLog(commandID, message, label) {
    logToFile(`${label} ${commandID} - ${message}`)
    console.log(`${label} ${commandID} - `, message)
}

module.exports = {
    info: (commandID, message) => sendLog(commandID, message, ` [INFO]`),
    warn: (commandID, message) => sendLog(commandID, message, ` [WARN]`),
    error: (commandID, message, err) => sendLog(commandID, (message, err), `[ERROR]`),
    link: (commandID, message) => {
        const d = new Date();
        let paddedDay = ("00" + d.getDate()).slice(-2); // all padded variables are padded to 2 significant digits
        let month = d.getMonth() + 1 // month is zero indexed so you need to add 1
        let paddedMonth = ("00" + month).slice(-2);
        let paddedHour = ("00" + d.getHours()).slice(-2);
        let paddedMinute = ("00" + d.getMinutes()).slice(-2);
        sendLog(commandID, `${paddedHour}:${paddedMinute} | ${message}`, `\n${paddedMonth}/${paddedDay}: `)
    }
}