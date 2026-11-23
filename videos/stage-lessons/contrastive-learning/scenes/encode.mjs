import { arrow, boxOf, column, dot, indicate, place, to, fadeIn, fadeOut } from 'vizmatic/stage';
import { heading, label, mono, namedBox, note } from '../../kit-narrated.mjs';
import { dogComparison } from '../parts.mjs';
export default function encode(s, c) {
  const p = dogComparison();
  const [inputRegion, encRegion, poolRegion, normRegion, outputRegion] = p.right.rows(
    [3, 1, 1, 1, 1],
    'normal',
  );
  const words = ['A dog is running', 'a puppy runs', 'a dog sleeps', 'the sky is blue'];
  const colors = ['cyan', 'green', 'pink', 'blue'];
  const inputs = place(
    column(
      words.map((w, i) => label(w, { size: 34, color: colors[i] })),
      { gap: 'tight', align: 'center' },
    ),
    inputRegion,
  );
  const formatted = place(
    column(
      words.map((w, i) => label((i ? 'passage: ' : 'query: ') + w, { size: 34, color: colors[i] })),
      { gap: 'tight', align: 'center' },
    ),
    inputRegion,
  );
  const enc = place(
    namedBox('shared encoder θ', { width: 550, height: 68, color: 'dim' }),
    encRegion,
  );
  const pool = place(
    namedBox('pool valid token states: mean(hᵢ)', { width: 650, height: 68, color: 'dim' }),
    poolRegion,
  );
  const norm = place(
    namedBox('normalize: v / ||v||₂', { width: 550, height: 68, color: 'dim' }),
    normRegion,
  );
  const output = place(note('supplied unit vectors → same scoring space'), outputRegion);
  const links = [
    [inputs, enc],
    [enc, pool],
    [pool, norm],
  ].map(([a, b]) =>
    arrow([boxOf(a).cx, boxOf(a).bottom + (a === inputs ? 18 : 0)], boxOf(b).point('top'), {
      stroke: 'dim',
      width: 3,
      pad: 4,
    }),
  );
  const particles = colors.map((color, i) =>
    dot(8, color).moveTo([
      encRegion.point('center')[0] + (i - 1.5) * 30,
      boxOf(inputs).bottom + 10,
    ]),
  );
  const recheck = place(
    column(
      [
        label('New input format', { size: 44, color: 'cyan' }),
        note('Encode the passages again.'),
        note('Check the held-out ranking.'),
      ],
      { gap: 'normal', align: 'center' },
    ),
    p.left,
  );
  s.add(heading(c.title), p.plane, inputs, enc, pool, norm, links, output);
  c.on('repair-encode-pooling', () => {
    for (const [source, target] of [
      [inputs, enc],
      [enc, pool],
      [pool, norm],
    ]) {
      particles.forEach((n, i) =>
        n.moveTo([encRegion.point('center')[0] + (i - 1.5) * 30, boxOf(source).bottom + 10]),
      );
      s.play(fadeIn(particles, { duration: 0.1 }));
      s.play(
        ...particles.map((n) =>
          to(n, (item) => item.moveTo([item.center[0], boxOf(target).top - 10]), {
            duration: 0.35,
          }),
        ),
      );
      s.play(fadeOut(particles, { duration: 0.1 }));
    }
  });
  c.on('encode-candidate-vector-3-b1-1', () => s.play(indicate(output, { scale: 1 })));
  c.on('encode-candidate-vector-0-b2-1', () => s.play(indicate(p.names[0], { scale: 1 })));
  c.on('encode-unit-vector-contract-b2-2', () =>
    s.play(indicate(norm, { scale: 1 }), indicate(p.plane[0], { scale: 1 })),
  );
  c.swap('repair-encode-format', inputs, formatted);
  c.swap('encode-candidate-vector-3-b3-1', [p.plane, output], recheck);
}
