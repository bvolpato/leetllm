import { mean, variance } from '../arithmetic.mjs';
import { epsilon } from '../fixtures.mjs';
import { placementTrace, placementTravel } from '../model.mjs';
import { text } from '../defaults.mjs';
import { landed, motion } from '../timing.mjs';

const columns = [365, 785, 1205, 1625];
const labels = {
  pre: ['Token', 'LayerNorm', 'Branch F', 'Add skip'],
  post: ['Token', 'Branch F', 'Add skip', 'LayerNorm'],
};

function vectorAt(ctx, api, values, cx, baseline) {
  const { C } = api;
  values.forEach((value, i) => {
    const x = cx + (i - 1.5) * 77;
    const height = Math.abs(value) * 8.4;
    const color = i === 0 ? C.yellow : C.cyan;
    if (height > 0) api.rect(ctx, x - 20, value > 0 ? baseline - height : baseline, 40, height, color, undefined, 1);
    text(ctx, api, value.toFixed(2), x, baseline + 58, 28, color, 'center');
  });
}

function route(ctx, api, kind, baseline, trace, travel) {
  const { C } = api;
  const add = kind === 'pre' ? 3 : 2;
  const wireY = baseline - 174;
  text(ctx, api, kind === 'pre' ? 'Pre-LN' : 'Post-LN', 76, baseline - 26, 37, C.ink);
  api.path(ctx, [
    { x: columns[0] - 112, y: baseline - 111 }, { x: columns[0] - 112, y: wireY },
    { x: columns[add] + 90, y: wireY }, { x: columns[add] + 90, y: baseline - 111 },
  ], { color: C.blue, width: 3 });
  columns.forEach((x, i) => {
    const active = Math.min(3, Math.ceil(travel)) === i;
    text(ctx, api, labels[kind][i], x, baseline - 126, 34, active ? C.ink : C.muted, 'center');
    api.line(ctx, x - 148, baseline, x + 148, baseline, C.muted, 2);
    if (travel >= i) {
      const paint = () => vectorAt(ctx, api, trace[i], x, baseline);
      if (i === Math.floor(travel)) api.focus.target(kind + '-readout', paint);
      else paint();
    }
    if (i === 0) return;
    const from = columns[i - 1] + 158;
    const to = x - 158;
    api.arrow(ctx, from, baseline, to, baseline, C.muted, 3);
    if (travel > i - 1 && travel < i)
      api.circle(ctx, from + (to - from) * (travel - i + 1), baseline, 9, C.yellow);
  });
  const index = Math.min(3, Math.floor(travel));
  const value = trace[index][0];
  let detail = `First feature   ${value.toFixed(3)}`;
  if (index === add && kind === 'post') {
    detail = 'Sum     [  ' + trace[index].map(v => v.toFixed(2)).join('     ') + '  ]';
  } else if (index === add) {
    detail = `First output    ${trace[0][0].toFixed(3)} + (${trace[index - 1][0].toFixed(3)}) ≈ ${value.toFixed(3)}`;
  } else if (labels[kind][index] === 'LayerNorm') {
    const input = trace[index - 1];
    const divisor = Math.sqrt(variance(input) + epsilon);
    detail = `First feature    (${input[0].toFixed(2)} − ${mean(input).toFixed(2)}) / ${divisor.toFixed(3)} ≈ ${value.toFixed(3)}`;
  } else if (labels[kind][index] === 'Branch F') {
    detail = `First write    0.2 × (${trace[index - 1][0].toFixed(3)}) + 0.1 ≈ ${value.toFixed(3)}`;
  }
  api.focus.target(kind + '-readout', () =>
    text(ctx, api, detail, 960, baseline + 119, 38, C.yellow, 'center'),
  );
}

export function drawPlacement(ctx, scene, state, api) {
  const { C } = api;
  const first = placementTrace();
  const repeat = motion(state, 'second-block', 4, 0.01, 0.25);
  const second = repeat > 0;
  const pre = second ? placementTrace(first.pre[3]).pre : first.pre;
  const post = second ? placementTrace(first.post[3]).post : first.post;
  const preTravel = placementTravel(state.beat, state.beatP, 0, state.cues);
  const postTravel = placementTravel(state.beat, state.beatP, 1, state.cues);
  api.focus.target('block-number', () => text(ctx, api, `Block ${second ? 2 : 1}`, 100, 228, 38, C.ink));
  text(ctx, api, 'F(z) = 0.2z + 0.1', 960, 226, 34, C.ink, 'center');
  text(ctx, api, 'blue wire = original token', 1810, 226, 28, C.blue, 'right');
  route(ctx, api, 'pre', 470, pre, preTravel);
  route(ctx, api, 'post', 805, post, postTravel);

  let footer = 'LayerNorm over four features    ·    gain 1    ·    shift 0    ·    ε = 0.00001';
  if (!second && postTravel >= 2 && postTravel < 3)
    footer = 'After LayerNorm, will the first feature of this sum be positive or negative?';
  if (!second && postTravel < 3 && landed(state, 'post-sign', 3, 0.01, 0.09))
    footer = 'Negative    ·    the first feature of the sum lies below its mean';
  if (!second && postTravel === 3)
    footer = `Post-LN sum    ·    first feature ${post[2][0].toFixed(1)}    ·    mean ${mean(post[2]).toFixed(1)}`;
  if (second && repeat === 1)
    footer = `Block 2 output means    ·    Pre-LN   ${mean(pre[3]).toFixed(2)}         Post-LN   ${Math.abs(mean(post[3])).toFixed(2)}`;
  api.focus.target('post-verdict', () => text(ctx, api, footer, 960, 1018, 34, C.ink, 'center'));
}
export default {
  id: 'placement', draw: drawPlacement,
  cues: ['pre-read', 'pre-write', 'pre-add', 'post-write', 'post-add', 'post-sign', 'post-normalize', 'second-block'],
};
