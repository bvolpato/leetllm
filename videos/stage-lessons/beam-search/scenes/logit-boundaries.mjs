import { arrow, boxOf, place } from 'vizmatic/stage';
import { heading, label, mono, namedBox } from '../../kit-narrated.mjs';
import { overflowRepairFrame } from '../../../films/beam-search/construction.mjs';
import { stablePolicy } from '../../../films/beam-search/arithmetic.mjs';
import { rotationRow } from '../parts.mjs';

export default function logitBoundaries(s, c) {
  const input = overflowRepairFrame({ beat: 0, beatP: 0 }).inputs;
  const model = stablePolicy(input);
  const board = rotationRow(s, {
    values: [0, 0, 0],
    words: ['create', 'revoke', 'rename'],
    guide: false,
  });
  board.chart.readouts.forEach((n) => n.opacity(0));
  const columns = board.top.columns(3, 'normal');
  const raw = input.map((v, i) => place(mono(String(v)), columns[i]));
  const shifted = model.shifted.map((v, i) =>
    place(mono(String(v), { color: 'cyan' }), columns[i]),
  );
  const weights = model.weights.map((v, i) =>
    place(mono(v.toFixed(3), { color: 'cyan' }), columns[i]),
  );
  const probabilities = model.probabilities.map((v, i) =>
    place(mono(v.toFixed(3), { color: 'cyan' }), columns[i]),
  );
  const overflow = place(label('exp(1000) → overflow', { color: 'red' }), board.foot, 'left');
  const repaired = place(
    label('subtract max → finite weights', { color: 'yellow' }),
    board.foot,
    'left',
  );
  const masked = place(label('All tokens masked · reject the row', { color: 'red' }), board.foot);
  const tiny = place(
    label('Underflow: p rounds to 0 · direct log p stays finite', { color: 'cyan', size: 34 }),
    board.top,
  );
  const [inputsRegion, rejectRegion] = board.plot.rows([2, 1], 'wide');
  const inputCells = inputsRegion.columns(3, 'loose');
  const maskedInputs = ['create', 'revoke', 'rename'].map((word, i) =>
    place(
      namedBox(word, { width: 360, height: 160, size: 40, sub: '−∞', subSize: 40, color: 'dim' }),
      inputCells[i],
    ),
  );
  const rejection = place(
    namedBox('No allowed token', { width: 440, height: 100, color: 'red' }),
    rejectRegion,
  );
  const links = maskedInputs.map((node) =>
    arrow(boxOf(node).point('bottom'), boxOf(rejection).point('top'), {
      stroke: 'dim',
      width: 3,
      pad: 10,
    }),
  );
  const title = heading(c.title);
  s.add(title, [board.nodes, raw, overflow]);
  c.swap('logit-boundaries-build-0', raw, shifted, { after: true });
  c.swap('logit-boundaries-build-0', overflow, repaired);
  c.swap('logit-boundaries-exponentiate', shifted, weights, { after: true });
  c.after('stable-result', () => s.play(...board.update(model.probabilities)));
  c.swap('stable-result', weights, probabilities, { after: true });
  c.swap(1, probabilities, tiny);
  c.swapAll('logit-boundaries-build-1', [links, maskedInputs, rejection, masked], {
    after: true,
    keep: [title, tiny],
  });
  c.clear(links, 0.46, 0.2);
}
