const { ButtonBuilder, ButtonStyle } = require('discord.js');

const sendLog = require("./log.js")
const writeLog = require("./log_depricated.js")
module.exports = {
    log: sendLog,
    log_depricated: writeLog,
    button,
    regexEscape,
    backupEmbed,
    isTitle
}

function isTitle(string) {
    const keywords = [
        "youtube",
        "instagram",
        "tiktok",
        "twitter",
        "tumblr"
    ];
    // if the string contains [keyword]_ then return true
    return !(keywords.some(keyword => string.includes(`${keyword}_`)));
}

function backupEmbed(link) {
    let www = ''
    let fix = ''

    let url = new URL(link);
    let protocol = url.protocol
    let host = url.host
    let pathname = url.pathname;
    let search = url.search;
    //console.log(url)
    if (host.includes("instagram")) {
        host = host.replace("instagram", "ddinstagram")
        search = ''
    } else if (host.includes("tiktok")) {
        // tfxtok was worse than just normal tiktok embeds
        //host = host.replace("tiktok", "tfxktok")
        search = ''
    } else if (host.includes("twitter")) {
        host = host.replace("twitter", "vxtwitter")
    } else if (host.includes("x.com")) {
        host = host.replace("x.com", "vxtwitter")
    }
    let newLink = protocol + '//' + host + pathname + search
    return newLink
}

function button(buttonID, message, style = 'PRIMARY') {

    // Button styles
    // Currently there are five different button styles available:
    //     PRIMARY, a blurple button;
    //     SECONDARY, a grey button;
    //     SUCCESS, a green button;
    //     DANGER, a red button;
    //     LINK, a button that navigates to a URL.

    const button = new ButtonBuilder()
        .setCustomId(buttonID)
        .setLabel(message)
        .setStyle(ButtonStyle.Primary)
    return button
}

function regexEscape(str) {
    return str.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')
}




