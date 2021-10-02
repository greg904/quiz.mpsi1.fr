import { Database } from './db'
import DiscordBot from './discord-bot'
import HttpServer from './http-server'

import { getConfig } from './config'

async function main (): Promise<void> {
  const config = getConfig()
  const db = new Database(config.dbPath)

  if (config.discordToken !== undefined) {
    const bot = new DiscordBot(db, config.channelConfigs)
    await bot.login(config.discordToken)
  } else {
    console.warn('No DISCORD_TOKEN set, Discord bot will not be running.')
  }

  const server = new HttpServer(db)
  await server.listen(config.serverPort)
  console.log('HTTP server is listening on port', config.serverPort)
}

main().catch(console.error)
