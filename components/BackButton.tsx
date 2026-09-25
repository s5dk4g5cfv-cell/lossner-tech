'use client'

import { usePathname, useRouter } from 'next/navigation'

const SECTION_CONFIG = {
  experience: { menu: '/experience', label: 'EXPERIENCE' },
  skills: { menu: '/skills', label: 'SKILLS' },
  skill: { menu: '/skills', label: 'SKILL' },
  projects: { menu: '/projects', label: 'PROJECTS' },
  project: { menu: '/projects', label: 'PROJECT' },
  education: { menu: '/education', label: 'EDUCATION' },
  journal: { menu: '/journal', label: 'OBSERVATIONS' },
  about: { menu: '/about', label: 'ABOUT' }
} as const

type Section = keyof typeof SECTION_CONFIG

interface BackButtonProps {
  onBack?: () => void
  label?: string
  href?: string
}

export default function BackButton({ onBack, label: overrideLabel, href: overrideHref }: BackButtonProps) {
  const pathname = usePathname()
  const router = useRouter()

  // Hide the button only on the home page when no custom back handler is supplied
  if (pathname === '/' && !onBack && !overrideLabel) return null

  const segments = pathname.split('/').filter(Boolean)
  const section = segments[0] as Section | undefined
  const depth = segments.length

  let label = overrideLabel ?? 'BACK TO MENU'
  let href = overrideHref ?? '/'

  if (!overrideLabel && section && SECTION_CONFIG[section]) {
    const { menu, label: sectionLabel } = SECTION_CONFIG[section]
    if (depth > 1) {
      label = `BACK TO ${sectionLabel} MENU`
      href = menu
    }
  }

  const handleClick = () => {
    if (onBack) {
      onBack()
    } else {
      router.push(href)
    }
  }

  const displayLabel = (
    <>
      <span className="underline">{label.charAt(0)}</span>
      {label.slice(1)}
    </>
  )

  return (
    <button
      onClick={handleClick}
      aria-label={label}
      title={label}
      className="px-4 py-1 border border-terminal-green bg-black text-terminal-green hover:bg-terminal-green hover:text-black transition-all duration-200 font-mono text-sm"
    >
      {displayLabel}
    </button>
  )
}

