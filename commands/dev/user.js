const { SlashCommandBuilder } = require('discord.js');
//const path = require('node:path');
//const loc = path.join(__dirname, 'commands');

module.exports = {
	//category: loc.substring(loc.lastIndexOf('\\') + 1, loc.length).toString(),
	data: new SlashCommandBuilder()
		.setName('user')
		.setDescription('Provides information about the user.'),
	async execute(interaction) {
		await interaction.reply({content: 'This command was run by ${interaction.user.username}, who joined on ${interaction.member.joinedAt}.' , ephemeral: true });
	},
};