type MarkBar = {
  x: number;
  y: number;
  width: number;
  opacity: number;
};

type MarkStyle = {
  tileColor: string;
  tileCornerRadius: number;
};

export const BRAND_COLOR = '#2456f0';
export const MARK_VIEWBOX_SIZE = 28;
export const MARK_TILE_CORNER_RADIUS = 8;
export const MARK_BAR_HEIGHT = 3;
export const MARK_BAR_CORNER_RADIUS = 1.5;
export const MARK_BAR_COLOR = '#ffffff';

export const markBars: readonly MarkBar[] = [
  { x: 7, y: 7.5, width: 9, opacity: 1 },
  { x: 11, y: 12.5, width: 10, opacity: 0.75 },
  { x: 11, y: 17.5, width: 6, opacity: 0.5 },
];

const markBarSvg = (markBar: MarkBar) =>
  `<rect x="${markBar.x}" y="${markBar.y}" width="${markBar.width}" height="${MARK_BAR_HEIGHT}" rx="${MARK_BAR_CORNER_RADIUS}" fill="${MARK_BAR_COLOR}" fill-opacity="${markBar.opacity}"/>`;

export const markShapesSvg = ({ tileColor, tileCornerRadius }: MarkStyle) =>
  [
    `<rect width="${MARK_VIEWBOX_SIZE}" height="${MARK_VIEWBOX_SIZE}" rx="${tileCornerRadius}" fill="${tileColor}"/>`,
    ...markBars.map(markBarSvg),
  ].join('');

export const markSvg = (markStyle: MarkStyle) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${MARK_VIEWBOX_SIZE} ${MARK_VIEWBOX_SIZE}">${markShapesSvg(markStyle)}</svg>\n`;
