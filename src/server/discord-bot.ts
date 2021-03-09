import * as Discord from "discord.js";

import { QuestionDatabase } from "./db";

const CHANNEL_NAME = "mpsi1-fr-quiz";
const WHITE_CHECK_MARK = "\u2705";

function hasEnoughVotes(msg: Discord.Message) {
    const r = msg.reactions.cache.find(r => r.emoji.name === WHITE_CHECK_MARK);
    // One is added to the threshold to account for the bot's own reaction.
    return r && r.count && r.count >= 2;
}

export default class DiscordBot {
    private db: QuestionDatabase
    private client: Discord.Client
    
    constructor(db: QuestionDatabase, token: string) {
        this.db = db;
        this.client = new Discord.Client({
            partials: ["MESSAGE", "CHANNEL", "REACTION"],
            ws: { intents: ["GUILDS", "GUILD_MESSAGES", "GUILD_MESSAGE_REACTIONS"] }
        });
        this.client.once("ready", () => {
            for (const g of this.client.guilds.cache.values()) {
                // Weird syntax is because of a bug in typings.
                const c = g.channels.cache.find(c => c.name === CHANNEL_NAME && c.type === "text") as Discord.TextChannel | undefined;
                if (!c)
                    return;
                c.messages.fetch({ limit: 100 })
                    .then(msgs => {
                        for (const m of msgs.values())
                            this.processMessage(m, true);
                    });
            }
            console.log("Discord client is ready.");
        });
        this.client.on("message", msg => {
            if (msg.channel.type !== "text" || msg.channel.name !== CHANNEL_NAME)
                return;
            this.processMessage(msg, false);
        });
        this.client.on("messageReactionAdd", (reaction, _user) => {
            const msg = reaction.message;
            if (msg.channel.type !== "text" || msg.channel.name !== CHANNEL_NAME)
                return;
            this.processMessage(msg, true);
        });
        this.client.on("messageReactionRemove", (reaction, _user) => {
            const msg = reaction.message;
            if (msg.channel.type !== "text" || msg.channel.name !== CHANNEL_NAME)
                return;
            this.processMessage(msg, false);
        });
        this.client.on("messageReactionRemoveEmoji", reaction => {
            const msg = reaction.message;
            if (msg.channel.type !== "text" || msg.channel.name !== CHANNEL_NAME)
                return;
            this.processMessage(msg, false);
        });
        this.client.on("error", err => {
            console.error("Discord client error:", err);
        });
        this.client.login(token);
    }

    private addReactionIfMissing(msg: Discord.Message, emoji: string) {
        if (!msg.reactions.cache
            .filter(r => r.emoji.name === emoji)
            .some(r => r.users.cache.some(u => u.id === this.client.user!!.id)))
            msg.react(emoji);
    }

    private processMessage(msg: Discord.Message, silent: boolean) {
        if (!msg.content.startsWith("!"))
            return;
        let cmd: string;
        let args: string;
        const space = msg.content.indexOf(" ", 1);
        if (space === -1) {
            cmd = msg.content.substring(1);
            args = "";
        } else {
            cmd = msg.content.substring(1, space);
            args = msg.content.substring(space + 1).trim();
        }
        switch (cmd) {
        case "ajouter":
            return this.processAddQuestion(args, msg, silent);
        case "supprimer":
            return this.processDeleteQuestion(args, msg, silent);
        }
    }

    private processAddQuestion(args: string, msg: Discord.Message, silent: boolean) {
        const lines = args.split("\n").map(l => l.trim()).filter(l => l !== "");
        if (lines.length < 2 || lines[0].length < 10) {
            if (!silent) {
                msg.reply("Voici comment utiliser la commande :\n" +
                    "!ajouter _question_\n" +
                    "_bonne réponse_\n_mauvaise réponse_\n" +
                    "_mauvaise réponse_\n... (Vous pouvez ajouter autant de mauvaises réponses que vous voulez.)\n");
            }
            return;
        }
        if (!hasEnoughVotes(msg)) {
            this.addReactionIfMissing(msg, WHITE_CHECK_MARK);
            return;
        }
        this.db.add({
            prompt: lines[0],
            correctAnswer: lines[1],
            incorrectAnswers: lines.slice(2),
        });
        msg.delete();
    }
    
    private processDeleteQuestion(args: string, msg: Discord.Message, silent: boolean) {
        if (args === "") {
            if (!silent) {
                msg.reply("Voici comment utiliser la commande :\n" + 
                    "!supprimer _identifiant question_");
            }
            return;
        }
        const id = parseInt(args);
        if (!Number.isSafeInteger(id) || !this.db.questions.some(q => q.id === id)) {
            if (!silent)
                msg.reply("Le numéro de la question est invalide !");
            return;
        }
        if (!hasEnoughVotes(msg)) {
            this.addReactionIfMissing(msg, WHITE_CHECK_MARK);
            return;
        }
        this.db.removeById(id);
        msg.delete();
    }
}
