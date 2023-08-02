const Clown = require('./classes/Clown');

const bot = new Clown();
bot.login().then(() => {
    // Log in
    console.log('Logged in.');
});

bot.client.on('ready', () => {
    console.log("Bot Ready. Loading commands & events.");
    // Load commands
    bot.commandManager.loadCmds(bot);
    bot.eventManager.load(bot);
    bot.keepAlive.start(bot);
    bot.databaseManager.connect();

    bot.client.guilds.cache.forEach(guild => {
        setInterval(() => {
            bot.updateLeaderboard(guild.id);
        }, bot.CONSTANTS.updateIntervalMilliseconds); // Every minute
    });
});