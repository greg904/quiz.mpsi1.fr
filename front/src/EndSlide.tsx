import { Link } from 'react-router-dom'

export interface EndSlideProps {
  wrong: number
  total: number
}

export function EndSlide (props: EndSlideProps): JSX.Element {
  return (
    <>
      <p class='pb-2 mb-0'>
        C'est terminé. Vous avez fait <strong>{props.wrong}</strong>/<strong>{props.total}</strong> fautes.
      </p>
      <Link
        to='/'
        className='btn btn-primary'
      >
        Recommencer
      </Link>
    </>
  )
}
