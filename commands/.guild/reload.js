const { SlashCommandBuilder } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
const { altUserID, myUserID } = require('../../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('reload')
        .setDescription('Reloads a command.')
        .addStringOption(option =>
            option.setName('command')
                .setDescription('The command to reload.')
                .setRequired(true)),

    async execute(interaction) {
        const commandName = interaction.options.getString('command', true).toLowerCase();
        const command = interaction.client.commands.get(commandName);//commandName);

        // if userID isnt mine, dont execute command
        if (interaction.user.id.toString() != myUserID && interaction.user.id.toString() != altUserID)
            return interaction.reply({ content: `you arent allowed to reload commands`, ephemeral: true });
        if (!command)
            return interaction.reply({ content: `There is no command with name \`${commandName}\`!`, ephemeral: true });
        
        var filePath
        var reply = ''
        var foldersChecked = 1;

        await interaction.reply({ content: "reloading...", ephemeral: true })
        const commandFolders = fs.readdirSync(path.join(__dirname, "../"));
        //console.log(`command Folders: ${commandFolders}`);
        //console.log(commandFolders.length)
        for (const folder of commandFolders) {
            filePath = `../${folder}/${command.data.name}.js`
            try {
                delete require.cache[require.resolve(filePath)];

                const newCommand = require(filePath);
                interaction.client.commands.set(newCommand.data.name, newCommand);
                reply += `Command \`${newCommand.data.name}\` was reloaded in \`${folder}\`! \n`;
                console.log(`Command \`${newCommand.data.name}\` was reloaded in \`${folder}\``)
                break;
            } catch (error) {
                reply += `Checked in \`${folder}\`... \n`;
                interaction.editReply(reply);
                const regex = new RegExp(/'\.\.\/.?[a-z]*\/\S*.js'/g)
                if (!regex.test(error.message) || foldersChecked == commandFolders.length) {
                    reply = `There was an error while reloading a command \`${command.data.name}\`:\n\`${error.message}\``;
                    console.error(reply);
                    break
                }
            }
            foldersChecked++
        }
        interaction.editReply(reply);
    }
};