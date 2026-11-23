import { packets } from './fixtures.mjs';
import assert from 'node:assert/strict';
export const turnComplete = (partial) =>
  partial.silenceMs >= 60 && partial.stable && /^incident \d{4}$/.test(partial.text);
export const playoutSchedule = (bufferMs) =>
  packets.map((packet) => ({
    ...packet,
    deadline: packet.timestamp + bufferMs,
    disposition: packet.arrival <= packet.timestamp + bufferMs ? 'play' : 'conceal',
  }));
export function voiceReconcile(pendingText, chunks, cursor) {
  let offset = 0,
    last = 0;
  for (const chunk of chunks) {
    assert.equal(typeof chunk.text, 'string');
    assert(chunk.text.length > 0, 'empty chunk');
    offset += chunk.text.length;
    assert(Number.isInteger(chunk.endChar) && chunk.endChar === offset, 'character alignment');
    assert(Number.isInteger(chunk.endMs) && chunk.endMs > last, 'playout ordering');
    last = chunk.endMs;
  }
  assert.equal(chunks.map((c) => c.text).join(''), pendingText);
  assert(Number.isInteger(cursor) && cursor >= 0 && cursor <= last, 'cursor');
  const end = chunks.filter((c) => c.endMs <= cursor).at(-1)?.endChar ?? 0;
  return {
    retained: pendingText.slice(0, end).trimEnd(),
    discarded: pendingText.slice(end).trimStart(),
    endChar: end,
  };
}
export function voiceLateAck(state, event) {
  if (event.response !== state.response || event.session !== state.session || state.cancelled)
    return {
      ...state,
      accepted: false,
    };
  if (
    !Number.isInteger(event.cursor) ||
    event.cursor < state.cursor ||
    event.cursor > state.received
  )
    return {
      ...state,
      accepted: false,
    };
  return {
    ...state,
    cursor: event.cursor,
    accepted: true,
  };
}
export function voiceWorksheet() {
  const probabilities = [0.04, 0.08, 0.66, 0.74, 0.69, 0.22, 0.15, 0.09];
  const costRows = [
    {
      name: 'read',
      tokens: 1000,
      rate: 0.4,
    },
    {
      name: 'write',
      tokens: 500,
      rate: 2.5,
    },
    {
      name: 'ordinary',
      tokens: 200,
      rate: 2,
    },
  ];
  const freshChunks = [
    {
      text: 'Lookup is ready.',
      endChar: 16,
      endMs: 300,
    },
    {
      text: ' Owner has replied.',
      endChar: 35,
      endMs: 700,
    },
  ];
  const retained = voiceReconcile(
    freshChunks.map((c) => c.text).join(''),
    freshChunks,
    460,
  ).retained;
  return {
    probabilities,
    retainedFrames: [0, 1, 2, 3, 4],
    trailingFrames: [5, 6, 7],
    requested61Frames: Math.ceil(61 / 20),
    costRows,
    costNumerator: costRows.reduce((n, r) => n + r.tokens * r.rate, 0),
    freshChunks,
    retained,
    freshText: freshChunks.map((c) => c.text).join(''),
  };
}
