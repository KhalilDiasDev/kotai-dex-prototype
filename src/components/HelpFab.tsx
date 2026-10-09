import { useEffect, useRef, useState } from 'react'
import { useApp } from '../store'
import { Icon } from './ui'

/* Swap screen · "?" in the bottom-left corner: Get help, Docs, Contact us */
const LINKS: [string, string, string][] = [
  ['cap', 'Get help', 'Opens the help center in the real product'],
  ['book', 'Docs', 'Opens the documentation in the real product'],
  ['chat', 'Contact us', 'Opens support chat in the real product'],
]

export function HelpFab() {
  const a = useApp()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const down = (e: PointerEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false)
    const key = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('pointerdown', down)
    window.addEventListener('keydown', key)
    return () => {
      document.removeEventListener('pointerdown', down)
      window.removeEventListener('keydown', key)
    }
  }, [open])
  return (
    <div className={'help-fab' + (a.modal ? ' under-modal' : '')} ref={ref}>
      {open && (
        <div className="help-pop" role="dialog" aria-label="Help">
          <div className="help-head">
            <span>Help</span>
            <button data-notip onClick={() => setOpen(false)} aria-label="Close help">
              <Icon n="x" size={16} sw={2} />
            </button>
          </div>
          {LINKS.map(([icon, label, body]) => (
            <button
              key={label}
              className="help-item"
              onClick={() => {
                setOpen(false)
                a.toast({ tone: 'info', title: label, body })
              }}
            >
              <Icon n={icon} size={18} />
              <span>{label}</span>
              <Icon n="ext" size={13} className="ext" />
            </button>
          ))}
        </div>
      )}
      <button className={'help-btn' + (open ? ' on' : '')} onClick={() => setOpen((v) => !v)} aria-label="Help" aria-expanded={open} data-notip>
        ?
      </button>
    </div>
  )
}
