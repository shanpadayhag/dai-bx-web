type IcoImage = {
  pixelSize: number;
  pngBytes: Uint8Array;
};

const ICO_HEADER_BYTE_COUNT = 6;
const ICO_DIRECTORY_ENTRY_BYTE_COUNT = 16;
const ICO_TYPE_ICON = 1;
const ICO_COLOR_PLANE_COUNT = 1;
const ICO_BITS_PER_PIXEL = 32;
const ICO_LARGEST_PIXEL_SIZE = 256;

const directoryPixelSize = (pixelSize: number) =>
  pixelSize === ICO_LARGEST_PIXEL_SIZE ? 0 : pixelSize;

export const encodeIcoFile = (icoImages: readonly IcoImage[]): Uint8Array => {
  const directoryByteCount =
    ICO_HEADER_BYTE_COUNT + ICO_DIRECTORY_ENTRY_BYTE_COUNT * icoImages.length;
  const totalPngByteCount = icoImages.reduce(
    (byteCount, icoImage) => byteCount + icoImage.pngBytes.length,
    0,
  );
  const icoBytes = new Uint8Array(directoryByteCount + totalPngByteCount);
  const icoView = new DataView(icoBytes.buffer);

  icoView.setUint16(2, ICO_TYPE_ICON, true);
  icoView.setUint16(4, icoImages.length, true);

  let nextPngOffset = directoryByteCount;
  icoImages.forEach((icoImage, imageIndex) => {
    const entryOffset = ICO_HEADER_BYTE_COUNT + ICO_DIRECTORY_ENTRY_BYTE_COUNT * imageIndex;
    icoView.setUint8(entryOffset, directoryPixelSize(icoImage.pixelSize));
    icoView.setUint8(entryOffset + 1, directoryPixelSize(icoImage.pixelSize));
    icoView.setUint16(entryOffset + 4, ICO_COLOR_PLANE_COUNT, true);
    icoView.setUint16(entryOffset + 6, ICO_BITS_PER_PIXEL, true);
    icoView.setUint32(entryOffset + 8, icoImage.pngBytes.length, true);
    icoView.setUint32(entryOffset + 12, nextPngOffset, true);
    icoBytes.set(icoImage.pngBytes, nextPngOffset);
    nextPngOffset += icoImage.pngBytes.length;
  });

  return icoBytes;
};
