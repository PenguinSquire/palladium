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



const info = (commandID, message) => {
    logToFile(`[INFO] ${commandID} - ${message}`)
    console.log(`${commandID} - ${message}`)
}
const warn = (commandID, message) => {
    logToFile(`[WARN] ${commandID} - ${message}`)
    console.warn(`${commandID} - ${message}`)
}
const error = (commandID, message, err) => {
    logToFile((`[ERROR] ${commandID} - ${message}`, err))
    console.error(`[ERROR] ${commandID} - ${message}`, err)
}

module.exports = { info, warn, error };