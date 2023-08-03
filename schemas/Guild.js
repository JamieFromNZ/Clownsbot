const mongoose = require('mongoose');

const GuildSchema = new mongoose.Schema({
    guildId: {
        type: String,
        required: true,
        unique: true
    },
    leaderboardMessageId: {
        type: String,
        required: false,
    },
    leaderboardChannelId: {
        type: String,
        required: false,
    },
    leaderboardTrackerChannelId: {
        type: String,
        required: false,
    }
});

module.exports = mongoose.model('guilds', GuildSchema);