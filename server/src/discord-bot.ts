import * as Discord from 'discord.js'
import { ChannelConfig } from './config'

import { Database } from './db'

const WHITE_CHECK_MARK = '\u2705'

export default class DiscordBot {
  private readonly db: Database
  private readonly client: Discord.Client
  private readonly channelConfigs: ChannelConfig[]

  constructor (db: Database, channelConfigs: ChannelConfig[]) {
    this.db = db
    this.client = new Discord.Client({
      partials: ['MESSAGE', 'CHANNEL', 'REACTION'],
      ws: { intents: ['GUILDS', 'GUILD_MESSAGES', 'GUILD_MESSAGE_REACTIONS'] }
    })
    this.channelConfigs = channelConfigs
    this.client.once('ready', () => {
      for (const g of this.client.guilds.cache.values()) {
        // Weird syntax is because of a bug in typings.
        const channels = g.channels.cache
          .filter(c => c.type === 'text' && this.channelConfigs.some(e => e.channel === c.name))
          .values()
        for (const c of channels) {
          (c as Discord.TextChannel).messages.fetch({ limit: 100 })
            .then(msgs => {
              for (const m of msgs.values()) { this.processMessage(m, true) }
            })
            .catch(err => {
              console.error('Initial message fetch failed for channel', c.name, err)
            })
        }
      }
      console.log('Discord client is ready.')
    })
    this.client.on('message', msg => {
      if (this.getChannelConfig(msg) == null) { return }
      this.processMessage(msg, false)
    })
    this.client.on('messageReactionAdd', (reaction, _user) => {
      const msg = reaction.message
      if (this.getChannelConfig(msg) == null) { return }
      this.processMessage(msg, true)
    })
    this.client.on('messageReactionRemove', (reaction, _user) => {
      const msg = reaction.message
      if (this.getChannelConfig(msg) == null) { return }
      this.processMessage(msg, false)
    })
    this.client.on('messageReactionRemoveEmoji', reaction => {
      const msg = reaction.message
      if (this.getChannelConfig(msg) == null) { return }
      this.processMessage(msg, false)
    })
    this.client.on('error', err => {
      console.error('Discord client error:', err)
    })
  }

  async login (token: string): Promise<void> {
    await this.client.login(token)
  }

  private addReactionIfMissing (msg: Discord.Message, emoji: string): void {
    if (!msg.reactions.cache
      .filter(r => r.emoji.name === emoji)
      .some(r => r.users.cache.some(u => u.id === (this.client.user as Discord.ClientUser).id))) {
      msg.react(emoji)
        .catch(err => {
          console.error('Failed to add reaction to message', err)
        })
    }
  }

  private processMessage (msg: Discord.Message, silent: boolean): void {
    if (!msg.content.startsWith('!')) { return }
    let cmd: string
    let args: string
    const space = msg.content.indexOf(' ', 1)
    if (space === -1) {
      cmd = msg.content.substring(1)
      args = ''
    } else {
      cmd = msg.content.substring(1, space)
      args = msg.content.substring(space + 1).trim()
    }
    switch (cmd) {
      case 'ajouter':
        return this.processAddQuestion(args, msg, silent)
      case 'supprimer':
        return this.processDeleteQuestion(args, msg, silent)
    }
  }

  private processAddQuestion (args: string, msg: Discord.Message, silent: boolean): void {
    const lines = args.split('\n').map(l => l.trim()).filter(l => l !== '')
    if (lines.length < 2 || lines[0].length < 10) {
      if (!silent) {
        msg.reply('Voici comment utiliser la commande :\n```\n' +
                    '!ajouter [question]\n' +
                    '[bonne réponse]\n[mauvaise réponse]\n' +
                    '[mauvaise réponse]\n[mauvaise réponse]\n```')
          .catch(err => {
            console.error('Failed to reply to message', err)
          })
      }
      return
    }
    if (!this.hasEnoughVotes(msg)) {
      this.addReactionIfMissing(msg, WHITE_CHECK_MARK)
      return
    }
    this.db.addQuestion(lines[0], lines[1], lines.slice(2))
    msg.delete()
      .catch(err => {
        console.error('Failed to delete message', err)
      })
  }

  private processDeleteQuestion (args: string, msg: Discord.Message, silent: boolean): void {
    if (args === '') {
      if (!silent) {
        msg.reply('Voici comment utiliser la commande :\n```\n' +
                    '!supprimer [identifiant question]\n```')
          .catch(err => {
            console.error('Failed to reply to message', err)
          })
      }
      return
    }
    const id = parseInt(args)
    if (!Number.isSafeInteger(id) || !this.db.doesQuestionExist(id)) {
      if (!silent) {
        msg.reply('Le numéro de la question est invalide !')
          .catch(err => {
            console.error('Failed to reply to message', err)
          })
      }
      return
    }
    if (!this.hasEnoughVotes(msg)) {
      this.addReactionIfMissing(msg, WHITE_CHECK_MARK)
      return
    }
    this.db.deleteQuestion(id)
    msg.delete()
      .catch(err => {
        console.error('Failed to delete message', err)
      })
  }

  private hasEnoughVotes (msg: Discord.Message): boolean {
    const config = this.getChannelConfig(msg)
    if (config === undefined) { return false }
    const r = msg.reactions.cache.find(r => r.emoji.name === WHITE_CHECK_MARK)
    if (r === undefined || r.count === undefined || r.count === 0) { return config.voteThreshold === 0 }
    const votes = r.users.cache
      .filter(u => u.id !== msg.author.id && u.id !== (this.client.user as Discord.ClientUser).id)
      .array().length
    return votes >= config.voteThreshold
  }

  private getChannelConfig (msg: Discord.Message): ChannelConfig | undefined {
    return this.channelConfigs
      .find(c => c.guildId === msg.guild?.id && msg.channel.type === 'text' && msg.channel.name === c.channel)
  }
}
