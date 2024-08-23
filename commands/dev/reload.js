const { SlashCommandBuilder } = require('discord.js');

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
            var filePath = `../dev/${command.data.name}.js`

            if (!command) {
                return interaction.reply({ content: `There is no command with name \`${commandName}\`!`, ephemeral: true });
            }
            var reply = 'uhoh'
            for (let i = 0; i <= 1; i++) {
                try {
                    delete require.cache[require.resolve(filePath)];

                    const newCommand = require(filePath);
                    interaction.client.commands.set(newCommand.data.name, newCommand);
                    reply = `Command \`${newCommand.data.name}\` was reloaded!`;
                    break;
                } catch (error) {
                    if (error.code !== 'MODULE_NOT_FOUND' || i == 1) {
                        console.error(error);
                        reply = `There was an error while reloading a command \`${command.data.name}\`:\n\`${error.message}\``;
                    }
                }
                filePath = `../global/${command.data.name}.js`
            }
            await interaction.reply({ content: reply, ephemeral: true })
        } else
            await interaction.reply({ content: `you arent allowed to reload commands`, ephemeral: true });
    }
};