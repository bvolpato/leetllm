import { playoutSchedule, turnComplete, voiceReconcile, voiceWorksheet } from './arithmetic.mjs';
import {
  acknowledge,
  activeReply,
  chunks,
  commitToAudio,
  firstAudioLatency,
  interrupt,
  packets,
  partialTurns,
  pendingText,
  playbackState,
  reconcile,
  sequential,
  speechChunks,
  toolTrace,
  trace,
} from './fixtures.mjs';
import { voiceDirection } from './construction.mjs';
import assert from 'node:assert/strict';
export function validateModel() {
  validateVoiceChapters();
  const during = {
      phase: 'during',
      progress: 0.05,
    },
    after = {
      phase: 'after',
      progress: 1,
    },
    before = {
      phase: 'before',
      progress: 0,
    };
  assert.equal(
    voiceDirection({
      beat: 1,
      beatP: 0.01,
      cues: {
        'chunks-factual-start': during,
      },
    }).factual,
    true,
  );
  assert.equal(
    voiceDirection({
      beat: 1,
      beatP: 0.9,
      cues: {
        'native-audio-path': before,
      },
    }).native,
    false,
  );
  assert.equal(
    voiceDirection({
      beat: 1,
      beatP: 0.01,
      cues: {
        'native-audio-path': during,
      },
    }).native,
    true,
  );
  const expanded = voiceDirection({
    beat: 1,
    beatP: 0.01,
    cues: {
      'transport-expand-buffer': after,
      'transport-absorb-p3': during,
    },
  });
  assert.equal(expanded.bufferMs, 60);
  assert.equal(playoutSchedule(expanded.bufferMs)[2].disposition, 'play');
  assert.equal(sequential, 510);
  assert.equal(firstAudioLatency, 380);
  assert.equal(commitToAudio, 320);
  assert.equal(interrupt.replyElapsedMs, 650);
  assert.equal(interrupt.wallMs, 1605);
  assert.ok(interrupt.acknowledgedThrough <= interrupt.replyElapsedMs);
  assert.equal(interrupt.acknowledgedThrough, 520);
  const openEnd = chunks[1].endMs;
  for (const [cursor, endChar, retained] of [
    [openEnd - 1, 11, 'Incident is'],
    [openEnd, 16, 'Incident is open'],
  ]) {
    const result = voiceReconcile(pendingText, chunks, cursor);
    assert.equal(result.endChar, endChar);
    assert.equal(result.retained, retained);
  }
  const statusEnd = interrupt.replyStartWallMs + openEnd;
  assert.equal(statusEnd, 1475);
  assert.equal(interrupt.wallMs - statusEnd, 130);
  assert.equal(chunks.map((chunk) => chunk.text).join(''), pendingText);
  let chars = 0,
    lastMs = 0;
  for (const chunk of chunks) {
    chars += chunk.text.length;
    assert.equal(chunk.endChar, chars);
    assert.ok(
      Number.isInteger(chunk.endChar) && Number.isInteger(chunk.endMs) && chunk.endMs > lastMs,
    );
    lastMs = chunk.endMs;
  }
  assert.equal(interrupt.retained, 'Incident is open');
  assert.equal(interrupt.discarded, 'because the database failover is still running.');
  assert.equal(
    acknowledge(activeReply, {
      session: 'call-Alex',
      response: 'reply-1',
      cursor: 1120,
    }),
    false,
  );
  assert.deepEqual(reconcile(activeReply), {
    retained: interrupt.retained,
    discarded: interrupt.discarded,
  });
  const next = playbackState('reply-2');
  for (const event of [
    {
      session: 'call-Alex',
      response: 'reply-1',
      cursor: 520,
    },
    {
      session: 'other-call',
      response: 'reply-2',
      cursor: 520,
    },
    {
      session: 'call-Alex',
      response: 'reply-2',
      cursor: 1121,
    },
    {
      session: 'call-Alex',
      response: 'reply-2',
      cursor: -1,
    },
  ])
    assert.equal(acknowledge(next, event), false);
  assert.equal(next.acknowledgedThrough, 0);
  assert.equal(next.cancelled, false);
  assert.deepEqual(reconcile(playbackState()), {
    retained: '',
    discarded: pendingText,
  });
  assert.equal(
    acknowledge(next, {
      session: 'call-Alex',
      response: 'reply-2',
      cursor: 520,
    }),
    true,
  );
  assert.equal(
    acknowledge(next, {
      session: 'call-Alex',
      response: 'reply-2',
      cursor: 240,
    }),
    false,
  );
  assert.deepEqual(partialTurns.map(turnComplete), [false, false, true]);
  assert.deepEqual(
    playoutSchedule(30).map((packet) => packet.disposition),
    ['play', 'play', 'conceal', 'play'],
  );
  assert.equal(playoutSchedule(60).filter((packet) => packet.disposition === 'conceal').length, 0);
  assert.ok(trace.clauseStart >= trace.commit && trace.synthesisStart >= trace.fragmentReady);
  assert.ok(trace.fragmentReady < trace.clauseDone && trace.firstAudio >= trace.synthesisDone);
  assert.ok(toolTrace.started >= trace.commit && toolTrace.completed > trace.firstAudio);
  for (const chunk of speechChunks) {
    assert.ok(chunk.llm[0] <= chunk.fragment && chunk.fragment <= chunk.llm[1]);
    assert.ok(chunk.tts[0] >= chunk.fragment && chunk.play[0] >= chunk.tts[1]);
  }
  assert.ok(
    speechChunks[1].llm[0] < speechChunks[0].play[1] &&
      speechChunks[1].llm[1] > speechChunks[0].play[0],
  );
  assert.ok(speechChunks[2].llm[0] >= toolTrace.completed);
  assert.equal(speechChunks[2].play[1] - speechChunks[2].play[0], chunks[0].endMs);
  assert.ok(interrupt.wallMs > speechChunks[2].play[1]);
  assert.ok(interrupt.wallMs < interrupt.replyStartWallMs + chunks.at(-1).endMs);
  assert.ok(interrupt.replyStartWallMs >= toolTrace.completed);
  assert.equal(
    packets.every((packet, index) => packet.id === index + 1),
    true,
  );
  const shortBuffer = playoutSchedule(30),
    longBuffer = playoutSchedule(60);
  assert.equal(shortBuffer[2].deadline, 70);
  assert.equal(shortBuffer[2].disposition, 'conceal');
  assert.equal(longBuffer[2].deadline, 100);
  assert.equal(longBuffer[2].disposition, 'play');
  assert(longBuffer.every((packet, index) => packet.deadline - shortBuffer[index].deadline === 30));
  return true;
}
export function validateVoiceChapters() {
  const m = voiceWorksheet();
  assert.equal(m.costNumerator, 2050);
  assert.equal(m.costNumerator / 1e6, 0.00205);
  assert.equal(m.retained, 'Lookup is ready.');
  assert.equal(m.freshText.length, 35);
  assert.equal(m.requested61Frames * 20, 80);
  assert.equal(m.retainedFrames.length * 20, 100);
  assert.equal((480 / 24000) * 1000, 20);
  assert.equal((480 / 16000) * 1000, 30);
  assert.equal(1200 + 300 + 450, 1950);
  assert.equal(380 - 160, 220);
}
