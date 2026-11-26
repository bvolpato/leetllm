// Scene 14: earned-transfer: Final worker SLO test (410ms TTFT, 47ms max gap) -> 9-page FP8 fit (4.5 MiB) -> 0.6 req/s goodput (60%).
import {
  COSMOS,
  FINAL_WORKER_METRICS,
  FINAL_WORKER_TIMES,
  ROLE,
  aura,
  bindCueBeat,
  glowDot,
  glowingTrail,
  group,
  guardedDynamic,
  heroTitle,
  lumBar,
  playCue,
  rect,
  swapVis,
  txt,
} from '../parts.mjs';

export default function earnedTransfer(s, c) {
  const view1Vis = s.value(1);
  const view2Vis = s.value(0);
  const view3Vis = s.value(0);

  const revealPass = s.value(0); // strictly withheld until AFTER `trace-verdict`!
  const revealShrink = s.value(0); // strictly withheld until AFTER `ic-capacity-answer`!
  const showGoodput = s.value(0);

  const bgAura = aura(0, 0, 740, '#103c3628', '#16355e18');
  const title = heroTitle(['A Worker Under Load:', 'SLO, Pages & Goodput'], {
    x: -855,
    y: -430,
    size: 50,
    lineHeight: 58,
    accent: ROLE.decode,
  });

  // View 1: SLO trace check (TTFT <= 450ms, max gap <= 50ms)
  const view1 = guardedDynamic(view1Vis, (alpha) => {
    const pass = revealPass.value;
    const xOf = (ms) => -760 + (ms / 580) * 1520;
    const ry = -70;
    const nodes = [
      txt(
        'TARGETS:  TTFT ≤ 450 ms   ·   EVERY GAP ≤ 50 ms',
        -855,
        -220,
        28,
        ROLE.wait,
        'mono',
        'left',
      ).opacity(alpha),
      glowingTrail(
        [
          [xOf(0), ry],
          [xOf(560), ry],
        ],
        { color: '#273a64', width: 3.5, core: false, opacity: alpha },
      ),
      txt('0 ms', xOf(0), ry + 42, 26, COSMOS.dim, 'mono', 'center').opacity(alpha),
    ];

    FINAL_WORKER_TIMES.forEach((ms, idx) => {
      const px = xOf(ms);
      nodes.push(
        glowDot(px, ry, {
          radius: 10,
          color: pass > 0.5 ? ROLE.decode : ROLE.clockA,
          glow: 14,
          opacity: alpha,
        }),
        txt(`T${idx + 1}`, px, ry - 42, 28, ROLE.clockA, 'mono', 'center').opacity(alpha),
        txt(`${ms}`, px, ry + 42, 26, COSMOS.ink, 'mono', 'center').opacity(alpha),
      );
    });

    if (pass < 0.2) {
      nodes.push(
        txt('Does this reply pass both latency targets?', -855, 130, 36, ROLE.wait, 'serif', 'left')
          .glow(8, ROLE.wait)
          .opacity((1 - pass * 5) * alpha),
      );
    } else {
      nodes.push(
        txt(
          `PASS! TTFT = ${FINAL_WORKER_METRICS.ttft} ms (≤450)  ·  max gap = ${Math.max(...FINAL_WORKER_METRICS.gaps)} ms (≤50)  ·  mean = ${FINAL_WORKER_METRICS.tpot} ms (${FINAL_WORKER_METRICS.decodeTps.toFixed(1)} tok/s)`,
          -855,
          130,
          28,
          ROLE.decode,
          'mono',
          'left',
        )
          .glow(8, ROLE.decode)
          .opacity(pass * alpha),
      );
    }
    return group(...nodes);
  });

  // View 2: 8-page pool (7 used + 2 needed = 9 pages -> 1-byte KV halves page size so 9 pages = 4.5 MiB fit!)
  const view2 = guardedDynamic(view2Vis, (alpha) => {
    const sh = revealShrink.value;
    const pageW = sh > 0.5 ? 72 : 144;
    const nodes = [
      txt(
        'MEMORY RECORD: 8 MiB POOL (7 RESERVED + 2 NEEDED = 9 PAGES)',
        -855,
        -220,
        28,
        ROLE.clockA,
        'mono',
        'left',
      ).opacity(alpha),
      // Pool boundary at 8 full FP16 pages = -760 + 8 * 154
      lumBar(-760 + 8 * 154, -40, 4, 150, ROLE.wait, { opacity: 0.85 * alpha, glow: 8 }),
      txt('8 MiB POOL', -760 + 8 * 154, -140, 26, ROLE.wait, 'mono', 'center').opacity(alpha),
    ];

    for (let i = 0; i < 9; i++) {
      const isNew = i >= 7;
      const step = sh > 0.5 ? 82 : 154;
      const px = -760 + pageW * 0.5 + i * step;
      const col = isNew ? (sh > 0.5 ? ROLE.decode : ROLE.stall) : ROLE.clockA;
      nodes.push(
        rect(pageW - 8, 86, { fill: '#121f38', stroke: col, width: 2.6, radius: 8 })
          .at(px, -40)
          .glow(isNew ? 10 : 4, col)
          .opacity(alpha),
        txt(`P${i + 1}`, px, -40, 26, col, 'mono', 'center').opacity(alpha),
      );
    }

    if (sh < 0.2) {
      nodes.push(
        txt(
          'Fixed reservations: faster decode or smaller cache values to fit all 3 at once?',
          -855,
          165,
          30,
          ROLE.wait,
          'serif',
          'left',
        )
          .glow(8, ROLE.wait)
          .opacity((1 - sh * 5) * alpha),
      );
    } else {
      nodes.push(
        txt(
          '1 byte/value halves each page (0.5 MiB) → all 9 pages fit in 4.5 MiB!',
          -855,
          165,
          32,
          ROLE.decode,
          'mono',
          'left',
        )
          .glow(8, ROLE.decode)
          .opacity(sh * alpha),
      );
    }
    return group(...nodes);
  });

  // View 3: 20-second load window goodput (12 on-time + 5 rejected + 3 failed = 20 offered -> 0.6 req/s, 60%)
  const view3 = guardedDynamic(view3Vis, (alpha) => {
    const gp = showGoodput.value;
    const maxW = 900;
    const barX = -450;
    const nodes = [
      txt(
        '20-SECOND LOAD WINDOW (20 REQUESTS OFFERED)',
        -855,
        -220,
        28,
        ROLE.clockA,
        'mono',
        'left',
      ).opacity(alpha),

      txt('Correct & on-time', -855, -100, 30, ROLE.decode, 'mono', 'left').opacity(alpha),
      lumBar(barX, -100, (12 / 20) * maxW, 40, ROLE.decode, { opacity: alpha, maxTrackW: maxW }),
      txt('12 (60%)', barX + maxW + 30, -100, 32, ROLE.decode, 'mono', 'left')
        .glow(8, ROLE.decode)
        .opacity(alpha),

      txt('Rejected', -855, 5, 30, ROLE.wait, 'mono', 'left').opacity(alpha),
      lumBar(barX, 5, (5 / 20) * maxW, 40, ROLE.wait, { opacity: alpha, maxTrackW: maxW }),
      txt('5 (25%)', barX + maxW + 30, 5, 32, ROLE.wait, 'mono', 'left').opacity(alpha),

      txt('Failed', -855, 110, 30, ROLE.stall, 'mono', 'left').opacity(alpha),
      lumBar(barX, 110, (3 / 20) * maxW, 40, ROLE.stall, { opacity: alpha, maxTrackW: maxW }),
      txt('3 (15%)', barX + maxW + 30, 110, 32, ROLE.stall, 'mono', 'left').opacity(alpha),

      txt(
        'Goodput = 12 / 20 s = 0.6 req/s   ·   60% of offered requests succeeded on time',
        -855,
        265,
        32,
        ROLE.decode,
        'mono',
        'left',
      )
        .glow(8, ROLE.decode)
        .opacity((0.35 + 0.65 * gp) * alpha),
    ];
    return group(...nodes);
  });

  s.add(bgAura, title, view1, view2, view3);
  // Strictly withhold answers across both prediction questions!
  playCue(s, c, 'trace-verdict', (d) => s.play(revealPass.to(1, { duration: d })), {
    after: true,
    dur: 0.45,
  });
  playCue(s, c, 'open-pool', (d) => s.play(swapVis(view1Vis, view2Vis, d)), { dur: 0.6 });
  playCue(s, c, 'ic-capacity-answer', (d) => s.play(revealShrink.to(1, { duration: d })), {
    after: true,
    dur: 0.55,
  });
  playCue(s, c, 'score-window', (d) => s.play(swapVis(view2Vis, view3Vis, d)), { dur: 0.6 });
  playCue(s, c, 'per-second', (d) => s.play(showGoodput.to(1, { duration: d })), {
    after: true,
    dur: 0.45,
  });
  bindCueBeat(s, c, s.value(0), [
    'test-stream',
    'worst-gap',
    'second-rate',
    'new-pages',
    'shrink-pages',
    'verify-pages',
    'fraction-offered',
  ]);
}
