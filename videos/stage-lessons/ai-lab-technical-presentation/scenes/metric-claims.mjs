import { line } from 'vizmatic/stage';
import { incidents, PAIRED, addTitle, work, caption, ledger, CASE } from '../parts.mjs';

export default function metricClaims(s, c) {
  addTitle(s, c);
  const [main, foot] = work.rows([4, 1]);
  const p = PAIRED,
    d = p.candidateHits - p.baselineHits,
    service = CASE.service;
  const rows = [
    {
      id: 'retrieval',
      Measure: 'Retrieval',
      Numerator: d + ' hits',
      Denominator: p.n + ' queries',
      Change: '+' + p.percentagePointChange + ' points',
    },
    { id: 'incidents', Measure: 'Incidents', Numerator: ' ', Denominator: ' ', Change: ' ' },
    { id: 'latency', Measure: 'Lookup p95', Numerator: ' ', Denominator: ' ', Change: ' ' },
  ];
  const t = ledger(main, ['Measure', 'Numerator', 'Denominator', 'Change'], rows);
  const ratios = main.columns(2, 'loose').map((region, i) => {
    const [title, numerator, denominator, answer] = region.rows([1, 1.25, 1.25, 1], 'tight');
    const rule = numerator.inset('wide');
    const y = (numerator.bottom + denominator.top) / 2;
    return {
      title: caption(title, i ? 'Relative improvement' : 'Hit-rate change', 'dim'),
      rule: line([rule.left, y], [rule.right, y], { stroke: 'dim', width: 3 }),
      numerator: caption(numerator, d + ' additional hits', 'ink', 48),
      denominator: caption(
        denominator,
        i ? p.baselineHits + ' baseline successes' : p.n + ' queries',
        'blue',
        44,
      ),
      result: caption(
        answer,
        i
          ? '≈ +' + ((100 * d) / p.baselineHits).toFixed(1) + '% relative improvement'
          : '+' + p.percentagePointChange + ' percentage points',
        'yellow',
        42,
      ),
    };
  });
  const msg = caption(foot, 'Choose the reference population.', 'dim');
  const reg = caption(foot, p.counts.baselineOnly + ' lost hits', 'pink');
  const factors = caption(
    foot,
    'Compare severity, reporting and exposure in both windows.',
    'yellow',
  );
  const cap = caption(foot, 'Latency margin measures time. Capacity needs a load test.', 'yellow');
  const reps = caption(foot, 'Repeated frozen queries measure run variation.', 'dim');
  s.add(
    ratios.map((r) => [r.title, r.rule]),
    msg,
  );
  c.show('delta', ratios[0].numerator, { after: true });
  c.show('all-queries', ratios[0].denominator, { after: true });
  c.show('points', ratios[0].result, { after: true });
  c.show('same-hits', ratios[1].numerator);
  c.show('original-hits', ratios[1].denominator, { after: true });
  c.show('relative', ratios[1].result, { after: true });
  c.swap(
    1,
    ratios.flatMap((r) => Object.values(r)),
    t,
  );
  const cells = (id, values) => Object.entries(values).map(([col, v]) => t.setCell(id, col, v));
  c.swap('loss', msg, reg, { after: true });
  const [earlier, later] = incidents;
  const difference = later.count - earlier.count;
  const signed = (value) => String(value).replace('-', '−');
  c.hide(1, reg);
  c.after('count', () =>
    s.play(
      t.light('incidents'),
      ...cells('incidents', {
        Numerator: `${later.count} − ${earlier.count} = ${signed(difference)} incidents`,
        Denominator: earlier.count + ' earlier incidents',
        Change: signed((100 * difference) / earlier.count) + '%',
      }),
    ),
  );
  c.after('rate', () =>
    s.play(
      ...cells('incidents', {
        Numerator: earlier.count + ' → ' + later.count + ' incidents',
        Denominator: earlier.requests / 1e6 + 'M → ' + later.requests / 1e6 + 'M requests',
        Change: earlier.rate + ' → ' + later.rate + ' per million',
      }),
    ),
  );
  c.show('context', factors);
  const diff = CASE.oldP95 - service.successfulP95Ms;
  c.after('latency', () =>
    s.play(
      t.light('latency'),
      ...cells('latency', { Numerator: '−' + diff + ' ms', Denominator: CASE.oldP95 + ' ms' }),
    ),
  );
  c.after('relative-p95', () =>
    s.play(t.setCell('latency', 'Change', '−' + ((100 * diff) / CASE.oldP95).toFixed(1) + '%')),
  );
  c.swap('capacity', factors, cap);
  c.swap('repeat', cap, reps);
}
