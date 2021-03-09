import * as fs from "fs";
import * as readline from "readline";

export interface Question {
    id?: number
    prompt: string
    correctAnswer: string
    incorrectAnswers: string[]
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

        let currId: number | null = null;
        let currPrompt: string | null = null;
        let currCorrectAnswer: string | null = null;
        let currIncorrectAnswers: string[] = [];
        const flush = () => {
            if (currPrompt === null)
                return;
            if (currId === null || currCorrectAnswer === null || currIncorrectAnswers.length === 0)
                throw new Error("missing fields for question");
            this.questions.push({
                id: currId,
                prompt: currPrompt,
                correctAnswer: currCorrectAnswer,
                incorrectAnswers: currIncorrectAnswers,
            });
            if (currId > this.maxId)
                this.maxId = currId;
            currPrompt = null;
            currCorrectAnswer = null;
            currIncorrectAnswers = [];
        }
        for await (const line of rl) {
            if (line.startsWith("I: ")) {
                currId = parseInt(line.substring(3));
                if (!Number.isSafeInteger(currId) || currId < 0)
                    throw new Error("invalid question ID");
            } else if (line.startsWith("Q: ")) {
                flush();
                currPrompt = line.substring(3);
            } else if (line.startsWith("A: ")) {
                currCorrectAnswer = line.substring(3);
            } else if (line.startsWith("F: ")) {
                currIncorrectAnswers.push(line.substring(3));
            } else if (line !== "") {
                console.error("Unrecognized line:", line);
            }
        }
        flush();
    }

    add(q: Question) {
        if (this.maxId === -1)
            throw new Error("DB was not loaded");

        // Find a new unique ID for the question.
        q.id = ++this.maxId;

        this.questions.push(q);

        let data = `I: ${q.id}\nQ: ${q.prompt}\nA: ${q.correctAnswer}\n`;
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
