import { assertEqual, indicate, numberLine, place, row } from 'vizmatic/stage';
import { heading, area, label, mono, note } from '../../kit-narrated.mjs';

export default function penaltySign(s, c) {
  const theta = 1.2,
    positive = 3,
    negative = -1;
  assertEqual(positive / theta, 2.5, 'positive seen-token penalty');
  assertEqual(negative * theta, -1.2, 'negative seen-token penalty');
  const [header, body, footer] = area.rows([1, 4.5, 1], 'loose');
  const ownership = place(
    row([label('Seen: create', { color: 'cyan' }), mono('θ = 1.2')], { gap: 'loose' }),
    header,
  );
  const regions = body.rows(2, 'loose');
  const positiveLine = place(
    numberLine({
      length: regions[0].width * 0.88,
      range: [2, 3.5],
      ticks: [2, 2.5, 3, 3.5],
      size: 34,
      labelSize: 34,
      points: [
        { name: 'create', value: positive, color: 'cyan' },
        { name: 'deploy', value: 2.8, color: 'dim' },
        { name: 'revoke', value: 2.5, color: 'blue' },
      ],
      levels: 3,
    }),
    regions[0],
  );
  const negativeLine = place(
    numberLine({
      length: regions[1].width * 0.88,
      range: [-1.5, 0],
      ticks: [-1.5, -1, -0.5, 0],
      size: 34,
      labelSize: 34,
      points: [{ name: 'seen negative score', value: negative, color: 'cyan' }],
    }),
    regions[1],
  );
  const winner = place(label('deploy wins at 2.8', { color: 'yellow' }), footer);
  const zero = place(
    note('0 stays 0 · once per distinct seen token · lower score still eligible'),
    footer,
  );
  s.add(heading(c.title), [ownership, positiveLine, negativeLine]);
  c.on('penalty-sign-build-0', () => s.play(indicate(ownership, { scale: 1, color: 'yellow' })));
  c.on('positive-score', () =>
    s.play(positiveLine.move({ create: positive / theta }, { duration: 1.4 })),
  );
  c.on('negative-score', () =>
    s.play(negativeLine.move({ 'seen negative score': negative * theta }, { duration: 1.4 })),
  );
  c.show('penalty-sign-build-1', winner, { after: true });
  c.swap('penalty-sign-build-2', winner, zero, { after: true });
}
