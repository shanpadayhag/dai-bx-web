import Button from '@/core/components/atoms/button';
import Logo from '@/core/components/atoms/logo';

const NotFound = () => (
  <div className="grid min-h-dvh place-content-center justify-items-center gap-6 px-4 text-center">
    <Logo />
    <div className="grid gap-2">
      <h1 className="text-3xl font-medium tracking-[-0.03em] text-foreground">
        This page isn’t here
      </h1>
      <p className="text-muted-foreground">The link may be old, or the page moved.</p>
    </div>
    <Button href="/">Back to the home page</Button>
  </div>
);

export default NotFound;
