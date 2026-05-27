import { For, Show, createEffect } from 'solid-js'
import { A } from '@solidjs/router'
import { Play, Plus, Trash2, X } from 'lucide-solid'
import Button from '~/components/Button'
import Dropdown, { type DropdownOption } from '~/components/Dropdown'
import { cn } from '~/lib/classnames'
import { uid } from '~/lib/ids'
import { primeAudio } from '~/lib/audio'
import { useWorkspace } from '~/state/workspaceContext'
import {
  reindexSets,
  reindexTimers,
  sortedSets,
  sortedTimers,
} from './lib/timerFormat'
import type { TimerSet, TimerSpec } from './types'

/**
 * Timer editor dialog. Lets the user create / delete timer "versions", rename
 * the current one, toggle auto-advance, pick a sound, add / remove / edit
 * steps (1–180 min), and Start. The TimersRunner is invoked on Start.
 *
 * Incomplete-version rule: a newly added version starts with zero steps, and
 * a version with zero steps blocks every close affordance (Done, Start, Esc,
 * backdrop, the "Manage sounds" link). The user must click "Add step" or
 * delete the version (Trash2) before the modal can close. The signal lives
 * in the data — `timers.length === 0` — so it survives the `TaskItem`
 * remount that `tasks.updateTimerSets` triggers; no transient component
 * state is at risk.
 */

interface Props {
  show: boolean
  groupId: string
  taskId: string
  timerSets: TimerSet[]
  activeTimerSetId: string | null
  onTimerSetsChange: (next: TimerSet[]) => void
  onActiveTimerSetIdChange: (id: string | null) => void
  onClose: () => void
}

export default function TimerEditor(props: Props) {
  const ws = useWorkspace()
  let dialogRef: HTMLDialogElement | undefined
  let addStepRef: HTMLButtonElement | undefined

  createEffect(() => {
    if (!dialogRef) return
    if (props.show && !dialogRef.open) dialogRef.showModal()
    else if (!props.show && dialogRef.open) dialogRef.close()
  })

  const sortedSetsValue = (): TimerSet[] => sortedSets(props.timerSets)

  const currentSet = (): TimerSet | null => {
    const sets = sortedSetsValue()
    if (sets.length === 0) return null
    return sets.find((s) => s.id === props.activeTimerSetId) ?? sets[0] ?? null
  }

  const currentTimers = (): TimerSpec[] => {
    const set = currentSet()
    return set ? sortedTimers(set.timers) : []
  }

  const canStart = (): boolean => (currentSet()?.timers.length ?? 0) > 0

  const isIncomplete = (set: TimerSet): boolean => set.timers.length === 0
  const hasAnyIncomplete = (): boolean => sortedSetsValue().some(isIncomplete)

  const totalMinutes = (): number =>
    currentTimers().reduce((sum, t) => sum + t.durationMinutes, 0)

  const defaultLabel = (): string => {
    const id = ws.sounds.state.defaultSoundId
    if (!id) return 'Default · built-in beep'
    const sound = ws.sounds.state.sounds.find((s) => s.id === id)
    return sound ? `Default · ${sound.name}` : 'Default'
  }

  const soundOptions = (): DropdownOption[] => [
    { value: '', label: defaultLabel() },
    ...ws.sounds.state.sounds.map((s) => ({ value: s.id, label: s.name })),
  ]

  const versionChipClass = (id: string): string => {
    const base =
      'inline-flex items-center h-8 px-3 rounded-md border-2 border-border text-xs font-bold tracking-tight cursor-pointer select-none transition-colors'
    return id === currentSet()?.id
      ? `${base} bg-foreground text-secondary-background`
      : `${base} bg-secondary-background text-foreground hover:bg-foreground/5`
  }

  const addSet = (): void => {
    void primeAudio()
    const sets = sortedSetsValue()
    // Seed with an empty steps array — the user must explicitly add at least
    // one step before the modal can close. This is the "needs editing"
    // signal, encoded in data so a remount can't lose it.
    const newSet: TimerSet = {
      id: uid(),
      name: `Version ${sets.length + 1}`,
      order: sets.length,
      autoAdvance: true,
      soundId: null,
      timers: [],
    }
    props.onTimerSetsChange(reindexSets([...sets, newSet]))
    props.onActiveTimerSetIdChange(newSet.id)
  }

  const selectSet = (id: string): void => props.onActiveTimerSetIdChange(id)

  const renameSet = (name: string): void => {
    const set = currentSet()
    if (!set) return
    props.onTimerSetsChange(
      sortedSetsValue().map((s) => (s.id === set.id ? { ...s, name } : s)),
    )
  }

  const toggleAutoAdvance = (value: boolean): void => {
    const set = currentSet()
    if (!set) return
    props.onTimerSetsChange(
      sortedSetsValue().map((s) =>
        s.id === set.id ? { ...s, autoAdvance: value } : s,
      ),
    )
  }

  const updateSetSound = (soundId: string): void => {
    const set = currentSet()
    if (!set) return
    props.onTimerSetsChange(
      sortedSetsValue().map((s) =>
        s.id === set.id ? { ...s, soundId: soundId || null } : s,
      ),
    )
  }

  const deleteSet = (): void => {
    const set = currentSet()
    if (!set) return
    const remaining = reindexSets(
      sortedSetsValue().filter((s) => s.id !== set.id),
    )
    props.onTimerSetsChange(remaining)
    props.onActiveTimerSetIdChange(remaining[0]?.id ?? null)
  }

  const updateSetTimers = (setId: string, timers: TimerSpec[]): void => {
    props.onTimerSetsChange(
      sortedSetsValue().map((s) =>
        s.id === setId ? { ...s, timers: reindexTimers(timers) } : s,
      ),
    )
  }

  const addStep = (): void => {
    void primeAudio()
    const set = currentSet()
    if (!set) return
    const next: TimerSpec = {
      id: uid(),
      durationMinutes: 5,
      order: set.timers.length,
    }
    updateSetTimers(set.id, [...set.timers, next])
  }

  const updateStepDuration = (stepId: string, value: number): void => {
    const set = currentSet()
    if (!set) return
    const safe = Math.max(1, Math.min(180, Math.floor(value)))
    updateSetTimers(
      set.id,
      set.timers.map((t) =>
        t.id === stepId ? { ...t, durationMinutes: safe } : t,
      ),
    )
  }

  const deleteStep = (stepId: string): void => {
    const set = currentSet()
    if (!set) return
    updateSetTimers(
      set.id,
      set.timers.filter((t) => t.id !== stepId),
    )
  }

  const start = (): void => {
    const set = currentSet()
    if (!set || set.timers.length === 0) return
    if (hasAnyIncomplete()) return
    void primeAudio()
    ws.timersRunner.start(props.groupId, props.taskId, set.id)
    props.onClose()
  }

  const handleBackdropClick = (event: MouseEvent): void => {
    if (event.target !== dialogRef) return
    if (hasAnyIncomplete()) return
    props.onClose()
  }

  // Native <dialog> fires `cancel` before `close` on Escape; preventing the
  // default keeps the dialog open. When the modal is blocked, also shift
  // focus to the "Add step" button so a keyboard user gets a clear cue
  // about what to do next — silently swallowing Escape with no feedback
  // would feel broken.
  const handleCancel = (event: Event): void => {
    if (!hasAnyIncomplete()) return
    event.preventDefault()
    queueMicrotask(() => addStepRef?.focus())
  }

  return (
    <dialog
      ref={dialogRef}
      onCancel={handleCancel}
      onClose={() => props.onClose()}
      onClick={handleBackdropClick}
      aria-label="Timer editor"
      // m-auto: restore native <dialog> centering (Tailwind v4 preflight wipes
      // out `margin: auto` from the user-agent dialog style).
      class="m-auto rounded-md border-2 border-border bg-background shadow-brutal p-0 backdrop:bg-foreground/40 max-h-[calc(100vh-2rem)] max-w-[calc(100vw-2rem)]"
    >
      <div class="flex w-96 max-w-[calc(100vw-2rem)] flex-col gap-4 p-4">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold tracking-[0.1em] uppercase text-foreground">
            Timer
          </span>
          <Show when={currentSet()}>
            <Button
              variant="ghost"
              size="icon-sm"
              btnClass="h-7 w-7 text-destructive"
              onClick={deleteSet}
              title="Delete this version"
              aria-label="Delete this version"
            >
              <Trash2 size={16} />
            </Button>
          </Show>
        </div>

        <Show
          when={sortedSetsValue().length > 0}
          fallback={
            <Button size="sm" btnClass="w-full h-10" onClick={addSet}>
              <Plus size={16} />
              Add timer version
            </Button>
          }
        >
          <div class="flex flex-wrap gap-1.5">
            <div class="flex flex-wrap gap-1.5" role="tablist" aria-label="Timer versions">
              <For each={sortedSetsValue()}>{(s) => (
                <button
                  type="button"
                  role="tab"
                  aria-selected={s.id === currentSet()?.id}
                  aria-describedby={isIncomplete(s) ? 'timer-incomplete-hint' : undefined}
                  data-incomplete={isIncomplete(s) ? '' : undefined}
                  class={versionChipClass(s.id)}
                  onClick={() => selectSet(s.id)}
                >
                  <Show when={isIncomplete(s)}>
                    <span class="readout mr-1" aria-hidden="true">·</span>
                  </Show>
                  {s.name}
                </button>
              )}</For>
            </div>
            <Button
              variant="neutral"
              size="icon-sm"
              btnClass="h-8 w-8"
              onClick={addSet}
              title="Add version"
              aria-label="Add timer version"
            >
              <Plus size={16} />
            </Button>
          </div>
        </Show>

        <Show when={currentSet()}>
          {(set) => (
            <>
              <div class="space-y-3">
                <input
                  type="text"
                  value={set().name}
                  onInput={(e) => renameSet(e.currentTarget.value)}
                  placeholder="Version name"
                  aria-label="Version name"
                  autocomplete="off"
                  autocorrect="off"
                  autocapitalize="off"
                  spellcheck={false}
                  class="flex h-10 w-full rounded-md border-2 border-border bg-secondary-background px-3 py-2 text-sm font-bold text-foreground shadow-brutal-sm focus-visible:shadow-brutal transition-shadow"
                />

                <label
                  for="auto-advance-checkbox"
                  class="flex items-center gap-2.5 text-[0.6875rem] font-bold uppercase tracking-[0.1em] text-subtle-foreground cursor-pointer select-none"
                >
                  <input
                    id="auto-advance-checkbox"
                    type="checkbox"
                    checked={set().autoAdvance}
                    onChange={(e) => toggleAutoAdvance(e.currentTarget.checked)}
                    class="h-4 w-4 cursor-pointer"
                  />
                  Auto-advance between steps
                </label>

                <div class="space-y-1.5">
                  <span class="block text-[0.6875rem] font-bold uppercase tracking-[0.1em] text-subtle-foreground">
                    Sound
                  </span>
                  <Dropdown
                    options={soundOptions()}
                    value={set().soundId ?? ''}
                    onValueChange={updateSetSound}
                  />
                </div>
              </div>

              <div class="space-y-2">
                <div class="flex items-center justify-between">
                  <span class="text-[0.6875rem] font-bold uppercase tracking-[0.1em] text-subtle-foreground">
                    Steps
                  </span>
                  <span class="readout text-xs font-semibold text-muted-foreground">
                    {currentTimers().length} · {totalMinutes()} min total
                  </span>
                </div>

                <For each={currentTimers()}>{(step, i) => (
                  <div class="flex items-center gap-2">
                    <span
                      class="readout inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border-2 border-border bg-secondary-background text-sm font-bold shadow-brutal-sm"
                      aria-hidden="true"
                    >
                      {i() + 1}
                    </span>
                    <div class="relative flex-1">
                      <input
                        type="text"
                        inputmode="numeric"
                        maxLength={3}
                        value={String(step.durationMinutes)}
                        onInput={(e) => {
                          const n = parseInt(e.currentTarget.value.replace(/\D/g, ''), 10)
                          if (!Number.isNaN(n)) updateStepDuration(step.id, n)
                        }}
                        aria-label={`Step ${i() + 1} duration in minutes`}
                        class="readout flex h-10 w-full pr-12 rounded-md border-2 border-border bg-secondary-background px-3 py-2 text-sm font-bold text-foreground shadow-brutal-sm focus-visible:shadow-brutal transition-shadow"
                      />
                      <span class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[0.6875rem] font-bold uppercase tracking-[0.1em] text-subtle-foreground">
                        min
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      btnClass={cn('h-8 w-8 text-destructive')}
                      onClick={() => deleteStep(step.id)}
                      title="Remove step"
                      aria-label={`Remove step ${i() + 1}`}
                    >
                      <X size={16} />
                    </Button>
                  </div>
                )}</For>

                <Button
                  ref={addStepRef}
                  variant="neutral"
                  size="sm"
                  btnClass="w-full h-10"
                  onClick={addStep}
                >
                  <Plus size={16} />
                  Add step
                </Button>
              </div>

              <Show when={!hasAnyIncomplete()}>
                <A
                  href="/settings"
                  onClick={() => props.onClose()}
                  class="block text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                >
                  Manage sounds →
                </A>
              </Show>

              <Show when={hasAnyIncomplete()}>
                <p
                  id="timer-incomplete-hint"
                  role="status"
                  class="text-[0.6875rem] font-bold uppercase tracking-[0.1em] text-destructive"
                >
                  Add a step to save
                </p>
              </Show>

              <div class="flex gap-2">
                <Button
                  size="lg"
                  btnClass="flex-1"
                  disabled={!canStart() || hasAnyIncomplete()}
                  onClick={start}
                >
                  <Play size={20} />
                  Start
                </Button>
                <Button
                  variant="neutral"
                  size="lg"
                  btnClass="px-5"
                  disabled={hasAnyIncomplete()}
                  onClick={() => props.onClose()}
                >
                  Done
                </Button>
              </div>
            </>
          )}
        </Show>
      </div>
    </dialog>
  )
}
