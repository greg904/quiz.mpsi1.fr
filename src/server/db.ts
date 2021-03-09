import * as fs from "fs";
import * as readline from "readline";

export interface Question {
    id?: number
    prompt: string
    correctAnswer: string
    incorrectAnswers: string[]
    createdAt?: Date
}

const DB_FILE = "questions.txt";

export class QuestionDatabase {
    questions: Question[] = []

    private maxId = -1

    async load() {
        this.questions = [];
        this.maxId = 0;

        const stream = fs.createReadStream(DB_FILE);
        try {
            await new Promise((resolve, reject) => {
                stream.on("ready", resolve);
                stream.on("error", reject);
            });
        } catch (err) {
            // Ignore file not found error.
            if (err.code === "ENOENT")
                return;
            throw err;
        }
        const rl = readline.createInterface({
            input: stream,
            crlfDelay: Infinity,
        });

        class PartialQuestion {
            id: number
            prompt?: string
            correctAnswer?: string
            incorrectAnswers: string[] = []
            createdAt?: Date

            constructor(id: number) {
                this.id = id;
            }
        }
        let curr: PartialQuestion | null = null;
        const finishCurr = () => {
            if (curr === null)
                return;
            if (!curr.prompt || !curr.correctAnswer || curr.incorrectAnswers.length === 0 || !curr.createdAt)
                throw new Error("missing fields for question");
            this.questions.push({
                id: curr.id,
                prompt: curr.prompt,
                correctAnswer: curr.correctAnswer,
                incorrectAnswers: curr.incorrectAnswers,
                createdAt: curr.createdAt,
            });
            if (curr.id > this.maxId)
                this.maxId = curr.id;
            curr = null;
        }

        for await (const line of rl) {
            if (line.startsWith("I: ")) {
                finishCurr();
                const id = parseInt(line.substring(3));
                if (!Number.isSafeInteger(id) || id < 0)
                    throw new Error("invalid question ID");
                curr = new PartialQuestion(id);
            } else if (line.startsWith("Q: ")) {
                if (!curr)
                    throw new Error("missing question ID");
                curr.prompt = line.substring(3);
            } else if (line.startsWith("A: ")) {
                if (!curr)
                    throw new Error("missing question ID");
                curr.correctAnswer = line.substring(3);
            } else if (line.startsWith("F: ")) {
                if (!curr)
                    throw new Error("missing question ID");
                curr.incorrectAnswers.push(line.substring(3));
            } else if (line.startsWith("C: ")) {
                if (!curr)
                    throw new Error("missing question ID");
                curr.createdAt = new Date(line.substring(3));
            } else if (line !== "") {
                console.error("Unrecognized line:", line);
            }
        }
        finishCurr();
    }

    add(q: Question) {
        if (this.maxId === -1)
            throw new Error("DB was not loaded");

        q.createdAt = new Date();
        // Find a new unique ID for the question.
        q.id = ++this.maxId;

        this.questions.push(q);

        let data = `I: ${q.id}\nC: ${q.createdAt.toISOString()}\nQ: ${q.prompt}\nA: ${q.correctAnswer}\n`;
        for (const a of q.incorrectAnswers)
            data += `F: ${a}\n`;

        if (this.questions.length === 1) {
            return fs.promises.writeFile(DB_FILE, data, "utf-8");
        } else {
            return fs.promises.appendFile(DB_FILE, "\n" + data, { encoding: "utf-8" });
        }
    }

    async removeById(id: number) {
        const i = this.questions.findIndex(q => q.id === id);
        if (i === -1)
            return;
        
        this.questions.splice(i, 1);

        if (this.questions.length === 0) {
            try {
                await fs.promises.unlink(DB_FILE);
            } catch (err) {
                // Ignore file not found error.
                if (err.code !== "ENOENT")
                    throw err;
            }
            return;
        }

        // To prevent data loss, do the change on a temp file first.
        await fs.promises.rename(DB_FILE, DB_FILE + ".tmp");
        for (const q of this.questions)
            await this.add(q);
        await fs.promises.unlink(DB_FILE + ".tmp");
    }
}
