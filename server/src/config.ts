export interface ChannelConfig {
  guildId: string
  channelId: string
  voteThreshold: number
}

export interface Config {
  discordToken?: string
  dbPath: string
  serverPort: number
  channelConfigs: ChannelConfig[]
}

export function getConfig (): Config {
  const serverPortStr = process.env.HTTP_PORT
  if (serverPortStr === undefined) { throw new Error('Missing HTTP_PORT environment variable') }
  const serverPort = parseInt(serverPortStr)
  if (!Number.isSafeInteger(serverPort)) { throw new Error('Invalid HTTP_PORT environment variable') }

  const dbPath = process.env.DB_PATH
  if (dbPath === undefined) { throw new Error('Missing DB_PATH environment variable') }

  const channelConfigStr = process.env.DISCORD_CONFIG
  if (channelConfigStr === undefined) { throw new Error('Missing DISCORD_CONFIG environment variable') }

  const channelConfigs: ChannelConfig[] = channelConfigStr.split(';')
    .map(c => {
      const parts = c.split(':')
      return {
        guildId: parts[0],
        channelId: parts[1],
        voteThreshold: parseInt(parts[2])
      }
    })

  return {
    discordToken: process.env.DISCORD_TOKEN,
    dbPath,
    serverPort,
    channelConfigs
  }
}
