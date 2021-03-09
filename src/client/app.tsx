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

function QuestionSlide(props: { question: Question, onNext(wasRight: boolean): void }) {
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
        result = <div>
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
        <h1>{props.question.prompt}</h1>
        <p><strong>ID:</strong> {props.question.id}</p>
        <p>
            {answers.map((a, i) => {
                const hasAnswered = userAnswer !== -1;
                const type = hasAnswered ?
                    (a.correct ? "success" : "danger") :
                    "primary";
                return <Fragment>
                    <button
                        type="button"
                        class={`btn btn-outline-${type}`}
                        disabled={hasAnswered}
                        onClick={_e => {
                            if (userAnswer === -1)
                                setUserAnswer(i);
                        }}>
                        {a.text}
                    </button>
                    &nbsp;
                </Fragment>;
            })}
        </p>
        {result}
    </Fragment>;
}

function App() {
    const [failed, setFailed] = useState(false);
    if (failed)
        return <strong>Une erreur est survenue!</strong>;

    const [questions, setQuestions] = useState<Question[] | null>(null);
    useEffect(function() {
        fetch("/questions.json")
            .then(res => res.json())
            .then(json => {
                shuffleArray(json);
                setQuestions(json);
            })
            .catch(err => {
                console.error("Failed to load questions.", err);
                setFailed(true);
            })
    }, []);
    if (questions === null)
        return <strong>Chargement en cours...</strong>;

    const [wrongAnswerCount, setWrongAnswerCount] = useState(0);

    const [currQuestion, setCurrQuestion] = useState(0);
    if (currQuestion >= questions.length) {
        return <Fragment>
            <h1>C'est terminé !</h1>
            <p>Vous avez fait {wrongAnswerCount}/{questions.length} fautes.</p>
        </Fragment>;
    }

    return <QuestionSlide
        key={currQuestion}
        question={questions[currQuestion]}
        onNext={wasRight => {
            if (!wasRight)
                setWrongAnswerCount(old => old + 1);
            setCurrQuestion(currQuestion + 1);
        }}/>;
}

render(<App/>, document.getElementById("app")!!);
