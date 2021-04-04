import { Fragment, JSX } from 'preact'

import { Question } from '../../server/src/db'

interface QuestionListProps {
  questions: Question[]
  onClickBack: () => void
}

export function QuestionList (props: QuestionListProps): JSX.Element {
  const onClickBack = (e: MouseEvent): void => {
    e.preventDefault()
    props.onClickBack()
  }

  // Sort by creation date (descending)
  const questions = [...props.questions]
    .sort((a, b) => b.createdAt.valueOf() - a.createdAt.valueOf())

  return (
    <Fragment>
      <nav aria-label='breadcrumb'>
        <ol class='breadcrumb'>
          <li class='breadcrumb-item'><a href='#' onClick={onClickBack}>Accueil</a></li>
          <li class='breadcrumb-item active' aria-current='page'>Liste de questions</li>
        </ol>
      </nav>

      <table class='table table-sm table-striped'>
        <thead>
          <tr>
            <th scope='col' style='width: 4em'>ID</th>
            <th scope='col'>Question</th>
          </tr>
        </thead>
        <tbody>
          {questions.map((q, i) => {
            return (
              <tr key={i}>
                <th scope='row'>{q.id}</th>
                <th>{q.question}</th>
              </tr>
            )
          })}
        </tbody>
      </table>
    </Fragment>
  )
}
