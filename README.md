# Compass

An AI-assisted support platform for students in virtual and hybrid K-12 learning environments. Compass gives students a private, one-tap way to signal confusion during a live lesson, and gives teachers a real-time dashboard to see who needs help before the lesson ends instead of days later.

**Live demo:** https://compass-frontend-9scf.onrender.com (backend API: https://compass-api-mpft.onrender.com)

## This submission's scope

The full product spec below describes the whole platform as originally planned. This submission implements exactly two of its MVP user stories, per current team priority:

1. **Student — private "I'm lost" signal.** A student can send a one-tap, anonymous-to-classmates confusion signal during a live lesson; the teacher is notified immediately.
2. **Teacher — real-time dashboard.** A teacher can see, live, which students have signaled confusion for the active lesson.

The supporting setup flow (teacher creates a class and gets a join code, a student joins with it, a teacher creates a lesson and starts it) is built and working, since both stories above depend on it.

**Explicitly not in this submission** (all real, but intentionally deferred — see the "Future Exploration" and "Stretch Features" sections of the spec below):
- The AI tutor (MVP user story #4 in the original spec).
- Adaptive practice, post-session reflections, question clustering.
- **Skill-standing data on the dashboard.** The dashboard's `skillSnapshot` field is real and correctly shaped, but nothing currently writes a student's `mastery_level` — that only happens once adaptive practice exists. Until then, this section of the dashboard response is always an empty list, by design rather than by bug.

---

# Product Specification

## Part I — Project Proposal

### Project Description

Compass is an AI-assisted support platform for students in virtual and hybrid K-12 learning environments. It combines three things our research found are specifically missing from most virtual classrooms: a private, real-time way for students to signal confusion, content that adapts to each student's actual skill level, and an AI tutor built to guide students toward understanding rather than hand them answers.

### The Problem

Virtual and hybrid classrooms ask teachers to do something they aren't well-equipped to do: notice a struggling student through a screen, using the same instincts that work in person. More than half of teachers report being unable to reliably tell whether students were learning or needed help during remote instruction, because the everyday in-person cues (body language, hesitation, who's avoiding the question) mostly disappear online. The students who lose the most from this gap are also the students most likely to already be underserved — low-income students, students with disabilities, English language learners, and students in under-resourced schools — because these groups are simultaneously more likely to be placed in remote-heavy instruction and more likely to fall further behind once they are.

**Our position:** the data virtual learning already generates — logins, time on task, where a student gets stuck — is richer than what a teacher can observe by eye. The bottleneck isn't whether that signal exists, it's that almost nothing turns it into a fast, fair response today. Any system we build has to close that specific gap, while explicitly avoiding a documented risk in existing detection tools: flagging students by demographic pattern rather than genuine need.

**The impact:** a faster, more equitable way for teachers to identify and support struggling students in real time — while giving students more ownership over their own learning and a private way to ask for help without fear of embarrassment in front of classmates.

### User Personas

**Persona 1 — "Jordan," age 12, 7th grade (Student).** Attends a hybrid program with some fully virtual days; shares a laptop with a sibling; reliable but not always-available home internet. Doesn't want to seem "behind" in front of classmates — dislikes asking for help out loud, especially on camera or in a public chat. Gets quietly lost during lessons and says nothing; by the time a quiz score reveals the gap, weeks have passed. Has tried emailing the teacher after class (slow, easy to forget), general AI chatbots (give direct answers, don't build understanding), and the school's tutoring sign-up (long wait, not real-time).

**Persona 2 — "Ms. Rivera," 6th–8th grade hybrid teacher.** Manages 28–30 students simultaneously across in-person and virtual instruction. Wants every student supported, especially the quietly struggling ones, and cares specifically about equity — doesn't want her highest-need students (IEP, ELL) to be the ones who fall through the cracks first. Can't visually read confusion through a screen; often doesn't find out a student is lost until a failed assignment shows up, days or weeks too late. Has tried scheduled 1:1 check-ins (not scalable), asking "does everyone understand?" out loud (rarely honest), and reviewing usage data after the fact (informative, always too late to act on).

### User Stories

**MVP** (without these, the application isn't useful):

1. As a teacher, I can set up: invite students, set up a lesson, run a lesson live. **✅ Built.**
2. As a student, I can send a private, one-tap "I'm lost" signal during a live lesson, so my teacher is notified immediately and anonymously, without my classmates knowing I'm struggling. **✅ Built — this submission's focus.**
3. As a teacher, I can view a real-time, anonymized dashboard showing which students have signaled confusion and where students stand on current skills, so I know who needs help and can respond before the lesson ends. **✅ Built (signal half) — see the skill-standing note above.**
4. As a student, I can ask an AI tutor for help and receive guiding questions back instead of direct answers, so I build my own understanding. **Not in this submission.**

**Stretch features** (cut first if time runs short): adaptive practice matched to skill level; post-session reflections; a guided focus exercise; a cooperative, non-competitive study challenge. None are in this submission.

**Future exploration** (not yet scoped): a screen-time/growth-companion feature rewarding time away from non-educational apps — flagged as a validated concept worth researching later, not committed to building.

---

## Part II — Technical Specifications

### API Contract

All endpoints below reflect what's actually implemented today; see "Known deviations from the original contract" underneath for what changed and why.

#### Auth

| Method & Path | Description |
|---|---|
| `POST /api/auth/register` | Create a student or teacher account. |
| `POST /api/auth/login` | Exchange username/password for a session token. |
| `POST /api/auth/logout` | Invalidate the current session token. |
| `GET /api/auth/me` | Fetch the authenticated user's profile. |
| `PATCH /api/auth/me` | Update name/email. |

#### Classes & Enrollments (setup flow)

| Method & Path | Description |
|---|---|
| `POST /api/classes` | Teacher creates a class; server generates a shareable join code. |
| `GET /api/classes` | Lists the logged-in teacher's own classes. |
| `GET /api/classes/:classId` | Class details; includes the enrolled roster if the requester is the owning teacher. |
| `PATCH /api/classes/:classId` | Teacher renames the class or adjusts its alert threshold. |
| `DELETE /api/classes/:classId` | Teacher deletes the class (cascades to its enrollments and lessons). |
| `POST /api/enrollments` | Student joins a class by join code. |

Classes has full Create/Read/Update/Delete — this is the resource satisfying the "at least one resource with full CRUD" requirement. Signals (below) also has all four, independently.

#### Lessons

| Method & Path | Description |
|---|---|
| `POST /api/lessons` | Teacher creates a lesson under a class (`scheduled`). |
| `GET /api/lessons/:lessonId` | Lesson metadata — used to confirm a lesson is live before opening a socket. |
| `PATCH /api/lessons/:lessonId` | Transition status: `scheduled → live → ended`. Going live provisions a video room; ending tears it down and closes the lesson's WebSocket connections. |
| `GET /api/lessons/:lessonId/video-token` | Join token for the lesson's video room. |

#### Confusion Signals (the "I'm lost" feature)

| Method & Path | Description |
|---|---|
| `POST /api/lessons/:lessonId/signals` | Student sends a signal on a live lesson they're enrolled in. `201 { signalId, lessonId, createdAt, status }`. |
| `GET /api/lessons/:lessonId/signals/:signalId` | Teacher-only, single-signal read. |
| `PATCH /api/lessons/:lessonId/signals/:signalId` | Teacher marks `acknowledged` or `resolved`. |
| `DELETE /api/lessons/:lessonId/signals/:signalId` | Teacher deletes a signal. |
| `GET /api/lessons/:lessonId/dashboard` | Teacher-only snapshot: open signal count, open (or, with `?since=`, recently changed) signals, and skill snapshot. Used on initial dashboard load — the socket keeps it current after that. |

Every endpoint returns `401` (not authenticated), `403` (wrong role/not the owner/not enrolled), and `404` (not found) as applicable, in addition to the success shape listed.

#### AI Tutor

| Method & Path | Description |
|---|---|
| `POST /api/tutor/message` | Student-only. Sends a message to the Socratic AI tutor; optionally pass `lessonId` to link the conversation to a lesson. Finds or creates the student's `tutor_sessions` row, persists both the student's message and the tutor's reply as `tutor_messages`, and returns `{ sessionId, reply }`. `404` if `lessonId` doesn't reference a real lesson. |

This is the AI-tutor half of Sprint 3 only — question routing/clustering (`questions`, `question_clusters`) is a separate, later step and isn't wired to any endpoint yet.

#### WebSocket Channel

`WS /ws/lessons/:lessonId` — one channel per lesson; both the student's lesson view and the teacher's dashboard connect for the duration of a live lesson.

- **Connect:** token passed as `?token=<sessionToken>` (a WS handshake can't carry a custom header reliably). Server validates the token and the caller's enrollment/ownership of `lessonId` before accepting; closes with `4401` (not authenticated), `4403` (not enrolled / not the assigned teacher), or `4409` (lesson isn't `live`) otherwise.
- **Client → server:** the only message is a heartbeat, `{ "type": "ping" }`; server replies `{ "type": "pong" }`. Signals themselves are still POSTed over REST so they're durably written first — never sent over the socket directly.
- **Server → client**, all shaped `{ type, data }`:
  - `signal.created` — to the teacher's connection, the instant a student's POST succeeds.
  - `signal.updated` — to the teacher's connection, on a status change via PATCH.
  - `signal.ack` — to the originating student's connection only, confirming their signal was received.
  - `lesson.started` / `lesson.ended` — broadcast to everyone connected to the lesson.
- **Disconnection:** the server closes every connection for a lesson with code `1000` the moment its status transitions to `ended`. Clients should reconnect with backoff on unexpected drops and re-fetch `GET /api/lessons/:lessonId/dashboard` to resync any broadcasts missed while disconnected.

#### Known deviations from the original contract

- The dashboard's per-signal entries and the PATCH response include the student's identity (`studentId`, `studentName`) to the teacher. The original contract's `{ signalId, createdAt, status }` shape predates a later, explicit team decision that the teacher always sees who sent a signal — anonymity is from classmates only, never from the teacher.
- Classes/Enrollments/Lessons/Auth aren't in the original API Contract section at all (it only documented the signals/dashboard/WS slice) — they're included above since they're real and load-bearing for the setup flow.
- `skill.updated` (documented in the original WS contract) isn't fired by anything yet, since nothing writes skill data — see the skill-standing note earlier in this README.
- The AI tutor's system prompt tells the model to redirect a student to a teacher/counselor/trusted adult if they express distress, but no mechanism notifies a teacher when that happens — it's a silent client-side redirect only. This needs a product decision (a dashboard signal? a separate alert flow?) before it's built; intentionally parked, not an oversight.
- The AI tutor currently calls Gemini (`GeminiTutorService`), not Claude/Anthropic as originally planned for Sprint 3 — a temporary swap pending Claude API token approval. The `TutorService` abstraction is provider-agnostic, so swapping in an `AnthropicTutorService` later is a self-contained change.

### Schema Design

Reflects the actual current tables; differences from the original schema draft are called out inline.

**`teachers`** — `teacher_id` PK, `username` (unique), `name`, `email` (unique), `password_hash`, `is_active`, `created_at`.

**`students`** — same shape as `teachers`, plus `consent_status` (a hook for a future parental-consent flow; not yet wired to any endpoint).

**`classes`** — `class_id` PK, `teacher_id` FK → teachers, `name`, `join_code` (unique, auto-generated, shareable), `alert_threshold` (per-class mastery cutoff behind the dashboard's below-threshold count), `created_at`.

**`enrollments`** — `enrollment_id` PK, `student_id` FK, `class_id` FK, `enrolled_at`; unique on `(student_id, class_id)`.

**`lessons`** — `lesson_id` PK, `class_id` FK, `title`, `scheduled_at`, `started_at`, `ended_at`, `status` (`scheduled | live | ended` — **changed from the original draft's boolean `is_live`**, since a lesson needs a real lifecycle, not just on/off), `video_room_id`, `video_provider` (vendor-neutral, so switching video vendors isn't a schema change).

**`confusion_signals`** — `signal_id` PK, `public_id` (opaque UUID exposed to clients instead of the sequential PK, so consecutive signals can't be diffed to infer platform-wide volume), `student_id` FK, `lesson_id` FK, `status` (`open | acknowledged | resolved` — **changed from the original draft's boolean `is_resolved`**, to support an acknowledged state before resolution), `created_at`, `updated_at`.

**`current_skills`** — `skill_id` PK, `student_id` FK (nullable, `SET NULL` on delete so historical class averages survive an account deletion), `class_id` FK, `topic_id` FK → `skill_topics`, `mastery_level` (0–1), `updated_at`. **Changed from the original draft:** `skill_topic` is now a normalized `skill_topics` table (`topic_id`, `name`) instead of free text, and mastery is scoped per-class as well as per-student, so the same topic in two classes tracks independently.

**`sessions`** — `session_id` PK, `token` (unique, the bearer credential), `user_id` (polymorphic — a student or teacher id depending on `role`), `role`, `created_at`, `expires_at`.

**`tutor_sessions`** — `session_id` PK, `student_id` FK (nullable, `SET NULL` on delete), `lesson_id` FK (nullable, `SET NULL` on delete), `started_at`.

**`tutor_messages`** — `message_id` PK, `session_id` FK (`CASCADE` on delete), `sender` (`student | ai`), `message_text`, `created_at`.

**Modeled, not yet wired to any endpoint** (support the deferred question-clustering feature): `questions`, `question_clusters`.

**Architectural notes carried over from the original design:**
- There is no `dashboard` table — it's a live query joining `confusion_signals` and `current_skills`, filtered by the active lesson.
- Anonymity from classmates is enforced at the API layer, never the schema — the teacher's queries always resolve `student_id` to a name.
- Teachers and Students remain separate tables rather than a merged `users` table, since their role-specific concerns don't overlap enough to warrant one.

### Core Technologies

- **React** — frontend.
- **Python + FastAPI** — server, including native WebSocket support for the real-time channel above.
- **PostgreSQL + SQLAlchemy + Alembic** — database, ORM, and migrations.
- **passlib (bcrypt)** — password hashing.
- **Daily.co** (with a fake, network-free implementation for local dev/tests) — video room provisioning for live lessons.
- **pytest** — backend test suite; **Vitest + Testing Library** — frontend test suite.
- **Render** — deployment.

Deferred until the AI tutor / adaptive practice / question-clustering features are actually scoped in: the Anthropic API (Socratic tutor), pgvector (question embeddings/similarity search), and an embeddings model or API.
