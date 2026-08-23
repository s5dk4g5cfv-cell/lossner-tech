import './globals.css'
import type { Metadata } from 'next'
import { headers } from 'next/headers'

const title = 'Joshua Lossner // Personal Data System'
const description = 'The portfolio and field notes of DevOps engineer and automation builder Joshua Lossner.'

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers()
  const host = (requestHeaders.get('x-forwarded-host') ?? requestHeaders.get('host') ?? 'lossner.tech')
    .split(',')[0]
    .trim()
  const forwardedProtocol = requestHeaders.get('x-forwarded-proto')?.split(',')[0].trim()
  const protocol = forwardedProtocol ?? (host.startsWith('localhost') ? 'http' : 'https')
  const origin = `${protocol}://${host}`
  const socialImage = `${origin}/og.png`

  return {
    title,
    description,
    openGraph: {
      type: 'website',
      url: origin,
      title,
      description,
      images: [{ url: socialImage, width: 1731, height: 909, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [socialImage],
    },
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  )
}
