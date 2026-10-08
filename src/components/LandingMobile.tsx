import { useRef } from 'react'
import { SwapPanel } from './SwapPanel'
import { useIntroOnce, useReveal } from './landingShared'
import { Icon } from './ui'

/* ───────── mobile page · "Landing mobile · Home" (390 frame) ───────── */
const M_CARDS: [string, string, string][] = [
  ['shield', 'Non-custodial', 'Your keys, your funds'],
  ['coins', 'Transparent fees', 'Every cost before you sign'],
  ['link', 'KTI on BNB Chain', 'BNB, USDT and USDC pairs'],
  ['trend', 'Best route', 'We compare pools for you'],
]
/* same illustrations as the desktop landing, in lighter phone-sized files (width × height keep the box stable while loading) */
const M_WHY: { img: string; w: number; h: number; tag: string; title: string; text: string }[] = [
  { img: 'multi-chain', w: 720, h: 427, tag: 'Multi-chain', title: '100+ tokens in one screen', text: 'The main tokens in one place, with live prices and no platform switching.' },
  { img: 'cross-chain', w: 560, h: 551, tag: 'Cross-chain', title: 'Move across chains', text: 'Send on one network, receive on another — one quote, one confirmation.' },
  { img: 'limit-orders', w: 560, h: 366, tag: 'Limit orders', title: 'Set your price. Walk away.', text: 'Place an order and it fills when the market gets there.' },
  { img: 'dynamic-fee', w: 480, h: 382, tag: 'Dynamic fees', title: 'Fees tuned to the network', text: 'Pay less when the network is calm, with the exact cost shown first.' },
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
      <section className="lpm-grid">
        {M_CARDS.map(([icon, t, d]) => (
          <article key={t} className="lpm-mini">
            <span className="lpm-ic">
              <Icon n={icon} size={18} />
            </span>
            <b>{t}</b>
            <span>{d}</span>
          </article>
        ))}
      </section>
      <section className="lpm-cards">
        <span className="lpm-eyebrow">Why KOTAI DEX</span>
        <h2>Everything you need to swap</h2>
        {M_WHY.map((f) => (
          <article key={f.img} className="lpm-feature">
            <div className="lpm-art">
              <img loading="lazy" decoding="async" src={`img/${f.img}-m.webp`} width={f.w} height={f.h} alt="" />
            </div>
            <div className="lpm-feature-txt">
              <span className="lpm-tag">{f.tag}</span>
              <b>{f.title}</b>
              <span>{f.text}</span>
            </div>
          </article>
        ))}
      </section>
    </div>
  )
}
