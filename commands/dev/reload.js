const { SlashCommandBuilder } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('reload')
        .setDescription('Reloads a command.')
        .addStringOption(option =>
            option.setName('command')
                .setDescription('The command to reload.')
                .setRequired(true)),
    async execute(interaction) {
        if (interaction.user.id.toString() == `347469833685958657`) {
            const commandName = interaction.options.getString('command', true).toLowerCase();
            const command = interaction.client.commands.get(commandName);//commandName);
            var filePath 

            if (!command) {
                return interaction.reply({ content: `There is no command with name \`${commandName}\`!`, ephemeral: true });
            }
            var reply = 'uhoh'

            const commandFolders = fs.readdirSync(path.join(__dirname, "../"));
            console.log(`command Folders: ${commandFolders}`);
            console.log(commandFolders.length)
            for (const folder of commandFolders) {
                filePath = `../${folder}/${command.data.name}.js`
                try {
                    delete require.cache[require.resolve(filePath)];

                    const newCommand = require(filePath);
                    interaction.client.commands.set(newCommand.data.name, newCommand);
                    reply = `Command \`${newCommand.data.name}\` was reloaded!`;
                    break;
                } catch (error) {
                    if (error.code !== 'MODULE_NOT_FOUND' || i == commandFolders.length) {
                        console.error(error);
                        reply = `There was an error while reloading a command \`${command.data.name}\`:\n\`${error.message}\``;
                    }
                }
                i++
            }
            await interaction.reply({ content: reply, ephemeral: true })
        } else
            await interaction.reply({ content: `you arent allowed to reload commands`, ephemeral: true });
    }
};