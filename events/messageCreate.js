const { Events } = require('discord.js');

module.exports = {
    name: Events.MessageCreate,
    async execute(message, bot) {
        if (message.author.bot) return;
        if (!message.guild) return;

        let guild = await bot.databaseManager.getObject("guild", { guildId: message.guild.id });

        // Only run if the channel is where it's trackin'
        console.log(guild);
        if (guild.leaderboardTrackerChannelId == message.channel.id) {
            let member = await bot.databaseManager.getObject("member", { userId: message.author.id, guildId: message.guild.id });

            if (!member.channelMessages[message.channel.id]) {
                member.channelMessages[message.channel.id] = 0;
            }
            member.channelMessages[message.channel.id]++;
            await bot.databaseManager.updateObject("member", { update: { channelMessages: member.channelMessages }, userId: message.author.id, guildId: message.guild.id });
            return;
        }
    }
}