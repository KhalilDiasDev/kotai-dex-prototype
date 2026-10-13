/* ─────────────────────────────────────────────────────────────
   Proposta · Swap simples · Mobile  (Figma page "08 · Proposta · Swap simples · Mobile")
   Para quem nunca fez um swap: valor → conferir → confirmar. Each screen shows only what's needed,
   and warnings appear only when something could hurt the person. Phones only — desktop keeps the full flow.
   ───────────────────────────────────────────────────────────────── */
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { flushSync } from 'react-dom'
import { GAS_TOKEN, NETWORKS, TOKENS, fmt, usd, type TokenId } from '../data'
import { useApp, type Tab } from '../store'
import { FundOptions } from './Modals'
import { InfoTip, TabSelect, TokenSelect, useCountdown } from './SwapPanel'
import { Coin, Icon, Modal, Spinner } from './ui'

/** the simple flow runs on every screen size (desktop included) */
export const SIMPLE_FLOW = true

const QUICK: TokenId[] = ['KTI', 'USDT', 'BNB', 'USDC', 'ETH']
const TABS_PT: Record<Tab, string> = { swap: 'Trocar', limit: 'Limite', buy: 'Comprar' }
const GAS_KEEP = 0.0003 // BNB left in the wallet for the network fee

const amt = (n: number) => fmt(n, n < 1 ? 6 : n < 10000 ? 4 : 0)

/* a whole detail row answers the tap: it opens that row's explanation (or runs its action) */
const rowTap = (e: React.MouseEvent<HTMLDivElement>) => {
  if ((e.target as HTMLElement).closest('button')) return
  e.currentTarget.querySelector<HTMLButtonElement>('.info-tip > button')?.click()
}
const rowKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
  if (e.key !== 'Enter' && e.key !== ' ') return
  e.preventDefault()
  e.currentTarget.querySelector<HTMLButtonElement>('.info-tip > button')?.click()
}

/* ───────── "Taxa total" — one number; tapping it opens the details (V2 / V3) ───────── */
export function FeeDetails({ countdown }: { countdown?: number }) {
  const a = useApp()
  const q = a.quote
  const [open, setOpen] = useState(false)
  return (
    <div className={'sim-fee' + (open ? ' open' : '')}>
      <div
        className="sim-fee-head"
        role="button"
        tabIndex={0}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), setOpen((v) => !v))}
        aria-expanded={open}
      >
        <span className="k">
          Taxa total
          <InfoTip title="Taxa total">
            Tudo o que a troca custa: a taxa da rede (paga em BNB) e a taxa do pool da KOTAI. Já está incluída nos valores acima. Toque para ver os detalhes.
          </InfoTip>
        </span>
        {/* value · thin divider · square chevron button (Figma "Valor + seta") */}
        <span className="fee-r">
          <b>{a.quoting ? '—' : usd(q.feesUsd)}</b>
          <i className="fee-div" aria-hidden />
          <span className="fee-btn" aria-hidden>
            <Icon n="chevron" size={16} sw={2} className="chev" />
          </span>
        </span>
      </div>
      {open && (
        <div className="sim-fee-body">
          <div className="sim-row rate">
            <b>
              1 {a.from} = {fmt(q.rate, q.rate < 1 ? 8 : 0)} {a.to}
            </b>
            {countdown !== undefined && (
              <small>
                <Icon n="clock" size={14} /> Atualiza em {countdown}s
              </small>
            )}
          </div>
          <div className="sim-row tap" role="button" tabIndex={0} onClick={rowTap} onKeyDown={rowKey}>
            <span className="k">
              Efeito no preço
              <InfoTip title="Efeito no preço">Quanto a sua própria troca muda o preço do pool. Baixo é o normal.</InfoTip>
            </span>
            <span className="v">
              <span className={'badge' + (q.impactLevel === 'High' ? ' high' : '')}>{q.impactLevel === 'High' ? 'Alto' : 'Baixo'}</span>
              <b>{q.impact.toFixed(2)}%</b>
            </span>
          </div>
          <div className="sim-row tap" role="button" tabIndex={0} onClick={rowTap} onKeyDown={rowKey}>
            <span className="k">
              Mínimo recebido
              <InfoTip title="Mínimo recebido">Se o preço mudar antes da troca terminar, você recebe pelo menos isso. Se fosse menos, a troca é cancelada.</InfoTip>
            </span>
            <span className="v">
              <b>
                {amt(q.minOut)} {a.to}
              </b>
            </span>
          </div>
          <div
            className="sim-row tap"
            role="button"
            tabIndex={0}
            onClick={(e) => !(e.target as HTMLElement).closest('button') && a.open('settings')}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), a.open('settings'))}
          >
            <span className="k">
              Slippage
              <InfoTip title="Slippage">O quanto o preço pode mudar contra você antes de a troca ser cancelada. Auto é o mais seguro.</InfoTip>
            </span>
            <span className="v">
              <b>{q.slippage}%</b>
              <small>{a.slippage === 'Auto' ? 'Auto' : 'Manual'}</small>
              <button className="d-gear" onClick={() => a.open('settings')} aria-label="Ajustar o slippage">
                <Icon n="gear" size={16} />
              </button>
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

/* ───────── 1 · Valor ───────── */
export function SimpleSwapPanel() {
  const a = useApp()
  const q = a.quote
  const hasAmt = a.amountNum > 0
  const [focus, setFocus] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const recvInputRef = useRef<HTMLInputElement>(null)
  // "Recebe" is editable too: typing the amount you want back-solves what you need to send
  const [recvText, setRecvText] = useState<string | null>(null)
  // amounts can be typed in tokens or in dollars: the small line under each number flips the two
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
    const need = want > 0 && q.rate > 0 ? want / q.rate : 0
    a.setAmount(need > 0 ? String(+need.toFixed(need < 1 ? 8 : 6)) : '')
  }
  // quick token picks for what you receive
  const quick = (id: TokenId) => {
    a.set({ tokenSide: 'to' })
    a.pickToken(id)
  }
  const sendRef = useRef<HTMLDivElement>(null)
  const recvRef = useRef<HTMLDivElement>(null)
  const bal = a.balanceOf(a.from)
  const noRoute = a.connected && a.scenario === 'noRoute'
  // E1 · the whole BNB balance leaves nothing for the network fee — offer the corrected amount
  const needsGas = a.connected && !a.noFunds && a.from === GAS_TOKEN && hasAmt && Math.abs(a.amountNum - bal) < 1e-9 && !a.quoting
  const fixed = +(bal - GAS_KEEP).toFixed(4)
  const showBal = a.connected && (focus || needsGas)
  const secs = useCountdown(hasAmt && a.connected && !a.quoting && a.modal === null, () => {
    a.set({ quoting: true })
    window.setTimeout(() => a.set({ quoting: false }), 900)
  })

  const flip = () => {
    const sEl = sendRef.current
    const rEl = recvRef.current
    const d = sEl && rEl ? rEl.getBoundingClientRect().top - sEl.getBoundingClientRect().top : 0
    // the selection follows the value: typing in one card and flipping selects the other card, where that value now is
    const side = document.activeElement === inputRef.current ? 'send' : document.activeElement === recvInputRef.current ? 'recv' : null
    const prevSend = a.amount
    flushSync(() => a.flip())
    if (side === 'send') {
      recvInputRef.current?.focus({ preventScroll: true })
      if (!fiat) setRecvText(prevSend)
    } else if (side === 'recv') inputRef.current?.focus({ preventScroll: true })
    if (!sEl || !rEl || !d || matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const opt = { duration: 420, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' }
    sEl.animate([{ transform: `translateY(${d}px) scale(0.97)`, opacity: 0.6 }, { transform: 'none', opacity: 1 }], opt)
    rEl.animate([{ transform: `translateY(${-d}px) scale(0.97)`, opacity: 0.6 }, { transform: 'none', opacity: 1 }], opt)
  }

  // warnings only when something would hurt the person
  const net = NETWORKS.find((n) => n.id === a.networkId)?.name
  const warn: string | null = !a.connected
    ? a.wasConnected && hasAmt
      ? 'A carteira foi desconectada. Seus valores foram mantidos.'
      : null
    : a.networkId !== 'bnb' || a.scenario === 'wrongNetwork'
      ? `Sua carteira está na rede ${net}. A KTI só existe na BNB Chain.`
      : a.scenario === 'offline' && hasAmt
        ? 'Sem conexão com a internet. Nada foi enviado.'
        : noRoute && hasAmt
          ? 'Não encontramos uma rota para esse valor. Tente um valor menor.'
          : needsGas
            ? 'É preciso deixar um pouco de BNB para a taxa da rede. Podemos ajustar o valor para você.'
            : null

  // main button, in the person's words
  let cta: { label: ReactNode; disabled?: boolean; loading?: boolean; onClick?: () => void }
  if (!a.connected) cta = { label: 'Conectar carteira', onClick: () => a.open('connect') }
  else if (a.noFunds) cta = { label: 'Adicionar fundos', disabled: true }
  else if (a.networkId !== 'bnb' || a.scenario === 'wrongNetwork') cta = { label: 'Mudar para BNB Chain', onClick: a.cta.action }
  else if (!hasAmt) cta = { label: 'Digite um valor', disabled: true }
  else if (a.fieldError) cta = { label: 'Saldo insuficiente', disabled: true }
  else if (a.quoting) cta = { label: 'Atualizando…', disabled: true, loading: true }
  else if (a.scenario === 'offline') cta = { label: 'Aguardando conexão', disabled: true }
  else if (noRoute) cta = { label: 'Sem rota para esse valor', disabled: true }
  else if (needsGas) cta = { label: `Usar ${fixed} ${GAS_TOKEN}`, onClick: () => a.setAmount(String(fixed)) }
  else cta = { label: 'Continuar', onClick: a.cta.action }

  return (
    <div className="swap-col sim">
      <div className="swap-card">
        <div className="swap-top">
          {/* desktop keeps the original Swap / Limit / Buy tabs; phones use the compact select */}
          {a.isMobile ? (
            <TabSelect labels={TABS_PT} soon="Em breve" />
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
          <div className="tools">
            <button
              className={'tool' + (!a.isMobile && a.chart !== 'off' ? ' on' : '')}
              aria-label="Gráfico de preço"
              onClick={() =>
                a.isMobile
                  ? a.openCoin(a.to === 'KTI' || a.from !== 'KTI' ? a.to : a.from)
                  : a.view === 'home'
                    ? a.set({ view: 'swap', chart: 'side' })
                    : a.set({ chart: a.chart === 'off' ? 'side' : 'off' })
              }
            >
              <Icon n="chart" size={20} />
            </button>
            <button className="tool" aria-label="Ajustes da troca" onClick={() => a.open('settings')}>
              <Icon n="gear" size={20} className="ic-gear" />
            </button>
          </div>
        </div>

        {/* Envia */}
        <div ref={sendRef} className={'field gb' + (focus ? ' focus' : '') + (a.fieldError ? ' error' : '')} onClick={(e) => !(e.target as HTMLElement).closest('button, input') && inputRef.current?.focus()}>
          <div className="field-top">
            <span className="f-label">
              <Icon n="upload" size={16} />
              Envia
            </span>
            {/* balance shortcuts only while the field is selected (V1) */}
            {a.connected && focus && !a.noFunds && (
              <div className="shortcuts">
                {[0.25, 0.5, 0.75, 1].map((p) => (
                  <button key={p} className="chip" onMouseDown={(e) => e.preventDefault()} onClick={() => a.setAmount(String(+(bal * p).toFixed(6)))}>
                    {p === 1 ? 'Máx' : p * 100 + '%'}
                  </button>
                ))}
              </div>
            )}
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
                onChange={(e) => typeSend(e.target.value)}
                onFocus={() => setFocus(true)}
                onBlur={() => {
                  setFocus(false)
                  setFiatText(null)
                }}
                aria-label="Valor a enviar"
              />
            </div>
            <TokenSelect id={a.from} onClick={() => a.set({ tokenSide: 'from', modal: 'tokenSelect', modalStack: [] })} />
          </div>
          <div className="field-bot">
            {a.fieldError ? (
              <span className="field-err">
                <Icon n="warn" size={16} /> Saldo insuficiente. Você tem {bal.toFixed(4)} {a.from}.
              </span>
            ) : (
              <>
                <button className="unit-swap" onMouseDown={(e) => e.preventDefault()} onClick={toggleFiat} aria-label={fiat ? `Digitar em ${a.from}` : 'Digitar em dólares'}>
                  <span>{fiat ? `${fmt(a.amountNum, a.amountNum < 1 ? 6 : 4)} ${a.from}` : usd(q.inUsd)}</span>
                  <Icon n="flip" size={12} sw={2} className="us-ic" />
                </button>
                {showBal && (
                  <span className="bal">
                    <Coin id={a.from} size={14} /> Saldo: {bal.toFixed(4)} {a.from}
                  </span>
                )}
              </>
            )}
          </div>
        </div>

        <div className="flip-slot">
          <button className="flip" onMouseDown={(e) => e.preventDefault()} onClick={flip} aria-label="Inverter moedas">
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

        {/* Recebe */}
        <div
          ref={recvRef}
          className={'field gb' + (recvText !== null ? ' focus' : '')}
          onClick={(e) => !(e.target as HTMLElement).closest('button, input') && recvInputRef.current?.focus()}
        >
          <div className="field-top">
            <span className="f-label">
              <Icon n="download" size={16} />
              Recebe
            </span>
            {/* quick picks: on hover/focus on desktop, while the field is selected on phones */}
            {(!a.isMobile || recvText !== null) && (
              <div className="quick" aria-label="Moedas rápidas">
                {QUICK.map((id) => (
                  <button key={id} className={a.to === id ? 'on' : ''} onMouseDown={(e) => e.preventDefault()} onClick={() => quick(id)} aria-label={`Receber ${id}`}>
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
                value={recvText ?? (hasAmt ? (noRoute ? '—' : fiat ? fmt(q.outUsd, 2) : fmt(q.out, q.out < 1 ? 6 : 0)) : '')}
                onFocus={() =>
                  setRecvText(hasAmt && !noRoute ? (fiat ? String(+q.outUsd.toFixed(2)) : String(+q.out.toFixed(q.out < 1 ? 6 : 2))) : '')
                }
                onBlur={() => setRecvText(null)}
                onChange={(e) => typeReceive(e.target.value)}
                aria-label="Valor a receber"
              />
            </div>
            <TokenSelect id={a.to} onClick={() => a.set({ tokenSide: 'to', modal: 'tokenSelect', modalStack: [] })} />
          </div>
          <div className="field-bot">
            {a.quoting && hasAmt ? (
              <span>Atualizando…</span>
            ) : (
              <button className="unit-swap" onMouseDown={(e) => e.preventDefault()} onClick={toggleFiat} aria-label={fiat ? `Mostrar em ${a.to}` : 'Mostrar em dólares'}>
                <span>{fiat ? `${hasAmt && !noRoute ? fmt(q.out, q.out < 1 ? 6 : 0) : '0'} ${a.to}` : usd(hasAmt && !noRoute ? q.outUsd : 0)}</span>
                <Icon n="flip" size={12} sw={2} className="us-ic" />
              </button>
            )}
            {needsGas && (
              <span className="bal">
                <Coin id={a.to} size={14} /> Saldo: {fmt(a.balanceOf(a.to), 4)} {a.to}
              </span>
            )}
          </div>
        </div>

        {warn && (
          <div className="sim-warn" role="status">
            <Icon n="warn" size={18} />
            <span>{warn}</span>
          </div>
        )}

        {a.connected && hasAmt && !a.fieldError && !noRoute && !needsGas && !a.noFunds && <FeeDetails countdown={secs} />}

        <div className="cta">
          <button className={'btn accent block lg' + (cta.loading ? ' loading' : '')} disabled={cta.disabled} onClick={cta.onClick}>
            {cta.loading && <Spinner size={18} />}
            {cta.label}
          </button>
        </div>
        {a.noFunds && <FundOptions cards />}
      </div>
    </div>
  )
}

/* ───────── shared: Envia / Recebe summary ───────── */
function SumBox({ out, outUsd }: { out?: number; outUsd?: number }) {
  const a = useApp()
  const q = a.quote
  return (
    <div className="sum">
      <div className="sum-row">
        <div>
          <small>Envia</small>
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
          <small>Recebe</small>
          <b>
            {fmt(out ?? q.out, 0)} {a.to}
          </b>
          <span>{usd(outUsd ?? q.outUsd)}</span>
        </div>
        <Coin id={a.to} size={40} />
      </div>
    </div>
  )
}

const Notice = ({ children }: { children: ReactNode }) => (
  <div className="sim-warn soft" role="status">
    <Icon n="warn" size={18} />
    <span>{children}</span>
  </div>
)

/* ───────── 2 · Conferir (+ E2 preço mudou, E4 valor alto demais) ───────── */
export function SimpleReview() {
  const a = useApp()
  const q = a.quote
  const sc = a.scenario
  // the quote keeps refreshing while the person checks it (same "Atualiza em 60s" as the amount screen)
  const secs = useCountdown(a.modal === 'review', () => {
    a.set({ quoting: true })
    window.setTimeout(() => a.set({ quoting: false }), 900)
  })
  const cancel = () => {
    a.close()
    a.toast({ tone: 'info', title: 'Troca cancelada' })
  }
  const go = () => {
    if (sc !== 'none') a.set({ scenario: 'none' })
    a.startSwap()
  }
  if (sc === 'priceUpdated') {
    const before = a.amountNum * (TOKENS[a.from].price / TOKENS[a.to].price)
    return (
      <Modal title="O preço mudou" onClose={cancel} onScrim={cancel} className="sim-sheet">
        <Notice>
          Agora você recebe {fmt(q.out, 0)} {a.to} em vez de {fmt(before, 0)} {a.to}.
        </Notice>
        <SumBox />
        <FeeDetails countdown={secs} />
        <button className="btn accent block m52" onClick={go}>
          Continuar com o novo valor
        </button>
      </Modal>
    )
  }
  if (sc === 'highImpact') {
    return (
      <Modal title="Confira sua troca" onClose={cancel} onScrim={cancel} className="sim-sheet">
        <Notice>Você receberia cerca de {Math.round(q.impact)}% a menos que o preço normal. Tente um valor menor.</Notice>
        <SumBox />
        <FeeDetails countdown={secs} />
        <button className="btn accent block m52" onClick={a.close}>
          Mudar o valor
        </button>
        <button className="sim-link" onClick={go}>
          Trocar mesmo assim
        </button>
      </Modal>
    )
  }
  return (
    <Modal title="Confira sua troca" onClose={cancel} onScrim={cancel} className="sim-sheet">
      {sc === 'accountChanged' && <Notice>A conta ou a rede mudou na carteira. Atualizamos o valor.</Notice>}
      <SumBox />
      <FeeDetails countdown={secs} />
      <button className="btn accent block m52" onClick={go}>
        Confirmar
      </button>
    </Modal>
  )
}

/* ───────── 3 · Confirmar na carteira — only the current prompt (S4a/b/c) · E3 cancelou ───────── */
const WALLET_STEPS: Record<number, { icon: string; title: string; text: string }> = {
  0: { icon: 'wallet', title: 'Autorizar a troca', text: 'Abra a carteira e toque em Aprovar.' },
  2: { icon: 'shield', title: 'Assinar a permissão', text: 'Assine o pedido na carteira. Não tem custo.' },
  4: { icon: 'flip', title: 'Confirmar a troca', text: 'Confirme a troca na carteira.' },
}
export function SimpleWallet() {
  const a = useApp()
  if (a.step === -2) {
    return (
      <Modal title="Você cancelou" sub={`Nada foi cobrado. Seus ${a.from} não saíram da carteira.`} onClose={a.close} onScrim={a.close} className="sim-sheet">
        <div className="m-col">
          <button
            className="btn accent block m52"
            onClick={() => {
              a.set({ scenario: 'none' })
              window.setTimeout(a.startSwap)
            }}
          >
            Tentar de novo
          </button>
          <button className="btn secondary block" onClick={a.close}>
            Fechar
          </button>
        </div>
      </Modal>
    )
  }
  const order = [0, 2, 4]
  const cur = Math.max(0, order.indexOf(a.step))
  const st = WALLET_STEPS[order[cur]]
  return (
    <Modal title="Confirme na carteira" className="sim-sheet">
      {/* the three prompts stay in view as a row of icons; the current one spins, finished ones turn green */}
      <div className="sim-steps" aria-label={`Passo ${cur + 1} de 3`}>
        {order.map((k, i) => {
          const state = i < cur ? 'done' : i === cur ? 'on' : 'todo'
          return (
            <span key={k} className="sim-step-wrap">
              {i > 0 && <span className={'sim-conn' + (i <= cur ? ' done' : '')} />}
              <span className={'sim-step ' + state}>
                <span className="c">
                  <Icon n={WALLET_STEPS[k].icon} size={18} />
                </span>
                {state === 'on' && <Spinner size={56} stroke={3} />}
                {state === 'done' && (
                  <span className="badge-ok">
                    <Icon n="check" size={10} sw={3.2} />
                  </span>
                )}
              </span>
            </span>
          )
        })}
      </div>
      <div className="sim-wallet">
        <b key={'t' + a.step}>{st.title}</b>
        <span key={'s' + a.step}>{st.text}</span>
      </div>
      <button
        className="btn secondary block m52"
        onClick={() => {
          a.close()
          a.toast({ tone: 'info', title: 'Transação cancelada' })
        }}
      >
        Cancelar
      </button>
    </Modal>
  )
}

/* ───────── Trocando… — both amounts travel into the centre indicator, which turns into a check ───────── */
export function SimpleSwapping() {
  const a = useApp()
  const q = a.quote
  const slow = a.scenario === 'slow'
  // 0 sending · 1 confirming (amounts start moving in) · 2 receiving (merged) · 3 check
  const [phase, setPhase] = useState(0)
  useEffect(() => {
    if (slow) return
    const ts = [setTimeout(() => setPhase(1), 900), setTimeout(() => setPhase(2), 2300), setTimeout(() => setPhase(3), 2900)]
    return () => ts.forEach(clearTimeout)
  }, [slow])
  const status = slow ? 'Confirmando na rede' : [`Enviando seus ${a.from}`, 'Confirmando na rede', `Recebendo seus ${a.to}`, 'Pronto!'][phase]
  return (
    <Modal title="Trocando…" className="sim-sheet">
      <div className={'sim-swapping p' + phase}>
        <div className="sw-side l">
          <Coin id={a.from} size={56} />
          <b>
            {fmt(a.amountNum)} {a.from}
          </b>
        </div>
        <span className="sw-center">
          {phase < 3 ? (
            <>
              <Spinner size={64} stroke={3} />
              <span className="ic">
                <Icon n="swapH" size={20} />
              </span>
            </>
          ) : (
            <span className="ic ok">
              <svg viewBox="0 0 28 28" width="26" height="26" fill="none" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M4 14.5l6.5 6.5L24 7.5" pathLength={1} />
              </svg>
            </span>
          )}
        </span>
        <div className="sw-side r">
          <Coin id={a.to} size={56} />
          <b>
            {fmt(q.out, 0)} {a.to}
          </b>
        </div>
      </div>
      <p className="sim-status" key={status}>
        {status}
      </p>
      {slow && (
        <>
          <Notice>A rede está mais lenta que o normal. Isso pode levar alguns minutos.</Notice>
          <button className="btn accent block m52" onClick={() => window.setTimeout(a.completeSwap, 1200)}>
            Acelerar
          </button>
        </>
      )}
    </Modal>
  )
}

/* ───────── Pronto ───────── */
export function SimpleDone() {
  const a = useApp()
  const ls = a.lastSwap ?? { amount: a.amountNum, out: a.quote.out, from: a.from, to: a.to }
  const [copied, setCopied] = useState(false)
  const reset = () => a.set({ amount: '', modal: null, modalStack: [] })
  return (
    <Modal title="Troca Concluída" onClose={reset} onScrim={reset} className="sim-sheet done-modal">
      <div className="big-check">
        <svg viewBox="0 0 28 28" width="28" height="28" fill="none" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M4 14.5l6.5 6.5L24 7.5" pathLength={1} />
        </svg>
      </div>
      <div className="m-box g14">
        <div className="kv tall">
          <span>Enviado</span>
          <span className="amt">
            <span>
              <b className="red">
                -{fmt(ls.amount)} {ls.from}
              </b>
              <Coin id={ls.from} size={20} />
            </span>
            <small>{usd(ls.amount * TOKENS[ls.from].price)}</small>
          </span>
        </div>
        <div className="kv tall">
          <span>Recebido</span>
          <span className="amt">
            <span>
              <b className="green">
                +{fmt(ls.out, 0)} {ls.to}
              </b>
              <Coin id={ls.to} size={20} />
            </span>
            <small>{usd(ls.out * TOKENS[ls.to].price)}</small>
          </span>
        </div>
      </div>
      <div className="tx sim-tx">
        {/* label on the left, explorer link on the right, above the ID */}
        <div className="tx-head">
          <small>ID da transação</small>
          <button className="m-link sm" onClick={() => a.toast({ tone: 'info', title: 'Ver no BscScan', body: 'Opens bscscan.com in the real product' })}>
            Ver no explorador <Icon n="ext" size={14} />
          </button>
        </div>
        <div className="hash">
          <span className="mono">0x9f3c2b7e5a41d8c06f93e1b2a7d4058c3e6f19a2b8d7c4e0153a96f2c8b1a71b</span>
          <button
            onClick={() => {
              setCopied(true)
              a.toast({ tone: 'success', title: 'ID copiado' })
            }}
            aria-label="Copiar ID da transação"
          >
            <Icon n={copied ? 'check' : 'copy'} size={16} />
          </button>
        </div>
      </div>
      <div className="m-row2 g10">
        <button className="btn accent m52" onClick={reset}>
          Trocar de novo
        </button>
        <button className="btn secondary m52" onClick={reset}>
          Concluir
        </button>
      </div>
    </Modal>
  )
}

/* ───────── A troca não foi concluída ───────── */
export function SimpleFailed() {
  const a = useApp()
  return (
    <Modal title="A troca não foi concluída" sub={`Por segurança, a rede cancelou a troca. Seus ${a.from} voltaram para a carteira; só a taxa da rede foi cobrada.`} onClose={a.close} onScrim={a.close} className="sim-sheet">
      <div className="m-col">
        <button
          className="btn accent block m52"
          onClick={() => {
            a.set({ scenario: 'none' })
            window.setTimeout(a.startSwap)
          }}
        >
          Tentar de novo
        </button>
        <button className="btn secondary block" onClick={a.close}>
          Fechar
        </button>
      </div>
    </Modal>
  )
}
