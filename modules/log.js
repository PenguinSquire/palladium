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
function sendLog (commandID, message, label) {
    logToFile(`${label} ${commandID} - ${message}`)
    console.log(`${commandID} - `, message)
}
const d = new Date();
let day =  d.getDay() + 1
let  month = d.getMonth() + 1
let paddedDay = ("00" + day).slice(-2);
let paddedMonth = ("00" + month).slice(-2);
module.exports = {
    info: (commandID, message) => sendLog (commandID, message, ` [INFO]`),
    warn: (commandID, message) => sendLog (commandID, message, ` [WARN]`),
    error: (commandID, message, err) => sendLog(commandID, (message, err), `[ERROR]`),
    link: (commandID, message) => sendLog (commandID, message, `\n${paddedDay}/${paddedMonth}: `)
}