import { Database } from "./db";
import DiscordBot from "./discord-bot";
import HttpServer from "./http-server";

import { getConfig } from "./config";

async function main() {
    const config = getConfig();
    const db = new Database(config.dbPath);
    new DiscordBot(db, config.discordToken, config.channelConfigs);
    new HttpServer(db, config.serverPort);
}

main().catch(console.error);
