import { describe, expect, test } from 'vitest';
import { encodeIcoFile } from './ico-file.ts';

const readUint16 = (bytes: Uint8Array, offset: number) =>
  new DataView(bytes.buffer, bytes.byteOffset).getUint16(offset, true);
const readUint32 = (bytes: Uint8Array, offset: number) =>
  new DataView(bytes.buffer, bytes.byteOffset).getUint32(offset, true);

describe('encodeIcoFile', () => {
  const smallPngBytes = new Uint8Array([1, 2, 3]);
  const largePngBytes = new Uint8Array([4, 5, 6, 7, 8]);
  const icoBytes = encodeIcoFile([
    { pixelSize: 16, pngBytes: smallPngBytes },
    { pixelSize: 32, pngBytes: largePngBytes },
  ]);

  test('starts with an icon header counting every image', () => {
    expect(readUint16(icoBytes, 0)).toBe(0);
    expect(readUint16(icoBytes, 2)).toBe(1);
    expect(readUint16(icoBytes, 4)).toBe(2);
  });

  test('describes each image in a 16-byte directory entry', () => {
    const firstEntryOffset = 6;
    const secondEntryOffset = 22;

    expect(icoBytes[firstEntryOffset]).toBe(16);
    expect(icoBytes[firstEntryOffset + 1]).toBe(16);
    expect(readUint16(icoBytes, firstEntryOffset + 4)).toBe(1);
    expect(readUint16(icoBytes, firstEntryOffset + 6)).toBe(32);
    expect(readUint32(icoBytes, firstEntryOffset + 8)).toBe(smallPngBytes.length);
    expect(readUint32(icoBytes, firstEntryOffset + 12)).toBe(38);

    expect(icoBytes[secondEntryOffset]).toBe(32);
    expect(readUint32(icoBytes, secondEntryOffset + 8)).toBe(largePngBytes.length);
    expect(readUint32(icoBytes, secondEntryOffset + 12)).toBe(38 + smallPngBytes.length);
  });

  test('appends the png bytes in directory order', () => {
    expect([...icoBytes.slice(38)]).toEqual([...smallPngBytes, ...largePngBytes]);
  });

  test('writes 0 for a 256-pixel image, as the format requires', () => {
    const largestIcoBytes = encodeIcoFile([{ pixelSize: 256, pngBytes: smallPngBytes }]);

    expect(largestIcoBytes[6]).toBe(0);
    expect(largestIcoBytes[7]).toBe(0);
  });
});
