import { boxOf, line, place, segmentedBar } from 'vizmatic/stage';
import { traceBudgetFixture } from '../../../films/capstone-production-llm-agent/model.mjs';
import { area, heading, note } from '../../kit-narrated.mjs';
import { C, field, records } from '../parts.mjs';

export default function traceBudget(s, c) {
  s.add(heading('What do the call receipts add up to?'));
  const base = traceBudgetFixture();
  const extra = traceBudgetFixture(true);
  const [receipts, plot, foot] = area.rows([3, 5, 1], 'normal');
  const call = (i) => 'call-' + (i + 1);
  const lastCall = call(base.events.length);
  const receipt = records(receipts,
    [['id', 'Receipt', 0.24], ...extra.events.map((_, i) => [call(i), 'Call ' + (i + 1), 0.152])],
    [{ id: 'Tokens' }, { id: 'Time (ms)' }], { size: 34 });
  const names = { events: 'Events', tokens: 'Tokens', ms: 'Time (ms)' };
  const rows = plot.rows(3, 'tight');
  const metrics = Object.keys(names).map((k, i) => {
    const [labels, track, count] = rows[i].columns([2, 6, 2], 'normal');
    const [, primaryName, sampleName] = labels.rows(3, 'none');
    const [caption, main, lower] = track.rows(3, 'none');
    const [, runValue, sampleValue] = count.rows(3, 'none');
    const capacity = base.limits[k];
    const style = {
      width: track.width - 6,
      max: capacity * 1.5,
      height: 30,
      labels: false,
      readout: false,
      size: 34,
    };
    const parts = extra.events.map((event, j) => ({
      name: 'call ' + (j + 1),
      value: k === 'events' ? 1 : event[k],
      color: j < base.events.length ? C.stored : 'dim',
    }));
    const bar = place(segmentedBar([], style), main);
    const judged = place(segmentedBar(parts, { ...style, capacity }), main);
    const boundary = place(segmentedBar([], { ...style, height: 18 }), lower);
    const capX = boxOf(bar).left + (style.width * capacity) / style.max;
    const cap = line([capX, main.top + 3], [capX, main.bottom - 3], { stroke: 'ink', width: 3 });
    const limit = note('Limit ' + capacity).moveTo([capX, caption.point('center')[1]]);
    return {
      k,
      bar,
      parts,
      judged,
      cap,
      limit,
      boundary,
      capacity,
      runValue,
      name: field(primaryName, names[k], 'ink', 34),
      used: field(runValue, String(base.used[k]), C.stored, 36),
      final: field(runValue, String(extra.used[k]), 'ink', 36),
      sample: field(sampleName, 'At limit', 'dim', 30),
      pass: field(sampleValue, 'Pass', C.effect, 31),
      unknown: field(runValue, '?', C.active),
    };
  });
  const audit = field(foot, 'Synthetic receipts   ·   sequential calls   ·   measured after completion', 'dim');
  const within = field(foot, 'Four calls   ·   within all three limits', C.effect);
  const over = field(foot, 'Five calls   ·   all three limits exceeded', C.blocked);
  const compare = field(foot, 'Five-call run above each separate boundary example', 'ink', 35);
  const invalid = field(foot, 'Missing receipt   ·   total unknown', C.blocked);
  const enforce = field(foot, 'Check the remaining allowances before dispatch.', C.active);
  const reconcile = field(foot, 'Reconcile late receipts against this same request.', C.stored);
  s.add(
    receipt,
    metrics.map((m) => [m.name, m.bar]),
    audit,
  );
  c.on('trace-budget-b1', () => s.play(receipt.light(null, 'id')));
  c.on('budget-input-tokens', () => {
    base.events.forEach((event, i) => s.play(
      receipt.setCell('Tokens', call(i), event.tokens),
      metrics[0].bar.insert(metrics[0].parts[i]), metrics[1].bar.insert(metrics[1].parts[i]),
      { duration: 0.22 },
    ));
  });
  c.show('budget-input-tokens', metrics[0].used, { after: true });
  c.show('budget-token-result', metrics[1].used, { after: true });
  c.on('budget-input-ms', () => {
    base.events.forEach((event, i) => s.play(
      receipt.setCell('Time (ms)', call(i), event.ms), metrics[2].bar.insert(metrics[2].parts[i]),
      { duration: 0.22 },
    ));
  });
  c.show('budget-ms-result', metrics[2].used, { after: true });
  c.show(
    'budget-limits',
    metrics.map((m) => [m.cap, m.limit]),
  );
  c.swap('budget-pass-result', audit, within, { after: true });
  const time = metrics[2];
  const lastIndex = base.events.length - 1;
  const slowedMs = 950;
  const slowedTotal = base.used.ms - base.events[lastIndex].ms + slowedMs;
  const slower = field(time.runValue, String(slowedTotal), C.blocked, 36);
  const slowQuestion = field(foot, 'Same four calls   ·   same tokens   ·   which limit is exceeded?', C.active);
  const slowOnly = field(foot, 'Only sequential time exceeds its limit.', C.blocked);
  c.after('slower-call', () => s.play(receipt.setCell('Time (ms)', call(lastIndex), slowedMs),
    receipt.light('Time (ms)', call(lastIndex))));
  c.swap('slower-call', [time.bar, time.used, within], [time.unknown, slowQuestion], { after: true });
  c.show('slow-total', time.bar, { after: true });
  c.after('slow-total', () => s.play(time.bar.resize(time.parts[lastIndex].name, slowedMs, { duration: 0.6 })));
  c.swap('slow-total', time.unknown, slower, { after: true });
  c.swap('slow-verdict', slowQuestion, slowOnly, { after: true });
  c.after('reset-fourth', () => s.play(
    receipt.setCell('Time (ms)', call(lastIndex), base.events[lastIndex].ms),
    time.bar.resize(time.parts[lastIndex].name, base.events[lastIndex].ms),
  ));
  c.swap('reset-fourth', [slower, slowOnly], [time.used, within], { after: true });
  c.hide('trace-budget-b2', within, { after: true });
  c.after('trace-budget-b2', () =>
    s.play(
      receipt.light(null, lastCall),
      receipt.setCell('Tokens', lastCall, extra.events.at(-1).tokens),
      receipt.setCell('Time (ms)', lastCall, extra.events.at(-1).ms),
    ),
  );
  c.on('budget-expanded-result', () => s.play(receipt.light(null, lastCall)));
  metrics.forEach((m, i) => {
    const cue = ['five-events', 'expanded-tokens', 'expanded-ms'][i];
    c.hide(cue, m.used, { lead: 0 });
    c.on(cue, () => s.play(m.bar.insert(m.parts.at(-1), { duration: 0.65 })));
    c.show(cue, m.final, { after: true, lead: 0 });
  });
  c.hide(
    'budget-fail-result',
    metrics.flatMap((m) => [m.bar, m.cap]),
    { after: true, lead: 0, fade: 0.08 },
  );
  c.show('budget-fail-result', [over, metrics.map((m) => m.judged)], {
    after: true,
    lead: -0.08,
    fade: 0.12,
  });
  const samples = metrics.slice(1);
  c.swap('exact-tokens', over, compare);
  samples.forEach((m, i) => {
    const cue = ['exact-tokens', 'exact-time'][i];
    c.show(cue, [m.sample, m.boundary], { lead: 0 });
    c.on(
      cue,
      () =>
        s.play(
          m.boundary.insert(
            { name: 'Boundary', value: m.capacity, color: 'dim' },
            { duration: 0.55 },
          ),
        ),
      0.25,
    );
    c.show(cue, m.pass, { after: true, lead: 0 });
  });
  c.after('budget-invalid', () =>
    s.play(
      receipt.setCell('Tokens', lastCall, 'missing'),
      receipt.setCell('Time (ms)', lastCall, 'missing'),
    ),
  );
  c.swap(
    'budget-invalid',
    [compare, samples.flatMap((m) => [m.final, m.judged, m.boundary, m.pass, m.sample])],
    [invalid, samples.map((m) => m.unknown)],
    { after: true },
  );
  c.on('trace-budget-b3', () => s.play(receipt.light(null)));
  c.swap('before-dispatch', invalid, enforce);
  c.swap('late-usage', enforce, reconcile);
}
