import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import type { TokenId } from '../data'

/* ───────── Icons · "Ícone/*" components from the Figma file (24px grid, 1.75 stroke) ───────── */
const P: Record<string, ReactNode> = {
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
  x: <path d="M18 6L6 18M6 6l12 12" />,
  search: <path d="M3.53 12.68A7 7 0 1 1 16.47 7.32 7 7 0 0 1 3.53 12.68ZM21 21l-6-6" />,
  chevron: <path d="M6 9l6 6 6-6" />,
  chevronR: <path d="M9 6l6 6-6 6" />,
  back: <path d="M5 12h14M5 12l6 6M5 12l6-6" />,
  arrowRight: <path d="M19 12H5M19 12l-6 6M19 12l-6-6" />,
  flip: <path d="M17 3v18M10 18l-3 3-3-3M7 21V3M20 6l-3-3-3 3" />,
  chart: <path d="M4 19h16M4 15l4-6 4 2 4-5 4 4" />,
  sliders: (
    <path d="M12.59 7.41A2 2 0 1 1 15.41 4.59 2 2 0 0 1 12.59 7.41ZM4 6h8M16 6h4M6.59 13.41A2 2 0 1 1 9.41 10.59 2 2 0 0 1 6.59 13.41ZM4 12h2M10 12h10M15 18a2 2 0 1 0 4 0 2 2 0 0 0-4 0ZM4 18h11M19 18h1" />
  ),
  wallet: (
    <path d="M19 16v3a1 1 0 0 1-1 1H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h10a1 1 0 0 1 1 1v3M4 6a2 2 0 0 0 2 2h12a1 1 0 0 1 1 1v3M20 12v4h-4a2 2 0 0 1 0-4h4Z" />
  ),
  shield: <path d="M11.46 20.85A12 12 0 0 1 3.5 6 12 12 0 0 0 12 3a12 12 0 0 0 8.5 3 12 12 0 0 1-.09 7.06M15 19l2 2 4-4" />,
  clock: <path d="M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0ZM12 7v5l3 3" />,
  info: <path d="M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0ZM12 9h.01M11 12h1v4h1" />,
  warn: (
    <path d="M12 9v4M10.36 3.59 2.26 17.13A1.9 1.9 0 0 0 3.89 20h16.22a1.9 1.9 0 0 0 1.63-2.87L13.64 3.59a1.91 1.91 0 0 0-3.28 0M12 16h.01" />
  ),
  check: <path d="M5 12l5 5L20 7" />,
  checkCircle: <path d="M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0ZM9 12l2 2 4-4" />,
  xCircle: <path d="M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0ZM10 10l4 4M14 10l-4 4" />,
  copy: (
    <path d="M7 9.67A2.67 2.67 0 0 1 9.67 7h8.66A2.67 2.67 0 0 1 21 9.67v8.66A2.67 2.67 0 0 1 18.33 21H9.67A2.67 2.67 0 0 1 7 18.33V9.67ZM4.01 16.74A2 2 0 0 1 3 15V5c0-1.1.9-2 2-2h10c.75 0 1.16.39 1.5 1" />
  ),
  ext: <path d="M12 6H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6M11 13l9-9M15 4h5v5" />,
  history: <path d="M12 8v4l2 2M3.05 11a9 9 0 1 1 .5 4M3 20v-5h5" />,
  plus: <path d="M12 5v14M5 12h14" />,
  user: <path d="M8 7a4 4 0 1 0 8 0 4 4 0 0 0-8 0M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />,
  globe: <path d="M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0ZM3.6 9h16.8M3.6 15h16.8M11.5 3a17 17 0 0 0 0 18M12.5 3a17 17 0 0 1 0 18" />,
  coins: <path d="M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0ZM14.8 9A2 2 0 0 0 13 8h-2a2 2 0 0 0 0 4h2a2 2 0 0 1 0 4h-2a2 2 0 0 1-1.8-1M12 7v10" />,
  arrowDown: <path d="M12 5v14M18 13l-6 6M6 13l6 6" />,
  arrowUp: <path d="M12 5v14M18 11l-6-6M6 11l6-6" />,
  loader: <path d="M12 3a9 9 0 1 0 9 9" />,
  phone: <path d="M6 5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V5ZM11 4h2M12 17v.01" />,
  fuel: <path d="M14 11h1a2 2 0 0 1 2 2v3a1.5 1.5 0 0 0 3 0V9l-3-3M4 20V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v14M3 20h12M18 7v1a1 1 0 0 0 1 1h1M4 11h10" />,
  expand: <path d="M16 4h4v4M14 10l6-6M8 20H4v-4M4 20l6-6" />,
  collapse: <path d="M18 10h-4V6M20 4l-6 6M6 14h4v4M10 14l-6 6" />,
  link: <path d="M9 15l6-6M11 6l.46-.54a5 5 0 0 1 7.07 7.07L18 13M13 18l-.4.54a5.07 5.07 0 0 1-7.12 0 4.97 4.97 0 0 1 0-7.07L6 11" />,
  dots: <path d="M5 12h.01M12 12h.01M19 12h.01" />,
  swapH: <path d="M7 10h14l-4-4M17 14H3l4 4" />,
  upload: <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2M7 9l5-5 5 5M12 4v12" />,
  download: <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2M7 11l5 5 5-5M12 4v12" />,
}

export type IconName = keyof typeof P | 'gear'

export function Icon({
  n,
  size = 18,
  className,
  style,
  sw = 1.75,
}: {
  n: IconName | string
  size?: number
  className?: string
  style?: CSSProperties
  sw?: number
}) {
  if (n === 'gear')
    return (
      <svg width={size} height={size} viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className} style={style} aria-hidden>
        <path d="M17.78 8.92l3.02.11v3.54l-3.02.1-.72 1.74 2.06 2.22-2.49 2.49-2.21-2.06-1.74.72-.11 3.02H9.03l-.1-3.02-1.74-.72-2.22 2.06-2.49-2.49 2.06-2.22-.72-1.74-3.02-.1V9.03l3.02-.11.72-1.74-2.06-2.21 2.49-2.49 2.22 2.06 1.74-.72.1-3.02h3.54l.11 3.02 1.74.72 2.21-2.06 2.49 2.49-2.06 2.21.72 1.74ZM14.12 10.8a3.32 3.32 0 1 1-6.64 0 3.32 3.32 0 0 1 6.64 0Z" />
      </svg>
    )
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={sw}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      aria-hidden
    >
      {P[n]}
    </svg>
  )
}

/* ───────── Coins · "Moeda/*" and networks · "Rede/*" (exported from Figma) ───────── */
export type CoinId = TokenId | 'BNB' | 'SOL' | 'XRP'
const COIN_SRC: Record<CoinId, string> = {
  ETH: 'img/coin/eth.svg',
  KTI: 'img/coin/kti.png',
  USDT: 'img/coin/usdt.svg',
  USDC: 'img/coin/usdc.svg',
  BTC: 'img/coin/btc.svg',
  BNB: 'img/coin/bnb.svg',
  SOL: 'img/coin/sol.svg',
  XRP: 'img/coin/xrp.svg',
}

export function Coin({ id, size = 28, className }: { id: CoinId; size?: number; className?: string }) {
  return <img className={'coin' + (className ? ' ' + className : '')} src={COIN_SRC[id]} width={size} height={size} alt="" draggable={false} />
}

export type NetId = 'eth' | 'bnb' | 'poly' | 'arb' | 'base' | 'op' | 'avax'
export function Net({ id, size = 20 }: { id: NetId | string; size?: number }) {
  return <img className="coin" src={`img/net/${id}.svg`} width={size} height={size} alt="" draggable={false} />
}

/** Coin with a small network badge in the bottom-right corner (search / chart headers). */
export function CoinNet({ id, size = 32, net = 'eth' }: { id: CoinId; size?: number; net?: string }) {
  const b = Math.round(size * 0.4)
  return (
    <span className="coin-net" style={{ width: size, height: size }}>
      <Coin id={id} size={size} />
      <span className="badge-net" style={{ width: b + 2, height: b + 2 }}>
        <Net id={net} size={b} />
      </span>
    </span>
  )
}

export function WalletLogo({ id, size = 40, radius }: { id: string; size?: number; radius?: number }) {
  if (id === 'kotai')
    return (
      <span className="wlogo kotai" style={{ width: size, height: size, borderRadius: radius ?? size * 0.28 }}>
        <img src="img/wallet/kotai.png" alt="" width={size * 0.72} height={size * 0.72} draggable={false} />
      </span>
    )
  if (id === 'more')
    return (
      <span className="wlogo more" style={{ width: size, height: size, borderRadius: radius ?? size * 0.28 }}>
        <Icon n="dots" size={size * 0.5} sw={2.4} />
      </span>
    )
  return <img className="wlogo" src={`img/wallet/${id}.png`} width={size} height={size} alt="" draggable={false} style={{ borderRadius: radius ?? '50%' }} />
}

/* ───────── Logo (official KOTAI DEX SVG from /public/logo.svg) ───────── */
export function Logo({ height = 37 }: { height?: number }) {
  return <img className="logo" src="logo.svg" height={height} alt="KOTAI DEX" style={{ width: 'auto', display: 'block' }} />
}

/* ───────── Loading · "Anel girando" — white arc fading into the outline gradient ───────── */
export function Spinner({ size = 18, stroke }: { size?: number; stroke?: number }) {
  const w = stroke ?? (size >= 30 ? 2.5 : 2)
  return <span className="ring-spin" style={{ width: size, height: size, ['--rw' as string]: `${w}px` }} aria-hidden />
}

/** Keeps something mounted for `ms` after it closes so it can play an exit animation. */
export function usePresence(open: boolean, ms = 200) {
  const [mounted, setMounted] = useState(open)
  useEffect(() => {
    if (open) {
      setMounted(true)
      return
    }
    const t = window.setTimeout(() => setMounted(false), ms)
    return () => window.clearTimeout(t)
  }, [open, ms])
  return { render: open || mounted, closing: !open && mounted }
}

/** While any overlay is open the page underneath can't scroll (wheel/touch stay in the dialog).
    Counter-based, so dialogs replacing each other don't unlock in between; the scrollbar gap is padded so nothing shifts. */
let scrollLocks = 0
export function useScrollLock() {
  useEffect(() => {
    const root = document.documentElement
    if (scrollLocks++ === 0) {
      const gap = window.innerWidth - root.clientWidth
      root.style.overflow = 'hidden'
      if (gap > 0) root.style.paddingRight = gap + 'px'
    }
    return () => {
      if (--scrollLocks === 0) {
        root.style.overflow = ''
        root.style.paddingRight = ''
      }
    }
  }, [])
}

/* ───────── Modal / bottom sheet ───────── */
/* When one dialog replaces another in the same commit (review → signing → processing → done…),
   the new one skips the scrim fade and pop-in so it reads as the same modal updating in place. */
let liveModals = 0

export function Modal({
  title,
  sub,
  onClose,
  onBack,
  children,
  className,
  icon,
  onScrim,
  under,
  width,
}: {
  title?: ReactNode
  sub?: ReactNode
  onClose?: () => void
  onBack?: () => void
  children: ReactNode
  className?: string
  icon?: ReactNode
  onScrim?: () => void
  /** rendered dimmed under this dialog (stacked confirm) */
  under?: ReactNode
  width?: number
}) {
  const handleRef = useRef<() => void>()
  handleRef.current = onScrim ?? onClose
  const [inPlace] = useState(() => liveModals > 0 && !under)
  useScrollLock()
  useEffect(() => {
    liveModals++
    return () => {
      liveModals--
    }
  }, [])
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleRef.current?.()
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [])
  const sheet = (
    <div className={'modal' + (className ? ' ' + className : '') + (inPlace ? ' in-place' : '')} role="dialog" aria-modal="true" style={width ? { maxWidth: width } : undefined}>
      <span className="handle" />
      {(title || onClose) && (
        <div className="modal-head">
          <h2 className="modal-title">
            {onBack && (
              <button className="sq-btn" onClick={onBack} aria-label="Back">
                <Icon n="back" size={16} />
              </button>
            )}
            {icon}
            {title}
          </h2>
          {onClose && (
            <button className="sq-btn" onClick={onClose} aria-label="Close">
              <Icon n="x" size={16} />
            </button>
          )}
        </div>
      )}
      {sub && <p className="modal-sub">{sub}</p>}
      {children}
    </div>
  )
  return (
    <div className={'scrim' + (under ? ' stacked' : '') + (inPlace ? ' in-place' : '')} onMouseDown={(e) => e.target === e.currentTarget && (onScrim ?? onClose)?.()}>
      {under ? (
        <div className="stack-wrap">
          <div className="under" aria-hidden>
            {under}
          </div>
          {sheet}
        </div>
      ) : (
        sheet
      )}
    </div>
  )
}

export function Banner({ tone, children }: { tone: 'warn' | 'error' | 'info' | 'offline'; children: ReactNode }) {
  return (
    <div className={'banner ' + tone} role="status">
      <Icon n="warn" size={18} />
      <span>{children}</span>
    </div>
  )
}

/** Small hook: true for `ms` after `dep` changes (used for "Updating estimate…" states). */
export function useBusy(dep: unknown, ms: number, enabled = true): boolean {
  const [busy, setBusy] = useState(false)
  const first = useRef(true)
  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    if (!enabled) return
    setBusy(true)
    const t = window.setTimeout(() => setBusy(false), ms)
    return () => window.clearTimeout(t)
  }, [dep, ms, enabled])
  return busy
}
