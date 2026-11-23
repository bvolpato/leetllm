import { dynamic, group, line, dot } from 'vizmatic/stage';
import {
  C,
  assertEqual,
  body,
  change,
  foot,
  note,
  place,
  readout,
  start,
  vectorPlane,
} from '../parts.mjs';
import { dot as product } from '../../../films/grouped-query-attention/arithmetic.mjs';

export default function positionSplit(s, c) {
  start(s, c.title);
  const W = [
      [1, 2],
      [0, 1],
    ],
    latent = [1, 2],
    q = [1, 0];
  const base = W.map((row) => product(row, latent));
  const rotated = [-base[1], base[0]];
  const transpose = W[0].map((_, i) => W.map((row) => row[i]));
  const absorbed = [q, [q[1], -q[0]]].map((v) => transpose.map((row) => product(row, v)));
  const scores = [base, rotated].map((v) => product(q, v));
  assertEqual(
    absorbed.map((v) => product(v, latent)),
    scores,
    'regrouped scores by position',
  );
  assertEqual(scores, [5, -2], 'horizontal projections');
  const [picture, ledger] = body.columns(2, 'loose');
  const [title, plot] = picture.rows([1, 6], 'normal');
  s.add(place(note('Historical key · fixed query (1, 0)'), title, 'left'));
  const plane = vectorPlane(s, plot, { extent: 2.45, origin: [0.37, 0.81] });
  const angle = s.value(0);
  s.add(plane.vector(q, C.query, 9));
  s.add(
    dynamic(() => {
      const a = angle.value;
      const k = [
        base[0] * Math.cos(a) - base[1] * Math.sin(a),
        base[0] * Math.sin(a) + base[1] * Math.cos(a),
      ];
      const projection = plane.xy([k[0], 0]);
      return group(
        plane.vector(k, C.key),
        line(plane.xy(k), projection, { stroke: C.position, width: 4, dash: [8, 6] }),
        dot(10, C.result).at(...projection),
      );
    }),
  );
  change(s, c, 'turn', angle, Math.PI / 2, false, 1.45);
  const [identity, original, turn, current] = ledger.rows([1, 2, 1, 2], 'normal');
  const pair = (v) => '(' + v.join(', ').replaceAll('-', '−') + ')';
  readout(s, c, identity, [[null, 'Position 0    ·    identity rotation']]);
  readout(s, c, original, [
    ['identity', 'Key ' + pair(base) + '     score ' + scores[0], C.key, true],
    ['first-q', 'q′ = ' + pair(absorbed[0]) + '     score ' + scores[0], C.query, true],
  ]);
  readout(s, c, turn, [['turn', 'Position 1    ·    90° rotation']]);
  readout(s, c, current, [
    ['ask', 'Same latent (1, 2). Same q′?', C.result],
    ['key', 'Rotated key ' + pair(rotated), C.key, true],
    ['negative', 'Fixed query reads −2', C.result, true],
    ['next-q', 'q′ = ' + pair(absorbed[1]) + '     score −2', C.query, true],
  ]);
  readout(
    s,
    c,
    foot,
    [
      ['axis', 'Gold point = score along the fixed query axis'],
      ['back', 'Absorbed query at position s = Wᵀ Rₛᵀ q     ·     q is the fixed rotated query'],
      ['split', 'Shared content score   +   position-specific score'],
      ['scale', 'Across visible positions:   weights = softmax((content + position) / √192)'],
      [
        'coords',
        'Each cached position: 512 content coordinates + 64 positional coordinates',
        'ink',
      ],
    ],
    { size: 36, align: 'center' },
  );
}
