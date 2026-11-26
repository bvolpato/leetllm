// Scene 15: What reaches one optimizer update?: Effective batch scaling (128 -> 256) + DDP double-divide fix.
import {
  COSMOS,
  DDP_AVERAGED,
  DDP_GRADS,
  DDP_INTENDED,
  DDP_TARGETS,
  EXPOSURE_4W,
  EXPOSURE_8W,
  aura,
  glassCell,
  glowDot,
  glowingArc,
  group,
  guardedDynamic,
  heroTitle,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function globalTargetBudget(s, c) {
  const phase = s.value(0);
  const stageIdx = s.value(0); // 0=4 workers (128 items), 1=8 workers (256 items), 2=DDP all-reduce
  const showFix = s.value(0);

  const bgAura = aura(0, 30, 620, '#60a5fa1e', '#6ee7b716');
  const title = heroTitle(['Global Target', 'Budget & DDP'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 62,
    accent: COSMOS.cyan,
    eyebrow: 'EFFECTIVE BATCH · ALL-REDUCE NORMALIZATION',
  });

  const live = guardedDynamic(1, () => {
    const p = phase.value;
    const st = Math.round(stageIdx.value);
    const fix = showFix.value > 0.5;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.6);

    const nodes = [];

    if (st < 2) {
      const is8 = st === 1;
      const workers = is8 ? 8 : 4;
      const batch = is8 ? 2 : 4;
      const accum = is8 ? 16 : 8;
      const exp = is8 ? EXPOSURE_8W : EXPOSURE_4W;

      nodes.push(
        txt(
          `PER WORKER: ${batch} ITEMS × ${accum} MICROBATCHES = ${batch * accum} ITEMS`,
          0,
          -235,
          28,
          is8 ? COSMOS.amber : COSMOS.cyan,
          'mono',
        ),
      );

      for (let i = 0; i < workers; i++) {
        const col = i % 4;
        const row = Math.floor(i / 4);
        const wx = -585 + col * 390;
        const wy = is8 ? -105 + row * 150 : -45;
        const wCol = is8 ? COSMOS.amber : COSMOS.blue;
        nodes.push(
          glassCell(wx, wy, 344, 110, wCol, { fill: '#101a30', glow: 8 }),
          txt(`WORKER ${i + 1}`, wx, wy - 20, 26, wCol, 'mono'),
          txt(`${batch * accum} items`, wx, wy + 24, 32, COSMOS.ink, 'mono'),
        );
      }

      // Effective batch + scored targets readouts
      const botY = 215;
      nodes.push(
        glassCell(-420, botY, 790, 140, is8 ? COSMOS.amber : COSMOS.emerald, {
          fill: is8 ? '#241a10' : '#0c2624',
          glow: 10 * pulse,
        }),
        txt('EFFECTIVE LOADER ITEMS PER UPDATE', -420, botY - 36, 26, COSMOS.muted, 'mono'),
        txt(
          `${batch} × ${accum} × ${workers} = ${exp.items} items`,
          -420,
          botY + 24,
          40,
          is8 ? COSMOS.amber : COSMOS.emerald,
          'mono',
        ).glow(7, is8 ? COSMOS.amber : COSMOS.emerald),

        glassCell(420, botY, 790, 140, COSMOS.cyan, { fill: '#0e2030', glow: 9 }),
        txt(
          is8 ? 'HIDDEN BATCH DOUBLING' : 'SCORED TARGET BUDGET',
          420,
          botY - 36,
          26,
          COSMOS.muted,
          'mono',
        ),
        txt(
          is8
            ? '128 → 256 items  (local batch halved!)'
            : `${workers} × 1,560 = ${exp.targets.toLocaleString('en-US')} targets`,
          420,
          botY + 24,
          34,
          COSMOS.cyan,
          'mono',
        ).glow(6, COSMOS.cyan),

        txt(
          is8
            ? 'Always log per-device batch, accumulation, world size, and active supervised tokens together'
            : 'With packing, each loader item holds multiple demonstrations · Track active targets too',
          0,
          378,
          27,
          COSMOS.muted,
          'sans',
        ),
      );
    } else {
      // Beat 2: 2-worker DDP all-reduce gradient double-division check
      nodes.push(
        txt(
          `2-WORKER DDP CHECK · GLOBAL ACTIVE TARGETS = ${DDP_TARGETS} · INTENDED GRADIENT = 6 / 4 = ${DDP_INTENDED.toFixed(1)}`,
          0,
          -235,
          26,
          COSMOS.cyan,
          'mono',
        ),
      );

      DDP_GRADS.forEach((g, i) => {
        const wx = i === 0 ? -430 : 430;
        const localNorm = g / DDP_TARGETS;
        nodes.push(
          glassCell(wx, -80, 620, 152, COSMOS.blue, { fill: '#101b32', glow: 8 }),
          txt(`WORKER ${i + 1} · LOSS-SUM GRADIENT = ${g}`, wx, -118, 26, COSMOS.cyan, 'mono'),
          txt(`${g} ÷ ${DDP_TARGETS} = ${localNorm.toFixed(1)}`, wx, -52, 42, COSMOS.ink, 'mono'),
          glowingArc([wx, 2], [0, 92], 14, { color: COSMOS.rose, width: 3.6 }),
        );
      });

      // DDP Averaging Node (double divide -> 0.75)
      nodes.push(
        glassCell(0, 148, 1360, 114, fix ? COSMOS.amber : COSMOS.rose, {
          fill: '#24101b',
          glow: 10 * pulse,
        }),
        txt('DDP ALL-REDUCE AVERAGES ACROSS 2 WORKERS', 0, 116, 26, COSMOS.muted, 'mono'),
        txt(
          `(0.5 + 1.0) ÷ 2 = ${DDP_AVERAGED.toFixed(2)}  (divided by 2 twice!)`,
          0,
          172,
          32,
          COSMOS.rose,
          'mono',
        ).glow(6, COSMOS.rose),
      );

      // Compensation step (* world_size once -> 1.5)
      if (fix) {
        nodes.push(
          glowDot(0, 232, { radius: 8, color: COSMOS.emerald }),
          glassCell(0, 336, 1560, 112, COSMOS.emerald, {
            fill: '#0c2624',
            glow: 12 * pulse,
          }),
          txt(
            `COMPENSATE ONCE:  ${DDP_AVERAGED.toFixed(2)} × 2 = ${DDP_INTENDED.toFixed(1)}  (exact global token gradient)`,
            0,
            336,
            30,
            COSMOS.emerald,
            'mono',
          ).glow(8, COSMOS.emerald),
        );
      } else {
        nodes.push(
          txt(
            'Verify whether your trainer already scales by world_size before compensating',
            0,
            336,
            28,
            COSMOS.gold,
            'sans',
          ),
        );
      }
    }

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('global-target-budget-b1', () => s.play(stageIdx.to(0, { duration: 0.01 })));
  c.on('global-target-budget-b2', () => s.play(stageIdx.to(1, { duration: 0.01 })));
  c.on('global-target-budget-b3', () => s.play(stageIdx.to(2, { duration: 0.01 })));
  c.after('ddp-fix', () => s.play(showFix.to(1, { duration: remainDuration(c, 'ddp-fix', 0.45) })));
}
