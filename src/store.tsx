import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { flushSync } from 'react-dom'
import { ADDRESS, GAS_TOKEN, HISTORY, KTI_NETWORK, NETWORKS, TOKENS, WALLETS, type HistoryItem, type TokenId } from './data'

export type View = 'home' | 'swap'
export type Tab = 'swap' | 'limit' | 'buy'
export type Scenario =
  | 'none'
  | 'wrongNetwork'
  | 'noRoute'
  | 'offline'
  | 'highImpact'
  | 'priceUpdated'
  | 'accountChanged'
  | 'rejected'
  | 'slow'
  | 'failed'
  | 'noFunds'

export type ModalKind =
  | null
  | 'connect'
  | 'kotaiWallet'
  | 'otherWallets'
  | 'walletMenu'
  | 'addFunds'
  | 'walletNet'
  | 'network'
  | 'networkFilter'
  | 'tokenSelect'
  | 'tokenWarning'
  | 'settings'
  | 'coin'
  | 'search'
  | 'history'
  | 'system'
  | 'language'
  | 'currency'
  | 'review'
  | 'signing'
  | 'processing'
  | 'done'
  | 'failed'
  | 'help'
  | 'navMenu'
  | 'cancelConnect'
  | 'cancelReview'
  | 'cancelSign'
  | 'closeProcessing'

export interface Toast {
  id: number
  title: string
  body?: string
  tone: 'success' | 'info' | 'error'
}

export interface Quote {
  rate: number
  out: number
  outUsd: number
  inUsd: number
  impact: number
  impactLevel: 'Low' | 'High'
  usdDelta: string
  /** max slippage in % (Auto = 0.5) and the least the user can end up with */
  slippage: number
  minOut: number
  /** pool fee (0.3%, 0.05% between stables/majors) and network fee, in USD */
  poolFeePct: number
  poolFeeUsd: number
  gasUsd: number
  gasBnb: number
  feesUsd: number
}

interface AppState {
  view: View
  tab: Tab
  connected: boolean
  wasConnected: boolean
  walletId: string
  networkId: string
  from: TokenId
  to: TokenId
  amount: string
  slippage: string
  deadline: number
  modal: ModalKind
  modalStack: ModalKind[]
  tokenSide: 'from' | 'to'
  pendingToken: TokenId | null
  coinToken: TokenId
  scenario: Scenario
  step: number
  toasts: Toast[]
  language: string
  currency: string
  skipWarning: boolean
  history: HistoryItem[]
  lastSwap: { amount: number; out: number; from: TokenId; to: TokenId } | null
  showControls: boolean
  chart: 'off' | 'side' | 'full'
  quoting: boolean
}

interface AppApi extends AppState {
  quote: Quote
  cta: { label: string; disabled: boolean; kind: 'primary' | 'disabled' | 'dim' | 'loading'; action: () => void }
  banner: { tone: 'warn' | 'error' | 'info' | 'offline'; text: string } | null
  fieldError: string | null
  isMobile: boolean
  amountNum: number
  set: (p: Partial<AppState>) => void
  open: (m: ModalKind) => void
  push: (m: ModalKind) => void
  back: () => void
  close: () => void
  setAmount: (v: string) => void
  flip: () => void
  pickToken: (id: TokenId) => void
  confirmWarning: () => void
  connectWallet: (id: string) => void
  disconnect: () => void
  startSwap: () => void
  toast: (t: Omit<Toast, 'id'>) => void
  dismissToast: (id: number) => void
  setScenario: (s: Scenario) => void
  setNetwork: (id: string) => void
  completeSwap: () => void
  openCoin: (id: TokenId) => void
  /** wallet balance of a token (zero for every token in the "wallet without funds" use case) */
  balanceOf: (id: TokenId) => number
  noFunds: boolean
}

const Ctx = createContext<AppApi | null>(null)

export const useApp = (): AppApi => {
  const v = useContext(Ctx)
  if (!v) throw new Error('useApp outside provider')
  return v
}

const MQ = '(max-width: 720px)'
const useIsMobile = (): boolean => {
  const [m, setM] = useState(() => window.matchMedia(MQ).matches)
  useEffect(() => {
    const mq = window.matchMedia(MQ)
    const h = () => setM(mq.matches)
    mq.addEventListener('change', h)
    return () => mq.removeEventListener('change', h)
  }, [])
  return m
}

/* USD factors that reproduce the Figma numbers (0.5 ETH → ≈ $1,745.83 (−0.24%), high impact ≈ $1,529.37) */
const USD_NORMAL = 0.9976172
const USD_HIGH = 0.8739257

let toastId = 1

export function AppProvider({ children }: { children: ReactNode }) {
  const isMobile = useIsMobile()
  const [s, setS] = useState<AppState>({
    view: 'home',
    tab: 'swap',
    connected: false,
    wasConnected: false,
    walletId: 'kotai',
    networkId: KTI_NETWORK,
    from: 'BNB',
    to: 'KTI',
    amount: '',
    slippage: 'Auto',
    deadline: 20,
    modal: null,
    modalStack: [],
    tokenSide: 'from',
    pendingToken: null,
    coinToken: 'KTI',
    scenario: 'none',
    step: 1,
    toasts: [],
    language: 'English',
    currency: 'USD',
    skipWarning: false,
    history: HISTORY,
    lastSwap: null,
    showControls: false,
    chart: 'off',
    quoting: false,
  })
  const timers = useRef<number[]>([])
  const quoteTimer = useRef<number>()
  const clearTimers = () => {
    timers.current.forEach((t) => window.clearTimeout(t))
    timers.current = []
  }
  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms))
  }

  const sRef = useRef(s)
  sRef.current = s
  // switching screens (Home ↔ Swap) runs as a View Transition: old page eases out while the new one rises in;
  const set = useCallback((p: Partial<AppState>) => {
    const apply = () => setS((o) => ({ ...o, ...p }))
    const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown }
    // the price chart opening / going full screen / closing morphs the layout the same way (swap card glides aside)
    const kind = p.view && p.view !== sRef.current.view ? 'view' : p.chart && p.chart !== sRef.current.chart ? 'chart' : null
    if (kind && doc.startViewTransition && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const root = document.documentElement
      root.dataset.vt = kind
      const vt = doc.startViewTransition(() => {
        flushSync(apply)
        // new screen always starts at the top, inside the same frame (no visible jump)
        if (kind === 'view') window.scrollTo(0, 0)
      }) as { finished?: Promise<void> }
      vt.finished?.finally(() => {
        if (root.dataset.vt === kind) delete root.dataset.vt
      })
    } else {
      apply()
      // browsers without View Transitions (older Safari): still land at the top of the new screen
      if (kind === 'view') requestAnimationFrame(() => window.scrollTo(0, 0))
    }
  }, [])

  const dismissToast = useCallback((id: number) => setS((o) => ({ ...o, toasts: o.toasts.filter((t) => t.id !== id) })), [])
  const toast = useCallback(
    (t: Omit<Toast, 'id'>) => {
      const id = toastId++
      setS((o) => ({ ...o, toasts: [...o.toasts.slice(-2), { ...t, id }] }))
      window.setTimeout(() => dismissToast(id), 4200)
    },
    [dismissToast],
  )

  const open = useCallback((m: ModalKind) => setS((o) => ({ ...o, modal: m, modalStack: [] })), [])
  const push = useCallback((m: ModalKind) => setS((o) => ({ ...o, modal: m, modalStack: [...o.modalStack, o.modal] })), [])
  const back = useCallback(
    () =>
      setS((o) => {
        const st = [...o.modalStack]
        const prev = st.pop() ?? null
        return { ...o, modal: prev, modalStack: st }
      }),
    [],
  )
  const close = useCallback(() => {
    clearTimers()
    setS((o) => ({ ...o, modal: null, modalStack: [] }))
  }, [])

  const amountNum = parseFloat(s.amount.replace(/,/g, '')) || 0

  const quote = useMemo<Quote>(() => {
    const f = TOKENS[s.from]
    const t = TOKENS[s.to]
    const baseRate = f.price / t.price
    const high = s.scenario === 'highImpact'
    const rate = s.scenario === 'priceUpdated' ? baseRate * 0.99 : high ? baseRate * 0.876 : baseRate
    const out = amountNum * rate
    const inUsd = amountNum * f.price
    const outUsd = inUsd * (high ? USD_HIGH : USD_NORMAL) * (s.scenario === 'priceUpdated' ? 0.99 : 1)
    const impact = high ? 12.4 : 0.08
    const slippage = s.slippage === 'Auto' ? 0.5 : parseFloat(s.slippage) || 0.5
    const poolFeePct = s.from === 'KTI' || s.to === 'KTI' ? 0.3 : 0.05
    const poolFeeUsd = (inUsd * poolFeePct) / 100
    const gasBnb = 0.0003
    const gasUsd = gasBnb * TOKENS[GAS_TOKEN].price
    return {
      rate,
      out,
      outUsd,
      inUsd,
      impact,
      impactLevel: impact >= 5 ? 'High' : 'Low',
      usdDelta: high ? '−12.40%' : '−0.24%',
      slippage,
      minOut: out * (1 - slippage / 100),
      poolFeePct,
      poolFeeUsd,
      gasUsd,
      gasBnb,
      feesUsd: poolFeeUsd + gasUsd,
    }
  }, [s.from, s.to, s.scenario, s.slippage, amountNum])

  const finish = (o: AppState): AppState => {
    const amt = parseFloat(o.amount) || 0
    const out = amt * (TOKENS[o.from].price / TOKENS[o.to].price) * 0.99904
    const item: HistoryItem = {
      from: o.from,
      to: o.to,
      amountFrom: amt,
      amountTo: out,
      label: `${amt} ${o.from} for ${Math.round(out).toLocaleString('en-US')} ${o.to}`,
      when: 'Just now',
      status: 'Completed',
    }
    return { ...o, modal: 'done', modalStack: [], lastSwap: { amount: amt, out, from: o.from, to: o.to }, history: [item, ...o.history] }
  }

  const startSwap = useCallback(() => {
    clearTimers()
    // step 0 = approving (Approve for Permit2 loading) → 2 = waiting for the signature → 3 = confirming on chain
    setS((o) => ({ ...o, modal: 'signing', modalStack: [], step: 0 }))
    const sc = s.scenario
    later(() => {
      setS((o) => (o.step === 0 && (o.modal === 'signing' || o.modal === 'cancelSign') ? { ...o, step: 2 } : o))
    }, 1800)
    later(() => {
      setS((o) => {
        if (o.step !== 2 || (o.modal !== 'signing' && o.modal !== 'cancelSign')) return o
        if (sc === 'rejected') return { ...o, modal: 'signing', modalStack: [], step: -2 }
        return { ...o, modal: 'processing', modalStack: [], step: 3 }
      })
    }, 5000)
    if (sc === 'rejected' || sc === 'slow') return
    later(() => {
      setS((o) => {
        if (o.step !== 3) return o
        if (sc === 'failed') {
          if (o.modal === 'processing' || o.modal === 'closeProcessing') return { ...o, modal: 'failed', modalStack: [], step: 1 }
          return o
        }
        if (o.modal === 'processing' || o.modal === 'closeProcessing') return { ...finish(o), step: 1 }
        if (o.modal === null || o.modal === 'history') {
          const f = finish(o)
          return { ...f, modal: o.modal, step: 1 }
        }
        return o
      })
    }, 9200)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.scenario])

  const noFunds = s.connected && s.scenario === 'noFunds'
  const balanceOf = (id: TokenId) => (s.scenario === 'noFunds' ? 0 : TOKENS[id].balance)

  const banner = useMemo<AppApi['banner']>(() => {
    if (!s.connected) {
      if (s.wasConnected && amountNum > 0) return { tone: 'warn', text: 'Wallet disconnected. Your tokens and amounts were kept. Connect again to continue.' }
      return null
    }
    if (noFunds) return { tone: 'info', text: 'Your wallet has no funds yet. Add funds to start trading — you can buy crypto or transfer it in.' }
    if (amountNum <= 0 || s.quoting) return null
    if (s.scenario === 'offline') return { tone: 'offline', text: 'No network connection. Your funds are safe and nothing was sent. We keep trying to reconnect.' }
    // KTI only exists on BNB Chain: any other network in the wallet blocks the swap until it's switched
    if (s.scenario === 'wrongNetwork' || s.networkId !== KTI_NETWORK)
      return {
        tone: 'info',
        text: `Your wallet is connected to ${NETWORKS.find((n) => n.id === s.networkId)?.name ?? 'another network'}. KTI only exists on BNB Chain — switch to continue.`,
      }
    if (s.scenario === 'noRoute') return { tone: 'error', text: 'No route found for this amount. Try a smaller amount or another token.' }
    if (s.scenario === 'highImpact') return { tone: 'warn', text: 'High price impact detected. You may receive fewer tokens than expected.' }
    const bal = balanceOf(s.from)
    if (amountNum === bal && s.from === GAS_TOKEN)
      return { tone: 'warn', text: 'Not enough BNB for network fees. Leave about $0.18 (0.0003 BNB) to swap your full balance.' }
    return null
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.connected, s.wasConnected, s.scenario, s.from, s.networkId, s.quoting, amountNum])

  const fieldError = useMemo(() => {
    if (!s.connected || amountNum <= 0 || noFunds) return null
    const bal = balanceOf(s.from)
    if (amountNum > bal) return `Insufficient balance. You have ${bal.toFixed(4)} ${s.from}.`
    return null
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.connected, s.from, s.scenario, amountNum])

  const cta = useMemo<AppApi['cta']>(() => {
    const none = () => {}
    if (!s.connected) return { label: 'Connect wallet', disabled: false, kind: 'primary', action: () => open('connect') }
    // a wallet with nothing in it can't swap yet: the main action becomes adding funds
    if (noFunds) return { label: 'Add funds', disabled: false, kind: 'primary', action: () => open('addFunds') }
    if (amountNum <= 0) return { label: 'Enter an amount', disabled: true, kind: 'primary', action: none }
    if (fieldError) return { label: 'Insufficient balance', disabled: true, kind: 'disabled', action: none }
    if (s.quoting) return { label: 'Please wait…', disabled: true, kind: 'loading', action: none }
    if (s.scenario === 'wrongNetwork' || s.networkId !== KTI_NETWORK)
      return {
        label: 'Switch to BNB Chain',
        disabled: false,
        kind: 'primary',
        action: () => {
          setS((o) => ({ ...o, scenario: o.scenario === 'wrongNetwork' ? 'none' : o.scenario, networkId: KTI_NETWORK }))
        },
      }
    if (s.scenario === 'offline') return { label: 'Waiting for network', disabled: true, kind: 'disabled', action: none }
    if (s.scenario === 'noRoute') return { label: 'No route available', disabled: true, kind: 'dim', action: none }
    if (banner && banner.text.startsWith('Not enough BNB')) return { label: 'Not enough BNB for fees', disabled: true, kind: 'disabled', action: none }
    return {
      label: 'Review swap',
      disabled: false,
      kind: 'primary',
      action: () => {
        // starting a swap from the Home card moves to the Swap screen (amounts kept) and opens the review there
        if (sRef.current.view === 'home') {
          set({ view: 'swap', chart: 'off' })
          window.setTimeout(() => open('review'), 420)
        } else open('review')
      },
    }
  }, [s.connected, s.scenario, s.networkId, s.quoting, amountNum, fieldError, banner, open, set])

  const requote = () => {
    window.clearTimeout(quoteTimer.current)
    quoteTimer.current = window.setTimeout(() => setS((o) => ({ ...o, quoting: false })), 1100)
  }

  const setAmount = useCallback((v: string) => {
    const clean = v.replace(/,/g, '.').replace(/[^0-9.]/g, '')
    if ((clean.match(/\./g) ?? []).length > 1) return
    setS((o) => ({ ...o, amount: clean, quoting: o.connected && parseFloat(clean) > 0 }))
    requote()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // flipping keeps the pair the user built: what they were receiving becomes what they send
  const flip = useCallback(() => {
    setS((o) => {
      const amt = parseFloat(o.amount)
      if (!(amt > 0)) return { ...o, from: o.to, to: o.from }
      const out = amt * (TOKENS[o.from].price / TOKENS[o.to].price)
      return { ...o, from: o.to, to: o.from, amount: String(+out.toFixed(out < 1 ? 8 : 6)), quoting: o.connected }
    })
    requote()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const applyToken = (o: AppState, id: TokenId): AppState => {
    const other = o.tokenSide === 'from' ? o.to : o.from
    const next: Partial<AppState> = { modal: null, modalStack: [], pendingToken: null }
    if (id === other) {
      next.from = o.to
      next.to = o.from
    } else if (o.tokenSide === 'from') next.from = id
    else next.to = id
    return { ...o, ...next }
  }

  const pickToken = useCallback((id: TokenId) => {
    setS((o) => {
      if (id === 'KTI' && !o.skipWarning && (o.tokenSide === 'from' ? o.from : o.to) !== 'KTI')
        return { ...o, pendingToken: id, modal: 'tokenWarning', modalStack: [] }
      return applyToken(o, id)
    })
  }, [])

  // once the KTI notice is accepted it isn't shown again this session
  const confirmWarning = useCallback(() => {
    setS((o) => (o.pendingToken ? { ...applyToken(o, o.pendingToken), skipWarning: true } : { ...o, modal: null }))
  }, [])

  const connectWallet = useCallback(
    (id: string) => {
      // connecting from the Home lands the user on the swap screen
      setS((o) => {
        if (o.view === 'home') window.scrollTo({ top: 0 })
        return { ...o, walletId: id, connected: true, wasConnected: true, modal: null, modalStack: [], view: 'swap' }
      })
      const name = WALLETS.find((w) => w.id === id)?.name ?? (id === 'other' ? 'WalletConnect' : id[0].toUpperCase() + id.slice(1))
      toast({ tone: 'success', title: `${name} connected`, body: `${name} · ${ADDRESS}` })
    },
    [toast],
  )

  const disconnect = useCallback(() => {
    // disconnecting on purpose starts clean: the typed amounts go away with the wallet
    setS((o) => ({ ...o, connected: false, wasConnected: false, amount: '', modal: null, modalStack: [], scenario: 'none', quoting: false }))
  }, [])

  const setScenario = useCallback((sc: Scenario) => {
    clearTimers()
    setS((o) => {
      const next: AppState = { ...o, scenario: sc, modal: null, modalStack: [], view: 'swap', quoting: false, connected: true, wasConnected: true }
      // scenarios run on a pair the wallet can actually afford (BNB → …), below the balance
      if (TOKENS[o.from].balance < 0.5) {
        next.from = 'BNB'
        if (o.to === 'BNB') next.to = 'KTI'
      }
      const amt = parseFloat(o.amount)
      if (!(amt > 0) || amt >= TOKENS[next.from].balance) next.amount = '0.5'
      if (sc === 'noFunds') next.amount = ''
      next.networkId = sc === 'wrongNetwork' ? 'eth' : KTI_NETWORK
      if (sc === 'highImpact' || sc === 'priceUpdated' || sc === 'accountChanged') next.modal = 'review'
      return next
    })
  }, [])

  const setNetwork = useCallback(
    (id: string) => {
      setS((o) => ({ ...o, networkId: id, modal: null, modalStack: [], scenario: o.scenario === 'wrongNetwork' && id === KTI_NETWORK ? 'none' : o.scenario }))
      toast({ tone: 'info', title: `Switched to ${NETWORKS.find((n) => n.id === id)?.name ?? 'network'}`, body: NETWORKS.find((n) => n.id === id)?.name })
    },
    [toast],
  )

  const openCoin = useCallback((id: TokenId) => setS((o) => ({ ...o, coinToken: id, modal: 'coin', modalStack: [] })), [])

  useEffect(() => clearTimers, [])

  const api: AppApi = {
    ...s,
    quote,
    cta,
    banner,
    fieldError,
    isMobile,
    amountNum,
    set,
    open,
    push,
    back,
    close,
    setAmount,
    flip,
    pickToken,
    confirmWarning,
    connectWallet,
    disconnect,
    startSwap,
    toast,
    dismissToast,
    setScenario,
    setNetwork,
    completeSwap: () => setS((o) => ({ ...finish(o), step: 1 })),
    openCoin,
    balanceOf,
    noFunds,
  }
  if (import.meta.env.DEV) (window as unknown as { __app: AppApi }).__app = api
  return <Ctx.Provider value={api}>{children}</Ctx.Provider>
}
