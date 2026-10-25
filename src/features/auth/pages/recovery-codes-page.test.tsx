import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, test, vi } from 'vitest';
import memoryRecoveryCodeSource from '@/features/auth/data_sources/memory/recovery-code-source';
import RecoveryCodesPage from '@/features/auth/pages/recovery-codes-page';
import renderWithToaster from '@/test-support/render-with-toaster';

const routerReplace = vi.hoisted(() => vi.fn());
const stableRouter = vi.hoisted(() => ({ push: vi.fn(), replace: routerReplace }));
vi.mock('next/navigation', () => ({ useRouter: () => stableRouter }));

afterEach(() => routerReplace.mockReset());

const recoveryCodes = ['K7QM-2XRD-9FTB', 'P4VN-8HWC-3JZE', 'T9AR-6KXQ-1MDW'];

test('the codes can be copied, and continuing needs the saved box ticked', async () => {
  memoryRecoveryCodeSource.save(recoveryCodes);
  const user = userEvent.setup();

  renderWithToaster(<RecoveryCodesPage />);
  await user.click(await screen.findByRole('button', { name: 'Copy all' }));
  expect(await navigator.clipboard.readText()).toBe(recoveryCodes.join('\n'));
  const continueButton = screen.getByRole('button', { name: 'Continue to DaiBX' });
  expect(continueButton).toBeDisabled();
  await user.click(screen.getByLabelText('I’ve saved these codes somewhere safe'));
  await user.click(continueButton);

  expect(routerReplace).toHaveBeenCalledWith('/today');
  expect(memoryRecoveryCodeSource.findAll()).toEqual([]);
});

test('after a reload the codes are gone and the page says where to get new ones', async () => {
  memoryRecoveryCodeSource.clear();

  renderWithToaster(<RecoveryCodesPage />);

  expect(
    await screen.findByRole('heading', { name: 'Your codes were already shown' }),
  ).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Continue to DaiBX' })).toHaveAttribute('href', '/today');
});
