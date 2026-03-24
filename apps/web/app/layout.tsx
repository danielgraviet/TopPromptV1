import './globals.css'
import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { Navbar } from '@/components/navbar'
import { Providers } from '@/components/providers'

export const metadata: Metadata = {
  title: {
    default: 'TopPrompt — Prompt Files For AI Coding Tools',
    template: '%s — TopPrompt',
  },
  description:
    'Discover and upvote setup prompts for agents.md, claude.md, and other system-level prompt files.',
  metadataBase: new URL('https://topprompt.io'),
  openGraph: {
    siteName: 'TopPrompt',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
  },
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-zinc-950 text-white">
        <Providers>
          <Navbar />
          {children}
        </Providers>
      </body>
    </html>
  )
}
