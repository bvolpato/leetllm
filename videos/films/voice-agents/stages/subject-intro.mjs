import { chunks } from '../fixtures.mjs';
import { drawText } from '../defaults.mjs';
import { sceneCues } from '../reply-strip.mjs';

const status = chunks
  .slice(0, 2)
  .map((chunk) => chunk.text)
  .join('');
const reason = chunks.slice(2).map((chunk) => chunk.text.trim());

function soundWave(ctx, api, time, speaking) {
  for (let i = 0; i < 29; i++) {
    const sample = i * 0.28 - time * 4.6;
    const envelope = Math.sin((Math.PI * (i + 1)) / 30);
    const level = Math.abs(Math.sin(sample) + 0.45 * Math.sin(2.8 * sample + 0.9)) / 1.45;
    const height = speaking ? 8 + 142 * envelope * level : 6;
    api.rect(
      ctx,
      202 + 11 * i,
      553 - height / 2,
      7,
      height,
      speaking ? api.C.cyan : api.C.muted,
      undefined,
      3,
    );
  }
}

export function drawSubjectIntro(ctx, scene, state, api) {
  const { C } = api;
  const cue = sceneCues(scene, state);
  const stopped = cue.at('intro-interrupt');
  const explain = cue.at('intro-missing');
  if (state.t < 0.35) ctx.globalAlpha = 1;

  api.focus.target('intro-phone', () => {
    api.rect(ctx, 142, 219, 438, 710, C.panel, C.muted, 58, 4);
    api.rect(ctx, 289, 244, 145, 19, C.bg, undefined, 10);
    drawText(ctx, api, 'Incident hotline', 361, 366, 47, C.ink, 'center');
    drawText(ctx, api, 'Incident 4219', 361, 417, 32, C.muted, 'center');
    soundWave(ctx, api, state.t ?? 0, !stopped);
    drawText(
      ctx,
      api,
      stopped ? 'Playback stopped' : 'Hotline speaking',
      361,
      689,
      36,
      stopped ? C.pink : C.cyan,
      'center',
    );
    api.rect(ctx, 282, 883, 158, 9, C.muted, undefined, 5);
  });
  api.focus.target('intro-audio', () => {
    drawText(ctx, api, 'Audio on Alex’s phone', 735, 310, 36, C.cyan);
    drawText(ctx, api, status, 735, 414, 70);
    drawText(ctx, api, reason.join('\n'), 735, 498, 60);
    const endMs = chunks.at(-1).endMs;
    let start = 0;
    for (const chunk of chunks) {
      const x = 735 + (start / endMs) * 1010;
      const width = ((chunk.endMs - start) / endMs) * 1010;
      api.rect(ctx, x, 629, width - 6, 14, C.cyan, undefined, 6);
      start = chunk.endMs;
    }
  });
  if (stopped)
    api.focus.target('intro-stop', () => {
      drawText(ctx, api, 'Alex', 735, 733, 31, C.pink);
      drawText(ctx, api, '“Wait, page the owner.”', 735, 808, 57);
    });
  if (explain)
    api.focus.target('intro-receipt', () => {
      drawText(ctx, api, 'Last playback receipt', 735, 922, 34, C.green);
      drawText(ctx, api, 'Waiting for player', 1230, 922, 36, C.ink);
    });
}

export default {
  id: 'subject-intro',
  draw: drawSubjectIntro,
  cues: ['intro-speaking', 'intro-interrupt', 'intro-delivery', 'intro-ask', 'intro-missing'],
};
