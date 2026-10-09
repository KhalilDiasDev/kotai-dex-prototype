import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ADDRESS, CURRENCIES, LANGUAGES, NETWORKS, TOKENS, TOKEN_LIST, WALLETS, fmt, usd } from '../data'
import { useApp, type ModalKind } from '../store'
import { FundOptions, HistRow, QR } from './Modals'
import { Coin, Icon, Logo, Net, Spinner, WalletLogo, usePresence } from './ui'

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
/* The wallet menu is a small app of its own: network, history, switching wallets and the new wallet's connection
   all open INSIDE the menu, each with a back row to the wallet — nothing closes the menu to open a separate dialog. */
type WalletPage = 'main' | 'net' | 'history' | 'wallets' | 'connect'

function WmBack({ to, onBack, children }: { to?: string; onBack: () => void; children: ReactNode }) {
  return (
    <button className="dd-title back" onClick={onBack} aria-label={`Back to ${to ?? 'wallet'}`}>
      <Icon n="back" size={14} sw={2} /> {children}
    </button>
  )
}

export function WalletMenuBody() {
  const a = useApp()
  const [page, setPage] = useState<WalletPage>(a.modal === 'walletNet' ? 'net' : 'main')
  const [target, setTarget] = useState('kotai')
  const [busy, setBusy] = useState(false)
  const [qr, setQr] = useState(false)
  const copy = () => {
    navigator.clipboard?.writeText('0x7a25f3b9c8d1e6a2b4c5d7e8f9a0b1c2d3e4c3e1').catch(() => {})
    a.toast({ tone: 'success', title: 'Address copied', body: `${ADDRESS} · copied to clipboard` })
  }
  const home = () => setPage('main')
  const startConnect = (id: string) => {
    setTarget(id)
    setBusy(false)
    setQr(false)
    setPage('connect')
  }
  // approving in the wallet connects it and lands back on the wallet's main page (menu stays open)
  const approve = () => {
    if (busy) return
    setBusy(true)
    window.setTimeout(() => {
      a.connectWallet(target)
      a.set({ modal: 'walletMenu' })
      setBusy(false)
      setPage('main')
    }, 1100)
  }

  if (page === 'net') {
    return (
      <div className="wm-sub">
        <WmBack onBack={home}>Select network</WmBack>
        <NetworkList
          onPick={(id) => {
            a.setNetwork(id)
            a.set({ modal: 'walletMenu' })
            home()
          }}
        />
      </div>
    )
  }

  if (page === 'history') {
    return (
      <div className="wm-sub">
        <WmBack onBack={home}>Swap history</WmBack>
        <div className="wm-scroll">
          {a.history.map((h, i) => (
            <HistRow key={i} h={h} compact />
          ))}
        </div>
      </div>
    )
  }

  if (page === 'wallets') {
    return (
      <div className="wm-sub">
        <WmBack onBack={home}>Switch wallet</WmBack>
        <div className="wm-scroll">
          {WALLETS.map((w) => {
            const cur = w.id === a.walletId
            return (
              <button key={w.id} className={'dd-item wm-wallet' + (cur ? ' sel' : '')} onClick={() => (cur ? home() : startConnect(w.id))}>
                <WalletLogo id={w.id} size={28} radius={w.id === 'kotai' || w.id === 'ledger' ? 8 : undefined} />
                <span className="grow">{w.name}</span>
                {cur ? <span className="cap12 ok">Connected</span> : w.recommended ? <span className="cap12 rec">Recommended</span> : null}
                {cur ? <Icon n="checkCircle" size={16} className="ok" /> : <Icon n="chevronR" size={16} sw={2} />}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  if (page === 'connect') {
    const w = WALLETS.find((x) => x.id === target)
    const name = w?.name ?? 'your wallet'
    const app = target === 'ledger' ? 'Ledger Live' : name
    const showQr = !a.isMobile || qr
    return (
      <div className="wm-sub wm-connect">
        <WmBack to="wallets" onBack={() => setPage('wallets')}>
          <WalletLogo id={target} size={22} radius={target === 'kotai' || target === 'ledger' ? 6 : undefined} /> {name}
        </WmBack>
        {showQr ? (
          <div className="qr-box sm">
            <QR logo={<img src={`img/wallet/${target}.webp`} alt="" width={28} height={28} />} onScan={approve} />
            <b>{busy ? 'Connecting…' : `Scan with ${name}`}</b>
          </div>
        ) : (
          <button className="btn accent block" onClick={approve} disabled={busy}>
            {busy ? (
              <>
                <Spinner size={18} /> Waiting for approval…
              </>
            ) : (
              `Open ${app}`
            )}
          </button>
        )}
        <p className="wm-note">Connecting doesn’t give access to your funds: every transaction needs your approval.</p>
        {a.isMobile && (
          <button className="btn secondary block" onClick={() => setQr((v) => !v)}>
            {qr ? 'Open the app instead' : 'Show QR code'}
          </button>
        )}
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
        <button className="wm-net" onClick={() => setPage('net')} aria-label="Change network">
          <Net id={a.networkId} size={20} />
          <Icon n="chevron" size={12} sw={2} />
        </button>
      </div>
      <div className="wm-bal">
        <span className="cap12">Balance</span>
        <b>{usd(TOKEN_LIST.reduce((sum, t) => sum + a.balanceOf(t.id) * t.price, 0))}</b>
        <span className="cap12 hi">
          {a.balanceOf('BNB').toFixed(4)} BNB · {fmt(a.balanceOf('USDT'), 2)} USDT · {fmt(a.balanceOf('KTI'), 0)} KTI
        </span>
      </div>
      {/* empty wallet: the ways to add funds come first */}
      {a.noFunds && (
        <div className="wm-funds">
          <span className="cap12">Add funds to start trading</span>
          <FundOptions compact />
        </div>
      )}
      {/* the wallet in use, right above the address actions */}
      <div className="wm-kotai on wm-current">
        <span className="kw-logo">
          <WalletLogo id={a.walletId} size={32} radius={onKotai || a.walletId === 'ledger' ? 9 : undefined} />
        </span>
        <span className="grow">
          <b>{WALLETS.find((w) => w.id === a.walletId)?.name ?? 'Wallet'}</b>
          <small>Connected</small>
        </span>
        <Icon n="checkCircle" size={18} className="ok" />
      </div>
      <div className="wm-list">
        <button className="dd-item" onClick={copy}>
          <Icon n="copy" size={18} /> Copy address
        </button>
        <button className="dd-item" onClick={() => a.toast({ tone: 'info', title: 'View on explorer', body: 'Opens bscscan.com in the real product' })}>
          <Icon n="ext" size={18} /> View on explorer
        </button>
        <button className="dd-item" onClick={() => setPage('history')}>
          <Icon n="clock" size={18} /> <span className="grow">Swap history</span>
          <Icon n="chevronR" size={16} sw={2} className="go" />
        </button>
        <span className="dd-sep" />
        {!onKotai && (
          /* runs the Kotai Wallet connection (QR → approve) right here in the menu */
          <button className="wm-kotai" onClick={() => startConnect('kotai')}>
            <span className="kw-logo">
              <img src="img/wallet/kotai.webp" alt="" />
            </span>
            <span className="grow">
              <b>Switch to Kotai Wallet</b>
              <small>Recommended</small>
            </span>
            <Icon n="chevronR" size={18} sw={2} />
          </button>
        )}
        <button className="dd-item" onClick={() => setPage('wallets')}>
          <Icon n="flip" size={18} /> <span className="grow">Switch wallet</span>
          <Icon n="chevronR" size={16} sw={2} className="go" />
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
              <button key={l.name} className={'dd-item opt' + (a.language === l.name ? ' cur' : '')} onClick={() => (a.toast({ tone: 'success', title: `Language: ${l.name}` }), a.set({ language: l.name }))}>
                <span className="grow">
                  <b>{l.name}</b> <small>{l.native}</small>
                </span>
                {a.language === l.name && <Icon n="check" size={18} sw={2.5} className="ok" />}
              </button>
            ))
          : CURRENCIES.map((c) => (
              <button key={c.code} className={'dd-item opt' + (a.currency === c.code ? ' cur' : '')} onClick={() => (a.toast({ tone: 'success', title: `Currency: ${c.code}` }), a.set({ currency: c.code }))}>
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
            <button className="btn white sm" onClick={() => a.open('connect')}>
              {a.isMobile ? 'Connect' : 'Connect wallet'}
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
