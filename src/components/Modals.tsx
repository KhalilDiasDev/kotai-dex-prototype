import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { ADDRESS, NETWORKS, TOKENS, TOKEN_LIST, WALLETS, fmt, unitPrice, usd, type HistoryItem, type TokenId } from '../data'
import { useApp, type ModalKind } from '../store'
import { NetworkList, SystemBody, WalletMenuBody } from './Header'
import { HelpTip } from './SwapPanel'
import { Banner, Coin, Icon, Modal, Net, Spinner, WalletLogo, usePresence, useScrollLock, type CoinId } from './ui'

/* ───────────── QR code · component "QR code" (25×25 modules, rounded) ───────────── */
const QR_ROWS = [
  '0000000011110100000000000', '0000000011011001100000000', '0000000010000110100000000', '0000000010011001000000000', '0000000001010001100000000',
  '0000000000000110100000000', '0000000000101000000000000', '0000000000100100100000000', '1101101011100010000100010', '1000110010000000010001100',
  '1010111100000000101000010', '0110011000000000100001011', '0110011000000000011110001', '0101001000000000010001110', '0001000110000000000100001',
  '1001010010000000000011001', '0011011000000100000101100', '0000000000110100001101101', '0000000001101011001000111', '0000000010010100100001100',
  '0000000000110000001101000', '0000000000100110001000011', '0000000001110101101011101', '0000000001100010001111110', '0000000000101010000110011',
]
export function QR({ logo, onScan }: { logo: ReactNode; onScan?: () => void }) {
  const mods = useMemo(() => {
    const out: [number, number][] = []
    QR_ROWS.forEach((r, y) => [...r].forEach((b, x) => b === '1' && out.push([x, y])))
    return out
  }, [])
  const a = (x: number, y: number) => (
    <g key={x + '-' + y}>
      <rect x={x + 3.42} y={y + 3.42} width={43.56} height={43.56} rx={10.7} fill="none" stroke="#0a1424" strokeWidth={6.84} />
      <rect x={x + 14.4} y={y + 14.4} width={21.6} height={21.6} rx={6.48} fill="#0a1424" />
    </g>
  )
  return (
    <button className="qr" onClick={onScan} aria-label="Simulate scanning the code">
      <svg viewBox="0 0 220 220" width="220" height="220" aria-hidden>
        <rect width="220" height="220" rx="20" fill="#fff" />
        {mods.map(([x, y]) => (
          <rect key={x + '_' + y} x={21 + x * 7.2} y={21 + y * 7.2} width={5.18} height={5.18} rx={1.66} fill="#0a1424" />
        ))}
        {a(20, 20)}
        {a(149.6, 20)}
        {a(20, 149.6)}
        <rect x="88" y="88" width="44" height="44" rx="12" fill="#fff" />
      </svg>
      <span className="qr-logo">{logo}</span>
      <span className="qr-hint">Tap to simulate a scan</span>
    </button>
  )
}

const Foot = () => (
  <p className="m-foot">
    <Icon n="shield" size={16} /> Encrypted connection. KOTAI will never ask for your recovery phrase.
  </p>
)
/* download hook shown inside the Kotai Wallet modal */
const KotaiDownload = () => {
  const a = useApp()
  const store = (name: string) => a.toast({ tone: 'info', title: name, body: 'Opens the Kotai Wallet page in the real product' })
  return (
    <div className="kw-dl">
      <div className="kw-dl-txt">
        <img src="img/wallet/kotai.webp" alt="" width={36} height={36} />
        <span>
          <b>Don’t have Kotai Wallet yet?</b>
          <small>Free on iOS and Android · set up in 2 minutes</small>
        </span>
      </div>
      <div className="kw-dl-btns">
        <button className="kw-store" onClick={() => store('App Store')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M16.37 12.6c-.02-2.2 1.8-3.26 1.88-3.31-1.03-1.5-2.62-1.7-3.18-1.73-1.35-.14-2.64.8-3.33.8-.69 0-1.74-.78-2.87-.76-1.47.02-2.83.86-3.59 2.18-1.53 2.66-.39 6.6 1.1 8.75.73 1.05 1.6 2.24 2.73 2.2 1.1-.05 1.51-.71 2.84-.71 1.32 0 1.7.71 2.86.69 1.18-.02 1.93-1.07 2.65-2.13.84-1.22 1.18-2.4 1.2-2.46-.03-.01-2.3-.88-2.32-3.5ZM14.2 6.13c.6-.73 1.01-1.75.9-2.76-.87.04-1.92.58-2.54 1.31-.56.65-1.05 1.68-.92 2.67.97.08 1.96-.49 2.56-1.22Z" />
          </svg>
          App Store
        </button>
        <button className="kw-store" onClick={() => store('Google Play')}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M4.2 2.4c-.25.26-.4.66-.4 1.18v16.84c0 .52.15.92.4 1.18l9.4-9.6-9.4-9.6Zm10.6 10.8 2.9 2.96-11.35 6.5c-.5.28-.95.31-1.28.13l9.73-9.6Zm0-2.4L5.07 1.21c.33-.18.78-.15 1.28.13l11.35 6.5-2.9 2.96Zm4.07-1.9 3.03 1.73c.87.5.87 1.3 0 1.8l-3.03 1.73L15.9 12l2.97-3.1Z" />
          </svg>
          Google Play
        </button>
      </div>
    </div>
  )
}

const GetApp = () => {
  const a = useApp()
  return (
    <p className="m-getapp">
      Don’t have Kotai Wallet?{' '}
      <button className="m-link" onClick={() => a.toast({ tone: 'info', title: 'Get the app', body: 'Opens the App Store / Google Play in the real product' })}>
        Get the app <Icon n="ext" size={14} />
      </button>
    </p>
  )
}

/* ───────────── 01a · Connect wallet ───────────── */
function ConnectModal() {
  const a = useApp()
  const [q, setQ] = useState('')
  const list = [...WALLETS.map((w) => ({ id: w.id, name: w.name })), { id: 'more', name: 'More wallets' }].filter((w) => w.name.toLowerCase().includes(q.toLowerCase()))
  return (
    <Modal title="Connect wallet" onClose={a.close} sub="Choose how to connect. Connecting doesn’t give access to your funds: every transaction needs your approval.">
      <label className="m-search">
        <Icon n="search" size={18} />
        <input placeholder="Search wallets" value={q} onChange={(e) => setQ(e.target.value)} />
      </label>
      <div className="wallet-grid">
        {list.map((w) => (
          <button
            key={w.id}
            className={'w-tile' + (w.id === 'kotai' ? ' rec' : '')}
            onClick={() => {
              a.set({ walletId: w.id === 'more' ? 'walletconnect' : w.id })
              a.push(w.id === 'kotai' ? 'kotaiWallet' : 'otherWallets')
            }}
          >
            <WalletLogo id={w.id} size={44} radius={w.id === 'kotai' || w.id === 'ledger' ? 12 : w.id === 'more' ? 14 : undefined} />
            <span className="nm">{w.name}</span>
            {w.id === 'kotai' && <span className="rec-badge">Recommended</span>}
          </button>
        ))}
        {list.length === 0 && <p className="m-empty">No wallets match “{q}”.</p>}
      </div>
      <GetApp />
      <Foot />
    </Modal>
  )
}

function useAutoConnect(id: string) {
  const a = useApp()
  const [busy, setBusy] = useState(false)
  const go = () => {
    if (busy) return
    setBusy(true)
    window.setTimeout(() => a.connectWallet(id), 1100)
  }
  return { busy, go }
}

/* ───────────── 01a2 · Kotai Wallet (QR) ───────────── */
function KotaiWalletModal() {
  const a = useApp()
  const { busy, go } = useAutoConnect('kotai')
  const steps = ['Open Kotai Wallet on your phone', 'Tap “Scan” and point at the code', 'Approve the connection in the app']
  return (
    <Modal
      title="Kotai Wallet"
      icon={<WalletLogo id="kotai" size={32} radius={9} />}
      onBack={a.back}
      onClose={() => a.push('cancelConnect')}
      onScrim={() => a.push('cancelConnect')}
      sub={a.isMobile ? 'Open the Kotai Wallet app to approve the connection. Connecting doesn’t give access to your funds: every transaction needs your approval.' : 'Scan the code with Kotai Wallet. Connecting doesn’t give access to your funds: every transaction needs your approval.'}
      className="gap24"
    >
      {a.isMobile ? (
        <button className="btn accent block" onClick={go} disabled={busy}>
          {busy ? (
            <>
              <Spinner size={18} /> Waiting for approval…
            </>
          ) : (
            'Open Kotai Wallet'
          )}
        </button>
      ) : (
        <div className="qr-box">
          <span className="rec-pill">Recommended</span>
          <QR logo={<img src="img/wallet/kotai.webp" alt="" width={28} height={28} />} onScan={go} />
          <b>{busy ? 'Connecting…' : 'Scan with Kotai Wallet'}</b>
        </div>
      )}
      <ol className="m-steps">
        {(a.isMobile ? ['Tap “Open Kotai Wallet” above', 'Approve the connection in the app', 'Come back here: we’ll continue automatically'] : steps).map((t, i) => (
          <li key={t}>
            <span>{i + 1}</span>
            {t}
          </li>
        ))}
      </ol>
      <KotaiDownload />
      <Foot />
    </Modal>
  )
}

/* ───────────── 01b · Wallet QR — one per wallet (MetaMask, Coinbase…), each with its own logo; "More wallets" = WalletConnect ───────────── */
function OtherWalletsModal() {
  const a = useApp()
  const id = a.walletId && a.walletId !== 'kotai' ? a.walletId : 'walletconnect'
  const generic = id === 'walletconnect'
  const name = WALLETS.find((w) => w.id === id)?.name ?? 'your wallet'
  const { busy, go } = useAutoConnect(id)
  // phones open the wallet app directly; the QR is only an option for a wallet on another device
  const [qr, setQr] = useState(false)
  const showQr = !a.isMobile || qr
  const app = id === 'ledger' ? 'Ledger Live' : generic ? 'your wallet app' : name
  const copy = () => a.toast({ tone: 'success', title: 'Link copied', body: 'Paste it in your wallet to connect' })
  return (
    <Modal
      title={generic ? 'Other wallets' : name}
      icon={<WalletLogo id={id} size={32} radius={id === 'ledger' ? 9 : undefined} />}
      onBack={a.back}
      onClose={() => a.push('cancelConnect')}
      onScrim={() => a.push('cancelConnect')}
      sub={
        showQr
          ? `Scan the code with ${generic ? 'any compatible wallet' : name}. Connecting doesn’t give access to your funds: every transaction needs your approval.`
          : `Open ${app} to approve the connection. Connecting doesn’t give access to your funds: every transaction needs your approval.`
      }
      className="gap24"
    >
      {showQr ? (
        <div className="qr-box">
          <QR logo={<img src={`img/wallet/${id}.webp`} alt="" width={28} height={28} />} onScan={go} />
          <b>{busy ? 'Connecting…' : generic ? 'Scan with your wallet' : `Scan with ${name}`}</b>
        </div>
      ) : (
        <>
          <button className="btn accent block" onClick={go} disabled={busy}>
            {busy ? (
              <>
                <Spinner size={18} /> Waiting for approval…
              </>
            ) : (
              `Open ${app === 'your wallet app' ? 'wallet app' : app}`
            )}
          </button>
          <ol className="m-steps">
            {[`Tap “Open ${app === 'your wallet app' ? 'wallet app' : app}” above`, 'Approve the connection in the app', 'Come back here: we’ll continue automatically'].map((t, i) => (
              <li key={t}>
                <span>{i + 1}</span>
                {t}
              </li>
            ))}
          </ol>
        </>
      )}
      {generic && <p className="m-text">Works with MetaMask, Trust Wallet, Rainbow and 300+ WalletConnect-compatible wallets.</p>}
      {a.isMobile ? (
        <div className="m-row2">
          <button className="btn secondary" onClick={copy}>
            <Icon n="copy" size={18} /> Copy link
          </button>
          <button className="btn secondary" onClick={() => setQr((v) => !v)}>
            {qr ? (
              <>
                <Icon n="phone" size={18} /> Open the app
              </>
            ) : (
              'Show QR code'
            )}
          </button>
        </div>
      ) : (
        <div className="m-row2">
          <button className="btn secondary" onClick={copy}>
            <Icon n="copy" size={18} /> Copy link
          </button>
          <button className="btn secondary" onClick={go} disabled={busy}>
            {busy ? <Spinner size={18} /> : <Icon n="phone" size={18} />} Open on phone
          </button>
        </div>
      )}
      <Foot />
    </Modal>
  )
}

/* ───────────── Token selector (I3) + warning (I12) ───────────── */
function TokenSelectModal() {
  const a = useApp()
  const [q, setQ] = useState('')
  const list = TOKEN_LIST.filter((t) => (t.name + t.symbol).toLowerCase().includes(q.toLowerCase()))
  const net = NETWORKS.find((n) => n.id === a.networkId)!
  const current = a.tokenSide === 'from' ? a.from : a.to
  return (
    <Modal title="Select a token" onClose={a.close} className="tok gap16">
      <label className="m-search focus">
        <Icon n="search" size={18} />
        <input autoFocus placeholder="Search name, symbol or paste address" value={q} onChange={(e) => setQ(e.target.value)} />
      </label>
      <div className="tok-net">
        <span className="cap12">Network</span>
        <button className="net-pill" onClick={() => a.push('network')}>
          <Net id={a.networkId} size={14} /> {net.name} <Icon n="chevron" size={12} sw={2} />
        </button>
      </div>
      <div className="tok-pills">
        {TOKEN_LIST.map((t) => (
          <button key={t.id} className={'tok-pill' + (t.id === current ? ' on' : '')} onClick={() => a.pickToken(t.id)}>
            <Coin id={t.id} size={20} /> {t.symbol}
          </button>
        ))}
      </div>
      <span className="m-div" />
      <div className="tok-list">
        {list.map((t) => (
          <button key={t.id} className={'tok-row' + (t.id === current ? ' on' : '')} onClick={() => a.pickToken(t.id)}>
            <Coin id={t.id} size={36} />
            <span className="grow">
              <b>
                {t.id === 'USDT' ? 'Tether' : t.name} {t.native && <span className="badge blue">Native</span>}
              </b>
              <small>
                {t.networkLabel} · <span className="tok-price">{unitPrice(t.price)}</span>
              </small>
            </span>
            <span className="r">
              <b>{a.balanceOf(t.id) > 0 ? fmt(a.balanceOf(t.id), 4) : '0'}</b>
              <small>{usd(a.balanceOf(t.id) * t.price)}</small>
            </span>
          </button>
        ))}
        {list.length === 0 && <p className="m-empty">No tokens found for “{q}”.</p>}
      </div>
    </Modal>
  )
}

function TokenWarning() {
  const a = useApp()
  const [skip, setSkip] = useState(false)
  return (
    <Modal onClose={a.close} className="warn-modal">
      <span className="warn-ico">
        <Icon n="info" size={22} sw={2} />
      </span>
      <h2>Always do your research</h2>
      <p>
        KTI isn't traded on leading centralized exchanges.{' '}
        <button onClick={() => a.toast({ tone: 'info', title: 'Learn more', body: 'Opens the help center in the real product' })}>Learn more</button>
      </p>
      <label className={'m-check' + (skip ? ' on' : '')}>
        <input type="checkbox" checked={skip} onChange={(e) => setSkip(e.target.checked)} />
        <span className="box">{skip && <Icon n="check" size={14} sw={2.5} />}</span>
        Don't show me this warning again
      </label>
      <div className="m-row2">
        <button className="btn accent" onClick={() => a.set({ modal: 'tokenSelect', pendingToken: null })}>
          Go back
        </button>
        <button
          className="btn white"
          onClick={() => {
            a.set({ skipWarning: skip })
            a.confirmWarning()
          }}
        >
          Continue
        </button>
      </div>
    </Modal>
  )
}

/* ───────────── Swap settings (I2) — popover on desktop, sheet on mobile ───────────── */
export function SettingsBody({ onClose }: { onClose: () => void }) {
  const a = useApp()
  const [custom, setCustom] = useState(a.slippage !== 'Auto' && !['0.1', '0.5', '1'].includes(a.slippage) ? a.slippage : '')
  return (
    <>
      <div className="pop-head">
        <h3>Swap settings</h3>
        <button onClick={onClose} aria-label="Close">
          <Icon n="x" size={16} sw={2} />
        </button>
      </div>
      <div className="set-group">
        <span className="set-label">
          Max slippage <Icon n="info" size={14} />
        </span>
        <div className="seg">
          {['Auto', '0.1', '0.5', '1'].map((s) => (
            <button
              key={s}
              className={a.slippage === s ? 'on' : ''}
              onClick={() => {
                a.set({ slippage: s })
                setCustom('')
              }}
            >
              {s === 'Auto' ? 'Auto' : s + '%'}
            </button>
          ))}
        </div>
        <label className="set-input">
          <input
            placeholder="Custom"
            inputMode="decimal"
            value={custom}
            onChange={(e) => {
              const v = e.target.value.replace(/[^0-9.]/g, '')
              setCustom(v)
              a.set({ slippage: v || 'Auto' })
            }}
          />
          %
        </label>
        <p className="set-note">Auto uses 0.5% for this pair. Your swap reverts if the price moves more than this.</p>
      </div>
      <div className="set-row">
        <span className="set-label">
          Transaction deadline <Icon n="info" size={14} />
        </span>
        <label className="set-input mini">
          <input value={a.deadline} inputMode="numeric" onChange={(e) => a.set({ deadline: parseInt(e.target.value.replace(/\D/g, '') || '0', 10) })} />
          min
        </label>
      </div>
    </>
  )
}

/* ───────────── Coin details (I11) ───────────── */
type CoinInfo = { id: CoinId; name: string; price: string; up: boolean; chg: string; cap: string; vol: string; net: string; ys: number[]; h: number; swap?: TokenId }
const parse = (s: string) => s.split(',').map(Number)
export const COIN_INFO: Record<string, CoinInfo> = {
  ETH: { id: 'ETH', name: 'Ethereum', price: '$3500', up: true, chg: '+37.40 (1.08%)', cap: '$412.6B', vol: '$18.2B', net: 'Ethereum', h: 115, swap: 'ETH', ys: parse('0.991,1,0.936,0.881,0.893,0.866,0.919,0.92,0.922,0.94,0.954,0.928,0.935,0.953,0.883,0.886,0.866,0.808,0.822,0.79,0.759,0.783,0.811,0.817,0.867,0.863,0.9,0.832,0.797,0.721,0.671,0.625,0.58,0.633,0.655,0.654,0.666,0.604,0.639,0.603,0.655,0.666,0.651,0.58,0.505,0.489,0.498,0.515,0.5,0.521,0.488,0.486,0.513,0.503,0.449,0.416,0.438,0.492,0.438,0.389,0.322,0.255,0.221,0.195,0.217,0.261,0.227,0.261,0.315,0.302,0.224,0.24,0.237,0.196,0.199,0.161,0.196,0.116,0.069,0.046,0.045,0.036,0.001,0.029,0,0.003,0.024,0.017,0.075,0.103,0.11') },
  BTC: { id: 'BTC', name: 'Bitcoin', price: '$67420', up: true, chg: '+1,408 (2.14%)', cap: '$1.33T', vol: '$31.4B', net: 'Bitcoin', h: 118, swap: 'BTC', ys: parse('0.981,0.951,1,0.942,0.943,0.897,0.894,0.872,0.851,0.889,0.901,0.842,0.823,0.764,0.791,0.779,0.722,0.679,0.691,0.642,0.669,0.682,0.664,0.683,0.731,0.707,0.634,0.636,0.658,0.599,0.527,0.471,0.483,0.483,0.446,0.481,0.523,0.576,0.594,0.525,0.469,0.449,0.486,0.526,0.517,0.494,0.531,0.481,0.539,0.516,0.479,0.506,0.543,0.476,0.515,0.505,0.436,0.442,0.366,0.425,0.463,0.474,0.402,0.397,0.395,0.358,0.388,0.446,0.406,0.387,0.381,0.396,0.338,0.282,0.27,0.238,0.168,0.179,0.119,0.099,0.065,0.007,0,0.02,0.032,0.06,0.023,0.073,0.129,0.096,0.113') },
  KTI: { id: 'KTI', name: 'Kotai Coin', price: '$0.000025', up: true, chg: '+0.0000011 (4.80%)', cap: '$84.0M', vol: '$2.1M', net: 'BNB Chain', h: 133, swap: 'KTI', ys: parse('1,0.938,0.96,0.904,0.896,0.837,0.788,0.746,0.708,0.759,0.768,0.807,0.766,0.768,0.755,0.731,0.767,0.742,0.75,0.691,0.646,0.649,0.592,0.62,0.663,0.623,0.582,0.523,0.471,0.433,0.47,0.409,0.349,0.303,0.338,0.281,0.225,0.253,0.255,0.283,0.259,0.214,0.175,0.185,0.233,0.206,0.144,0.16,0.157,0.097,0.06,0.109,0.153,0.163,0.157,0.169,0.146,0.112,0.143,0.169,0.175,0.131,0.153,0.166,0.144,0.163,0.123,0.075,0.079,0.058,0,0.012,0.034,0,0,0,0,0,0,0,0,0.024,0.043,0.056,0.1,0.147,0.183,0.159,0.208,0.245,0.241') },
  SOL: { id: 'SOL', name: 'Solana', price: '$148.20', up: false, chg: '-5.01 (3.27%)', cap: '$68.4B', vol: '$3.9B', net: 'Solana', h: 138, ys: parse('0.106,0.145,0.162,0.119,0.119,0.176,0.216,0.172,0.131,0.097,0.121,0.145,0.098,0.053,0.02,0,0.019,0.022,0.044,0.103,0.127,0.137,0.174,0.228,0.286,0.246,0.245,0.263,0.276,0.268,0.301,0.364,0.369,0.412,0.412,0.405,0.393,0.415,0.42,0.434,0.451,0.514,0.538,0.54,0.541,0.524,0.505,0.478,0.438,0.475,0.451,0.423,0.375,0.351,0.324,0.369,0.401,0.463,0.487,0.504,0.497,0.537,0.54,0.585,0.56,0.527,0.558,0.549,0.606,0.596,0.609,0.636,0.627,0.683,0.663,0.659,0.669,0.73,0.788,0.789,0.837,0.833,0.892,0.913,0.889,0.856,0.857,0.9,0.962,0.961,1') },
  BNB: { id: 'BNB', name: 'BNB', price: '$600.00', up: false, chg: '-2.53 (0.42%)', cap: '$86.3B', vol: '$1.8B', net: 'BNB Chain', h: 128, swap: 'BNB', ys: parse('0.059,0.063,0.06,0.009,0,0.042,0.036,0.092,0.152,0.135,0.158,0.154,0.203,0.211,0.263,0.227,0.213,0.228,0.25,0.298,0.252,0.253,0.25,0.32,0.382,0.445,0.469,0.425,0.491,0.497,0.511,0.567,0.625,0.623,0.695,0.72,0.734,0.738,0.729,0.712,0.757,0.796,0.746,0.723,0.782,0.758,0.763,0.797,0.823,0.821,0.791,0.787,0.748,0.793,0.847,0.917,0.866,0.891,0.895,0.887,0.85,0.837,0.804,0.872,0.823,0.839,0.805,0.819,0.795,0.779,0.732,0.76,0.825,0.87,0.834,0.835,0.875,0.897,0.947,0.95,0.971,0.92,0.884,0.902,0.912,0.899,0.846,0.821,0.887,0.955,1') },
  USDT: { id: 'USDT', name: 'Tether', price: '$1.00', up: true, chg: '+0.00 (0.00%)', cap: '$118.2B', vol: '$46.9B', net: 'Multi-chain', h: 119, swap: 'USDT', ys: parse('0.976,0.924,0.878,0.934,0.896,0.901,0.959,0.977,1,0.984,0.988,0.932,0.941,0.99,0.987,0.914,0.844,0.855,0.858,0.874,0.863,0.837,0.769,0.704,0.752,0.781,0.815,0.817,0.788,0.793,0.767,0.796,0.761,0.69,0.69,0.735,0.761,0.725,0.681,0.611,0.669,0.662,0.643,0.572,0.546,0.494,0.51,0.461,0.409,0.345,0.289,0.294,0.246,0.219,0.215,0.159,0.131,0.095,0.056,0,0.044,0.086,0.128,0.068,0.108,0.164,0.171,0.19,0.189,0.149,0.147,0.159,0.157,0.171,0.099,0.086,0.142,0.101,0.121,0.108,0.08,0.092,0.063,0.056,0.087,0.08,0.081,0.093,0.145,0.139,0.131') },
  USDC: { id: 'USDC', name: 'USD Coin', price: '$1.00', up: true, chg: '+0.00 (0.00%)', cap: '$34.1B', vol: '$7.2B', net: 'Multi-chain', h: 109, swap: 'USDC', ys: parse('0.924,0.972,0.896,0.951,0.898,0.882,0.888,0.882,0.883,0.887,0.889,0.939,0.918,0.892,0.844,0.894,0.924,0.951,0.951,0.95,1,0.961,0.984,0.927,0.979,0.989,0.908,0.836,0.865,0.887,0.835,0.853,0.875,0.887,0.824,0.766,0.829,0.764,0.699,0.733,0.68,0.639,0.677,0.714,0.755,0.69,0.739,0.758,0.781,0.81,0.745,0.78,0.742,0.796,0.744,0.706,0.723,0.781,0.713,0.766,0.779,0.761,0.766,0.721,0.739,0.715,0.644,0.691,0.737,0.687,0.614,0.625,0.564,0.562,0.613,0.605,0.554,0.603,0.612,0.599,0.534,0.493,0.491,0.476,0.406,0.424,0.363,0.293,0.348,0.277,0') },
  XRP: { id: 'XRP', name: 'XRP', price: '$0.5200', up: true, chg: '+0.0045 (0.86%)', cap: '$29.4B', vol: '$1.1B', net: 'XRP Ledger', h: 142, ys: parse('0.936,0.939,0.974,1,0.951,0.922,0.882,0.858,0.839,0.86,0.86,0.87,0.832,0.863,0.904,0.93,0.922,0.954,0.953,0.936,0.91,0.873,0.851,0.818,0.858,0.849,0.808,0.81,0.766,0.796,0.737,0.741,0.692,0.658,0.673,0.658,0.619,0.663,0.599,0.598,0.581,0.524,0.485,0.49,0.462,0.406,0.354,0.313,0.28,0.265,0.21,0.149,0.13,0.123,0.158,0.149,0.085,0.093,0.132,0.15,0.133,0.069,0.039,0.022,0.016,0.046,0.043,0,0,0,0.001,0.009,0.03,0.015,0.042,0.039,0.026,0.025,0.02,0.012,0.048,0.087,0.108,0.092,0.07,0.105,0.122,0.117,0.158,0.165,0.201') },
}
const RANGE_SEEDS = ['1H', '1D', '1W', '1M', '1Y', 'All']

function CoinModal() {
  const a = useApp()
  const c = COIN_INFO[a.coinToken] ?? COIN_INFO.KTI
  const [range, setRange] = useState('1D')
  const [pick, setPick] = useState(false)
  const [pq, setPq] = useState('')
  const ys = useMemo(() => {
    if (range === '1D') return c.ys
    let s = RANGE_SEEDS.indexOf(range) * 7919 + c.name.length * 97
    return c.ys.map((y, i) => {
      s = (s * 16807) % 2147483647
      const j = (s / 2147483647 - 0.5) * 0.18
      return Math.max(0, Math.min(1, y + (i === 90 ? 0 : j)))
    })
  }, [range, c])
  const W = 664
  const H = a.isMobile ? 220 : 300
  const k = a.isMobile ? H / 300 : 1
  const top = 136 * k
  const amp = c.h * k
  const pts = ys.map((y, i) => [(i / 90) * W, top + y * amp] as const)
  const line = pts.map(([x, y], i) => (i ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1)).join(' ')
  const area = line + ` L${W} ${top + 137 * k} L0 ${top + 137 * k} Z`
  const col = c.up ? '#3ddc97' : '#ff6685'
  const last = pts[90]
  return (
    <Modal
      onClose={a.close}
      className="coin-modal"
      title={
        /* the coin name is a select: pick another coin and its chart loads in this same dialog */
        <button className={'cm-pick' + (pick ? ' on' : '')} onClick={() => setPick((v) => !v)} aria-haspopup="listbox" aria-expanded={pick}>
          <Coin id={c.id} size={36} /> {c.name} <span className="sym">{c.id}</span>
          <Icon n="chevron" size={18} className="chev" />
        </button>
      }
    >
      {pick && (
        <div className="cm-picker" role="listbox">
          <label className="m-search">
            <Icon n="search" size={18} />
            <input autoFocus placeholder="Search coin" value={pq} onChange={(e) => setPq(e.target.value)} />
          </label>
          <div className="cm-pick-list">
            {Object.values(COIN_INFO)
              .filter((x) => (x.name + x.id).toLowerCase().includes(pq.trim().toLowerCase()))
              .sort((x, y) => (x.id === 'KTI' ? -1 : y.id === 'KTI' ? 1 : 0))
              .map((x) => (
                <button
                  key={x.id}
                  role="option"
                  aria-selected={x.id === c.id}
                  className={'cm-opt' + (x.id === c.id ? ' on' : '')}
                  onClick={() => {
                    a.openCoin(x.id as never)
                    setPick(false)
                    setPq('')
                  }}
                >
                  <Coin id={x.id} size={28} />
                  <span className="grow">
                    <b>{x.name}</b>
                    <small>
                      {x.id} · {x.net}
                    </small>
                  </span>
                  <span className="r">
                    <b>{x.price}</b>
                    <small className={x.up ? 'up' : 'down'}>
                      {x.up ? '▲' : '▼'} {x.chg.match(/\(([^)]+)\)/)?.[1]}
                    </small>
                  </span>
                </button>
              ))}
          </div>
        </div>
      )}
      <div className="cm-price">
        <b>{c.price}</b>
        <span className={'cm-delta' + (c.up ? '' : ' down')}>
          <span className="tri">{c.up ? '▲' : '▼'}</span> <span className="chg">{c.chg}</span> <span className="when">· Past 24 hours</span>
        </span>
      </div>
      <div className="cm-area" style={{ height: H }}>
        <span className="dots" />
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none" key={range}>
          <path d={area} fill={col} fillOpacity="0.12" className="cm-fill" />
          <path d={line} fill="none" stroke={col} strokeWidth="2" strokeLinejoin="round" vectorEffect="non-scaling-stroke" className="cm-line" pathLength={1} />
        </svg>
        <span className="cp-dot cm" style={{ left: `${(last[0] / W) * 100}%`, top: last[1], ['--c' as string]: col }} />
      </div>
      <div className="cp-range">
        {RANGE_SEEDS.map((r) => (
          <button key={r} className={r === range ? 'on' : ''} onClick={() => setRange(r)}>
            {r}
          </button>
        ))}
      </div>
      <div className="cm-stats">
        <div>
          <small>Market cap</small>
          <b>{c.cap}</b>
        </div>
        <div>
          <small>Volume 24h</small>
          <b>{c.vol}</b>
        </div>
        <div>
          <small>Network</small>
          <b>{c.net}</b>
        </div>
      </div>
      {/* the KTI Coin modal is informational: no swap shortcut here (other coins keep it) */}
      {c.id !== 'KTI' && (
        <button
          className="btn white block cm-swap"
          onClick={() => {
            const t = c.swap
            if (t) a.set({ view: 'swap', modal: null, to: t === a.from ? a.to : t === 'BNB' ? 'KTI' : t, from: t === 'BNB' ? 'BNB' : a.from === t ? 'BNB' : a.from })
            else a.toast({ tone: 'info', title: `${c.name} isn't available yet`, body: 'This token is not part of the prototype list' })
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }}
        >
          Swap {c.id}
        </button>
      )}
      {/* KTI lives in Kotai Wallet — same download hook as the Kotai Wallet modal */}
      {c.id === 'KTI' && <KotaiDownload />}
    </Modal>
  )
}

/* ───────────── Search (I6) + network filter (I6b) ───────────── */
const SEARCH_TOKENS: { id: TokenId; name: string; sub: string; price: string; chg: string; up?: boolean; down?: boolean; native?: boolean }[] = [
  { id: 'KTI', name: 'KTI Coin', sub: 'KTI · BNB Chain only', price: '$0.000025', chg: '▲ 4.80%', up: true, native: true },
  { id: 'BNB', name: 'BNB', sub: 'BNB · $86.3B FDV', price: '$600.00', chg: '▼ 0.42%', down: true },
  { id: 'USDT', name: 'Tether USD', sub: 'USDT · $118.2B FDV', price: '$1.00', chg: '0.00%' },
  { id: 'USDC', name: 'USD Coin', sub: 'USDC · $61.3B FDV', price: '$1.00', chg: '0.00%' },
  { id: 'ETH', name: 'Ethereum', sub: 'ETH · $421.6B FDV', price: '$3,500.00', chg: '▲ 1.08%', up: true },
]
/* every KTI pair lives on BNB Chain */
const POOLS: [TokenId, TokenId, string][] = [
  ['BNB', 'KTI', 'KOTAI pool · 0.3%'],
  ['KTI', 'USDT', 'KOTAI pool · 0.3%'],
  ['KTI', 'USDC', 'KOTAI pool · 0.3%'],
  ['BNB', 'USDT', 'KOTAI pool · 0.05%'],
]

function NetFilter({ sel, setSel, onClose }: { sel: Set<string>; setSel: (s: Set<string>) => void; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node) && !(e.target as HTMLElement).closest('.s-nets')) onClose()
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [onClose])
  const toggle = (id: string) => {
    const n = new Set(sel)
    n.has(id) ? n.delete(id) : n.add(id)
    setSel(n)
  }
  const all = sel.size === NETWORKS.length
  return (
    <div className="net-filter" ref={ref}>
      <button className="nf-row all" onClick={() => setSel(all ? new Set() : new Set(NETWORKS.map((n) => n.id)))}>
        <b>All networks</b>
        <span className={'nf-box' + (all ? ' on' : '')}>{all && '✓'}</span>
      </button>
      <span className="m-div" />
      {NETWORKS.map((n) => (
        <div key={n.id} className={'nf-row' + (sel.has(n.id) ? ' on' : '')} onClick={() => toggle(n.id)} role="button" tabIndex={0}>
          <Net id={n.id} size={26} />
          <span className="grow">{n.name}</span>
          <button
            className="nf-only"
            onClick={(e) => {
              e.stopPropagation()
              setSel(new Set([n.id]))
            }}
          >
            Only
          </button>
          <span className={'nf-box' + (sel.has(n.id) ? ' on' : '')}>{sel.has(n.id) && '✓'}</span>
        </div>
      ))}
      <div className="nf-foot">
        <span className="cap12">
          {sel.size} of {NETWORKS.length} selected
        </span>
        <button className="m-link" onClick={() => setSel(new Set())}>
          Clear
        </button>
      </div>
    </div>
  )
}

function SearchOverlay() {
  const a = useApp()
  useScrollLock()
  const [q, setQ] = useState('')
  const [tab, setTab] = useState('All')
  const [filter, setFilter] = useState(false)
  const [sel, setSel] = useState(new Set(NETWORKS.map((n) => n.id)))
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === 'Escape' && (filter ? setFilter(false) : a.close())
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [filter, a])
  const ql = q.toLowerCase()
  const toks = SEARCH_TOKENS.filter((t) => (t.name + t.id).toLowerCase().includes(ql))
  const pools = POOLS.filter(([x, y]) => `${x} / ${y}`.toLowerCase().includes(ql))
  const icons = [...sel].slice(0, 3)
  return (
    <div className="scrim search-scrim" onMouseDown={(e) => e.target === e.currentTarget && a.close()}>
      <div className="search-wrap">
        <div className="s-bar">
          <label className="s-input">
            <Icon n="search" size={20} />
            <input autoFocus placeholder="Search tokens, pools or address" value={q} onChange={(e) => setQ(e.target.value)} />
            <kbd>Esc</kbd>
          </label>
          <button className={'s-nets' + (filter ? ' on' : '')} onClick={() => setFilter((v) => !v)}>
            <span className="stack3">
              {icons.map((id) => (
                <span key={id}>
                  <Net id={id} size={22} />
                </span>
              ))}
            </span>
            {sel.size > 3 && <span className="plus">+{sel.size - 3}</span>}
            <Icon n="chevron" size={18} className="chev" />
          </button>
          <button className="s-close" onClick={a.close} aria-label="Close search">
            <Icon n="x" size={18} />
          </button>
        </div>
        <div className="s-results">
          <div className="cp-range s-tabs">
            {['All', 'Tokens', 'Pools', 'Wallets'].map((t) => (
              <button key={t} className={tab === t ? 'on' : ''} onClick={() => setTab(t)}>
                {t}
              </button>
            ))}
          </div>
          {(tab === 'All' || tab === 'Tokens') && (
            <>
              <div className="s-head">
                <Icon n="chart" size={16} /> Tokens by 24H volume
              </div>
              {toks.map((t, i) => (
                <button key={t.id} className={'s-row' + (i === 0 && !q ? ' hl' : '')} onClick={() => a.openCoin(t.id)}>
                  <span className="coin-badge s40">
                    <Coin id={t.id} size={40} />
                    <span className="nb">
                      <Coin id="BNB" size={12} />
                    </span>
                  </span>
                  <span className="grow">
                    <b>{t.name}</b>
                    <small>
                      {t.native && <span className="badge blue">Native</span>} {t.sub}
                    </small>
                  </span>
                  <span className="r">
                    <b>{t.price}</b>
                    <small className={t.up ? 'up' : t.down ? 'down' : ''}>{t.chg}</small>
                  </span>
                </button>
              ))}
            </>
          )}
          {(tab === 'All' || tab === 'Pools') && pools.length > 0 && (
            <>
              <div className="s-head">
                <Icon n="flip" size={16} /> Pools by 24H volume
              </div>
              {pools.map(([x, y, fee]) => (
                <button
                  key={x + y}
                  className="s-row"
                  onClick={() => {
                    a.set({ view: 'swap', from: x, to: y, modal: null })
                  }}
                >
                  <span className="pair40">
                    <Coin id={x} size={26} />
                    <Coin id={y} size={26} />
                  </span>
                  <span className="grow">
                    <b>
                      {x} / {y}
                    </b>
                    <small>BNB Chain</small>
                  </span>
                  <span className="fee">{fee}</span>
                  <Icon n="chevronR" size={16} className="go" />
                </button>
              ))}
            </>
          )}
          {tab === 'Wallets' && <p className="m-empty">Paste a wallet address to look it up.</p>}
          {toks.length === 0 && pools.length === 0 && tab !== 'Wallets' && <p className="m-empty">Nothing found for “{q}”.</p>}
          {filter && <NetFilter sel={sel} setSel={setSel} onClose={() => setFilter(false)} />}
        </div>
      </div>
    </div>
  )
}

/* ───────────── History (I9) ───────────── */
/* One swap in the history, kept to the essentials: coin + amount on each side, and the date (failed swaps are flagged) */
const histAmt = (n: number) => fmt(n, n < 1 ? 6 : n < 10000 ? 4 : 0)
export function HistRow({ h, compact }: { h: HistoryItem; compact?: boolean }) {
  const failed = h.status === 'Failed'
  const size = compact ? 22 : 28
  return (
    <div className={'hrow' + (compact ? ' sm' : '') + (failed ? ' failed' : '')}>
      <div className="hr-side">
        <Coin id={h.from} size={size} />
        <b>
          -{histAmt(h.amountFrom)} {h.from}
        </b>
      </div>
      <Icon n="arrowRight" size={14} sw={2} className="hr-arr" />
      <div className="hr-side">
        <Coin id={h.to} size={size} />
        <b className="in">
          {failed ? '' : '+'}
          {histAmt(h.amountTo)} {h.to}
        </b>
      </div>
      <div className="hr-meta">
        {failed && <span className="st bad">Failed</span>}
        <small>{h.when}</small>
      </div>
    </div>
  )
}

/* ───────────── Add funds (wallet without funds) ───────────── */
export const FUND_OPTIONS: { icon: string; title: string; text: string; tone: string }[] = [
  { icon: 'card', title: 'Buy crypto', text: 'Purchase with a debit card or a bank account.', tone: 'buy' },
  { icon: 'arrowDown', title: 'Transfer from wallet', text: 'Move funds from another wallet.', tone: 'wallet' },
  { icon: 'bank', title: 'Transfer from account', text: 'Move funds from a trading platform.', tone: 'account' },
]
export function FundOptions({ compact }: { compact?: boolean }) {
  const a = useApp()
  return (
    <div className={'fund-list' + (compact ? ' sm' : '')}>
      {FUND_OPTIONS.map((o) => (
        <button key={o.title} className="fund-opt" onClick={() => a.toast({ tone: 'info', title: o.title, body: 'Opens this flow in the real product' })}>
          <span className={'fund-ic ' + o.tone}>
            <Icon n={o.icon} size={compact ? 16 : 20} sw={2} />
          </span>
          <span className="grow">
            <b>{o.title}</b>
            <small>{o.text}</small>
          </span>
          {compact && <Icon n="chevronR" size={16} sw={2} className="go" />}
        </button>
      ))}
    </div>
  )
}
function AddFundsModal() {
  const a = useApp()
  return (
    <Modal
      title={
        <span className="t-col">
          Welcome!
          <small>Add funds to start trading</small>
        </span>
      }
      onClose={a.close}
    >
      <FundOptions />
    </Modal>
  )
}

function HistoryPanel() {
  const a = useApp()
  useScrollLock()
  return (
    <div className="scrim hist-scrim" onMouseDown={(e) => e.target === e.currentTarget && a.close()}>
      <div className="hist-wrap">
        <div className="hist">
          <div className="hist-title">
            <h3>Swap history</h3>
            <span>Wallet {ADDRESS}</span>
          </div>
          {a.history.length === 0 && <p className="m-empty">No swaps yet.</p>}
          {a.history.map((h, i) => (
            <HistRow key={i} h={h} />
          ))}
        </div>
        <button className="s-close" onClick={a.close} aria-label="Close history">
          <Icon n="x" size={18} />
        </button>
      </div>
    </div>
  )
}

/* ───────────── Swap flow pieces ───────────── */
function Summary() {
  const a = useApp()
  const q = a.quote
  return (
    <div className="sum">
      <div className="sum-row">
        <div>
          <small>You send</small>
          <b>
            {fmt(a.amountNum)} {a.from}
          </b>
          <span>{usd(q.inUsd)}</span>
        </div>
        <Coin id={a.from} size={40} />
      </div>
      <div className="sum-arrow">
        <Icon n="arrowDown" size={16} />
      </div>
      <div className="sum-row">
        <div>
          <small>You receive</small>
          <b>
            {fmt(q.out, 0)} {a.to}
          </b>
          <span>{usd(q.outUsd)}</span>
        </div>
        <Coin id={a.to} size={40} />
      </div>
    </div>
  )
}

function ReviewModal() {
  const a = useApp()
  const q = a.quote
  const sc = a.scenario
  const banner =
    sc === 'highImpact'
      ? { t: 'warn' as const, m: 'High price impact detected. You may receive fewer tokens than expected.', btn: 'Swap anyway' }
      : sc === 'priceUpdated'
        ? { t: 'info' as const, m: `Price updated. The rate changed from ${fmt(TOKENS[a.from].price / TOKENS[a.to].price, 0)} to ${fmt(q.rate, 0)} ${a.to} per ${a.from}.`, btn: 'Accept new rate' }
        : sc === 'accountChanged'
          ? { t: 'info' as const, m: 'Account or network changed in your wallet. We reloaded the quote.', btn: 'Review again' }
          : null
  return (
    <Modal
      className="review-modal"
      title={
        <span className="t-col">
          Review swap
          <small>Check the amounts. After you confirm, your wallet will ask for a signature.</small>
        </span>
      }
      onClose={() => a.push('cancelReview')}
      onScrim={() => a.push('cancelReview')}
    >
      {banner && <Banner tone={banner.t}>{banner.m}</Banner>}
      <Summary />
      <div className="m-box">
        <div className="kv">
          <span>Exchange rate</span>
          <b>
            1 {a.from} = {fmt(q.rate, q.rate < 1 ? 8 : 0)} {a.to}
          </b>
        </div>
        <div className="kv">
          <span>{a.to} price</span>
          <b>{unitPrice(TOKENS[a.to].price)}</b>
        </div>
        <div className="kv">
          <span>Minimum received</span>
          <b>
            {fmt(q.minOut, q.minOut < 1 ? 6 : q.minOut < 10000 ? 2 : 0)} {a.to}
          </b>
        </div>
        <div className="kv">
          <span>Fees (network + pool)</span>
          <b>{usd(q.feesUsd)}</b>
        </div>
        <div className="kv">
          <span>Price impact</span>
          <b className={q.impactLevel === 'High' ? 'red' : ''}>{q.impact.toFixed(2)}%</b>
        </div>
      </div>
      <button
        className="btn accent block m52"
        onClick={() => {
          if (sc === 'priceUpdated' || sc === 'accountChanged') {
            a.set({ scenario: 'none' })
          } else a.startSwap()
        }}
      >
        {banner?.btn ?? 'Confirm swap'}
      </button>
    </Modal>
  )
}

type StepState = 'done' | 'active' | 'pending' | 'failed'
function Steps({ s, active, failNote }: { s: [StepState, StepState, StepState]; active?: ReactNode; failNote?: ReactNode }) {
  const a = useApp()
  const names = ['Approve for Permit2', 'Permit2 Signature', 'Transaction']
  const icons = ['check', 'shield', 'flip']
  return (
    <div className="steps">
      {names.map((n, i) => {
        const st = s[i]
        return (
          <div key={n} className={'step ' + st}>
            <div className="mk">
              <span className="dot">
                {st === 'done' ? <Icon n="check" size={14} sw={2.5} /> : st === 'failed' ? <Icon n="x" size={14} sw={2.5} /> : <Icon n={i === 0 && st === 'active' ? 'wallet' : icons[i]} size={i === 2 && st === 'pending' ? 12 : 14} />}
                {st === 'active' && <Spinner size={36} stroke={2.5} />}
              </span>
              {i < 2 && <span className={'conn' + (st === 'done' ? ' ok' : '')} />}
            </div>
            <div className="sc">
              <div className="st-title">
                <b>{n}</b>
                {st === 'active' && <small>Step {i + 1} of 3</small>}
              </div>
              {st === 'active' && active}
              {st === 'failed' && failNote}
              {st === 'active' && i === 1 && (
                <button className="m-link sm" onClick={() => a.toast({ tone: 'info', title: 'Why sign?', body: 'Permit2 lets the swap move this token once, without an extra gas fee.' })}>
                  Why do I have to sign this?
                </button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

const DivLine = ({ children }: { children: ReactNode }) => (
  <div className="div-line">
    <i />
    <span>{children}</span>
    <i />
  </div>
)

/* Signing + processing are ONE dialog: React keeps the same DOM, so only the steps list and the line under it change
   (approve loading → sign in wallet → confirming on chain). The frame, title row and summary stay where they are. */
function SwapFlowModal({ kind }: { kind: 'signing' | 'processing' }) {
  const a = useApp()
  const processing = kind === 'processing'
  const approving = !processing && a.step === 0
  const rejected = !processing && a.step === -2
  const slow = processing && a.scenario === 'slow'
  const wallet = a.walletId === 'kotai' ? 'Kotai Wallet' : WALLETS.find((w) => w.id === a.walletId)?.name ?? 'your wallet'
  const dismiss = () => (rejected ? a.close() : a.push(processing ? 'closeProcessing' : 'cancelSign'))
  const steps: [StepState, StepState, StepState] = processing
    ? ['done', 'done', 'active']
    : approving
      ? ['active', 'pending', 'pending']
      : rejected
        ? ['done', 'failed', 'pending']
        : ['done', 'active', 'pending']
  const line = processing
    ? 'Confirming on the network · 2 of 3 completed'
    : approving
      ? 'Preparing your swap · 0 of 3 completed'
      : rejected
        ? 'Request rejected · 1 of 3 completed'
        : 'Continue in your wallet · 1 of 3 completed'
  const title = rejected ? 'Signature rejected' : processing ? 'Swap in progress' : 'You’re swapping'
  const sub = processing
    ? 'Sent to BNB Chain and being confirmed.'
    : rejected
      ? 'Nothing was sent. You can try again.'
      : 'Follow the steps below. Nothing moves until you sign.'
  return (
    <Modal
      className="flow-modal"
      title={
        <span className="t-col">
          <span className="swap-txt" key={title}>
            {title}
          </span>
          <small className="swap-txt" key={sub}>
            {sub}
          </small>
        </span>
      }
      onClose={dismiss}
      onScrim={dismiss}
    >
      {slow && <Banner tone="warn">Taking longer than usual. The network is congested — you can speed up this transaction.</Banner>}
      <Summary />
      <DivLine>
        <span className="swap-txt" key={line}>
          {line}
        </span>
      </DivLine>
      <Steps
        s={steps}
        active={
          <p className="st-note swap-txt" key={a.step + kind}>
            {approving
              ? 'Allowing Permit2 to use your ' + a.from + ' · no action needed'
              : processing
                ? slow
                  ? 'Pending for 4 min · network is congested'
                  : 'Confirming on the network · about 20s left'
                : 'Sign the spend permission without paying extra gas'}
          </p>
        }
        failNote={<p className="st-note">You rejected the signature request in your wallet.</p>}
      />
      {rejected ? (
        <div className="m-col">
          <button
            className="btn accent block m52"
            onClick={() => {
              a.set({ scenario: 'none' })
              window.setTimeout(a.startSwap)
            }}
          >
            Try again
          </button>
          <button className="btn secondary block" onClick={a.close}>
            Close
          </button>
        </div>
      ) : slow ? (
        <div className="m-col">
          <button
            className="btn accent block m52"
            onClick={() => {
              a.toast({ tone: 'success', title: 'Speed-up sent', body: 'A slightly higher fee was submitted' })
              window.setTimeout(a.completeSwap, 1500)
            }}
          >
            Speed up
          </button>
          <button className="btn secondary block" onClick={() => window.setTimeout(a.completeSwap, 1200)}>
            Keep waiting
          </button>
        </div>
      ) : (
        <>
          <p className="m-note">
            <Icon n="shield" size={16} />
            <span className="swap-txt" key={processing ? 'p' : approving ? 'a' : 's'}>
              {processing
                ? 'You can close this window. We’ll let you know when the swap lands.'
                : approving
                  ? `Preparing the request for ${wallet}. Keep it open.`
                  : `We sent a signature request to ${wallet}. If the amounts in your wallet are different, don’t sign.`}
            </span>
          </p>
          <button className="btn secondary block" onClick={dismiss}>
            {processing ? 'Close' : 'Cancel'}
          </button>
        </>
      )}
    </Modal>
  )
}

function DoneModal() {
  const a = useApp()
  const ls = a.lastSwap ?? { amount: a.amountNum, out: a.quote.out, from: a.from, to: a.to }
  const inUsd = ls.amount * TOKENS[ls.from].price
  const outUsd = ls.out * TOKENS[ls.to].price
  const [copied, setCopied] = useState(false)
  return (
    <Modal
      className="done-modal"
      title={
        <span className="t-col">
          Swap complete
          <small>Your {ls.to} is already in your wallet.</small>
        </span>
      }
      onClose={() => {
        a.set({ amount: '' })
        a.close()
      }}
    >
      <div className="big-check">
        <svg viewBox="0 0 28 28" width="28" height="28" fill="none" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M4 14.5l6.5 6.5L24 7.5" pathLength={1} />
        </svg>
      </div>
      <div className="m-box g14">
        <div className="kv tall">
          <span>You sent</span>
          <span className="amt">
            <span>
              <b className="red">
                -{fmt(ls.amount)} {ls.from}
              </b>
              <Coin id={ls.from} size={20} />
            </span>
            <small>{usd(inUsd)}</small>
          </span>
        </div>
        <div className="kv tall">
          <span>You received</span>
          <span className="amt">
            <span>
              <b className="green">
                +{fmt(ls.out, 0)} {ls.to}
              </b>
              <Coin id={ls.to} size={20} />
            </span>
            <small>{usd(outUsd)}</small>
          </span>
        </div>
      </div>
      <div className="m-box g14">
        <div className="kv">
          <span>Exchange rate</span>
          <b>
            1 {ls.from} = {fmt(TOKENS[ls.from].price / TOKENS[ls.to].price, 0)} {ls.to}
          </b>
        </div>
        <div className="kv">
          <span>Price impact</span>
          <b className="green">0.08%</b>
        </div>
      </div>
      <div className="tx">
        <small>Transaction</small>
        <div className="hash">
          <span className="mono">0x9f3c2b7e5a41d8c06f93e1b2a7d4058c3e6f19a2b8d7c4e0153a96f2c8b1a71b</span>
          <button
            onClick={() => {
              setCopied(true)
              a.toast({ tone: 'success', title: 'Hash copied', body: 'Transaction hash copied to clipboard' })
            }}
            aria-label="Copy hash"
          >
            <Icon n={copied ? 'check' : 'copy'} size={16} />
          </button>
        </div>
        <button className="m-link" onClick={() => a.toast({ tone: 'info', title: 'View on explorer', body: 'Opens bscscan.com in the real product' })}>
          View on explorer <Icon n="ext" size={14} />
        </button>
      </div>
      <div className="m-row2 g10">
        <button className="btn secondary m52" onClick={() => a.open('history')}>
          View in History
        </button>
        <button className="btn white m52" onClick={() => a.set({ amount: '', modal: null, modalStack: [] })}>
          Finish
        </button>
      </div>
    </Modal>
  )
}

function FailedModal() {
  const a = useApp()
  return (
    <Modal
      title={
        <span className="t-col">
          Swap not completed
          <small>For your safety, the network cancelled it.</small>
        </span>
      }
      onClose={a.close}
    >
      <Summary />
      <DivLine>Something went wrong · 2 of 3 completed</DivLine>
      <Steps s={['done', 'done', 'failed']} failNote={<p className="st-note">The price moved more than your {a.slippage === 'Auto' ? '0.5' : a.slippage}% slippage tolerance while the network was confirming.</p>} />
      <div className="m-box g4">
        <b>
          Your {fmt(a.amountNum)} {a.from} is still in your wallet
        </b>
        <p>Only the network fee ($2.22) was charged, to cover processing the attempt.</p>
      </div>
      <div className="m-col">
        <button
          className="btn accent block m52"
          onClick={() => {
            a.set({ scenario: 'none' })
            window.setTimeout(a.startSwap)
          }}
        >
          Try again
        </button>
        <button className="btn secondary block" onClick={() => a.set({ modal: 'settings', modalStack: [] })}>
          Adjust slippage
        </button>
      </div>
    </Modal>
  )
}

/* ───────────── Confirm dialogs (stacked over the dialog they belong to) ───────────── */
/* Cancel confirmations replace the content of the dialog that asked for them (same frame, same place) —
   never a second dialog stacked on top. "Keep…" goes back to exactly where the user was. */
function Confirm({ title, body, keep, cancel, onCancel, pinned }: { title: string; body: string; keep: string; cancel: string; onCancel: () => void; pinned?: boolean }) {
  const a = useApp()
  return (
    <Modal onScrim={a.back} className={'confirm' + (pinned ? ' flow-modal' : '')}>
      <span className="alert-ico">
        <Icon n="warn" size={24} />
      </span>
      <div className="cf-text">
        <h2>{title}</h2>
        <p>{body}</p>
      </div>
      <div className="m-col pt8">
        <button className="btn accent block m52" onClick={a.back}>
          {keep}
        </button>
        <button className="btn secondary block" onClick={onCancel}>
          {cancel}
        </button>
      </div>
    </Modal>
  )
}

/* ───────────── Mobile sheets for the desktop dropdowns ───────────── */
/* Mobile · "Menu" from the bottom bar: a list that pops up above the bar (not a full sheet) */
function SheetNav() {
  const a = useApp()
  useScrollLock()
  const soon = (t: string) => {
    a.close()
    a.toast({ tone: 'info', title: t, body: 'Not part of this prototype' })
  }
  const items: { label: string; sub: string; icon: ReactNode; act: () => void; hide?: boolean }[] = [
    { label: 'Market', sub: 'Prices and top movers', icon: <Icon n="trend" size={20} />, act: () => soon('Market') },
    { label: 'Invest', sub: 'Earn with KTI pools', icon: <Icon n="coins" size={20} />, act: () => soon('Invest') },
    { label: 'Search', sub: 'Tokens, pools or address', icon: <Icon n="search" size={20} />, act: () => a.open('search') },
    { label: 'Swap history', sub: 'Your recent swaps', icon: <Icon n="history" size={20} />, act: () => a.open('history'), hide: !a.connected },
    { label: 'Settings', sub: 'Language and currency', icon: <Icon n="gear" size={20} />, act: () => a.open('system') },
    { label: 'Connect wallet', sub: 'Kotai Wallet and others', icon: <Icon n="wallet" size={20} />, act: () => a.open('connect'), hide: a.connected },
  ]
  return (
    <div className="scrim nav-scrim" onMouseDown={(e) => e.target === e.currentTarget && a.close()}>
      <div className="nav-pop" role="menu" aria-label="More options">
        {items
          .filter((i) => !i.hide)
          .map((i) => (
            <button key={i.label} className="np-item" role="menuitem" onClick={i.act}>
              <span className="np-ic">{i.icon}</span>
              <span className="grow">
                <b>{i.label}</b>
                <small>{i.sub}</small>
              </span>
              <Icon n="chevronR" size={16} sw={2} className="np-go" />
            </button>
          ))}
      </div>
    </div>
  )
}

/* Closing plays an exit (scrim fades, dialog/sheet eases out) — the last dialog stays mounted for that moment. */
export function Modals() {
  const a = useApp()
  const last = useRef<ModalKind>(a.modal)
  if (a.modal) last.current = a.modal
  const p = usePresence(!!a.modal, 220)
  if (!p.render || !last.current) return null
  return (
    <div className={'modal-layer' + (p.closing ? ' closing' : '')}>
      <ModalSwitch k={a.modal ?? last.current} />
    </div>
  )
}

function ModalSwitch({ k }: { k: Exclude<ModalKind, null> }) {
  const a = useApp()
  const m = a.isMobile
  switch (k) {
    case 'connect':
      return <ConnectModal />
    case 'kotaiWallet':
      return <KotaiWalletModal />
    case 'otherWallets':
      return <OtherWalletsModal />
    case 'tokenSelect':
      return <TokenSelectModal />
    case 'tokenWarning':
      return <TokenWarning />
    case 'coin':
      return <CoinModal />
    case 'search':
      return <SearchOverlay />
    case 'history':
      return <HistoryPanel />
    case 'addFunds':
      return <AddFundsModal />
    case 'review':
      return <ReviewModal />
    case 'signing':
      return <SwapFlowModal kind="signing" />
    case 'processing':
      return <SwapFlowModal kind="processing" />
    case 'done':
      return <DoneModal />
    case 'failed':
      return <FailedModal />
    case 'navMenu':
      return <SheetNav />
    case 'settings':
      return m ? (
        <Modal className="sheet-pop" onScrim={a.close}>
          <SettingsBody onClose={a.close} />
        </Modal>
      ) : null
    case 'help':
      return m ? (
        <Modal title="Help" className="sheet-pop" onScrim={a.close} onClose={a.close}>
          <HelpTip onClose={a.close} />
        </Modal>
      ) : null
    case 'network':
      return m || a.modalStack.length ? (
        <Modal title="Select network" onClose={a.modalStack.length ? a.back : a.close} className="sheet-pop">
          <div className="dd-list">
            <NetworkList onPick={a.setNetwork} />
          </div>
        </Modal>
      ) : null
    case 'walletMenu':
    case 'walletNet':
      return m ? (
        <Modal title="Wallet" className="sheet-pop wallet-sheet" onScrim={a.close} onClose={a.close}>
          <WalletMenuBody />
        </Modal>
      ) : null
    case 'system':
    case 'language':
    case 'currency':
      return m ? (
        <Modal className="sheet-pop sys-sheet" onScrim={a.close} onClose={a.close}>
          <SystemBody />
        </Modal>
      ) : null
    case 'cancelConnect':
      return (
        <Confirm
          title="Cancel connection?"
          body="No wallet is connected yet. You can come back and connect anytime — nothing leaves your wallet."
          keep="Keep connecting"
          cancel="Cancel connection"
          onCancel={a.close}
        />
      )
    case 'cancelReview':
      return (
        <Confirm
          pinned
          title="Cancel this swap?"
          body="Nothing was sent yet. Your amounts stay on the swap screen if you want to try again."
          keep="Keep reviewing"
          cancel="Cancel swap"
          onCancel={a.close}
        />
      )
    case 'cancelSign':
      return (
        <Confirm
          pinned
          title="Cancel the signature request?"
          body="The request in your wallet will be dismissed. Nothing was sent and no fee is charged."
          keep="Keep waiting"
          cancel="Cancel request"
          onCancel={a.close}
        />
      )
    case 'closeProcessing':
      return (
        <Confirm
          pinned
          title="Close this window?"
          body="Your swap was already sent to the network and can't be cancelled. It will finish in the background and appear in History."
          keep="Keep watching"
          cancel="Close window"
          onCancel={() => a.set({ modal: null, modalStack: [] })}
        />
      )
    default:
      return null
  }
}
