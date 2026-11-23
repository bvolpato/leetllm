import { boxOf, dot, dynamic, place, table } from 'vizmatic/stage';
import { label, note } from '../../kit-narrated.mjs';
import { VALIDATION_STATES, BODY, open } from '../parts.mjs';
export default function productMonitoring(s, c) {
  const [top, matrixRoom, foot] = BODY.rows([1, 5, 2], 'wide');
  const title = place(
    label('One release contract • two observation clocks', { color: 'cyan' }),
    top,
  );
  const t = place(
    table(
      [
        { key: 'product', label: 'product' },
        { key: 'fast', label: 'immediate input check', sample: 'eligible candidate supply' },
        { key: 'delayed', label: 'delayed outcome', sample: 'assignment-aware purchase / return' },
        { key: 'restore', label: 'restore with model', sample: 'preprocessing' },
      ],
      [
        {
          id: 'delivery',
          product: 'delivery',
          fast: 'waiting',
          delayed: 'waiting',
          restore: 'imputer',
        },
        {
          id: 'ranking',
          product: 'ranking',
          fast: 'waiting',
          delayed: 'waiting',
          restore: 'eligibility',
        },
        {
          id: 'forecast',
          product: 'forecasting',
          fast: 'waiting',
          delayed: 'waiting',
          restore: 'transforms',
        },
        {
          id: 'vision',
          product: 'vision',
          fast: 'waiting',
          delayed: 'waiting',
          restore: 'cropper',
        },
      ],
      { states: VALIDATION_STATES, width: matrixRoom.width, size: 32, leading: 2.4 },
    ),
    matrixRoom,
  );
  const e = place(
    table(
      [
        { key: 'operation', label: 'operation' },
        {
          key: 'purpose',
          label: 'what it establishes',
          sample: 'bounded exposure + release checks',
        },
      ],
      [
        { id: 'canary', operation: 'canary', purpose: 'bounded exposure + release checks' },
        { id: 'ab', operation: 'A/B test', purpose: 'assignment + analysis design' },
      ],
      { states: VALIDATION_STATES, width: foot.width, size: 34, leading: 1.4 },
    ),
    foot,
  );
  const route = open(s, c);
  const candidate = s.value(-1);
  const sites = route.map((n) => boxOf(n).point('top'));
  const movingCandidate = dynamic(() => {
    if (candidate.value < 0) return [];
    const i = Math.min(3, Math.floor(candidate.value)),
      t = candidate.value - i;
    const a = sites[i],
      b = sites[i + 1];
    return [
      dot(13, candidate.value < 1 ? 'cyan' : 'green').moveTo([a[0] + (b[0] - a[0]) * t, a[1] - 28]),
    ];
  });
  const pending = place(
    label('New candidate → required gates • promotion closed', { color: 'yellow', size: 34 }),
    top,
  );
  s.add(title, t, e, movingCandidate);
  c.on('product-monitoring-b1', () => s.play(t.light('delivery')));
  c.on('product-delivery', () =>
    s.play(
      t.setCell('delivery', 'fast', 'scan freshness'),
      t.setCell('delivery', 'delayed', 'labeled warning cost'),
      t.light('delivery'),
    ),
  );
  c.on('product-ranking', () =>
    s.play(
      t.setCell('ranking', 'fast', 'eligible candidate supply'),
      t.setCell('ranking', 'delayed', 'assignment-aware purchase / return'),
      t.light('ranking'),
    ),
  );
  c.on('product-forecast', () =>
    s.play(
      t.setCell('forecast', 'fast', 'fresh counts'),
      t.setCell('forecast', 'delayed', 'residual / decision cost'),
      t.light('forecast'),
    ),
  );
  c.on('product-vision', () =>
    s.play(
      t.setCell('vision', 'fast', 'photo quality'),
      t.setCell('vision', 'delayed', 'reviewer-confirmed damage'),
      t.light('vision'),
    ),
  );
  c.on('product-monitoring-b2', () => s.play(e.light('canary')));
  c.on('product-ab', () => s.play(e.light('ab')));
  c.swap('product-retrain', title, pending);
  c.on('product-retrain', () => {
    candidate.set(0);
    s.play(t.light(null), e.light(null), candidate.to(4, { duration: 5.5 }));
  });
}
