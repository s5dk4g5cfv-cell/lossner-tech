'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { SidebarIcons } from './icons'

type MessageRole = 'system' | 'user' | 'ai'

type Message = {
  id: string
  role: MessageRole
  content: string
  heading?: string
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

const INITIAL_SELECTED_SECTION_ID = SECTION_DEFINITIONS.find(section => section.directory)?.id ?? SECTION_DEFINITIONS[0]?.id ?? null

const createId = () => Math.random().toString(36).slice(2) + Date.now().toString(36)

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
      content: "Thanks for visiting. Explore Joshua's background, skills, and projects through the menu—or ask the assistant directly.",
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
      const heading = `${section.label} · ${data.title ?? item.title}`
      appendMessage({
        id: createId(),
        role: 'ai',
        heading,
        content: data.content ?? '',
        isMarkdown: true,
        meta: item.metadata?.period || item.metadata?.timeline || item.metadata?.status
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
            content: data.content ?? '',
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
      const fallbackContent = typeof error?.message === 'string' ? error.message : 'Alex had trouble responding just now. Try again in a moment.'
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
      throw new Error(errorText || 'Alex is unavailable right now.')
    }

    if (!response.body) {
      throw new Error('Empty response from Alex.')
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
    const alignment = isUser ? 'justify-end' : 'justify-start'
    const background = isUser
      ? 'bg-emerald-500 text-emerald-950'
      : message.role === 'system'
        ? 'bg-white/5 text-white/80'
        : 'bg-white/8 text-white/90'

    return (
      <div key={message.id} data-message-id={message.id} className={`flex ${alignment}`}>
        <div className="max-w-3xl w-full">
          <div className={`rounded-2xl px-4 py-3 shadow-sm border border-white/10 ${background}`}>
            {message.heading && (
              <p className="text-sm font-semibold text-white/80 mb-1 uppercase tracking-wide">
                {message.heading}
              </p>
            )}
            {message.meta && (
              <p className="text-xs text-white/60 mb-2">{message.meta}</p>
            )}
            {message.isMarkdown ? (
              <div className="prose prose-invert max-w-none prose-headings:text-white prose-strong:text-white prose-a:text-emerald-200 hover:prose-a:text-emerald-100">
                <ReactMarkdown>{message.content}</ReactMarkdown>
              </div>
            ) : (
              <p className="text-sm leading-6 whitespace-pre-line">{message.content}</p>
            )}
          </div>
        </div>
      </div>
    )
  }

  const leftNavSections = useMemo(() => sections.filter(section => section.directory || section.action), [sections])
  const sidebarWidthClasses = isSidebarCollapsed ? 'lg:w-20 xl:w-20 2xl:w-24' : 'lg:w-[23.4vw] xl:w-[20.8vw] 2xl:w-[19.5vw]'

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
        className={`w-full rounded-lg border transition px-3 py-2 text-left flex items-center ${
          isSidebarCollapsed ? 'justify-center' : 'gap-3'
        } ${
          isSelected
            ? 'bg-emerald-500/15 border-emerald-400/60 text-emerald-200'
            : 'bg-white/5 border-white/10 text-white/80 hover:border-emerald-400/60 hover:text-emerald-200'
        }`}
      >
        <span className="flex h-5 w-5 items-center justify-center text-white/60">{icon}</span>
        {!isSidebarCollapsed && (
          <span className="text-sm font-medium leading-tight">{section.label}</span>
        )}
        {!isSidebarCollapsed && section.directory && isSelected && (
          <span className="ml-auto text-[10px] uppercase text-emerald-200">Active</span>
        )}
      </button>
    )
  }

  const renderMobileSectionButton = (section: SectionState) => {
    const isSelected = selectedSectionId === section.id
    const icon = navIconFor(section.id)

    return (
      <button
        key={section.id}
        type="button"
        onClick={() => handleSectionSelect(section)}
        className={`rounded-full px-4 py-1.5 text-xs font-medium border transition flex items-center gap-2 ${
          isSelected
            ? 'bg-emerald-500/20 border-emerald-400/70 text-emerald-200'
            : 'bg-white/5 border-white/10 text-white/70 hover:border-emerald-400/60 hover:text-emerald-200'
        }`}
      >
        <span className="flex h-4 w-4 items-center justify-center text-white/60">{icon}</span>
        {section.label}
      </button>
    )
  }

  return (
    <div ref={rootRef} className="h-[100dvh] bg-slate-950 text-slate-100 flex overflow-hidden">
      <aside className={`hidden lg:flex ${sidebarWidthClasses} border-r border-white/10 bg-slate-900/70 backdrop-blur flex-shrink-0`}>
        <div className="flex h-full w-full flex-col overflow-hidden">
          {!isSidebarCollapsed && <div className="h-3 border-b border-white/10"></div>}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className={isSidebarCollapsed ? 'flex-1 overflow-y-auto px-2 py-4 space-y-1' : 'px-2 py-4 space-y-1 flex-none'}>
              {leftNavSections.map(renderDesktopSectionButton)}
            </div>

            {!isSidebarCollapsed && selectedSection?.directory && selectedSection.action !== 'about' && (
              <div className="flex-1 overflow-y-auto border-t border-white/10 pt-3">
                <p className="px-1 text-xs uppercase tracking-[0.3em] text-white/40">Entries</p>
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
                      className="w-full text-left rounded-md px-3 py-2 text-xs text-white/75 hover:text-emerald-200 hover:bg-emerald-400/10 border border-white/5"
                      disabled={isProcessing}
                    >
                      <span className="block text-sm font-medium text-white/90">{item.title}</span>
                      {item.metadata?.period && (
                        <span className="text-[11px] text-white/40">{item.metadata.period}</span>
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
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/95 backdrop-blur">
          <div className="mx-auto w-full max-w-[1200px] px-[clamp(16px,4vw,64px)] py-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsMobileNavOpen(true)}
                className="lg:hidden rounded-full border border-white/10 p-2 text-white/70 hover:border-emerald-400/70 hover:text-emerald-200 transition"
                aria-label="Open navigation"
              >
                <MenuIcon />
              </button>
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-white/40">Joshua Lossner</p>
                <h1 className="text-xl font-semibold tracking-tight">lossner.tech</h1>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 flex flex-col overflow-hidden">
          <div ref={chatScrollRef} className="flex-1 overflow-y-auto">
            <div className="px-[clamp(16px,4vw,64px)] py-6 lg:py-10 space-y-4 max-w-[1200px] mx-auto w-full">
              {messages.map(renderMessage)}
              <div ref={messagesEndRef} />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex-none border-t border-white/10 bg-slate-950/85 backdrop-blur">
            <div className="px-[clamp(16px,4vw,64px)] py-4 space-y-3 max-w-[1200px] mx-auto w-full">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 focus-within:border-emerald-400/70 transition">
                <textarea
                  value={currentInput}
                  onChange={event => setCurrentInput(event.target.value)}
                  onKeyDown={handleInputKeyDown}
                  onFocus={() => {
                    // On iOS, scroll the form into view after keyboard appears
                    setTimeout(() => {
                      rootRef.current?.querySelector('form')?.scrollIntoView({ behavior: 'smooth', block: 'end' })
                    }, 300)
                  }}
                  placeholder={isProcessing ? 'Alex is thinking…' : 'Ask about Joshua’s work, skills, or projects…'}
                  className="w-full bg-transparent resize-none outline-none text-base sm:text-sm leading-6 placeholder:text-white/40 min-h-[44px]"
                  rows={1}
                  disabled={isProcessing}
                />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-white/50">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={toggleAudio}
                    className={`rounded-full border px-3 py-1.5 transition ${audioEnabled ? 'border-emerald-400/70 text-emerald-200' : 'border-white/10 hover:border-emerald-400/60 hover:text-emerald-200'}`}
                    disabled={isProcessing}
                  >
                    {audioEnabled ? 'AUDIO: ON' : 'AUDIO: OFF'}
                  </button>
                  {isProcessing && <span>Working…</span>}
                </div>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-950 hover:bg-emerald-400 transition disabled:opacity-50"
                  disabled={isProcessing || !currentInput.trim()}
                >
                  Send
                </button>
              </div>
            </div>
          </form>
        </main>
      </div>

      {isMobileNavOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur" onClick={() => setIsMobileNavOpen(false)} />
          <div className="relative h-full w-72 max-w-[85vw] bg-slate-900/95 shadow-xl p-4 space-y-4 overflow-y-auto">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-white/80">Navigate</span>
              <button
                type="button"
                onClick={() => setIsMobileNavOpen(false)}
                className="rounded-full border border-white/10 p-2 text-white/70 hover:border-emerald-400/70 hover:text-emerald-200 transition"
                aria-label="Close navigation"
              >
                <CloseIcon />
              </button>
            </div>
            <div className="space-y-2">
              {leftNavSections.map(section => {
                const isSelected = selectedSectionId === section.id
                const icon = navIconFor(section.id)
                return (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => handleSectionSelect(section)}
                    className={`w-full flex items-center gap-3 rounded-lg border px-3 py-2 text-sm transition ${
                      isSelected
                        ? 'bg-emerald-500/15 border-emerald-400/60 text-emerald-200'
                        : 'bg-white/5 border-white/10 text-white/80 hover:border-emerald-400/60 hover:text-emerald-200'
                    }`}
                  >
                    <span className="flex h-5 w-5 items-center justify-center text-white/60">{icon}</span>
                    <span>{section.label}</span>
                  </button>
                )
              })}
            </div>
            {selectedSection?.directory && selectedSection.action !== 'about' && (
              <div className="border-t border-white/10 pt-3 space-y-2">
                <p className="text-xs uppercase tracking-[0.3em] text-white/40">Entries</p>
                {selectedSection.items.map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      handleItemSelect(selectedSection, item)
                    }}
                    className="w-full text-left rounded-md px-3 py-2 text-xs text-white/75 hover:text-emerald-200 hover:bg-emerald-400/10 border border-white/10"
                    disabled={isProcessing}
                  >
                    <span className="block text-sm font-medium text-white/90">{item.title}</span>
                    {item.metadata?.period && (
                      <span className="text-[11px] text-white/40">{item.metadata.period}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

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
