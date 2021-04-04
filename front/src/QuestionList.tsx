import { JSX } from 'preact'

import { Question } from '../../server/src/db'

interface QuestionListProps {
  questions: Question[]
}

export function QuestionList (props: QuestionListProps): JSX.Element {
  return (
    <table class='table table-sm table-striped'>
      <thead>
        <tr>
          <th scope='col' style='width: 4em'>ID</th>
          <th scope='col'>Question</th>
        </tr>
      </thead>
      <tbody>
        {props.questions.map((q, i) => {
          return (
            <tr key={i}>
              <th scope='row'>{q.id}</th>
              <th>{q.question}</th>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
