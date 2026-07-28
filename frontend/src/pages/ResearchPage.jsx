import { AlertTriangle, Eye, ShieldOff, TrendingDown } from 'lucide-react'
import { MarketingNav } from '../components/MarketingNav.jsx'
import { MarketingClosingCta } from '../components/MarketingClosingCta.jsx'

// Public "/research" page — the findings behind the proposal's "problem" and
// "position" sections, presented as the evidence that shaped Compass's
// design decisions. Same "own nav" pattern as LandingPage/AboutPage.
export function ResearchPage() {
  return (
    <div style={{ background: 'var(--color-cream)' }}>
      <MarketingNav />
      <Intro />
      <Findings />
      <MarketingClosingCta />
    </div>
  )
}

function Intro() {
  return (
    <section style={{ maxWidth: '700px', margin: '0 auto', padding: '4rem 32px 1rem', textAlign: 'center' }}>
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
        Research
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
        What shaped Compass.
      </h1>

      <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--color-ink-muted)', lineHeight: 1.6 }}>
        Three findings shaped what we built. One risk shaped what we deliberately left out.
      </p>
    </section>
  )
}

function Findings() {
  const findings = [
    {
      icon: Eye,
      title: "Teachers can't reliably read a struggling student through a screen",
      body: "National surveys on remote instruction found that more than half of teachers couldn't reliably tell whether students were learning or needed help. The everyday cues teachers rely on in person — body language, hesitation, who's avoiding eye contact — mostly disappear online.",
      response: 'Compass response: a one-tap, private signal students can send the moment they get lost — no cue-reading required.',
    },
    {
      icon: TrendingDown,
      title: 'The students who lose the most are already underserved',
      body: 'Low-income students, students with disabilities, English language learners, and students in under-resourced schools are simultaneously more likely to be placed in remote-heavy instruction, and more likely to fall further behind once they are.',
      response: "Compass response: content that adapts to a student's actual skill level, not the class average — so the gap doesn't compound.",
    },
    {
      icon: AlertTriangle,
      title: "The data already exists — it's a matter of using it",
      body: 'Virtual learning already generates behavioral data — logins, time on task, where a student gets stuck. Research on learning-analytics systems shows this kind of data can flag at-risk students earlier than unaided teacher judgment alone. The gap is turning that signal into a fast, fair response.',
      response: 'Compass response: a real-time dashboard that surfaces who needs help now, not after the quiz score.',
    },
    {
      icon: ShieldOff,
      title: 'Existing detection tools carry a documented risk',
      body: 'Some existing systems flag students by demographic pattern rather than genuine, individual need — a well-documented failure mode we designed Compass to explicitly avoid.',
      response: "Compass response: signals come from what an individual student actually does — never from group demographics.",
    },
  ]

  return (
    <section
      style={{
        maxWidth: '900px',
        margin: '0 auto',
        padding: '2rem 32px 4.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
      }}
    >
      {findings.map(({ icon: Icon, title, body, response }) => (
        <div key={title} className="card" style={{ display: 'flex', gap: '1rem' }}>
          <span
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'var(--color-cream)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Icon size={17} color="var(--color-forest)" aria-hidden="true" />
          </span>
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '17px', color: 'var(--color-forest)', margin: '0 0 0.5rem' }}>
              {title}
            </h2>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-ink)', lineHeight: 1.65, margin: '0 0 0.6rem' }}>
              {body}
            </p>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-olive)', fontWeight: 600, margin: 0 }}>
              {response}
            </p>
          </div>
        </div>
      ))}
    </section>
  )
}
