import { type JSX, splitProps } from 'solid-js'
import { cn } from '~/lib/classnames'

/**
 * Brutalist text input. Ported from client-web-old/.../input.directive.ts.
 * Defaults autocomplete/correct/capitalize off and spellcheck false; the host
 * page rarely wants browser-managed completion on these short labels.
 */

const BASE =
  'flex h-10 w-full rounded-md border-2 border-border bg-secondary-background px-3 py-2 text-sm font-medium text-foreground placeholder:text-subtle-foreground placeholder:font-normal shadow-brutal-sm transition-shadow focus-visible:shadow-brutal disabled:cursor-not-allowed disabled:opacity-50'

type InputProps = JSX.InputHTMLAttributes<HTMLInputElement>

export default function Input(props: InputProps) {
  const [local, rest] = splitProps(props, ['class'])
  return (
    <input
      autocomplete="off"
      autocorrect="off"
      autocapitalize="off"
      spellcheck={false}
      {...rest}
      class={cn(BASE, local.class)}
    />
  )
}
