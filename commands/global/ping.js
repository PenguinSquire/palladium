const { SlashCommandBuilder } = require('discord.js');
//const path = require('node:path');
//const loc = path.join(__dirname, 'commands');

module.exports = {
	//category: loc.substring(loc.lastIndexOf('\\') + 1, loc.length).toString(),
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Replies with Pong!'),
	async execute(interaction) {
		const sent = await interaction.reply({ content: 'Pinging...', fetchReply: true, ephemeral: false  });
		interaction.editReply(`Roundtrip latency: ${sent.createdTimestamp - interaction.createdTimestamp}ms`);
		
	},
};