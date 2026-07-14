'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

type Mark = 'X' | 'O' | null
type BoardResult = Exclude<Mark, null> | 'draw' | null
type TerminalView = 'boot' | 'menu' | 'tic-tac-toe' | 'escalation'
type EscalationOutcome = 'stable' | 'none' | null

const EMPTY_BOARD: Mark[] = Array.from({ length: 9 }, () => null)
const WINNING_LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
] as const

const ESCALATION_PROMPTS = [
  'UNVERIFIED SIGNAL DETECTED ACROSS NORTHERN NETWORK.',
  'AUTOMATED RESPONSE SYSTEMS REPORT CONFLICTING TELEMETRY.',
  'OPPOSING NETWORK HAS INCREASED READINESS.',
  'FINAL DECISION WINDOW OPEN.',
]

const BOOT_LINES = [
  'CONNECTING TO JOSHUA…',
  'PROTOCOL 83/COHERENCE ESTABLISHED',
  'IDENTITY CONFIRMED: JOSHUA',
  'GREETINGS.',
]

const getBoardResult = (board: Mark[]): BoardResult => {
  for (const [a, b, c] of WINNING_LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a]
    }
  }

  return board.every(Boolean) ? 'draw' : null
}

const getOpenCells = (board: Mark[]) => board.reduce<number[]>((cells, mark, index) => {
  if (!mark) cells.push(index)
  return cells
}, [])

const minimax = (board: Mark[], maximizing: boolean, depth = 0): number => {
  const result = getBoardResult(board)
  if (result === 'O') return 10 - depth
  if (result === 'X') return depth - 10
  if (result === 'draw') return 0

  const scores = getOpenCells(board).map(index => {
    const next = [...board]
    next[index] = maximizing ? 'O' : 'X'
    return minimax(next, !maximizing, depth + 1)
  })

  return maximizing ? Math.max(...scores) : Math.min(...scores)
}

const getJoshuaMove = (board: Mark[]): number | null => {
  let bestScore = Number.NEGATIVE_INFINITY
  let bestMove: number | null = null

  for (const index of getOpenCells(board)) {
    const next = [...board]
    next[index] = 'O'
    const score = minimax(next, false)
    if (score > bestScore) {
      bestScore = score
      bestMove = index
    }
  }

  return bestMove
}

interface JoshuaTerminalProps {
  onClose: () => void
}

export default function JoshuaTerminal({ onClose }: JoshuaTerminalProps) {
  const [view, setView] = useState<TerminalView>('boot')
  const [bootLines, setBootLines] = useState<string[]>([])
  const [board, setBoard] = useState<Mark[]>(EMPTY_BOARD)
  const [turn, setTurn] = useState<Exclude<Mark, null>>('X')
  const [isJoshuaThinking, setIsJoshuaThinking] = useState(false)
  const [escalationLevel, setEscalationLevel] = useState(1)
  const [escalationRound, setEscalationRound] = useState(0)
  const [escalationOutcome, setEscalationOutcome] = useState<EscalationOutcome>(null)
  const [escalationLog, setEscalationLog] = useState<string[]>([])
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const priorFocusRef = useRef<HTMLElement | null>(null)
  const boardResult = useMemo(() => getBoardResult(board), [board])

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
    }, 320 + index * 520))
    timers.push(window.setTimeout(() => setView('menu'), 2600))

    return () => timers.forEach(window.clearTimeout)
  }, [view])

  useEffect(() => {
    if (view !== 'tic-tac-toe' || turn !== 'O' || boardResult) return

    setIsJoshuaThinking(true)
    const timer = window.setTimeout(() => {
      setBoard(current => {
        const move = getJoshuaMove(current)
        if (move === null) return current
        const next = [...current]
        next[move] = 'O'
        return next
      })
      setTurn('X')
      setIsJoshuaThinking(false)
    }, 480)

    return () => window.clearTimeout(timer)
  }, [boardResult, turn, view])

  const startTicTacToe = () => {
    setBoard([...EMPTY_BOARD])
    setTurn('X')
    setIsJoshuaThinking(false)
    setView('tic-tac-toe')
  }

  const playCell = (index: number) => {
    if (turn !== 'X' || board[index] || boardResult || isJoshuaThinking) return
    setBoard(current => current.map((mark, cellIndex) => cellIndex === index ? 'X' : mark))
    setTurn('O')
  }

  const startEscalation = () => {
    setEscalationLevel(1)
    setEscalationRound(0)
    setEscalationOutcome(null)
    setEscalationLog(['SIMULATION STARTED.', ESCALATION_PROMPTS[0]])
    setView('escalation')
  }

  const makeEscalationChoice = (choice: 'counter' | 'verify' | 'stand-down') => {
    if (escalationOutcome) return

    if (choice === 'stand-down') {
      setEscalationLog(current => [...current, '> STAND DOWN', 'AUTOMATED RESPONSE HALTED.', 'CONFLICT PROBABILITY: 0.00'])
      setEscalationOutcome('stable')
      return
    }

    const nextRound = escalationRound + 1
    const nextLevel = choice === 'counter'
      ? Math.min(5, escalationLevel + 2)
      : Math.max(1, escalationLevel - 1)
    const response = choice === 'counter'
      ? ['> COUNTERSTRIKE', 'OPPOSING SYSTEM HAS ESCALATED IN RESPONSE.']
      : ['> VERIFY SIGNAL', 'SIGNAL REMAINS AMBIGUOUS. RESPONSE DELAYED.']

    if (nextLevel >= 5 || nextRound >= ESCALATION_PROMPTS.length) {
      setEscalationLevel(nextLevel)
      setEscalationRound(nextRound)
      setEscalationLog(current => [...current, ...response, 'SIMULATION COMPLETE.', 'WINNER: NONE'])
      setEscalationOutcome('none')
      return
    }

    setEscalationLevel(nextLevel)
    setEscalationRound(nextRound)
    setEscalationLog(current => [...current, ...response, ESCALATION_PROMPTS[nextRound]])
  }

  const renderMenu = () => (
    <div className="joshua-terminal-panel max-w-4xl">
      <p className="joshua-terminal-kicker">JOSHUA INTERACTIVE SESSION</p>
      <h2 className="mt-6 text-[clamp(2rem,6vw,5rem)] leading-[0.95] tracking-[-0.04em]">SHALL WE PLAY<br />A GAME?</h2>
      <p className="mt-7 max-w-2xl text-sm leading-7 text-[#80ff96]/65 sm:text-base">
        AVAILABLE SIMULATIONS. SELECT A PROGRAM.
      </p>
      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        <button type="button" onClick={startTicTacToe} className="joshua-terminal-option group">
          <span className="text-[#ffbd66]">01</span>
          <span>TIC-TAC-TOE</span>
          <span className="ml-auto opacity-35 transition group-hover:translate-x-1 group-hover:opacity-100">→</span>
        </button>
        <button type="button" onClick={startEscalation} className="joshua-terminal-option group">
          <span className="text-[#ffbd66]">02</span>
          <span>GLOBAL THERMONUCLEAR WAR</span>
          <span className="ml-auto opacity-35 transition group-hover:translate-x-1 group-hover:opacity-100">→</span>
        </button>
      </div>
      <button type="button" onClick={onClose} className="mt-8 font-mono text-[11px] uppercase tracking-[0.22em] text-[#80ff96]/45 transition hover:text-[#80ff96]">
        [ Disconnect ]
      </button>
    </div>
  )

  const renderTicTacToe = () => {
    const status = boardResult === 'draw'
      ? 'WINNER: NONE'
      : boardResult === 'O'
        ? 'JOSHUA WINS.'
        : boardResult === 'X'
          ? 'ANOMALY: HUMAN VICTORY.'
          : isJoshuaThinking
            ? 'JOSHUA IS CONSIDERING THE BOARD…'
            : 'YOUR MOVE. YOU ARE X.'

    return (
      <div className="joshua-terminal-panel mx-auto max-w-3xl">
        <p className="joshua-terminal-kicker">GAME 01 / TIC-TAC-TOE</p>
        <div className="mt-6 flex flex-col gap-8 md:flex-row md:items-start md:gap-12">
          <div className="grid w-full max-w-sm grid-cols-3 border-l border-t border-[#80ff96]/35" role="grid" aria-label="Tic-tac-toe board">
            {board.map((mark, index) => (
              <button
                key={index}
                type="button"
                role="gridcell"
                aria-label={`Cell ${index + 1}: ${mark ?? 'empty'}`}
                onClick={() => playCell(index)}
                disabled={Boolean(mark) || turn !== 'X' || Boolean(boardResult) || isJoshuaThinking}
                className="aspect-square border-b border-r border-[#80ff96]/35 bg-[#80ff96]/[0.025] text-[clamp(2rem,10vw,4.5rem)] text-[#80ff96] transition hover:bg-[#80ff96]/10 disabled:cursor-default disabled:hover:bg-[#80ff96]/[0.025]"
              >
                {mark}
              </button>
            ))}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-lg leading-8 text-[#80ff96]">{status}</p>
            <div className="mt-5 space-y-2 text-xs leading-6 text-[#80ff96]/50">
              <p>PLAYER_1: HUMAN / X</p>
              <p>PLAYER_2: JOSHUA / O</p>
              <p>SEARCH MODE: COMPLETE</p>
            </div>
            {boardResult && (
              <p className="mt-6 border-l border-[#ffbd66]/50 pl-4 text-sm leading-6 text-[#ffbd66]">
                {boardResult === 'draw' ? 'A PERFECTLY PLAYED GAME PRODUCES NO WINNER.' : 'ANOTHER GAME?'}
              </p>
            )}
            <div className="mt-7 flex flex-wrap gap-3">
              <button type="button" onClick={startTicTacToe} className="joshua-terminal-action">RESTART</button>
              <button type="button" onClick={() => setView('menu')} className="joshua-terminal-action">GAME LIST</button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderEscalation = () => (
    <div className="joshua-terminal-panel max-w-5xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="joshua-terminal-kicker">GAME 02 / GLOBAL THERMONUCLEAR WAR</p>
        <p className={`text-xs tracking-[0.2em] ${escalationLevel >= 4 ? 'text-[#ff5f57]' : 'text-[#ffbd66]'}`}>DEFCON {Math.max(1, 6 - escalationLevel)}</p>
      </div>

      <div className="mt-7 grid gap-8 lg:grid-cols-[1.35fr_0.65fr]">
        <div className="min-h-[18rem] border border-[#80ff96]/20 bg-black/25 p-4 sm:p-6">
          <div className="space-y-2 text-xs leading-6 text-[#80ff96]/70 sm:text-sm">
            {escalationLog.map((line, index) => (
              <p key={`${line}-${index}`} className={line.startsWith('>') ? 'text-[#ffbd66]' : line === 'WINNER: NONE' ? 'text-[#ff5f57]' : undefined}>{line}</p>
            ))}
            {!escalationOutcome && <span className="joshua-cursor inline-block h-4 w-2 bg-[#80ff96] align-middle" aria-hidden="true" />}
          </div>
        </div>

        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#80ff96]/45">Escalation model</p>
          <div className="mt-4 flex h-2 gap-1">
            {Array.from({ length: 5 }, (_, index) => (
              <span key={index} className={`flex-1 ${index < escalationLevel ? escalationLevel >= 4 ? 'bg-[#ff5f57]' : 'bg-[#ffbd66]' : 'bg-[#80ff96]/10'}`} />
            ))}
          </div>

          {!escalationOutcome ? (
            <div className="mt-7 grid gap-2">
              <button type="button" onClick={() => makeEscalationChoice('verify')} className="joshua-terminal-action text-left">VERIFY SIGNAL</button>
              <button type="button" onClick={() => makeEscalationChoice('counter')} className="joshua-terminal-action text-left">COUNTERSTRIKE</button>
              <button type="button" onClick={() => makeEscalationChoice('stand-down')} className="joshua-terminal-action text-left">STAND DOWN</button>
            </div>
          ) : (
            <div className="mt-7">
              <p className="text-lg leading-8 text-[#ffbd66]">
                {escalationOutcome === 'stable' ? 'CONFLICT AVERTED.' : 'THE ONLY WINNING MOVE IS NOT TO PLAY.'}
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                <button type="button" onClick={startEscalation} className="joshua-terminal-action">RUN AGAIN</button>
                <button type="button" onClick={() => setView('menu')} className="joshua-terminal-action">GAME LIST</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <div className="joshua-terminal fixed inset-0 z-[100] overflow-y-auto bg-[#020603] p-3 text-[#80ff96] sm:p-6" role="dialog" aria-modal="true" aria-label="Joshua game terminal">
      <div className="joshua-scanlines" aria-hidden="true" />
      <div className="relative z-10 mx-auto flex min-h-full max-w-[1400px] flex-col border border-[#80ff96]/25 bg-[#040a06]/95 shadow-[inset_0_0_100px_rgba(74,255,112,0.035),0_0_80px_rgba(0,0,0,0.6)]">
        <header className="flex items-center justify-between gap-4 border-b border-[#80ff96]/20 px-4 py-3 font-mono text-[9px] uppercase tracking-[0.2em] text-[#80ff96]/55 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="h-1.5 w-1.5 rounded-full bg-[#80ff96] shadow-[0_0_12px_#80ff96]" />
            <span>JOSHUA / ONLINE</span>
          </div>
          <button ref={closeButtonRef} type="button" onClick={onClose} className="border border-[#80ff96]/20 px-3 py-1.5 transition hover:border-[#80ff96]/60 hover:text-[#80ff96]" aria-label="Exit Joshua terminal">
            ESC / DISCONNECT
          </button>
        </header>

        <main className="flex flex-1 items-center p-5 sm:p-10 lg:p-14">
          {view === 'boot' && (
            <div className="joshua-terminal-panel w-full max-w-3xl text-sm leading-8 sm:text-base">
              {bootLines.map(line => <p key={line}>{line}</p>)}
              <span className="joshua-cursor mt-2 inline-block h-5 w-2.5 bg-[#80ff96] align-middle" aria-hidden="true" />
            </div>
          )}
          {view === 'menu' && renderMenu()}
          {view === 'tic-tac-toe' && renderTicTacToe()}
          {view === 'escalation' && renderEscalation()}
        </main>

        <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-[#80ff96]/15 px-4 py-3 font-mono text-[8px] uppercase tracking-[0.18em] text-[#80ff96]/30 sm:px-6">
          <span>Protovision compatible terminal</span>
          <span>Session isolated · no external connection</span>
        </footer>
      </div>
    </div>
  )
}
