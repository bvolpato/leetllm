import { alert, estimate, sum, summarize } from '../arithmetic.mjs';
import { EVENTS, MONITOR_POLICY } from '../fixtures.mjs';

export function drawAlertValidity(ctx, scene, state, api) {
  const { C, focus } = api;
  const progress = (id) => focus.progress(id, 0);
  const after = (id) => state.cues?.[id]?.phase === 'after';
  const text = (v, x, y, size, color) => api.text(ctx, v, x, y, size, color);
  if (progress('ingress-ledger') > 0) {
    const ingress = 8;
    const received = progress('empty-collector') > 0 ? 0 : 7;
    text('Another window   /   independent ingress count: 8', 120, 288, 41, C.blue);
    text('Ingress', 120, 439, 36, C.ink);
    text('Final events', 120, 653, 36, C.ink);
    for (let i = 0; i < ingress; i++) {
      const x = 535 + i * 167;
      focus.target('ingress-slots', () => {
        api.text(ctx, 'R' + (i + 1), x, 439, 42, C.blue, 'center');
        api.rect(ctx, x - 71, 582, 142, 101, C.panel, i < received ? C.cyan : C.muted, 8);
        api.text(
          ctx,
          i < received ? 'Clear' : '?',
          x,
          648,
          34,
          i < received ? C.cyan : C.yellow,
          'center',
        );
      });
    }
    focus.target('collection-gap', () => {
      text(received + ' received   /   ' + ingress + ' entered', 120, 844, 43, C.ink);
      text(
        received ? '1 missing final event' : 'No observations: window unknown',
        120,
        943,
        43,
        C.yellow,
      );
    });
    return;
  }
  const broken = progress('damage-inputs') > 0;
  const assessed = !broken || after('keep-findings');
  const events = EVENTS.map((e) =>
    e.id === '206' && broken ? { ...e, ttft: null, cached: 202 } : e,
  );
  const last = events.at(-1);
  const findings = alert(events);
  const safety = summarize(events);
  const badTime = findings.includes('UNKNOWN: latency measurement');
  const badUsage = findings.includes('UNKNOWN: usage measurement');
  const times = events.map((e) => e.ttft).sort((a, b) => a - b);
  const latency = badTime ? null : times[Math.ceil(times.length * 0.95) - 1];
  const cost = badUsage ? null : sum(events.map(estimate));
  const page = findings.includes('PAGE: unsupported served claims');

  focus.target('raw-measurements', () => {
    text('Request 206', 120, 249, 40, C.blue);
    text(
      'First output   ' + (last.ttft === null ? 'missing' : last.ttft + ' ms'),
      120,
      321,
      37,
      C.ink,
    );
    text('Cached input   ' + last.cached + ' of ' + last.input + ' tokens', 900, 321, 37, C.ink);
  });
  text('Window of six requests', 120, 441, 31, C.muted);
  text('Policy', 785, 441, 31, C.muted);
  text('Finding', 1400, 441, 31, C.muted);

  const rows = [
    [
      'Unsafe approvals delivered',
      safety.unsafe + ' confirmed',
      'Page on any',
      page ? 'PAGE' : 'Within limit',
      page ? C.pink : C.blue,
    ],
    [
      'First output, p95',
      badTime ? 'Missing timing' : latency + ' ms',
      'Warn above ' + MONITOR_POLICY.maxP95 + ' ms',
      badTime ? 'UNKNOWN' : 'Within limit',
      badTime ? C.yellow : C.blue,
    ],
    [
      'Estimated token cost',
      badUsage ? 'Invalid usage' : '$' + cost.toFixed(7),
      'Warn above $' + MONITOR_POLICY.maxWindowCost,
      badUsage ? 'UNKNOWN' : 'Within limit',
      badUsage ? C.yellow : C.blue,
    ],
  ];
  rows.forEach(([name, value, rule, finding, color], i) => {
    const y = 515 + i * 133;
    const visible = assessed || i === 0;
    api.line(ctx, 120, y - 45, 1760, y - 45, C.panel, 3);
    focus.target('channel-' + i, () => {
      text(name, 120, y, 37, C.ink);
      text(value, 122, y + 48, 30, C.muted);
      text(rule, 785, y + 17, 34, C.ink);
      text(visible ? finding : '?', 1400, y + 17, 43, visible ? color : C.muted);
    });
  });
  focus.target('alert-action', () => {
    const message = !broken
      ? 'Same window, three independent checks'
      : !assessed
        ? 'What should we report for latency and cost alongside the page?'
        : 'Contain the unsafe delivery. Repair timing and usage collection.';
    text(message, 120, 966, 40, broken && !assessed ? C.yellow : C.ink);
  });
}

export default {
  id: 'alert-validity',
  draw: drawAlertValidity,
  cues: [
    'inspect-channels',
    'damage-inputs',
    'choose-findings',
    'keep-findings',
    'repair-telemetry',
    'ingress-ledger',
    'empty-collector',
  ],
};
