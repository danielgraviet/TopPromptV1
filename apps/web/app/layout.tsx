import './globals.css'
import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { Navbar } from '@/components/navbar'

export const metadata: Metadata = {
  title: 'TopPrompt',
  description: 'Prompt discovery platform for developers'
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-zinc-950 text-white">
        <Navbar />
        {children}
      </body>
    </html>
  )
}
