import { Show } from 'solid-js'
import { Play, Square, Star, Trash2 } from 'lucide-solid'
import Button from '~/components/Button'
import { cn } from '~/lib/classnames'
import { formatBytes } from './lib/bytes'
import type { SoundMeta } from './types'

/**
 * One row in the sound library. Renders preview (play/stop), name + size,
 * a "DEFAULT" badge when applicable, a star toggle, and a delete button.
 * Stateless — all callbacks come from the parent SettingsPage.
 */

interface Props {
  sound: SoundMeta
  isPlaying: boolean
  isDefault: boolean
  onPreviewToggle: () => void
  onSetDefault: () => void
  onDelete: () => void
}

export default function SoundListItem(props: Props) {
  return (
    <li class="flex items-center gap-3 px-4 py-3">
      <Button
        variant="neutral"
        size="icon-sm"
        onClick={props.onPreviewToggle}
        title={props.isPlaying ? 'Stop preview' : 'Preview sound'}
        aria-label={
          props.isPlaying
            ? `Stop preview of ${props.sound.name}`
            : `Preview ${props.sound.name}`
        }
      >
        <Show when={props.isPlaying} fallback={<Play size={16} />}>
          <Square size={16} />
        </Show>
      </Button>

      <div class="flex-1 min-w-0">
        <p class="font-bold tracking-tight truncate">{props.sound.name}</p>
        <p class="readout text-xs font-medium text-muted-foreground">
          {formatBytes(props.sound.sizeBytes)}
        </p>
      </div>

      <Show when={props.isDefault}>
        <span class="inline-flex items-center gap-1 rounded-md border-2 border-border bg-warning text-warning-foreground px-2 py-1 text-[0.6875rem] font-bold uppercase tracking-[0.08em] shadow-brutal-sm">
          <Star size={14} />
          Default
        </span>
      </Show>

      <Button
        variant={props.isDefault ? 'warning' : 'ghost'}
        size="icon-sm"
        onClick={props.onSetDefault}
        title={props.isDefault ? 'Unset as default' : 'Set as default'}
        aria-label={
          props.isDefault
            ? `Unset ${props.sound.name} as default`
            : `Set ${props.sound.name} as default`
        }
        btnClass={cn(props.isDefault && 'text-warning-foreground')}
      >
        <Star size={16} />
      </Button>

      <Button
        variant="destructive"
        size="icon-sm"
        onClick={props.onDelete}
        title="Delete sound"
        aria-label={`Delete ${props.sound.name}`}
      >
        <Trash2 size={16} />
      </Button>
    </li>
  )
}
