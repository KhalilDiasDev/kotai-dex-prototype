import { useApp, type Scenario } from '../store'
import { Icon } from './ui'

const SCENARIOS: [Scenario, string][] = [
  ['none', 'Normal flow'],
  ['wrongNetwork', 'Prepare · wrong network in wallet'],
  ['noRoute', 'Prepare · no route available'],
  ['offline', 'Prepare · no network connection'],
  ['highImpact', 'Review · high price impact'],
  ['priceUpdated', 'Review · price updated'],
  ['accountChanged', 'Review · account or network changed'],
  ['rejected', 'Signature · rejected in wallet'],
  ['slow', 'Result · transaction taking longer'],
  ['failed', 'Result · swap not completed'],
]

export function ProtoControls() {
  const a = useApp()
  return (
    <div className={'proto' + (a.modal ? ' under-modal' : '')}>
      {a.showControls && (
        <div className="proto-panel">
          <h4>Prototype scenarios</h4>
          {SCENARIOS.map(([k, l]) => (
            <button key={k} className={'opt' + (a.scenario === k ? ' on' : '')} onClick={() => a.setScenario(k)}>
              {l}
            </button>
          ))}
          <h4>Shortcuts</h4>
          <button className="opt" onClick={() => a.set({ view: 'swap', amount: '1.5', connected: true, wasConnected: true, scenario: 'none', modal: null })}>
            Prepare · insufficient balance (1.5 ETH)
          </button>
          <button className="opt" onClick={() => a.set({ view: 'swap', amount: '1', connected: true, wasConnected: true, scenario: 'none', modal: null })}>
            Prepare · not enough ETH for fees (1 ETH)
          </button>
          <button className="opt" onClick={() => a.set({ view: 'swap', connected: false, wasConnected: true, amount: '0.5', scenario: 'none', modal: null })}>
            Prepare · wallet disconnected (amounts kept)
          </button>
          <button className="opt" onClick={() => a.set({ connected: false, wasConnected: false, amount: '', scenario: 'none', modal: null })}>
            Reset · disconnected
          </button>
          <button className="opt" onClick={() => a.set({ view: 'home', modal: null })}>
            Go to landing
          </button>
        </div>
      )}
      <button className="proto-toggle" onClick={() => a.set({ showControls: !a.showControls })}>
        <Icon n="sliders" size={16} /> Prototype
      </button>
    </div>
  )
}
