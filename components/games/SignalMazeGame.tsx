'use client'

import { useCallback, useEffect, useState } from 'react'

type Point = { x: number; y: number }
type Direction = 'up' | 'down' | 'left' | 'right'
type MazeState = { player: Point; enemies: Point[]; dots: string[]; score: number; lives: number; status: 'ready' | 'playing' | 'won' | 'lost' }

const MAZE = [
  '#################',
  '#.......#.......#',
  '#.###.#.#.#.###.#',
  '#.....#...#.....#',
  '###.#.#####.#.###',
  '#...#...#...#...#',
  '#.#####.#.#####.#',
  '#...............#',
  '#.#####.#.#####.#',
  '#...#...#...#...#',
  '###.#.#####.#.###',
  '#.....#...#.....#',
  '#################',
]
const PLAYER_START = { x: 1, y: 1 }
const ENEMY_STARTS = [{ x: 15, y: 7 }, { x: 8, y: 7 }]
const DELTAS: Record<Direction, Point> = {
  up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 },
}

const keyFor = ({ x, y }: Point) => `${x}:${y}`
const isOpen = ({ x, y }: Point) => MAZE[y]?.[x] !== '#'
const samePoint = (a: Point, b: Point) => a.x === b.x && a.y === b.y
const initialDots = () => MAZE.flatMap((row, y) => Array.from(row).flatMap((cell, x) => cell === '.' ? [`${x}:${y}`] : []))
const initialState = (): MazeState => ({ player: PLAYER_START, enemies: ENEMY_STARTS, dots: initialDots(), score: 0, lives: 3, status: 'ready' })

const moveEnemy = (enemy: Point, player: Point, enemyIndex: number) => {
  const choices = (Object.keys(DELTAS) as Direction[])
    .map(direction => ({ x: enemy.x + DELTAS[direction].x, y: enemy.y + DELTAS[direction].y }))
    .filter(isOpen)
    .sort((a, b) => {
      const aDistance = Math.abs(a.x - player.x) + Math.abs(a.y - player.y)
      const bDistance = Math.abs(b.x - player.x) + Math.abs(b.y - player.y)
      return enemyIndex === 0 ? aDistance - bDistance : bDistance - aDistance
    })
  return choices[0] ?? enemy
}

interface SignalMazeGameProps { onBack: () => void }

export default function SignalMazeGame({ onBack }: SignalMazeGameProps) {
  const [game, setGame] = useState<MazeState>(initialState)

  const move = useCallback((direction: Direction) => {
    setGame(current => {
      if (current.status === 'won' || current.status === 'lost') return current
      const delta = DELTAS[direction]
      const candidate = { x: current.player.x + delta.x, y: current.player.y + delta.y }
      const player = isOpen(candidate) ? candidate : current.player
      const enemies = current.enemies.map((enemy, index) => moveEnemy(enemy, player, index))
      const collided = enemies.some(enemy => samePoint(enemy, player)) || current.enemies.some(enemy => samePoint(enemy, player))
      const dot = keyFor(player)
      const ateDot = current.dots.includes(dot)
      const dots = ateDot ? current.dots.filter(item => item !== dot) : current.dots
      const score = current.score + (ateDot ? 10 : 0)
      if (collided) {
        const lives = current.lives - 1
        return { ...current, player: PLAYER_START, enemies: ENEMY_STARTS, dots, score, lives, status: lives <= 0 ? 'lost' : 'playing' }
      }
      return { ...current, player, enemies, dots, score, status: dots.length === 0 ? 'won' : 'playing' }
    })
  }, [])

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      const directionByKey: Record<string, Direction | undefined> = {
        ArrowUp: 'up', w: 'up', ArrowDown: 'down', s: 'down', ArrowLeft: 'left', a: 'left', ArrowRight: 'right', d: 'right',
      }
      const direction = directionByKey[event.key]
      if (direction) {
        event.preventDefault()
        move(direction)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [move])

  const dotSet = new Set(game.dots)

  return (
    <div className="joshua-terminal-panel mx-auto w-full max-w-5xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="joshua-terminal-kicker">PROGRAM 03 / SIGNAL MAZE</p>
          <p className="mt-2 text-xs text-[#80ff96]/50">CLEAR THE NETWORK. AVOID THE TRACKING PROCESSES.</p>
        </div>
        <div className="flex gap-5 text-xs tracking-[0.14em]">
          <span>SCORE {String(game.score).padStart(5, '0')}</span>
          <span className={game.lives === 1 ? 'text-[#ff5f57]' : 'text-[#ffbd66]'}>LINKS {game.lives}</span>
        </div>
      </div>

      <div className="mt-5 grid gap-7 lg:grid-cols-[minmax(18rem,38rem)_1fr] lg:items-center">
        <div className="maze-grid aspect-[17/13] w-full border border-[#80ff96]/30 bg-black/35 p-2" role="img" aria-label="Signal maze game board">
          {MAZE.flatMap((row, y) => Array.from(row).map((cell, x) => {
            const point = { x, y }
            const isPlayer = samePoint(game.player, point)
            const enemyIndex = game.enemies.findIndex(enemy => samePoint(enemy, point))
            return (
              <span key={`${x}:${y}`} className={`maze-cell ${cell === '#' ? 'maze-wall' : ''}`}>
                {dotSet.has(`${x}:${y}`) && !isPlayer && enemyIndex < 0 ? <i className="maze-dot" /> : null}
                {isPlayer ? <b className="maze-player" aria-hidden="true">◖</b> : null}
                {enemyIndex >= 0 ? <b className={enemyIndex === 0 ? 'maze-enemy' : 'maze-enemy maze-enemy-amber'} aria-hidden="true">◆</b> : null}
              </span>
            )
          }))}
        </div>

        <div>
          <p className="text-sm leading-7 text-[#80ff96]">
            {game.status === 'won' ? 'NETWORK CLEARED.' : game.status === 'lost' ? 'SIGNAL LOST.' : game.status === 'ready' ? 'AWAITING DIRECTION.' : 'TRACKING PROCESSES ACTIVE.'}
          </p>
          <p className="mt-3 text-xs leading-6 text-[#80ff96]/45">USE ARROW KEYS, W/A/S/D, OR DIRECTION ARRAY.</p>
          <div className="mt-6 grid w-36 grid-cols-3 gap-2" aria-label="Maze direction controls">
            <span />
            <button type="button" onClick={() => move('up')} className="joshua-terminal-action px-0" aria-label="Move up">↑</button>
            <span />
            <button type="button" onClick={() => move('left')} className="joshua-terminal-action px-0" aria-label="Move left">←</button>
            <button type="button" onClick={() => move('down')} className="joshua-terminal-action px-0" aria-label="Move down">↓</button>
            <button type="button" onClick={() => move('right')} className="joshua-terminal-action px-0" aria-label="Move right">→</button>
          </div>
          <div className="mt-7 flex flex-wrap gap-3">
            <button type="button" onClick={() => setGame(initialState())} className="joshua-terminal-action">RESTART</button>
            <button type="button" onClick={onBack} className="joshua-terminal-action">GAME LIST</button>
          </div>
        </div>
      </div>
    </div>
  )
}
