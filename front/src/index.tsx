import { JSX, render } from 'preact'
import { useEffect, useMemo, useState } from 'preact/hooks'
import { BrowserRouter, Link, Route, Switch, useParams } from 'react-router-dom'

import * as net from './net'
import { MainMenu } from './MainMenu'
import { QuestionList } from './QuestionList'
import { EndSlide } from './EndSlide'
import { ProgressBar } from './ProgressBar'
import { QuestionSlide } from './QuestionSlide'
import shuffleArray from './shuffle-array'

interface PlayRouteProps {
  questions: net.Question[]
  all?: boolean
}

function PlayRoute (props: PlayRouteProps): JSX.Element {
  const { count: countStr }: { count?: string } = useParams()

  const questions = useMemo(() => {
    let tmp
    if (props.all === true || countStr === undefined) {
      tmp = props.questions
    } else {
      const count = parseInt(countStr)
      tmp = props.questions.slice(0, count)
    }
    shuffleArray(tmp)
    return tmp
  }, [props.questions, props.all, countStr])

  const [done, setDone] = useState(0)
  const [wrongAnswers, setWrongAnswers] = useState(0)

  if (done >= questions.length) {
    return <EndSlide wrong={wrongAnswers} total={questions.length} />
  }

  return (
    <>
      <nav class='mb-4' aria-label='breadcrumb'>
        <ol class='breadcrumb'>
          <li class='breadcrumb-item'><Link to='/'>Accueil</Link></li>
          <li class='breadcrumb-item active' aria-current='page'>Jouer</li>
        </ol>
      </nav>
      <ProgressBar done={done} total={questions.length} class='mb-3' />
      <QuestionSlide
        key={done}
        question={questions[done]}
        onNext={wasRight => {
          if (!wasRight) { setWrongAnswers(old => old + 1) }
          setDone(old => old + 1)
        }}
      />
    </>
  )
}

function App (): JSX.Element {
  const [error, setError] = useState(false)
  if (error) {
    return (
      <div class='alert alert-danger' role='alert'>
        Une erreur est survenue.
      </div>
    )
  }

  const [questions, setQuestions] = useState<net.Question[] | null>(null)
  useEffect(function (): void {
    net.fetchQuestions()
      .then(questions => {
        // Sort questions so that the user can play the quiz with only the most
        // recent questions.
        questions.sort((a, b) => b.createdAt.valueOf() - a.createdAt.valueOf())

        setQuestions(questions)
      })
      .catch(err => {
        console.error('Failed to load questions.', err)
        setError(true)
      })
  }, [])
  if (questions == null) {
    return (
      <div class='spinner-border' role='status'>
        <span class='visually-hidden'>Chargement...</span>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Switch>
        <Route path='/' exact>
          <nav class='mb-4' aria-label='breadcrumb'>
            <ol class='breadcrumb'>
              <li class='breadcrumb-item active' aria-current='page'>Accueil</li>
            </ol>
          </nav>
          <MainMenu questionCount={questions.length} />
        </Route>
        <Route path='/questions' exact>
          <nav class='mb-4' aria-label='breadcrumb'>
            <ol class='breadcrumb'>
              <li class='breadcrumb-item'><Link to='/'>Accueil</Link></li>
              <li class='breadcrumb-item active' aria-current='page'>Liste des questions</li>
            </ol>
          </nav>
          <QuestionList questions={questions} />
        </Route>
        <Route path='/jouer/:count(\d+)' exact>
          <PlayRoute questions={questions} />
        </Route>
        <Route path='/jouer/tout' exact>
          <PlayRoute questions={questions} all />
        </Route>
      </Switch>
    </BrowserRouter>
  )
}

function runApp (): void {
  const appDiv = document.getElementById('app')
  if (appDiv === null) { throw new Error('No #app div') }
  render(<App />, appDiv)
}

runApp()
