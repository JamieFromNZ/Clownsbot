const { Events } = require('discord.js');

module.exports = {
    name: Events.MessageCreate,
    async execute(message, bot) {
        if (message.author.bot) return;
        if (!message.guild) return;

        let member = await bot.databaseManager.getObject("member", { userId: message.author.id, guildId: message.guild.id });
        if (!member.channelMessages[message.channel.id]) {
            member.channelMessages[message.channel.id] = 0;
        }
        member.channelMessages[message.channel.id]++;
        await bot.databaseManager.updateObject("member", { update: { channelMessages: member.channelMessages }, userId: message.author.id, guildId: message.guild.id });
    }
}