import { mean, predict } from '../arithmetic.mjs';
import { features, forest, rows, samples } from '../fixtures.mjs';
import { drawConstructionText as label } from '../defaults.mjs';

const r3 = rows[2];
const members = samples.map((sample, index) => ({
  sample,
  count: sample.filter((id) => id === 2).length,
  fit: forest[index],
  feature: features[index],
  score: predict(forest[index], r3),
}));

export function drawForest(ctx, scene, state, api) {
  const { C } = api;
  const beat = state.beat ?? 0;
  const p = state.beatP ?? 0;
  const visible = beat > 0 ? 8 : Math.min(8, 1 + Math.floor(8 * api.phase(p, 0.03, 0.81)));
  const routed = (middle) =>
    beat > 1 ||
    (beat === 1 &&
      api.focus.progress(
        middle ? 'middle-leaf' : 'outer-leaves',
        middle ? api.phase(p, 0.6, 0.75) : api.phase(p, 0.33, 0.5),
      ) === 1);
  const full =
    beat > 2 || (beat === 2 && api.focus.progress('forest-mean', api.phase(p, 0, 0.15)) === 1);
  const remove = beat === 4 ? api.focus.progress('exclude-middle', api.phase(p, 0.05, 0.3)) : 0;
  const oob = beat === 4 && api.focus.progress('oob-score', api.phase(p, 0.32, 0.52)) === 1;
  const included = members.filter((m) => remove < 1 || m.count === 0);

  members.forEach(({ sample, count, fit, feature, score }, i) => {
    const cx = 375 + i * 585;
    const x = cx - 208;
    label(ctx, api, 'Tree ' + (i + 1), cx, 268, 43);
    const drawSample = () => {
      sample.slice(0, visible).forEach((id, slot) => {
        const at = x + (slot % 4) * 106;
        const y = 325 + Math.floor(slot / 4) * 76;
        const accent = id === 2 ? C.yellow : C.muted;
        api.rect(ctx, at, y, 94, 63, C.panel, accent, 8);
        label(ctx, api, 'R' + (id + 1), at + 47, y + 44, 32, accent);
      });
    };
    if (i === 1) api.focus.target('middle-sample', drawSample);
    else drawSample();
    label(
      ctx,
      api,
      remove === 0 ? visible + ' draws' : 'R3 drawn ' + count + (count === 1 ? ' time' : ' times'),
      cx,
      532,
      31,
      C.muted,
    );
    if (beat === 0) return;
    const left = r3[feature] <= fit.cut;
    const branch =
      (feature === 0 ? 'Ambiguity ' : 'Support ') +
      r3[feature] +
      (left ? ' ≤ ' : ' > ') +
      fit.cut.toFixed(2);
    api.focus.target(i === 1 ? 'middle-route' : 'outside-route', () =>
      label(ctx, api, branch, cx, 610, 36, C.cyan),
    );
    if (!routed(i === 1)) return;
    const group = sample.filter((id) => rows[id][feature] <= fit.cut === left);
    const positives = group.filter((id) => rows[id][2]).length;
    const dropping = remove > 0 && count > 0;
    label(
      ctx,
      api,
      dropping ? 'Used R3 to fit' : positives + ' reviews / ' + group.length + ' rows',
      cx,
      675,
      31,
      dropping ? C.yellow : C.ink,
    );
    const y = 758;
    const scoreColor = dropping ? C.muted : C.ink;
    api.circle(ctx, cx, y, 42, C.panel, scoreColor, 4);
    label(ctx, api, String(score), cx, y + 17, 49, scoreColor);
    if (!dropping || remove < 1)
      api.line(ctx, cx, y + 43, cx, api.lerp(851, y + 43, dropping ? remove : 0), C.cyan, 4);
  });
  if (beat === 0) {
    label(
      ctx,
      api,
      'Each slot draws from the same eight requests, with replacement.',
      960,
      770,
      40,
    );
    return;
  }
  if (routed(false)) {
    api.line(ctx, 375, 851, 1545, 851, C.cyan, 4);
    api.line(ctx, 960, 851, 960, 892, C.cyan, 4);
  }
  const terms = included.map((m) => m.score).join(' + ');
  let message = 'Mean leaf score for R3 = ?';
  if (full) {
    const sum = included.reduce((total, m) => total + m.score, 0);
    const result =
      remove === 1
        ? oob
          ? mean(included.map((m) => m.score)).toFixed(2)
          : '?'
        : sum + '/' + included.length;
    message =
      (remove === 1 ? 'Out-of-bag   ' : 'Full forest   ') +
      '(' +
      terms +
      ') / ' +
      included.length +
      '  =  ' +
      result;
  }
  if (beat === 3) message = 'Which tree trained on R3?';
  api.focus.target('forest-sum', () => label(ctx, api, message, 960, 982, 53, C.yellow));
}
export default {
  id: 'forest',
  draw: drawForest,
  cues: ['outer-leaves', 'middle-leaf', 'forest-mean', 'exclude-middle', 'oob-score'],
};
