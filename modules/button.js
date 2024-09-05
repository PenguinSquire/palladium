const { MessageButton } = require('discord.js');

// Button styles
// Currently there are five different button styles available:
//     PRIMARY, a blurple button;
//     SECONDARY, a grey button;
//     SUCCESS, a green button;
//     DANGER, a red button;
//     LINK, a button that navigates to a URL.


const button = (buttonID, message, style = 'PRIMARY') => {
    const button = new MessageButton()
        .setCustomId(buttonID)
        .setLabel(message)
        .setStyle(style)
    return button
}
module.exports = { button }

