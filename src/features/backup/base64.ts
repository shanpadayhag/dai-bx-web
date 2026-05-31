/**
 * Base64 codec for carrying binary blob data inside a JSON backup.
 *
 * `btoa(String.fromCharCode(...bytes))` overflows the call stack on large
 * inputs (the spread passes every byte as an argument), so encoding walks the
 * buffer in fixed-size chunks. Decoding is the symmetric inverse.
 */

/** Chunk size for `btoa`. 32 KB stays well under the argument-count limit. */
const CHUNK_SIZE = 0x8000

/** Encode a Blob's bytes as a base64 string (chunked to avoid stack overflow). */
export const blobToBase64 = async (blob: Blob): Promise<string> => {
  const bytes = new Uint8Array(await blob.arrayBuffer())
  let binary = ''
  for (let offset = 0; offset < bytes.length; offset += CHUNK_SIZE) {
    const chunk = bytes.subarray(offset, offset + CHUNK_SIZE)
    binary += String.fromCharCode(...chunk)
  }
  return btoa(binary)
}

/**
 * Decode a base64 string back into the original bytes. Backed by an explicit
 * `ArrayBuffer` (not `SharedArrayBuffer`) so the result is a valid `BlobPart`.
 */
export const base64ToBytes = (base64: string): Uint8Array<ArrayBuffer> => {
  const binary = atob(base64)
  const bytes = new Uint8Array(new ArrayBuffer(binary.length))
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}
