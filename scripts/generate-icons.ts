import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { Resvg } from '@resvg/resvg-js';
import {
  BRAND_COLOR,
  MARK_TILE_CORNER_RADIUS,
  MARK_VIEWBOX_SIZE,
  markShapesSvg,
  markSvg,
} from '../src/core/brand/mark.ts';
import { encodeIcoFile } from './ico-file.ts';

const PREVIEW_WIDTH = 1200;
const PREVIEW_HEIGHT = 630;
const PREVIEW_BACKGROUND_COLOR = '#ffffff';
const PREVIEW_TITLE_COLOR = '#0c1324';
const PREVIEW_TAGLINE_COLOR = '#566079';
const PREVIEW_ALT_TEXT =
  'The DaiBX mark beside the name DaiBX and the line: tasks, board and calendar in one place.';
const MANIFEST_BACKGROUND_COLOR = '#ffffff';

const appDirectoryPath = fileURLToPath(new URL('../src/app/', import.meta.url));
const iconsDirectoryPath = fileURLToPath(new URL('../public/icons/', import.meta.url));
const publicDirectoryPath = fileURLToPath(new URL('../public/', import.meta.url));
const geistFontDirectoryPath = fileURLToPath(
  new URL('../node_modules/geist/dist/fonts/geist-sans/', import.meta.url),
);

const roundedMarkSvg = markSvg({
  tileColor: BRAND_COLOR,
  tileCornerRadius: MARK_TILE_CORNER_RADIUS,
});
const fullBleedMarkSvg = markSvg({ tileColor: BRAND_COLOR, tileCornerRadius: 0 });

const renderPng = (svgText: string, pixelWidth: number): Uint8Array =>
  new Resvg(svgText, {
    fitTo: { mode: 'width', value: pixelWidth },
    font: {
      loadSystemFonts: false,
      fontFiles: [
        `${geistFontDirectoryPath}Geist-Regular.ttf`,
        `${geistFontDirectoryPath}Geist-SemiBold.ttf`,
      ],
      defaultFontFamily: 'Geist',
    },
  })
    .render()
    .asPng();

const previewSvg = () => {
  const previewMarkPixelSize = 128;
  const previewMarkScale = previewMarkPixelSize / MARK_VIEWBOX_SIZE;
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${PREVIEW_WIDTH}" height="${PREVIEW_HEIGHT}" viewBox="0 0 ${PREVIEW_WIDTH} ${PREVIEW_HEIGHT}">`,
    `<rect width="${PREVIEW_WIDTH}" height="${PREVIEW_HEIGHT}" fill="${PREVIEW_BACKGROUND_COLOR}"/>`,
    `<g transform="translate(96 168) scale(${previewMarkScale})">${markShapesSvg({ tileColor: BRAND_COLOR, tileCornerRadius: MARK_TILE_CORNER_RADIUS })}</g>`,
    `<text x="256" y="270" font-family="Geist" font-size="112" font-weight="600" letter-spacing="-3" fill="${PREVIEW_TITLE_COLOR}">DaiBX</text>`,
    `<text x="96" y="420" font-family="Geist" font-size="48" fill="${PREVIEW_TAGLINE_COLOR}">Tasks, board and calendar in one place.</text>`,
    `<text x="96" y="530" font-family="Geist" font-size="30" font-weight="600" fill="${BRAND_COLOR}">dai-bx.vercel.app</text>`,
    '</svg>',
  ].join('');
};

const webManifest = {
  name: 'DaiBX',
  short_name: 'DaiBX',
  description: 'Tasks, board and calendar in one place.',
  start_url: '/tasks',
  display: 'standalone',
  theme_color: BRAND_COLOR,
  background_color: MANIFEST_BACKGROUND_COLOR,
  icons: [
    { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
    { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    {
      src: '/icons/icon-maskable-512.png',
      sizes: '512x512',
      type: 'image/png',
      purpose: 'maskable',
    },
  ],
};

const generateIcons = async () => {
  await mkdir(iconsDirectoryPath, { recursive: true });
  const previewPngBytes = renderPng(previewSvg(), PREVIEW_WIDTH);

  await Promise.all([
    writeFile(`${appDirectoryPath}icon.svg`, roundedMarkSvg),
    writeFile(
      `${appDirectoryPath}favicon.ico`,
      encodeIcoFile([
        { pixelSize: 16, pngBytes: renderPng(roundedMarkSvg, 16) },
        { pixelSize: 32, pngBytes: renderPng(roundedMarkSvg, 32) },
      ]),
    ),
    writeFile(`${appDirectoryPath}apple-icon.png`, renderPng(fullBleedMarkSvg, 180)),
    writeFile(`${iconsDirectoryPath}icon-192.png`, renderPng(roundedMarkSvg, 192)),
    writeFile(`${iconsDirectoryPath}icon-512.png`, renderPng(roundedMarkSvg, 512)),
    writeFile(`${iconsDirectoryPath}icon-maskable-512.png`, renderPng(fullBleedMarkSvg, 512)),
    writeFile(
      `${publicDirectoryPath}manifest.webmanifest`,
      `${JSON.stringify(webManifest, null, 2)}\n`,
    ),
    writeFile(`${appDirectoryPath}opengraph-image.png`, previewPngBytes),
    writeFile(`${appDirectoryPath}opengraph-image.alt.txt`, PREVIEW_ALT_TEXT),
    writeFile(`${appDirectoryPath}twitter-image.png`, previewPngBytes),
    writeFile(`${appDirectoryPath}twitter-image.alt.txt`, PREVIEW_ALT_TEXT),
  ]);
};

await generateIcons();
