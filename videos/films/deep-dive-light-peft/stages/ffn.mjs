import { FFN, FFN_CUT } from '../fixtures.mjs';
import { FFN_SELECTION } from '../construction.mjs';
import { clamp01 } from '../arithmetic.mjs';
import { beatCue, ffnPathFixture } from '../model.mjs';
import { chapterPanel, pairedCoordinates } from '../defaults.mjs';

const sorted = [...FFN].sort((a, b) => a.score - b.score);
const position = FFN_CUT * (sorted.length - 1);
const left = Math.floor(position);
const fraction = position - left;
const cutoff = FFN_SELECTION.threshold;
const kept = FFN_SELECTION.kept.map((i) => FFN[i]);

function scorePool(ctx, state, api) {
  const { C } = api;
  const sort = beatCue(state, 0, 'lp-ffn-sort', 0.16, 0.46);
  const cut = beatCue(state, 0, 'lp-ffn-cut', 0.57, 0.79);
  api.text(ctx, 'Five recorded gates across two layers', 135, 278, 40, C.ink);
  api.text(ctx, 'Remove 40%  ·  keep scores above the cutoff', 135, 350, 33, C.muted);
  api.focus.target('ffn-scores', () => {
    FFN.forEach((item, i) => {
      const rank = sorted.indexOf(item);
      const p = clamp01(sort * 5 - rank);
      const from = 144 + i * 335,
        to = 144 + rank * 335;
      const x = api.lerp(from, to, clamp01(p * 3 - 1));
      const y = 450 + 115 * clamp01(p * 3) + 115 * clamp01(p * 3 - 2);
      const color = cut < 1 ? C.cyan : item.score > cutoff ? C.green : C.pink;
      chapterPanel(ctx, api, C, item.id + '   ' + item.score.toFixed(2), x, y, 282, 92, color, 37);
    });
  });
  api.focus.target('ffn-cutoff', () => {
    api.text(ctx, '(5 − 1) × 0.40 = 1.60', 140, 910, 39, C.ink);
    if (cut > 0) {
      const x = 285 + (left + fraction * cut) * 335;
      api.line(ctx, x, 786, x, 822, C.yellow, 5);
      const equation =
        sorted[left].score +
        ' + 0.60 × (' +
        sorted[left + 1].score +
        ' − ' +
        sorted[left].score +
        ')';
      api.text(
        ctx,
        equation + (cut === 1 ? ' = ' + cutoff.toFixed(3) : ''),
        1750,
        910,
        39,
        C.yellow,
        'right',
      );
    }
  });
}

function coordinateProduct(ctx, state, api) {
  const { C } = api;
  const full = ffnPathFixture(false),
    broken = ffnPathFixture(true, false),
    fixed = ffnPathFixture();
  const upCut = beatCue(state, 1, 'lp-ffn-first-cut', 0.55, 0.72);
  const downCut = beatCue(state, 2, 'lp-ffn-repair', 0.04, 0.37);
  const fullSum = beatCue(state, 1, 'lp-ffn-full', 0.3, 0.46);
  const finalSum = beatCue(state, 2, 'lp-ffn-result', 0.52, 0.74);
  const slide = clamp01(downCut * 2 - 1);
  const x0 = 660,
    step = 335;
  api.text(ctx, 'Layer 0  ·  one token, one down-projection output', 135, 270, 39, C.blue);
  api.text(ctx, 'Up output', 160, 494, 43);
  api.text(ctx, 'Down weight', 160, 672, 43);
  api.focus.target('ffn-paired-projections', () => {
    full.ids.forEach((id, i) => {
      const x = x0 + (i - (i ? slide : 0)) * step;
      const color = i === 0 ? C.yellow : C.cyan;
      const dim = i ? 1 : 1 - clamp01(downCut * 2);
      api.components.fade(dim, () => api.text(ctx, id, x + 90, 382, 37, color, 'center'));
      const tile = (v, y, alpha) => {
        if (alpha > 0)
          api.components.fade(alpha, () =>
            chapterPanel(ctx, api, C, String(v).replace('-', '−'), x, y, 180, 100, color, 52),
          );
      };
      tile(full.activation[i], 425, i ? 1 : 1 - upCut);
      tile(full.down[i], 604, dim);
      if (i || upCut === 0) api.text(ctx, '×', x + 90, 580, 42, C.muted, 'center');
    });
  });
  api.focus.target('ffn-product', () => {
    let line = 'Down output = ?';
    let color = C.ink;
    if (downCut === 1) {
      line = '3 × 2 + (−1) × (−1) = ' + (finalSum === 1 ? fixed.output : '?');
      color = C.green;
    } else if (upCut === 1 && !broken.valid) {
      line =
        broken.activation.length +
        ' activation values    /    ' +
        broken.down.length +
        ' input weights';
      color = C.pink;
    } else if (fullSum === 1 && upCut === 0) {
      line = '2 × 1 + 3 × 2 + (−1) × (−1) = ' + full.output;
    }
    api.text(ctx, line, 960, 860, 49, color, 'center');
    if (upCut === 1 && downCut === 0)
      api.text(ctx, 'Which down column must go?', 960, 960, 37, C.yellow, 'center');
  });
}

export function drawFfn(ctx, scene, state, api) {
  const { C } = api;
  const beat = state.beat ?? 0;
  if (beat === 0) return scorePool(ctx, state, api);
  if (beat < 3) return coordinateProduct(ctx, state, api);
  const slice = beatCue(state, 3, 'lp-ffn-slice', 0.08, 0.44);
  api.text(
    ctx,
    'Apply the same global cutoff to the stored matrices',
    960,
    290,
    39,
    C.ink,
    'center',
  );
  api.focus.target('ffn-weights', () => {
    [0, 1].forEach((layer) => {
      const ids = FFN.filter((row) => row.layer === layer).map((row) => row.id.split('-')[1]);
      const survivors = kept
        .filter((row) => row.layer === layer)
        .map((row) => row.id.split('-')[1]);
      const x = 200 + layer * 875;
      api.text(ctx, 'Layer ' + layer, x + 245, 378, 43, C.blue, 'center');
      pairedCoordinates(ctx, api, C, x, 490, ids, survivors, slice);
    });
  });
  if (slice === 1)
    api.text(ctx, 'Layer 0 keeps n2 and n3. Layer 1 keeps n2.', 960, 961, 38, C.green, 'center');
}
export default {
  id: 'ffn',
  draw: drawFfn,
  cues: [
    'lp-ffn-sort',
    'lp-ffn-cut',
    'lp-ffn-full',
    'lp-ffn-first-cut',
    'lp-ffn-repair',
    'lp-ffn-result',
    'lp-ffn-slice',
  ],
};
