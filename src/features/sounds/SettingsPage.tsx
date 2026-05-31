import { For, Show, createSignal, onCleanup } from 'solid-js'
import { A } from '@solidjs/router'
import { Music, Upload } from 'lucide-solid'
import Button, { buttonClasses } from '~/components/Button'
import { Card } from '~/components/Card'
import { useWorkspace } from '~/state/workspaceContext'
import BackupSection from '~/features/backup/BackupSection'
import SoundListItem from './SoundListItem'

/**
 * Sound library settings page. Lists every uploaded sound, lets the user
 * upload more (audio/* multi-select; non-audio silently skipped), set/clear
 * the default, preview-play, and delete. Preview uses a plain HTMLAudioElement
 * — T12 brings the richer Web Audio playback layer used by alarms and timers.
 */

export default function SettingsPage() {
  const ws = useWorkspace()

  const [playingId, setPlayingId] = createSignal<string | null>(null)
  const [busy, setBusy] = createSignal(false)
  let fileInputRef: HTMLInputElement | undefined
  let currentAudio: HTMLAudioElement | null = null
  let currentObjectUrl: string | null = null

  const stopPreview = (): void => {
    if (currentAudio) {
      currentAudio.pause()
      currentAudio.src = ''
    }
    if (currentObjectUrl) {
      URL.revokeObjectURL(currentObjectUrl)
    }
    currentAudio = null
    currentObjectUrl = null
    setPlayingId(null)
  }

  onCleanup(stopPreview)

  const togglePreview = async (soundId: string): Promise<void> => {
    if (playingId() === soundId) {
      stopPreview()
      return
    }
    stopPreview()
    const blob = await ws.sounds.getBlob(soundId)
    if (!blob) return
    const url = URL.createObjectURL(blob)
    const audio = new Audio(url)
    audio.loop = true
    audio.addEventListener('ended', stopPreview)
    try {
      await audio.play()
      currentAudio = audio
      currentObjectUrl = url
      setPlayingId(soundId)
    } catch {
      URL.revokeObjectURL(url)
    }
  }

  const onUploadClick = (): void => {
    fileInputRef?.click()
  }

  const onFileChange = async (event: Event): Promise<void> => {
    const target = event.target as HTMLInputElement
    const files = Array.from(target.files ?? [])
    target.value = ''
    if (files.length === 0 || busy()) return
    setBusy(true)
    try {
      for (const file of files) {
        if (!file.type.startsWith('audio/')) continue
        await ws.sounds.addSound(file)
      }
    } finally {
      setBusy(false)
    }
  }

  const onSetDefault = (soundId: string): void => {
    const next = ws.sounds.state.defaultSoundId === soundId ? null : soundId
    void ws.sounds.setDefault(next)
  }

  const onDelete = (soundId: string): void => {
    if (playingId() === soundId) stopPreview()
    void ws.sounds.removeSound(soundId)
  }

  return (
    <main class="min-h-screen" aria-label="Sound library">
      <div class="max-w-2xl mx-auto px-5 py-10">
        <header class="mb-8 flex items-end justify-between gap-4">
          <div class="min-w-0 flex-1">
            <p class="text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-subtle-foreground">
              Settings
            </p>
            <h1 class="mt-2 text-4xl sm:text-5xl font-black tracking-tighter text-foreground leading-none">
              Sound library
            </h1>
            <p class="mt-3 text-sm font-medium text-muted-foreground max-w-md">
              Upload sounds and pick a default. The default plays when a task
              has no sound of its own.
            </p>
          </div>
          <A href="/" class={buttonClasses({ variant: 'neutral' })}>
            Back
          </A>
        </header>

        <div class="mb-4 flex items-center justify-between gap-3">
          <span class="readout text-sm font-semibold text-muted-foreground">
            {ws.sounds.state.sounds.length}{' '}
            {ws.sounds.state.sounds.length === 1 ? 'sound' : 'sounds'}
          </span>
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            multiple
            onChange={onFileChange}
            class="hidden"
            data-testid="sound-file-input"
          />
          <Button onClick={onUploadClick} disabled={busy()}>
            <Upload size={16} />
            Add sound
          </Button>
        </div>

        <Show when={ws.sounds.hasSounds()} fallback={<EmptyState />}>
          <Card>
            <ul class="divide-y-2 divide-border" role="list">
              <For each={ws.sounds.state.sounds}>{(sound) => (
                <SoundListItem
                  sound={sound}
                  isPlaying={playingId() === sound.id}
                  isDefault={ws.sounds.state.defaultSoundId === sound.id}
                  onPreviewToggle={() => void togglePreview(sound.id)}
                  onSetDefault={() => onSetDefault(sound.id)}
                  onDelete={() => onDelete(sound.id)}
                />
              )}</For>
            </ul>
          </Card>
        </Show>

        <BackupSection />
      </div>
    </main>
  )
}

function EmptyState() {
  return (
    <div class="text-center rounded-lg border-2 border-dashed border-border/50 bg-secondary-background/40 py-14 px-6">
      <div class="mx-auto mb-5 inline-flex h-14 w-14 items-center justify-center rounded-md border-2 border-border bg-warning shadow-brutal">
        <Music size={28} class="text-warning-foreground" />
      </div>
      <h2 class="text-lg font-bold tracking-tight mb-1">No sounds yet.</h2>
      <p class="text-sm text-muted-foreground font-medium">
        Built-in beep plays until you add one.
      </p>
    </div>
  )
}
