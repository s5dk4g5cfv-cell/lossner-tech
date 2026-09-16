'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import dynamic from 'next/dynamic'
import VideoEmbed from './VideoEmbed'

const JoshuaTerminal = dynamic(() => import('./JoshuaTerminal'), { ssr: false })

const FEATURED_VIDEO = { id: 'wH0ac0I13mI', title: 'CORA — a walkthrough' }

type MessageRole = 'system' | 'user' | 'ai'

type Message = {
  id: string
  role: MessageRole
  content: string
  heading?: string
  title?: string
  isMarkdown?: boolean
  meta?: string
  videoId?: string
  videoTitle?: string
}

type ContentItem = {
  id: string
  title: string
  filename: string
  metadata?: Record<string, any>
}

type SectionDefinition = {
  id: string
  label: string
  directory?: string
  action?: 'contact' | 'download' | 'about'
}

type SectionState = SectionDefinition & {
  items: ContentItem[]
  loading: boolean
  error?: string
}

const SECTION_DEFINITIONS: SectionDefinition[] = [
  { id: 'experience', label: 'Experience', directory: 'Experience' },
  { id: 'skills', label: 'Skills', directory: 'Skills' },
  { id: 'projects', label: 'Projects', directory: 'Projects' },
  { id: 'education', label: 'Education', directory: 'Education' },
  { id: 'journal', label: 'Journal', directory: 'Journal' },
  { id: 'about', label: 'About', directory: 'About', action: 'about' },
  { id: 'contact', label: 'Contact', action: 'contact' },
]

const NAV_CODES: Record<string, string> = {
  experience: '01',
  skills: '02',
  projects: '03',
  education: '04',
  journal: '05',
  about: '06',
  contact: '07',
}

const INITIAL_SELECTED_SECTION_ID = SECTION_DEFINITIONS.find(section => section.directory)?.id ?? SECTION_DEFINITIONS[0]?.id ?? null
const JOSHUA_TRIGGER = /^hello[\s,]+joshua[.!?]?$/i

const createId = () => Math.random().toString(36).slice(2) + Date.now().toString(36)

const stripLeadingMeta = (content: string) => {
  // Strip the heading line (## Title)
  let result = content.replace(/^#{1,3}\s+[^\n]+\n/, '')
  // Strip bold/italic metadata lines (company, dates) and trailing blank line
  // that sit between the heading and the real content
  result = result.replace(/^(\s*\*{1,3}[^\n]*?\*{1,3}\s*\n)+\s*\n?/, '')
  return result
}

const sortItemsForSection = (sectionId: string, items: ContentItem[]) => {
  if (sectionId === 'experience') {
    return [...items].sort((a, b) => b.filename.localeCompare(a.filename))
  }
  if (sectionId === 'projects') {
    return [...items].sort((a, b) => b.filename.localeCompare(a.filename))
  }
  return items
}

const MenuIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
    <path d="M4 6h16" />
    <path d="M4 12h16" />
    <path d="M4 18h16" />
  </svg>
)

const CloseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
)

const TerminalResume = () => {
  const [sections, setSections] = useState<SectionState[]>(() =>
    SECTION_DEFINITIONS.map(section => ({
      ...section,
      items: [],
      loading: false,
    }))
  )
  const [selectedSectionId, setSelectedSectionId] = useState<SectionDefinition['id'] | null>(INITIAL_SELECTED_SECTION_ID)
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [currentInput, setCurrentInput] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [isJoshuaTerminalOpen, setIsJoshuaTerminalOpen] = useState(false)
  const [audioEnabled, setAudioEnabled] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const chatScrollRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMessages([{
      id: createId(),
      role: 'system',
      heading: 'Welcome',
      content: 'I’m an IT professional with a background in release management and DevOps. I connect systems, automate repeatable work, and build practical tools that help people deliver with confidence.',
    }])
  }, [])

  // Adjust layout height for iOS virtual keyboard and dynamic viewport
  useEffect(() => {
    const viewport = window.visualViewport
    if (!viewport) return

    const updateHeight = () => {
      if (rootRef.current) {
        rootRef.current.style.height = `${viewport.height}px`
      }
    }

    viewport.addEventListener('resize', updateHeight)
    viewport.addEventListener('scroll', updateHeight)
    updateHeight()

    return () => {
      viewport.removeEventListener('resize', updateHeight)
      viewport.removeEventListener('scroll', updateHeight)
    }
  }, [])

  const [autoScrollMessageId, setAutoScrollMessageId] = useState<string | null>(null)

  const appendMessage = (message: Message) => {
    setMessages(prev => [...prev, message])
    if (message.role !== 'user') {
      setAutoScrollMessageId(message.id)
    }
  }

  const replaceMessage = useCallback((id: string, updater: (message: Message) => Message) => {
    setMessages(prev => prev.map(message => (message.id === id ? updater(message) : message)))
    setAutoScrollMessageId(id)
  }, [setMessages])

  const updateSection = useCallback((sectionId: string, updater: (section: SectionState) => SectionState) => {
    setSections(prev => prev.map(section => (section.id === sectionId ? updater(section) : section)))
  }, [setSections])

  const selectedSection = useMemo(
    () => sections.find(section => section.id === selectedSectionId) ?? null,
    [sections, selectedSectionId]
  )

  useEffect(() => {
    if (!autoScrollMessageId) {
      return
    }

    const scrollToMessage = () => {
      const target = document.querySelector<HTMLElement>(`[data-message-id="${autoScrollMessageId}"]`)
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }

    const id = requestAnimationFrame(scrollToMessage)
    return () => cancelAnimationFrame(id)
  }, [autoScrollMessageId, messages])

  const fetchDirectoryItems = useCallback(async (directory: string): Promise<ContentItem[]> => {
    const response = await fetch(`/api/content?directory=${encodeURIComponent(directory)}`)
    if (!response.ok) {
      throw new Error('Failed to load content list')
    }
    const data = await response.json()
    return (data.files || []).map((file: any) => ({
      id: file.name,
      title: file.title,
      filename: file.name,
      metadata: file.metadata ?? {}
    }))
  }, [])

  const fetchFileContent = async (directory: string, filename: string) => {
    const response = await fetch(`/api/content?directory=${encodeURIComponent(directory)}&file=${encodeURIComponent(filename)}`)
    if (!response.ok) {
      throw new Error('Failed to load content')
    }
    return response.json()
  }

  const loadSectionItems = useCallback(async (sectionId: string, directory: string) => {
    updateSection(sectionId, current => ({ ...current, loading: true, error: undefined }))
    try {
      const items = await fetchDirectoryItems(directory)
      const sortedItems = sortItemsForSection(sectionId, items)
      updateSection(sectionId, current => ({ ...current, items: sortedItems, loading: false }))
    } catch (error: any) {
      updateSection(sectionId, current => ({ ...current, loading: false, error: error?.message ?? 'Unable to load content.' }))
    }
  }, [fetchDirectoryItems, updateSection])

  const handleSectionSelect = async (section: SectionState) => {
    setSelectedSectionId(section.id)

    if (section.action) {
      await handleQuickAction(section)
    } else if (section.directory) {
      if (section.items.length === 0 && !section.loading) {
        await loadSectionItems(section.id, section.directory)
      }
    }

    if (section.action === 'contact' || section.action === 'about' || section.action === 'download') {
      setIsMobileNavOpen(false)
    }
  }

  const handleItemSelect = async (section: SectionState, item: ContentItem) => {
    if (!section.directory) return
    setIsMobileNavOpen(false)
    try {
      setIsProcessing(true)
      const data = await fetchFileContent(section.directory, item.filename)
      const m = { ...(item.metadata ?? {}), ...(data.metadata ?? {}) }
      const metaParts = [
        m.company,
        m.role,
        m.period || m.timeline || (m.start ? `${m.start} – ${m.end || 'Present'}` : null),
        m.status
      ].filter(Boolean)
      appendMessage({
        id: createId(),
        role: 'ai',
        heading: section.label,
        title: data.title ?? item.title,
        content: stripLeadingMeta(data.content ?? ''),
        isMarkdown: true,
        meta: metaParts.join(' · ') || undefined,
        videoId: typeof m.video === 'string' ? m.video : undefined,
        videoTitle: typeof m.videoTitle === 'string' ? m.videoTitle : undefined
      })
      if (audioEnabled && data.content) {
        await generateSpeech(data.content)
      }
    } catch (error: any) {
      appendMessage({
        id: createId(),
        role: 'system',
        heading: 'Oops',
        content: error?.message ?? 'Unable to load that entry right now.',
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleQuickAction = async (section: SectionState) => {
    const action = section.action
    if (!action) return

    switch (action) {
      case 'contact': {
        const lines = [
          '- Email: **joshua@lossner.tech**  ',
          '- LinkedIn: [linkedin.com/in/joshualossner](https://www.linkedin.com/in/joshualossner)  ',
          '- GitHub: [github.com/s5dk4g5cfv-cell](https://github.com/s5dk4g5cfv-cell)'
        ]

        const messageId = createId()
        const heading = 'Contact'

        setAutoScrollMessageId(messageId)

        for (let i = 0; i < lines.length; i++) {
          const content = lines.slice(0, i + 1).join('\n')
          setMessages(prev => {
            const without = prev.filter(msg => msg.id !== messageId)
            return [
              ...without,
              {
                id: messageId,
                role: 'ai',
                heading,
                content,
                isMarkdown: true,
              },
            ]
          })
          await new Promise(resolve => setTimeout(resolve, 240))
        }
        break
      }
      case 'about': {
        if (!section.directory) {
          break
        }

        try {
          setIsProcessing(true)

          let items = section.items
          if (items.length === 0) {
            const fetched = await fetchDirectoryItems(section.directory)
            const sorted = sortItemsForSection(section.id, fetched)
            items = sorted
            updateSection(section.id, current => ({ ...current, items: sorted, loading: false, error: undefined }))
          }

          const firstItem = items[0]
          if (!firstItem) {
            appendMessage({
              id: createId(),
              role: 'system',
              heading: 'Oops',
              content: 'Nothing to show in About just yet.',
            })
            break
          }

          const data = await fetchFileContent(section.directory, firstItem.filename)
          appendMessage({
            id: createId(),
            role: 'ai',
            heading: section.label,
            content: stripLeadingMeta(data.content ?? ''),
            isMarkdown: true,
            meta: firstItem.metadata?.period || firstItem.metadata?.timeline || firstItem.metadata?.status,
          })

          if (audioEnabled && data.content) {
            await generateSpeech(data.content)
          }
        } catch (error: any) {
          appendMessage({
            id: createId(),
            role: 'system',
            heading: 'Oops',
            content: error?.message ?? 'Unable to load About right now.',
          })
        } finally {
          setIsProcessing(false)
        }
        break
      }
      case 'download':
        window.open('/Joshua%20Lossner%20-%20Software%20Engineer.pdf', '_blank')
        break
      default:
        break
    }
  }

  useEffect(() => {
    if (
      selectedSection &&
      selectedSection.directory &&
      selectedSection.action !== 'about' &&
      selectedSection.items.length === 0 &&
      !selectedSection.loading
    ) {
      loadSectionItems(selectedSection.id, selectedSection.directory)
    }
  }, [selectedSection, loadSectionItems])

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileNavOpen(false)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    if (isMobileNavOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
  }, [isMobileNavOpen])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!currentInput.trim() || isProcessing) return

    const userText = currentInput.trim()
    setCurrentInput('')

    if (JOSHUA_TRIGGER.test(userText)) {
      event.currentTarget.querySelector('textarea')?.blur()
      setIsJoshuaTerminalOpen(true)
      return
    }

    const userMessage: Message = {
      id: createId(),
      role: 'user',
      content: userText,
    }
    appendMessage(userMessage)

    const historyForServer = messages
      .filter(message => message.role === 'user' || message.role === 'ai')
      .map(message => ({
        role: message.role === 'ai' ? 'assistant' as const : 'user' as const,
        content: message.content
      }))

    const aiMessageId = createId()
    appendMessage({
      id: aiMessageId,
      role: 'ai',
      content: '',
      isMarkdown: true,
    })

    try {
      setIsProcessing(true)
      const responseText = await streamAIResponse(userText, historyForServer, aiMessageId)
      if (audioEnabled && responseText.trim().length > 0) {
        await generateSpeech(responseText)
      }
    } catch (error: any) {
      const fallbackContent = typeof error?.message === 'string' ? error.message : 'Had trouble responding just now. Try again in a moment.'
      replaceMessage(aiMessageId, () => ({
        id: aiMessageId,
        role: 'system',
        heading: 'AI Unavailable',
        content: fallbackContent,
      }))
    } finally {
      setIsProcessing(false)
    }
  }

  const handleInputKeyDown = async (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      await handleSubmit(event as unknown as React.FormEvent<HTMLFormElement>)
    }
  }

  const streamAIResponse = async (
    message: string,
    history: Array<{ role: 'user' | 'assistant'; content: string }>,
    messageId: string
  ) => {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, history })
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => '')
      throw new Error(errorText || 'Unavailable right now.')
    }

    if (!response.body) {
      throw new Error('Empty response.')
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let fullText = ''

    while (true) {
      const { value, done } = await reader.read()
      if (done) {
        break
      }
      const chunk = decoder.decode(value, { stream: true })
      if (chunk) {
        fullText += chunk
        const snapshot = fullText
        replaceMessage(messageId, current => ({ ...current, content: snapshot, isMarkdown: true }))
      }
    }

    const finalChunk = decoder.decode()
    if (finalChunk) {
      fullText += finalChunk
    }

    const trimmed = fullText.trim()
    replaceMessage(messageId, current => ({ ...current, content: trimmed, isMarkdown: true }))
    return trimmed
  }

  const generateSpeech = async (text: string) => {
    try {
      const response = await fetch('/api/speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      })
      if (!response.ok) return
      const arrayBuffer = await response.arrayBuffer()
      const blob = new Blob([arrayBuffer], { type: 'audio/mpeg' })
      if (audioRef.current) {
        audioRef.current.src = URL.createObjectURL(blob)
        setIsPlaying(true)
        await audioRef.current.play()
      }
    } catch (error) {
      console.error('Text-to-speech failed', error)
    }
  }

  const renderMessage = (message: Message) => {
    const isUser = message.role === 'user'

    if (message.role === 'system' && message.heading === 'Welcome') {
      const projectsSection = sections.find(section => section.id === 'projects')
      const aboutSection = sections.find(section => section.id === 'about')

      return (
        <section key={message.id} data-message-id={message.id} className="terminal-hero">
          <div className="terminal-hero-grid" aria-hidden="true" />
          <div className="relative z-10 max-w-6xl">
            <div className="mb-6 flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-[9px] uppercase tracking-[0.2em] text-[#e4dfd5]/42">
              <span className="flex items-center gap-2 text-[#e4dfd5]/72"><span className="terminal-status-light" /> Online</span>
              <span>Des Moines, Iowa</span>
              <span>Public access</span>
            </div>
            <div className="grid items-center gap-x-12 gap-y-9 lg:grid-cols-[1fr_1.05fr]">
              <div>
                <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.28em] text-[#e0b25a]">IT professional &amp; toolsmith</p>
                <h2 className="terminal-hero-title">Practical tools.<br />Reliable delivery.</h2>
                <p className="mt-5 max-w-xl text-[15px] leading-[1.7] text-[#e4dfd5]/78 sm:text-base sm:leading-[1.7]">{message.content}</p>
                <div className="mt-7 flex flex-wrap gap-2">
                  {projectsSection && (
                    <button
                      type="button"
                      onClick={async () => {
                        await handleSectionSelect(projectsSection)
                        if (window.innerWidth < 1024) setIsMobileNavOpen(true)
                      }}
                      className="terminal-primary-action"
                    >
                      Project files
                    </button>
                  )}
                  {aboutSection && (
                    <button type="button" onClick={() => handleSectionSelect(aboutSection)} className="terminal-secondary-action">
                      About Joshua
                    </button>
                  )}
                </div>
              </div>
              <VideoEmbed
                id={FEATURED_VIDEO.id}
                title={FEATURED_VIDEO.title}
                label="Featured"
              />
            </div>
            <div className="mt-10 grid overflow-hidden rounded-lg border border-[#e4dfd5]/12 sm:grid-cols-3">
              {[
                ['4', 'Employers / 33 years'],
                ['7', 'Core technical domains'],
                ['25+', 'Platforms & tools'],
              ].map(([value, label]) => (
                <div key={label} className="border-b border-[#e4dfd5]/10 px-5 py-3.5 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0">
                  <p className="font-serif text-2xl text-[#e0b25a]">{value}</p>
                  <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.16em] text-[#e4dfd5]/42">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )
    }

    return (
      <div key={message.id} data-message-id={message.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
        <div className={isUser ? 'max-w-2xl' : 'w-full max-w-5xl'}>
          <article className={isUser ? 'terminal-user-message' : 'terminal-record'}>
            {message.heading && <p className="mb-3 font-mono text-[9px] uppercase tracking-[0.22em] text-[#e0b25a]">{message.heading}</p>}
            {message.title && <h2 className="mb-2 max-w-3xl font-serif text-2xl font-normal leading-tight tracking-[-0.015em] text-[#e4dfd5] sm:text-3xl">{message.title}</h2>}
            {message.meta && <p className="mb-5 font-mono text-[9px] uppercase tracking-[0.14em] text-[#e4dfd5]/42">{message.meta}</p>}
            {message.videoId && (
              <VideoEmbed
                id={message.videoId}
                title={message.videoTitle ?? message.title ?? 'Video'}
                className="mb-7 max-w-3xl"
              />
            )}
            {message.isMarkdown ? (
              <div className="prose terminal-prose max-w-none"><ReactMarkdown>{message.content}</ReactMarkdown></div>
            ) : (
              <p className="whitespace-pre-line text-[15px] leading-[1.7] text-[#e4dfd5]/78">{message.content}</p>
            )}
          </article>
        </div>
      </div>
    )
  }

  const leftNavSections = useMemo(() => sections.filter(section => section.directory || section.action), [sections])

  const renderDesktopSectionButton = (section: SectionState) => {
    const isSelected = selectedSectionId === section.id

    return (
      <button
        key={section.id}
        type="button"
        onClick={() => handleSectionSelect(section)}
        aria-current={isSelected ? 'page' : undefined}
        className={`terminal-nav-item ${isSelected ? 'terminal-nav-item-active' : ''}`}
      >
        <span className={isSelected ? 'text-[#e0b25a]' : 'text-[#e4dfd5]/28'}>{NAV_CODES[section.id]}</span>
        <span className="font-sans text-[13px] tracking-normal">{section.label}</span>
        <span className="ml-auto text-[10px] opacity-25">{isSelected ? '●' : ''}</span>
      </button>
    )
  }

  const renderRecordButton = (item: ContentItem) => selectedSection ? (
    <button
      key={item.id}
      type="button"
      onClick={() => handleItemSelect(selectedSection, item)}
      className="group w-full rounded-md border-l-2 border-transparent px-3 py-2.5 text-left text-[#e4dfd5]/58 transition hover:border-[#e0b25a] hover:bg-[#e0b25a]/[0.055] hover:text-[#e4dfd5]"
      disabled={isProcessing}
    >
      <span className="block text-[13px] leading-snug">{item.title}</span>
      {item.metadata?.period && <span className="mt-1 block font-mono text-[9px] uppercase tracking-[0.12em] text-[#e4dfd5]/32">{item.metadata.period}</span>}
    </button>
  ) : null

  return (
    <div ref={rootRef} className="wargames-shell flex h-[100dvh] overflow-hidden text-[#e4dfd5]">
      <aside className="relative z-10 hidden w-[286px] flex-shrink-0 border-r border-[#e4dfd5]/12 bg-[#2b2826] lg:flex">
        <div className="flex h-full w-full flex-col overflow-hidden">
          <div className="border-b border-[#e4dfd5]/10 px-5 py-5">
            <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-[#e0b25a]">Directory</p>
            <p className="mt-2 text-[12px] text-[#e4dfd5]/45">Pick a place to start</p>
          </div>
          <div className="flex flex-1 flex-col overflow-hidden">
            <p className="px-5 pb-2 pt-5 font-mono text-[9px] uppercase tracking-[0.22em] text-[#e4dfd5]/28">Sections</p>
            <div className="flex-none space-y-1 px-2 pb-4">{leftNavSections.map(renderDesktopSectionButton)}</div>
            {selectedSection?.directory && selectedSection.action !== 'about' && (
              <div className="fine-scrollbar flex-1 overflow-y-auto border-t border-[#e4dfd5]/10 pt-4">
                <div className="flex items-center justify-between px-5 pb-2">
                  <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-[#e4dfd5]/28">{selectedSection.label}</p>
                  <span className="font-mono text-[9px] text-[#e4dfd5]/28">{selectedSection.items.length}</span>
                </div>
                <div className="space-y-1 px-2 pb-4">
                  {selectedSection.loading && <p className="px-3 py-2 text-[12px] text-[#e4dfd5]/40">Loading…</p>}
                  {selectedSection.error && <p className="px-3 py-2 text-[12px] text-[#b87952]">{selectedSection.error}</p>}
                  {selectedSection.items.map(renderRecordButton)}
                  {selectedSection.items.length === 0 && !selectedSection.loading && !selectedSection.error && <p className="px-3 py-2 text-[12px] text-[#e4dfd5]/35">Nothing here yet</p>}
                </div>
              </div>
            )}
          </div>
          <div className="border-t border-[#e4dfd5]/10 px-5 py-4 font-mono text-[9px] uppercase tracking-[0.16em] text-[#e4dfd5]/30">
            <div className="flex items-center justify-between"><span>lossner.tech</span><span className="flex items-center gap-2 text-[#e4dfd5]/55"><span className="terminal-status-light" /> Online</span></div>
          </div>
        </div>
      </aside>

      <div className="relative z-10 flex flex-1 flex-col overflow-hidden">
        <header className="sticky top-0 z-40 border-b border-[#e4dfd5]/10 bg-[#232120]/94 backdrop-blur">
          <div className="mx-auto w-full max-w-[1320px] px-[clamp(16px,4vw,64px)] py-3.5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => setIsMobileNavOpen(true)} className="rounded-md border border-[#e4dfd5]/15 p-2 text-[#e4dfd5]/60 transition hover:border-[#e0b25a] hover:text-[#e0b25a] lg:hidden" aria-label="Open navigation"><MenuIcon /></button>
                <div>
                  <div className="flex items-baseline gap-2.5">
                    <h1 className="font-serif text-base font-normal tracking-[-0.01em] text-[#e4dfd5]">Joshua Lossner</h1>
                    <span className="hidden font-mono text-[9px] uppercase tracking-[0.18em] text-[#e0b25a] sm:inline">IT professional &amp; toolsmith</span>
                  </div>
                  <p className="mt-0.5 hidden text-[11px] text-[#e4dfd5]/38 sm:block">Release management · DevOps · practical automation</p>
                </div>
              </div>
              <div className="flex items-center gap-3 font-mono text-[9px] uppercase tracking-[0.14em] text-[#e4dfd5]/30">
                <span className="flex items-center gap-2 rounded-md border border-[#e4dfd5]/10 px-3 py-1.5 text-[#e4dfd5]/55"><span className="terminal-status-light" /> Online</span>
              </div>
            </div>
          </div>
        </header>

        <main className="flex flex-1 flex-col overflow-hidden">
          <div ref={chatScrollRef} className="fine-scrollbar flex-1 overflow-y-auto">
            <div className="mx-auto w-full max-w-[1320px] space-y-6 px-[clamp(16px,4vw,64px)] py-5 lg:py-9">{messages.map(renderMessage)}<div ref={messagesEndRef} /></div>
          </div>
          <form onSubmit={handleSubmit} className="flex-none border-t border-[#e4dfd5]/10 bg-[#232120]">
            <div className="mx-auto w-full max-w-[1320px] px-[clamp(16px,4vw,64px)] py-3">
              <div className="terminal-command-line group flex items-end gap-3">
                <span className="mb-2 text-sm text-[#e0b25a]" aria-hidden="true">&gt;</span>
                <textarea
                  value={currentInput}
                  onChange={event => setCurrentInput(event.target.value)}
                  onKeyDown={handleInputKeyDown}
                  onFocus={event => {
                    const textarea = event.currentTarget
                    setTimeout(() => {
                      if (document.activeElement === textarea) rootRef.current?.querySelector('form')?.scrollIntoView({ behavior: 'smooth', block: 'end' })
                    }, 300)
                  }}
                  placeholder={isProcessing ? 'Thinking…' : 'Ask me anything about Joshua'}
                  aria-label="Enter portfolio query or command"
                  className="min-h-[36px] flex-1 resize-none bg-transparent py-1 text-base leading-6 text-[#e4dfd5] outline-none placeholder:text-[#e4dfd5]/28 sm:text-[15px]"
                  rows={1}
                  disabled={isProcessing}
                />
                <button type="submit" className="mb-0.5 flex h-9 w-10 flex-none items-center justify-center rounded-md border border-[#e4dfd5]/15 bg-[#e4dfd5]/[0.03] text-[#e4dfd5]/70 transition hover:border-[#e0b25a] hover:text-[#e0b25a] disabled:opacity-20" disabled={isProcessing || !currentInput.trim()} aria-label="Send message">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M12 19V5" /><path d="m5 12 7-7 7 7" /></svg>
                </button>
              </div>
              <div className="mt-2 flex items-center justify-between px-1 font-mono text-[9px] uppercase tracking-[0.12em] text-[#e4dfd5]/24">
                <span>{isProcessing ? 'Working…' : ''}</span>
                <span className="hidden sm:block">Enter to send · Shift+Enter for a new line</span>
              </div>
            </div>
          </form>
        </main>
      </div>

      {isMobileNavOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-[#1b1917]/90" onClick={() => setIsMobileNavOpen(false)} />
          <div className="fine-scrollbar relative h-full w-[320px] max-w-[88vw] overflow-y-auto border-r border-[#e4dfd5]/12 bg-[#2b2826] p-4">
            <div className="mb-6 flex items-center justify-between border-b border-[#e4dfd5]/10 pb-4">
              <div><span className="block font-mono text-[10px] uppercase tracking-[0.2em] text-[#e0b25a]">Directory</span><span className="mt-1 block text-[12px] text-[#e4dfd5]/45">Pick a place to start</span></div>
              <button type="button" onClick={() => setIsMobileNavOpen(false)} className="rounded-md border border-[#e4dfd5]/15 p-2 text-[#e4dfd5]/55 transition hover:border-[#e0b25a] hover:text-[#e0b25a]" aria-label="Close navigation"><CloseIcon /></button>
            </div>
            <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.22em] text-[#e4dfd5]/28">Sections</p>
            <div className="space-y-1">{leftNavSections.map(renderDesktopSectionButton)}</div>
            {selectedSection?.directory && selectedSection.action !== 'about' && (
              <div className="mt-5 space-y-1 border-t border-[#e4dfd5]/10 pt-4">
                <div className="mb-2 flex items-center justify-between"><p className="font-mono text-[9px] uppercase tracking-[0.22em] text-[#e4dfd5]/28">{selectedSection.label}</p><span className="font-mono text-[9px] text-[#e4dfd5]/28">{selectedSection.items.length}</span></div>
                {selectedSection.items.map(renderRecordButton)}
              </div>
            )}
          </div>
        </div>
      )}

      {isJoshuaTerminalOpen ? (
        <JoshuaTerminal onClose={() => setIsJoshuaTerminalOpen(false)} />
      ) : null}

      <audio
        ref={audioRef}
        onEnded={() => setIsPlaying(false)}
        onError={() => setIsPlaying(false)}
        className="hidden"
      />
    </div>
  )
}

export default TerminalResume
