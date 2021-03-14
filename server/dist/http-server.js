"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
class HttpServer {
    constructor(db, port) {
        this.app = express_1.default();
        this.app.get("/questions", (_req, res) => {
            try {
                res.json(db.fetchAllQuestions());
            }
            catch (err) {
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
exports.default = HttpServer;
