import { useEffect, useId, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { TOKENS, fmt, pctText, unitPrice, usd, type TokenId } from '../data'
import { useApp, type Tab } from '../store'
import { Anchor } from './Header'
import { FundOptions, SettingsBody } from './Modals'
import { Banner, Coin, Icon, Spinner } from './ui'

const QUICK: TokenId[] = ['KTI', 'USDT', 'BNB', 'USDC', 'ETH']

function TokenSelect({ id, onClick }: { id: TokenId; onClick: () => void }) {
  return (
    <button className="token-sel" onClick={onClick} aria-label={`Select token, ${id}`}>
      <Coin id={id} size={28} />
      {id}
      <Icon n="chevron" size={18} className="chev" />
    </button>
  )
}

/** "Refreshes in 30s" countdown — re-quotes when it hits zero. */
const REFRESH_SECS = 30
function useCountdown(active: boolean, onZero: () => void) {
  const [n, setN] = useState(REFRESH_SECS)
  const cb = useRef(onZero)
  cb.current = onZero
  useEffect(() => {
    if (!active) {
      setN(REFRESH_SECS)
      return
    }
    const t = window.setInterval(() => {
      setN((v) => {
        if (v <= 1) {
          cb.current()
          return REFRESH_SECS
        }
        return v - 1
      })
    }, 1000)
    return () => window.clearInterval(t)
  }, [active])
  return n
}

export function HelpTip({ onClose }: { onClose: () => void }) {
  const a = useApp()
  return (
    <div className="help-tip" role="tooltip" onMouseLeave={onClose}>
      <b>Minimum received</b>
      <p>The least you'll get if the price moves before your swap confirms. If it would be lower, the swap is cancelled and your {a.from} stays in your wallet.</p>
    </div>
  )
}

/* "?" next to a label: the description shows while the pointer (or keyboard focus) is on the icon and
   disappears the moment it leaves; on touch a tap toggles it and tapping elsewhere closes it */
function InfoTip({ title, children, action }: { title: string; children: React.ReactNode; action?: { label: string; onClick: () => void } }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    if (!open) return
    const h = (e: PointerEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false)
    document.addEventListener('pointerdown', h)
    return () => document.removeEventListener('pointerdown', h)
  }, [open])
  return (
    <span className="info-tip" ref={ref} onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button
        type="button"
        data-notip
        aria-label={`What is ${title.toLowerCase()}?`}
        aria-expanded={open}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={(e) => {
          e.stopPropagation()
          setOpen(true)
        }}
      >
        <Icon n="info" size={14} />
      </button>
      {open && (
        <span className={'it-pop' + (action ? ' has-action' : '')} role="tooltip">
          <b>{title}</b>
          <span>{children}</span>
          {action && (
            <button
              type="button"
              className="it-link"
              onMouseDown={(e) => e.preventDefault()}
              onClick={(e) => {
                e.stopPropagation()
                setOpen(false)
                action.onClick()
              }}
            >
              {action.label} <Icon n="arrowRight" size={12} sw={2} />
            </button>
          )}
        </span>
      )}
    </span>
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

/* Mobile: Swap / Limit / Buy as a compact select, so the row never crowds the chart + settings buttons */
const TAB_LABEL: Record<Tab, string> = { swap: 'Swap', limit: 'Limit', buy: 'Buy' }
function TabSelect() {
  const a = useApp()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const h = (e: PointerEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false)
    document.addEventListener('pointerdown', h)
    return () => document.removeEventListener('pointerdown', h)
  }, [open])
  const pick = (t: Tab) => {
    setOpen(false)
    if (t !== 'swap') a.toast({ tone: 'info', title: t === 'limit' ? 'Limit orders' : 'Buy crypto', body: 'Not part of this prototype' })
    else a.set({ tab: t })
  }
  return (
    <div className="tab-select" ref={ref}>
      <button className={'ts-btn gb' + (open ? ' on' : '')} onClick={() => setOpen((v) => !v)} aria-haspopup="listbox" aria-expanded={open}>
        {TAB_LABEL[a.tab]}
        <Icon n="chevron" size={16} className="chev" />
      </button>
      {open && (
        <div className="ts-list" role="listbox">
          {(['swap', 'limit', 'buy'] as Tab[]).map((t) => (
            <button key={t} role="option" aria-selected={a.tab === t} className={'ts-opt' + (a.tab === t ? ' on' : '')} onClick={() => pick(t)}>
              <span className="grow">{TAB_LABEL[t]}</span>
              {t !== 'swap' && <small>Soon</small>}
              {a.tab === t && <Icon n="check" size={16} sw={2.5} />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function SwapPanel({ compact }: { compact?: boolean }) {
  const a = useApp()
  const [focus, setFocus] = useState(false)
  const [more, setMore] = useState(false)
  // card swap: the two fields trade places (FLIP — content swaps, then each card slides in from the other's slot)
  const sendRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const recvInputRef = useRef<HTMLInputElement>(null)
  // "You receive" is editable too: typing the amount you want back-solves what you need to send
  const [recvText, setRecvText] = useState<string | null>(null)
  // amounts can be typed in tokens or in dollars: the small line under each number flips the two (hover shows the switch)
  const [fiat, setFiat] = useState(false)
  const [fiatText, setFiatText] = useState<string | null>(null)
  const toggleFiat = () => {
    setFiat((v) => !v)
    setFiatText(null)
    setRecvText(null)
  }
  const typeSend = (v: string) => {
    if (!fiat) return a.setAmount(v)
    const clean = v.replace(/,/g, '.').replace(/[^0-9.]/g, '')
    if ((clean.match(/\./g) ?? []).length > 1) return
    setFiatText(clean)
    const dollars = parseFloat(clean)
    a.setAmount(dollars > 0 ? String(+(dollars / TOKENS[a.from].price).toFixed(8)) : '')
  }
  const typeReceive = (v: string) => {
    const clean = v.replace(/,/g, '.').replace(/[^0-9.]/g, '')
    if ((clean.match(/\./g) ?? []).length > 1) return
    setRecvText(clean)
    const typed = parseFloat(clean)
    const want = fiat ? typed / TOKENS[a.to].price : typed
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
    // the selection follows the value: typing in the top card and flipping selects the bottom card
    // (where that value now is), and the other way round. The button itself never takes focus (see onMouseDown).
    const side = document.activeElement === inputRef.current ? 'send' : document.activeElement === recvInputRef.current ? 'recv' : null
    const prevSend = a.amount
    flushSync(() => a.flip())
    if (side === 'send') {
      recvInputRef.current?.focus({ preventScroll: true })
      if (!fiat) setRecvText(prevSend)
    } else if (side === 'recv') {
      inputRef.current?.focus({ preventScroll: true })
    }
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
    const v = a.balanceOf(a.from) * p
    a.setAmount(String(+v.toFixed(6)))
    setChip(p)
    setFiatText(null)
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
          {a.isMobile ? (
            <TabSelect />
          ) : (
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
          )}
          <Anchor kinds={['settings']} pop={<div className="popover settings" role="dialog" aria-label="Swap settings"><SettingsBody onClose={a.close} /></div>}>
          <div className="tools">
            <button
              className={'tool' + (a.chart !== 'off' ? ' on' : '')}
              aria-label="Price chart"
              onClick={() => {
                if (a.isMobile) a.openCoin(a.to === 'KTI' || a.from !== 'KTI' ? a.to : a.from)
                // from the Home card the chart opens on the Swap screen, next to the same pair
                else if (a.view === 'home') a.set({ view: 'swap', chart: 'side' })
                else a.set({ chart: a.chart === 'off' ? 'side' : 'off' })
              }}
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
              <Icon n="upload" size={16} />Send
            </span>
            {/* desktop: the % shortcuts replace the balance text only while the card is hovered or focused (cleaner at rest);
                touch: they show while typing, as before */}
            <div className={'top-r' + (showChips ? ' show' : '')}>
              {a.connected && (
                <div className="shortcuts">
                  {[0.25, 0.5, 0.75, 1].map((p) => (
                    <button key={p} className={'chip' + (chip === p && a.amountNum === a.balanceOf(a.from) * p ? ' on' : '')} onMouseDown={(e) => e.preventDefault()} onClick={() => pct(p)}>
                      {p === 1 ? 'Max' : p * 100 + '%'}
                    </button>
                  ))}
                </div>
              )}
              {/* the balance itself lives once, in the card's bottom row */}

            </div>
          </div>
          <div className="field-mid">
            <div className={'amount-wrap' + (fiat ? ' fiat' : '')}>
              {fiat && <span className={'cur' + (hasAmt || fiatText ? '' : ' zero')}>$</span>}
              <input
                ref={inputRef}
                className={'amount' + (a.fieldError ? ' err' : '')}
                inputMode="decimal"
                placeholder="0"
                value={fiat ? (fiatText ?? (hasAmt ? String(+q.inUsd.toFixed(2)) : '')) : a.amount}
                onChange={(e) => {
                  typeSend(e.target.value)
                  setChip(null)
                }}
                onFocus={() => setFocus(true)}
                onBlur={() => {
                  setFocus(false)
                  setFiatText(null)
                }}
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
                <button className="unit-swap" onMouseDown={(e) => e.preventDefault()} onClick={toggleFiat} aria-label={fiat ? `Type the amount in ${a.from}` : 'Type the amount in dollars'}>
                  <span>{fiat ? `${fmt(a.amountNum, a.amountNum < 1 ? 6 : 4)} ${a.from}` : usd(q.inUsd)}</span>
                  <Icon n="flip" size={12} sw={2} className="us-ic" />
                </button>
                {/* no wallet, no balance to show */}
                {(a.connected || (a.wasConnected && hasAmt)) && (
                  <span className="bal">
                    <Coin id={a.from} size={14} /> Balance: {a.balanceOf(a.from).toFixed(4)} {a.from}
                  </span>
                )}
              </>
            )}
          </div>
        </div>

        <div className="flip-slot">
          <button className="flip" onMouseDown={(e) => e.preventDefault()} onClick={flipCards} aria-label="Flip tokens">
{/* Safari mis-animates CSS transforms on shapes inside an SVG, so nothing inside an SVG moves here:
                the two lines are one static icon and each arrowhead is its own icon layered on top, moved as a plain element. */}
            <span className="flip-ic" aria-hidden>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 21V3M17 3v18" />
              </svg>
              <svg className="hd l" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 18l-3 3-3-3" />
              </svg>
              <svg className="hd r" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6l-3-3-3 3" />
              </svg>
            </span>
          </button>
        </div>

        {/* You receive */}
        <div ref={recvRef} onClick={focusReceive} className={'field gb' + (recvText !== null ? ' focus' : '')}>
          <div className="field-top">
            <span className="f-label">
              <Icon n="download" size={16} />Receive
            </span>
            {/* quick token picks stay available after choosing a token or typing an amount */}
            {!a.isMobile && (
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
            <div className={'amount-wrap' + (fiat ? ' fiat' : '')}>
              {fiat && <span className={'cur' + (hasAmt || recvText ? '' : ' zero')}>$</span>}
              <input
                ref={recvInputRef}
                className={'amount' + (recvText === null && (!hasAmt || noRoute) ? ' zero' : '') + (recvText === null && a.quoting ? ' updating' : '')}
                inputMode="decimal"
                placeholder="0"
                value={recvText ?? (hasAmt ? (fiat ? (noRoute ? '—' : fmt(q.outUsd, 2)) : outText) : '')}
                onFocus={() =>
                  setRecvText(hasAmt && !noRoute ? (fiat ? String(+a.quote.outUsd.toFixed(2)) : String(+a.quote.out.toFixed(a.quote.out < 1 ? 6 : 2))) : '')
                }
                onBlur={() => setRecvText(null)}
                onChange={(e) => typeReceive(e.target.value)}
                aria-label="Amount to receive"
              />
            </div>
            <TokenSelect id={a.to} onClick={() => a.set({ tokenSide: 'to', modal: 'tokenSelect', modalStack: [] })} />
          </div>
          <div className="field-bot">
            {a.quoting && hasAmt ? (
              <span>Updating estimate…</span>
            ) : (
              <button className="unit-swap" onMouseDown={(e) => e.preventDefault()} onClick={toggleFiat} aria-label={fiat ? `Show the amount in ${a.to}` : 'Show the amount in dollars'}>
                <span>
                  {fiat ? `${hasAmt && !noRoute ? outText : '0'} ${a.to}` : usd(hasAmt && !noRoute ? q.outUsd : 0)}
                  {hasAmt && !noRoute && !a.fieldError && <>&nbsp; ({q.usdDelta})</>}
                </span>
                <Icon n="flip" size={12} sw={2} className="us-ic" />
              </button>
            )}
            {(a.connected || (a.wasConnected && hasAmt)) && (
              <span className="bal">
                <Coin id={a.to} size={14} /> Balance: {a.balanceOf(a.to) === 0 ? '0' : a.balanceOf(a.to).toFixed(4)} {a.to}
              </span>
            )}
          </div>
        </div>

        {/* market price of both tokens, always in view where the amounts are decided; each one opens its chart */}
        <div className="price-bar" aria-label="Market prices">
          {[a.from, a.to].map((id) => {
            const t = TOKENS[id]
            return (
              <button key={id} className="pb-item" onClick={() => a.openCoin(id)} aria-label={`${t.symbol} price and chart`}>
                <Coin id={id} size={16} />
                <span className="pb-sym">{t.symbol}</span>
                <span className={'pb-chg' + (t.change24h > 0 ? ' up' : t.change24h < 0 ? ' down' : '')}>{pctText(t.change24h)}</span>
                <b>{unitPrice(t.price)}</b>
              </button>
            )
          })}
        </div>

        {showDetails && (
          <div className="details">
            <div className="d-head">
              <span className="rate">
                {noRoute ? (
                  'No route available'
                ) : (
                  <>
                    1 {a.from} = {fmt(q.rate, q.rate < 1 ? 6 : 0)} {a.to} <small>({unitPrice(from.price)})</small>
                  </>
                )}
              </span>
              <span className="meta">
                <Icon n="clock" size={14} /> {a.quoting ? 'Finding the best price…' : `Refreshes in ${secs}s`}
              </span>
            </div>
            {/* always visible: the three numbers that decide a swap */}
            <div className="d-row">
              <span className="k">
                Price impact
                <InfoTip title="Price impact">How much your own swap moves the pool price. Low is normal; a high value means you receive noticeably less.</InfoTip>
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
            <div className="d-row">
              <span className="k">
                Minimum received
<InfoTip title="Minimum received">
                  The least you'll get if the price moves before your swap confirms. If it would be lower, the swap is cancelled and your {a.from} stays in your wallet.
                </InfoTip>
              </span>
              <span className="v">{a.quoting || noRoute ? '—' : <b>{fmt(q.minOut, q.minOut < 1 ? 6 : q.minOut < 10000 ? 2 : 0)} {a.to}</b>}</span>
            </div>
            <div
              className={'d-row d-more' + (more ? ' on' : '')}
              role="button"
              tabIndex={0}
              aria-expanded={more}
              onClick={() => setMore((v) => !v)}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), setMore((v) => !v))}
            >
              <span className="k">
                Fees
                <InfoTip title="Fees">Everything this swap costs: the network fee plus the KOTAI pool fee. It is already included in the amounts above.</InfoTip>
              </span>
              <span className="v">
                {a.quoting || noRoute ? '—' : <b>{usd(q.feesUsd)}</b>}
                <Icon n="chevron" size={16} className="chev" />
              </span>
            </div>
            {/* on demand: where the fees go and how the swap is routed */}
            {more && !noRoute && (
              <div className="d-extra">
                <div className="d-row sm">
                  <span className="k">
                    <Icon n="fuel" size={14} /> Network fee
                    <InfoTip title="Network fee">Paid in BNB to the BNB Chain validators that process the transaction. It doesn't go to KOTAI.</InfoTip>
                  </span>
                  <span className="v">
                    {usd(q.gasUsd)} <small>{q.gasBnb} BNB</small>
                  </span>
                </div>
                <div className="d-row sm">
                  <span className="k">
                    <Icon n="coins" size={14} /> KOTAI pool fee
                    <InfoTip title="KOTAI pool fee">A share of the amount paid to the liquidity providers of this pool.</InfoTip>
                  </span>
                  <span className="v">
                    {usd(q.poolFeeUsd)} <small>{q.poolFeePct}%</small>
                  </span>
                </div>
                <div className="d-row sm">
                  <span className="k">
                    <Icon n="sliders" size={14} /> Max slippage
                    <InfoTip title="Max slippage" action={{ label: 'Open swap settings', onClick: () => a.open('settings') }}>
                      The most the price may move against you before the swap is cancelled. Not sure which value to use? Auto is the safe default.
                    </InfoTip>
                  </span>
                  <span className="v">
                    {q.slippage}% <small>{a.slippage === 'Auto' ? 'Auto' : 'Custom'}</small>
                  </span>
                </div>
                <div className="d-row sm">
                  <span className="k">
                    <Icon n="link" size={14} /> Route
                    <InfoTip title="Route">The path your tokens take. This pair swaps directly in one KOTAI pool on BNB Chain.</InfoTip>
                  </span>
                  <span className="v route">
                    <Coin id={a.from} size={16} /> {a.from} <Icon n="arrowRight" size={12} /> <Coin id={a.to} size={16} /> {a.to} <small>BNB Chain</small>
                  </span>
                </div>
              </div>
            )}
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
        {/* empty wallet: the button says what to do ("Add funds") and the ways to do it sit right below */}
        {a.noFunds && <FundOptions cards />}
      </div>

    </div>
  )
}
