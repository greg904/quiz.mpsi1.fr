import { useMemo, useState } from 'preact/hooks'

import * as net from './net'
import shuffleArray from './shuffle-array'

export interface QuestionSlideProps {
  question: net.Question
  onNext?: (wasRight: boolean) => void
}

export function QuestionSlide (props: QuestionSlideProps): JSX.Element {
  const answers = useMemo(() => {
    const tmp = props.question.incorrectAnswers.map(a => ({ text: a, correct: false }))
    tmp.push({ text: props.question.correctAnswer, correct: true })
    shuffleArray(tmp)
    return tmp
  }, [props.question.incorrectAnswers, props.question.correctAnswer])

  const [chosenAnswer, setChosenAnswer] = useState(-1)

  let result = null
  if (chosenAnswer !== -1) {
    const wasRight = answers[chosenAnswer].correct
    const status = wasRight ? 'Bravo !' : 'Mauvaise réponse !'
    result = (
      <div class='pt-3'>
        <p class='pb-2 mb-0'>{status}</p>
        <button
          type='button'
          class='btn btn-primary'
          onClick={() => {
            if (props.onNext !== undefined) { props.onNext(wasRight) }
          }}
        >
          Passer à la question suivante
        </button>
      </div>
    )
  }

  return (
    <>
      <p class='lead'>{props.question.question}</p>
      <dl class='row'>
        <dt>ID</dt>
        <dd>{props.question.id}</dd>

        <dt>Ajoutée le</dt>
        <dd>{props.question.createdAt.toLocaleDateString()}</dd>
      </dl>
      {answers.map((a, i) => {
        const hasAnswered = chosenAnswer !== -1
        const type = hasAnswered
          ? (a.correct ? 'success' : 'danger')
          : 'primary'
        return (
          <button
            key={i}
            type='button'
            class={`btn btn-outline-${type} d-block mb-1`}
            disabled={hasAnswered}
            onClick={_e => {
              if (chosenAnswer === -1) { setChosenAnswer(i) }
            }}
          >
            {a.text}
          </button>
        )
      })}
      {result}
    </>
  )
}
