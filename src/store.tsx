import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { flushSync } from 'react-dom'
import { ADDRESS, HISTORY, NETWORKS, TOKENS, WALLETS, type HistoryItem, type TokenId } from './data'

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

export type ModalKind =
  | null
  | 'connect'
  | 'kotaiWallet'
  | 'otherWallets'
  | 'walletMenu'
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
    networkId: 'eth',
    from: 'ETH',
    to: 'KTI',
    amount: '',
    slippage: 'Auto',
    deadline: 20,
    modal: null,
    modalStack: [],
    tokenSide: 'from',
    pendingToken: null,
    coinToken: 'ETH',
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
    } else apply()
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
    return {
      rate,
      out,
      outUsd,
      inUsd,
      impact,
      impactLevel: impact >= 5 ? 'High' : 'Low',
      usdDelta: high ? '−12.40%' : '−0.24%',
    }
  }, [s.from, s.to, s.scenario, amountNum])

  const finish = (o: AppState): AppState => {
    const amt = parseFloat(o.amount) || 0
    const out = amt * (TOKENS[o.from].price / TOKENS[o.to].price) * 0.99904
    const item: HistoryItem = {
      from: o.from,
      to: o.to,
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

  const banner = useMemo<AppApi['banner']>(() => {
    if (!s.connected) {
      if (s.wasConnected && amountNum > 0) return { tone: 'warn', text: 'Wallet disconnected. Your tokens and amounts were kept. Connect again to continue.' }
      return null
    }
    if (amountNum <= 0 || s.quoting) return null
    if (s.scenario === 'offline') return { tone: 'offline', text: 'No network connection. Your funds are safe and nothing was sent. We keep trying to reconnect.' }
    if (s.scenario === 'wrongNetwork') return { tone: 'info', text: 'Your wallet is connected to BNB Chain. Switch to Ethereum to swap these tokens.' }
    if (s.scenario === 'noRoute') return { tone: 'error', text: 'No route found for this amount. Try a smaller amount or another token.' }
    if (s.scenario === 'highImpact') return { tone: 'warn', text: 'High price impact detected. You may receive fewer tokens than expected.' }
    const bal = TOKENS[s.from].balance
    if (amountNum === bal && s.from === 'ETH')
      return { tone: 'warn', text: 'Not enough ETH for network fees. Leave about $2.33 (0.00067 ETH) to swap your full balance.' }
    return null
  }, [s.connected, s.wasConnected, s.scenario, s.from, s.quoting, amountNum])

  const fieldError = useMemo(() => {
    if (!s.connected || amountNum <= 0) return null
    const bal = TOKENS[s.from].balance
    if (amountNum > bal) return `Insufficient balance. You have ${bal.toFixed(4)} ${s.from}.`
    return null
  }, [s.connected, s.from, amountNum])

  const cta = useMemo<AppApi['cta']>(() => {
    const none = () => {}
    if (!s.connected) return { label: 'Connect wallet', disabled: false, kind: 'primary', action: () => open('connect') }
    if (amountNum <= 0) return { label: 'Enter an amount', disabled: true, kind: 'primary', action: none }
    if (fieldError) return { label: 'Insufficient balance', disabled: true, kind: 'disabled', action: none }
    if (s.quoting) return { label: 'Please wait…', disabled: true, kind: 'loading', action: none }
    if (s.scenario === 'wrongNetwork')
      return {
        label: 'Switch to Ethereum',
        disabled: false,
        kind: 'primary',
        action: () => {
          setS((o) => ({ ...o, scenario: 'none', networkId: 'eth' }))
        },
      }
    if (s.scenario === 'offline') return { label: 'Waiting for network', disabled: true, kind: 'disabled', action: none }
    if (s.scenario === 'noRoute') return { label: 'No route available', disabled: true, kind: 'dim', action: none }
    if (banner && banner.text.startsWith('Not enough ETH')) return { label: 'Not enough ETH for fees', disabled: true, kind: 'disabled', action: none }
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
  }, [s.connected, s.scenario, s.quoting, amountNum, fieldError, banner, open, set])

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

  const flip = useCallback(() => {
    setS((o) => ({ ...o, from: o.to, to: o.from, amount: '' }))
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

  const confirmWarning = useCallback(() => {
    setS((o) => (o.pendingToken ? applyToken(o, o.pendingToken) : { ...o, modal: null }))
  }, [])

  const connectWallet = useCallback(
    (id: string) => {
      // connecting from the Home lands the user on the swap screen
      setS((o) => {
        if (o.view === 'home') window.scrollTo({ top: 0 })
        return { ...o, walletId: id, connected: true, wasConnected: true, modal: null, modalStack: [], view: 'swap' }
      })
      const name = WALLETS.find((w) => w.id === id)?.name ?? (id === 'other' ? 'WalletConnect' : id[0].toUpperCase() + id.slice(1))
      toast({ tone: 'success', title: 'Wallet connected', body: `${name} · ${ADDRESS}` })
    },
    [toast],
  )

  const disconnect = useCallback(() => {
    setS((o) => ({ ...o, connected: false, modal: null, modalStack: [], scenario: 'none', quoting: false }))
  }, [])

  const setScenario = useCallback((sc: Scenario) => {
    clearTimers()
    setS((o) => {
      const next: AppState = { ...o, scenario: sc, modal: null, modalStack: [], view: 'swap', quoting: false, connected: true, wasConnected: true }
      if (!(parseFloat(o.amount) > 0) || parseFloat(o.amount) > 1 || (sc !== 'none' && parseFloat(o.amount) === 1)) next.amount = '0.5'
      next.networkId = sc === 'wrongNetwork' ? 'bnb' : 'eth'
      if (sc === 'highImpact' || sc === 'priceUpdated' || sc === 'accountChanged') next.modal = 'review'
      return next
    })
  }, [])

  const setNetwork = useCallback(
    (id: string) => {
      setS((o) => ({ ...o, networkId: id, modal: null, modalStack: [], scenario: o.scenario === 'wrongNetwork' && id === 'eth' ? 'none' : o.scenario }))
      toast({ tone: 'info', title: 'Network changed', body: NETWORKS.find((n) => n.id === id)?.name })
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
  }
  if (import.meta.env.DEV) (window as unknown as { __app: AppApi }).__app = api
  return <Ctx.Provider value={api}>{children}</Ctx.Provider>
}
