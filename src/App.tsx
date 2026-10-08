import { useEffect, useState } from 'react'
import { BottomNav } from './components/BottomNav'
import { ChartPanel } from './components/ChartPanel'
import { Header } from './components/Header'
import { IconTips } from './components/IconTips'
import { Landing } from './components/Landing'
import { Modals } from './components/Modals'
import { ProtoControls } from './components/ProtoControls'
import { SwapPanel } from './components/SwapPanel'
import { Icon } from './components/ui'
import { AppProvider, useApp, type Toast } from './store'

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
          <Landing />
        )}
      </div>
      {compactNav && <BottomNav />}
      <Modals />
      {/* every notification lands top-right, under the header */}
      <Toasts list={a.toasts} />
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
