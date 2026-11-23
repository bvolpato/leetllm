import { arrow, assertEqual, column, dot, dynamic, group, line, place } from 'vizmatic/stage';
import { heading, label, mono, note } from '../../kit-narrated.mjs';
import { FOOT, LEFT, RIGHT, TOP, unitFinite } from '../parts.mjs';

export default function pcaQuery(s, c) {
  const document = [3, 1],
    query = [1, 3],
    mean = [2, 2];
  const dotProduct = (a, b) => a.reduce((sum, x, i) => sum + x * b[i], 0);
  const centered = (v) => v.map((x, i) => x - mean[i]);
  const d = centered(document),
    q = centered(query);
  const old = dotProduct(unitFinite(document), unitFinite(query));
  const next = dotProduct(unitFinite(d), unitFinite(q));
  assertEqual(old.toFixed(2), '0.60', 'cosine from the original origin');
  assertEqual(next.toFixed(2), '-1.00', 'opposing centered vectors');
  const progress = s.value(0),
    normalized = s.value(0);
  const u = Math.min(LEFT.width / 5.8, LEFT.height / 5.6);
  const world = ([x, y]) => [LEFT.cx + (x - 1.8) * u, LEFT.cy - (y - 1.8) * u];
  const frame = [
    line(world([-0.3, 0]), world([4.4, 0]), { stroke: 'dim', width: 3 }),
    line(world([0, -0.3]), world([0, 4.15]), { stroke: 'dim', width: 3 }),
  ];
  const picture = dynamic(() => {
    const origin = mean.map((x) => x * progress.value);
    const directions = [document, query].map((v) => v.map((x, i) => x - origin[i]));
    return group(
      ...directions.map((v, i) => {
        const length = 1 + normalized.value * (Math.hypot(...v) - 1);
        const tip = world(v.map((x, j) => origin[j] + x / length));
        const color = i ? 'cyan' : 'green';
        return group(
          arrow(world(origin), tip, { stroke: color, width: 7, pad: 0 }),
          label(i ? 'query' : 'document', { color, size: 34 }).moveTo([
            tip[0] + (i ? 0 : 44),
            tip[1] + (i ? -40 : 62),
          ]),
        );
      }),
      dot(13, 'yellow').moveTo(world(origin)),
    );
  });
  const fixed = place(
    mono('Document (3, 1)      Query (1, 3)      Saved mean (2, 2)', { size: 39 }),
    TOP,
  );
  const ruler = place(note('Both coordinate directions are retained.'), LEFT, 'bottom');
  const initial = place(
    column(
      [
        label('Before centering'),
        mono('cos = 6 / 10 = ' + old.toFixed(2), { color: 'yellow', size: 44 }),
      ],
      { gap: 'wide' },
    ),
    RIGHT,
  );
  const newOrigin = place(
    column(
      [
        label('From the saved mean'),
        mono('document  (1, −1)', { color: 'green' }),
        mono('query    (−1, 1)', { color: 'cyan' }),
      ],
      { gap: 'normal' },
    ),
    RIGHT,
  );
  const ask = place(label('From the new origin, what is their cosine?', { color: 'yellow' }), FOOT);
  const score = place(
    label('Opposite directions     cos = ' + next.toFixed(0).replace('-', '−'), {
      color: 'yellow',
    }),
    FOOT,
  );
  const norm = place(
    column(
      [
        label('Unit vectors for dot-product search'),
        mono('length  √2 → 1', { size: 39 }),
        mono('dot  ' + dotProduct(d, q).toString().replace('-', '−') + ' → −1', {
          size: 46,
          color: 'yellow',
        }),
      ],
      { gap: 'normal' },
    ),
    RIGHT,
  );
  const guard = place(
    label('At the mean: projected length = 0. Cosine is undefined.', { size: 36, color: 'yellow' }),
    FOOT,
  );
  const zero = place(
    column(
      [
        label('A new query lands at the mean', { size: 37 }),
        mono('(2, 2) − (2, 2) = (0, 0)', { size: 36, color: 'cyan' }),
      ],
      { gap: 'normal' },
    ),
    RIGHT,
  );
  const meanHit = group(dot(19, 'cyan').moveTo(world(mean)), dot(10, 'yellow').moveTo(world(mean)));
  const zeroInputs = place(
    mono('Document (3, 1)      Query (2, 2)      Saved mean (2, 2)', { size: 39 }),
    TOP,
  );
  const docTip = world(unitFinite(d).map((v, i) => mean[i] + v));
  const storedDocument = group(
    arrow(world(mean), docTip, { stroke: 'green', width: 7, pad: 0 }),
    label('document', { color: 'green', size: 34 }).moveTo([docTip[0] + 44, docTip[1] + 62]),
  );
  s.add(heading(c.title), fixed, frame, picture, ruler, initial);
  c.on('pca-move-origin', () => s.play(progress.to(1, { duration: 2 })));
  c.swap('pca-centered', initial, newOrigin, { after: true });
  c.show('pca-ask-cos', ask);
  c.swap('pca-opposite', ask, score, { after: true });
  c.on('pca-unit', () => s.play(normalized.to(1, { duration: 1.8 })));
  c.swap('pca-unit-dot', newOrigin, norm, { after: true });
  c.swap('pca-mean-query', norm, zero);
  c.swap('pca-mean-query', [fixed, picture, score], [zeroInputs, storedDocument, meanHit]);
  c.show('pca-undefined', guard, { after: true });
}
