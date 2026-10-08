import { useApp, type Scenario } from '../store'
import { Icon } from './ui'

const SCENARIOS: [Scenario, string][] = [
  ['none', 'Fluxo normal'],
  ['wrongNetwork', 'Preparar · carteira na rede errada'],
  ['noRoute', 'Preparar · sem rota disponível'],
  ['offline', 'Preparar · sem conexão de internet'],
  ['highImpact', 'Revisão · impacto de preço alto'],
  ['priceUpdated', 'Revisão · preço atualizado'],
  ['accountChanged', 'Revisão · conta ou rede alterada'],
  ['rejected', 'Assinatura · recusada na carteira'],
  ['slow', 'Resultado · transação demorando'],
  ['failed', 'Resultado · troca não concluída'],
]

export function ProtoControls() {
  const a = useApp()
  return (
    <div className={'proto' + (a.modal ? ' under-modal' : '')}>
      {a.showControls && (
        <div className="proto-panel">
          <h4>Cenários do protótipo</h4>
          {SCENARIOS.map(([k, l]) => (
            <button key={k} className={'opt' + (a.scenario === k ? ' on' : '')} onClick={() => a.setScenario(k)}>
              {l}
            </button>
          ))}
          <h4>Atalhos</h4>
          <button className="opt" onClick={() => a.set({ view: 'swap', from: 'BNB', to: 'KTI', networkId: 'bnb', amount: '4.5', connected: true, wasConnected: true, scenario: 'none', modal: null })}>
            Preparar · saldo insuficiente (4,5 BNB)
          </button>
          <button className="opt" onClick={() => a.set({ view: 'swap', from: 'BNB', to: 'KTI', networkId: 'bnb', amount: '3', connected: true, wasConnected: true, scenario: 'none', modal: null })}>
            Preparar · BNB insuficiente para taxas (3 BNB)
          </button>
          <button className="opt" onClick={() => a.set({ view: 'swap', connected: false, wasConnected: true, amount: '0.5', scenario: 'none', modal: null })}>
            Preparar · carteira desconectada (valores mantidos)
          </button>
          <button className="opt" onClick={() => a.set({ connected: false, wasConnected: false, amount: '', scenario: 'none', modal: null })}>
            Reiniciar · desconectado
          </button>
          <button className="opt" onClick={() => a.set({ view: 'home', modal: null })}>
            Ir para a Home
          </button>
        </div>
      )}
      <button className="proto-toggle" onClick={() => a.set({ showControls: !a.showControls })}>
        <Icon n="sliders" size={16} /> Protótipo
      </button>
    </div>
  )
}
