"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConfig = void 0;
function getConfig() {
    const serverPortStr = process.env.HTTP_PORT;
    if (!serverPortStr)
        throw new Error("Missing HTTP_PORT environment variable");
    const serverPort = parseInt(serverPortStr);
    if (!Number.isSafeInteger(serverPort))
        throw new Error("Invalid HTTP_PORT environment variable");
    const discordToken = process.env.DISCORD_TOKEN;
    if (!discordToken)
        throw new Error("Missing DISCORD_TOKEN environment variable");
    const dbPath = process.env.DB_PATH;
    if (!dbPath)
        throw new Error("Missing DB_PATH environment variable");
    const channelConfigStr = process.env.DISCORD_CONFIG;
    if (channelConfigStr === undefined)
        throw new Error("Missing DISCORD_CONFIG environment variable");
    const channelConfigs = channelConfigStr.split(";")
        .map(c => {
        const parts = c.split(":");
        return {
            guildId: parts[0],
            channel: parts[1],
            voteThreshold: parseInt(parts[2]),
        };
    });
    return {
        discordToken,
        dbPath,
        serverPort,
        channelConfigs,
    };
}
exports.getConfig = getConfig;
