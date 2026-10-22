import type { ReactNode } from 'react';

type SectionHeadingProps = {
  title: ReactNode;
  description: string;
  align?: 'center' | 'start';
};

const SectionHeading = ({ title, description, align = 'center' }: SectionHeadingProps) => (
  <div
    className={
      align === 'center'
        ? 'mx-auto grid max-w-2xl justify-items-center gap-4 text-center'
        : 'grid max-w-xl gap-4'
    }
  >
    <h2 className="text-4xl leading-[1.05] font-medium tracking-[-0.035em] text-foreground sm:text-5xl">
      {title}
    </h2>
    <p className="max-w-[56ch] text-base text-muted-foreground sm:text-[17px]">{description}</p>
  </div>
);

export default SectionHeading;
