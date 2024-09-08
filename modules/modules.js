const logFile = require("./log.js")
const { button } = require("./button.js")
const { regexEscape } = require("./regexEscape.js")

module.exports = {
    log: logFile,
    button: (buttonID, message, style) => button(buttonID, message, style),
    regexEscape: (str) => regexEscape(str)
}