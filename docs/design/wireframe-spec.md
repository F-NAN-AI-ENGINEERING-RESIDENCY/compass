# Compass Platform — Wireframe UI Specification

Current flow only (16 screens) · sign in → onboarding → student app → live class → teacher workspace

**Update:** following stakeholder feedback from Alexa (education professional, sat in on the proposal), a "Proposed Additions" section has been added at the end of this doc covering 4 features not yet present in the wireframe. Screens that would be touched by those additions are cross-referenced inline below.

**Design system (from the board's own footer notes):**
- Typefaces: Bricolage Grotesque (display/headlines), Albert Sans (UI/body), Spline Sans Mono (data/mono contexts)
- Confidence color ramp: forest → olive → ochre → clay — clay is the top of the ramp; red is deliberately never used
- Recurring structure: dark forest-green panel/hero paired with a cream/off-white content panel, rounded pill buttons throughout, rounded-corner cards

---

## 01 · Sign in (4a)
*One door for both roles; new accounts branch at role select*

**Layout:** two-panel split screen — dark forest-green left panel (~45% width), cream right panel (~55% width) containing the form.

**Left panel:**
- Icon: Compass logomark (circular ring with center dot) — top-left
- Label: "Compass" — wordmark next to logomark
- Headline (large, white, two lines): "Class, without the guessing."
- Body text (muted white): "Students say "slow down" without raising a hand. Teachers see where the whole room is — never who."
- Pill tag / badge: "Anonymous "I'm lost" signals"
- Pill tag / badge: "Daily recall with Scout"
- Pill tag / badge: "A calm corner for wellbeing"
- Decorative: large faint concentric circles, background texture only

**Right panel (form):**
- Headline: "Welcome back."
- Subtext: "Sign in with your school account."
- Label: "School email"
- Text input, placeholder/filled value: "maya.r@jeffersonms.org"
- Label: "Password"
- Password input, masked dots, filled state
- Inline link/button inside password field: "Show"
- Checkbox (checked state): "Keep me signed in"
- Link, right-aligned: "Forgot password?"
- Primary button (full-width, dark green, pill): "Sign in →"
- Divider with label: "OR"
- Secondary button (full-width, outlined, pill): "Continue with school SSO"
- Body text with embedded link: "New to Compass? **Create an account** — you'll pick student or teacher first."
- Body text with embedded link: "Have a class code from your teacher? **Join as a student**"

---

## 02 · Role select (1a)
*The fork before anything else*

**Layout:** centered single column on cream background, two side-by-side cards below the headline.
- Icon: Compass logomark — top-left, paired with "Compass" wordmark
- Headline (large, centered): "Find your bearings."
- Subtext (centered, muted): "One calm place to see how class is really going — and to say "slow down" without raising your hand."

**Card 1 — light/sage background:**
- Icon row: 3 small shapes in a line — green circle, ochre diamond, clay square (the confidence-ramp motif in miniature)
- Card title: "I'm a student"
- Card body: "See your confidence topic by topic, practice with Scout the AI tutor, and signal when class moves too fast — always anonymously."
- Button (pill, solid dark green): "Continue as a student →"

**Card 2 — dark forest-green background:**
- Icon row: 3 small shapes, smaller/muted scale — olive rectangle, ochre bar, white square
- Card title (white): "I'm a teacher"
- Card body (muted white): "Watch understanding live, spot the exact moment a lesson lost the room, and know what's worth revisiting tomorrow."
- Button (pill, solid white/cream): "Continue as a teacher →"

**Below cards:**
- Text with link: "Joining from a class invite? **Enter your code**"

---

## 03 · Badge builder (2d)
*Sticker-bench: big live patch preview, chunky pickers*

**Layout:** top nav bar (Compass logo + user avatar), centered builder module below.
- Top nav: Compass logomark + wordmark, left
- Top nav: circular avatar badge, initials "BA", right
- Headline: "Make it yours."
- Large circular badge/patch preview — center stage, live-updating preview of the shape+color combination currently selected
- Section label: shape picker — row of chunky, large-tap-target geometric shape swatches (circle, diamond, square, hexagon-style options), one shown selected/active
- Section label: color picker — row of chunky color swatches following the forest/olive/ochre/clay ramp
- Primary button (pill): "Build your badge"
- Supporting micro-copy near the picker, small/muted (ellipsis-style placeholder present in source: "…")

---

## 04 · Dashboard (2a)
*Forest hero with one clear next move, subject color-block tiles*

**Layout:** dark forest-green hero header block at top, cream content area below with a tile grid.

**Hero block (dark green):**
- Top nav: Compass logomark, left; avatar "BA", right
- Greeting headline: "Morning, Magn" (truncated name — likely "Magnus"/similar)
- Status line: "Mostly on track. One topic needs a rescue."
- Primary CTA button (pill, light on dark): one clear "next move" action button

**Content area (cream):**
- Section label: subject/topic tiles, color-blocked by the confidence ramp
- Tile 1: subject name + confidence metric "68" + color block (lower on ramp — olive-toned)
- Tile 2: subject name + confidence metric "72" + color block (mid ramp)
- Tile 3: subject name + confidence metric "88" + color block (top of ramp, clay-toned)
- Each tile: tap target for drilling into topic-level detail (implied by card affordance/chevron)

---

## 05 · Scout, the AI tutor — chat-first (2b)
*Chat-first stage on deep forest; recall queue as chips, zero test energy*

**Layout:** full dark forest-green background (not just a header band — deliberately different from Dashboard's hero-only treatment), chat surface as the primary content.
- Top nav: Compass logomark, left; avatar, right
- Screen label/eyebrow: "Scout" identity marker (avatar or wordmark for the AI tutor persona)
- Chat message bubble(s): conversational, ungraded tone — assistant-style message bubble(s) on the dark background
- Text input field at bottom: message composer for replying to Scout
- Send button/icon adjacent to composer
- Recall queue: horizontal row of chip/pill elements representing spaced-recall topics queued for today — chip styling (not card styling) to keep it feeling light, "zero test energy"
- Loading/typing indicator (ellipsis "…" present in source strings) — likely Scout's typing/thinking state

**Extension point →** see Proposed Addition #2: Scout would need a "Socratic mode" (question-first, no direct answers) triggered from a replay signal, distinct from its current daily-recall mode.

---

## 06 · Wellbeing (2c)
*Dusk gradient, one big breath at the center, journal + wins float below*

**Layout:** full-bleed dusk-toned gradient background (distinct palette from forest — softer, warmer, sand/dusk tones), centered focal element, floating cards below.
- Top nav: Compass logomark, left; avatar, right
- Central focal element: large circular "breathing" element (orb/ring), the single visual anchor of the page
- CTA near/under the breathing element: "Take a minute."
- Status/system line: "Off the clock." (signals this is an idle/no-pressure state, distinct from academic screens)
- Floating card 1: journal entry module — prompt or freeform text entry
- Floating card 2: "wins" module — small wins/highlights log, likely list-style with short entries

---

## 07 · Settings (student) (2e)
*Same bones, warmer blocks to match*

**Layout:** reuses the Dashboard's structural skeleton (hero band + content list) but re-themed with warmer accent blocks instead of the dashboard's confidence-ramp tiles.
- Top nav: Compass logomark, left; avatar "BA", right
- Header band: page title ("Settings")
- List of settings rows/sections (warmer-toned blocks, not confidence-colored — deliberately distinguished from academic data):
  - Account section (profile info, email)
  - Classes section (enrolled classes list)
  - Notifications section (toggle-style controls)
- Each row: label + trailing control (chevron, toggle, or value) implied by the "blocks" description

---

## 08 · Student pre-join (3d)
*Camera check + anonymity reminder before entering*

**Layout:** compact centered card/modal-style layout (smaller canvas than full-page screens — consistent with a pre-call check modal), dark surface for the camera preview.
- Top nav: Compass logomark, minimal chrome (modal-like context)
- Camera preview panel: self-view video tile placeholder, dark background
- Camera on/off toggle control (icon button) on the preview panel
- Microphone on/off toggle control (icon button) on the preview panel
- Reminder text/banner: anonymity reassurance copy (reinforcing that in-call signals stay anonymous)
- Primary button (pill): join/continue into the class call
- Secondary/back link or button

---

## 09 · Student in-call (3b)
*"I'm lost" lives in the control bar; states below*

**Layout:** full video-call surface — teacher/content share view as main stage, control bar docked at the bottom, plus a set of secondary panels showing the control's different states.
- Main stage: shared content/video tile area
- Control bar (bottom, docked): standard call controls (mic, camera, leave) — icon buttons
- Control bar: dedicated "I'm lost" control — same row as the standard controls (not buried in a menu)
- State variant 1: "I'm lost" control — default/idle state
- State variant 2: "I'm lost" control — active/pressed state (signal being sent)
- State variant 3: "I'm lost" control — sent/confirmed state (acknowledgment shown to the student)
- These states appear to be laid out as small side-by-side variant frames beneath or beside the main call view, per the "states below" note

**Extension point →** see Proposed Addition #1: an anonymous "message teacher" control would likely sit in this same control bar, next to "I'm lost."

---

## 10 · Teacher sessions hub (3c)
*Schedule, start, and everything auto-attaches to recordings*

**Layout:** standard app shell — top nav, page header, list/table of sessions as the main content.
- Top nav: Compass logomark, left; avatar, right
- Page header: title (e.g. "Sessions") + primary button: "Schedule" (pill, likely with a plus/calendar icon)
- Session list, row-based, each row showing:
  - Class/session name
  - Date/time
  - Status indicator (upcoming / in progress / ended)
  - Action button: "Start" (for upcoming/current sessions)
  - Linked-recording indicator/icon (showing that a recording auto-attaches once the session ends)
- Empty/idle state text possible: "Off the clock." may recur here as the no-session-active state

---

## 11 · Teacher in-call (3a)
*Sharing slides with the class pulse docked live (same data as 1j)*

**Layout:** presenter view — slide-share surface as main stage, a docked live "pulse" widget anchored to one side (same underlying data feed as the Teacher live dashboard, screen 12).
- Main stage: slide/content share preview
- Standard call control bar (bottom): mic, camera, leave, share-screen toggle
- Docked pulse widget (side panel, persistent while presenting):
  - Mini confusion/understanding indicator (compact version of the timeline from screen 12)
  - Calm-alert style indicator (visual, non-alarming per the "never red" ramp rule)
  - Count or summary metric of current signals
- This widget is explicitly a live-updating docked element, not a modal — teacher keeps presenting while watching it

---

## 12 · Teacher live dashboard (1j)
*Confusion timeline, calm alert, anonymized feed*

**Layout:** data-dashboard page — header, a timeline/chart module, an alert banner, and an anonymized activity feed list.
- Top nav: Compass logomark, left; avatar, right
- Page header: title (e.g. "Live class" / class name)
- Confusion timeline module: line/area chart plotting understanding or "lost" signals over the session's time axis
- Calm alert banner: status message styled deliberately non-alarming (ramp colors, not red) — likely reads something like the "Mostly on track" family of status copy
- Anonymized feed list — rows of signal events, each row de-identified (no names), showing:
  - Avatar placeholder — generic initials badge, e.g. "BA" (anonymized, not tied to the real roster)
  - Topic/content reference tag, e.g. "Algeler-Pernod 3" or "Example 2-substitution" style placeholder labels standing in for real lesson/topic names
  - Timestamp
  - Signal type indicator (e.g. "lost" flag)
- Repeated placeholder rows visible (a second "Example 2-substitution" entry, a second "BA" avatar) indicating a multi-row feed list, not a single event

**Extension point →** see Proposed Addition #4: the existing "Wobbly topics — this week" card is a single-class version of the cross-class summary Alexa suggested. Also see Proposed Addition #1: an anonymous message inbox would likely attach near this dashboard, in teacher nav.

---

## 13 · Class management (1k)
*CRUD + roster; roster never linked to signals*

**Layout:** standard app shell — page header with primary action, roster table as main content.
- Top nav: Compass logomark, left; avatar, right
- Page header: title (e.g. "Classes") + primary button: "Create class" / add icon (the "C" of CRUD)
- Class list/table, each row:
  - Class name
  - Edit action (icon button — the "U" of CRUD)
  - Delete action (icon button — the "D" of CRUD)
- Roster sub-view/table, each row:
  - Avatar with initials, e.g. "BA"
  - Student name field
  - Enrollment status or remove action
- Explicit design note reflected in structure: the roster table is visually/architecturally separate from any signal or confidence data — no column ties a named student to "I'm lost" or confidence metrics

**Note →** see Proposed Addition #2: this "never linked" principle is exactly what's in tension with Alexa's suggestion that teachers see who signals during replay. Read that section before wireframing any change here.

---

## 14 · Learning materials (1l)
*Upload, organize by unit, link to lessons*

**Layout:** file-manager style page — upload control, unit-based grouping, file rows with lesson links.
- Top nav: Compass logomark, left; avatar, right
- Page header: title (e.g. "Materials") + primary button: "Upload" (likely with an upload icon)
- Unit group headers (collapsible sections), each containing:
  - File rows — file name, e.g. "Materiale" (placeholder label), file-type icon, file size/date
  - Link-to-lesson control per file (icon or text link) connecting a material to a specific lesson
- Organize/reorder affordance implied by "organize by unit" (drag handle or move control likely present per row)

---

## 15 · Recordings & transcripts (1m)
*Jump straight to the confusion spikes*

**Layout:** list + detail pattern — recordings list, each linking into a transcript view annotated with spike markers.
- Top nav: Compass logomark, left; avatar, right
- Page header: title (e.g. "Recordings")
- Recording list, each row:
  - Session/class name
  - Date
  - Duration
  - Thumbnail/play icon
- Transcript/detail view (same screen or linked panel):
  - Scrubber/timeline bar with spike markers layered on top, marking moments of high "lost" signal density
  - "Jump to spike" control(s) — buttons/markers that seek playback directly to a flagged moment
  - Transcript text panel, timestamped

**Extension point →** see Proposed Addition #2: a student-facing signal control on this scrubber (distinct from the teacher-facing spike markers already here) is the core of that feature.

---

## 16 · Teacher settings (1n)
*Alert threshold is the key control*

**Layout:** settings-list page, structurally similar to student Settings (07) but teacher-specific, with one control emphasized as primary.
- Top nav: Compass logomark, left; avatar, right
- Page header: title ("Settings")
- Featured control (visually emphasized, "the key control"): alert threshold — likely a slider or stepper control setting how many/what proportion of "lost" signals trigger the calm alert
- Supporting settings rows:
  - Account section
  - Notification preferences (toggle-style controls)
  - Class defaults / other preferences

---

## Icons used across the flow
- Compass logomark (ring + center dot) — persistent brand mark, top-left on every screen
- Avatar/initials badge (e.g. "BA") — persistent user indicator, top-right on every screen
- Mic icon (on/off states) — pre-join and in-call screens
- Camera icon (on/off states) — pre-join and in-call screens
- Leave/end-call icon — in-call control bars
- Screen-share icon — teacher in-call
- Upload icon — learning materials
- Edit/pencil icon and delete/trash icon — class management (CRUD)
- Play/thumbnail icon — recordings list
- Small geometric shape set (circle, diamond, square/rectangle) — recurring motif representing the confidence ramp, used at reduced scale in role-select cards and badge builder

## Interaction cues observed
- Chevron/arrow (→) embedded directly in primary button labels ("Sign in →", "Continue as a student →", "Continue as a teacher →") rather than as a separate trailing icon
- Docked/persistent widget behavior on the teacher in-call screen (pulse widget stays visible while presenting, not a modal)
- Multi-state variant frames shown side-by-side for the "I'm lost" control (default → active → sent), documenting a tap-through sequence rather than a single static state
- Timeline scrubber with markers (recordings screen) as a seek/jump affordance
- Placeholder ellipses ("…") appearing near Scout's chat and the badge builder, likely indicating typing/loading states

---

## Proposed Additions — Stakeholder Feedback (Alexa)

Not yet wireframed. Captured here as requirements/placement notes so they can be designed into the next pass, kept clearly separate from the as-built inventory above.

### 1 · Anonymous student → teacher messaging
**What it is:** a free-form message channel from student to teacher, sender identity hidden — same trust model as the existing "I'm lost" signal.

**Where it likely lives:**
- Student side: a "Message teacher" control in the in-call control bar (screen 09), alongside "I'm lost" — same tap-target tier, not buried in a menu. Could also be reachable outside of live class from the Dashboard (screen 04).
- Teacher side: a new inbox — either its own item in teacher top nav (alongside Live / Classes / Materials / Recordings / Settings) or a panel added to the Sessions hub (screen 10) or Live dashboard (screen 12).
- Components needed: message composer (student), message list with unread state and an anonymized-sender treatment (teacher), unread-count badge on nav.

**Consistency note:** this reuses a pattern the product already has — screen 13 explicitly separates roster identity from signal data. The message inbox should follow the same rule: no name attached, same as a signal.

### 2 · Replay-triggered "lost" signal → Socratic Scout + identified teacher visibility
**What it is:** while rewatching a recording, a student can flag a moment they're stuck on. That triggers (a) a Socratic-mode Scout session — question-first, no direct answers, picking up at that timestamp — and (b) a notification to the teacher of which student got stuck and where. Not visible to other students.

**Where it likely lives:**
- Recordings & transcripts (screen 15): a student-facing signal control on the scrubber, distinct from the spike markers already there (those are teacher-facing, aggregated). Pressing it both drops a marker and opens Scout.
- Scout (screen 05): needs a second mode. Today's Scout inventory is daily spaced-recall, direct and conversational. A Socratic mode is a different interaction shape — it asks guiding questions back rather than answering — so this is closer to a new state of the chat interface than a copy tweak.
- Teacher side: a new entry type in the Live dashboard feed (screen 12) or Recordings screen (screen 15), separate from the anonymous live-class feed.

⚠️ **A decision** — this is the one part of Alexa's feedback that conflicts with an existing design principle, not just an addition to it. Anonymity isn't incidental to this product — it's the headline pitch. It's the first pill badge on the sign-in screen ("Anonymous 'I'm lost' signals") and screen 13 states outright that the roster is "never linked to signals." Making the teacher see exactly who signaled reverses that, at least in this one context.

To reconcile it: treat this as a different kind of action, not a broken promise. The live "I'm lost" signal is anonymous because it happens in front of the class — anonymity is what makes it safe to use in the moment. A replay signal happens alone, after the fact, and functions more like privately asking for help than flagging discomfort in front of peers. Under this framing, it's a new, separate, identified feature (closer to the messaging feature above) rather than a change to how the live signal behaves. This preserves the existing pitch untouched while adding what Alexa asked for.

Either way: the spec's existing rule that other students never see any signal — live or replay — stays intact regardless of which path is chosen.

### 3 · Educator terminology pass
**What it is:** aligning copy with vocabulary educators expect from an LMS, so it reads as a polished, familiar category rather than a novel consumer app.

Suggested mappings (for Alexa to validate — she's the domain expert here, not us):

| Current copy | Screen | Possible educator term |
|---|---|---|
| "Recall queue" / daily spaced recall | Scout (05) | "Formative assessment" / "formative check-in" |
| "Wobbly topics" | Teacher live dashboard (12) | "Areas needing intervention" |
| Confidence score (68 / 72 / 88) | Dashboard (04) | "Mastery level" |
| Unit grouping | Learning materials (14) | "Learning objectives" (tagged per unit) |
| Class / roster | Class management (13) | "Section" / "cohort" (common SIS terms) |

This is a copy-and-labeling pass, not a structural change — low risk to fold into the existing 16 screens directly once terms are confirmed.

### 4 · Cross-class teacher summary ("what to review")
**What it is:** a digest telling a teacher which sections, across all their classes, most need review — not just the single class currently shown.

**Where it likely lives:** the Live dashboard (screen 12) already has a single-class version of this — the "Wobbly topics — this week" card. This would either expand that into a cross-class view, or become its own summary/insights entry in teacher nav, pulling the same "jump to spike" mechanic already built in Recordings (screen 15) so a teacher can go straight from the digest into the exact recording moment.

**Open question for Alexa:** is a daily/weekly digest email (teacher settings, screen 16, already has a "Daily recap email" toggle) enough, or does she want this as a standing in-app view too?

---

*Note: this inventory covers the 16 screens marked as the current flow plus the 4 proposed (not-yet-wireframed) additions above. The board also contains 8 archived/superseded explorations (v1 student screens and a Zoom-extension concept) — flag it if those should be catalogued too.*
