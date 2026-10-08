import { useRef } from 'react'
import { SwapPanel } from './SwapPanel'
import { useIntroOnce, useReveal } from './landingShared'

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
export function LandingMobile() {
  const root = useRef<HTMLDivElement>(null)
  useReveal(root)
  const intro = useIntroOnce()
  return (
    <div className={'lpm' + intro} ref={root}>
      <section className="lpm-hero">
        {/* the desktop hero's floating coins, scaled down for the phone */}
        <div className="lpm-floats" aria-hidden>
          {(
            [
              // [coin, right, top, size] — kept clear of the title lines; the Kotai coin is the featured one
              ['eth', 50, 0, 28, '#627eea', 0.6],
              ['sol', 2, 18, 28, '#9945ff', 2.1],
              ['kti', 22, 48, 58, '#2fe0c0', 0],
              ['btc', 98, 68, 30, '#f7931a', 1.2],
            ] as const
          ).map(([id, right, top, size, glow, d]) => (
            <span key={id} className={'lpm-fl' + (id === 'kti' ? ' hl' : '')} style={{ right, top, width: size, height: size, animationDelay: `${d}s`, ['--g' as string]: glow }}>
              <img src={`img/f-${id}.webp`} alt="" />
            </span>
          ))}
        </div>
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
