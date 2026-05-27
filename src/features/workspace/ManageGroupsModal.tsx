import { For, Show, createEffect } from 'solid-js'
import { Eye } from 'lucide-solid'
import Button from '~/components/Button'
import { cn } from '~/lib/classnames'
import type { Group } from '~/features/groups/types'

/**
 * Native `<dialog>`-backed modal for toggling group visibility. The browser
 * provides focus trap, ESC, and inert backdrop for free; we add a backdrop
 * click-to-dismiss by checking whether the click target IS the dialog element
 * (clicks on the backdrop bubble to the dialog itself).
 */

interface Props {
  show: boolean
  groups: Group[]
  onToggleHidden: (groupId: string, isHidden: boolean) => void
  onShowAll: () => void
  onClose: () => void
}

export default function ManageGroupsModal(props: Props) {
  let dialogRef: HTMLDialogElement | undefined

  createEffect(() => {
    if (!dialogRef) return
    if (props.show && !dialogRef.open) dialogRef.showModal()
    else if (!props.show && dialogRef.open) dialogRef.close()
  })

  const hiddenCount = (): number =>
    props.groups.reduce((n, g) => n + (g.isHidden ? 1 : 0), 0)

  const hasHidden = (): boolean => hiddenCount() > 0

  const handleBackdropClick = (event: MouseEvent): void => {
    if (event.target === dialogRef) props.onClose()
  }

  return (
    <dialog
      ref={dialogRef}
      onClose={() => props.onClose()}
      onClick={handleBackdropClick}
      aria-label="Manage visible groups"
      // m-auto: restore native <dialog> centering (Tailwind v4 preflight wipes
      // out `margin: auto` from the user-agent dialog style).
      class="m-auto rounded-md border-2 border-border bg-background shadow-brutal p-0 backdrop:bg-foreground/40 max-h-[calc(100vh-2rem)] max-w-[calc(100vw-2rem)]"
    >
      <div class="flex w-96 max-w-[calc(100vw-2rem)] flex-col gap-4 p-4">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold tracking-[0.1em] uppercase text-foreground">
            Visible groups
          </span>
          <Show when={hasHidden()}>
            <Button
              variant="ghost"
              size="sm"
              btnClass="h-8 px-2.5 text-xs"
              onClick={() => props.onShowAll()}
            >
              <Eye size={14} />
              Show all
            </Button>
          </Show>
        </div>

        <Show when={hasHidden()}>
          <p class="readout text-xs font-semibold text-muted-foreground -mt-2">
            {hiddenCount()} hidden · {props.groups.length - hiddenCount()} shown
          </p>
        </Show>

        <Show
          when={props.groups.length > 0}
          fallback={
            <p class="text-sm font-medium text-muted-foreground py-6 text-center">
              No groups yet.
            </p>
          }
        >
          <ul class="flex-1 overflow-y-auto -mx-1 px-1 space-y-1" role="list">
            <For each={props.groups}>{(group) => (
              <li>
                <label
                  for={`mgm-group-${group.id}`}
                  class="flex items-center gap-3 px-3 py-2.5 rounded-md border-2 border-transparent hover:border-border hover:bg-secondary-background cursor-pointer transition-colors"
                >
                  <input
                    id={`mgm-group-${group.id}`}
                    type="checkbox"
                    class="h-4 w-4 shrink-0 cursor-pointer"
                    checked={!group.isHidden}
                    onChange={(e) =>
                      props.onToggleHidden(group.id, !e.currentTarget.checked)
                    }
                  />
                  <span
                    class={cn(
                      'flex-1 text-sm font-semibold tracking-tight truncate',
                      group.isHidden && 'text-subtle-foreground line-through',
                    )}
                  >
                    {group.name}
                  </span>
                </label>
              </li>
            )}</For>
          </ul>
        </Show>

        <div class="flex justify-end pt-1">
          <Button size="sm" btnClass="h-9 px-5" onClick={() => props.onClose()}>
            Done
          </Button>
        </div>
      </div>
    </dialog>
  )
}
