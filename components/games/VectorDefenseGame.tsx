'use client'

import { PointerEvent, useEffect, useRef, useState } from 'react'

type Missile = { id: number; startX: number; targetX: number; progress: number; speed: number }
type Explosion = { id: number; x: number; y: number; age: number }
type DefenseState = {
  missiles: Missile[]
  explosions: Explosion[]
  score: number
  cities: number
  wave: number
  running: boolean
  ticks: number
  nextId: number
}

const CITY_X = [105, 245, 385, 615, 755, 895]
const initialState = (): DefenseState => ({
  missiles: [], explosions: [], score: 0, cities: 6, wave: 1, running: false, ticks: 0, nextId: 1,
})

const explosionRadius = (age: number) => age < 9 ? age * 7 : Math.max(0, (20 - age) * 5.5)

interface VectorDefenseGameProps {
  onBack: () => void
}

export default function VectorDefenseGame({ onBack }: VectorDefenseGameProps) {
  const [game, setGame] = useState<DefenseState>(initialState)
  const fieldRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!game.running) return
    const timer = window.setInterval(() => {
      setGame(current => {
        if (!current.running) return current

        const explosions = current.explosions
          .map(explosion => ({ ...explosion, age: explosion.age + 1 }))
          .filter(explosion => explosion.age < 20)

        const advanced = current.missiles.map(missile => ({ ...missile, progress: missile.progress + missile.speed }))
        let hits = 0
        const surviving = advanced.filter(missile => {
          const x = missile.startX + (missile.targetX - missile.startX) * missile.progress
          const y = 24 + 516 * missile.progress
          const intercepted = explosions.some(explosion => Math.hypot(x - explosion.x, y - explosion.y) < explosionRadius(explosion.age))
          if (intercepted) hits += 1
          return !intercepted && missile.progress < 1
        })
        const impacts = advanced.filter(missile => missile.progress >= 1).length
        const cities = Math.max(0, current.cities - impacts)
        const ticks = current.ticks + 1
        let nextId = current.nextId
        const spawnEvery = Math.max(9, 22 - current.wave * 2)
        if (ticks % spawnEvery === 0 && cities > 0) {
          surviving.push({
            id: nextId,
            startX: 60 + Math.random() * 880,
            targetX: CITY_X[Math.floor(Math.random() * CITY_X.length)],
            progress: 0,
            speed: 0.008 + current.wave * 0.0015 + Math.random() * 0.004,
          })
          nextId += 1
        }
        const wave = 1 + Math.floor(ticks / 300)
        return {
          ...current,
          missiles: surviving,
          explosions,
          score: current.score + hits * 100,
          cities,
          wave,
          running: cities > 0,
          ticks,
          nextId,
        }
      })
    }, 50)
    return () => window.clearInterval(timer)
  }, [game.running])

  const start = () => setGame({ ...initialState(), running: true })

  const detonate = (event: PointerEvent<SVGSVGElement>) => {
    if (!game.running || !fieldRef.current) return
    const box = fieldRef.current.getBoundingClientRect()
    const x = ((event.clientX - box.left) / box.width) * 1000
    const y = ((event.clientY - box.top) / box.height) * 600
    if (y > 550) return
    setGame(current => ({
      ...current,
      explosions: [...current.explosions, { id: current.nextId, x, y, age: 1 }],
      nextId: current.nextId + 1,
    }))
  }

  return (
    <div className="joshua-terminal-panel mx-auto w-full max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="joshua-terminal-kicker">PROGRAM 02 / VECTOR DEFENSE</p>
          <p className="mt-2 text-xs text-[#80ff96]/50">INTERCEPT INCOMING SIGNALS BEFORE IMPACT.</p>
        </div>
        <div className="flex gap-5 text-xs tracking-[0.14em]">
          <span>SCORE {String(game.score).padStart(6, '0')}</span>
          <span className={game.cities <= 2 ? 'text-[#ff5f57]' : 'text-[#ffbd66]'}>CITIES {game.cities}</span>
          <span>WAVE {game.wave}</span>
        </div>
      </div>

      <svg
        ref={fieldRef}
        viewBox="0 0 1000 600"
        role="img"
        aria-label="Vector defense game field. Click or tap near incoming missiles to intercept them."
        onPointerDown={detonate}
        className="mt-5 w-full cursor-crosshair border border-[#80ff96]/30 bg-black/35 touch-none"
      >
        <path d="M0 545H1000" stroke="#80ff96" strokeOpacity=".25" />
        {[100, 500, 900].map(x => (
          <g key={x} transform={`translate(${x} 545)`} stroke="#ffbd66" fill="none" strokeWidth="4">
            <path d="M-22 0V-19L0-34L22-19V0" />
            <path d="M-8 -23H8M0-33V0" opacity=".55" />
          </g>
        ))}
        {CITY_X.slice(0, game.cities).map(x => (
          <path key={x} d={`M${x - 30} 545v-13h9v-18h10v11h10v-25h11v17h9v-10h12v38z`} fill="#80ff96" fillOpacity=".68" />
        ))}
        {game.missiles.map(missile => {
          const x = missile.startX + (missile.targetX - missile.startX) * missile.progress
          const y = 24 + 516 * missile.progress
          return (
            <g key={missile.id}>
              <path d={`M${missile.startX} 24L${x} ${y}`} stroke="#ff5f57" strokeOpacity=".55" strokeWidth="2" />
              <circle cx={x} cy={y} r="4" fill="#ffbd66" />
            </g>
          )
        })}
        {game.explosions.map(explosion => (
          <g key={explosion.id}>
            <circle cx={explosion.x} cy={explosion.y} r={explosionRadius(explosion.age)} fill="#80ff96" fillOpacity=".06" stroke="#80ff96" strokeWidth="3" />
            <circle cx={explosion.x} cy={explosion.y} r={Math.max(2, explosionRadius(explosion.age) * .32)} fill="#ffbd66" fillOpacity=".35" />
          </g>
        ))}
        {!game.running && (
          <g>
            <rect x="275" y="220" width="450" height="125" fill="#020603" fillOpacity=".92" stroke="#80ff96" strokeOpacity=".45" />
            <text x="500" y="274" textAnchor="middle" fill="#80ff96" fontSize="26" letterSpacing="4">
              {game.cities === 0 ? 'CITIES LOST' : 'DEFENSE OFFLINE'}
            </text>
            <text x="500" y="312" textAnchor="middle" fill="#ffbd66" fontSize="15" letterSpacing="3">SELECT START TO ENGAGE</text>
          </g>
        )}
      </svg>

      <div className="mt-5 flex flex-wrap gap-3">
        <button type="button" onClick={start} className="joshua-terminal-action">{game.ticks ? 'RESTART' : 'START'}</button>
        <button type="button" onClick={onBack} className="joshua-terminal-action">GAME LIST</button>
      </div>
    </div>
  )
}
