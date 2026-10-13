import { useEffect, useRef } from 'react'
import { useApp, type Scenario } from '../store'
import { Icon } from './ui'

/* Use cases shown for the presentation: only the swap flow from the Figma proposal ("Proposta · Swap simples").
   The other cases are kept commented out below so they can be switched back on. */
const GROUPS: { title: string; items: [Scenario, string][] }[] = [
  { title: 'Fluxo principal', items: [['none', 'Troca normal, do início ao fim']] },
  {
    title: 'Avisos do swap',
    items: [
      ['priceUpdated', 'O preço mudou'],
      ['highImpact', 'Valor alto demais'],
      ['rejected', 'Cancelou na carteira'],
      // ['noFunds', 'Carteira sem fundos'],
      // ['wrongNetwork', 'Carteira na rede errada'],
      // ['noRoute', 'Sem rota disponível'],
      // ['offline', 'Sem conexão de internet'],
      // ['accountChanged', 'Conta ou rede alterada'],
      // ['slow', 'Transação demorando'],
      // ['failed', 'Troca não concluída'],
    ],
  },
]

export function ProtoControls() {
  const a = useApp()
  const ref = useRef<HTMLDivElement>(null)
  const open = a.showControls
  const close = () => a.set({ showControls: false })

  // clicking anywhere outside (or pressing Esc) closes the panel
  useEffect(() => {
    if (!open) return
    const down = (e: PointerEvent) => ref.current && !ref.current.contains(e.target as Node) && close()
    const key = (e: KeyboardEvent) => e.key === 'Escape' && close()
    document.addEventListener('pointerdown', down)
    window.addEventListener('keydown', key)
    return () => {
      document.removeEventListener('pointerdown', down)
      window.removeEventListener('keydown', key)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const active = a.scenario === 'none' ? null : GROUPS.flatMap((g) => g.items).find(([k]) => k === a.scenario)?.[1] ?? null

  const shortcut = (p: Parameters<typeof a.set>[0]) => {
    a.set({ ...p, showControls: false })
  }

  return (
    <div className={'proto' + (a.modal ? ' under-modal' : '')} ref={ref}>
      {open && (
        <div className="proto-panel" role="dialog" aria-label="Casos de uso">
          {GROUPS.map((g) => (
            <div key={g.title}>
              <h4>{g.title}</h4>
              {g.items.map(([k, l]) => (
                <button
                  key={k}
                  className={'opt' + (a.scenario === k ? ' on' : '')}
                  onClick={() => {
                    a.setScenario(k)
                    close()
                  }}
                >
                  {l}
                </button>
              ))}
            </div>
          ))}
          <div>
            <h4>Atalhos</h4>
            <button className="opt" onClick={() => shortcut({ view: 'swap', from: 'BNB', to: 'KTI', networkId: 'bnb', amount: '3', connected: true, wasConnected: true, scenario: 'none', modal: null })}>
              Falta BNB para a taxa (3 BNB)
            </button>
            {/* other shortcuts, kept for later:
            <button className="opt" onClick={() => shortcut({ view: 'swap', from: 'BNB', to: 'KTI', networkId: 'bnb', amount: '4.5', connected: true, wasConnected: true, scenario: 'none', modal: null })}>
              Saldo insuficiente (4,5 BNB)
            </button>
            <button className="opt" onClick={() => shortcut({ view: 'swap', connected: false, wasConnected: true, amount: '0.5', scenario: 'none', modal: null })}>
              Carteira desconectada (valores mantidos)
            </button>
            <button className="opt" onClick={() => shortcut({ connected: false, wasConnected: false, amount: '', scenario: 'none', modal: null })}>
              Reiniciar · desconectado
            </button>
            <button className="opt" onClick={() => shortcut({ view: 'home', modal: null })}>
              Ir para a Home
            </button>
            */}
          </div>
        </div>
      )}
      {/* the button remembers which use case is running and says so */}
      <button className={'proto-toggle' + (open ? ' on' : '') + (active ? ' has-case' : '')} onClick={() => a.set({ showControls: !open })} aria-expanded={open}>
        <Icon n="sliders" size={16} />
        <span className="pt-label">Casos de uso</span>
        {active && (
          <span className="pt-active">
            <i /> {active}
          </span>
        )}
      </button>
    </div>
  )
}
