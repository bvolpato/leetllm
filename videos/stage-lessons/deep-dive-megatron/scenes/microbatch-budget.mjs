// Scene 11: Microbatch budget and pipeline bubble denominators (m=8, 131,072 tokens; idle=(p-1)/(m+p-1)=1/9 vs bubble/compute=(p-1)/m=1/8; 1F1B warmup-steady-cooldown).
import {
  COSMOS,
  ROLE,
  aura,
  glassCell,
  glowTex,
  group,
  guardedDynamic,
  heroTitle,
  txt,
  wireStepCues,
} from '../parts.mjs';

export default function microbatchBudget(s, c) {
  // step: 0=m=8 & 131,072 tokens, 1=m=8 highlight, 2=131,072 tokens, 3=bubble formulas, 4=1/9 vs 1/8, 5=1F1B schedule
  const step = s.value(0);

  const bgAura = aura(0, 15, 620, '#a78bfa1c', '#5ce1e618');
  const title = heroTitle(['Microbatch Budget &', 'Bubble Denominators'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: ROLE.pp,
    eyebrow: 'M = 8 MICROBATCHES · 1/9 IDLE VS 1/8 BUBBLE · 1F1B',
  });

  const ratioTex = glowTex(
    String.raw`\frac{p-1}{m+p-1}=\frac{1}{9} \quad\text{vs}\quad \frac{p-1}{m}=\frac{1}{8}`,
    { x: 430, y: -365, size: 36, color: COSMOS.gold },
  );

  const live = guardedDynamic(1, () => {
    const st = Math.round(step.value);
    const nodes = [];

    if (st <= 4) {
      // Top row: microbatch & token count
      nodes.push(
        glassCell(-420, -145, 760, 155, st >= 1 ? ROLE.pp : ROLE.dim, {
          fill: '#16132d',
          glow: st >= 1 ? 9 : 4,
        }),
        txt('MICROBATCH COUNT (FIXED GLOBAL BATCH)', -420, -184, 26, ROLE.pp, 'mono'),
        txt('GBS = 64  /  (DP=4 x MBS=2)  =  8', -420, -120, 28, COSMOS.ink, 'mono'),

        glassCell(420, -145, 760, 155, st >= 2 ? ROLE.cp : ROLE.dim, {
          fill: '#0f2034',
          glow: st >= 2 ? 9 : 4,
        }),
        txt('TOKENS PER UPDATE (S = 2,048)', 420, -184, 26, ROLE.cp, 'mono'),
        txt('64 x 2,048 = 131,072 positions', 420, -120, 28, COSMOS.ink, 'mono'),

        // Bottom row: two bubble denominators for p=2, m=8
        glassCell(-420, 95, 760, 185, st >= 3 ? ROLE.good : ROLE.dim, {
          fill: st >= 3 ? '#0e2524' : '#0d1322',
          glow: st >= 3 ? 10 : 3,
        }),
        txt('IDLE FRACTION OF TOTAL TIME', -420, 42, 26, ROLE.good, 'mono'),
        txt('(p - 1) / (m + p - 1)  =  1 / 9 (11.1%)', -420, 114, 28, COSMOS.ink, 'mono'),

        glassCell(420, 95, 760, 185, st >= 4 ? COSMOS.gold : ROLE.dim, {
          fill: st >= 4 ? '#1f1a10' : '#0d1322',
          glow: st >= 4 ? 10 : 3,
        }),
        txt('BUBBLE OVER USEFUL COMPUTE', 420, 42, 26, COSMOS.gold, 'mono'),
        txt('(p - 1) / m  =  1 / 8 (12.5%)', 420, 114, 28, COSMOS.ink, 'mono'),
      );
    } else {
      // 1F1B schedule timeline across Stage 0 and Stage 1 (warmup -> steady 1F1B -> cooldown)
      nodes.push(
        txt(
          '1F1B SCHEDULE: WARMUP -> STEADY 1F1B -> COOLDOWN (VIRTUAL CHUNKS CUT BUBBLE)',
          0,
          -238,
          26,
          COSMOS.gold,
          'mono',
        ),
      );
      const s0 = ['F0', 'F1', 'B0', 'F2', 'B1', 'F3', 'B2', 'B3', 'idle'];
      const s1 = ['idle', 'F0', 'B0', 'F1', 'B1', 'F2', 'B2', 'F3', 'B3'];
      [
        { label: 'Stage 0', cells: s0, y: -95 },
        { label: 'Stage 1', cells: s1, y: 75 },
      ].forEach((row) => {
        nodes.push(txt(row.label, -790, row.y, 28, ROLE.pp, 'mono', 'left'));
        row.cells.forEach((cell, i) => {
          const x = -540 + i * 165;
          const isIdle = cell === 'idle';
          const isB = cell.startsWith('B');
          const col = isIdle ? ROLE.bad : isB ? ROLE.ep : ROLE.tp;
          nodes.push(
            glassCell(x, row.y, 146, 98, col, {
              fill: isIdle ? '#2d1222' : isB ? '#1f1a10' : '#101f38',
              glow: isIdle ? 8 : 5,
            }),
            txt(cell, x, row.y, 28, isIdle ? ROLE.bad : COSMOS.ink, 'mono'),
          );
        });
      });
      nodes.push(
        txt(
          'Follow microbatch 0: F0 (Stage 0 -> Stage 1) then B0 (Stage 1 -> Stage 0)',
          0,
          215,
          28,
          COSMOS.ink,
          'sans',
        ),
      );
    }

    nodes.push(
      txt(
        'TP and CP copies add zero independent examples; re-time if batch ramp or packing changes work',
        0,
        355,
        26,
        COSMOS.muted,
        'sans',
      ),
    );
    return group(...nodes);
  });

  s.add(bgAura, title, ratioTex, live);
  wireStepCues(s, c, step, [
    ['mg-microbatch-budget-b0', 0],
    ['mg-micro-eight', 1],
    ['mg-token-budget', 2],
    ['mg-microbatch-budget-b1', 3],
    ['mg-bubble-ratios', 4],
    ['mg-microbatch-budget-b2', 5],
  ]);
}
