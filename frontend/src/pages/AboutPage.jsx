import { Hand, Sparkles, Target } from 'lucide-react'
import { MarketingNav } from '../components/MarketingNav.jsx'
import { MarketingClosingCta } from '../components/MarketingClosingCta.jsx'

// Public "/about" page — the project's proposal (problem/position/impact)
// turned into web copy. Same "own nav" pattern as LandingPage: full-bleed,
// outside <Layout>, reachable signed out.
export function AboutPage() {
  return (
    <div style={{ background: 'var(--color-cream)' }}>
      <MarketingNav />
      <Intro />
      <WhatItDoes />
      <ProblemPositionImpact />
      <MarketingClosingCta />
    </div>
  )
}

// Eyebrow + headline + one-line mission, same shape as the landing hero.
function Intro() {
  return (
    <section style={{ maxWidth: '760px', margin: '0 auto', padding: '4rem 32px 1rem', textAlign: 'center' }}>
      <span
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
        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--color-ochre)', display: 'inline-block' }} />
        About Compass
      </span>

      <h1
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          fontSize: '38px',
          lineHeight: 1.1,
          color: 'var(--color-forest)',
          margin: '1.25rem 0 1rem',
        }}
      >
        Every student deserves to be seen — even through a screen.
      </h1>

      <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--color-ink-muted)', lineHeight: 1.6 }}>
        Compass is an AI-assisted support platform for middle and high school students in virtual
        and hybrid learning environments. It combines three things our research found are specifically missing from
        most virtual classrooms: a private, real-time way for students to signal confusion, content
        that adapts to each student's actual skill level, and an AI tutor built to guide students
        toward understanding rather than hand them answers.
      </p>
    </section>
  )
}

// Three cards spelling out the "three things" named in the intro paragraph.
function WhatItDoes() {
  const items = [
    { icon: Hand, title: 'A private signal', body: "Students flag confusion in real time — privately, with no classmate watching." },
    { icon: Target, title: 'Content that adapts', body: "Material meets each student at their actual skill level, not the class average." },
    { icon: Sparkles, title: 'A tutor that guides', body: 'An AI tutor built to ask guiding questions, not hand over answers.' },
  ]

  return (
    <section
      className="feature-grid"
      style={{
        maxWidth: '1160px',
        margin: '0 auto',
        padding: '2rem 32px 4rem',
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '1.5rem',
      }}
    >
      {items.map(({ icon: Icon, title, body }) => (
        <div key={title} className="card landing-feature-col" style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          <span
            className="landing-feature-icon"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'var(--color-cream)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon size={16} color="var(--color-forest)" aria-hidden="true" />
          </span>
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '16px', color: 'var(--color-forest)', margin: 0 }}>
            {title}
          </h3>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '13.5px', color: 'var(--color-ink-muted)', margin: 0, lineHeight: 1.5 }}>
            {body}
          </p>
        </div>
      ))}
    </section>
  )
}

// The proposal's problem/position/impact case, each with a colored accent
// bar echoing the confidence-ramp motif used elsewhere in the app.
function ProblemPositionImpact() {
  const sections = [
    {
      color: 'clay',
      title: 'The problem',
      body: "Today, virtual and hybrid classrooms ask teachers to do something they aren't well-equipped to do: notice a struggling student through a screen, using the same instincts that work in person. This shows up directly in national surveys — more than half of teachers said they couldn't reliably tell whether students were learning or needed help during remote instruction, because the everyday cues they rely on in person (body language, hesitation, who's avoiding the question) mostly disappear online. The students who lose the most from this gap are also the students most likely to already be underserved — low-income students, students with disabilities, English language learners, and students in under-resourced schools — because research shows these groups are simultaneously more likely to be placed in remote-heavy instruction and more likely to fall further behind once they are.",
    },
    {
      color: 'olive',
      title: 'Our position',
      body: "The data virtual learning already generates — logins, time on task, where a student gets stuck — is richer than what a teacher can observe by eye, and research on learning-analytics systems shows this kind of behavioral data can flag at-risk students earlier than unaided teacher judgment alone. The real bottleneck isn't whether the signal exists — it's that almost nothing turns that signal into a fast, fair response today. Any system we build has to close that specific gap, while explicitly avoiding a documented risk in existing detection tools: flagging students by demographic pattern rather than genuine need.",
    },
    {
      color: 'ochre',
      title: 'The impact',
      body: 'If successful, the platform gives teachers in virtual/hybrid classrooms a faster, more equitable way to identify and support struggling students in real time — while giving students more ownership over their own learning and a private way to ask for help without fear of embarrassment in front of classmates.',
    },
  ]

  return (
    <section style={{ maxWidth: '760px', margin: '0 auto', padding: '0 32px 4.5rem', display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      {sections.map(({ color, title, body }) => (
        <div key={title} style={{ display: 'flex', gap: '1rem' }}>
          <span
            aria-hidden="true"
            style={{ width: '4px', borderRadius: 'var(--radius-pill)', background: `var(--color-${color})`, flexShrink: 0 }}
          />
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '22px', color: 'var(--color-forest)', margin: '0 0 0.6rem' }}>
              {title}
            </h2>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '14.5px', color: 'var(--color-ink)', lineHeight: 1.7, margin: 0 }}>
              {body}
            </p>
          </div>
        </div>
      ))}
    </section>
  )
}
