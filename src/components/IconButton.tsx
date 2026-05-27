import { type JSX, mergeProps } from 'solid-js'
import Button, { type ButtonVariant } from './Button'

/**
 * Convenience wrapper for square icon-only buttons.
 * Defaults: variant="neutral", size="icon". Both are overridable.
 */

interface IconButtonProps extends JSX.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: 'icon' | 'icon-sm'
  btnClass?: string
}

export default function IconButton(props: IconButtonProps) {
  const merged = mergeProps(
    { variant: 'neutral' as ButtonVariant, size: 'icon' as const },
    props,
  )
  return <Button {...merged} />
}
