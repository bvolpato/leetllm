import { arrow, assertEqual, column, dot, dynamic, group, line, place } from 'vizmatic/stage';
import { heading, label, mono, note } from '../../kit-narrated.mjs';
import { FRESH_BASIS, FOOT, LEFT, RIGHT, TOP, savedCoordinates, unitFinite } from '../parts.mjs';

const mu = [2, 1],
  rotation = [4, 2],
  merge = [0, 2],
  request = [3, 3];
const colors = { rotation: 'green', merge: 'blue', query: 'cyan' };
const signed = (x) => Number(x.toFixed(2)).toString().replace('-', '−');
const pair = (v) => '(' + v.map(signed).join(', ') + ')';
const minusMean = (v) => v.map((x, i) => x - mu[i]);
const cos = (a, b) => unitFinite(a).reduce((sum, x, i) => sum + x * unitFinite(b)[i], 0);

export default function freshProjection(s, c) {
  const r = savedCoordinates(rotation, mu, FRESH_BASIS),
    m = savedCoordinates(merge, mu, FRESH_BASIS);
  const q = savedCoordinates(request, mu, FRESH_BASIS);
  const mixed = savedCoordinates(
    request,
    mu,
    FRESH_BASIS.map((row) => row.map((x) => -x)),
  );
  const aligned = [cos(r, q), cos(m, q)],
    flipped = [cos(r, mixed), cos(m, mixed)];
  const winner = ([a, b]) => (a > b ? 'rotation' : 'merge');
  assertEqual(aligned.map(signed).join(), '0.8,0', 'shared artifact scores');
  assertEqual(flipped.map(signed).join(), '−0.8,0', 'mixed artifact scores');
  assertEqual(winner(aligned), 'rotation', 'shared artifact first result');
  assertEqual(winner(flipped), 'merge', 'mismatched worker first result');
  const title = heading(c.title);
  const [caption, diagram] = LEFT.rows([0.8, 6], 'normal');
  const center = s.value(0);
  const u = Math.min(diagram.width / 7, diagram.height / 4.7);
  const world = ([x, y]) => [diagram.cx + (x - 2.1) * u, diagram.cy - (y - 1.65) * u];
  const origin = () => world(mu.map((v) => v * center.value));
  const rawTips = [rotation, request].map(world);
  const inputTitle = place(note('Original coordinate space'), caption);
  const source = dynamic(() =>
    group(
      line(world([-0.6, 0]), world([4.7, 0]), { stroke: 'dim', width: 2 }),
      line(world([0, -0.4]), world([0, 3.8]), { stroke: 'dim', width: 2 }),
      ...rawTips.map((tip, i) =>
        group(
          arrow(origin(), tip, { stroke: i ? colors.query : colors.rotation, width: 6, pad: 0 }),
          dot(11, i ? colors.query : colors.rotation).moveTo(tip),
          label((i ? 'query ' : 'rotation ') + pair(i ? request : rotation), {
            size: 33,
            color: i ? colors.query : colors.rotation,
          }).moveTo([tip[0] + (i ? -55 : 60), tip[1] - (i ? 62 : 40)]),
        ),
      ),
      dot(12, 'yellow').moveTo(origin()),
      mono('origin ' + pair(mu.map((v) => v * center.value)), { size: 31, color: 'yellow' }).moveTo(
        [diagram.cx, diagram.bottom - 16],
      ),
    ),
  );
  const basis = FRESH_BASIS.map((v, i) => {
    const along = (n) => world(mu.map((x, j) => x + v[j] * n));
    return group(
      line(along(-1.15), along(2.8), { stroke: 'dim', width: 3, dash: [9, 8] }),
      mono('v' + (i + 1), { size: 30 }).moveTo([
        along(2.8)[0] + (i ? -32 : 38),
        along(2.8)[1] + (i ? -12 : 3),
      ]),
    );
  });
  const contract = place(
    mono(
      'μ = ' + pair(mu) + '     v1 = ' + pair(FRESH_BASIS[0]) + '     v2 = ' + pair(FRESH_BASIS[1]),
      { size: 39 },
    ),
    TOP,
  );
  const old = cos(rotation, request);
  const original = place(
    column(
      [
        label('Rotation and the key question'),
        mono('cos ≈ ' + old.toFixed(3), { size: 60 }),
        note('Measured from the original origin'),
      ],
      { gap: 'normal' },
    ),
    RIGHT,
  );
  const centered = place(
    column(
      [
        mono('rotation − μ = ' + pair(minusMean(rotation)), { color: colors.rotation, size: 37 }),
        mono('query − μ = ' + pair(minusMean(request)), { color: colors.query, size: 37 }),
      ],
      { gap: 'wide' },
    ),
    RIGHT,
  );
  const calculations = place(
    column(
      [
        label('Coordinates on the saved axes', { size: 36 }),
        mono('rotation  ' + pair(r), { color: colors.rotation, size: 41 }),
        mono('query    1 × .6 + 2 × .8', { size: 33, color: colors.query }),
        mono('         1 × (−.8) + 2 × .6', { size: 33, color: colors.query }),
      ],
      { gap: 'normal' },
    ),
    RIGHT,
  );
  const worked = place(
    column(
      [
        mono('rotation  ' + pair(r), { color: colors.rotation, size: 41 }),
        mono('query     ' + pair(q), { color: colors.query, size: 41 }),
        mono('cos = (4.4 − 0.4) / 5', { size: 35 }),
        mono('= ' + signed(aligned[0]), { size: 56, color: 'yellow' }),
      ],
      { gap: 'normal' },
    ),
    RIGHT,
  );
  const predict = place(label('What are the two query coordinates?', { color: 'yellow' }), FOOT);
  const centeredMetric = place(
    label('Changing the origin changed cosine. Both axes are still present.', { size: 37 }),
    FOOT,
  );

  // The replay takes place entirely in the stored coordinate system.
  const storedTitle = place(note('Indexed coordinates on v1 and v2'), caption);
  const scale = Math.min(diagram.height / 5.5, diagram.width / 6.6);
  const at = ([x, y]) => [diagram.cx + x * scale, diagram.cy - y * scale];
  const axes = [
    line(at([-2.8, 0]), at([2.8, 0]), { stroke: 'dim', width: 2 }),
    line(at([0, -2.6]), at([0, 2.55]), { stroke: 'dim', width: 2 }),
    mono('v1', { size: 29 }).moveTo(at([3.22, 0])),
    mono('v2', { size: 29 }).moveTo(at([0, 2.9])),
  ];
  const vector = (name, values, dx, dy) => {
    const tip = at(values),
      color = colors[name];
    return group(
      arrow(at([0, 0]), tip, { stroke: color, width: 7, pad: 0 }),
      label(name, { color, size: 33 }).moveTo([tip[0] + dx, tip[1] + dy]),
    );
  };
  const documents = [vector('rotation', r, 32, 39), vector('merge', m, -54, -22)];
  const sharedQuery = vector('query', q, 54, -26),
    wrongQuery = vector('query', mixed, -60, 29);
  const queryHeader = (coords) =>
    place(
      label(
        '18-day key     •     Served query ' + pair(coords) + '     •     Same two indexed clauses',
        { size: 39 },
      ),
      TOP,
    );
  const input = queryHeader(q),
    incompatible = queryHeader(mixed);
  const [tableHead, ...rows] = RIGHT.rows([0.7, 1.2, 1.2], 'normal');
  const ranks = place(label('Cosine with the served query', { size: 38 }), tableHead);
  const rails = rows.flatMap((row, i) => {
    const x = row.cx,
      y = row.cy + 20,
      width = row.width * 0.79;
    return [
      label(i ? 'merge' : 'rotation', {
        color: i ? colors.merge : colors.rotation,
        size: 37,
      }).moveTo([x - width / 2 + 65, y - 54]),
      line([x - width / 2, y], [x + width / 2, y], { stroke: 'dim', width: 3 }),
      ...[-1, 0, 1].map((v) =>
        group(
          line([x + (v * width) / 2, y - 8], [x + (v * width) / 2, y + 8], {
            stroke: 'dim',
            width: 3,
          }),
          mono(signed(v), { size: 29, color: 'dim' }).moveTo([x + (v * width) / 2, y + 40]),
        ),
      ),
    ];
  });
  const scores = (values) =>
    values.map((v, i) => {
      const row = rows[i],
        x = row.cx + v * row.width * 0.395,
        y = row.cy + 20;
      const color = i ? colors.merge : colors.rotation;
      return group(
        dot(14, color).moveTo([x, y]),
        mono(signed(v), { color, size: 38 }).moveTo([x, y + 74]),
      );
    });
  const goodScores = scores(aligned),
    badScores = scores(flipped);
  const mixedAsk = place(
    label('If only the query axes flip, which clause will rank first?', {
      color: 'yellow',
      size: 37,
    }),
    FOOT,
  );
  const failure = place(
    label('Returned: failed security scan blocks a merge.', { color: colors.merge, size: 40 }),
    FOOT,
  );
  const repair = place(
    label('Replay the same query with the saved index basis.', { color: 'yellow' }),
    FOOT,
  );
  const ticket = place(
    label('Returned: keys over 14 days require a rotation ticket.', {
      color: colors.rotation,
      size: 40,
    }),
    FOOT,
  );
  s.add(title, source, inputTitle, original);
  c.show('fresh-artifact', contract);
  c.on('fresh-origin', () => s.play(center.to(1, { duration: 1.6 })));
  c.swap('fresh-origin', original, centered);
  c.show('fresh-axes', basis);
  c.swap('fresh-operands', centered, calculations);
  c.show('fresh-ask', predict);
  c.hide('fresh-result', predict);
  const queryResult = place(
    column(
      [
        mono('rotation  ' + pair(r), { color: colors.rotation, size: 41 }),
        mono('query     ' + pair(q), { color: colors.query, size: 41 }),
      ],
      { gap: 'wide' },
    ),
    RIGHT,
  );
  c.swap('fresh-result', calculations, queryResult, { after: true });
  c.swap('fresh-cos', queryResult, worked, { after: true });
  c.show('fresh-cos', centeredMetric, { after: true });
  c.swap(
    'fresh-store',
    [source, inputTitle, worked, basis, contract, centeredMetric],
    [axes, documents, storedTitle, sharedQuery, input, rails, ranks, goodScores[0]],
  );
  c.show('fresh-zero', goodScores[1], { after: true });
  c.show('fresh-other-worker', mixedAsk);
  c.hide('fresh-mixed', [goodScores[0], mixedAsk], { after: true });
  c.swap('fresh-mixed', [input, sharedQuery], [incompatible, wrongQuery], { after: true });
  c.show('fresh-negative', badScores[0], { after: true });
  c.show('fresh-winner', failure, { after: true });
  c.swap('fresh-repair', failure, repair);
  c.hide('fresh-repair', badScores[0]);
  c.swap('fresh-replay', [incompatible, wrongQuery], [input, sharedQuery]);
  c.show('fresh-recovered', goodScores[0], { after: true });
  c.swap('fresh-ticket', repair, ticket, { after: true });
  const decision = place(
    label('18 days > 14 days     →     Open a rotation ticket.', {
      color: colors.rotation,
      size: 46,
    }),
    FOOT,
  );
  c.swap('fresh-limit', ticket, decision, { after: true });
}
