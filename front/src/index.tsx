import "bootstrap";
import "bootstrap/dist/css/bootstrap.css";

import { Fragment, h, render } from "preact";
import { useEffect, useState } from "preact/hooks";

import { Question } from "../../server/src/db";
import { QuestionList } from "./QuestionList";

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
        result = <div class="pt-3">
            <p class="pb-2 mb-0">{status}</p>
            <button
                type="button"
                class="btn btn-primary"
                onClick={() => props.onNext(wasRight)}>
                Passer à la question suivante
            </button>
        </div>;
    }

    return <Fragment>
        <p class="lead">{props.question.question}</p>
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
                class={`btn btn-outline-${type} d-block mb-1`}
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

enum QuestionSelection {
    All,
    LastN,
}

interface MainMenuProps {
    questionCount: number
    onClickPlay(s: QuestionSelection): void
    onClickShowList(): void
}

function MainMenu(props: MainMenuProps) {
    return <Fragment>
        <h2 class="pb-2 mb-0">Jouer</h2>
        <p class="pb-2 mb-0">
            Essayez de bien lire les questions et non de répondre le
            plus rapidement possible pour bien retenir l'information.<br/>
            Sur quelles questions souhaitez-vous vous entraîner ?
        </p>
        <div class="pb-5 mb-0">
            <button
                type="button"
                class="btn btn-primary mb-1 me-1"
                onClick={() => props.onClickPlay(QuestionSelection.LastN)}>
                Les 10 dernières questions
            </button>
            <button
                type="button"
                class="btn btn-secondary mb-1 me-1"
                onClick={() => props.onClickPlay(QuestionSelection.All)}>
                Toutes les questions
            </button>
        </div>

        <h2 class="pb-2 mb-0">Modifier les questions</h2>
        <p class="pb-4 mb-0">
            Le quiz contient actuellement <strong>{props.questionCount}</strong> question(s).

            Rejoignez le serveur Discord des MPSI, allez dans le channel
            <code class="ps-1 pe-1">❓-quiz-mpsi-1</code> puis envoyez un message suivant le
            format décrit ci-dessous pour en ajouter ou en supprimer.
        </p>
        <h3 class="pb-2 mb-0">!ajouter</h3>
        <p class="pb-2 mb-0">
            Pour ajouter une question, utilisez la commande <kbd>!ajouter</kbd>.<br/>
            La deuxième ligne comporte la bonne réponse puis vous pouvez ajouter
            autant de mauvaises réponses que vous voulez sur les lignes suivantes.
        </p>
        <pre class="pb-4 mb-0">
            <code>
                !ajouter <mark>[question]</mark>{"\n"}
                <mark>[bonne réponse]</mark>{"\n"}
                <mark>[mauvaise réponse]</mark>{"\n"}
                <mark>[mauvaise réponse]</mark>{"\n"}
                <mark>[mauvaise réponse]</mark>
            </code>
        </pre>
        <h3 class="pb-2 mb-0">!supprimer</h3>
        <p class="pb-2 mb-0">
            Pour supprimer une question, utilisez la commande <kbd>!supprimer</kbd> :
        </p>
        <pre class="pb-5 mb-0">
            <code>!supprimer <mark>[ID question]</mark></code>
        </pre>

        <h2 class="pb-2 mb-0">Liste de questions</h2>
        <p>
            Vous pouvez accéder à la liste de questions, par exemple pour
            vérifier que la question que vous souhaitez ajouter n'est pas
            déjà présente.
        </p>
        <button
            type="button"
            class="btn btn-secondary"
            onClick={() => props.onClickShowList()}>
            Afficher la liste de questions
        </button>
    </Fragment>;
}

function App() {
    const [error, setError] = useState(false);
    if (error) {
        return <div class="alert alert-danger" role="alert">
            Une erreur est survenue.
        </div>;
    }

    const [questions, setQuestions] = useState<Question[] | null>(null);
    useEffect(function() {
        const fetchQuestions = async () => {
            try {
                const res = await fetch(process.env.API_ENDPOINT + "questions")
                if (!res.ok)
                    throw new Error("Response is not OK")
                const json = await res.json()
                for (const question of json)
                    question.createdAt = new Date(question.createdAt)
                json.sort((a: Question, b: Question) => b.createdAt!!.valueOf() - a.createdAt!!.valueOf())
                setQuestions(json)
            } catch (err) {
                console.error("Failed to load questions.", err)
                setError(true)
            }
        }
        fetchQuestions()
    }, []);
    if (!questions) {
        return <div class="spinner-border" role="status">
            <span class="visually-hidden">Chargement...</span>
        </div>;
    }

    const [showList, setShowList] = useState(false)
    if (showList) {
        return <QuestionList
            questions={questions}
            onClickBack={() => setShowList(false)}/>
    }

    const [selectedQuestions, setSelectedQuestions] = useState<Question[] | null>(null);
    if (!selectedQuestions) {
        return <MainMenu
            questionCount={questions.length}
            onClickPlay={s => {
                const tmp = s === QuestionSelection.All ? questions : questions.slice(0, 10);
                shuffleArray(tmp);
                setSelectedQuestions(tmp);
            }}
            onClickShowList={() => {
                setShowList(true)
            }}/>;
    }

    const [wrongAnswerCount, setWrongAnswerCount] = useState(0);

    const [currQuestion, setCurrQuestion] = useState(0);
    if (currQuestion >= selectedQuestions.length) {
        return <Fragment>
            <p class="pb-2 mb-0">
                C'est terminé. Vous avez fait <strong>{wrongAnswerCount}/{selectedQuestions.length}</strong> fautes.
            </p>
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
