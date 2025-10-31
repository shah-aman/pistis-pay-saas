import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Manrope } from 'next/font/google';
import { SWRConfig } from 'swr';
import { SolanaWalletProvider } from '@/components/providers/solana-wallet-provider';

export const metadata: Metadata = {
  title: 'SolaPay - Solana Payment Platform',
  description: 'Accept Solana USDC payments with ease.'
};

export const viewport: Viewport = {
  maximumScale: 1
};

const manrope = Manrope({ subsets: ['latin'] });

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`bg-white dark:bg-gray-950 text-black dark:text-white ${manrope.className}`}
    >
      <body className="min-h-[100dvh] bg-gray-50">
        <SolanaWalletProvider>
          <SWRConfig
            value={{
              fallback: {}
            }}
          >
            {children}
          </SWRConfig>
        </SolanaWalletProvider>
      </body>
    </html>
  );
}
