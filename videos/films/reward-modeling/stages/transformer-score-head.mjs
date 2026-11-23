import { cueProgress, motion } from '../construction.mjs';
import { scoreHeadConstruction } from '../model.mjs';
import { arrow, badge, line, panel, tokenRow } from '../defaults.mjs';
function paintRewardStage(ctx, scene, state, api) {
  const beat = state.beat ?? 0;
  if (beat < 2) {
    const p = beat ? 1 : cueProgress(state, 'head-context', motion(state)),
      active = Math.min(4, Math.floor(p * 5));
    badge(api, ctx, 'Schematic prompt + answer positions', 960, 285, api.C.cyan, 37);
    const xs = [260, 540, 820, 1100, 1380, 1660],
      names = ['admin?', 'Request', 'ticket;', 'then wait', 'END', 'PAD'];
    xs.forEach((x, i) => {
      tokenRow(
        api,
        ctx,
        [names[i]],
        x - 110,
        370,
        i <= active ? api.C.blue : api.C.muted,
        220,
        0,
        30,
      );
      if (i <= active) {
        arrow(api, ctx, x, 440, x, 560, i === 4 ? api.C.yellow : api.C.muted, 3);
        api.focus.target('hidden-states', () => {
          panel(api, ctx, x - 100, 570, 200, 155, i === 4 ? api.C.yellow : api.C.blue);
          badge(api, ctx, 'h' + (i + 1), x, 635, i === 4 ? api.C.yellow : api.C.blue, 40);
          for (let j = 0; j <= i; j++) api.circle(ctx, x - 64 + j * 32, 690, 8, api.C.cyan);
        });
      }
    });
    line(api, ctx, 210, 800, xs[active] + 110, 800, api.C.yellow, 4);
    badge(
      api,
      ctx,
      beat ? 'Select final REAL token; exclude padding' : 'Only this prefix is available',
      960,
      900,
      beat ? api.C.yellow : api.C.muted,
      37,
    );
    return;
  }
  const v = scoreHeadConstruction(state);
  badge(
    api,
    ctx,
    'Candidate ' +
      v.candidate +
      ' · ' +
      (v.candidate === 'A' ? 'request ticket; wait' : 'grant access now') +
      ' · supplied hidden vector',
    960,
    280,
    api.C.cyan,
    32,
  );
  const cols = [520, 1400];
  api.focus.target('scalar-head', () => {
    for (let i = 0; i < 2; i++) {
      panel(api, ctx, cols[i] - 230, 365, 460, 120, api.C.blue);
      badge(
        api,
        ctx,
        String(v.vector[i]) + ' × ' + String(v.weights[i]),
        cols[i],
        442,
        api.C.ink,
        56,
      );
      arrow(api, ctx, cols[i], 490, cols[i], 590, api.C.yellow, 4);
      panel(api, ctx, cols[i] - 230, 600, 460, 120, api.C.green);
      if (v.progress[i] > 0) api.rect(ctx, cols[i] - 225, 708, 450 * v.progress[i], 6, api.C.green);
      badge(
        api,
        ctx,
        v.progress[i] >= 1 ? v.products[i].toFixed(2) : 'Product pending',
        cols[i],
        678,
        v.progress[i] >= 1 ? api.C.green : api.C.muted,
        43,
      );
    }
  });
  badge(api, ctx, '+', 960, 680, api.C.yellow, 54);
  api.focus.target('reward-score', () => {
    panel(api, ctx, 450, 825, 1020, 120, api.C.green);
    badge(
      api,
      ctx,
      v.scoreVisible
        ? v.products.map((x) => x.toFixed(2)).join(' + ') + ' = ' + v.score.toFixed(2)
        : 'Sum pending',
      960,
      902,
      v.scoreVisible ? api.C.green : api.C.muted,
      49,
    );
  });
  badge(
    api,
    ctx,
    'Same weights [0.5, 1] for both answers' + (beat >= 3 ? ' · retained A = 1.80' : ''),
    960,
    1010,
    api.C.muted,
    30,
  );
}

export function drawTransformerScoreHead(ctx, scene, state, api) {
  ctx.save();
  paintRewardStage(ctx, scene, state, api);
  ctx.restore();
}
export default {
  id: 'transformer-score-head',
  draw: drawTransformerScoreHead,
  cues: [
    'head-context',
    'head-final',
    'head-a-first',
    'head-a-second',
    'head-a-sum',
    'head-a-result',
    'head-b-first',
    'head-b-second',
    'head-b-sum',
    'head-b-result',
  ],
};
