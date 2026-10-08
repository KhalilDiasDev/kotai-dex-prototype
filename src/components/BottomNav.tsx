import { useApp } from '../store'
import { Coin, Icon } from './ui'

/* Mobile · bottom navigation: Home, Swap, KTI Coin and a Menu that opens the remaining options in a list above it */
export function BottomNav() {
  const a = useApp()
  const go = (v: 'home' | 'swap') => {
    // tapping the current screen again scrolls it back to the top
    if (a.view === v && !a.modal) window.scrollTo({ top: 0, behavior: 'smooth' })
    else a.set({ view: v, modal: null, chart: 'off' })
  }
  const menuOpen = a.modal === 'navMenu'
  const ktiOn = a.modal === 'coin' && a.coinToken === 'KTI'
  const items = [
    { key: 'home', label: 'Home', icon: <Icon n="home" size={22} />, on: a.view === 'home' && !a.modal, act: () => go('home') },
    { key: 'swap', label: 'Swap', icon: <Icon n="flip" size={22} />, on: a.view === 'swap' && !a.modal, act: () => go('swap') },
    { key: 'kti', label: 'KTI Coin', icon: <span className="bn-coin"><Coin id="KTI" size={22} /></span>, on: ktiOn, act: () => a.openCoin('KTI') },
    { key: 'menu', label: 'Menu', icon: <Icon n={menuOpen ? 'x' : 'grid'} size={22} />, on: menuOpen, act: () => (menuOpen ? a.close() : a.open('navMenu')) },
  ]
  return (
    <nav className="bottom-nav" aria-label="Main">
      {items.map((it) => (
        <button key={it.key} className={'bn-item' + (it.on ? ' on' : '') + (it.key === 'kti' ? ' kti' : '')} onClick={it.act} aria-current={it.on ? 'page' : undefined}>
          <span className="bn-ic">{it.icon}</span>
          <span className="bn-lb">{it.label}</span>
        </button>
      ))}
    </nav>
  )
}

/* Mobile · while disconnected, "Connect wallet" floats in the bottom corner (under the prototype toggle);
   once connected it disappears and the header shows the wallet select as usual */
export function ConnectFab() {
  const a = useApp()
  if (a.connected || a.modal) return null
  return (
    <button className="connect-fab" onClick={() => a.open('connect')}>
      <Icon n="wallet" size={18} />
      Connect wallet
    </button>
  )
}
