import { useEffect, useState } from 'react'

/* ───────── entrance · each block rises in as it scrolls into view (siblings staggered) ───────── */
const REVEAL = [
  '.lp-statement > :not(.lp-glow)',
  '.lp-steps .lp-head',
  '.lp-trail',
  '.lp-step-grid > *',
  '.lp-step-cta',
  '.lp-feature > .lp-panel',
  '.lp-feature-txt > *',
  '.lp-bento .lp-head',
  '.lp-bento-row > *',
  '.lp-banner',
  '.lpm-grid > *',
  '.lpm-cards > *',
].join(',')

export function useReveal(root: React.RefObject<HTMLElement>) {
  useEffect(() => {
    const el = root.current
    if (!el) return
    const items = Array.from(el.querySelectorAll<HTMLElement>(REVEAL))
    if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) return
    items.forEach((n) => {
      const sibs = Array.from(n.parentElement!.children).filter((c) => c.matches(REVEAL))
      n.style.setProperty('--rd', `${Math.min(sibs.indexOf(n), 6) * 90}ms`)
      n.classList.add('reveal')
    })
    const io = new IntersectionObserver(
      (es) =>
        es.forEach((e) => {
          if (!e.isIntersecting) return
          e.target.classList.add('in')
          io.unobserve(e.target)
        }),
      { rootMargin: '0px 0px -8% 0px', threshold: 0.12 },
    )
    items.forEach((n) => io.observe(n))
    return () => io.disconnect()
  }, [root])
}

/* the entrance runs only the first time Home appears; coming back from Swap just cross-fades */
let introPlayed = false
export function useIntroOnce() {
  const [intro] = useState(() => !introPlayed)
  useEffect(() => {
    introPlayed = true
  }, [])
  return intro ? ' intro' : ''
}
