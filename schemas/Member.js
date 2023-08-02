const mongoose = require('mongoose');

const MemberSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        unique: false
    },
    guildId: {
        type: String,
        required: true,
        unique: false
    },
    channelMessages: {
        type: Object,
        default: {}
    },
});

module.exports = mongoose.model('members', MemberSchema);