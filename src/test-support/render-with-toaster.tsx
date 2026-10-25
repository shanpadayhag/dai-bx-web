import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { Toaster } from 'sonner';

const renderWithToaster = (pageElement: ReactElement) =>
  render(
    <>
      {pageElement}
      <Toaster />
    </>,
  );

export default renderWithToaster;
