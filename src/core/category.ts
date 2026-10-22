import type { CSSProperties } from 'react';

type Category = {
  id: string;
  name: string;
  color: string;
};

const inkColor = '#0c1324';
const whiteColor = '#ffffff';

const relativeLuminance = (hexColor: string): number => {
  const channels = [1, 3, 5].map(
    (offset) => parseInt(hexColor.slice(offset, offset + 2), 16) / 255,
  );
  const [red = 0, green = 0, blue = 0] = channels.map((channel) =>
    channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
  );
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
};

const contrastRatio = (firstColor: string, secondColor: string): number => {
  const [lighter, darker] = [relativeLuminance(firstColor), relativeLuminance(secondColor)].sort(
    (first, second) => second - first,
  );
  return ((lighter ?? 0) + 0.05) / ((darker ?? 0) + 0.05);
};

const readableTextColor = (backgroundColor: string): string =>
  contrastRatio(backgroundColor, whiteColor) > contrastRatio(backgroundColor, inkColor)
    ? whiteColor
    : inkColor;

const categoryColorStyle = (category: Category): CSSProperties =>
  ({
    '--category': category.color,
    '--category-foreground': readableTextColor(category.color),
  }) as CSSProperties;

export type { Category };
export { categoryColorStyle, readableTextColor };
