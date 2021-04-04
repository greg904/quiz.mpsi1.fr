export interface Question {
  id: number
  question: string
  correctAnswer: string
  incorrectAnswers: string[]
  createdAt: Date
}

function parseQuestion (o: any): Question {
  if (typeof o !== 'object' ||
    typeof o.question !== 'string' ||
    typeof o.correctAnswer !== 'string' ||
    typeof o.createdAt !== 'string') { throw new Error('Invalid JSON object.') }

  // Workaround for Typescript type checker
  const tmp = o.incorrectAnswers
  if (!Array.isArray(tmp) || tmp.some((a: any) => typeof a !== 'string')) {
    throw new Error('Invalid JSON object.')
  }

  const createdAt = new Date(o.createdAt)
  if (Number.isNaN(createdAt.valueOf())) { throw new Error('Invalid createdAt date.') }

  return {
    id: o.id,
    question: o.question,
    correctAnswer: o.correctAnswer,
    incorrectAnswers: o.incorrectAnswers,
    createdAt
  }
}

export async function fetchQuestions (): Promise<Question[]> {
  const res = await fetch(`${process.env.API_ENDPOINT ?? 'http://localhost:3000/'}questions`)
  if (!res.ok) { throw new Error('Response has a failure status code.') }

  const json = await res.json()
  if (!Array.isArray(json)) { throw new Error('Response bod is not an array.') }

  return json.map(parseQuestion)
}
