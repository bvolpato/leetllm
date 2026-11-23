import { attentionExample } from '../model.mjs';
import { sceneClock } from '../scene-clock.mjs';

const equal = attentionExample(false),
  boosted = attentionExample(true);
const show = (value) => String(Number(value.toFixed(4)));

export function drawMassMerge(ctx, scene, state, api) {
  const clock = sceneClock(scene, state);
  const changed = clock.done('raise-score');
  const m = changed ? boosted : equal;
  const partitioned = clock.done(changed ? 'new-share' : 'three-shares');
  const result = clock.done(changed ? 'new-output' : 'weighted-output');
  const colors = [api.C.blue, api.C.blue, api.C.cyan];
  api.focus.target('attention-mass', () => {
    m.values.forEach((value, i) => {
      const cx = 370 + 590 * i;
      const introduced =
        i === 0 || (i === 1 ? clock.progress('two-keys') > 0 : clock.progress('one-key') > 0);
      api.text(ctx, `GPU ${Number(i === 2)}   ·   key ${i + 1}`, cx, 280, 37, colors[i], 'center');
      if (!introduced) return;
      api.text(ctx, 'value ' + value, cx, 410, 72, colors[i], 'center');
      api.text(
        ctx,
        changed && i === 2 ? 'score 1000 + ln 2' : 'score 1000',
        cx,
        488,
        41,
        api.C.ink,
        'center',
      );
      if (clock.done('shifted') && (!changed || clock.done('rescale')))
        api.text(ctx, `shifted weight  ${show(m.weights[i])}`, cx, 572, 35, api.C.muted, 'center');
    });
    api.text(ctx, 'Attention weight per key', 160, 670, 40, api.C.ink);
    const x = 160,
      y = 704,
      width = 1600,
      height = 94;
    api.rect(ctx, x, y, width, height, api.C.panel, api.C.muted, 0);
    if (partitioned) {
      let at = x;
      m.shares.forEach((share, i) => {
        const length = share * width;
        api.rect(ctx, at + 2, y, length - 4, height, colors[i], undefined, 0);
        api.text(
          ctx,
          `key ${i + 1}   ·   1/${Math.round(1 / share)}`,
          at + length / 2,
          y + 61,
          36,
          api.C.bg,
          'center',
        );
        at += length;
      });
    } else {
      api.text(
        ctx,
        'What fraction of the weight goes to the nine?',
        960,
        y + 61,
        43,
        api.C.ink,
        'center',
      );
    }
    if (changed) {
      equal.shares.forEach((share, i) =>
        api.rect(
          ctx,
          x + (width * i) / 3 + 2,
          y + height + 18,
          share * width - 4,
          16,
          colors[i],
          undefined,
          0,
        ),
      );
      api.text(ctx, 'First run   ·   three equal scores', x, y + height + 77, 31, api.C.muted);
    }
    let footer = 'One query looks up three values';
    if (result)
      footer = `Weighted sum  ${show(m.numerator)}    ÷    total mass  ${show(m.mass)}    =    ${show(m.output)}`;
    if (clock.done('wrong-mean') && !changed)
      footer = `Equal votes for two GPUs give ${show(m.wrongMean)}.  Equal votes for three keys give ${show(m.output)}.`;
    if (changed && !result) footer = 'Shared maximum  M = 1000 + ln 2';
    if (state.beat === 4) footer = 'For each GPU, multiply its mass and weighted sum by exp(m − M)';
    api.text(ctx, footer, 960, changed ? 940 : 904, 39, api.C.ink, 'center');
    if (clock.done('empty-rank'))
      api.text(
        ctx,
        'Empty GPU   ·   adds 0 mass and 0 weighted value   ·   participates in the collective',
        960,
        993,
        31,
        api.C.muted,
        'center',
      );
  });
}
export default {
  id: 'mass-merge',
  draw: drawMassMerge,
  cues: [
    'two-keys',
    'one-key',
    'shifted',
    'three-shares',
    'weighted-output',
    'wrong-mean',
    'raise-score',
    'rescale',
    'new-share',
    'new-output',
    'empty-rank',
  ],
};
