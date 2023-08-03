const mongoose = require('mongoose');

const Member = require('../schemas/Member.js');
const Guild = require('../schemas/Guild.js');

class DatabaseManager {
    constructor(connectionString, bot) {
        this.connectionString = connectionString;

        this.memberCacheManager = new Map();
        this.guildCacheManager = new Map();
    }

    async connect() {
        try {
            await mongoose.connect(this.connectionString, {
                useNewUrlParser: true,
                useUnifiedTopology: true
            });
            console.log('Database connection successful');
        } catch (error) {
            console.log('Database connection error', error);
        }
    }

    async addObject(objectType, parameters) {
        switch (objectType) {
            case "member":
                const member = new Member({
                    userId: parameters.userId,
                    guildId: parameters.guildId
                });

                await member.save();

                // Create a key for cache with userid AND guildid (since member)
                const cacheKey = `${parameters.userId}-${parameters.guildId}`;
                this.memberCacheManager.set(cacheKey, member);  // add to cache

                console.log(`Member ${parameters.userId} of ${parameters.guildId} added to the database`);
                return member;

            case "guild":
                const guild = new Guild({
                    guildId: parameters.guildId,
                });

                await guild.save();

                this.guildCacheManager.set(parameters.guildId, guild);  // Add to cache

                console.log(`Guild ${parameters.guildId} added to the database`);
                return guild;
        }
    }

    async updateObject(objectType, parameters) {
        switch (objectType) {
            case "member":
                let updatedMember = await Member.findOneAndUpdate(
                    { userId: parameters.userId, guildId: parameters.guildId },
                    {
                        $set: parameters.update
                    },
                    { new: true, useFindAndModify: false }
                );

                // Update the cache with the updated member
                const cacheKey = `${parameters.userId}-${parameters.guildId}`;
                if (updatedMember) {
                    this.memberCacheManager.set(cacheKey, updatedMember);
                    console.log(`Member ${parameters.userId} updated in the database`);
                } else {
                    console.log(`Member ${parameters.userId} not found in the database`);
                }

                return updatedMember;

            case "guild":
                let updatedGuild = await Guild.findOneAndUpdate(
                    { guildId: parameters.guildId },
                    {
                        $set: parameters.update
                    },
                    { new: true, useFindAndModify: false }
                );

                // Update the cache with the updated guild
                this.guildCacheManager.set(parameters.guildId, updatedGuild);

                console.log(`Guild ${parameters.guildId} updated in the database`);
                return updatedGuild;
        }
    }

    async getObject(objectType, parameters) {
        switch (objectType) {
            case "member":
                // First, try to get the user from the cache
                const cacheKey = `${parameters.userId}-${parameters.guildId}`;
                let member = this.memberCacheManager.get(cacheKey);

                // If the member is not in the cache, fetch them from the database
                if (!member) {
                    member = await Member.findOne({ userId: parameters.userId, guildId: parameters.guildId });

                    // If the user was found in the database, add them to the cache
                    if (member) {
                        this.memberCacheManager.set(cacheKey, await member);
                        return await member;
                    } else {
                        // if member doesn't exist in db, add it
                        member = await this.addObject("member", { userId: parameters.userId, guildId: parameters.guildId });
                        return await member;
                    }
                } else {
                    return member;
                }

            case "guild":
                let guild = this.guildCacheManager.get(parameters.guildId);

                // If the guild is not in the cache
                if (!guild) {
                    guild = await Guild.findOne({ guildId: parameters.guildId });

                    if (await guild) {
                        this.guildCacheManager.set(parameters.guildId, guild);
                        return await guild;
                    } else {
                        // if not found in database, create
                        guild = await this.addObject("guild", { guildId: parameters.guildId });
                        return guild;
                    }
                } else {
                    return guild;
                }
        }
    }

    async removeObject(objectType, parameters) {
        switch (objectType) {
            case "member":
                const memberCacheKey = `${parameters.userId}-${parameters.guildId}`;
                const removedMember = await Member.findOneAndDelete({
                    userId: parameters.userId,
                    guildId: parameters.guildId
                });

                if (removedMember) {
                    this.memberCacheManager.delete(memberCacheKey);
                    console.log(`Member ${parameters.userId} of ${parameters.guildId} removed from the database and cache`);
                } else {
                    console.log(`Member ${parameters.userId} of ${parameters.guildId} not found in the database`);
                }

                return removedMember;

            case "guild":
                const removedGuild = await Guild.findOneAndDelete({
                    guildId: parameters.guildId
                });

                if (removedGuild) {
                    this.guildCacheManager.delete(parameters.guildId);
                    console.log(`Guild ${parameters.guildId} removed from the database and cache`);
                } else {
                    console.log(`Guild ${parameters.guildId} not found in the database`);
                }

                return removedGuild;

            default:
                console.log(`Invalid objectType: ${objectType}`);
                return null;
        }
    }

    async removeAllObjects(objectType) {
        switch (objectType) {
            case "member":
                const removedMembers = await Member.deleteMany({});
                console.log(`Removed ${removedMembers.deletedCount} members from the database`);

                // Remove all member entries from cache
                this.memberCacheManager.forEach(key => this.memberCacheManager.delete(key));

                return removedMembers;

            case "guild":
                const removedGuilds = await Guild.deleteMany({});
                console.log(`Removed ${removedGuilds.deletedCount} guilds from the database`);

                // Remove all guild entries from cache
                this.guildCacheManager.forEach(key => this.guildCacheManager.delete(key));

                return removedGuilds;

            default:
                console.log(`Invalid objectType: ${objectType}`);
                return null;
        }
    }

    // returns filtered list of members in order of messages
    async getLeaderboardForGuild(guildId, channelId) {
        const allMembers = await Member.find({ guildId: guildId });
        
        // Sort members based on the number of messages they have sent in the tracked channel
        allMembers.sort((a, b) => {
            const aMessages = a.channelMessages[channelId] || 0;
            const bMessages = b.channelMessages[channelId] || 0;
            return bMessages - aMessages;
        });
    
        // Finally, we'll limit to the top 10
        const leaderboard = allMembers.slice(0, 10);
        
        return leaderboard;
    }
}

module.exports = DatabaseManager;