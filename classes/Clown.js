// Libraries and that jazz
const { Client, Events, GatewayIntentBits, REST, Routes, Collection, EmbedBuilder } = require('discord.js');

// Utils and stuff
require('dotenv').config();

// Classes for the bot
const EventManager = require('./EventManager.js');
const CommandManager = require('./CommandManager.js');
const KeepAlive = require('./KeepAlive.js');
const DatabaseManager = require('./DatabaseManager.js');
const EmbedHelper = require('./EmbedHelper');
const CONSTANTS = require('../constants.json');

class Clown {
    constructor() {
        // Initialize Discord client for bot
        this.client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });

        // Initialise main managers for bot
        this.eventManager = new EventManager(this);
        this.commandManager = new CommandManager(this);
        this.databaseManager = new DatabaseManager(process.env.MONGO_URI, this);
        this.keepAlive = new KeepAlive(this);
        this.embedHelper = new EmbedHelper(this);

        this.CONSTANTS = CONSTANTS;

        // Token
        this.token = process.env.TOKEN;
    }

    login() {
        console.log('Logging in...');
        return this.client.login(this.token);
    }

    isValidHttpUrl(string) {
        let url;

        try {
            url = new URL(string);
        } catch (_) {
            return false;
        }

        return url.protocol === "http:" || url.protocol === "https:";
    }

    async updateLeaderboard(guildId) {
        const guildData = await this.databaseManager.getObject("guild", { guildId: guildId });

        if (!guildData || !guildData.leaderboardMessageId || !guildData.leaderboardChannelId) {
            console.log(`No leaderboard set up for guild ${guildId}`);
            return;
        }

        const leaderboard = await this.databaseManager.getLeaderboardForGuild(guildId, guildData.leaderboardTrackerChannelId);

        if (!leaderboard) {
            console.log(`Can't get leaderboard ${guildId}`);
            return;
        }

        let leaderboardText = 'Leaderboard:\n';
        leaderboard.forEach((member, i) => {
            leaderboardText += `${i + 1}. <@${member.userId}>: ${member.channelMessages[guildData.leaderboardTrackerChannelId]} messages\n`;
        });

        const leaderboardChannel = await this.client.channels.fetch(guildData.leaderboardChannelId);
        const leaderboardMessage = await leaderboardChannel.messages.fetch(guildData.leaderboardMessageId);

        leaderboardMessage.edit(leaderboardText);
    }
}

module.exports = Clown;