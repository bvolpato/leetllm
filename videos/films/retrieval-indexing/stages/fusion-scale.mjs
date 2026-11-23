import { picture } from '../picture.mjs';

export function drawFusionScale(ctx, scene, state, api) {
  const { C, label, rule, dot, box, target, started, after } = picture(ctx, state, api);
  if (state.beat === 0) {
    target('scale-rulers', () => {
      label('Rotation guide, word search', 145, 325, 46, C.blue);
      label('1.609', 1735, 330, 61, C.blue, 'right');
      rule(180, 445, 1700, 445, C.muted, 3);
      dot(180 + (1520 * 1.609) / 2, 445, 15, C.blue);
      label('0', 180, 510, 33, C.muted, 'center');
      label('2', 1700, 510, 33, C.muted, 'center');
      label('Credential guide, cosine', 145, 676, 46, C.green);
      label('0.994', 1735, 680, 61, C.green, 'right');
      rule(180, 782, 1700, 782, C.muted, 3);
      dot(180 + (1520 * (0.994 + 1)) / 2, 782, 15, C.green);
      [-1, 0, 1].forEach((v, i) => label(v, 180 + 760 * i, 850, 33, C.muted, 'center'));
    });
    return;
  }
  const input = [1, 2, 4];
  if (started('scale-extra')) input.push(100);
  const min = Math.min(...input),
    max = Math.max(...input);
  const numerator = 4 - min,
    span = max - min;
  const solved = after('scale-after');
  target('scale-inputs', () => {
    label('Raw scores', 150, 310, 41, C.ink);
    input.forEach((n, i) => {
      const x = 490 + 280 * i,
        c = n === 4 ? C.yellow : n === 100 ? C.pink : C.muted;
      box(x, 235, 205, 100, C.panel, c);
      label(n, x + 102, 306, 54, c, 'center');
    });
  });
  target('scale-axis', () => {
    label('Normalized score', 150, 471, 40);
    const start = 195,
      end = 1725,
      y = 678;
    rule(start, y, end, y, C.muted, 4);
    [0, 0.25, 0.5, 0.75, 1].forEach((v) => {
      const x = start + (end - start) * v;
      rule(x, y - 12, x, y + 12, C.muted);
      label(v, x, y + 64, 32, C.muted, 'center');
    });
    if (started('scale-range')) {
      const changed = max === 100;
      const oldColor = changed ? C.muted : C.yellow;
      dot(end, y, 17, oldColor);
      label(changed ? 'Before   1.000' : 'Passage scoring 4', end, y - 54, 39, oldColor, 'right');
      if (solved) {
        const next = start + ((end - start) * numerator) / span;
        const sweep = api.clamp((state.t - state.cues['scale-after'].end) / 0.7);
        rule(end, y + 18, end + (next - end) * sweep, y + 18, C.yellow, 3);
        dot(next, y, 17, C.yellow);
        label('With 100   ' + (numerator / span).toFixed(3), next, y - 54, 39, C.yellow);
      }
    }
  });
  target('scale-calc', () => {
    const waiting = max === 100 && !solved;
    const value = waiting ? '?' : (numerator / span).toFixed(solved ? 3 : 0);
    const expression = started('scale-before')
      ? '(4 − 1) / (' + max + ' − 1)  ' + (solved ? '≈' : '=') + '  ' + value
      : '(score − minimum) / (maximum − minimum)';
    label(expression, 150, 885, 49, C.yellow);
    if (started('scale-tie'))
      label('Tied scores give a span of zero. Choose a tie policy before blending.', 150, 995, 32);
    else if (waiting) label('Where does the same passage land now?', 150, 995, 35, C.ink);
  });
}
export default {
  id: 'fusion-scale',
  draw: drawFusionScale,
  cues: [
    'scale-rulers',
    'scale-range',
    'scale-before',
    'scale-extra',
    'scale-ask',
    'scale-after',
    'scale-span',
    'scale-tie',
  ],
};
