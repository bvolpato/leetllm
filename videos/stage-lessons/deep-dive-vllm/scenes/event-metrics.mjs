// Scene 22: A streamed event can contain more than one token (0ms: T0+T1 bundled, 12ms: T2, 24ms: T3 -> event gaps 12ms & 12ms vs request-mean TPOT (24-0)/(4-1) = 8ms; T0->T1 gap unrecoverable!).
import {
  COSMOS,
  ROLE,
  aura,
  glassCell,
  glowDot,
  glowTex,
  group,
  guardedDynamic,
  heroTitle,
  line,
  runPhase,
  txt,
  wireStepCues,
} from '../parts.mjs';

export default function eventMetrics(s, c) {
  const phase = s.value(0);
  // step:
  // 0 = op-0 (inter_token_latency_seconds measures engine output events, can bundle tokens)
  // 1 = op-1 / events (0ms: T0+T1, 12ms: T2, 24ms: T3)
  // 2 = event-gaps (observed event gaps: 12 ms and 12 ms)
  // 3 = tpot (request-mean TPOT = (24-0)/(4-1) = 8 ms!)
  // 4 = op-2 (T0->T1 internal gap unrecoverable -> DistServe TPOT != per-request p99 ITL!)
  const step = s.value(0);

  const bgAura = aura(0, 20, 620, '#5ce1e61a', '#ff6b8b16');
  const title = heroTitle(['A Streamed Event Can', 'Bundle Multiple Tokens'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 62,
    accent: ROLE.kv,
    eyebrow: 'EVENT GAPS VS MEAN TPOT VS PER-TOKEN P99 ITL',
  });

  const live = guardedDynamic(1, () => {
    const st = Math.round(step.value);
    const p = phase.value;
    const xOf = (ms) => -620 + (ms / 24) * 1240;
    const axisY = 20;
    const nodes = [];

    // Engine output event timeline axis
    nodes.push(
      txt(
        'ENGINE-CORE OUTPUT EVENT TIMELINE (4 GENERATED TOKENS IN 3 EVENTS)',
        0,
        -238,
        26,
        COSMOS.muted,
        'mono',
      ),
      line([-700, axisY], [700, axisY], { color: '#475569', width: 3 }),
    );

    const events = [
      { ms: 0, label: 'T0 + T1', sub: '2 tokens bundled', col: st >= 4 ? ROLE.bad : ROLE.r0 },
      { ms: 12, label: 'T2', sub: '1 token', col: ROLE.kv },
      { ms: 24, label: 'T3', sub: '1 token', col: ROLE.kv },
    ];
    events.forEach(({ ms, label, sub, col }) => {
      const ex = xOf(ms);
      nodes.push(
        line([ex, axisY - 18], [ex, axisY + 18], { color: col, width: 3.5 }),
        glowDot(ex, axisY, { radius: 9, color: col }),
        glassCell(ex, -118, 300, 128, col, { fill: '#101d32', glow: 8 }),
        txt(label, ex, -144, 34, col, 'mono'),
        txt(sub, ex, -90, 26, COSMOS.muted, 'sans'),
        txt(`${ms} ms`, ex, axisY + 48, 28, COSMOS.ink, 'mono'),
      );
    });

    // Event gap annotations (12 ms, 12 ms)
    if (st >= 2) {
      nodes.push(
        glassCell(xOf(6), axisY + 110, 280, 68, COSMOS.gold, { fill: '#241d0e', glow: 7 }),
        txt('event gap: 12 ms', xOf(6), axisY + 110, 26, COSMOS.gold, 'mono'),

        glassCell(xOf(18), axisY + 110, 280, 68, COSMOS.gold, { fill: '#241d0e', glow: 7 }),
        txt('event gap: 12 ms', xOf(18), axisY + 110, 26, COSMOS.gold, 'mono'),
      );
    }

    // Bottom contrast panel: Mean TPOT vs Unrecoverable T0->T1
    if (st >= 4) {
      nodes.push(
        glassCell(0, 245, 1680, 118, ROLE.bad, { fill: '#2b1320', glow: 10 }),
        txt('UNRECOVERABLE GAP: T0 -> T1 WAS BUNDLED AT 0 MS', 0, 218, 26, ROLE.bad, 'mono'),
        txt(
          'Mean TPOT (8 ms) & event-gap histograms CANNOT reconstruct per-token p99 ITL!',
          0,
          270,
          26,
          COSMOS.ink,
          'sans',
        ),
      );
    } else if (st === 3) {
      nodes.push(
        glassCell(0, 245, 1680, 118, ROLE.good, { fill: '#0e2922', glow: 9 }),
        glowTex(String.raw`\text{TPOT} = \frac{24 - 0}{4 - 1} = 8\ \text{ms}`, {
          x: 0,
          y: 245,
          size: 38,
          color: ROLE.good,
          glow: 6,
        }),
      );
    } else {
      nodes.push(
        glassCell(0, 245, 1680, 106, ROLE.kv, { fill: '#0e202c', glow: 6 }),
        txt(
          'vllm:inter_token_latency_seconds tracks engine output events (not HTTP chunks)',
          0,
          245,
          26,
          ROLE.kv,
          'mono',
        ),
      );
    }

    const u = (p * 0.65) % 1;
    nodes.push(
      glowDot(-780 + u * 1560, 332, { radius: 6, color: st >= 4 ? ROLE.bad : ROLE.kv }),
      txt(
        'Track TTFT, queueing, errors, KV occupancy & preemptions with explicit latency graders',
        0,
        386,
        26,
        COSMOS.muted,
        'sans',
      ),
    );
    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);
  wireStepCues(s, c, step, [
    ['vv-event-metrics-op-0', 0],
    ['vv-event-metrics-op-1', 1],
    ['vv-event-metrics-events', 1],
    ['vv-event-metrics-event-gaps', 2],
    ['vv-event-metrics-tpot', 3],
    ['vv-event-metrics-op-2', 4],
  ]);
}
