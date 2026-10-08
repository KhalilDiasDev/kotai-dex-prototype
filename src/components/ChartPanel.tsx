import { useMemo, useRef, useState } from 'react'
import { TOKENS, fmt, usd, type TokenId } from '../data'
import { useApp } from '../store'
import { Coin, Icon } from './ui'

/* 1D series traced from the Figma chart vector (91 points, 0 = top, 1 = bottom of the line band) */
const SERIES_1D = [
  0.8, 0.859, 0.948, 0.969, 0.865, 0.877, 1, 0.915, 0.832, 0.853, 0.71, 0.81, 0.78, 0.829, 0.705, 0.582, 0.451, 0.338, 0.195, 0.151, 0.212, 0.174, 0.12,
  0.116, 0.177, 0.037, 0.144, 0.195, 0.246, 0.294, 0.169, 0.013, 0, 0.126, 0.782, 0.764, 0.687, 0.781, 0.854, 0.887, 0.782, 0.805, 0.696, 0.772, 0.808, 0.8,
  0.717, 0.723, 0.772, 0.661, 0.53, 0.381, 0.505, 0.567, 0.564, 0.547, 0.451, 0.535, 0.403, 0.322, 0.448, 0.46, 0.541, 0.582, 0.629, 0.577, 0.587, 0.687, 0.786,
  0.784, 0.772, 0.633, 0.708, 0.604, 0.481, 0.537, 0.596, 0.452, 0.576, 0.468, 0.419, 0.441, 0.378, 0.35, 0.258, 0.162, 0.135, 0.043, 0.167, 0.197, 0.294,
]
export const RANGES = ['1H', '1D', '1W', '1M', '1Y', 'All'] as const
export type Range = (typeof RANGES)[number]

/** Deterministic series per range (1D is the exact Figma curve). Always ends on the current price. */
export function seriesFor(range: Range, seed = 0): number[] {
  if (range === '1D' && seed === 0) return SERIES_1D
  let s = (RANGES.indexOf(range) + 1) * 977 + seed * 131
  const out: number[] = []
  let v = 0.6
  for (let i = 0; i < 91; i++) {
    s = (s * 16807) % 2147483647
    v += (s / 2147483647 - 0.5) * 0.16 - (i > 60 ? 0.006 : 0)
    v = Math.max(0, Math.min(1, v))
    out.push(v)
  }
  const end = 0.294
  const d = end - out[90]
  return out.map((y, i) => Math.max(0, Math.min(1, y + (d * i) / 90)))
}

const CHANGE: Record<TokenId, [number, number]> = {
  BNB: [-2.53, 0.42],
  ETH: [37.4, 1.08],
  KTI: [0.0000011, 4.8],
  USDT: [0, 0],
  BTC: [402, 0.6],
  USDC: [0, 0],
}

function priceText(id: TokenId, v: number) {
  return v < 1 ? '$' + v.toFixed(6) : usd(v)
}

export function ChartPanel() {
  const a = useApp()
  const full = a.chart === 'full'
  const [token, setToken] = useState<TokenId>(a.from)
  const [range, setRange] = useState<Range>('1D')
  const [hover, setHover] = useState<number | null>(null)
  const area = useRef<HTMLDivElement>(null)
  const t = TOKENS[token]
  const [chg, pct] = CHANGE[token]
  // a token that is down on the day draws the same curve mirrored in time, so the line really ends lower
  const ys = useMemo(() => {
    const base = seriesFor(range, token === 'BNB' ? 0 : token.charCodeAt(0) + token.length)
    return chg < 0 ? [...base].reverse() : base
  }, [range, token, chg])
  const W = full ? 1144 : 664
  const H = full ? 520 : 300
  const top = H * 0.4533
  const amp = H * 0.1767
  const pts = ys.map((y, i) => [(i / 90) * W, top + y * amp] as const)
  const line = pts.map(([x, y], i) => (i ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1)).join(' ')
  const areaPath = line + ` L${W} ${H} L0 ${H} Z`
  const open = t.price - chg
  const k = (ys[0] - ys[90]) !== 0 ? chg / (ys[0] - ys[90]) : 0
  const priceAt = (i: number) => open + (ys[0] - ys[i]) * k
  const openY = top + ys[0] * amp
  const hv = hover !== null ? priceAt(hover) : t.price
  const hd = hv - open
  const up = hover === null ? chg >= 0 : hd >= 0
  const when = (i: number) => {
    const mins = Math.round(((90 - i) / 90) * 24 * 60)
    const d = new Date(Date.UTC(2026, 9, 8, 0, 4) - mins * 60000)
    const day = d.getUTCDate() === 8 ? 'Oct 8' : 'Oct 7'
    return `${day}, ${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`
  }
  const onMove = (e: React.MouseEvent) => {
    const r = area.current!.getBoundingClientRect()
    const i = Math.round(((e.clientX - r.left) / r.width) * 90)
    setHover(Math.max(0, Math.min(90, i)))
  }
  const hx = hover !== null ? pts[hover][0] : 0
  const clipId = full ? 'clip-full' : 'clip-side'
  const tokens: TokenId[] = [a.from, a.to]

  return (
    <section className={'chart-panel' + (full ? ' full' : '')} aria-label={`${t.name} price chart`}>
      <div className="cp-head">
        <div className="cp-title">
          <span className="coin-badge">
            <Coin id={token} size={36} />
            <span className="nb">
              <Coin id="BNB" size={12} />
            </span>
          </span>
          <b>{t.name === 'KTI Coin' ? 'Kotai Coin' : t.name}</b>
          <span className="sym">{t.symbol}</span>
        </div>
        <div className="cp-actions">
          <div className="cp-switch" role="tablist">
            {tokens.map((id) => (
              <button key={id} className={token === id ? 'on' : ''} onClick={() => setToken(id)}>
                <Coin id={id} size={18} /> {id}
              </button>
            ))}
          </div>
          {full ? (
            <>
              <button className="cp-round" onClick={() => a.set({ chart: 'side' })} aria-label="Exit full screen">
                <Icon n="collapse" size={18} />
              </button>
              <button className="cp-round" onClick={() => a.set({ chart: 'off' })} aria-label="Close chart">
                <Icon n="x" size={18} />
              </button>
            </>
          ) : (
            <>
              <button className="cp-round" onClick={() => a.set({ chart: 'full' })} aria-label="Full screen">
                <Icon n="expand" size={18} />
              </button>
              <button className="cp-round" onClick={() => a.set({ chart: 'off' })} aria-label="Close chart">
                <Icon n="x" size={18} />
              </button>
            </>
          )}
        </div>
      </div>

      <div className="cp-price">
        <b key={hover === null ? 'now' : 'h'}>{priceText(token, hv)}</b>
        <div className={'cp-delta' + (up ? '' : ' down')}>
          <span className="tri">{up ? '▲' : '▼'}</span>
          <span className="chg">
            {hover === null
              ? `${Math.abs(chg) < 1 && chg !== 0 ? '$' + Math.abs(chg).toFixed(7) : '$' + Math.abs(chg).toFixed(2)} (${pct.toFixed(2)}%)`
              : `$${Math.abs(hd) < 1 ? Math.abs(hd).toFixed(6) : Math.abs(hd).toFixed(2)} (${((Math.abs(hd) / open) * 100).toFixed(2)}%)`}
          </span>
          <span className="when">· {hover === null ? 'Past 24 hours' : when(hover)}</span>
        </div>
      </div>

      <div className="cp-area" ref={area} onMouseMove={onMove} onMouseLeave={() => setHover(null)} style={{ height: H }}>
        <span className="dots" />
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none" className="cp-svg">
          <defs>
            <clipPath id={clipId}>
              <rect x="0" y="0" width={hover === null ? W : hx} height={H} />
            </clipPath>
          </defs>
          {hover === null ? (
            <g className="cp-anim" key={range + token + full}>
              <path d={areaPath} fill={up ? '#2bf5a0' : '#ff6685'} />
              <path d={line} fill="none" stroke={up ? '#2bf5a0' : '#ff6685'} strokeWidth="2" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
            </g>
          ) : (
            <>
              <path d={areaPath} fill="#3c68c8" opacity="0.5" />
              <path d={line} fill="none" stroke="#3b5378" strokeWidth="2" opacity="0.7" vectorEffect="non-scaling-stroke" />
              <g clipPath={`url(#${clipId})`}>
                <path d={areaPath} fill={up ? '#2bf5a0' : '#ff6685'} />
                <path d={line} fill="none" stroke={up ? '#2bf5a0' : '#ff6685'} strokeWidth="2" vectorEffect="non-scaling-stroke" />
              </g>
              <rect x="0" y={openY} width={W} height="1" fill="#fff" opacity="0.18" />
              <line x1={hx} x2={hx} y1="24" y2={H} stroke="#fff" strokeOpacity="0.35" strokeWidth="1" strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />
            </>
          )}
        </svg>
        {hover === null ? (
          <span className={'cp-dot' + (up ? '' : ' red')} style={{ left: `${(pts[90][0] / W) * 100}%`, top: pts[90][1] }} />
        ) : (
          <>
            <span className={'cp-dot' + (up ? '' : ' red')} style={{ left: `${(hx / W) * 100}%`, top: pts[hover][1] }} />
            <span className="cp-time" style={{ left: `${(hx / W) * 100}%` }}>
              {when(hover).replace(', ', ' · ')}
            </span>
          </>
        )}
      </div>

      <div className="cp-range" role="tablist">
        {RANGES.map((r) => (
          <button key={r} className={r === range ? 'on' : ''} onClick={() => setRange(r)}>
            {r}
          </button>
        ))}
      </div>

      {full && (
        <div className="cp-dock">
          <span className="pair">
            <Coin id={a.from} size={24} />
            <Coin id={a.to} size={24} />
          </span>
          <b>
            {a.amountNum > 0 ? `${fmt(a.amountNum)} ${a.from} → ${fmt(a.quote.out, 0)} ${a.to}` : `${a.from} → ${a.to}`}
          </b>
          <button className="btn accent sm" onClick={() => a.set({ chart: 'side' })}>
            Back to swap
          </button>
        </div>
      )}
    </section>
  )
}
