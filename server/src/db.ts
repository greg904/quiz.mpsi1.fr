import sqlite3 from "better-sqlite3";

export interface Question {
    id: number
    question: string
    correctAnswer: string
    incorrectAnswers: string[]
    createdAt: Date
}

export class Database {
    private sql: sqlite3.Database;

    constructor(path: string) {
        this.sql = new sqlite3(path);
    }

    fetchAllQuestions(): Question[] {
        const rows = this.sql.prepare("SELECT id, question, correct_answer, incorrect_answers, created_at FROM questions")
            .all();
        return rows.map(function(row) {
            return {
                id: row.id,
                question: row.question,
                correctAnswer: row.correct_answer,
                incorrectAnswers: JSON.parse(row.incorrect_answers),
                createdAt: new Date(row.created_at),
            };
        });
    }

    addQuestion(question: string, correctAnswer: string, incorrectAnswers: string[]): number {
        const result = this.sql.prepare("INSERT INTO questions (question, correct_answer, incorrect_answers) VALUES (?, ?, ?)")
            .run(question, correctAnswer, JSON.stringify(incorrectAnswers));
        const id = result.lastInsertRowid;
        return typeof id === "string" ? parseInt(id) : id.valueOf();
    }

    deleteQuestion(id: number): boolean {
        const result = this.sql.prepare("DELETE FROM questions WHERE id = ?")
            .run(id);
        return result.changes > 0;
    }

    doesQuestionExist(id: number): boolean {
        return this.sql.prepare("SELECT id from questions WHERE id = ?").get(id) !== undefined;
    }
}