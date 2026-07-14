'use client'

import { useCallback, useEffect, useState } from 'react'

type Point = { x: number; y: number }
type Direction = 'up' | 'down' | 'left' | 'right'
type MazeState = {
  ant: Point
  spiders: Point[]
  spiderDirections: Direction[]
  food: string[]
  trail: string[]
  score: number
  scouts: number
  status: 'ready' | 'playing' | 'caught' | 'won' | 'lost'
  direction: Direction
  queuedDirection: Direction | null
  capturedBy: number | null
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
const SPIDER_START_DIRECTIONS: Direction[] = ['left', 'left']
const DELTAS: Record<Direction, Point> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
}
const DIRECTIONS = Object.keys(DELTAS) as Direction[]
const ROTATION_BY_DIRECTION: Record<Direction, number> = {
  up: -90,
  down: 90,
  left: 180,
  right: 0,
}

const keyFor = ({ x, y }: Point) => `${x}:${y}`
const isOpen = ({ x, y }: Point) => MAZE[y]?.[x] !== '#'
const samePoint = (a: Point, b: Point) => a.x === b.x && a.y === b.y
const advance = (point: Point, direction: Direction) => ({
  x: point.x + DELTAS[direction].x,
  y: point.y + DELTAS[direction].y,
})
const OPEN_POINTS = MAZE.flatMap((row, y) => Array.from(row).flatMap((cell, x) => (
  cell === '.' ? [{ x, y }] : []
)))
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
  spiderDirections: SPIDER_START_DIRECTIONS,
  food: initialFood(),
  trail: [],
  score: 0,
  scouts: 3,
  status: 'ready',
  direction: 'right',
  queuedDirection: null,
  capturedBy: null,
  tick: 0,
})

const distanceBetween = (a: Point, b: Point) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y)
const directionBetween = (from: Point, to: Point, fallback: Direction): Direction => {
  if (to.x > from.x) return 'right'
  if (to.x < from.x) return 'left'
  if (to.y > from.y) return 'down'
  if (to.y < from.y) return 'up'
  return fallback
}

const closestOpenPoint = (target: Point) => {
  let closest = OPEN_POINTS[0]
  let closestDistance = distanceBetween(closest, target)
  for (let index = 1; index < OPEN_POINTS.length; index += 1) {
    const candidate = OPEN_POINTS[index]
    const candidateDistance = distanceBetween(candidate, target)
    if (candidateDistance < closestDistance) {
      closest = candidate
      closestDistance = candidateDistance
    }
  }
  return closest
}

// The hunter is quick but greedy: it only chooses the locally closest move.
const moveHunter = (spider: Point, ant: Point) => {
  let bestMove = spider
  let bestDistance = Number.POSITIVE_INFINITY
  for (const direction of DIRECTIONS) {
    const candidate = advance(spider, direction)
    if (!isOpen(candidate)) continue
    const candidateDistance = distanceBetween(candidate, ant)
    if (candidateDistance < bestDistance) {
      bestMove = candidate
      bestDistance = candidateDistance
    }
  }
  return bestMove
}

// The stalker is slower, but follows the shortest path to where the ant is heading.
const moveStalker = (spider: Point, ant: Point, antDirection: Direction, antMoved: boolean) => {
  const heading = DELTAS[antDirection]
  const predictedAnt = antMoved
    ? { x: ant.x + heading.x * 4, y: ant.y + heading.y * 4 }
    : ant
  const target = closestOpenPoint(predictedAnt)
  const queue: Array<{ point: Point; firstStep: Point | null }> = [{ point: spider, firstStep: null }]
  const visited = new Set([keyFor(spider)])

  while (queue.length > 0) {
    const current = queue.shift()
    if (!current) break
    if (samePoint(current.point, target)) return current.firstStep ?? spider

    for (const direction of DIRECTIONS) {
      const candidate = advance(current.point, direction)
      const candidateKey = keyFor(candidate)
      if (!isOpen(candidate) || visited.has(candidateKey)) continue
      visited.add(candidateKey)
      queue.push({ point: candidate, firstStep: current.firstStep ?? candidate })
    }
  }

  return spider
}

function AntGlyph({ direction, legend = false, active = false, caught = false }: { direction: Direction; legend?: boolean; active?: boolean; caught?: boolean }) {
  return (
    <i className={`maze-ant${legend ? ' maze-ant-legend' : ''}${active ? ' maze-ant-active' : ''}${caught ? ' maze-ant-caught' : ''}`} style={{ transform: `rotate(${ROTATION_BY_DIRECTION[direction]}deg)` }} aria-hidden="true">
      <span className="maze-ant-head" />
      <span className="maze-ant-legs" />
    </i>
  )
}

function SpiderGlyph({ direction, stalker = false, legend = false, active = false, capturing = false }: { direction: Direction; stalker?: boolean; legend?: boolean; active?: boolean; capturing?: boolean }) {
  return (
    <i className={`maze-spider${stalker ? ' maze-spider-stalker' : ''}${legend ? ' maze-spider-legend' : ''}${active ? ' maze-spider-active' : ''}${capturing ? ' maze-spider-capturing' : ''}`} style={{ transform: `rotate(${ROTATION_BY_DIRECTION[direction]}deg)` }} aria-hidden="true">
      <span className="maze-spider-body" />
      <span className="maze-spider-head" />
    </i>
  )
}

const actorPosition = ({ x, y }: Point) => ({ transform: `translate(${x * 100}%, ${y * 100}%)` })

interface SignalMazeGameProps { onBack: () => void }

export default function SignalMazeGame({ onBack }: SignalMazeGameProps) {
  const [game, setGame] = useState<MazeState>(initialState)

  const setCourse = useCallback((direction: Direction) => {
    setGame(current => {
      if (current.status === 'caught' || current.status === 'won' || current.status === 'lost') return current
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

        const spiders = current.spiders.map((spider, index) => {
          if (index === 0 && current.tick % 2 === 1) return moveHunter(spider, ant)
          if (index === 1 && current.tick % 4 === 2) return moveStalker(spider, ant, direction, moved)
          return spider
        })
        const spiderDirections = spiders.map((spider, index) => (
          directionBetween(current.spiders[index], spider, current.spiderDirections[index])
        ))
        const directCapture = spiders.findIndex(spider => samePoint(spider, ant))
        const crossingCapture = current.spiders.findIndex((spider, index) => (
          samePoint(spider, ant) && samePoint(spiders[index], current.ant)
        ))
        const capturedBy = directCapture >= 0 ? directCapture : crossingCapture

        const provision = keyFor(ant)
        const gatheredFood = current.food.includes(provision)
        const food = gatheredFood ? current.food.filter(item => item !== provision) : current.food
        const score = current.score + (gatheredFood ? 10 : 0)

        if (capturedBy >= 0) {
          const scouts = current.scouts - 1
          const capturePoint = directCapture >= 0 ? ant : spiders[capturedBy]
          return {
            ...current,
            ant: capturePoint,
            spiders,
            spiderDirections,
            food,
            trail,
            score,
            scouts,
            status: 'caught',
            direction,
            queuedDirection: null,
            capturedBy,
            tick: current.tick + 1,
          }
        }

        return {
          ...current,
          ant,
          spiders,
          spiderDirections,
          food,
          trail,
          score,
          status: food.length === 0 ? 'won' : 'playing',
          direction,
          queuedDirection,
          tick: current.tick + 1,
        }
      })
    }, 165)

    return () => window.clearInterval(timer)
  }, [game.status])

  useEffect(() => {
    if (game.status !== 'caught') return

    const resetTimer = window.setTimeout(() => {
      setGame(current => {
        if (current.status !== 'caught') return current
        return {
          ...current,
          ant: ANT_START,
          spiders: SPIDER_STARTS,
          spiderDirections: SPIDER_START_DIRECTIONS,
          trail: [],
          status: current.scouts <= 0 ? 'lost' : 'ready',
          direction: 'right',
          queuedDirection: null,
          capturedBy: null,
          tick: 0,
        }
      })
    }, 1050)

    return () => window.clearTimeout(resetTimer)
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
      : game.status === 'caught'
        ? 'PREDATOR CONTACT. SCOUT SIGNAL COLLAPSING.'
      : game.status === 'ready' && game.scouts < 3
        ? 'SCOUT LOST. CHOOSE A DIRECTION TO RESUME.'
        : game.status === 'ready'
          ? 'SET A PHEROMONE COURSE. THE HUNTER CHASES. THE STALKER ANTICIPATES.'
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
            <span><SpiderGlyph direction="right" legend /> HUNTER / FAST</span>
            <span><SpiderGlyph direction="right" stalker legend /> STALKER / SMART</span>
            <span><i className="maze-legend-food" aria-hidden="true" /> FOOD</span>
          </div>
          <div className="maze-grid mt-3 aspect-[17/13] w-full border border-[#80ff96]/30 bg-black/35 p-2" role="img" aria-label={`Colony Protocol game board. ${game.food.length} provisions remain.`}>
            <div className={`maze-grid-surface${game.status === 'caught' ? ' maze-grid-caught' : ''}`}>
              {MAZE.flatMap((row, y) => Array.from(row).map((cell, x) => {
                const point = { x, y }
                const isAnt = samePoint(game.ant, point)
                const spiderIndex = game.spiders.findIndex(spider => samePoint(spider, point))
                const pheromoneAge = trailIndex.get(`${x}:${y}`)
                return (
                  <span key={`${x}:${y}`} className={`maze-cell ${cell === '#' ? 'maze-wall' : ''}`}>
                    {pheromoneAge !== undefined ? <i className="maze-pheromone" style={{ opacity: Math.max(0.12, 0.48 - pheromoneAge * 0.065) }} aria-hidden="true" /> : null}
                    {foodSet.has(`${x}:${y}`) && !isAnt && spiderIndex < 0 ? <i className="maze-food" aria-hidden="true" /> : null}
                  </span>
                )
              }))}
              <span className="maze-actor maze-actor-ant" style={actorPosition(game.ant)} aria-hidden="true">
                <AntGlyph direction={game.direction} active={game.status === 'playing'} caught={game.status === 'caught'} />
              </span>
              {game.spiders.map((spider, index) => (
                <span key={`spider-${index}`} className={`maze-actor ${index === 0 ? 'maze-actor-hunter' : 'maze-actor-stalker'}${game.status === 'caught' && game.capturedBy === index ? ' maze-actor-capturing' : ''}`} style={actorPosition(spider)} aria-hidden="true">
                  <SpiderGlyph direction={game.spiderDirections[index]} stalker={index === 1} active={game.status === 'playing'} capturing={game.status === 'caught' && game.capturedBy === index} />
                </span>
              ))}
            </div>
          </div>
        </div>

        <div>
          <p className="min-h-14 text-sm leading-7 text-[#80ff96]" aria-live="polite">{statusMessage}</p>
          <p className="mt-3 text-xs leading-6 text-[#80ff96]/45">PRESS ONCE TO SEND THE SCOUT. THE FAST HUNTER FOLLOWS. THE SLOW STALKER READS AHEAD.</p>
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
