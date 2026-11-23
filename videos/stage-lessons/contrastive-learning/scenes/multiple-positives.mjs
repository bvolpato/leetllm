import { assertEqual, column, dot, line, place, segmentedBar } from 'vizmatic/stage';
import { area, heading, label, mono, note } from '../../kit-narrated.mjs';

export default function multiplePositives(s, c) {
  const [input, graph, choice, foot] = area.rows([2, 1.3, 3, 1], 'normal');
  const lanes = input.columns(3, 'loose');
  const names = ['A · rotation guide', 'B · replacement guide', 'C · KMS guide'];
  const colors = ['green', 'cyan', 'blue'];
  const probabilities = [0.999, 0.0005, 0.0005];
  const items = names.map((name, i) =>
    place(
      column(
        [
          label(name, { size: 40, color: colors[i] }),
          note(i < 2 ? 'verified answer' : 'non-match'),
          mono('P = ' + probabilities[i], { size: 42 }),
        ],
        { gap: 'normal', align: 'center' },
      ),
      lanes[i],
    ),
  );
  const mass = (p) => p.reduce((a, b) => a + b, 0);
  const [wholeRegion, tailRegion] = graph.columns([2, 1], 'loose');
  const strips = [wholeRegion, tailRegion].map((r) => r.rows([1, 1], 'tight'));
  const shares = names.map((name, i) => ({ name, value: probabilities[i], color: colors[i] }));
  const tail = probabilities[1] + probabilities[2];
  const bar = [
    place(note('Whole row', { size: 34 }), strips[0][0], 'left'),
    place(
      segmentedBar(shares, { width: wholeRegion.width - 12, max: 1, height: 44, labels: false }),
      strips[0][1],
    ),
  ];
  const zoom = [
    place(
      note('Last ' + (100 * tail).toFixed(1) + '% enlarged · B and C', { size: 34 }),
      strips[1][0],
      'left',
    ),
    place(
      segmentedBar(shares.slice(1), {
        width: tailRegion.width - 12,
        max: tail,
        height: 44,
        labels: false,
      }),
      strips[1][1],
    ),
  ];
  const [left, right] = choice.columns(2, 'loose');
  const positive = probabilities.slice(0, 2);
  const sum = mass(positive),
    massLoss = -Math.log(sum);
  const costs = positive.map((p) => -Math.log(p)),
    meanLoss = mass(costs) / costs.length;
  const sides = [left, right].map((region) => region.rows([1, 1, 1], 'normal'));
  const leftName = place(label('Credit either answer', { size: 42 }), sides[0][0]);
  const rightName = place(label('Score each answer', { size: 42 }), sides[1][0]);
  const sumTerms = place(mono('−ln(' + positive.join(' + ') + ')', { size: 37 }), sides[0][1]);
  const meanTerms = place(
    mono('(' + costs.map((v) => v.toFixed(3)).join(' + ') + ') / 2', { size: 37 }),
    sides[1][1],
  );
  const massValue = place(mono(massLoss.toFixed(5) + ' nats', { color: 'green' }), sides[0][2]);
  const meanValue = place(mono(meanLoss.toFixed(5) + ' nats', { color: 'cyan' }), sides[1][2]);
  const tau = 0.2;
  const b = positive[1];
  const pushes = [(b / sum - b) / tau, (1 / positive.length - b) / tau];
  const force = pushes.map((push, i) => {
    const rail = sides[i][1];
    const start = rail.left + 46,
      end = rail.right - 46,
      y = rail.point('center')[1];
    const color = i ? 'cyan' : 'green';
    return [
      line([start, y], [end, y], { stroke: 'dim', width: 4 }),
      dot(14, color).moveTo([start + (push / 2.5) * (end - start), y]),
      place(
        mono('+' + (i ? push.toFixed(4) : push.toExponential(2)), { color, size: 42 }),
        sides[i][2],
      ),
    ];
  });
  const forceKey = place(
    note(
      'Upward pressure on B’s score (−∂L/∂s)   ·   both rulers run from 0 to 2.5   ·   τ = 0.20',
      { size: 33 },
    ),
    foot,
  );
  const question = place(
    label('Which loss still charges for missing B?', { color: 'yellow' }),
    foot,
  );
  const tied = place(
    column(
      [
        label('Two identical copies · one target', { size: 46 }),
        mono('A  ½              B  ½', { color: 'cyan', size: 60 }),
        mono('best target share ½   →   loss ≥ ln 2', { size: 40 }),
      ],
      { gap: 'loose', align: 'center' },
    ),
    area,
  );
  assertEqual(mass(probabilities).toFixed(6), '1.000000', 'the three supplied shares sum to one');
  assertEqual(meanLoss.toFixed(5), '3.80095', 'average cost of covering the two answers');
  s.add(heading(c.title), tied);
  c.swap('positives-distinct', tied, items);
  c.show('positives-shares', bar);
  c.show('positives-tail', zoom);
  c.show('positives-rules', [leftName, rightName]);
  c.show('positives-predict', question);
  c.show('positives-pool', sumTerms);
  c.show('positives-mass', massValue, { after: true });
  c.show('positives-logs', meanTerms, { after: true });
  c.show('positives-mean', meanValue, { after: true });
  c.hide('positives-mean', question, { after: true });
  c.swap('positives-descent', [sumTerms, meanTerms, massValue, meanValue], [forceKey, force]);
}
