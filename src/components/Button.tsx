import { type JSX, mergeProps, splitProps } from 'solid-js'
import { cn } from '~/lib/classnames'

/**
 * Brutalist button ported from client-web-old/.../button.directive.ts.
 * Same variant + size keys, same class composition, same `brutal-press` motion.
 * For `<a>` styled like a button (e.g. Back nav), use `buttonClasses()` directly.
 */

export type ButtonVariant =
  | 'default'
  | 'neutral'
  | 'ghost'
  | 'destructive'
  | 'success'
  | 'warning'

export type ButtonSize = 'default' | 'sm' | 'lg' | 'icon' | 'icon-sm'

const BASE =
  'inline-flex items-center justify-center gap-2 whitespace-nowrap font-bold tracking-tight rounded-md text-sm disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none'

const BORDERED = 'border-2 border-border shadow-brutal brutal-press'

const VARIANTS: Record<ButtonVariant, string> = {
  default: `bg-primary text-primary-foreground ${BORDERED}`,
  neutral: `bg-secondary-background text-foreground ${BORDERED}`,
  destructive: `bg-destructive text-destructive-foreground ${BORDERED}`,
  success: `bg-success text-success-foreground ${BORDERED}`,
  warning: `bg-warning text-warning-foreground ${BORDERED}`,
  ghost: 'text-foreground hover:bg-foreground/5 transition-colors',
}

const SIZES: Record<ButtonSize, string> = {
  default: 'h-10 px-4',
  sm: 'h-9 px-3',
  lg: 'h-12 px-6 text-base',
  icon: 'h-10 w-10',
  'icon-sm': 'h-8 w-8',
}

export interface ButtonClassOptions {
  variant?: ButtonVariant | undefined
  size?: ButtonSize | undefined
  extra?: string | undefined
}

export const buttonClasses = (opts: ButtonClassOptions = {}): string => {
  const variant = opts.variant ?? 'default'
  const size = opts.size ?? 'default'
  return cn(BASE, VARIANTS[variant], SIZES[size], opts.extra)
}

type ButtonProps = JSX.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
  btnClass?: string
}

export default function Button(props: ButtonProps) {
  const merged = mergeProps({ type: 'button' as const }, props)
  // `ref` has to come out via splitProps and be passed explicitly — spreading
  // it through `{...rest}` does NOT wire it up in Solid; the compiler only
  // special-cases `ref={...}` when it appears as its own JSX attribute.
  const [local, rest] = splitProps(merged, [
    'variant',
    'size',
    'btnClass',
    'class',
    'children',
    'ref',
  ])
  return (
    <button
      {...rest}
      ref={local.ref}
      class={buttonClasses({
        variant: local.variant,
        size: local.size,
        extra: cn(local.class, local.btnClass),
      })}
    >
      {local.children}
    </button>
  )
}
