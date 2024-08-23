const { SlashCommandBuilder } = require('discord.js');
//const path = require('node:path');
//const loc = path.join(__dirname, 'commands');

module.exports = {
	//category: loc.substring(loc.lastIndexOf('\\') + 1, loc.length).toString(),
	data: new SlashCommandBuilder()
		.setName('server')
		.setDescription('Provides information about the server.'),
	async execute(interaction) {
		await interaction.reply({content: `This server is ${interaction.guild.name} and has ${interaction.guild.memberCount} members.` , ephemeral: true });
	},
};