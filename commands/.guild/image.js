const { SlashCommandBuilder } = require('discord.js');

const thomasGif = 'https://cdn.discordapp.com/attachments/869737680727056437/1261720531477069834/gifmov.gif?ex=66c6be10&is=66c56c90&hm=e33a783d2e60a3a78234d0978817bb1b2e65d2f477f16785ddbf3725f1be18f6&'

module.exports = {
	data: new SlashCommandBuilder()
		.setName('image')
		.setDescription('embeds images from links')

        .addStringOption(option =>
            option.setName('link')
                .setDescription('The image(s) link to embed')
                .setRequired(true))

        .addBooleanOption(option =>
            option.setName('image_index')
                .setDescription('If you only want one particular image')
                .setRequired(false)),

    async execute(interaction) {
        await interaction.deferReply({ephemeral: false });

        const link = interaction.options.getString('link');
        const audioOnly = interaction.options.getInteger('image_index') ?? -1;

        await interaction.editReply({content: 'Sorry! This feature is not set up yet for ' + link});
        setTimeout(async () => {
            await interaction.editReply(thomasGif);
        }, 2000);
        //await interaction.followUp({ content: 'the actual video', ephemeral: false });
    },
};