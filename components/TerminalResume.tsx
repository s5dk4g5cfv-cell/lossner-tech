'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import dynamic from 'next/dynamic'
import { SidebarIcons } from './icons'

const JoshuaTerminal = dynamic(() => import('./JoshuaTerminal'), { ssr: false })

type MessageRole = 'system' | 'user' | 'ai'

type Message = {
  id: string
  role: MessageRole
  content: string
  heading?: string
  title?: string
  isMarkdown?: boolean
  meta?: string
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
  const isSidebarCollapsed = false
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
      content: 'I turn complex systems into clear, durable infrastructure — from enterprise automation to human-AI collaboration.',
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
      const m = item.metadata ?? {}
      const metaParts = [
        m.company,
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
        meta: metaParts.join(' · ') || undefined
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
          '- Email: **joshua.c.lossner@icloud.com**  ',
          '- LinkedIn: [linkedin.com/in/joshualossner](https://www.linkedin.com/in/joshualossner)  ',
          '- GitHub: [github.com/joshua-lossner](https://github.com/joshua-lossner)'
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

  const toggleAudio = () => {
    setAudioEnabled(prev => !prev)
  }

  const renderMessage = (message: Message) => {
    const isUser = message.role === 'user'

    if (message.role === 'system' && message.heading === 'Welcome') {
      const projectsSection = sections.find(section => section.id === 'projects')
      const aboutSection = sections.find(section => section.id === 'about')

      return (
        <section key={message.id} data-message-id={message.id} className="relative overflow-hidden rounded-[28px] glass-panel px-6 py-8 sm:px-10 sm:py-12 lg:px-14 lg:py-14">
          <div className="hero-orbit" aria-hidden="true" />
          <div className="relative z-10 max-w-4xl">
            <div className="mb-7 flex flex-wrap items-center gap-3 font-mono text-[10px] uppercase tracking-[0.24em] text-[#8b9aaf]">
              <span className="flex items-center gap-2 text-[#66e3ff]">
                <span className="signal-dot h-1.5 w-1.5 rounded-full bg-[#66e3ff]" />
                Available for ambitious systems
              </span>
              <span className="text-white/20">{'//'}</span>
              <span>Des Moines, IA</span>
            </div>

            <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.32em] text-[#ffb454]">DevOps engineer · automation builder</p>
            <h2 className="max-w-4xl text-[clamp(2.65rem,7vw,6.4rem)] font-semibold leading-[0.9] tracking-[-0.075em] text-white">
              I engineer<br />
              <span className="bg-gradient-to-r from-[#66e3ff] via-[#d8f8ff] to-[#9d8cff] bg-clip-text text-transparent">coherent systems.</span>
            </h2>
            <p className="mt-7 max-w-2xl text-base leading-7 text-[#a8b5c7] sm:text-lg sm:leading-8">
              {message.content}
            </p>

            <div className="mt-9 flex flex-wrap gap-3">
              {projectsSection && (
                <button
                  type="button"
                  onClick={async () => {
                    await handleSectionSelect(projectsSection)
                    if (window.innerWidth < 1024) {
                      setIsMobileNavOpen(true)
                    }
                  }}
                  className="group inline-flex items-center gap-3 rounded-full bg-[#e8edf5] px-5 py-3 text-sm font-semibold text-[#05070d] transition hover:bg-[#66e3ff]"
                >
                  Explore selected work
                  <span className="transition-transform group-hover:translate-x-1" aria-hidden="true">↗</span>
                </button>
              )}
              {aboutSection && (
                <button
                  type="button"
                  onClick={() => handleSectionSelect(aboutSection)}
                  className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/[0.04] px-5 py-3 text-sm font-medium text-white/80 transition hover:border-[#66e3ff]/60 hover:text-[#66e3ff]"
                >
                  The human behind it
                </button>
              )}
            </div>

            <div className="mt-12 grid max-w-2xl grid-cols-1 gap-px overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.08] sm:grid-cols-3">
              {[
                ['18+', 'Years in technology'],
                ['18K+', 'Annual deployments'],
                ['40+', 'AI agents orchestrated'],
              ].map(([value, label]) => (
                <div key={label} className="bg-[#0a1019]/90 px-5 py-4">
                  <p className="text-xl font-semibold tracking-tight text-white">{value}</p>
                  <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.18em] text-[#77869a]">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )
    }

    return (
      <div key={message.id} data-message-id={message.id} className={`flex ${isUser ? 'justify-end' : 'justify-start signal-spine'}`}>
        <div className={isUser ? 'max-w-xl' : 'max-w-4xl w-full'}>
          <article className={isUser
            ? 'rounded-[20px] rounded-br-md bg-[#66e3ff] px-5 py-3 text-[#071017] shadow-[0_12px_35px_rgba(102,227,255,0.12)]'
            : 'record-card relative overflow-hidden rounded-[22px] px-5 py-5 sm:px-7 sm:py-7 text-white/90'}>
            {message.heading && (
              <p className="mb-3 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.26em] text-[#66e3ff]">
                <span>{message.heading}</span>
                <span className="h-px w-8 bg-[#66e3ff]/30" />
              </p>
            )}
            {message.title && (
              <h2 className="mb-2 max-w-3xl text-xl font-semibold leading-tight tracking-[-0.03em] text-white sm:text-2xl">{message.title}</h2>
            )}
            {message.meta && (
              <p className="mb-5 font-mono text-[10px] uppercase tracking-[0.16em] text-[#ffb454]">{message.meta}</p>
            )}
            {message.isMarkdown ? (
              <div className="prose prose-invert max-w-none prose-p:text-[#b3bfd0] prose-p:leading-7 prose-headings:text-white prose-strong:text-white prose-strong:font-semibold prose-a:text-[#66e3ff] hover:prose-a:text-white prose-li:text-[#b3bfd0] prose-li:marker:text-[#66e3ff]/60 prose-code:font-mono prose-pre:font-mono">
                <ReactMarkdown>{message.content}</ReactMarkdown>
              </div>
            ) : (
              <p className="whitespace-pre-line text-sm leading-6">{message.content}</p>
            )}
          </article>
        </div>
      </div>
    )
  }

  const leftNavSections = useMemo(() => sections.filter(section => section.directory || section.action), [sections])
  const sidebarWidthClasses = isSidebarCollapsed ? 'lg:w-20' : 'lg:w-[280px]'

  const navIconFor = (id: string) => SidebarIcons[id as keyof typeof SidebarIcons] ?? SidebarIcons.about

  const renderDesktopSectionButton = (section: SectionState) => {
    const isSelected = selectedSectionId === section.id
    const icon = navIconFor(section.id)

    return (
      <button
        key={section.id}
        type="button"
        title={isSidebarCollapsed ? section.label : undefined}
        onClick={() => handleSectionSelect(section)}
        aria-current={isSelected ? 'page' : undefined}
        className={`group relative w-full rounded-xl border transition px-3 py-2.5 text-left flex items-center ${
          isSidebarCollapsed ? 'justify-center' : 'gap-3'
        } ${
          isSelected
            ? 'bg-[#66e3ff]/[0.09] border-[#66e3ff]/35 text-white'
            : 'bg-transparent border-transparent text-[#8897aa] hover:border-white/10 hover:bg-white/[0.035] hover:text-white'
        }`}
      >
        {!isSidebarCollapsed && (
          <span className={`w-5 font-mono text-[9px] tracking-wider ${isSelected ? 'text-[#66e3ff]' : 'text-white/25 group-hover:text-white/45'}`}>
            {NAV_CODES[section.id]}
          </span>
        )}
        <span className={`flex h-5 w-5 items-center justify-center ${isSelected ? 'text-[#66e3ff]' : 'text-white/35 group-hover:text-white/65'}`}>{icon}</span>
        {!isSidebarCollapsed && (
          <span className="text-sm font-medium leading-tight">{section.label}</span>
        )}
        {!isSidebarCollapsed && isSelected && (
          <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#66e3ff] shadow-[0_0_12px_rgba(102,227,255,0.75)]" aria-hidden="true" />
        )}
      </button>
    )
  }

  return (
    <div ref={rootRef} className="interface-shell h-[100dvh] text-[#e8edf5] flex overflow-hidden">
      <aside className={`hidden lg:flex ${sidebarWidthClasses} border-r border-white/[0.07] bg-[#080c14]/90 backdrop-blur-xl flex-shrink-0`}>
        <div className="flex h-full w-full flex-col overflow-hidden">
          {!isSidebarCollapsed && (
            <div className="border-b border-white/[0.07] px-5 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#66e3ff]/25 bg-[#66e3ff]/[0.06] font-mono text-sm font-semibold text-[#66e3ff] shadow-[inset_0_0_20px_rgba(102,227,255,0.04)]">
                  JL
                </div>
                <div>
                  <p className="text-sm font-semibold tracking-tight text-white">Joshua Lossner</p>
                  <p className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.18em] text-[#667489]">Systems interface</p>
                </div>
              </div>
            </div>
          )}
          <div className="flex-1 flex flex-col overflow-hidden">
            {!isSidebarCollapsed && <p className="px-5 pt-5 pb-2 font-mono text-[9px] uppercase tracking-[0.28em] text-white/25">Index / 07</p>}
            <div className={isSidebarCollapsed ? 'flex-1 overflow-y-auto px-2 py-4 space-y-1' : 'px-2 pb-4 space-y-1 flex-none'}>
              {leftNavSections.map(renderDesktopSectionButton)}
            </div>

            {!isSidebarCollapsed && selectedSection?.directory && selectedSection.action !== 'about' && (
              <div className="fine-scrollbar flex-1 overflow-y-auto border-t border-white/[0.07] pt-4">
                <div className="flex items-center justify-between px-5 pb-2">
                  <p className="font-mono text-[9px] uppercase tracking-[0.28em] text-white/25">Records</p>
                  <span className="font-mono text-[9px] text-white/20">{String(selectedSection.items.length).padStart(2, '0')}</span>
                </div>
                <div className="space-y-1 px-2 pb-4">
                  {selectedSection.loading && (
                    <p className="text-xs text-white/40 px-2 py-2">Loading…</p>
                  )}
                  {selectedSection.error && (
                    <p className="text-xs text-red-300 px-2 py-2">{selectedSection.error}</p>
                  )}
                  {selectedSection.items.map(item => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleItemSelect(selectedSection, item)}
                      className="group w-full text-left rounded-xl px-3 py-2.5 text-xs text-white/70 hover:text-white hover:bg-white/[0.04] border border-transparent hover:border-white/[0.07] transition"
                      disabled={isProcessing}
                    >
                      <span className="flex items-start gap-2 text-[13px] font-medium leading-snug text-white/78 group-hover:text-white">
                        <span className="mt-1 text-[9px] text-[#66e3ff]/40 group-hover:text-[#66e3ff]">↗</span>
                        {item.title}
                      </span>
                      {item.metadata?.period && (
                        <span className="ml-4 mt-1 block font-mono text-[9px] uppercase tracking-wider text-white/25">{item.metadata.period}</span>
                      )}
                    </button>
                  ))}
                  {selectedSection.items.length === 0 && !selectedSection.loading && !selectedSection.error && (
                    <p className="text-xs text-white/40 px-2 py-2">No entries yet.</p>
                  )}
                </div>
              </div>
            )}
          </div>
          {!isSidebarCollapsed && (
            <div className="border-t border-white/[0.07] px-5 py-4 font-mono text-[9px] uppercase tracking-[0.18em] text-white/25">
              <div className="flex items-center justify-between">
                <span>Signal</span>
                <span className="flex items-center gap-2 text-[#66e3ff]/80"><span className="h-1.5 w-1.5 rounded-full bg-[#66e3ff]" /> online</span>
              </div>
            </div>
          )}
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="sticky top-0 z-40 border-b border-white/[0.07] bg-[#05070d]/80 backdrop-blur-xl">
          <div className="mx-auto w-full max-w-[1320px] px-[clamp(16px,4vw,64px)] py-3.5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsMobileNavOpen(true)}
                  className="lg:hidden rounded-xl border border-white/10 p-2.5 text-white/60 hover:border-[#66e3ff]/50 hover:text-[#66e3ff] transition"
                  aria-label="Open navigation"
                >
                  <MenuIcon />
                </button>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-[#66e3ff]">SYS</span>
                    <span className="text-white/15">/</span>
                    <h1 className="text-sm font-semibold tracking-tight text-white sm:text-base">PORTFOLIO</h1>
                  </div>
                  <p className="mt-0.5 hidden font-mono text-[9px] uppercase tracking-[0.16em] text-white/30 sm:block">Engineering clarity from complexity</p>
                </div>
              </div>
              <div className="flex items-center gap-3 font-mono text-[9px] uppercase tracking-[0.16em] text-white/30">
                <span className="hidden sm:inline">Portfolio OS · v1.1</span>
                <span className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-[#66e3ff]/80">
                  <span className="signal-dot h-1.5 w-1.5 rounded-full bg-[#66e3ff]" /> Live
                </span>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 flex flex-col overflow-hidden">
          <div ref={chatScrollRef} className="fine-scrollbar flex-1 overflow-y-auto">
            <div className="px-[clamp(16px,4vw,64px)] py-5 lg:py-9 space-y-6 max-w-[1320px] mx-auto w-full">
              {messages.map(renderMessage)}
              <div ref={messagesEndRef} />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex-none border-t border-white/[0.07] bg-[#05070d]/88 backdrop-blur-xl">
            <div className="px-[clamp(16px,4vw,64px)] py-3 max-w-[1320px] mx-auto w-full">
              <div className="group rounded-[18px] border border-white/[0.1] bg-[#0d1420]/90 pl-4 pr-2.5 py-2.5 focus-within:border-[#66e3ff]/55 focus-within:shadow-[0_0_0_3px_rgba(102,227,255,0.05)] transition flex items-end gap-3">
                <span className="mb-2 hidden font-mono text-[11px] text-[#66e3ff]/60 sm:block" aria-hidden="true">~/ask</span>
                <textarea
                  value={currentInput}
                  onChange={event => setCurrentInput(event.target.value)}
                  onKeyDown={handleInputKeyDown}
                  onFocus={event => {
                    const textarea = event.currentTarget
                    // On iOS, scroll the form into view after keyboard appears
                    setTimeout(() => {
                      if (document.activeElement === textarea) {
                        rootRef.current?.querySelector('form')?.scrollIntoView({ behavior: 'smooth', block: 'end' })
                      }
                    }, 300)
                  }}
                  placeholder={isProcessing ? 'Tracing an answer\u2026' : 'Ask about the work, the systems, or the person'}
                  className="flex-1 bg-transparent resize-none outline-none text-base sm:text-sm leading-6 text-white/90 placeholder:text-white/28 min-h-[36px] py-1"
                  rows={1}
                  disabled={isProcessing}
                />
                <button
                  type="submit"
                  className="flex-none flex items-center justify-center w-9 h-9 rounded-xl bg-[#66e3ff] text-[#05070d] hover:bg-white transition disabled:opacity-25 mb-0.5"
                  disabled={isProcessing || !currentInput.trim()}
                  aria-label="Send message"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                    <path d="M12 19V5" />
                    <path d="m5 12 7-7 7 7" />
                  </svg>
                </button>
              </div>
              <div className="mt-2 flex items-center justify-between px-1 font-mono text-[9px] uppercase tracking-[0.14em] text-white/22">
                <span>{isProcessing ? 'Tracing portfolio context…' : 'Context-aware portfolio interface'}</span>
                <span className="hidden sm:block">Enter to send · Shift + Enter for line</span>
              </div>
            </div>
          </form>
        </main>
      </div>

      {isMobileNavOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-[#02040a]/85 backdrop-blur-md" onClick={() => setIsMobileNavOpen(false)} />
          <div className="fine-scrollbar relative h-full w-[320px] max-w-[88vw] overflow-y-auto border-r border-white/[0.08] bg-[#080c14]/98 p-4 shadow-[24px_0_80px_rgba(0,0,0,0.5)]">
            <div className="mb-6 flex items-center justify-between border-b border-white/[0.07] pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#66e3ff]/25 bg-[#66e3ff]/[0.06] font-mono text-xs font-semibold text-[#66e3ff]">JL</div>
                <div>
                  <span className="block text-sm font-semibold text-white">Joshua Lossner</span>
                  <span className="font-mono text-[8px] uppercase tracking-[0.18em] text-white/30">Systems interface</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileNavOpen(false)}
                className="rounded-xl border border-white/10 p-2 text-white/55 hover:border-[#66e3ff]/50 hover:text-[#66e3ff] transition"
                aria-label="Close navigation"
              >
                <CloseIcon />
              </button>
            </div>
            <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.28em] text-white/25">Index / 07</p>
            <div className="space-y-1">
              {leftNavSections.map(section => {
                const isSelected = selectedSectionId === section.id
                const icon = navIconFor(section.id)
                return (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => handleSectionSelect(section)}
                    aria-current={isSelected ? 'page' : undefined}
                    className={`w-full flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition ${
                      isSelected
                        ? 'bg-[#66e3ff]/[0.09] border-[#66e3ff]/35 text-white'
                        : 'bg-transparent border-transparent text-white/60 hover:border-white/10 hover:bg-white/[0.035] hover:text-white'
                    }`}
                  >
                    <span className={`w-5 font-mono text-[9px] ${isSelected ? 'text-[#66e3ff]' : 'text-white/25'}`}>{NAV_CODES[section.id]}</span>
                    <span className={`flex h-5 w-5 items-center justify-center ${isSelected ? 'text-[#66e3ff]' : 'text-white/35'}`}>{icon}</span>
                    <span>{section.label}</span>
                    {isSelected && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#66e3ff]" />}
                  </button>
                )
              })}
            </div>
            {selectedSection?.directory && selectedSection.action !== 'about' && (
              <div className="mt-5 border-t border-white/[0.07] pt-4 space-y-1">
                <div className="mb-2 flex items-center justify-between">
                  <p className="font-mono text-[9px] uppercase tracking-[0.28em] text-white/25">Records</p>
                  <span className="font-mono text-[9px] text-white/20">{String(selectedSection.items.length).padStart(2, '0')}</span>
                </div>
                {selectedSection.items.map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      handleItemSelect(selectedSection, item)
                    }}
                    className="group w-full text-left rounded-xl px-3 py-2.5 text-xs text-white/65 hover:text-white hover:bg-white/[0.04] border border-transparent hover:border-white/[0.07] transition"
                    disabled={isProcessing}
                  >
                    <span className="flex items-start gap-2 text-[13px] font-medium leading-snug text-white/80 group-hover:text-white">
                      <span className="mt-1 text-[9px] text-[#66e3ff]/45">↗</span>
                      {item.title}
                    </span>
                    {item.metadata?.period && (
                      <span className="ml-4 mt-1 block font-mono text-[9px] uppercase tracking-wider text-white/25">{item.metadata.period}</span>
                    )}
                  </button>
                ))}
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
