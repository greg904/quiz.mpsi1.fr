export interface ProgressBarProps {
  class?: string
  done: number
  total: number
}

export function ProgressBar (props: ProgressBarProps): JSX.Element {
  let className = 'progress'
  if (props.class !== undefined) { className += ` ${props.class}` }

  const completed = Math.trunc(props.done / props.total * 100)

  return (
    <div class={className}>
      <div
        class='progress-bar'
        role='progressbar'
        style={`width: ${completed}%;`}
        aria-valuenow={completed}
        aria-valuemin='0'
        aria-valuemax='100'
      >
        {props.done}/{props.total}
      </div>
    </div>
  )
}
