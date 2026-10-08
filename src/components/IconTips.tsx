import { useEffect, useState } from 'react'

/** Tooltip for every icon-only button: shows its aria-label after a short hover. */
type Tip = { text: string; x: number; y: number; below: boolean }

const iconOnly = (el: HTMLElement) =>
  !el.closest('[data-notip]') && !!el.getAttribute('aria-label') && !(el.textContent ?? '').trim()

export function IconTips() {
  const [tip, setTip] = useState<Tip | null>(null)

  useEffect(() => {
    let timer = 0
    let current: HTMLElement | null = null
    const hide = () => {
      clearTimeout(timer)
      current = null
      setTip(null)
    }
    const over = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return
      const el = (e.target as HTMLElement).closest<HTMLElement>('button, a, [role="button"]')
      if (el === current) return
      hide()
      if (!el || !iconOnly(el)) return
      current = el
      // our tooltip replaces the native one
      if (el.title) {
        el.dataset.title = el.title
        el.removeAttribute('title')
      }
      timer = window.setTimeout(() => {
        if (current !== el || !el.isConnected) return
        const r = el.getBoundingClientRect()
        const below = r.top < 72
        setTip({ text: el.getAttribute('aria-label')!, x: r.left + r.width / 2, y: below ? r.bottom + 8 : r.top - 8, below })
      }, 280)
    }
    document.addEventListener('pointerover', over)
    document.addEventListener('pointerdown', hide, true)
    window.addEventListener('scroll', hide, true)
    return () => {
      hide()
      document.removeEventListener('pointerover', over)
      document.removeEventListener('pointerdown', hide, true)
      window.removeEventListener('scroll', hide, true)
    }
  }, [])

  if (!tip) return null
  return (
    <div className={'icon-tip' + (tip.below ? ' below' : '')} role="tooltip" style={{ left: tip.x, top: tip.y }}>
      {tip.text}
    </div>
  )
}
