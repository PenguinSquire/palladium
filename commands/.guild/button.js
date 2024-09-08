const { ActionRowBuilder, ButtonBuilder, SlashCommandBuilder } = require('discord.js');
const modules = require("../../modules/modules.js")

const thomasGif = 'https://cdn.discordapp.com/attachments/869737680727056437/1261720531477069834/gifmov.gif?ex=66c6be10&is=66c56c90&hm=e33a783d2e60a3a78234d0978817bb1b2e65d2f477f16785ddbf3725f1be18f6&'

module.exports = {
    data: new SlashCommandBuilder()
        .setName('button')
        .setDescription('you get to click a button')

        .addBooleanOption(option =>
            option.setName('ephemeral')
                .setDescription('If you to secretly press the button')
                .setRequired(false)),

    async execute(interaction) {
        const isEphemeral = interaction.options.getBoolean('ephemeral') ?? false; // ?? means default
        await interaction.deferReply({ ephemeral: isEphemeral });

        const testButton = modules.button('test', 'test')

        const row = new ActionRowBuilder()
            .addComponents(testButton);

        let message = `tset message :D`
        await interaction.editReply({ content: message, components: [row], });
        setTimeout(async () => {
            row.components[0].setDisabled(true)
            await interaction.editReply({ content: thomasGif, components: [row], });
        }, 4000);
    },
};