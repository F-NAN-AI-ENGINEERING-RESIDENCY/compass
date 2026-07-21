import { Link } from 'react-router-dom'
import { ArrowRight, Hand, LayoutDashboard, Sparkles } from 'lucide-react'
import { MarketingNav } from '../components/MarketingNav.jsx'
import { MarketingClosingCta } from '../components/MarketingClosingCta.jsx'
import { Reveal } from '../components/Reveal.jsx'

// Public marketing page at "/" — the first thing a signed-out visitor sees.
// Unlike the rest of the app it renders its own nav (not <Layout>'s signed-in
// nav) since a logged-out visitor has no dashboard/settings/etc. to link to.
export function LandingPage() {
  return (
    <div style={{ background: 'var(--color-cream)' }}>
      <MarketingNav />
      <Hero />
      <HowItWorks />
      <FeatureStrip />
      <Personas />
      <MarketingClosingCta />
    </div>
  )
}

// Two-column hero: pitch + CTAs on the left, a stylized dashboard preview on the right.
function Hero() {
  return (
    <section
      style={{
        display: 'grid',
        gridTemplateColumns: '1.05fr 1fr',
        gap: '3rem',
        alignItems: 'center',
        maxWidth: '1160px',
        margin: '0 auto',
        padding: '4rem 32px',
      }}
      className="hero-grid"
    >
      <div>
        {/* Eyebrow tag — entrance animations below are staggered by
            animationDelay so the hero reads top-to-bottom as it fades in. */}
        <span
          className="landing-fade-in"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            background: 'var(--color-cream-dim)',
            color: 'var(--color-forest)',
            borderRadius: 'var(--radius-pill)',
            padding: '0.4rem 0.85rem',
            fontSize: '11px',
            textTransform: 'uppercase',
            letterSpacing: '0.02em',
            fontWeight: 600,
          }}
        >
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: 'var(--color-ochre)',
              display: 'inline-block',
            }}
          />
          For middle & high school virtual and hybrid classrooms
        </span>

        <h1
          className="landing-fade-in"
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: '46px',
            lineHeight: 1.02,
            color: 'var(--color-forest)',
            margin: '1.25rem 0 1rem',
            animationDelay: '0.08s',
          }}
        >
          Every student,
          <br />
          seen.
        </h1>

        <p
          className="landing-fade-in"
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '15px',
            color: 'var(--color-ink-muted)',
            maxWidth: '400px',
            lineHeight: 1.5,
            animationDelay: '0.16s',
          }}
        >
          Compass gives students a private way to signal when they're lost — and gives teachers a
          real-time view of who needs help, before the lesson ends.
        </p>

        <div
          className="landing-fade-in"
          style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '1.75rem', animationDelay: '0.24s' }}
        >
          <Link to="/role-select" className="btn-pill btn-pill--primary" style={{ textDecoration: 'none' }}>
            Get started
          </Link>
          <Link to="/signup?role=teacher" className="btn-pill btn-pill--ghost" style={{ textDecoration: 'none' }}>
            For educators <ArrowRight size={16} aria-hidden="true" />
          </Link>
          <Link to="/signup?role=student" className="btn-pill btn-pill--ghost" style={{ textDecoration: 'none' }}>
            For students <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </div>

      <DashboardPreview />
    </section>
  )
}

// Right-hand hero visual: decorative concentric arcs behind a mini teacher-dashboard card.
function DashboardPreview() {
  const students = [
    { name: 'Felix', pct: 22, color: 'clay', signaled: true },
    { name: 'Naomi', pct: 78, color: 'olive', signaled: false },
    { name: 'Asia', pct: 56, color: 'ochre', signaled: false },
    { name: 'Noboni', pct: 38, color: 'ochre', signaled: true },
  ]

  return (
    <div
      className="landing-fade-in"
      style={{ position: 'relative', display: 'flex', justifyContent: 'center', animationDelay: '0.32s' }}
    >
      {/* Decorative background: 3 low-opacity dashed rings with cardinal dots.
          .landing-orbit gives it a very slow ambient rotation — see index.css. */}
      <svg
        className="landing-orbit"
        width="420"
        height="420"
        viewBox="0 0 420 420"
        style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
        aria-hidden="true"
      >
        <circle cx="210" cy="210" r="190" fill="none" stroke="var(--color-forest)" strokeOpacity="0.12" strokeDasharray="4 6" />
        <circle cx="210" cy="210" r="150" fill="none" stroke="var(--color-ochre)" strokeOpacity="0.15" strokeDasharray="4 6" />
        <circle cx="210" cy="210" r="110" fill="none" stroke="var(--color-olive)" strokeOpacity="0.15" strokeDasharray="4 6" />
        <circle cx="210" cy="20" r="4" fill="var(--color-ochre)" />
        <circle cx="400" cy="210" r="4" fill="var(--color-clay)" />
        <circle cx="210" cy="400" r="4" fill="var(--color-olive)" />
        <circle cx="20" cy="210" r="4" fill="var(--color-ochre)" />
      </svg>

      {/* Foreground: mini teacher dashboard card. .landing-dashboard-card
          adds a subtle hover lift — see index.css. */}
      <div
        className="landing-dashboard-card"
        style={{
          position: 'relative',
          background: 'var(--color-cream)',
          borderRadius: '14px',
          border: '1px solid rgba(31, 58, 46, 0.18)',
          padding: '1.25rem',
          width: '320px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--color-forest)' }}>
            Grade 7 Math
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '11px', color: 'var(--color-ink-muted)' }}>
            <span
              className="landing-live-dot"
              style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--color-clay)', display: 'inline-block' }}
            />
            Live
          </span>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid var(--color-cream-dim)', margin: '0.85rem 0' }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {students.map((s) => (
            <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              {/* Avatar */}
              <span
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: 'var(--color-cream-dim)',
                  color: 'var(--color-forest)',
                  fontSize: '11px',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {s.name[0]}
              </span>
              <span style={{ fontSize: '10.5px', color: 'var(--color-ink)', width: '38px', flexShrink: 0 }}>
                {s.name}
              </span>
              {/* Mastery bar */}
              <span
                style={{
                  width: '44px',
                  height: '5px',
                  borderRadius: 'var(--radius-pill)',
                  background: 'var(--color-cream-dim)',
                  display: 'inline-block',
                  overflow: 'hidden',
                  flexShrink: 0,
                }}
              >
                <span
                  style={{
                    display: 'block',
                    width: `${s.pct}%`,
                    height: '100%',
                    background: `var(--color-${s.color})`,
                  }}
                />
              </span>
              {s.signaled && <Hand size={12} color="var(--color-clay)" aria-hidden="true" style={{ marginLeft: 'auto' }} />}
            </div>
          ))}
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid var(--color-cream-dim)', margin: '0.85rem 0' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '12px', color: 'var(--color-forest)' }}>
            Signals: 2 active
          </span>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '12px', color: 'var(--color-forest)' }}>
            Class avg: 54%
          </span>
        </div>
      </div>
    </div>
  )
}

// Numbered 3-step sequence (cream-dim background) explaining the product
// flow, sitting between the hero and the benefit-focused feature strip.
function HowItWorks() {
  const steps = [
    {
      icon: Hand,
      title: 'Student signals',
      body: "One private tap flags confusion the moment it happens — no classmate sees it.",
    },
    {
      icon: LayoutDashboard,
      title: 'Teacher sees it, live',
      body: "The dashboard shows exactly who's stuck, in real time — not after the quiz score.",
    },
    {
      icon: Sparkles,
      title: 'AI tutor steps in',
      body: 'Scout guides the student with questions while the teacher decides how to help.',
    },
  ]

  return (
    <Reveal as="section" style={{ background: 'var(--color-cream-dim)', padding: '4rem 32px' }}>
      <div style={{ maxWidth: '1160px', margin: '0 auto' }}>
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: '28px',
            color: 'var(--color-forest)',
            textAlign: 'center',
            margin: '0 0 2.5rem',
          }}
        >
          How Compass works
        </h2>

        <div
          className="feature-grid"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem' }}
        >
          {steps.map(({ icon: Icon, title, body }, i) => (
            <div key={title} className="card landing-step-card" style={{ position: 'relative' }}>
              <span
                aria-hidden="true"
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 700,
                  fontSize: '13px',
                  color: 'var(--color-olive)',
                  letterSpacing: '0.02em',
                }}
              >
                STEP {i + 1}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', margin: '0.6rem 0 0.6rem' }}>
                <span
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: 'var(--color-cream)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Icon size={16} color="var(--color-forest)" aria-hidden="true" />
                </span>
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '16px', color: 'var(--color-forest)', margin: 0 }}>
                  {title}
                </h3>
              </div>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '13.5px', color: 'var(--color-ink-muted)', lineHeight: 1.55, margin: 0 }}>
                {body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </Reveal>
  )
}

// Bottom-of-page dark strip: three feature columns on a forest background.
function FeatureStrip() {
  const features = [
    {
      icon: Hand,
      title: "Private “I’m lost” signal",
      body: 'One tap tells the teacher — no classmate sees a thing.',
    },
    {
      icon: LayoutDashboard,
      title: 'Real-time dashboard',
      body: 'See who’s struggling now, not after the quiz score.',
    },
    {
      icon: Sparkles,
      title: 'AI tutor that guides',
      body: 'Guiding questions build understanding — never just answers.',
    },
  ]

  return (
    <Reveal
      as="section"
      style={{
        background: 'var(--color-forest)',
        padding: '3rem 32px',
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '2rem',
      }}
      className="feature-grid"
    >
      {features.map(({ icon: Icon, title, body }) => (
        <div key={title} className="landing-feature-col">
          <span
            className="landing-feature-icon"
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: 'rgba(245, 241, 230, 0.15)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '0.85rem',
            }}
          >
            <Icon size={15} color="var(--color-text-on-dark)" aria-hidden="true" />
          </span>
          <h3
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 600,
              fontSize: '15px',
              color: 'var(--color-text-on-dark)',
              margin: '0 0 0.4rem',
            }}
          >
            {title}
          </h3>
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '12.5px',
              color: 'var(--color-text-on-dark-muted)',
              margin: 0,
            }}
          >
            {body}
          </p>
        </div>
      ))}
    </Reveal>
  )
}

// Two persona cards — what Compass gives teachers vs. what it gives
// students, echoing the proposal's "impact" paragraph split by audience.
function Personas() {
  const personas = [
    {
      icon: LayoutDashboard,
      title: 'For teachers',
      body: 'A faster, more equitable way to see who needs help in real time — instead of relying on cues that mostly disappear on a screen.',
      to: '/signup?role=teacher',
      cta: 'For educators',
    },
    {
      icon: Hand,
      title: 'For students',
      body: 'More ownership over your own learning, and a private way to ask for help without fear of embarrassment in front of classmates.',
      to: '/signup?role=student',
      cta: 'For students',
    },
  ]

  return (
    <Reveal as="section" style={{ padding: '4.5rem 32px', maxWidth: '1160px', margin: '0 auto' }}>
      <h2
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          fontSize: '28px',
          color: 'var(--color-forest)',
          textAlign: 'center',
          margin: '0 0 2.5rem',
        }}
      >
        Built for every side of the classroom
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }} className="hero-grid">
        {personas.map(({ icon: Icon, title, body, to, cta }) => (
          <div
            key={title}
            className="card landing-persona-card"
            style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', background: 'var(--color-cream-dim)' }}
          >
            <span
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'var(--color-cream)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon size={17} color="var(--color-forest)" aria-hidden="true" />
            </span>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '18px', color: 'var(--color-forest)', margin: 0 }}>
              {title}
            </h3>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-ink-muted)', lineHeight: 1.6, margin: 0, flex: 1 }}>
              {body}
            </p>
            <Link to={to} className="btn-pill btn-pill--outline" style={{ textDecoration: 'none', alignSelf: 'flex-start' }}>
              {cta} <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>
        ))}
      </div>
    </Reveal>
  )
}
