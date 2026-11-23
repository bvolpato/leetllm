import { place, rect, to } from 'vizmatic/stage';
import { label, namedBox, note } from '../../kit-narrated.mjs';
import { rankingResponse } from '../../../films/capstone-product-ranking-recommendation/model.mjs';
import { COLOR, open } from '../parts.mjs';

export default function synthesis(s, c) {
  const [head, board, foot] = open(s, c).rows([1, 6, 1], 'wide');
  const [input, saved] = board.columns(2, 'loose');
  const source = input.rows(3, 'wide'), output = saved.rows(3, 'wide');
  const [fromTitle, toTitle] = head.columns(2, 'loose');
  const model = rankingResponse(12);
  s.add(place(label('After 12 preference updates'), fromTitle), place(label(model.request + ' · server response'), toTitle));
  const tokens = new Map();
  for (const row of model.slate) {
    const before = source[['P4', 'P5', 'P6'].indexOf(row.id)];
    const after = output[row.rank - 1];
    const [number, slip] = after.columns([1, 3], 'normal');
    s.add(place(note('Position ' + row.rank), number), place(rect(380, 100, {
      fill: null, stroke: 'dim', dash: [8, 7], radius: 7,
    }), slip));
    const token = place(namedBox(row.id + '    ' + row.score.toFixed(3), {
      width: 360, height: 85, color: COLOR[row.id],
    }), before);
    s.add(token);
    tokens.set(row.id, { token, dest: slip.point('center') });
  }
  const ask = place(label('Which listing belongs in position two?', { color: 'yellow' }), foot);
  c.show('receipt-question', ask);
  for (const row of model.slate) {
    const { token, dest } = tokens.get(row.id);
    c.on('receipt-slot-' + row.rank, () => s.play(to(token, n => n.moveTo(dest), { duration: 0.65 })));
  }
  const versions = place(note([model.request, model.model, model.policy, 'arm ' + model.assignment].join('    ·    ')), foot);
  c.swap('receipt-context', ask, versions);
}
