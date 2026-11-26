// Scene 16: load-operating-point: Fixed replay harness, open-loop (100ms) vs closed-loop (400ms), 2-GPU sweep -> 3 req/s (1.5/GPU).
import {
  BEST_LOAD,
  COSMOS,
  LOAD_ROWS,
  ROLE,
  aura,
  group,
  guardedDynamic,
  heroTitle,
  lumBar,
  playCue,
  swapVis,
  txt,
} from '../parts.mjs';

export default function loadOperatingPoint(s, c) {
  const view1Vis = s.value(1); // Open-loop vs closed-loop + replay controls
  const view2Vis = s.value(0); // 2-GPU attainment sweep (2->95%, 3->92%, 4->84% vs 90% threshold)
  const loopStep = s.value(0);
  const pickBest = s.value(0);

  const bgAura = aura(0, 0, 740, '#14335c28', '#14383222');
  const title = heroTitle(['Open-Loop Benchmarks &', 'Operating-Point Selection'], {
    x: -855,
    y: -430,
    size: 50,
    lineHeight: 58,
    accent: ROLE.ok,
  });

  const view1 = guardedDynamic(view1Vis, (alpha) => {
    const ls = Math.round(loopStep.value);
    const barX = -420;
    const maxW = 940;
    const nodes = [
      txt(
        'FIXED REPLAY HARNESS (60% SHORT / 30% MED / 10% LONG)',
        -855,
        -225,
        26,
        ROLE.a,
        'mono',
        'left',
      ).opacity(alpha),
      txt('Open-Loop (100 ms)', -855, -110, 28, ROLE.d, 'mono', 'left').opacity(alpha),
      lumBar(barX, -110, maxW, 34, ROLE.d, { opacity: alpha, maxTrackW: maxW }),
      txt('10 req/s steady', barX + maxW + 24, -110, 26, ROLE.d, 'mono', 'left').opacity(alpha),

      txt('Closed-Loop (400 ms)', -855, 10, 28, ROLE.warn, 'mono', 'left').opacity(
        alpha * (ls >= 2 ? 1 : 0.4),
      ),
      lumBar(barX, 10, maxW * 0.25, 34, ROLE.warn, {
        opacity: alpha * (ls >= 2 ? 1 : 0.4),
        maxTrackW: maxW,
      }),
      txt('2.5 req/s (throttled!)', barX + maxW + 24, 10, 26, ROLE.warn, 'mono', 'left').opacity(
        alpha * (ls >= 2 ? 1 : 0.4),
      ),

      txt(
        ls >= 2
          ? 'Closed-loop waits for each 400 ms reply and hides overload as the server slows!'
          : 'Hold model, tokenizer, hardware, warmup, cache reuse & replay counts identical across schedulers',
        0,
        195,
        28,
        ls >= 2 ? ROLE.warn : COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
    ];
    return group(...nodes);
  });

  const view2 = guardedDynamic(view2Vis, (alpha) => {
    const pb = pickBest.value;
    const barX = -380;
    const maxW = 860;
    const targetX = barX + 0.9 * maxW;

    const nodes = [
      txt(
        '2-GPU ATTAINMENT SWEEP (TARGET >= 90% JOINT SLO)',
        -855,
        -225,
        26,
        ROLE.ok,
        'mono',
        'left',
      ).opacity(alpha),
      lumBar(targetX - 2, 10, 4, 310, ROLE.d, { opacity: alpha * 0.85, glow: 8 }),
      txt('90% SLO', targetX, -172, 26, ROLE.d, 'mono', 'center').opacity(alpha),
    ];

    LOAD_ROWS.forEach((row, idx) => {
      const y = -95 + idx * 105;
      const isBest = row.rate === BEST_LOAD.rate;
      const pass = row.attainment >= 0.9;
      const col = isBest && pb > 0.3 ? ROLE.ok : pass ? ROLE.a : ROLE.warn;
      nodes.push(
        txt(`${row.rate} req/s`, -855, y, 30, col, 'mono', 'left').opacity(alpha),
        lumBar(barX, y, row.attainment * maxW, 38, col, { opacity: alpha, maxTrackW: maxW }),
        txt(
          `${Math.round(row.attainment * 100)}%${isBest && pb > 0.3 ? '  <- PICK' : ''}`,
          barX + maxW + 26,
          y,
          30,
          col,
          'mono',
          'left',
        ).opacity(alpha),
      );
    });

    nodes.push(
      txt(
        pb > 0.3
          ? `Highest passing rate: ${BEST_LOAD.rate} req/s / 2 GPUs = ${BEST_LOAD.perGpu.toFixed(1)} req/s per GPU`
          : 'Check which offered rate keeps at least 90% of arrivals inside both targets',
        0,
        265,
        30,
        pb > 0.3 ? ROLE.ok : ROLE.d,
        'mono',
        'center',
      )
        .glow(pb > 0.3 ? 8 : 0, ROLE.ok)
        .opacity(alpha),
    );
    return group(...nodes);
  });

  s.add(bgAura, title, view1, view2);
  playCue(s, c, 'load-operating-point-b1', (d) => s.play(loopStep.to(0, { duration: d })));
  playCue(s, c, 'load-work', (d) => s.play(loopStep.to(1, { duration: d })));
  playCue(s, c, 'load-natural', (d) => s.play(loopStep.to(1, { duration: d })));
  playCue(s, c, 'load-operating-point-b2', (d) => s.play(loopStep.to(2, { duration: d })));
  playCue(s, c, 'load-closed', (d) => s.play(loopStep.to(2, { duration: d })));
  playCue(s, c, 'load-operating-point-b3', (d) => s.play(swapVis(view1Vis, view2Vis, d)));
  playCue(s, c, 'load-choice', (d) => s.play(pickBest.to(1, { duration: d })));
}
