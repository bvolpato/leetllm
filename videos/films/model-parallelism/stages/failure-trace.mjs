import { historyOwnership, localPlacement, mpClamp } from '../arithmetic.mjs';
import { mpReference } from '../model.mjs';
import {
  parallelBar,
  parallelFooter,
  parallelLine,
  parallelMatrix,
  parallelRectangle,
  parallelText,
  parallelTile,
} from '../defaults.mjs';
import { smoothstep } from 'vizmatic';
export function drawFailureTrace(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = mpClamp(state.beatP ?? 0);
  const cue = (name, index) => {
    const id = 'mp-failure-trace-' + name,
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
  const Q = (name, index) => cue(name, index).q;
  api.focus.target('mp-failure-trace-mechanism', () => {
    parallelText(
      ctx,
      api,
      'An observation selects missing evidence; it does not assign a cause.',
      960,
      300,
      31,
      themeColors.ink,
      'center',
    );
    if (currentBeat === 0) {
      const q = Q('ledger', 0),
        m = localPlacement([35, 15]);
      m.values.forEach((v, r) => {
        const x = 220 + r * 850;
        parallelBar(
          ctx,
          api,
          v,
          40,
          x,
          430,
          600,
          95,
          r ? themeColors.cyan : themeColors.blue,
          'rank ' + r + ': ' + v + ' GB',
        );
        parallelLine(
          ctx,
          api,
          x + (600 * 29) / 40,
          400,
          x + (600 * 29) / 40,
          560,
          themeColors.yellow,
        );
      });
      parallelText(
        ctx,
        api,
        q === 1
          ? 'Inspect actual allocations on the overflowing rank'
          : 'Group sum fits; inspect each rank',
        960,
        700,
        32,
        themeColors.pink,
        'center',
      );
      if (Q('latency', 0) > 0) {
        parallelBar(ctx, api, 4, 8, 350, 805, 1080, 60, themeColors.blue);
        api.rect(ctx, 890, 805, 270, 60, themeColors.pink);
        parallelText(
          ctx,
          api,
          'separate kernel, collective, scheduling and shared-link time',
          960,
          945,
          29,
          themeColors.yellow,
          'center',
        );
      }
    } else if (currentBeat === 1) {
      const m = historyOwnership();
      for (let r = 0; r < 8; r++) {
        const x = 180 + r * 205;
        parallelTile(
          ctx,
          api,
          'R' + r + ' KV' + Math.floor(r / 4),
          x,
          440,
          175,
          90,
          r < 4 ? themeColors.blue : themeColors.cyan,
        );
        parallelText(ctx, api, '32 copies', x + 87, 590, 26, themeColors.pink, 'center');
      }
      if (Q('gaps', 1) > 0) {
        ['admission', 'mixed step', 'transfer', 'delivery'].forEach((v, i) =>
          parallelTile(
            ctx,
            api,
            v,
            190 + i * 420,
            770,
            350,
            85,
            [themeColors.blue, themeColors.cyan, themeColors.pink, themeColors.yellow][i],
          ),
        );
      }
      parallelText(
        ctx,
        api,
        'First distinguish replicated full history from other hybrid state.',
        960,
        690,
        29,
        themeColors.yellow,
        'center',
      );
    } else {
      const m = mpReference;
      parallelText(
        ctx,
        api,
        'Reconstruct the exact computation first',
        180,
        420,
        33,
        themeColors.blue,
      );
      parallelMatrix(ctx, api, [m.output], 1010, 370, 230, themeColors.green);
      ['per-rank peak memory', 'sustained useful rate', 'TTFT + token-gap outcomes'].forEach(
        (v, i) => {
          parallelRectangle(ctx, api, 190, 665 + i * 95, 1530, 68, themeColors.muted);
          parallelText(ctx, api, v, 230, 710 + i * 95, 29, themeColors.ink);
        },
      );
    }
    parallelFooter(ctx, api, 'A transport product name does not identify the dominant bottleneck.');
  });
}
export default {
  id: 'failure-trace',
  draw: drawFailureTrace,
  cues: [
    'mp-failure-trace-0',
    'mp-failure-trace-ledger',
    'mp-failure-trace-latency',
    'mp-failure-trace-1',
    'mp-failure-trace-duplication',
    'mp-failure-trace-gaps',
    'mp-failure-trace-2',
    'mp-failure-trace-validate',
  ],
};
