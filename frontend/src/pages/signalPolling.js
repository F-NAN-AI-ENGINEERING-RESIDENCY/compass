// Pure merge step for TeacherLessonDashboardPage's polling loop, pulled out
// of the component so it's unit-testable without rendering anything.
//
// `current` is the existing signals map (keyed by signalId). `incoming` is
// whatever GET /api/lessons/:id/dashboard just returned for `signals`. Per
// app/services/signal_service.get_dashboard: without `since` that's only
// open signals; with `since` it's anything created OR updated since then,
// regardless of status — so a signal that just turned 'resolved' or
// 'acknowledged' shows up here specifically so it can be removed.
export function mergeSignals(current, incoming) {
  const next = { ...current }
  for (const signal of incoming) {
    if (signal.status === 'open') {
      next[signal.signalId] = signal // new or still-open — add/refresh it
    } else {
      delete next[signal.signalId] // resolved/acknowledged elsewhere — drop it from the active list
    }
  }
  return next
}

// Sort order for the rendered list: oldest signal first, so the student
// who's been waiting longest is at the top.
export function sortedOpenSignals(signalsMap) {
  return Object.values(signalsMap).sort((a, b) => a.createdAt.localeCompare(b.createdAt))
}
