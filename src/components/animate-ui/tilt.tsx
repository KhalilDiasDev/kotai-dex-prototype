/* Animate UI · Tilt (primitives/effects/tilt) — https://animate-ui.com
   Ported without the Slot/asChild helpers; the rest is the registry source. */
import * as React from 'react'
import { motion, useMotionValue, useSpring, type MotionValue, type SpringOptions, type HTMLMotionProps } from 'motion/react'

type TiltContextType = {
  sRX: MotionValue<number>
  sRY: MotionValue<number>
  transition: SpringOptions
}

const TiltContext = React.createContext<TiltContextType | null>(null)
const useTilt = () => {
  const ctx = React.useContext(TiltContext)
  if (!ctx) throw new Error('TiltContent must be used inside <Tilt>')
  return ctx
}

type TiltProps = HTMLMotionProps<'div'> & {
  maxTilt?: number
  perspective?: number
  transition?: SpringOptions
}

function Tilt({
  maxTilt = 10,
  perspective = 800,
  style,
  transition = { stiffness: 300, damping: 25, mass: 0.5 },
  onMouseMove,
  onMouseLeave,
  ...props
}: TiltProps) {
  const rX = useMotionValue(0)
  const rY = useMotionValue(0)
  const sRX = useSpring(rX, transition)
  const sRY = useSpring(rY, transition)

  const handleMouseMove = React.useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      onMouseMove?.(e)
      const rect = e.currentTarget.getBoundingClientRect()
      const px = (e.clientX - rect.left) / rect.width
      const py = (e.clientY - rect.top) / rect.height
      rY.set((px * 2 - 1) * maxTilt)
      rX.set(-(py * 2 - 1) * maxTilt)
      // expose the pointer for the CSS spotlight
      e.currentTarget.style.setProperty('--mx', `${px * 100}%`)
      e.currentTarget.style.setProperty('--my', `${py * 100}%`)
    },
    [maxTilt, rX, rY, onMouseMove],
  )

  const handleMouseLeave = React.useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      onMouseLeave?.(e)
      rX.set(0)
      rY.set(0)
    },
    [rX, rY, onMouseLeave],
  )

  return (
    <TiltContext.Provider value={{ sRX, sRY, transition }}>
      <motion.div
        style={{ perspective, transformStyle: 'preserve-3d', willChange: 'transform', ...style }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        {...props}
      />
    </TiltContext.Provider>
  )
}

type TiltContentProps = HTMLMotionProps<'div'>

function TiltContent({ children, style, transition, ...props }: TiltContentProps) {
  const { sRX, sRY, transition: tiltTransition } = useTilt()
  return (
    <motion.div style={{ rotateX: sRX, rotateY: sRY, willChange: 'transform', ...style }} transition={transition ?? tiltTransition} {...props}>
      {children}
    </motion.div>
  )
}

export { Tilt, TiltContent, type TiltProps, type TiltContentProps }
