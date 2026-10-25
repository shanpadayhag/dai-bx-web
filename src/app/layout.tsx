import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono, Instrument_Serif } from 'next/font/google';
import type { ReactNode } from 'react';
import { Toaster } from 'sonner';
import { APPEARANCE_BOOT_SCRIPT } from '@/core/appearance';
import '@/core/styles/globals.css';

const geistSans = Geist({ subsets: ['latin'], variable: '--font-geist-sans' });
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono' });
const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--font-instrument-serif',
});

export const metadata: Metadata = {
  title: { default: 'DaiBX — tasks, board and calendar in one place', template: '%s · DaiBX' },
  description:
    'An open-source workspace where nested tasks, a board and a calendar share one source of truth. Start a task and your calendar records it.',
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#080c18' },
  ],
};

const RootLayout = ({ children }: { children: ReactNode }) => (
  <html
    lang="en"
    className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable}`}
    suppressHydrationWarning
  >
    <head>
      <script dangerouslySetInnerHTML={{ __html: APPEARANCE_BOOT_SCRIPT }} />
    </head>
    <body className="min-h-dvh">
      {children}
      <Toaster theme="system" position="bottom-right" closeButton />
    </body>
  </html>
);

export default RootLayout;
