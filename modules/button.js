const { ButtonBuilder, ButtonStyle} = require('discord.js');

// Button styles
// Currently there are five different button styles available:
//     PRIMARY, a blurple button;
//     SECONDARY, a grey button;
//     SUCCESS, a green button;
//     DANGER, a red button;
//     LINK, a button that navigates to a URL.


function button(buttonID, message, style = 'PRIMARY') {

    const button = new ButtonBuilder()
        .setCustomId(buttonID)
        .setLabel(message)
        .setStyle(ButtonStyle.Primary)
    return button
}
module.exports = { button }

