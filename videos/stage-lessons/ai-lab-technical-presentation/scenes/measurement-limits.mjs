import { column, place, unitChart } from 'vizmatic/stage';
import { label } from '../../kit-narrated.mjs';
import { incidents, addTitle, work, caption, ledger, track, CASE } from '../parts.mjs';

export default function measurementLimits(s, c) {
  addTitle(s, c);
  const [plot, foot] = work.rows([4, 1]);
  const windows = plot.rows(2, 'normal').map((band, i) => {
    const [name, count, exposure, scale, result] = band.columns(
      [1.05, 0.95, 1.25, 2.5, 0.3],
      'normal',
    );
    const d = incidents[i];
    const color = i ? 'cyan' : 'blue';
    return {
      window: caption(name, i ? 'Later window' : 'Earlier window', 'dim', 34),
      marks: place(
        column(
          [
            label(d.count + (d.count === 1 ? ' incident' : ' incidents'), { size: 34, color }),
            unitChart([{ count: d.count, color }], { columns: d.count, cell: 25, gap: 10 }),
          ],
          { gap: 'normal', align: 'left' },
        ),
        count,
        'left',
      ),
      exposure: caption(exposure, d.requests / 1e6 + 'M requests', color, 36),
      bar: track(
        scale,
        'Incidents per million requests',
        Math.max(...incidents.map((x) => x.rate)),
        [{ name: 'Rate', value: 0, color }],
      ),
      rate: caption(result, String(d.rate), color, 54),
    };
  });
  const raw = caption(foot, 'Each window has its own request total.', 'dim');
  const normalized = caption(foot, 'The count fell. The rate per request doubled.', 'yellow');
  const gate = CASE.service;
  const checks = ledger(
    plot,
    ['Service check', 'Observed', 'Required'],
    [
      {
        id: 'p95',
        'Service check': 'Successful lookup p95',
        Observed: ' ',
        Required: '< ' + gate.latencyLimitMs + ' ms',
      },
      {
        id: 'success',
        'Service check': 'Success fraction',
        Observed: ' ',
        Required: '≥ ' + 100 * gate.minimumSuccess + '% succeed',
      },
    ],
  );
  const pop = caption(foot, 'Separate synthetic service check', 'dim');
  const failures = caption(
    foot,
    gate.timeouts + ' of ' + gate.attempts + ' attempts time out',
    'cyan',
  );
  const held = caption(foot, 'Hold the rollout', 'red', 52);
  s.add(
    windows.map((w) => [w.window, w.bar]),
    raw,
  );
  windows.forEach((w, i) => {
    const cue = i ? 'later' : 'prior';
    c.show(cue, [w.marks, w.exposure], { after: true });
    c.after(cue + '-rate', () =>
      s.play(w.bar.resize('Rate', incidents[i].rate, { duration: 0.45 })),
    );
    c.show(cue + '-rate', w.rate, { after: true, lead: -0.45 });
  });
  c.swap('reverse', raw, normalized, { after: true });
  c.swap(1, [windows.flatMap((w) => Object.values(w)), normalized], [checks, pop]);
  c.after('latency', () =>
    s.play(checks.setCell('p95', 'Observed', gate.successfulP95Ms + ' ms'), checks.light('p95')),
  );
  c.swap('timeouts', pop, failures, { after: true });
  c.after('fraction', () =>
    s.play(
      checks.setCell(
        'success',
        'Observed',
        gate.attempts -
          gate.timeouts +
          ' / ' +
          gate.attempts +
          ' succeed = ' +
          100 * gate.successFraction +
          '%',
      ),
      checks.light('success'),
    ),
  );
  c.swap('hold', failures, held, { after: true, fade: 0.22 });
}
