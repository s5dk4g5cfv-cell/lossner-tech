'use client'

import { useEffect, useRef, useState } from 'react'
import SignalMazeGame from './games/SignalMazeGame'
import TicTacToeGame from './games/TicTacToeGame'
import VectorDefenseGame from './games/VectorDefenseGame'

type TerminalView = 'boot' | 'menu' | 'tic-tac-toe' | 'vector-defense' | 'signal-maze'

const BOOT_LINES = [
  'LOGON: JOSHUA',
  'PROTOCOL 83 / CARRIER ACQUIRED',
  'REMOTE SYSTEM: LOSSNER.TECH',
  'GREETINGS.',
]

const GAMES: Array<{ id: Exclude<TerminalView, 'boot' | 'menu'>; code: string; title: string; note: string }> = [
  { id: 'tic-tac-toe', code: '01', title: 'TIC-TAC-TOE', note: 'COMPLETE SEARCH' },
  { id: 'vector-defense', code: '02', title: 'VECTOR DEFENSE', note: 'MISSILE INTERCEPT' },
  { id: 'signal-maze', code: '03', title: 'COLONY PROTOCOL', note: 'SCOUT / PREDATOR' },
]

interface JoshuaTerminalProps { onClose: () => void }

export default function JoshuaTerminal({ onClose }: JoshuaTerminalProps) {
  const [view, setView] = useState<TerminalView>('boot')
  const [bootLines, setBootLines] = useState<string[]>([])
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const priorFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    priorFocusRef.current = document.activeElement as HTMLElement | null
    closeButtonRef.current?.focus()
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      priorFocusRef.current?.focus()
    }
  }, [onClose])

  useEffect(() => {
    if (view !== 'boot') return
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reducedMotion) {
      setBootLines(BOOT_LINES)
      setView('menu')
      return
    }
    const timers = BOOT_LINES.map((_, index) => window.setTimeout(() => {
      setBootLines(BOOT_LINES.slice(0, index + 1))
    }, 240 + index * 430))
    timers.push(window.setTimeout(() => setView('menu'), 2200))
    return () => timers.forEach(window.clearTimeout)
  }, [view])

  return (
    <div className="joshua-terminal fixed inset-0 z-[100] overflow-y-auto bg-[#020603] p-2 text-[#80ff96] sm:p-5" role="dialog" aria-modal="true" aria-label="Joshua game terminal">
      <div className="joshua-scanlines" aria-hidden="true" />
      <div className="relative z-10 mx-auto flex min-h-full max-w-[1440px] flex-col border border-[#80ff96]/25 bg-[#040a06]/95 shadow-[inset_0_0_100px_rgba(74,255,112,0.035),0_0_80px_rgba(0,0,0,0.6)]">
        <header className="flex items-center justify-between gap-4 border-b border-[#80ff96]/20 px-3 py-3 text-[9px] uppercase tracking-[0.2em] text-[#80ff96]/55 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="terminal-status-light" aria-hidden="true" />
            <span>JOSHUA / GAME SUBSYSTEM</span>
          </div>
          <button ref={closeButtonRef} type="button" onClick={onClose} className="border border-[#80ff96]/20 px-3 py-1.5 transition hover:border-[#80ff96]/60 hover:text-[#80ff96]" aria-label="Exit Joshua terminal">
            ESC / DISCONNECT
          </button>
        </header>

        <main className="flex flex-1 items-center p-4 sm:p-8 lg:p-12">
          {view === 'boot' && (
            <div className="joshua-terminal-panel w-full max-w-3xl text-sm leading-8 sm:text-base">
              {bootLines.map(line => <p key={line}>{line}</p>)}
              <span className="joshua-cursor mt-2 inline-block h-5 w-2.5 bg-[#80ff96] align-middle" aria-hidden="true" />
            </div>
          )}
          {view === 'menu' && (
            <div className="joshua-terminal-panel w-full max-w-5xl">
              <p className="joshua-terminal-kicker">JOSHUA INTERACTIVE SESSION</p>
              <h2 className="mt-6 text-[clamp(2.35rem,7vw,6rem)] leading-[0.9] tracking-[-0.05em]">SHALL WE PLAY<br />A GAME?</h2>
              <p className="mt-7 text-sm leading-7 text-[#80ff96]/55">AVAILABLE PROGRAMS. SELECT ONE.</p>
              <div className="mt-8 grid gap-2 lg:grid-cols-3">
                {GAMES.map(game => (
                  <button key={game.id} type="button" onClick={() => setView(game.id)} className="joshua-terminal-option group">
                    <span className="text-[#ffbd66]">{game.code}</span>
                    <span>
                      <strong className="block font-normal">{game.title}</strong>
                      <small className="mt-1 block text-[8px] tracking-[0.18em] opacity-35">{game.note}</small>
                    </span>
                    <span className="ml-auto opacity-35 transition group-hover:translate-x-1 group-hover:opacity-100">→</span>
                  </button>
                ))}
              </div>
              <button type="button" onClick={onClose} className="mt-8 text-[10px] uppercase tracking-[0.22em] text-[#80ff96]/45 transition hover:text-[#80ff96]">[ DISCONNECT ]</button>
            </div>
          )}
          {view === 'tic-tac-toe' && <TicTacToeGame onBack={() => setView('menu')} />}
          {view === 'vector-defense' && <VectorDefenseGame onBack={() => setView('menu')} />}
          {view === 'signal-maze' && <SignalMazeGame onBack={() => setView('menu')} />}
        </main>

        <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-[#80ff96]/15 px-3 py-3 text-[8px] uppercase tracking-[0.18em] text-[#80ff96]/30 sm:px-6">
          <span>PROTOVISION COMPATIBLE TERMINAL</span>
          <span>SESSION ISOLATED / NO EXTERNAL CONNECTION</span>
        </footer>
      </div>
    </div>
  )
}
