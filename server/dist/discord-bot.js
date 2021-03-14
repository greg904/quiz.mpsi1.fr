"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const Discord = __importStar(require("discord.js"));
const WHITE_CHECK_MARK = "\u2705";
class DiscordBot {
    constructor(db, token, channelConfigs) {
        this.db = db;
        this.client = new Discord.Client({
            partials: ["MESSAGE", "CHANNEL", "REACTION"],
            ws: { intents: ["GUILDS", "GUILD_MESSAGES", "GUILD_MESSAGE_REACTIONS"] }
        });
        this.channelConfigs = channelConfigs;
        this.client.once("ready", () => {
            for (const g of this.client.guilds.cache.values()) {
                // Weird syntax is because of a bug in typings.
                const channels = g.channels.cache
                    .filter(c => c.type === "text" && this.channelConfigs.some(e => e.channel === c.name))
                    .values();
                for (const c of channels) {
                    c.messages.fetch({ limit: 100 })
                        .then(msgs => {
                        for (const m of msgs.values())
                            this.processMessage(m, true);
                    });
                }
            }
            console.log("Discord client is ready.");
        });
        this.client.on("message", msg => {
            if (!this.getChannelConfig(msg))
                return;
            this.processMessage(msg, false);
        });
        this.client.on("messageReactionAdd", (reaction, _user) => {
            const msg = reaction.message;
            if (!this.getChannelConfig(msg))
                return;
            this.processMessage(msg, true);
        });
        this.client.on("messageReactionRemove", (reaction, _user) => {
            const msg = reaction.message;
            if (!this.getChannelConfig(msg))
                return;
            this.processMessage(msg, false);
        });
        this.client.on("messageReactionRemoveEmoji", reaction => {
            const msg = reaction.message;
            if (!this.getChannelConfig(msg))
                return;
            this.processMessage(msg, false);
        });
        this.client.on("error", err => {
            console.error("Discord client error:", err);
        });
        this.client.login(token);
    }
    addReactionIfMissing(msg, emoji) {
        if (!msg.reactions.cache
            .filter(r => r.emoji.name === emoji)
            .some(r => r.users.cache.some(u => u.id === this.client.user.id)))
            msg.react(emoji);
    }
    processMessage(msg, silent) {
        if (!msg.content.startsWith("!"))
            return;
        let cmd;
        let args;
        const space = msg.content.indexOf(" ", 1);
        if (space === -1) {
            cmd = msg.content.substring(1);
            args = "";
        }
        else {
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
    processAddQuestion(args, msg, silent) {
        const lines = args.split("\n").map(l => l.trim()).filter(l => l !== "");
        if (lines.length < 2 || lines[0].length < 10) {
            if (!silent) {
                msg.reply("Voici comment utiliser la commande :\n```\n" +
                    "!ajouter [question]\n" +
                    "[bonne réponse]\n[mauvaise réponse]\n" +
                    "[mauvaise réponse]\n[mauvaise réponse]\n```");
            }
            return;
        }
        if (!this.hasEnoughVotes(msg)) {
            this.addReactionIfMissing(msg, WHITE_CHECK_MARK);
            return;
        }
        this.db.addQuestion(lines[0], lines[1], lines.slice(2));
        msg.delete();
    }
    processDeleteQuestion(args, msg, silent) {
        if (args === "") {
            if (!silent) {
                msg.reply("Voici comment utiliser la commande :\n```\n" +
                    "!supprimer [identifiant question]\n```");
            }
            return;
        }
        const id = parseInt(args);
        if (!Number.isSafeInteger(id) || !this.db.doesQuestionExist(id)) {
            if (!silent)
                msg.reply("Le numéro de la question est invalide !");
            return;
        }
        if (!this.hasEnoughVotes(msg)) {
            this.addReactionIfMissing(msg, WHITE_CHECK_MARK);
            return;
        }
        this.db.deleteQuestion(id);
        msg.delete();
    }
    hasEnoughVotes(msg) {
        const r = msg.reactions.cache.find(r => r.emoji.name === WHITE_CHECK_MARK);
        if (!r || !r.count)
            return false;
        const votes = r.users.cache
            .filter(u => u.id !== msg.author.id && u.id !== this.client.user.id)
            .array().length;
        return votes >= this.getChannelConfig(msg).voteThreshold;
    }
    getChannelConfig(msg) {
        return this.channelConfigs
            .find(c => { var _a; return c.guildId === ((_a = msg.guild) === null || _a === void 0 ? void 0 : _a.id) && msg.channel.type === "text" && msg.channel.name === c.channel; });
    }
}
exports.default = DiscordBot;
