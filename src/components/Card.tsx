import { type JSX } from 'solid-js'
import { cn } from '~/lib/classnames'

/**
 * Neobrutalist card surface. Ported from client-web-old/.../card.component.ts.
 * Card = bordered + shadowed container. CardContent = padded inner slot.
 */

interface CardProps {
  class?: string
  children?: JSX.Element
}

export function Card(props: CardProps) {
  return (
    <div
      class={cn(
        'block rounded-lg border-2 border-border bg-secondary-background text-foreground shadow-brutal',
        props.class,
      )}
    >
      {props.children}
    </div>
  )
}

export function CardContent(props: CardProps) {
  return <div class={cn('block p-5', props.class)}>{props.children}</div>
}
