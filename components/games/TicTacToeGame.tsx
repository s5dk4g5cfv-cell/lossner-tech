'use client'

import { useEffect, useMemo, useState } from 'react'

type Mark = 'X' | 'O' | null
type BoardResult = Exclude<Mark, null> | 'draw' | null

const EMPTY_BOARD: Mark[] = Array.from({ length: 9 }, () => null)
const WINNING_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
] as const

const getBoardResult = (board: Mark[]): BoardResult => {
  for (const [a, b, c] of WINNING_LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a]
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

const getJoshuaMove = (board: Mark[]) => {
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

interface TicTacToeGameProps {
  onBack: () => void
}

export default function TicTacToeGame({ onBack }: TicTacToeGameProps) {
  const [board, setBoard] = useState<Mark[]>(() => [...EMPTY_BOARD])
  const [turn, setTurn] = useState<'X' | 'O'>('X')
  const result = useMemo(() => getBoardResult(board), [board])
  const isThinking = turn === 'O' && !result

  useEffect(() => {
    if (turn !== 'O' || result) return
    const timer = window.setTimeout(() => {
      setBoard(current => {
        const move = getJoshuaMove(current)
        if (move === null) return current
        const next = [...current]
        next[move] = 'O'
        return next
      })
      setTurn('X')
    }, 420)
    return () => window.clearTimeout(timer)
  }, [result, turn])

  const restart = () => {
    setBoard([...EMPTY_BOARD])
    setTurn('X')
  }

  const play = (index: number) => {
    if (turn !== 'X' || board[index] || result || isThinking) return
    setBoard(current => current.map((mark, cell) => cell === index ? 'X' : mark))
    setTurn('O')
  }

  const status = result === 'draw'
    ? 'WINNER: NONE'
    : result === 'O'
      ? 'JOSHUA WINS.'
      : result === 'X'
        ? 'ANOMALY: HUMAN VICTORY.'
        : isThinking ? 'JOSHUA IS CONSIDERING THE BOARD…' : 'YOUR MOVE. YOU ARE X.'

  return (
    <div className="joshua-terminal-panel mx-auto w-full max-w-4xl">
      <p className="joshua-terminal-kicker">PROGRAM 01 / TIC-TAC-TOE</p>
      <div className="mt-6 grid gap-8 md:grid-cols-[minmax(16rem,24rem)_1fr] md:gap-12">
        <div className="grid grid-cols-3 border-l border-t border-[#80ff96]/35" role="grid" aria-label="Tic-tac-toe board">
          {board.map((mark, index) => (
            <button
              key={index}
              type="button"
              role="gridcell"
              aria-label={`Cell ${index + 1}: ${mark ?? 'empty'}`}
              onClick={() => play(index)}
              disabled={Boolean(mark) || turn !== 'X' || Boolean(result) || isThinking}
              className="aspect-square border-b border-r border-[#80ff96]/35 bg-[#80ff96]/[0.025] text-[clamp(2rem,10vw,4.5rem)] text-[#80ff96] transition hover:bg-[#80ff96]/10 disabled:cursor-default disabled:hover:bg-[#80ff96]/[0.025]"
            >
              {mark}
            </button>
          ))}
        </div>
        <div>
          <p className="text-lg leading-8 text-[#80ff96]">{status}</p>
          <div className="mt-5 space-y-2 text-xs leading-6 text-[#80ff96]/50">
            <p>PLAYER_1: HUMAN / X</p>
            <p>PLAYER_2: JOSHUA / O</p>
            <p>SEARCH MODE: COMPLETE</p>
          </div>
          {result && (
            <p className="mt-6 border-l border-[#ffbd66]/50 pl-4 text-sm leading-6 text-[#ffbd66]">
              {result === 'draw' ? 'A PERFECTLY PLAYED GAME PRODUCES NO WINNER.' : 'ANOTHER GAME?'}
            </p>
          )}
          <div className="mt-7 flex flex-wrap gap-3">
            <button type="button" onClick={restart} className="joshua-terminal-action">RESTART</button>
            <button type="button" onClick={onBack} className="joshua-terminal-action">GAME LIST</button>
          </div>
        </div>
      </div>
    </div>
  )
}
