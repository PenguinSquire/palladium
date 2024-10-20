const logFile = require("./log.js")
const { button } = require("./button.js")
const { regexEscape } = require("./regexEscape.js")
const { backupEmbed } = require("./backupEmbed.js")

module.exports = {
    log: logFile,
    button: (buttonID, message, style) => button(buttonID, message, style),
    regexEscape: (str) => regexEscape(str),
    backupEmbed: (link) => backupEmbed(link)
}