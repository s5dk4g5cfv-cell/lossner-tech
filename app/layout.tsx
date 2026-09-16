import './globals.css'
import { Fraunces, IBM_Plex_Sans, JetBrains_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'

const fraunces = Fraunces({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-fraunces',
})

const ibmPlex = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  display: 'swap',
  variable: '--font-ibm-plex',
})

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  display: 'swap',
  variable: '--font-jetbrains',
})

export const metadata = {
  title: 'Joshua Lossner | IT, Release Management & DevOps',
  description: 'IT professional and practical toolsmith. Joshua Lossner connects systems, improves release processes, and helps teams work through automation, DevOps, and AI-assisted tooling.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${fraunces.variable} ${ibmPlex.variable} ${jetbrains.variable}`}>
      <body>
        {children}
        {/* Vercel Web Analytics: see requests to /_vercel/insights/view after deploy */}
        <Analytics />
      </body>
    </html>
  )
}
