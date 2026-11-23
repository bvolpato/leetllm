import { phraseEnded, phraseProgress } from '../arithmetic.mjs';
import { text } from '../defaults.mjs';

const positions = [
  { slot: 1, correct: 15, cue: 'count-first', end: 0.24 },
  { slot: 10, correct: 7, cue: 'count-middle', end: 0.48 },
  { slot: 20, correct: 14, cue: 'count-last', end: 0.65 },
];
export function drawReasoningContext(ctx, scene, state, api) {
  const { C } = api;
  const b = state.beat;
  if (b === 0) {
    text(ctx, api, 'RUN-842', 210, 316, 54, C.blue);
    api.text(ctx, 'auth_fixture_test.py:41', 210, 459, 49, C.ink, 'left', 'mono');
    text(ctx, api, 'expired auth fixture', 210, 557, 61, C.yellow);
    api.line(ctx, 962, 340, 962, 858, C.muted, 2);
    api.focus.target('verification', () => {
      text(ctx, api, 'Proposed cause', 1060, 402, 32, C.muted);
      text(ctx, api, 'Clock skew?', 1060, 507, 56);
      if (phraseProgress(state, 'verify-cause', 0.22, 0.47) > 0) {
        text(ctx, api, 'Check clocks against expiry time', 1060, 644, 36, C.cyan);
        text(ctx, api, 'Clock readings missing', 1060, 746, 36, C.pink);
      }
    });
    text(ctx, api, 'Compare effort on the same held-out cases', 960, 977, 38, C.ink, 'center');
    return;
  }
  text(
    ctx,
    api,
    '20 documents per prompt  ·  same question and evidence',
    960,
    292,
    36,
    C.ink,
    'center',
  );
  text(ctx, api, 'Position of the decisive document', 225, 393, 31, C.muted);
  const added =
    b > 1
      ? 3
      : 1 +
        Number(phraseProgress(state, 'middle-slot', 0.37, 0.51) > 0) +
        Number(phraseProgress(state, 'last-slot', 0.57, 0.71) > 0);
  if (b >= 2) text(ctx, api, 'Supported answers', 1495, 393, 31, C.muted, 'center');
  for (const [index, sample] of positions.slice(0, added).entries()) {
    const y = 474 + index * 142;
    text(ctx, api, 'Slot ' + sample.slot, 170, y + 35, 37, C.ink);
    api.focus.target('document-' + sample.slot, () => {
      for (let i = 0; i < 20; i++) {
        const active = i + 1 === sample.slot;
        api.rect(
          ctx,
          356 + i * 46,
          y,
          39,
          46,
          active ? C.yellow : C.panel,
          active ? null : C.muted,
          2,
        );
      }
    });
    if (b >= 2) {
      const showCount = b > 2 || phraseEnded(state, sample.cue, sample.end);
      api.focus.target('count-' + sample.slot, () =>
        text(
          ctx,
          api,
          showCount ? sample.correct + ' / 20' : '? / 20',
          1495,
          y + 40,
          52,
          C.cyan,
          'center',
        ),
      );
    }
  }
  api.focus.target('sweep-result', () =>
    text(
      ctx,
      api,
      b === 1
        ? 'Each yellow block carries the same evidence for that case'
        : 'Illustrative scores  ·  same 20 questions at each position',
      960,
      970,
      38,
      C.muted,
      'center',
    ),
  );
}
export default {
  id: 'reasoning-context',
  draw: drawReasoningContext,
  cues: [
    'verify-cause',
    'middle-slot',
    'last-slot',
    'count-first',
    'count-middle',
    'count-last',
    'retry-layout',
  ],
};
