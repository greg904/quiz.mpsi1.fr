import * as path from "path";

import express from "express";

import { QuestionDatabase } from "./db";

export default class HttpServer {
    app: express.Application

    constructor(db: QuestionDatabase) {
        this.app = express();
        this.app.use(express.static("static"));
        this.app.use(express.static(path.join("dist", "client")));
        this.app.get("/questions.json", (req, res) => {
            res.json(db.questions);
        });
        this.app.listen(4000, "localhost", () => console.log("HTTP server listening..."));
    }
}
