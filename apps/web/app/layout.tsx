import './globals.css'
import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { Inter } from 'next/font/google'
import { Navbar } from '@/components/navbar'
import { Providers } from '@/components/providers'

const inter = Inter({ subsets: ['latin'], display: 'swap' })

export const metadata: Metadata = {
  title: {
    default: 'TopPrompt — The Developer Prompt Library',
    template: '%s — TopPrompt',
  },
  description: 'Discover and share the best AI prompts for developers. Community-ranked prompts for Claude, GPT-4o, and more.',
  metadataBase: new URL('https://topprompt.io'),
  openGraph: {
    siteName: 'TopPrompt',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
  },
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={inter.className}>
      <body className="bg-zinc-950 text-white">
        <Providers>
          <Navbar />
          {children}
        </Providers>
      </body>
    </html>
  )
}
