import "bootstrap";
import "bootstrap/dist/css/bootstrap.css";

import { Fragment, h, render } from "preact";
import { useEffect, useState } from "preact/hooks";

import { Question } from "../server/db";

// From https://stackoverflow.com/a/12646864.
/* Randomize array in-place using Durstenfeld shuffle algorithm */
function shuffleArray(array: any[]) {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
}

function dateToString(date: Date) {
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
}

interface QuestionSlideProps {
    question: Question
    onNext(wasRight: boolean): void
}

function QuestionSlide(props: QuestionSlideProps) {
    const [answers, _] = useState(() => {
        const tmp = props.question.incorrectAnswers.map(a => ({ text: a, correct: false }));
        tmp.push({ text: props.question.correctAnswer, correct: true });
        shuffleArray(tmp);
        return tmp;
    });

    const [userAnswer, setUserAnswer] = useState(-1);

    let result = null;
    if (userAnswer !== -1) {
        const wasRight = answers[userAnswer].correct;
        const status = wasRight ? "Bravo !" : "Mauvaise réponse !";
        result = <div class="mt-3">
            <p>{status}</p>
            <button
                type="button"
                class="btn btn-primary"
                onClick={() => props.onNext(wasRight)}>
                Passer à la question suivante
            </button>
        </div>;
    }

    return <Fragment>
        <p class="lead">{props.question.prompt}</p>
        <dl class="row">
            <dt>ID</dt>
            <dd>{props.question.id}</dd>

            <dt>Ajoutée le</dt>
            <dd>{dateToString(props.question.createdAt!!)}</dd>
        </dl>
        {answers.map((a, i) => {
            const hasAnswered = userAnswer !== -1;
            const type = hasAnswered ?
                (a.correct ? "success" : "danger") :
                "primary";
            return <button
                type="button"
                class={`btn btn-outline-${type} d-block mb-2`}
                disabled={hasAnswered}
                onClick={_e => {
                    if (userAnswer === -1)
                        setUserAnswer(i);
                }}>
                {a.text}
            </button>;
        })}
        {result}
    </Fragment>;
}

const enum QuestionSelection {
    All,
    LastN,
}

interface MainMenuProps {
    onChoose(s: QuestionSelection): void
}

function MainMenu(props: MainMenuProps) {
    return <Fragment>
        <p>Sur quelles questions souhaitez-vous vous entraîner ?</p>
        <div>
            <button
                type="button"
                class="btn btn-primary"
                onClick={() => props.onChoose(QuestionSelection.LastN)}>
                Les 15 dernières questions
            </button>
            &nbsp;
            <button
                type="button"
                class="btn btn-secondary"
                onClick={() => props.onChoose(QuestionSelection.All)}>
                Toutes les questions
            </button>
        </div>
    </Fragment>;
}

function App() {
    const [error, setError] = useState(false);
    if (error) {
        return <Fragment>
            <p>Une erreur est survenue!</p>
        </Fragment>;
    }

    const [questions, setQuestions] = useState<Question[] | null>(null);
    useEffect(function() {
        fetch("/questions.json")
            .then(res => res.json())
            .then(json => {
                for (const question of json)
                    question.createdAt = new Date(question.createdAt);
                json.sort((a: Question, b: Question) => b.createdAt!!.valueOf() - a.createdAt!!.valueOf())
                setQuestions(json);
            })
            .catch(err => {
                console.error("Failed to load questions.", err);
                setError(true);
            })
    }, []);
    if (!questions) {
        return <Fragment>
            <p>Chargement en cours...</p>
        </Fragment>;
    }

    const [selectedQuestions, setSelectedQuestions] = useState<Question[] | null>(null);
    if (!selectedQuestions)
        return <MainMenu onChoose={s => {
            const tmp = s === QuestionSelection.All ? questions : questions.slice(0, 15);
            shuffleArray(tmp);
            setSelectedQuestions(tmp);
        }}/>;

    const [wrongAnswerCount, setWrongAnswerCount] = useState(0);

    const [currQuestion, setCurrQuestion] = useState(0);
    if (currQuestion >= questions.length) {
        return <Fragment>
            <p>C'est terminé. Vous avez fait <strong>{wrongAnswerCount}/{questions.length}</strong> fautes.</p>
            <div>
                <button
                    type="button"
                    class="d-block btn btn-primary"
                    onClick={() => {
                        setSelectedQuestions(null);
                        setWrongAnswerCount(0);
                        setCurrQuestion(0);
                    }}>
                    Recommencer
                </button>
            </div>
        </Fragment>;
    }

    const completed = Math.floor(currQuestion / selectedQuestions.length * 100);
    return <Fragment>
        <p><div class="progress">
            <div class="progress-bar"
                role="progressbar"
                style={`width: ${completed}%;`}
                aria-valuenow={completed}
                aria-valuemin="0"
                aria-valuemax="100">{currQuestion}/{selectedQuestions.length}</div>
        </div></p>
        <QuestionSlide
            key={currQuestion}
            question={questions[currQuestion]}
            onNext={wasRight => {
                if (!wasRight)
                    setWrongAnswerCount(old => old + 1);
                setCurrQuestion(currQuestion + 1);
            }}/>
    </Fragment>;
}

render(<App/>, document.getElementById("app")!!);
