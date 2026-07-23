import { useEffect, useRef, useState } from 'react'

// Wraps a section so it fades/slides into view the first time it scrolls
// into the viewport, instead of animating (invisibly) on page load like the
// hero does. One IntersectionObserver per instance, disconnected after it
// fires once — sections don't re-hide if you scroll back past them.
export function Reveal({ children, as: As = 'div', delay = 0, className = '', style }) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.15 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <As
      ref={ref}
      className={`reveal ${visible ? 'is-visible' : ''} ${className}`}
      style={{ transitionDelay: `${delay}s`, ...style }}
    >
      {children}
    </As>
  )
}
