import ClosingCallToAction from '@/features/landing/components/closing-call-to-action';
import LandingHero from '@/features/landing/components/landing-hero';
import OpenSourceSection from '@/features/landing/components/open-source-section';
import ProductViewsSection from '@/features/landing/components/product-views-section';
import TimeTrackingSection from '@/features/landing/components/time-tracking-section';
import WorkflowsSection from '@/features/landing/components/workflows-section';

const LandingPage = () => (
  <>
    <LandingHero />
    <ProductViewsSection />
    <TimeTrackingSection />
    <WorkflowsSection />
    <OpenSourceSection />
    <ClosingCallToAction />
  </>
);

export default LandingPage;
