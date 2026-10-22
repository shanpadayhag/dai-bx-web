import type { ReactNode } from 'react';
import MarketingFooter from '@/core/components/organisms/marketing-footer';
import MarketingNav from '@/core/components/organisms/marketing-nav';

const MarketingLayout = ({ children }: { children: ReactNode }) => (
  <>
    <MarketingNav />
    <main>{children}</main>
    <MarketingFooter />
  </>
);

export default MarketingLayout;
