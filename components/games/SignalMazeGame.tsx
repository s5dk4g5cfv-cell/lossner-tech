'use client'

import { useCallback, useEffect, useState } from 'react'

type Point = { x: number; y: number }
type Direction = 'up' | 'down' | 'left' | 'right'
type MazeState = {
  ant: Point
  spiders: Point[]
  food: string[]
  trail: string[]
  score: number
  scouts: number
  status: 'ready' | 'playing' | 'won' | 'lost'
  direction: Direction
  queuedDirection: Direction | null
  tick: number
}

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
  '###.#.#.###.#.###',
  '#.....#...#.....#',
  '#################',
]
const ANT_START = { x: 1, y: 1 }
const SPIDER_STARTS = [{ x: 15, y: 7 }, { x: 8, y: 7 }]
const DELTAS: Record<Direction, Point> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
}

const keyFor = ({ x, y }: Point) => `${x}:${y}`
const isOpen = ({ x, y }: Point) => MAZE[y]?.[x] !== '#'
const samePoint = (a: Point, b: Point) => a.x === b.x && a.y === b.y
const advance = (point: Point, direction: Direction) => ({
  x: point.x + DELTAS[direction].x,
  y: point.y + DELTAS[direction].y,
})
const initialFood = () => {
  const occupiedStarts = new Set([keyFor(ANT_START), ...SPIDER_STARTS.map(keyFor)])
  return MAZE.flatMap((row, y) => Array.from(row).flatMap((cell, x) => {
    const key = `${x}:${y}`
    return cell === '.' && !occupiedStarts.has(key) ? [key] : []
  }))
}
const initialState = (): MazeState => ({
  ant: ANT_START,
  spiders: SPIDER_STARTS,
  food: initialFood(),
  trail: [],
  score: 0,
  scouts: 3,
  status: 'ready',
  direction: 'right',
  queuedDirection: null,
  tick: 0,
})

const moveSpider = (spider: Point, ant: Point, antDirection: Direction, spiderIndex: number) => {
  const direction = DELTAS[antDirection]
  const target = spiderIndex === 0
    ? ant
    : { x: ant.x + direction.x * 3, y: ant.y + direction.y * 3 }
  const choices = (Object.keys(DELTAS) as Direction[])
    .map(candidateDirection => advance(spider, candidateDirection))
    .filter(isOpen)
    .sort((a, b) => {
      const aDistance = Math.abs(a.x - target.x) + Math.abs(a.y - target.y)
      const bDistance = Math.abs(b.x - target.x) + Math.abs(b.y - target.y)
      return aDistance - bDistance
    })
  return choices[0] ?? spider
}

function AntGlyph({ direction, legend = false }: { direction: Direction; legend?: boolean }) {
  return (
    <i className={`maze-ant maze-ant-${direction}${legend ? ' maze-ant-legend' : ''}`} aria-hidden="true">
      <span className="maze-ant-head" />
      <span className="maze-ant-legs" />
    </i>
  )
}

function SpiderGlyph({ stalker = false, legend = false }: { stalker?: boolean; legend?: boolean }) {
  return (
    <i className={`maze-spider${stalker ? ' maze-spider-stalker' : ''}${legend ? ' maze-spider-legend' : ''}`} aria-hidden="true">
      <span />
    </i>
  )
}

interface SignalMazeGameProps { onBack: () => void }

export default function SignalMazeGame({ onBack }: SignalMazeGameProps) {
  const [game, setGame] = useState<MazeState>(initialState)

  const setCourse = useCallback((direction: Direction) => {
    setGame(current => {
      if (current.status === 'won' || current.status === 'lost') return current
      if (current.status === 'ready' && !isOpen(advance(current.ant, direction))) {
        return { ...current, queuedDirection: direction }
      }
      return {
        ...current,
        status: 'playing',
        queuedDirection: direction,
      }
    })
  }, [])

  useEffect(() => {
    if (game.status !== 'playing') return

    const timer = window.setInterval(() => {
      setGame(current => {
        if (current.status !== 'playing') return current

        const queuedCandidate = current.queuedDirection ? advance(current.ant, current.queuedDirection) : null
        const canTakeQueuedTurn = current.queuedDirection && queuedCandidate && isOpen(queuedCandidate)
        const direction = canTakeQueuedTurn ? current.queuedDirection as Direction : current.direction
        const forward = advance(current.ant, direction)
        const ant = isOpen(forward) ? forward : current.ant
        const queuedDirection = canTakeQueuedTurn ? null : current.queuedDirection
        const moved = !samePoint(ant, current.ant)
        const trail = moved
          ? [keyFor(current.ant), ...current.trail.filter(point => point !== keyFor(current.ant))].slice(0, 6)
          : current.trail

        // Spiders move at half speed so the hunt stays readable instead of punishing.
        const spiders = current.tick % 2 === 1
          ? current.spiders.map((spider, index) => moveSpider(spider, ant, direction, index))
          : current.spiders
        const collided = spiders.some(spider => samePoint(spider, ant)) || current.spiders.some((spider, index) => (
          samePoint(spider, ant) && samePoint(spiders[index], current.ant)
        ))

        const provision = keyFor(ant)
        const gatheredFood = current.food.includes(provision)
        const food = gatheredFood ? current.food.filter(item => item !== provision) : current.food
        const score = current.score + (gatheredFood ? 10 : 0)

        if (collided) {
          const scouts = current.scouts - 1
          return {
            ...current,
            ant: ANT_START,
            spiders: SPIDER_STARTS,
            food,
            trail: [],
            score,
            scouts,
            status: scouts <= 0 ? 'lost' : 'ready',
            direction: 'right',
            queuedDirection: null,
            tick: 0,
          }
        }

        return {
          ...current,
          ant,
          spiders,
          food,
          trail,
          score,
          status: food.length === 0 ? 'won' : 'playing',
          direction,
          queuedDirection,
          tick: current.tick + 1,
        }
      })
    }, 170)

    return () => window.clearInterval(timer)
  }, [game.status])

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      const directionByKey: Record<string, Direction | undefined> = {
        ArrowUp: 'up',
        w: 'up',
        W: 'up',
        ArrowDown: 'down',
        s: 'down',
        S: 'down',
        ArrowLeft: 'left',
        a: 'left',
        A: 'left',
        ArrowRight: 'right',
        d: 'right',
        D: 'right',
      }
      const direction = directionByKey[event.key]
      if (direction) {
        event.preventDefault()
        setCourse(direction)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [setCourse])

  const foodSet = new Set(game.food)
  const trailIndex = new Map(game.trail.map((point, index) => [point, index]))
  const statusMessage = game.status === 'won'
    ? 'COLONY SUPPLIED.'
    : game.status === 'lost'
      ? 'NO SCOUTS REMAIN. RESTART TO TRY AGAIN.'
      : game.status === 'ready' && game.scouts < 3
        ? 'SCOUT LOST. CHOOSE A DIRECTION TO RESUME.'
        : game.status === 'ready'
          ? 'SET A PHEROMONE COURSE. THE SCOUT WILL KEEP MOVING.'
          : game.queuedDirection
            ? `PHEROMONE TURN ${game.queuedDirection.toUpperCase()} QUEUED.`
            : 'SCOUT ACTIVE. SPIDERS IN PURSUIT.'

  return (
    <div className="joshua-terminal-panel mx-auto w-full max-w-5xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="joshua-terminal-kicker">PROGRAM 03 / COLONY PROTOCOL</p>
          <p className="mt-2 text-xs text-[#80ff96]/50">GATHER PROVISIONS. OUTRUN THE SPIDERS.</p>
        </div>
        <div className="flex gap-5 text-xs tracking-[0.14em]">
          <span>PROVISIONS {String(game.score).padStart(5, '0')}</span>
          <span className={game.scouts === 1 ? 'text-[#ff5f57]' : 'text-[#ffbd66]'}>SCOUTS {game.scouts}</span>
        </div>
      </div>

      <div className="mt-5 grid gap-7 lg:grid-cols-[minmax(18rem,38rem)_1fr] lg:items-center">
        <div>
          <div className="maze-legend" aria-label="Game legend">
            <span><AntGlyph direction="right" legend /> ANT / YOU</span>
            <span><SpiderGlyph legend /> SPIDERS / PREDATORS</span>
            <span><i className="maze-legend-food" aria-hidden="true" /> FOOD</span>
          </div>
          <div className="maze-grid mt-3 aspect-[17/13] w-full border border-[#80ff96]/30 bg-black/35 p-2" role="img" aria-label={`Colony Protocol game board. ${game.food.length} provisions remain.`}>
            {MAZE.flatMap((row, y) => Array.from(row).map((cell, x) => {
              const point = { x, y }
              const isAnt = samePoint(game.ant, point)
              const spiderIndex = game.spiders.findIndex(spider => samePoint(spider, point))
              const pheromoneAge = trailIndex.get(`${x}:${y}`)
              return (
                <span key={`${x}:${y}`} className={`maze-cell ${cell === '#' ? 'maze-wall' : ''}`}>
                  {pheromoneAge !== undefined ? <i className="maze-pheromone" style={{ opacity: Math.max(0.12, 0.48 - pheromoneAge * 0.065) }} aria-hidden="true" /> : null}
                  {foodSet.has(`${x}:${y}`) && !isAnt && spiderIndex < 0 ? <i className="maze-food" aria-hidden="true" /> : null}
                  {isAnt ? <AntGlyph direction={game.direction} /> : null}
                  {spiderIndex >= 0 ? <SpiderGlyph stalker={spiderIndex === 1} /> : null}
                </span>
              )
            }))}
          </div>
        </div>

        <div>
          <p className="min-h-14 text-sm leading-7 text-[#80ff96]" aria-live="polite">{statusMessage}</p>
          <p className="mt-3 text-xs leading-6 text-[#80ff96]/45">PRESS ONCE TO SEND THE SCOUT. CHOOSE ANOTHER DIRECTION TO TURN AT THE NEXT OPEN JUNCTION.</p>
          <div className="mt-6 grid w-36 grid-cols-3 gap-2" aria-label="Set scout direction">
            <span />
            <button type="button" onClick={() => setCourse('up')} className="joshua-terminal-action px-0" aria-label="Send scout up">↑</button>
            <span />
            <button type="button" onClick={() => setCourse('left')} className="joshua-terminal-action px-0" aria-label="Send scout left">←</button>
            <button type="button" onClick={() => setCourse('down')} className="joshua-terminal-action px-0" aria-label="Send scout down">↓</button>
            <button type="button" onClick={() => setCourse('right')} className="joshua-terminal-action px-0" aria-label="Send scout right">→</button>
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
