import { Link } from 'react-router-dom'

export interface MainMenuProps {
  questionCount: number
}

export function MainMenu (props: MainMenuProps): JSX.Element {
  return (
    <>
      <h2>Jouer</h2>
      <p>
        Essayez de bien lire les questions et non de répondre le
        plus rapidement possible pour bien retenir l'information.<br />
        Sur quelles questions souhaitez-vous vous entraîner ?
      </p>
      <div class='mb-4'>
        <Link
          to='/jouer/10'
          className='btn btn-primary mb-1 me-1'
        >
          Les 10 dernières questions
        </Link>
        <Link
          to='/jouer/tout'
          className='btn btn-primary mb-1 me-1'
        >
          Toutes les questions
        </Link>
      </div>

      <h2>Modifier les questions</h2>
      <p class='mb-4'>
        Le quiz contient actuellement <strong>{props.questionCount}</strong> question(s).

        Rejoignez le serveur Discord, allez dans le channel
        <code class='ps-1 pe-1'>❓-quiz-français</code> puis envoyez un message suivant le
        format décrit ci-dessous pour en ajouter ou en supprimer.
      </p>
      <h3>!ajouter</h3>
      <p>
        Pour ajouter une question, utilisez la commande <kbd>!ajouter</kbd>.<br />
        La deuxième ligne comporte la bonne réponse puis vous pouvez ajouter
        autant de mauvaises réponses que vous voulez sur les lignes suivantes.
      </p>
      <pre class='mb-4'>
        <code>
          !ajouter <mark>[question]</mark>{'\n'}
          <mark>[bonne réponse]</mark>{'\n'}
          <mark>[mauvaise réponse]</mark>{'\n'}
          <mark>[mauvaise réponse]</mark>{'\n'}
          <mark>[mauvaise réponse]</mark>
        </code>
      </pre>
      <h3>!supprimer</h3>
      <p>
        Pour supprimer une question, utilisez la commande <kbd>!supprimer</kbd> :
      </p>
      <pre class='mb-4'>
        <code>!supprimer <mark>[ID question]</mark></code>
      </pre>

      <h2>Liste de questions</h2>
      <p>
        Vous pouvez accéder à la liste de questions, par exemple pour
        vérifier que la question que vous souhaitez ajouter n'est pas
        déjà présente.
      </p>
      <Link
        to='/questions'
        className='btn btn-secondary'
      >
        Afficher la liste de questions
      </Link>
    </>
  )
}
