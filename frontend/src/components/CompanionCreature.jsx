// The student's creature companion — a simple, flat, front-facing critter
// built from the color ramp so it's cheap to render at any size (a tiny
// dashboard avatar or a large builder preview) and easy to keep legible.
// Kept deliberately simple (primitive shapes, no fine illustration detail)
// so every creatureType x bodyColor x accessory combination still reads
// clearly at small sizes.
import { GROWTH_LEVELS } from '../lib/companionStorage.js'

const BODY_FILL = {
  forest: 'var(--color-forest)',
  olive: 'var(--color-olive)',
  ochre: 'var(--color-ochre)',
  clay: 'var(--color-clay)',
  cream: 'var(--color-cream)',
  'cream-dim': 'var(--color-cream-dim)',
}

// Body colors light enough that ink features (eyes/mouth) need a darker
// outline to stay visible — otherwise near-white-on-white disappears.
const LIGHT_COLORS = new Set(['cream', 'cream-dim'])

export function CompanionCreature({ creatureType = 'blob', bodyColor = 'olive', accessory = 'none', level = 1, size = 96 }) {
  const body = BODY_FILL[bodyColor] ?? BODY_FILL.olive
  const outline = LIGHT_COLORS.has(bodyColor) ? 'var(--color-ink-muted)' : 'none'
  const isHighGrowth = level >= GROWTH_LEVELS[GROWTH_LEVELS.length - 1].level

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" role="img" aria-label="Your companion">
      {/* a soft glow ring at the top growth level — the one purely decorative
          "you've arrived" flourish, no gradient, just a low-opacity ring */}
      {isHighGrowth && <circle cx="50" cy="52" r="46" fill="var(--color-ochre)" opacity="0.12" />}

      <CreatureBody type={creatureType} fill={body} stroke={outline} />
      <Face outline={outline} />
      <Accessory id={accessory} />
    </svg>
  )
}

function CreatureBody({ type, fill, stroke }) {
  const strokeProps = stroke !== 'none' ? { stroke, strokeWidth: 1.5 } : {}
  switch (type) {
    case 'fox':
      return (
        <>
          <path d="M28 32L20 14L38 26Z" fill={fill} {...strokeProps} />
          <path d="M72 32L80 14L62 26Z" fill={fill} {...strokeProps} />
          <ellipse cx="50" cy="58" rx="34" ry="30" fill={fill} {...strokeProps} />
          <path d="M50 78L40 68L60 68Z" fill={fill} {...strokeProps} />
        </>
      )
    case 'owl':
      return (
        <>
          <path d="M26 30C22 20 28 16 34 24Z" fill={fill} {...strokeProps} />
          <path d="M74 30C78 20 72 16 66 24Z" fill={fill} {...strokeProps} />
          <ellipse cx="50" cy="56" rx="32" ry="32" fill={fill} {...strokeProps} />
        </>
      )
    case 'dino':
      return (
        <>
          <ellipse cx="50" cy="60" rx="32" ry="28" fill={fill} {...strokeProps} />
          <path d="M38 30L42 18L48 30Z" fill={fill} {...strokeProps} />
          <path d="M48 27L52 14L58 27Z" fill={fill} {...strokeProps} />
          <path d="M58 30L62 18L68 30Z" fill={fill} {...strokeProps} />
          <path d="M16 66C10 70 8 78 14 82C14 74 18 70 22 68Z" fill={fill} {...strokeProps} />
        </>
      )
    case 'blob':
    default:
      return <ellipse cx="50" cy="58" rx="34" ry="30" fill={fill} {...strokeProps} />
  }
}

function Face({ outline }) {
  const eyeStroke = outline !== 'none' ? { stroke: outline, strokeWidth: 1 } : {}
  return (
    <>
      <circle cx="39" cy="54" r="4.5" fill="var(--color-ink)" {...eyeStroke} />
      <circle cx="61" cy="54" r="4.5" fill="var(--color-ink)" {...eyeStroke} />
      <path d="M42 66Q50 71 58 66" stroke="var(--color-ink)" strokeWidth="2" fill="none" strokeLinecap="round" />
    </>
  )
}

function Accessory({ id }) {
  switch (id) {
    case 'bow':
      return (
        <g transform="translate(50 22)">
          <path d="M0 0L-10 -6L-10 6Z" fill="var(--color-clay)" />
          <path d="M0 0L10 -6L10 6Z" fill="var(--color-clay)" />
          <circle cx="0" cy="0" r="3" fill="var(--color-ochre)" />
        </g>
      )
    case 'glasses':
      return (
        <g stroke="var(--color-ink)" strokeWidth="2" fill="none">
          <circle cx="39" cy="54" r="8" />
          <circle cx="61" cy="54" r="8" />
          <path d="M47 54H53" />
        </g>
      )
    case 'scarf':
      return <path d="M24 70Q50 84 76 70L76 78Q50 92 24 78Z" fill="var(--color-olive)" />
    case 'star':
      return (
        <path
          d="M50 66L53 73L61 73L54.5 78L57 86L50 81L43 86L45.5 78L39 73L47 73Z"
          fill="var(--color-ochre)"
        />
      )
    case 'none':
    default:
      return null
  }
}
