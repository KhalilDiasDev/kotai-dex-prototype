import { useEffect, useState, useSyncExternalStore, type ComponentType } from 'react'
import { BottomNav } from './components/BottomNav'
import { Header } from './components/Header'
import { HelpFab } from './components/HelpFab'
import { IconTips } from './components/IconTips'
import { LandingMobile } from './components/LandingMobile'
import { Modals } from './components/Modals'
import { ProtoControls } from './components/ProtoControls'
import { SwapPanel } from './components/SwapPanel'
import { Icon } from './components/ui'
import { AppProvider, useApp, type Toast } from './store'

/* Desktop-only code (the long landing with the 3D card tilt + `motion`, and the side chart) lives in its own chunks,
   so phones never download it. On wider screens it is requested right away. Unlike React.lazy, once a chunk has
   arrived the component renders synchronously — a screen switch never shows an empty frame. */
function onDemand<P extends object>(load: () => Promise<ComponentType<P>>) {
  let Loaded: ComponentType<P> | null = null
  let started = false
  const subs = new Set<() => void>()
  const preload = () => {
    if (started) return
    started = true
    void load().then((c) => {
      Loaded = c
      subs.forEach((f) => f())
    })
  }
  const subscribe = (cb: () => void) => {
    subs.add(cb)
    preload()
    return () => {
      subs.delete(cb)
    }
  }
  function Comp(props: P) {
    const C = useSyncExternalStore(subscribe, () => Loaded)
    return C ? <C {...props} /> : null
  }
  return { Comp, preload }
}
const landing = onDemand(() => import('./components/Landing').then((m) => m.default))
const chartPanel = onDemand(() => import('./components/ChartPanel').then((m) => m.ChartPanel))
const LandingDesktop = landing.Comp
const ChartPanel = chartPanel.Comp
if (typeof window !== 'undefined' && window.matchMedia('(min-width: 721px)').matches) {
  landing.preload()
  chartPanel.preload()
}

function Background({ plain }: { plain: boolean }) {
  return (
    <div className={'bg' + (plain ? ' plain' : '')} aria-hidden>
      <div className="bg-in">
        <span className="blob violet" />
        <span className="blob blue" />
        <span className="blob top" />
        <span className="arc l" />
        <span className="arc r" />
        <span className="spark" />
        <span className="brand" />
      </div>
    </div>
  )
}

function Toasts({ list }: { list: Toast[] }) {
  const a = useApp()
  if (!list.length) return null
  return (
    <div className="toasts top" aria-live="polite">
      {list.map((t) => (
        <div key={t.id} className={'toast ' + t.tone}>
          <span className="ti">
            <Icon n={t.tone === 'success' ? 'check' : t.tone === 'error' ? 'warn' : 'info'} size={20} sw={2} />
          </span>
          <div className="tx">
            <div className="tt">{t.title}</div>
            {t.body && <div className="tb">{t.body}</div>}
          </div>
          <button className="x" onClick={() => a.dismissToast(t.id)} aria-label="Dismiss">
            <Icon n="x" size={14} sw={2} />
          </button>
          <span className="track" />
          <span className="bar" />
        </div>
      ))}
    </div>
  )
}

/* tablets (≤1100px) don't have room for the top nav, so they get the phone's bottom bar */
function useCompactNav() {
  const q = '(max-width: 1100px)'
  const [on, setOn] = useState(() => window.matchMedia(q).matches)
  useEffect(() => {
    const m = window.matchMedia(q)
    const h = () => setOn(m.matches)
    m.addEventListener('change', h)
    return () => m.removeEventListener('change', h)
  }, [])
  return on
}

function Shell() {
  const a = useApp()
  const compactNav = useCompactNav()
  const chart = a.view === 'swap' && a.chart !== 'off' && !a.isMobile

  useEffect(() => {
    document.title = a.view === 'home' ? 'KOTAI DEX · Home' : 'KOTAI DEX · Swap'
  }, [a.view])

  return (
    <>
      {/* desktop Home paints its own backdrop; mobile Home has none, so it keeps the app gradient */}
      <Background plain={a.view === 'home' && !a.isMobile} />
      <div className="app">
        <Header />
        {a.view === 'swap' ? (
          <main className={'main' + (chart ? ' with-chart' : '') + (chart && a.chart === 'full' ? ' chart-full' : '')}>
            {chart && <ChartPanel />}
            {!(chart && a.chart === 'full') && <SwapPanel />}
          </main>
        ) : (
          a.isMobile ? (
            <LandingMobile />
          ) : (
            <LandingDesktop />
          )
        )}
      </div>
      {compactNav && <BottomNav />}
      <Modals />
      {/* every notification lands top-right, under the header */}
      <Toasts list={a.toasts} />
      {a.view === 'swap' && <HelpFab />}
      <ProtoControls />
      <IconTips />
    </>
  )
}

export default function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  )
}
