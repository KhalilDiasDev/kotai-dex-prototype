import { useEffect, useId, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { TOKENS, fmt, usd, type TokenId } from '../data'
import { useApp, type Tab } from '../store'
import { Anchor } from './Header'
import { SettingsBody } from './Modals'
import { Banner, Coin, Icon, Spinner } from './ui'

const QUICK: TokenId[] = ['KTI', 'USDT', 'ETH', 'BTC', 'USDC']

function TokenSelect({ id, onClick }: { id: TokenId; onClick: () => void }) {
  return (
    <button className="token-sel" onClick={onClick} aria-label={`Select token, ${id}`}>
      <Coin id={id} size={28} />
      {id}
      <Icon n="chevron" size={18} className="chev" />
    </button>
  )
}

/** "Refreshes in 12s" countdown — re-quotes when it hits zero. */
function useCountdown(active: boolean, onZero: () => void) {
  const [n, setN] = useState(12)
  const cb = useRef(onZero)
  cb.current = onZero
  useEffect(() => {
    if (!active) {
      setN(12)
      return
    }
    const t = window.setInterval(() => {
      setN((v) => {
        if (v <= 1) {
          cb.current()
          return 12
        }
        return v - 1
      })
    }, 1000)
    return () => window.clearInterval(t)
  }, [active])
  return n
}

export function HelpTip({ onClose }: { onClose: () => void }) {
  return (
    <div className="help-tip" role="tooltip" onMouseLeave={onClose}>
      <b>Minimum received</b>
      <p>The least you'll get if the price moves before your swap confirms. If it would be lower, the swap is cancelled and your ETH stays in your wallet.</p>
    </div>
  )
}

/* "adjustments" icon whose knobs slide along their tracks on hover (lines are cut around each knob by a mask that moves with it) */
const KNOBS: [number, number][] = [
  [14, 6],
  [8, 12],
  [17, 18],
]
function SlidersIcon() {
  const id = 'sl' + useId().replace(/:/g, '')
  return (
    <svg className="ic-sl" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden>
      <mask id={id} maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24">
        <rect width="24" height="24" fill="#fff" />
        {KNOBS.map(([x, y], i) => (
          <circle key={i} className={'k k' + i} cx={x} cy={y} r="3.1" fill="#000" stroke="none" />
        ))}
      </mask>
      <path d="M4 6h16M4 12h16M4 18h16" mask={`url(#${id})`} />
      {KNOBS.map(([x, y], i) => (
        <circle key={i} className={'k k' + i} cx={x} cy={y} r="2" />
      ))}
    </svg>
  )
}

export function SwapPanel({ compact }: { compact?: boolean }) {
  const a = useApp()
  const [focus, setFocus] = useState(false)
  const [tip, setTip] = useState(false)
  // card swap: the two fields trade places (FLIP — content swaps, then each card slides in from the other's slot)
  const sendRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const recvInputRef = useRef<HTMLInputElement>(null)
  // "You receive" is editable too: typing the amount you want back-solves what you need to send
  const [recvText, setRecvText] = useState<string | null>(null)
  const typeReceive = (v: string) => {
    const clean = v.replace(/,/g, '.').replace(/[^0-9.]/g, '')
    if ((clean.match(/\./g) ?? []).length > 1) return
    setRecvText(clean)
    const want = parseFloat(clean)
    const need = want > 0 && a.quote.rate > 0 ? want / a.quote.rate : 0
    a.setAmount(need > 0 ? String(+need.toFixed(need < 1 ? 8 : 6)) : '')
  }
  const focusReceive = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button, input, a')) return
    recvInputRef.current?.focus({ preventScroll: true })
  }
  // the whole card is a hit area for the amount; the field starts focused, ready to type (desktop — no surprise keyboard on mobile)
  const focusAmount = (e?: React.MouseEvent) => {
    if (e && (e.target as HTMLElement).closest('button, input, a')) return
    inputRef.current?.focus({ preventScroll: true })
  }
  useEffect(() => {
    if (!a.isMobile && !a.modal) focusAmount()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const recvRef = useRef<HTMLDivElement>(null)
  const flipCards = () => {
    const sEl = sendRef.current
    const rEl = recvRef.current
    const d = sEl && rEl ? rEl.getBoundingClientRect().top - sEl.getBoundingClientRect().top : 0
    flushSync(() => a.flip())
    if (!sEl || !rEl || !d || matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const opt = { duration: 460, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' }
    sEl.animate([{ transform: `translateY(${d}px) scale(0.97)`, opacity: 0.6 }, { transform: 'none', opacity: 1 }], opt)
    rEl.animate([{ transform: `translateY(${-d}px) scale(0.97)`, opacity: 0.6 }, { transform: 'none', opacity: 1 }], opt)
  }
  const [chip, setChip] = useState<number | null>(null)
  const from = TOKENS[a.from]
  const to = TOKENS[a.to]
  const hasAmt = a.amountNum > 0
  const q = a.quote
  const noRoute = a.connected && a.scenario === 'noRoute'
  const showDetails = hasAmt && !a.fieldError && !compact
  const secs = useCountdown(showDetails && !a.quoting && !noRoute && a.modal === null, () => {
    a.set({ quoting: true })
    window.setTimeout(() => a.set({ quoting: false }), 900)
  })

  const pct = (p: number) => {
    const v = from.balance * p
    a.setAmount(String(+v.toFixed(6)))
    setChip(p)
  }
  const quick = (id: TokenId) => {
    a.set({ tokenSide: 'to' })
    a.pickToken(id)
  }
  const showChips = a.connected && (hasAmt || focus)
  const outText = noRoute && hasAmt ? '—' : hasAmt ? fmt(q.out, q.out < 1 ? 6 : 0) : '0'

  return (
    <div className="swap-col">
      <div className="swap-card">
        <div className="swap-top">
          <div className="tabs" role="tablist">
            {(['swap', 'limit', 'buy'] as Tab[]).map((t) => (
              <button
                key={t}
                role="tab"
                aria-selected={a.tab === t}
                className={'tab gb' + (a.tab === t ? ' on' : '')}
                onClick={() => {
                  if (t !== 'swap') a.toast({ tone: 'info', title: t === 'limit' ? 'Limit orders' : 'Buy crypto', body: 'Not part of this prototype' })
                  else a.set({ tab: t })
                }}
              >
                {t[0].toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
          <Anchor kinds={['settings']} pop={<div className="popover settings" role="dialog" aria-label="Swap settings"><SettingsBody onClose={a.close} /></div>}>
          <div className="tools">
            <button
              className={'tool' + (a.chart !== 'off' ? ' on' : '')}
              aria-label="Price chart"
              onClick={() => (a.isMobile ? a.openCoin(a.from) : a.set({ chart: a.chart === 'off' ? 'side' : 'off' }))}
            >
              <Icon n="chart" size={20} />
            </button>
            <button className={'tool wide' + (a.modal === 'settings' ? ' on' : '')} aria-label="Swap settings" onClick={() => (a.modal === 'settings' ? a.close() : a.open('settings'))}>
              <SlidersIcon />
              {a.slippage === 'Auto' ? '0.5%' : a.slippage + '%'}
            </button>
          </div>
          </Anchor>
        </div>

        {/* You send */}
        <div ref={sendRef} onClick={focusAmount} className={'field gb' + (focus ? ' focus' : '') + (a.fieldError ? ' error' : '')}>
          <div className="field-top">
            <span className="f-label">
              {a.isMobile && <Icon n="upload" size={16} />}You send
            </span>
            {showChips ? (
              <div className="shortcuts">
                {[0.25, 0.5, 0.75, 1].map((p) => (
                  <button key={p} className={'chip' + (chip === p && a.amountNum === from.balance * p ? ' on' : '')} onMouseDown={(e) => e.preventDefault()} onClick={() => pct(p)}>
                    {p === 1 ? 'Max' : p * 100 + '%'}
                  </button>
                ))}
              </div>
            ) : (
              <span className="muted">{a.connected ? `${from.balance.toFixed(4)} ${a.from}` : 'Connect wallet to see balance'}</span>
            )}
          </div>
          <div className="field-mid">
            <div className="amount-wrap">
              <input
                ref={inputRef}
                className={'amount' + (a.fieldError ? ' err' : '')}
                inputMode="decimal"
                placeholder="0"
                value={a.amount}
                onChange={(e) => {
                  a.setAmount(e.target.value)
                  setChip(null)
                }}
                onFocus={() => setFocus(true)}
                onBlur={() => setFocus(false)}
                aria-label="Amount to send"
              />
            </div>
            <TokenSelect id={a.from} onClick={() => a.set({ tokenSide: 'from', modal: 'tokenSelect', modalStack: [] })} />
          </div>
          <div className="field-bot">
            {a.fieldError ? (
              <span className="field-err">
                <Icon n="warn" size={16} /> {a.fieldError}
              </span>
            ) : (
              <>
                <span>≈ {usd(q.inUsd)}</span>
                <span className="bal">
                  <Coin id={a.from} size={14} /> Balance: {a.connected || (a.wasConnected && hasAmt) ? `${from.balance.toFixed(4)} ${a.from}` : '—'}
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flip-slot">
          <button className="flip" onClick={flipCards} aria-label="Flip tokens">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M7 21V3M17 3v18" />
              {/* on hover each arrowhead turns around and travels to the other end of its line */}
              <path className="hd l" d="M10 18l-3 3-3-3" />
              <path className="hd r" d="M20 6l-3-3-3 3" />
            </svg>
          </button>
        </div>

        {/* You receive */}
        <div ref={recvRef} onClick={focusReceive} className={'field' + (recvText !== null ? ' gb focus' : '')}>
          <div className={'field-top' + (hasAmt ? ' tall' : '')}>
            <span className="f-label">
              {a.isMobile && <Icon n="download" size={16} />}You receive (estimated)
            </span>
            {!hasAmt && !a.isMobile && (
              <div className="quick" aria-label="Quick token picks">
                {QUICK.map((id) => (
                  <button key={id} className={a.to === id ? 'on' : ''} onClick={() => quick(id)} aria-label={`Receive ${id}`} title={TOKENS[id].name}>
                    <Coin id={id} size={24} />
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="field-mid">
            <div className="amount-wrap">
              <input
                ref={recvInputRef}
                className={'amount' + (recvText === null && (!hasAmt || noRoute) ? ' zero' : '') + (recvText === null && a.quoting ? ' updating' : '')}
                inputMode="decimal"
                placeholder="0"
                value={recvText ?? (hasAmt ? outText : '')}
                onFocus={() => setRecvText(hasAmt && !noRoute ? String(+a.quote.out.toFixed(a.quote.out < 1 ? 6 : 2)) : '')}
                onBlur={() => setRecvText(null)}
                onChange={(e) => typeReceive(e.target.value)}
                aria-label="Amount to receive"
              />
            </div>
            <TokenSelect id={a.to} onClick={() => a.set({ tokenSide: 'to', modal: 'tokenSelect', modalStack: [] })} />
          </div>
          <div className="field-bot">
            <span>
              {a.quoting && hasAmt ? (
                'Updating estimate…'
              ) : (
                <>
                  ≈ {usd(hasAmt && !noRoute ? q.outUsd : 0)}
                  {hasAmt && !noRoute && !a.fieldError && <>&nbsp; ({q.usdDelta})</>}
                </>
              )}
            </span>
            <span className="bal">
              <Coin id={a.to} size={14} /> Balance: {to.balance === 0 ? '0' : to.balance.toFixed(4)} {a.to}
            </span>
          </div>
        </div>

        {showDetails && (
          <div className="details">
            <div className="d-head">
              <span className="rate">{noRoute ? 'No route available' : `1 ${a.from} = ${fmt(q.rate, q.rate < 1 ? 6 : 0)} ${a.to}`}</span>
              <span className="meta">
                <Icon n="clock" size={14} /> {a.quoting ? 'Finding the best price…' : `Refreshes in ${secs}s`}
              </span>
            </div>
            <div className="d-row">
              <span className="k">
                Price impact
                <button onMouseEnter={() => setTip(true)} onFocus={() => setTip(true)} onBlur={() => setTip(false)} onClick={() => (a.isMobile ? a.open('help') : setTip((v) => !v))} aria-label="What is price impact?">
                  <Icon n="info" size={14} />
                </button>
              </span>
              {a.quoting || noRoute ? (
                <span className="v">—</span>
              ) : (
                <span className={'v' + (q.impactLevel === 'High' ? ' red' : '')}>
                  <span className={'badge' + (q.impactLevel === 'High' ? ' high' : '')}>{q.impactLevel}</span>
                  <b>{q.impact.toFixed(2)}%</b>
                </span>
              )}
            </div>
            {tip && !a.isMobile && <HelpTip onClose={() => setTip(false)} />}
          </div>
        )}

        {a.banner && <Banner tone={a.banner.tone}>{a.banner.text}</Banner>}

        <div className="cta">
          <button
            className={'btn accent block lg' + (a.cta.kind === 'dim' ? ' dim' : '') + (a.cta.kind === 'loading' ? ' loading' : '')}
            disabled={a.cta.disabled}
            onClick={a.cta.action}
          >
            {a.cta.kind === 'loading' && <Spinner size={18} />}
            {a.cta.label}
          </button>
        </div>
      </div>

      <p className="assure">
        <Icon n="shield" size={16} />
        <span>
          {!a.connected && !(a.wasConnected && hasAmt)
            ? "Connecting doesn't move funds. Nothing leaves your wallet without your approval."
            : hasAmt
              ? 'You review everything before signing. Nothing leaves your wallet without your confirmation.'
              : 'Wallet connected. Nothing leaves it without your approval.'}
        </span>
      </p>
    </div>
  )
}
