import express from 'express'

import { Database } from './db'

export default class HttpServer {
  app: express.Application

  constructor (db: Database, port: number) {
    this.app = express()
    this.app.get('/questions', (_req, res) => {
      try {
        res.json(db.fetchAllQuestions())
      } catch (err) {
        console.error('Failed to fetch questions', err)
        res.status(500)
        res.end()
      }
    })
    // Default handler.
    this.app.use((_req, res) => {
      res.status(404)
      res.end()
    })
  }

  async listen (port: number): Promise<void> {
    return await new Promise((resolve, reject) => {
      this.app.once('error', reject)
      this.app.listen(port, 'localhost', () => {
        resolve()
        this.app.removeListener('error', reject)
      })
    })
  }
}
