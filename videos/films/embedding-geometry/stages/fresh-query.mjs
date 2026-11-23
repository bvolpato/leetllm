import { completedCue, cosine, l2 } from '../arithmetic.mjs';
import { PASSAGES, QUANTIZATION_FIXTURE } from '../fixtures.mjs';
import { cell, geometryText, heading, vector } from '../defaults.mjs';
export function drawFreshQuery(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0),
    cueProgress = (a = 0.12, z = 0.85) => api.phase(progress, a, z);
  {
    if (currentBeat < 2) {
      heading(ctx, api, 'Original A[1,0.2], B[4,2] · only the query changes to [0,1]');
      const angle = ((currentBeat === 0 ? cueProgress() : 1) * Math.PI) / 2,
        q = [Math.cos(angle), Math.sin(angle)],
        a = api.teaching.axes({
          x: 230,
          y: 360,
          width: 950,
          height: 560,
          xDomain: [-0.4, 4.7],
          yDomain: [-0.4, 2.7],
          xTicks: [],
          yTicks: [],
          equalUnits: true,
          xLabel: 'coordinate0',
          yLabel: 'coordinate1',
        });
      PASSAGES.forEach((r, i) => {
        const z = vector(ctx, api, a, r.vector, i ? themeColors.pink : themeColors.green);
        geometryText(
          ctx,
          api,
          r.id,
          z.x + 25,
          z.y - 20,
          31,
          i ? themeColors.pink : themeColors.green,
        );
      });
      vector(ctx, api, a, q, themeColors.cyan);
      const rows = [
        ['Raw dot', 0.2, 2, 'fresh-dot-complete'],
        [
          'Cosine',
          cosine([0, 1], PASSAGES[0].vector),
          cosine([0, 1], PASSAGES[1].vector),
          'fresh-cosine-complete',
        ],
        [
          'Raw L2',
          l2([0, 1], PASSAGES[0].vector),
          l2([0, 1], PASSAGES[1].vector),
          'fresh-l2-complete',
        ],
      ];
      api.focus.target('fresh-scores', () =>
        rows.forEach(([name, av, bv, id], i) => {
          const y = 420 + i * 160,
            show = currentBeat === 1 && completedCue(state, id);
          geometryText(ctx, api, name, 1500, y, 32, themeColors.muted, 'center');
          geometryText(
            ctx,
            api,
            show ? 'A ' + av.toFixed(3) + ' · B ' + bv.toFixed(3) : 'A ? · B ?',
            1500,
            y + 75,
            37,
            themeColors.yellow,
            'center',
          );
        }),
      );
      geometryText(
        ctx,
        api,
        currentBeat === 0
          ? 'Predict all three winners before opening their scores'
          : completedCue(state, 'fresh-unit-complete')
            ? 'Unit-vector cosine / dot / L2² all choose B'
            : 'Unit-vector rankings: ?',
        960,
        1030,
        35,
        themeColors.ink,
        'center',
      );
    } else {
      heading(ctx, api, 'Fresh upward query · C[0.99,0.13], D[0.96,0.28] · same 0.2 grid');
      const q = cueProgress(),
        step = completedCue(state, 'fresh-rescore-complete') ? 2 : 1;
      ['C', 'D'].forEach((id, i) => {
        const y = 420 + i * 210,
          v = QUANTIZATION_FIXTURE.candidates[i];
        cell(
          ctx,
          api,
          id + ' [' + v.join(',') + ']',
          220,
          y,
          540,
          90,
          i ? themeColors.pink : themeColors.blue,
        );
        api.arrow(ctx, 790, y + 45, 1020, y + 45, themeColors.muted, 3);
        cell(ctx, api, '[1,0.2] · tied code', 1060, y, 630, 90, themeColors.yellow);
        api.focus.target('fresh-originals', () =>
          geometryText(
            ctx,
            api,
            completedCue(state, 'fresh-original-complete')
              ? 'full upward cosine ' + cosine([0, 1], v).toFixed(3)
              : 'full upward cosine ?',
            490,
            y + 150,
            30,
            i ? themeColors.pink : themeColors.blue,
            'center',
          ),
        );
      });
      api.focus.target('fresh-rescore', () =>
        geometryText(
          ctx,
          api,
          step === 1
            ? 'K1 retains C by tie-break; D absent from rescore'
            : 'K2 retains C,D → original-vector rescore chooses D',
          960,
          990,
          37,
          step === 1 ? themeColors.pink : themeColors.green,
          'center',
        ),
      );
    }
    return;
  }
  return;
}
export default {
  id: 'fresh-query',
  draw: drawFreshQuery,
  cues: [
    'fresh-dot',
    'fresh-cosine',
    'fresh-l2',
    'fresh-unit',
    'fresh-dot-complete',
    'fresh-cosine-complete',
    'fresh-l2-complete',
    'fresh-unit-complete',
    'fresh-original-score',
    'fresh-shortlist',
    'fresh-original-complete',
    'fresh-rescore-complete',
  ],
};
