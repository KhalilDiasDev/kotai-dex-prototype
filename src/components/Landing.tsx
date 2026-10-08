import { useEffect, useMemo, useRef } from 'react'
import { useApp } from '../store'
import { SwapPanel } from './SwapPanel'
import { Tilt, TiltContent } from './animate-ui/tilt'
import { Icon } from './ui'

/* ───────── helpers ───────── */
/* Card hover · Animate UI Tilt + a pointer spotlight (see .tilt-card in landing.css) */
function TiltCard({ className, children, max = 5 }: { className: string; children: React.ReactNode; max?: number }) {
  return (
    <Tilt maxTilt={max} perspective={1100} className="tilt">
      <TiltContent className={className + ' tilt-card'}>
        <span className="tilt-spot" aria-hidden />
        {children}
      </TiltContent>
    </Tilt>
  )
}

const Eyebrow = ({ children }: { children: string }) => <span className="lp-eyebrow">{children}</span>

function Check({ children }: { children: string }) {
  return (
    <li>
      <span className="lp-check">✓</span>
      {children}
    </li>
  )
}

function Qr() {
  // Deterministic QR-like pattern (visual only)
  const cells = useMemo(() => {
    const n = 21
    let s = 7
    const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647)
    const out: [number, number][] = []
    const finder = (x: number, y: number) => (x < 8 && y < 8) || (x > n - 9 && y < 8) || (x < 8 && y > n - 9)
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (!finder(x, y) && rnd() > 0.52) out.push([x, y])
    return out
  }, [])
  const f = (x: number, y: number) => (
    <g key={x + '-' + y} transform={`translate(${x} ${y})`}>
      <rect width="7" height="7" fill="#000" />
      <rect x="1" y="1" width="5" height="5" fill="#fff" />
      <rect x="2" y="2" width="3" height="3" fill="#000" />
    </g>
  )
  return (
    <svg viewBox="0 0 21 21" width="99" height="99" shapeRendering="crispEdges" aria-hidden>
      <rect width="21" height="21" fill="#fff" />
      {f(0, 0)}
      {f(14, 0)}
      {f(0, 14)}
      {cells.map(([x, y]) => (
        <rect key={x + '_' + y} x={x} y={y} width="1" height="1" fill="#000" />
      ))}
    </svg>
  )
}

/* ───────── floating tokens (positions from the Figma frame, 1440 grid) ───────── */
type Fl = { id: string; cx: number; cy: number; img: number; glow: [number, number, number, string]; tr: [number, number, number]; up: boolean; faint?: boolean; d: number }
const FLOATS: Fl[] = [
  { id: 'xrp', cx: 1354, cy: 659, img: 275, glow: [1329, 636, 51, '#7f96b8'], tr: [1364, 631, 20], up: true, d: 0 },
  { id: 'bnb', cx: 1057, cy: 380, img: 297, glow: [1029, 355, 55, '#f3ba2f'], tr: [1069, 350, 20], up: false, d: 1.2 },
  { id: 'usdt', cx: 1075, cy: 568, img: 374, glow: [1040, 537, 69, '#26a17b'], tr: [1094, 531, 20], up: true, d: 2.1 },
  { id: 'sol', cx: 1300, cy: 354, img: 484, glow: [1255, 314, 90, '#9945ff'], tr: [1325, 306, 26], up: false, d: 0.6 },
  { id: 'usdc', cx: 170, cy: 125, img: 231, glow: [149, 106, 43, '#2775ca'], tr: [176, 101, 20], up: true, d: 1.7 },
  { id: 'btc', cx: 308, cy: 410, img: 330, glow: [277, 382, 61, '#f7931a'], tr: [323, 377, 20], up: true, d: 0.9 },
  { id: 'eth', cx: 360, cy: 648, img: 418, glow: [321, 613, 78, '#627eea'], tr: [381, 607, 23], up: true, d: 2.6 },
  { id: 'kti', cx: 145, cy: 301, img: 528, glow: [96, 257, 98, '#2fe0c0'], tr: [171, 249, 29], up: true, faint: true, d: 1.4 },
]

const NAMES: Record<string, [string, string]> = {
  xrp: ['XRP', 'XRP'], bnb: ['BNB', 'BNB'], usdt: ['Tether', 'USDT'], sol: ['Solana', 'SOL'],
  usdc: ['USD Coin', 'USDC'], btc: ['Bitcoin', 'BTC'], eth: ['Ethereum', 'ETH'], kti: ['Kotai Coin', 'KTI'],
}
/* price · 24h change (%) — sign matches the trend badge drawn in the Figma hero */
const MARKET: Record<string, [string, number]> = {
  xrp: ['$0.5821', 3.12], bnb: ['$584.30', -1.84], usdt: ['$1.0002', 0.02], sol: ['$142.67', -2.37],
  usdc: ['$0.9999', 0.01], btc: ['$67,000.00', 0.6], eth: ['$3,500.00', 1.08], kti: ['$0.000025', 4.8],
}

/* tooltip opens away from the swap card, unless the coin sits too close to the frame edge */
const tipSide = (cx: number) => {
  const outward = cx < 720 ? 'left' : 'right'
  const room = cx < 720 ? cx : 1440 - cx
  return room > 230 ? outward : outward === 'left' ? 'right' : 'left'
}

function Floats() {
  const a = useApp()
  return (
    <div className="lp-floats">
      {FLOATS.map((f, i) => {
        const s = f.img / 4
        const [gx, gy, gs, gc] = f.glow
        const [tx, ty, ts] = f.tr
        return (
          <div
            key={f.id}
            style={
              {
                transformOrigin: `calc(50% - 720px + ${f.cx}px) ${f.cy}px`,
                // entrance: starts behind the swap card (centre ≈ 720, 450 on the frame) and flies out
                '--ex': `${720 - f.cx}px`,
                '--ey': `${450 - f.cy}px`,
                '--pd': `${0.45 + i * 0.07}s`,
                '--fd': `${f.d}s`,
              } as React.CSSProperties
            }
          >
            <span className="fl-glow" style={{ left: `calc(50% - 720px + ${gx}px)`, top: gy, width: gs, height: gs, background: gc, filter: `blur(${gs * 0.27}px)` }} />
            <button
              className="fl-btn"
              onClick={() => a.openCoin(f.id.toUpperCase() as never)}
              aria-label={`${NAMES[f.id][0]} price`}
              style={{ left: `calc(50% - 720px + ${f.cx - s / 2}px)`, top: f.cy - s / 2, width: s, height: s }}
            >
              <img className="fl-img" src={`img/f-${f.id}.png`} alt="" />
              <span className={'fl-tip ' + tipSide(f.cx)}>
                <span className="fl-tip-head">
                  <img src={`img/coin/${f.id}.${f.id === 'kti' ? 'png' : 'svg'}`} alt="" onError={(e) => (e.currentTarget.style.display = 'none')} />
                  <b>{NAMES[f.id][0]}</b>
                  <span>{NAMES[f.id][1]}</span>
                </span>
                <span className="fl-tip-price">{MARKET[f.id][0]}</span>
                <span className={'fl-tip-chg' + (MARKET[f.id][1] < 0 ? ' down' : '')}>
                  {MARKET[f.id][1] < 0 ? '▼' : '▲'} {Math.abs(MARKET[f.id][1]).toFixed(2)}%<small>24h</small>
                </span>
              </span>
            </button>
            <span
              className={'fl-trend fl-trend-' + f.id}
              style={{
                left: `calc(50% - 720px + ${tx}px)`,
                top: ty,
                width: ts,
                height: ts,
                background: f.up ? '#17c785' : '#ff082e',
                opacity: f.faint ? 0.14 : 1,
              }}
            >
              <svg viewBox="0 0 10 10" width={ts / 2} height={ts / 2} fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                {f.up ? <path d="M2 7.5L7.5 2M3.5 2H7.5V6" /> : <path d="M2 2.5L7.5 8M3.5 8H7.5V4" />}
              </svg>
            </span>
          </div>
        )
      })}
    </div>
  )
}

/* ───────── background (Fundo · Granulado) ───────── */
type Blob = [string, number, number, number, number]
const BLOBS: Blob[] = [
  // kind, x, y, w, h  — three repeating sets from the Figma frame
  ['v', -300, 900, 1500, 360], ['b', 500, 950, 1500, 320], ['t', 700, -160, 900, 260],
  ['v', 240, 1934, 1500, 360], ['b', -560, 1984, 1500, 320], ['t', -160, 874, 900, 260],
  ['v', -300, 2968, 1500, 360], ['b', 500, 3018, 1500, 320], ['t', 700, 1908, 900, 260],
]
const ARCS: [number, number, number, number, number][] = [
  [-300, 640, 1100, 1000, 0.4], [900, -420, 1100, 700, 0.4], [640, 1674, 1100, 1000, 0.4], [-560, 614, 1100, 700, 0.4],
  [-300, 2708, 1100, 1000, 0.4], [900, 1648, 1100, 700, 0.4],
  [-500, -260, 2400, 1000, 0.4], [-300, 60, 2000, 860, 0.4], [300, -520, 1500, 900, 0.4], [-700, 300, 1800, 700, 0.4],
]

function Backdrop() {
  return (
    <div className="lp-bg" aria-hidden>
      <div className="lp-bg-in">
        <span className="glow-top" />
        <span className="glow-swap" />
        {BLOBS.map(([k, x, y, w, h], i) => (
          <span key={i} className={'blob ' + k} style={{ left: x, top: y, width: w, height: h }} />
        ))}
        {ARCS.map(([x, y, w, h, o], i) => (
          <span key={i} className="lp-arc" style={{ left: x, top: y, width: w, height: h, opacity: o }} />
        ))}
        <span className="spark" style={{ left: 251, top: 641 }} />
        <span className="spark" style={{ left: 1185, top: 1675 }} />
        <span className="spark" style={{ left: 251, top: 2709 }} />
      </div>
    </div>
  )
}

/* ───────── mobile page · "Landing mobile · Home" (390 frame) ───────── */
const M_CARDS: [string, string][] = [
  ['Non-custodial', 'Your keys, your funds'],
  ['Transparent fees', 'Every cost before you sign'],
  ['7 networks', '100+ tokens in one place'],
  ['Best route', 'We compare pools for you'],
]
const M_WHY: [string, string][] = [
  ['100+ tokens on 7 networks', 'The main tokens and networks in one place, with live prices and no platform switching.'],
  ['Cross-chain swaps', 'Move value between networks without going through an exchange.'],
  ['Limit orders', 'Set your price and the swap runs when the market gets there.'],
]
function LandingMobile() {
  const root = useRef<HTMLDivElement>(null)
  useReveal(root)
  return (
    <div className="lpm intro" ref={root}>
      <section className="lpm-hero">
        <h1>Swap from your wallet.</h1>
        <p>Every cost shown before you sign.</p>
      </section>
      <SwapPanel compact />
      <section className="lpm-cards">
        {M_CARDS.map(([t, d]) => (
          <article key={t} className="lpm-card">
            <b>{t}</b>
            <span>{d}</span>
          </article>
        ))}
        <span className="lpm-eyebrow">Why KOTAI DEX</span>
        <h2>Everything you need to swap</h2>
        {M_WHY.map(([t, d]) => (
          <article key={t} className="lpm-card">
            <b>{t}</b>
            <span>{d}</span>
          </article>
        ))}
      </section>
    </div>
  )
}

/* ───────── entrance · each block rises in as it scrolls into view (siblings staggered) ───────── */
const REVEAL = [
  '.lp-statement > :not(.lp-glow)',
  '.lp-steps .lp-head',
  '.lp-trail',
  '.lp-step-grid > *',
  '.lp-step-cta',
  '.lp-feature > .lp-panel',
  '.lp-feature-txt > *',
  '.lp-bento .lp-head',
  '.lp-bento-row > *',
  '.lp-banner',
  '.lpm-cards > *',
].join(',')

function useReveal(root: React.RefObject<HTMLElement>) {
  useEffect(() => {
    const el = root.current
    if (!el) return
    const items = Array.from(el.querySelectorAll<HTMLElement>(REVEAL))
    if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) return
    items.forEach((n) => {
      const sibs = Array.from(n.parentElement!.children).filter((c) => c.matches(REVEAL))
      n.style.setProperty('--rd', `${Math.min(sibs.indexOf(n), 6) * 90}ms`)
      n.classList.add('reveal')
    })
    const io = new IntersectionObserver(
      (es) =>
        es.forEach((e) => {
          if (!e.isIntersecting) return
          e.target.classList.add('in')
          io.unobserve(e.target)
        }),
      { rootMargin: '0px 0px -8% 0px', threshold: 0.12 },
    )
    items.forEach((n) => io.observe(n))
    return () => io.disconnect()
  }, [root])
}

/* ───────── page ───────── */
export function Landing() {
  const a = useApp()
  if (a.isMobile) return <LandingMobile />
  return <LandingDesktop />
}

function LandingDesktop() {
  const a = useApp()
  const root = useRef<HTMLDivElement>(null)
  useReveal(root)
  const go = () => {
    a.set({ view: 'swap' })
    window.scrollTo({ top: 0 })
  }
  const docs = () => a.toast({ tone: 'info', title: 'Docs', body: 'Opens the documentation in the real product' })

  return (
    <div className="lp intro" ref={root}>
      <Backdrop />

      {/* Hero */}
      <section className="lp-hero">
        <Floats />
        <h1 className="lp-hero-title">Swap anytime</h1>
        <div className="lp-hero-card">
          <SwapPanel compact />
        </div>
      </section>

      {/* Declaração */}
      <section className="lp-statement">
        <span className="lp-glow" style={{ width: 800, height: 420, opacity: 0.14, filter: 'blur(80px)' }} />
        <Eyebrow>The Kotai way</Eyebrow>
        <h2 className="lp-display">Every swap, shown before you sign.</h2>
        <p className="lp-lead">Non-custodial, multi-chain and priced in the open. See the route, the fee and the minimum you receive — then decide.</p>
        <div className="lp-pills">
          {['No hidden fees', '7 networks', 'Your keys, always'].map((t) => (
            <span className="lp-pill" key={t}>{t}</span>
          ))}
        </div>
      </section>

      {/* Primeiros passos */}
      <section className="lp-steps lp-wrap">
        <div className="lp-head left">
          <span className="lp-tag"><i />How it works</span>
          <h2 className="lp-h2">Your first swap in 3 steps</h2>
        </div>
        <div className="lp-trail" aria-hidden>
          <span className="line" />
          <i /><i /><i />
        </div>
        <div className="lp-step-grid">
          <TiltCard className="lp-step">
            <div className="lp-prev"><span className="qr"><Qr /></span></div>
            <div className="lp-step-txt">
              <span className="cap">01</span>
              <h3>Connect your wallet</h3>
              <p>Kotai Wallet or any wallet via WalletConnect. Connecting doesn’t move funds.</p>
            </div>
          </TiltCard>
          <TiltCard className="lp-step">
            <div className="lp-prev">
              <div className="mini-field">
                <div className="mf-top"><span>You send</span><span className="mf-chips"><b>25%</b><b>50%</b><b>75%</b><b>Max</b></span></div>
                <div className="mf-mid"><span className="mf-amt">0.5</span><span className="mf-tok"><img src="img/f-eth.png" alt="" />ETH<Icon n="chevron" size={12} /></span></div>
                <div className="mf-bot"><span>≈ $1,750.00</span><span>Balance: 1.0000 ETH</span></div>
              </div>
            </div>
            <div className="lp-step-txt">
              <span className="cap">02</span>
              <h3>Pick tokens and amount</h3>
              <p>See the USD estimate, the fees and the minimum received right away.</p>
            </div>
          </TiltCard>
          <TiltCard className="lp-step">
            <div className="lp-prev col">
              <div className="mini-ok"><span>Minimum received</span><b>69,650,000 KTI</b></div>
              <button className="btn accent block" tabIndex={-1}>Confirm swap</button>
            </div>
            <div className="lp-step-txt">
              <span className="cap">03</span>
              <h3>Review and sign</h3>
              <p>Check the summary, sign in your wallet and follow it until it’s done.</p>
            </div>
          </TiltCard>
        </div>
        <div className="lp-step-cta">
          <button className="btn accent lg" onClick={go}>Start swapping</button>
          <button className="lp-link" onClick={docs}>Read the docs <Icon n="back" size={16} style={{ transform: 'rotate(180deg)' }} /></button>
        </div>
      </section>

      {/* Multi-chain */}
      <section className="lp-feature lp-wrap">
        <div className="lp-panel">
          <span className="lp-glow" style={{ width: 400, height: 300, opacity: 1, filter: 'blur(55px)' }} />
          <img src="img/multi-chain.png" alt="Tokens orbiting in a ring" style={{ width: 510 }} />
        </div>
        <div className="lp-feature-txt">
          <Eyebrow>Multi-chain</Eyebrow>
          <h2 className="lp-h2 xl">100+ tokens. 7 networks. One screen.</h2>
          <p>Pick any token on any supported network. The best route is found for you and every step is shown before signing.</p>
          <ul>
            <Check>Live prices and 24h change</Check>
            <Check>Smart routing across pools</Check>
            <Check>Nothing leaves your wallet unsigned</Check>
          </ul>
          <button className="lp-arrow" onClick={() => a.open('search')}>Explore tokens&nbsp; →</button>
        </div>
      </section>

      {/* Cross-chain */}
      <section className="lp-feature rev lp-wrap">
        <div className="lp-feature-txt">
          <Eyebrow>Cross-chain</Eyebrow>
          <h2 className="lp-h2 xl">Move across chains without leaving the swap.</h2>
          <p>Send on one network, receive on another. One quote, one confirmation, and a clear status until it lands.</p>
          <ul>
            <Check>One confirmation to sign</Check>
            <Check>Status tracked to the last block</Check>
            <Check>Fees shown in advance</Check>
          </ul>
          <button className="lp-arrow" onClick={() => a.open('network')}>See supported networks&nbsp; →</button>
        </div>
        <div className="lp-panel">
          <span className="lp-glow" style={{ width: 400, height: 300, opacity: 1, filter: 'blur(55px)' }} />
          <img src="img/cross-chain.png" alt="Arrow looping between coins" style={{ width: 408 }} />
        </div>
      </section>

      {/* Bento */}
      <section className="lp-bento lp-wrap">
        <div className="lp-head">
          <Eyebrow>Built for traders</Eyebrow>
          <h2 className="lp-h2 xxl">Precision tools, calm interface.</h2>
        </div>
        <div className="lp-bento-row">
          <TiltCard className="lp-panel card wide" max={4}>
            <div className="img"><img src="img/limit-orders.png" alt="" style={{ width: 274 }} /></div>
            <span className="lp-glow" style={{ width: 384, height: 200, filter: 'blur(50px)' }} />
            <Eyebrow>Limit orders</Eyebrow>
            <h3>Set your price. Walk away.</h3>
            <p>Place an order at the price you want and it fills when the market gets there — still non-custodial.</p>
          </TiltCard>
          <TiltCard className="lp-panel card" max={4}>
            <div className="img"><img src="img/dynamic-fee.png" alt="" style={{ width: 227 }} /></div>
            <span className="lp-glow" style={{ width: 322, height: 200, filter: 'blur(50px)' }} />
            <Eyebrow>Dynamic fees</Eyebrow>
            <h3>Fees tuned to the network.</h3>
            <p>Pay less when the network is calm, with the exact cost shown before you confirm.</p>
          </TiltCard>
        </div>
      </section>

      {/* CTA */}
      <section className="lp-cta lp-wrap">
        <div className="lp-banner">
          <span className="b-glow" />
          <span className="b-line" />
          <span className="b-orbit o1" />
          <span className="b-orbit o2" />
          <span className="b-dot" />
          {[
            ['eth', 115, 146, 70.4, 388],
            ['btc', 324, 267, 51.2, 282],
            ['usdt', 1021, 152, 57.6, 317],
            ['sol', 818, 261, 64, 352],
          ].map(([n, x, y, s, px]) => {
            const full = (px as number) / 4
            const off = (full - (s as number)) / 2
            return <img key={n as string} className="b-coin" src={`img/c-${n}.png`} alt="" style={{ left: `calc(50% - 600px + ${(x as number) - off}px)`, top: (y as number) - off, width: full, height: full }} />
          })}
          <h2>Ready for your first swap?</h2>
          <p>Connect your wallet and see every cost before you sign.</p>
          <div className="btn-row">
            <button className="btn accent lg" onClick={go}>Get started</button>
            <button className="btn white lg" onClick={() => a.open('connect')}>Connect wallet</button>
          </div>
        </div>
      </section>
    </div>
  )
}
