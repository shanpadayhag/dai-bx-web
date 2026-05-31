import { describe, it, expect } from 'vitest'
import { base64ToBytes, blobToBase64 } from './base64'

const bytesToBlob = (bytes: Uint8Array): Blob => {
  // Copy into an ArrayBuffer-backed array so it satisfies BlobPart under TS 6.
  const copy = new Uint8Array(new ArrayBuffer(bytes.length))
  copy.set(bytes)
  return new Blob([copy])
}

describe('base64 round-trip', () => {
  it('round-trips an empty blob', async () => {
    const b64 = await blobToBase64(new Blob([]))
    expect(b64).toBe('')
    expect(base64ToBytes(b64)).toEqual(new Uint8Array(0))
  })

  it('round-trips small binary content', async () => {
    const bytes = new Uint8Array([0, 1, 2, 254, 255, 128, 64])
    const b64 = await blobToBase64(bytesToBlob(bytes))
    expect(base64ToBytes(b64)).toEqual(bytes)
  })

  it('round-trips large content without overflowing the call stack', async () => {
    // 512 KB far exceeds the ~128k argument limit that makes a naive
    // btoa(String.fromCharCode(...all)) overflow, so it proves chunking works
    // while staying fast under full-suite CPU load.
    const size = 512 * 1024
    const bytes = new Uint8Array(size)
    for (let i = 0; i < size; i += 1) bytes[i] = i % 256

    const b64 = await blobToBase64(bytesToBlob(bytes))
    const decoded = base64ToBytes(b64)

    expect(decoded.length).toBe(size)
    expect(Array.from(decoded)).toEqual(Array.from(bytes))
  }, 20000)

  it('produces standard base64 a downstream atob accepts', async () => {
    const bytes = new TextEncoder().encode('hello world')
    const b64 = await blobToBase64(bytesToBlob(bytes))
    expect(b64).toBe(btoa('hello world'))
  })
})
