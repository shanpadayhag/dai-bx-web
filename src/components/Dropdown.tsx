import { createSignal, For, onCleanup, onMount, Show } from 'solid-js'
import { ChevronDown, Check } from 'lucide-solid'
import { cn } from '~/lib/classnames'

/**
 * Anchored dropdown ported from client-web-old/.../dropdown.component.{ts,html}.
 * Same trigger styling, same options list, same listbox/option ARIA roles.
 * Implementation difference: instead of Angular CDK overlay we use plain
 * absolute positioning relative to the trigger (cheaper on low-end devices)
 * with a `pointerdown` outside-click listener and ESC to dismiss.
 */

export interface DropdownOption {
  value: string
  label: string
}

interface DropdownProps {
  options: DropdownOption[]
  value: string
  placeholder?: string
  onValueChange: (value: string) => void
  class?: string
}

export default function Dropdown(props: DropdownProps) {
  const [open, setOpen] = createSignal(false)
  let triggerRef: HTMLButtonElement | undefined
  let rootRef: HTMLDivElement | undefined

  const selectedLabel = (): string => {
    const current = props.options.find((o) => o.value === props.value)
    return current?.label ?? (props.placeholder ?? 'Select…')
  }

  const select = (value: string): void => {
    props.onValueChange(value)
    setOpen(false)
    triggerRef?.focus()
  }

  const handleDocPointerDown = (e: PointerEvent): void => {
    if (!open()) return
    if (rootRef && !rootRef.contains(e.target as Node)) {
      setOpen(false)
    }
  }

  const handleKeyDown = (e: KeyboardEvent): void => {
    if (e.key === 'Escape' && open()) {
      e.stopPropagation()
      setOpen(false)
      triggerRef?.focus()
    }
  }

  onMount(() => {
    document.addEventListener('pointerdown', handleDocPointerDown)
    document.addEventListener('keydown', handleKeyDown)
  })
  onCleanup(() => {
    document.removeEventListener('pointerdown', handleDocPointerDown)
    document.removeEventListener('keydown', handleKeyDown)
  })

  return (
    <div ref={rootRef} class={cn('relative', props.class)}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(!open())}
        aria-expanded={open()}
        aria-haspopup="listbox"
        class="flex h-9 w-full items-center justify-between gap-2 rounded-md border-2 border-border bg-secondary-background px-3 text-sm font-medium text-foreground shadow-brutal-sm cursor-pointer transition-shadow hover:shadow-brutal"
      >
        <span class="truncate text-left">{selectedLabel()}</span>
        <ChevronDown
          size={16}
          class={cn('shrink-0 transition-transform', open() && 'rotate-180')}
        />
      </button>

      <Show when={open()}>
        <div
          role="listbox"
          class="absolute left-0 right-0 top-[calc(100%+6px)] z-10 max-h-64 overflow-y-auto rounded-md border-2 border-border bg-background shadow-brutal"
        >
          <For each={props.options}>{(option) => (
            <button
              type="button"
              role="option"
              aria-selected={props.value === option.value}
              onClick={() => select(option.value)}
              class={cn(
                'flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm font-semibold tracking-tight hover:bg-secondary-background transition-colors',
                props.value === option.value && 'bg-primary-soft',
              )}
            >
              <span class="truncate">{option.label}</span>
              <Show when={props.value === option.value}>
                <Check size={16} class="shrink-0" />
              </Show>
            </button>
          )}</For>
        </div>
      </Show>
    </div>
  )
}
