import { sum } from '../arithmetic.mjs';
import { progress } from '../phrase-clock.mjs';

const events = [
  { ids: [21], sampled: [-0.1], cue: 'append-call' },
  { ids: [60, 61], cue: 'append-observation' },
  { ids: [22, 23], sampled: [-0.4, -0.7], cue: 'append-answer' },
];

export function drawNativeAppend(ctx, scene, state, api) {
  const { C } = api;
  const p = (id) => progress(scene, state, id);
  const positions = events.flatMap((event) => {
    const visible = Math.ceil(p(event.cue) * event.ids.length);
    return event.ids.slice(0, visible).map((id, i) => ({
      id,
      target: Number(Boolean(event.sampled)),
      logP: event.sampled?.[i] ?? 0,
    }));
  });
  const selected = positions.filter((token) => token.target);
  return api.focus.target('append-receipt', () => {
    api.text(ctx, 'Prompt  [101, 102, 103]', 130, 286, 39, C.muted);
    api.text(ctx, `Response length  ${positions.length}`, 1770, 286, 39, C.ink, 'right');
    const columns = (i) => 530 + 266 * i;
    for (const [label, y] of [
      ['Response ID', 461],
      ['Producer', 568],
      ['Loss mask', 694],
      ['Log p', 794],
    ])
      api.text(ctx, label, 125, y, 33, C.muted);
    positions.forEach(({ id, target, logP }, i) => {
      const x = columns(i);
      const color = target ? C.blue : C.yellow;
      api.rect(ctx, x - 100, 383, 200, 114, C.panel, color, 10);
      api.text(ctx, String(id), x, 464, 58, color, 'center');
      api.text(ctx, target ? 'model' : 'tool', x, 568, 39, color, 'center');
      api.text(ctx, String(target), x, 695, 47, C.ink, 'center');
      api.text(ctx, String(logP).replace('-', '−'), x, 794, 39, color, 'center');
    });
    let line =
      positions.length < 5
        ? 'Append each event with its producer.'
        : 'What negative mean do the model’s targets give?';
    if (p('append-mean') === 1) {
      const total = -sum(selected.map((token) => token.logP));
      line = `${selected.length} targets   /   negative mean = ${total.toFixed(1)} ÷ ${selected.length} = ${(total / selected.length).toFixed(1)}`;
    }
    if (state.beat === 2) line = 'Check sampled probabilities at the time each event arrives.';
    api.text(ctx, line, 960, 945, 40, state.beat === 0 ? C.yellow : C.cyan, 'center');
  });
}
export default {
  id: 'native-append',
  draw: drawNativeAppend,
  cues: ['append-call', 'append-observation', 'append-answer', 'append-mean', 'append-check'],
};
