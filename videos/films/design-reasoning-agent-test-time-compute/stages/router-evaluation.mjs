import { sentence } from '../construction.mjs';
import { constructionModel } from '../model.mjs';
import {
  drawConstructionBox,
  drawConstructionFoot,
  drawConstructionGrid,
  drawConstructionHead,
  drawConstructionText,
  drawConstructionTransfer,
} from '../defaults.mjs';
export function drawRouterEvaluation(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    modelState = constructionModel('router-evaluation', state),
    progress = (beat, n) => sentence(state, 'router-evaluation', beat, n),
    done = (beat, n) => progress(beat, n) === 1;
  {
    drawConstructionHead(
      ctx,
      api,
      currentBeat === 2
        ? 'Plateau uses the previous best and the latest three'
        : currentBeat === 1
          ? 'Escalation follows evidence and task structure'
          : 'A keyword demonstration is a route ceiling',
    );
    if (currentBeat === 0) {
      const a = [
        ['threshold lookup', 'bounded path'],
        ['canary debugging', 'best-of-three'],
        ['compatibility graph', 'tree search'],
      ];
      a.forEach((r, i) => {
        const left = drawConstructionBox(
            ctx,
            api,
            r[0],
            180,
            370 + i * 175,
            650,
            100,
            themeColors.blue,
          ),
          right = drawConstructionBox(
            ctx,
            api,
            r[1],
            1110,
            370 + i * 175,
            630,
            100,
            themeColors.cyan,
          );
        drawConstructionTransfer(ctx, api, left, right, progress(0, 0));
      });
      drawConstructionFoot(
        ctx,
        api,
        'Toy keyword rules need real under-routing and over-routing evaluation.',
      );
    } else if (currentBeat === 1) {
      drawConstructionGrid(
        ctx,
        api,
        [
          ['observed condition', 'route'],
          ['exact completion', 'STOP'],
          ['partial alternatives matter', 'TREE'],
          ['complete alternatives suffice', 'CANDIDATES'],
          ['high impact / no verifier', 'TOOLS OR REVIEW'],
        ],
        220,
        350,
        1480,
        480,
        themeColors.blue,
        30,
      );
      if (done(1, 3))
        drawConstructionText(
          ctx,
          api,
          'A high proxy score cannot bypass the evidence branch',
          960,
          930,
          35,
          themeColors.pink,
          'center',
        );
    } else {
      const a = [0.72, 0.7, 0.71, 0.69],
        count = Math.min(4, 1 + Math.floor(progress(2, 0) * 3));
      for (let i = 0; i < count; i++) {
        drawConstructionBox(
          ctx,
          api,
          'Call ' + (i + 1),
          220 + i * 425,
          385,
          340,
          90,
          themeColors.blue,
        );
        const h = 400 * a[i];
        api.rect(
          ctx,
          280 + i * 425,
          850 - h,
          220,
          h,
          i ? themeColors.cyan : themeColors.yellow,
          themeColors.muted,
          1,
        );
        drawConstructionText(
          ctx,
          api,
          a[i].toFixed(2),
          390 + i * 425,
          900,
          34,
          i ? themeColors.cyan : themeColors.yellow,
          'center',
        );
      }
      if (done(2, 1))
        drawConstructionText(
          ctx,
          api,
          'max(.70,.71,.69) = .71 ≤ earlier best .72 → STOP',
          960,
          980,
          34,
          themeColors.yellow,
          'center',
        );
    }
  }
}
export default {
  id: 'router-evaluation',
  draw: drawRouterEvaluation,
  cues: [
    'ra-router-evaluation-0-0',
    'ra-router-evaluation-0-1',
    'ra-router-evaluation-0-2',
    'ra-router-evaluation-1-0',
    'ra-router-evaluation-1-1',
    'ra-router-evaluation-1-2',
    'ra-router-evaluation-1-3',
    'ra-router-evaluation-2-0',
    'ra-router-evaluation-2-1',
    'ra-router-evaluation-2-2',
    'ra-router-evaluation-2-3',
  ],
};
