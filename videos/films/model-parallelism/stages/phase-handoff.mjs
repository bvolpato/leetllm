import { mpClamp } from '../arithmetic.mjs';
import {
  parallelFooter,
  parallelLine,
  parallelRectangle,
  parallelText,
  parallelTile,
} from '../defaults.mjs';
import { smoothstep } from 'vizmatic';
export function drawPhaseHandoff(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = mpClamp(state.beatP ?? 0);
  const cue = (name, index) => {
    const id = 'mp-phase-handoff-' + name,
      q = state.cues?.[id];
    if (state.cues && !q) throw Error('Missing model-parallel cue ' + id);
    return q
      ? {
          q: q.phase === 'before' ? 0 : q.phase === 'after' ? 1 : q.progress,
          done: q.phase === 'after',
        }
      : {
          q: currentBeat < index ? 0 : currentBeat > index ? 1 : smoothstep(progress),
          done: currentBeat > index || (currentBeat === index && progress >= 0.92),
        };
  };
  const Q = (name, index) => cue(name, index).q,
    resultComplete = (name, index) => cue(name, index).done;
  api.focus.target('mp-phase-handoff-mechanism', () => {
    const q = Q('move', 1),
      moving = q > 0 && q < 1;
    parallelText(
      ctx,
      api,
      'One request R1 · compatible source and destination layouts',
      960,
      300,
      32,
      themeColors.ink,
      'center',
    );
    if (moving) {
      for (const [x, col, left] of [
        [180, themeColors.blue, true],
        [1170, themeColors.cyan, false],
      ]) {
        parallelLine(ctx, api, x, 400, x + 570, 400, col);
        parallelLine(ctx, api, x, 830, x + 570, 830, col);
        parallelLine(ctx, api, left ? x : x + 570, 400, left ? x : x + 570, 830, col);
      }
    } else {
      parallelRectangle(ctx, api, 180, 400, 570, 430, themeColors.blue);
      parallelRectangle(ctx, api, 1170, 400, 570, 430, themeColors.cyan);
    }
    parallelText(ctx, api, 'prefill worker', 465, 455, 31, themeColors.blue, 'center');
    parallelText(ctx, api, 'decode worker', 1455, 455, 31, themeColors.cyan, 'center');
    for (let i = 0; i < 8; i++) {
      const x = 230 + (i % 4) * 122 + 990 * q,
        y = 520 + Math.floor(i / 4) * 125;
      parallelTile(
        ctx,
        api,
        'KV' + i,
        x,
        y,
        102,
        80,
        moving ? themeColors.yellow : q === 1 ? themeColors.cyan : themeColors.blue,
      );
    }
    parallelText(ctx, api, 'prefill queue: R2, R3', 180, 920, 29, themeColors.muted);
    parallelText(ctx, api, 'decode queue: R0 then R1', 1120, 920, 29, themeColors.muted);
    if (currentBeat === 2 && resultComplete('trace', 2)) {
      parallelTile(ctx, api, 'next token', 1190, 740, 480, 66, themeColors.green);
      parallelText(
        ctx,
        api,
        'admit → transfer → source release → decode',
        960,
        350,
        27,
        themeColors.yellow,
        'center',
      );
    }
    parallelFooter(
      ctx,
      api,
      'Count both queues, representation conversion and exposed transfer on the actual request path.',
    );
  });
}
export default {
  id: 'phase-handoff',
  draw: drawPhaseHandoff,
  cues: [
    'mp-phase-handoff-0',
    'mp-phase-handoff-phases',
    'mp-phase-handoff-1',
    'mp-phase-handoff-move',
    'mp-phase-handoff-queues',
    'mp-phase-handoff-2',
    'mp-phase-handoff-trace',
  ],
};
