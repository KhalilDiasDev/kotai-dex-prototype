import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ADDRESS, CURRENCIES, LANGUAGES, NETWORKS } from '../data'
import { useApp, type ModalKind } from '../store'
import { Coin, Icon, Logo, Net, usePresence } from './ui'

/** Closes the open dropdown on outside click / Escape. */
function useDismiss(ref: React.RefObject<HTMLElement>, open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return
    const down = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    const key = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    const t = window.setTimeout(() => document.addEventListener('mousedown', down))
    window.addEventListener('keydown', key)
    return () => {
      window.clearTimeout(t)
      document.removeEventListener('mousedown', down)
      window.removeEventListener('keydown', key)
    }
  }, [open, onClose, ref])
}

export function Anchor({ kinds, children, pop }: { kinds: ModalKind[]; children: ReactNode; pop: ReactNode }) {
  const a = useApp()
  const ref = useRef<HTMLDivElement>(null)
  const open = !a.isMobile && kinds.includes(a.modal)
  useDismiss(ref, open, a.close)
  // keep the popover for a beat after closing so it can ease out
  const p = usePresence(open, 160)
  return (
    <div className="anchor" ref={ref}>
      {children}
      {p.render && <div className={'pop-layer' + (p.closing ? ' closing' : '')}>{pop}</div>}
    </div>
  )
}

/* ───────── Dropdown · Rede ───────── */
export function NetworkList({ onPick }: { onPick: (id: string) => void }) {
  const a = useApp()
  return (
    <>
      {NETWORKS.map((n) => (
        <button key={n.id} className={'dd-item' + (n.id === a.networkId ? ' sel' : '') + (!n.hasKtiPool ? ' off' : '')} onClick={() => onPick(n.id)}>
          <Net id={n.id} size={22} />
          <span className="grow">{n.name}</span>
          {!n.hasKtiPool && <span className="cap12">No KTI pool</span>}
          {n.id === a.networkId && <Icon n="checkCircle" size={16} className="ok" />}
        </button>
      ))}
    </>
  )
}

function NetworkDropdown() {
  const a = useApp()
  return (
    <div className="dropdown dd-net" role="menu">
      <div className="dd-label">Select network</div>
      <NetworkList onPick={a.setNetwork} />
    </div>
  )
}

/* ───────── Dropdown · Carteira ───────── */
export function WalletMenuBody() {
  const a = useApp()
  const copy = () => {
    navigator.clipboard?.writeText('0x7a25f3b9c8d1e6a2b4c5d7e8f9a0b1c2d3e4c3e1').catch(() => {})
    a.toast({ tone: 'success', title: 'Address copied', body: `${ADDRESS} · copied to clipboard` })
  }
  // network picker opens inside this same menu, with a back row (like Language / Currency)
  if (a.modal === 'walletNet') {
    return (
      <div className="wm-sub">
        <button className="dd-title back" onClick={() => a.set({ modal: 'walletMenu' })}>
          <Icon n="back" size={14} sw={2} /> Select network
        </button>
        <NetworkList
          onPick={(id) => {
            a.setNetwork(id)
            a.set({ modal: 'walletMenu' })
          }}
        />
      </div>
    )
  }
  const onKotai = a.walletId === 'kotai'
  return (
    <>
      <div className="wm-head">
        <span className="wm-acc">
          <img src="img/avatar.svg" width={40} height={40} alt="" />
          <span className="mono">{ADDRESS}</span>
        </span>
        <button className="wm-net" onClick={() => a.set({ modal: 'walletNet' })} aria-label="Change network">
          <Net id={a.networkId} size={20} />
          <Icon n="chevron" size={12} sw={2} />
        </button>
      </div>
      <div className="wm-bal">
        <span className="cap12">Balance</span>
        <b>$3,500.00</b>
        <span className="cap12 hi">1.0000 ETH · 0 KTI</span>
      </div>
      <div className="wm-list">
        <button className="dd-item" onClick={copy}>
          <Icon n="copy" size={18} /> Copy address
        </button>
        <button className="dd-item" onClick={() => a.toast({ tone: 'info', title: 'View on explorer', body: 'Opens etherscan.io in the real product' })}>
          <Icon n="ext" size={18} /> View on explorer
        </button>
        <button className="dd-item" onClick={() => a.open('history')}>
          <Icon n="clock" size={18} /> Swap history
        </button>
        <span className="dd-sep" />
        {onKotai ? (
          <div className="wm-kotai on">
            <span className="kw-logo">
              <img src="img/wallet/kotai.png" alt="" />
            </span>
            <span className="grow">
              <b>Kotai Wallet</b>
              <small>Connected</small>
            </span>
            <Icon n="checkCircle" size={18} className="ok" />
          </div>
        ) : (
          /* runs the real Kotai Wallet connection (QR → approve); Back returns to this menu */
          <button className="wm-kotai" onClick={() => a.push('kotaiWallet')}>
            <span className="kw-logo">
              <img src="img/wallet/kotai.png" alt="" />
            </span>
            <span className="grow">
              <b>Switch to Kotai Wallet</b>
              <small>Recommended</small>
            </span>
            <Icon n="chevronR" size={18} sw={2} />
          </button>
        )}
        <button className="dd-item" onClick={() => a.open('connect')}>
          <Icon n="flip" size={18} /> Switch wallet
        </button>
        <button className="dd-item" onClick={() => a.open('connect')}>
          <Icon n="plus" size={18} sw={2} /> Connect another wallet
        </button>
        <span className="dd-sep" />
        <button className="dd-item danger" onClick={a.disconnect}>
          <Icon n="xCircle" size={18} /> Disconnect
        </button>
      </div>
    </>
  )
}

/* ───────── Dropdown · Configurações do sistema / Idioma / Moeda ───────── */
export function SystemBody() {
  const a = useApp()
  if (a.modal === 'language' || a.modal === 'currency') {
    const lang = a.modal === 'language'
    return (
      <>
        <button className="dd-title back" onClick={() => a.set({ modal: 'system' })}>
          <Icon n="back" size={14} sw={2} /> {lang ? 'Language' : 'Currency'}
        </button>
        {lang
          ? LANGUAGES.map((l) => (
              <button key={l.name} className={'dd-item opt' + (a.language === l.name ? ' cur' : '')} onClick={() => a.set({ language: l.name })}>
                <span className="grow">
                  <b>{l.name}</b> <small>{l.native}</small>
                </span>
                {a.language === l.name && <Icon n="check" size={18} sw={2.5} className="ok" />}
              </button>
            ))
          : CURRENCIES.map((c) => (
              <button key={c.code} className={'dd-item opt' + (a.currency === c.code ? ' cur' : '')} onClick={() => a.set({ currency: c.code })}>
                <span className="grow">
                  <b>{c.code}</b> <small>{c.name}</small>
                </span>
                {a.currency === c.code && <Icon n="check" size={18} sw={2.5} className="ok" />}
              </button>
            ))}
      </>
    )
  }
  return (
    <>
      <div className="dd-title">
        <b>Settings</b>
        <small>Applies to the whole app</small>
      </div>
      <button className="dd-item" onClick={() => a.set({ modal: 'language' })}>
        <Icon n="globe" size={18} sw={1.5} />
        <span className="grow">Language</span>
        <span className="val">{a.language === 'Português (Brasil)' ? 'Português' : a.language}</span>
        <Icon n="chevronR" size={18} sw={2} className="val" />
      </button>
      <button className="dd-item" onClick={() => a.set({ modal: 'currency' })}>
        <Icon n="coins" size={18} sw={1.5} />
        <span className="grow">Currency</span>
        <span className="val">{a.currency}</span>
        <Icon n="chevronR" size={18} sw={2} className="val" />
      </button>
    </>
  )
}

export function Header() {
  const a = useApp()
  const [scrolled, setScrolled] = useState(false)
  const net = NETWORKS.find((n) => n.id === a.networkId)!
  const soon = (t: string) => a.toast({ tone: 'info', title: t, body: 'Not part of this prototype' })
  const toggle = (k: ModalKind) => (a.modal === k ? a.close() : a.open(k))
  const sysOpen = a.modal === 'system' || a.modal === 'language' || a.modal === 'currency'
  const walletOpen = a.modal === 'walletMenu' || a.modal === 'walletNet'
  // right after a wallet connects (or switches), the wallet select blinks green: "configure here"
  const [flash, setFlash] = useState(false)
  const first = useRef(true)
  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    if (!a.connected) return
    setFlash(false)
    const t0 = window.setTimeout(() => setFlash(true), 450)
    const t1 = window.setTimeout(() => setFlash(false), 450 + 2700)
    return () => {
      window.clearTimeout(t0)
      window.clearTimeout(t1)
    }
  }, [a.connected, a.walletId])

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 4)
    h()
    window.addEventListener('scroll', h, { passive: true })
    return () => window.removeEventListener('scroll', h)
  }, [])

  return (
    <header className={'header' + (scrolled ? ' scrolled' : '')}>
      <div className="header-in">
        <div className="left">
          <button className="brand-btn" onClick={() => a.set({ view: 'home', modal: null, chart: 'off' })} aria-label="KOTAI DEX home">
            <Logo height={a.isMobile ? 22 : 37} />
          </button>
        </div>

        <nav className="nav" aria-label="Main">
          <button className={'nav-item gb' + (a.view === 'home' ? ' active' : '')} onClick={() => a.set({ view: 'home', chart: 'off' })}>
            Home
          </button>
          <button className={'nav-item gb' + (a.view === 'swap' ? ' active' : '')} onClick={() => a.set({ view: 'swap' })}>
            Swap
          </button>
          <button className="nav-item gb" onClick={() => soon('Market')}>
            Market
          </button>
          <button className="nav-item gb" onClick={() => soon('Invest')}>
            Invest
          </button>
          <button className="nav-item gb coin" onClick={() => a.openCoin('KTI')}>
            <span className="kti-dot">
              <Coin id="KTI" size={18} />
            </span>
            KTI Coin
          </button>
        </nav>

        <div className="right">
          <button className={'icon-btn hide-m' + (a.modal === 'search' ? ' on' : '')} onClick={() => a.open('search')} aria-label="Search">
            <Icon n="search" size={20} />
          </button>
          <Anchor kinds={['system', 'language', 'currency']} pop={<div className={'dropdown dd-sys' + (a.modal !== 'system' ? ' wide' : '')} role="menu"><SystemBody /></div>}>
            <button className={'icon-btn hide-m' + (sysOpen ? ' on' : '')} onClick={() => (sysOpen ? a.close() : a.open('system'))} aria-label="Settings">
              <Icon n="gear" size={22} className="ic-gear" />
            </button>
          </Anchor>
          {a.connected && (
            <Anchor kinds={['network']} pop={<NetworkDropdown />}>
              <button className={'pill-btn hide-m' + (a.modal === 'network' ? ' on' : '')} onClick={() => toggle('network')}>
                <Net id={a.networkId} size={20} />
                <span className="pill-name">{net.name}</span>
                <Icon n="chevron" size={16} className="chev" />
              </button>
            </Anchor>
          )}
          {a.connected ? (
            <Anchor kinds={['walletMenu', 'walletNet']} pop={<div className="dropdown dd-wallet" role="menu"><WalletMenuBody /></div>}>
              <button className={'pill-btn' + (walletOpen ? ' on' : '') + (flash ? ' flash' : '')} onClick={() => (walletOpen ? a.close() : a.open('walletMenu'))}>
                <Icon n="wallet" size={18} />
                <span className="mono">{ADDRESS}</span>
                <Icon n="chevron" size={16} className="chev hide-m" />
              </button>
            </Anchor>
          ) : (
            // on phones the connect action lives in the floating corner button instead
            !a.isMobile && (
              <button className="btn white sm" onClick={() => a.open('connect')}>
                Connect wallet
              </button>
            )
          )}
        </div>
      </div>
    </header>
  )
}
