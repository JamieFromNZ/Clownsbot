const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('channel')
        .setDescription('Set the channel to display the leaderboard in.')
        .addChannelOption(option => option.setName('channel').setDescription('The channel to get.').setRequired(true))
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionsBitField.ManageGuild),

    async execute(interaction, bot) {
        // Guard: Check if member has perms to run cmd
        if (!await interaction.member.permissions.has(PermissionsBitField.ManageGuild)) {
            let emb = await bot.embedHelper.getErrorEmbed();
            emb.setTitle("Error")
            emb.setDescription("You require the \`MANAGE_SERVER\` or \``ADMINISTRATOR\` permissions to run this command.");

            return await interaction.reply({ embeds: [emb], ephemeral: true });
        }

        let channel = interaction.options.getChannel('channel');

        await interaction.reply({ content: `Cool! I'm going to dump the leaderboard here to track messages in <#${channel.id}>.`, ephemeral: true });
        let message = await interaction.channel.send(`Leaderboard for <#${channel.id}> will go here.`);

        // Update the guild object with the channel & message
        await bot.databaseManager.updateObject("guild", { guildId: interaction.guild.id, update: { leaderboardMessageId: message.id, leaderboardChannelId: interaction.channel.id, leaderboardTrackerChannelId: channel.id } });

        await bot.updateLeaderboard(interaction.guild.id);
    }
}