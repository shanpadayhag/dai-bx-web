/**
 * Sounds + preferences store factory. Ported from
 *   client-web-old/src/app/features/sounds/data-access/sounds.state.ts
 *
 * Combines two persistence concerns into one in-memory store:
 *   - the uploaded sound list (`SoundMeta[]`)
 *   - the global preferences record's `defaultSoundId`
 *
 * Deleting the current default sound automatically clears the default.
 * Audio playback itself is not handled here — the settings page wires its
 * own `<audio>` element for preview; T12 will provide a richer playback lib
 * for alarms/timers.
 */

import { createStore } from 'solid-js/store'
import { uid } from '~/lib/ids'
import * as soundsRepo from './repository'
import * as prefsRepo from '~/features/preferences/repository'
import type { SoundMeta } from './types'

const stripExtension = (filename: string): string => {
  const dot = filename.lastIndexOf('.')
  return dot > 0 ? filename.slice(0, dot) : filename
}

export interface SoundsState {
  sounds: SoundMeta[]
  defaultSoundId: string | null
  loaded: boolean
}

export interface SoundsStore {
  state: SoundsState
  hasSounds: () => boolean
  load: () => Promise<void>
  addSound: (file: File) => Promise<SoundMeta | null>
  removeSound: (id: string) => Promise<void>
  setDefault: (soundId: string | null) => Promise<void>
  getBlob: (id: string) => Promise<Blob | null>
}

export function createSoundsStore(): SoundsStore {
  const [state, setState] = createStore<SoundsState>({
    sounds: [],
    defaultSoundId: null,
    loaded: false,
  })

  const hasSounds = (): boolean => state.sounds.length > 0

  const load = async (): Promise<void> => {
    const [sounds, prefs] = await Promise.all([
      soundsRepo.listSoundMeta(),
      prefsRepo.getPreferences(),
    ])
    setState({ sounds, defaultSoundId: prefs.defaultSoundId, loaded: true })
  }

  const addSound = async (file: File): Promise<SoundMeta | null> => {
    if (!file.type.startsWith('audio/')) return null
    const id = uid()
    const meta: SoundMeta = {
      id,
      name: stripExtension(file.name).trim() || 'Sound',
      contentType: file.type || 'application/octet-stream',
      sizeBytes: file.size,
      createdAt: new Date().toISOString(),
    }
    await soundsRepo.putSound({ ...meta, blob: file })
    setState('sounds', (rows) => [...rows, meta])
    return meta
  }

  const setDefault = async (soundId: string | null): Promise<void> => {
    await prefsRepo.setDefaultSoundId(soundId)
    setState('defaultSoundId', soundId)
  }

  const removeSound = async (id: string): Promise<void> => {
    await soundsRepo.deleteSound(id)
    setState('sounds', state.sounds.filter((s) => s.id !== id))
    if (state.defaultSoundId === id) {
      await setDefault(null)
    }
  }

  const getBlob = (id: string): Promise<Blob | null> =>
    soundsRepo.getSoundBlob(id)

  return {
    state,
    hasSounds,
    load,
    addSound,
    removeSound,
    setDefault,
    getBlob,
  }
}
