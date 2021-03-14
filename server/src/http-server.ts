import express from "express";

import { Database } from "./db";

export default class HttpServer {
    app: express.Application

    constructor(db: Database, port: number) {
        this.app = express();
        this.app.get("/questions", (_req, res) => {
            try {
                res.json(db.fetchAllQuestions());
            } catch (err) {
                console.error("Failed to fetch questions", err);
                res.status(500);
                res.json(null);
            }
        });
        // Default handler.
        this.app.use((_req, res) => {
            res.json(null);
        });
        this.app.listen(port, "localhost", () => console.log("HTTP server listening..."));
    }
}
