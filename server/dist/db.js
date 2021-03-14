"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Database = void 0;
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
class Database {
    constructor(path) {
        this.sql = new better_sqlite3_1.default(path);
    }
    fetchAllQuestions() {
        const rows = this.sql.prepare("SELECT id, question, correct_answer, incorrect_answers, created_at FROM questions")
            .all();
        return rows.map(function (row) {
            return {
                id: row.id,
                question: row.question,
                correctAnswer: row.correct_answer,
                incorrectAnswers: JSON.parse(row.incorrect_answers),
                createdAt: new Date(row.created_at),
            };
        });
    }
    addQuestion(question, correctAnswer, incorrectAnswers) {
        const result = this.sql.prepare("INSERT INTO questions (question, correct_answer, incorrect_answers) VALUES (?, ?, ?)")
            .run(question, correctAnswer, JSON.stringify(incorrectAnswers));
        const id = result.lastInsertRowid;
        return typeof id === "string" ? parseInt(id) : id.valueOf();
    }
    deleteQuestion(id) {
        const result = this.sql.prepare("DELETE FROM questions WHERE id = ?")
            .run(id);
        return result.changes > 0;
    }
    doesQuestionExist(id) {
        return this.sql.prepare("SELECT id from questions WHERE id = ?").get(id) !== undefined;
    }
}
exports.Database = Database;
