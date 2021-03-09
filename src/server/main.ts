import { QuestionDatabase } from "./db";
import DiscordBot from "./discord-bot";
import HttpServer from "./http-server";

async function main() {
    const token = process.env.DISCORD_TOKEN;
    if (!token) {
        console.error("Missing DISCORD_TOKEN environment variable.");
        process.exitCode = 1;
        return;
    }

    const db = new QuestionDatabase();
    await db.load();

    new DiscordBot(db, token);
    new HttpServer(db);
}

main().catch(console.error);
