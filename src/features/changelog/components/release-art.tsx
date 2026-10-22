type ReleaseArtProps = {
  version: string;
};

const ReleaseArt = ({ version }: ReleaseArtProps) => (
  <div
    aria-hidden="true"
    className="relative isolate flex aspect-[16/7] items-end overflow-hidden rounded-2xl bg-ink p-6"
  >
    <div className="absolute -bottom-24 -left-16 -z-10 size-[340px] rounded-full bg-[radial-gradient(circle_farthest-side,var(--glow),transparent)] opacity-80 blur-2xl" />
    <div className="absolute -top-20 -right-10 -z-10 size-[260px] rounded-full bg-[radial-gradient(circle_farthest-side,#8fb0ff,transparent)] opacity-40 blur-3xl" />
    <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,rgb(255_255_255/0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgb(255_255_255/0.04)_1px,transparent_1px)] bg-[size:32px_32px]" />
    <span className="font-serif text-6xl leading-none tracking-[-0.02em] text-ink-foreground italic sm:text-7xl">
      {version}
    </span>
  </div>
);

export default ReleaseArt;
