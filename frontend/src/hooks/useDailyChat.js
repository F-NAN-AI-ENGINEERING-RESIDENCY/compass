import { useEffect, useState } from 'react'

// Real-time chat — broadcast AND private, to a specific person — built
// entirely on Daily's own sendAppMessage()/'app-message' API. No custom
// backend involved: messages travel over the same Daily call connection the
// video already uses, so this works the moment a call is joined, with zero
// server changes. See:
// https://docs.daily.co/reference/daily-js/instance-methods/send-app-message
//
// `callFrame` must be the actual joined DailyIframe instance (not just a
// ref) so this effect re-attaches its listeners once the call frame that
// owns them actually exists — pass it from React state, not a ref, or this
// will silently never attach.
export function useDailyChat(callFrame, selfName) {
  const [messages, setMessages] = useState([])
  const [participants, setParticipants] = useState({})
  // sendAppMessage() throws (not rejects — a synchronous, uncaught-able
  // error) if called before the call has actually finished joining, not
  // just been created — a real risk on a slow connection, not only a
  // local-dev-without-an-API-key thing. Tracked via Daily's own
  // 'joined-meeting' event so ChatPanel can disable sending until then.
  const [isJoined, setIsJoined] = useState(false)

  useEffect(() => {
    if (!callFrame) return

    // Keyed by 'local' for this browser, session_id for everyone else —
    // ChatPanel uses this to populate the "who to message" recipient list.
    function syncParticipants() {
      setParticipants(callFrame.participants())
    }

    function handleAppMessage({ data, fromId }) {
      if (data?.type !== 'chat') return
      setMessages((current) => [...current, { ...data, fromId }])
    }

    function handleJoined() {
      setIsJoined(true)
      syncParticipants()
    }
    function handleLeft() {
      setIsJoined(false)
    }

    syncParticipants()
    callFrame.on('app-message', handleAppMessage)
    callFrame.on('participant-joined', syncParticipants)
    callFrame.on('participant-updated', syncParticipants)
    callFrame.on('participant-left', syncParticipants)
    callFrame.on('joined-meeting', handleJoined)
    callFrame.on('left-meeting', handleLeft)

    return () => {
      callFrame.off('app-message', handleAppMessage)
      callFrame.off('participant-joined', syncParticipants)
      callFrame.off('participant-updated', syncParticipants)
      callFrame.off('participant-left', syncParticipants)
      callFrame.off('joined-meeting', handleJoined)
      callFrame.off('left-meeting', handleLeft)
      setIsJoined(false)
    }
  }, [callFrame])

  // recipientSessionId omitted (or falsy) -> broadcast to everyone, Daily's
  // default. Passed -> private, delivered only to that one participant.
  //
  // Per Daily's docs, broadcast messages are never delivered back to the
  // sender (and a private message obviously can't target yourself either),
  // so the sender's own copy is appended locally right here — every message
  // in `messages`, sent or received, ends up looking the same to ChatPanel.
  function sendMessage(text, recipientSessionId, recipientName) {
    const trimmed = text.trim()
    if (!trimmed || !callFrame) return
    const message = {
      type: 'chat',
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      text: trimmed,
      senderName: selfName || 'You',
      sentAt: new Date().toISOString(),
      toSessionId: recipientSessionId || null,
      toName: recipientSessionId ? recipientName : null,
    }
    setMessages((current) => [...current, { ...message, fromId: 'local' }])
    if (!isJoined) return // local-echoed above; nobody else can receive it until the call's actually joined
    try {
      callFrame.sendAppMessage(message, recipientSessionId || '*')
    } catch {
      // sendAppMessage() throws synchronously rather than rejecting — a
      // dropped send here shouldn't take down the whole page. The message
      // still shows in the sender's own panel via the local-echo above.
    }
  }

  return { messages, participants, sendMessage, isReady: isJoined }
}
