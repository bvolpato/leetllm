// Scene 13: When does the next block get its weights? 4x3.5=14 GB root vs 3.5 GB per-block + ms 6 deadline (launch ms 5 -> waits till ms 9, 3 ms exposed, 7 GB live!).
import { delay, par } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  line,
  rect,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function granularity(s, c) {
  const phase = s.value(0);
  const showGather = s.value(1);
  // gatherMode: 0=root(14 GB), 1=one-block(3.5 GB), 2=reuse
  const gatherMode = s.value(0);

  const showPrefetch = s.value(0);
  const late = s.value(0); // 0=start@0 (arrives ms4), 1=start@5 (hold!), 2=exposed wait (arrives ms9, 3ms wait)
  const showLive = s.value(0);
  const showSeven = s.value(0);

  const bgAura = aura(0, 20, 640, '#5ce1e61e', '#fb923c18');
  const title = heroTitle(['When Does the Next', 'Block Get Weights?'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: ROLE.comm,
    eyebrow: 'WRAP GRANULARITY & PREFETCH DEADLINE',
  });

  const gatherView = guardedDynamic(showGather, (a) => {
    const gm = Math.round(gatherMode.value);
    const p = phase.value;
    const isPerBlock = gm >= 1;
    const liveGb = isPerBlock ? 3.5 : 14.0;

    const nodes = [
      txt(
        isPerBlock
          ? 'ONE GROUP PER BLOCK (3.5 GB MATERIALIZED)'
          : 'ALL 4 BLOCKS IN ONE ROOT GROUP (14 GB LIVE!)',
        0,
        -205,
        28,
        isPerBlock ? ROLE.good : ROLE.bad,
        'mono',
      ).opacity(a),
    ];

    for (let b = 0; b < 4; b++) {
      const bx = -540 + b * 360;
      const active = !isPerBlock || (gm === 1 && b === 0) || (gm === 2 && b === 1);
      nodes.push(
        glassCell(bx, -70, 310, 148, active ? (isPerBlock ? ROLE.good : ROLE.bad) : COSMOS.dim, {
          fill: active ? (isPerBlock ? '#0d2924' : '#2e101c') : '#0b101d',
          glow: active ? 10 : 0,
          opacity: a,
        }),
        txt(`Block ${b}`, bx, -104, 30, active ? COSMOS.ink : COSMOS.dim, 'mono').opacity(a),
        txt(
          active ? '3.5 GB LIVE' : gm === 2 && b === 0 ? 'freed (reused)' : 'sharded',
          bx,
          -48,
          26,
          active ? (isPerBlock ? ROLE.good : ROLE.bad) : COSMOS.muted,
          'mono',
        ).opacity(a),
      );
    }

    nodes.push(
      glassCell(0, 145, 760, 118, isPerBlock ? ROLE.good : ROLE.bad, {
        fill: '#0e192d',
        glow: 9,
        opacity: a,
      }),
      txt(
        `MATERIALIZED SCRATCH BUFFER: ${liveGb.toFixed(1)} GB`,
        0,
        145,
        32,
        isPerBlock ? ROLE.good : ROLE.bad,
        'mono',
      ).opacity(a),
      glowDot(-740 + ((p * 0.65) % 1) * 1480, 274, {
        radius: 6,
        color: isPerBlock ? ROLE.good : ROLE.bad,
        opacity: a,
      }),
      txt(
        'Smaller groups cut scratch 4×, but launch more collectives · watch prefetch timing!',
        0,
        345,
        28,
        COSMOS.muted,
        'sans',
      ).opacity(a),
    );
    return group(...nodes);
  });

  // Millisecond ruler [0..10] -> x in [-560, 640] (120 px/ms)
  const mx = (ms) => -560 + ms * 120;

  const prefetchView = guardedDynamic(showPrefetch, (a) => {
    const lt = Math.round(late.value);
    const sl = showLive.value;
    const s7 = showSeven.value;

    const nodes = [
      line([mx(0), -175], [mx(10), -175], { stroke: COSMOS.rule, width: 2.5 }).opacity(a),
    ];
    for (let t = 0; t <= 10; t += 2) {
      const x = mx(t);
      nodes.push(
        line([x, -188], [x, -162], {
          stroke: t === 6 ? COSMOS.gold : COSMOS.muted,
          width: 2.5,
        }).opacity(a),
        txt(`${t} ms`, x, -216, 26, t === 6 ? COSMOS.gold : COSMOS.muted, 'mono').opacity(a),
      );
    }

    // Compute track: Block 1 [0..6]
    nodes.push(
      txt('COMPUTE', -725, -88, 26, ROLE.weights, 'mono').opacity(a),
      rect(mx(6) - mx(0) - 6, 72, { fill: '#12294a', stroke: ROLE.weights, width: 2.5, radius: 8 })
        .at((mx(0) + mx(6)) * 0.5, -88)
        .opacity(a),
      txt(
        'Block 1 Compute (0 → 6 ms)',
        (mx(0) + mx(6)) * 0.5,
        -88,
        26,
        ROLE.weights,
        'mono',
      ).opacity(a),
    );

    // Comm track: Block 2 All-Gather (duration 4 ms)
    const startMs = lt === 0 ? 0 : 5;
    const endMs = startMs + 4;
    nodes.push(
      txt('ALL-GATHER', -725, 38, 26, ROLE.comm, 'mono').opacity(a),
      rect(mx(endMs) - mx(startMs) - 6, 72, {
        fill: lt >= 1 ? '#2b1e10' : '#0e2834',
        stroke: lt >= 2 ? ROLE.bad : ROLE.comm,
        width: 2.8,
        radius: 8,
      })
        .at((mx(startMs) + mx(endMs)) * 0.5, 38)
        .glow(8, lt >= 2 ? ROLE.bad : ROLE.comm)
        .opacity(a),
      txt(
        lt === 1 ? '4 ms transfer from ms 5' : `Gather B2 (${startMs} → ${endMs} ms)`,
        (mx(startMs) + mx(endMs)) * 0.5,
        38,
        26,
        lt >= 2 ? ROLE.bad : ROLE.comm,
        'mono',
      ).opacity(a),
    );

    if (lt >= 2) {
      nodes.push(
        rect(mx(9) - mx(6) - 6, 72, { fill: '#33101e', stroke: ROLE.bad, width: 3.0, radius: 8 })
          .at((mx(6) + mx(9)) * 0.5, -88)
          .glow(10, ROLE.bad)
          .opacity(a),
        txt('WAIT 3 ms!', (mx(6) + mx(9)) * 0.5, -88, 26, ROLE.bad, 'mono').opacity(a),
      );
    }

    const msg =
      s7 > 0.5
        ? 'Overlap hides transfer, but B1 + prefetched B2 both resident = 7.0 GB!'
        : sl > 0.5
          ? 'Current + prefetched block both live'
          : lt === 2
            ? 'Arrives at ms 9 · 1 ms overlapped, 3 ms exposed wait!'
            : lt === 1
              ? 'Moved launch to ms 5 (4 ms transfer): how long does Block 2 wait?'
              : 'Launch at ms 0 → arrives by ms 4 (hidden before ms 6 deadline)';
    nodes.push(
      txt(msg, 0, 185, 28, lt === 2 ? ROLE.bad : COSMOS.gold, 'mono').opacity(a),
      txt(
        'Check profiler trace · tune implicit vs explicit prefetch & rate limiter',
        0,
        285,
        26,
        COSMOS.muted,
        'sans',
      ).opacity(a),
      glowDot(mx(0) + ((phase.value * 0.65) % 1) * (mx(10) - mx(0)), -175, {
        radius: 7,
        color: COSMOS.gold,
        opacity: a,
      }),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, gatherView, prefetchView);
  runPhase(s, c, phase, 14);

  c.on('root-gather', () => s.play(gatherMode.to(0, { duration: 0.35 })));
  c.after('one-block', () => s.play(gatherMode.to(1, { duration: 0.45 })));
  c.on('reuse-buffer', () => s.play(gatherMode.to(2, { duration: 0.45 })));
  c.on('late-gather', () => {
    s.play(
      par(
        showGather.to(0, { duration: 0.2 }),
        delay(showPrefetch.to(1, { duration: 0.25 }), 0.22),
        late.to(1, { duration: 0.45 }),
      ),
    );
  });
  c.after('exposed-wait', () => s.play(late.to(2, { duration: 0.45 })));
  c.on('prefetch-residency', () => s.play(showLive.to(1, { duration: 0.4 })));
  c.on('prefetch-total', () => s.play(showSeven.to(1, { duration: 0.4 })));
}
