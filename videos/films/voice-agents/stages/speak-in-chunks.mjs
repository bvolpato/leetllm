import { chunks, speechChunks, toolTrace, trace } from '../fixtures.mjs';
import { drawText } from '../defaults.mjs';
import { sceneCues } from '../reply-strip.mjs';

export function drawSpeakInChunks(ctx, scene, state, api) {
  const { C } = api;
  const cue = sceneCues(scene, state);
  const firstFact = speechChunks[2];
  const checkpoints = [
    ['speech-start', trace.commit],
    ['speech-fragment', trace.fragmentReady],
    ['speech-synth', trace.synthesisDone],
    ['speech-first', trace.firstAudio],
    ['speech-neutral', speechChunks[1].llm[1]],
    ['speech-return', toolTrace.completed],
    ['speech-factual', firstFact.tts[1]],
    ['speech-play-fact', firstFact.play[0]],
  ];
  let clock = 0;
  let previous = 0;
  for (const [cueId, end] of checkpoints) {
    clock += (end - previous) * cue.p(cueId);
    previous = end;
  }
  const x = (ms) => 422 + ms * 1.35;
  const rows = [
    ['Model words', 'llm', 397],
    ['Synthesis', 'tts', 509],
    ['Phone plays', 'play', 621],
  ];
  const colors = [C.green, C.cyan, C.yellow];
  const actual = cue.at('speech-return') && clock >= toolTrace.completed;
  api.focus.target('speech-spans', () => {
    drawText(ctx, api, 'Call clock  /  ms since speech end', 145, 251, 32, C.blue);
    if (clock >= trace.clauseStart) drawText(ctx, api, 'First phrase', 943, 251, 30, C.green);
    if (clock >= speechChunks[1].llm[0])
      drawText(ctx, api, 'Neutral continuation', 1195, 251, 30, C.cyan);
    if (actual) drawText(ctx, api, 'Status', 1625, 251, 30, C.yellow);
    drawText(ctx, api, Math.round(clock) + ' ms', x(clock), 326, 36, C.ink, 'center');
    api.line(ctx, x(clock), 349, x(clock), 638, C.muted, 2);
    rows.forEach(([label, key, y]) => {
      drawText(ctx, api, label, 145, y + 12, 35);
      api.line(ctx, x(0), y, x(975), y, C.panel, 5);
      speechChunks.forEach((piece, i) => {
        const [start, finish] = piece[key];
        if (clock < start) return;
        const head = Math.min(clock, finish);
        api.line(ctx, x(start), y, x(head), y, colors[i], 14);
        if (clock >= finish) api.circle(ctx, x(finish), y, 7, colors[i]);
      });
      if (key === 'play' && clock >= trace.firstAudio)
        drawText(ctx, api, '380', x(trace.firstAudio), y + 57, 30, C.green, 'center');
      if (key === 'play' && clock >= firstFact.play[0])
        drawText(
          ctx,
          api,
          String(firstFact.play[0]),
          x(firstFact.play[0]),
          y + 57,
          30,
          C.yellow,
          'center',
        );
    });
  });
  api.focus.target('speech-tool', () => {
    drawText(ctx, api, 'Lookup', 145, 768, 35);
    if (clock >= toolTrace.started) {
      const current = Math.min(clock, toolTrace.completed);
      api.line(ctx, x(toolTrace.started), 755, x(current), 755, C.blue, 13);
      drawText(
        ctx,
        api,
        actual ? '640 ms  /  open' : 'pending',
        x(current),
        818,
        34,
        actual ? C.yellow : C.blue,
        'center',
      );
    }
  });
  api.focus.target('speech-now', () => {
    if (!cue.at('speech-choose')) return;
    let line = 'Which can play now?     “I’ll check that.”     “Incident is open.”';
    if (cue.at('speech-ack')) line = 'First phrase: “I’ll check that.”';
    if (actual) line = 'Verified incident status: open';
    if (clock >= firstFact.tts[1]) line = 'First factual audio ready for the player';
    if (clock >= firstFact.play[0]) line = 'Factual reply begins: “' + chunks[0].text + '…”';
    drawText(ctx, api, line, 145, 951, 43, C.ink);
  });
}

export default {
  id: 'speak-in-chunks',
  draw: drawSpeakInChunks,
  cues: [
    'speech-start',
    'speech-fragment',
    'speech-synth',
    'speech-first',
    'speech-choose',
    'speech-ack',
    'speech-neutral',
    'speech-return',
    'speech-factual',
    'speech-play-fact',
  ],
};
