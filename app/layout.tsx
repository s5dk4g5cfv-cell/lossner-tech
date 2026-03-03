import './globals.css'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata = {
  title: 'Joshua Lossner - Software Engineer',
  description: 'Professional portfolio and resume for Joshua Lossner',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        {children}
        {/* Vercel Web Analytics: see requests to /_vercel/insights/view after deploy */}
        <Analytics />
      </body>
    </html>
  )
}
