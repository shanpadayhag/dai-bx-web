const base64UrlToBytes = (base64UrlText: string): Uint8Array<ArrayBuffer> => {
  const paddedText = base64UrlText
    .replaceAll('-', '+')
    .replaceAll('_', '/')
    .padEnd(Math.ceil(base64UrlText.length / 4) * 4, '=');
  const binaryText = atob(paddedText);
  const decodedBytes = new Uint8Array(new ArrayBuffer(binaryText.length));
  for (let byteIndex = 0; byteIndex < binaryText.length; byteIndex += 1) {
    decodedBytes[byteIndex] = binaryText.charCodeAt(byteIndex);
  }
  return decodedBytes;
};

export default base64UrlToBytes;
