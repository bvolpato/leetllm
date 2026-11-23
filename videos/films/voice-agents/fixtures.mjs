export const trace = {
  speechEnd: 0,
  commit: 60,
  sttDone: 100,
  clauseStart: 60,
  clauseDone: 240,
  fragmentReady: 210,
  synthesisStart: 210,
  synthesisDone: 345,
  playoutStart: 345,
  firstAudio: 380,
};
export const sequential =
  trace.commit +
  (trace.sttDone - trace.speechEnd) +
  (trace.clauseDone - trace.clauseStart) +
  (trace.synthesisDone - trace.synthesisStart) +
  (trace.firstAudio - trace.playoutStart);
export const firstAudioLatency = trace.firstAudio - trace.speechEnd;
export const commitToAudio = trace.firstAudio - trace.commit;
export const toolTrace = {
  started: trace.commit,
  completed: 640,
};
export const pendingText = 'Incident is open because the database failover is still running.';
export const chunks = [
  {
    text: 'Incident is',
    endChar: 11,
    endMs: 240,
  },
  {
    text: ' open',
    endChar: 16,
    endMs: 520,
  },
  {
    text: ' because the database',
    endChar: 37,
    endMs: 860,
  },
  {
    text: ' failover is still running.',
    endChar: 64,
    endMs: 1120,
  },
];
export const speechChunks = [
  {
    name: 'acknowledgement',
    llm: [60, 240],
    fragment: 210,
    tts: [210, 345],
    play: [380, 650],
  },
  {
    name: 'neutral continuation',
    llm: [240, 500],
    fragment: 400,
    tts: [400, 620],
    play: [650, 920],
  },
  {
    name: 'first factual audio chunk',
    llm: [640, 820],
    fragment: 780,
    tts: [780, 920],
    play: [955, 955 + chunks[0].endMs],
  },
];
export function playbackState(response = 'reply-1', session = 'call-Alex') {
  return {
    response,
    session,
    receivedThrough: chunks.at(-1).endMs,
    acknowledgedThrough: 0,
    cancelled: false,
    frozenCursor: null,
  };
}
export function acknowledge(state, event) {
  if (event.session !== state.session || event.response !== state.response || state.cancelled)
    return false;
  if (
    !Number.isInteger(event.cursor) ||
    event.cursor < state.acknowledgedThrough ||
    event.cursor > state.receivedThrough
  )
    return false;
  state.acknowledgedThrough = event.cursor;
  return true;
}
export function reconcile(state) {
  state.frozenCursor ??= state.acknowledgedThrough;
  state.cancelled = true;
  const end = chunks.filter((chunk) => chunk.endMs <= state.frozenCursor).at(-1)?.endChar ?? 0;
  return {
    retained: pendingText.slice(0, end).trimEnd(),
    discarded: pendingText.slice(end).trimStart(),
  };
}
export function buildInterruptedReply() {
  const activeReply = playbackState();
  acknowledge(activeReply, {
    session: 'call-Alex',
    response: 'reply-1',
    cursor: 520,
  });
  const interrupt = {
    replyElapsedMs: 650,
    replyStartWallMs: speechChunks[2].play[0],
    wallMs: speechChunks[2].play[0] + 650,
    acknowledgedThrough: activeReply.acknowledgedThrough,
    ...reconcile(activeReply),
  };
  return {
    activeReply,
    interrupt,
  };
}
export const { activeReply, interrupt } = buildInterruptedReply();
export const partialTurns = [
  {
    text: 'incident 4',
    silenceMs: 80,
    stable: true,
  },
  {
    text: 'incident 42',
    silenceMs: 0,
    stable: true,
  },
  {
    text: 'incident 4219',
    silenceMs: 80,
    stable: true,
  },
];
export const packets = [
  {
    id: 1,
    timestamp: 0,
    arrival: 10,
  },
  {
    id: 2,
    timestamp: 20,
    arrival: 28,
  },
  {
    id: 3,
    timestamp: 40,
    arrival: 95,
  },
  {
    id: 4,
    timestamp: 60,
    arrival: 73,
  },
];
