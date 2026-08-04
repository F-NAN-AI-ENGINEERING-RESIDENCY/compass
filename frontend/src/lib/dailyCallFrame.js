// Works around a real, confirmed Daily.co Prebuilt rendering bug: the
// call frame's own <iframe> box sizes correctly (its own top/bottom chrome —
// "N people in call", the mute/camera/share/record toolbar — spans the full
// container fine), but the actual video tiles inside it render in a thin
// horizontal strip with large black gaps above and below, as if Daily's
// internal layout measured a stale, much smaller height and never
// recalculated once our container reached its real final size.
//
// Daily's own blog documents the same underlying cause for a different embed
// style (a fixed aspect-ratio widget): a plain CSS height: 100% on the
// iframe isn't enough — their internal layout only recomputes when the
// iframe's pixel dimensions are explicitly (re-)written via JS, both right
// after the call is joined and whenever the container resizes. This
// generalizes that same fix to a container that fills available space
// (ours), instead of holding a fixed aspect ratio (theirs): measure the
// real container box and write it onto the iframe as pixels, on an interval
// driven by ResizeObserver so it stays correct as the container resizes
// (window resize, the chat panel opening/closing, etc).
//
// See: https://www.daily.co/blog/responsive-aspect-ratio-daily-prebuilt/
export function keepDailyFrameSized(container) {
  function resize() {
    const iframe = container.querySelector('iframe')
    if (!iframe) return
    const { width, height } = container.getBoundingClientRect()
    if (width === 0 || height === 0) return // not laid out yet — nothing useful to measure
    iframe.style.width = `${width}px`
    iframe.style.height = `${height}px`
  }

  // ResizeObserver fires once immediately on observe() (even with no size
  // change yet), which covers the "right after join" case — the frame
  // already exists in the DOM by the time this is called (createFrame
  // inserts it synchronously), and every later resize re-fires this too.
  const observer = new ResizeObserver(resize)
  observer.observe(container)

  return () => observer.disconnect()
}
