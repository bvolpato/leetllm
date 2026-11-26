// Scene 16: Compare recipes at the same exposure: Controlled lanes + InstructGPT cosine floor + AdamW decoupled decay.
import {
  COSMOS,
  arrow,
  aura,
  glassCell,
  glowDot,
  glowTex,
  glowingTrail,
  group,
  guardedDynamic,
  heroTitle,
  instructGptCosine,
  line,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function recipeControlled(s, c) {
  const phase = s.value(0);
  const stageIdx = s.value(0); // 0=matched exposure, 1=InstructGPT cosine curve, 2=AdamW clipping/decay
  const curveTrace = s.value(0);

  const bgAura = aura(0, 30, 620, '#5ce1e61e', '#a78bfa16');
  const title = heroTitle(['Controlled Recipes', '& Schedules'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 62,
    accent: COSMOS.cyan,
    eyebrow: 'MATCHED EXPOSURE · COSINE FLOOR · ADAMW',
  });

  const eqAdamW = glowTex(
    String.raw`\theta_t = (1 - \eta_t\lambda)\theta_{t-1} - \eta_t \frac{\hat{m}_t}{\sqrt{\hat{v}_t}+\epsilon}`,
    {
      x: 0,
      y: 235,
      size: 38,
      color: COSMOS.violet,
    },
  );

  const live = guardedDynamic(1, () => {
    const p = phase.value;
    const st = Math.round(stageIdx.value);
    const tr = curveTrace.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.5);

    const nodes = [];

    if (st === 0) {
      // Beat 0: Controlled comparison lanes with frozen factors
      nodes.push(
        glassCell(0, -205, 1620, 86, COSMOS.cyan, { fill: '#0e1d30', glow: 8 }),
        txt(
          'FROZEN: Dataset · Chat Template · Trainable Modules · Target Exposure · Held-Out Grader',
          0,
          -205,
          27,
          COSMOS.cyan,
          'mono',
        ),
      );

      const lanes = [
        { name: 'Candidate A  (lr = 1e-4)', y: -35, col: COSMOS.blue },
        { name: 'Candidate B  (lr = 5e-5)', y: 145, col: COSMOS.violet },
      ];
      lanes.forEach((ln) => {
        nodes.push(
          glassCell(-550, ln.y, 490, 108, ln.col, { fill: '#101a30', glow: 8 }),
          txt(ln.name, -550, ln.y, 30, ln.col, 'mono'),
          arrow([-290, ln.y], [315, ln.y], { stroke: COSMOS.cyan, width: 4.5, tip: 14 }).glow(
            8,
            COSMOS.cyan,
          ),
          txt('Same approved targets & updates', 12, ln.y - 36, 26, COSMOS.muted, 'mono'),
          glassCell(565, ln.y, 440, 108, COSMOS.emerald, { fill: '#0c2624', glow: 9 * pulse }),
          txt('HELD-OUT GRADE', 565, ln.y, 30, COSMOS.emerald, 'mono'),
        );
      });

      nodes.push(
        txt(
          'Log schedule, clipping, decay groups, precision, and update count so differences stay interpretable',
          0,
          355,
          27,
          COSMOS.muted,
          'sans',
        ),
      );
    } else if (st === 1) {
      // Beat 1: Live InstructGPT cosine schedule (16 epochs, 0 warmup, 10% floor vs 0% standard)
      const x0 = -640;
      const x1 = 680;
      const y0 = 240; // lr = 0
      const yTop = -175; // lr = 1.0
      const mapX = (t) => x0 + t * (x1 - x0);
      const mapY = (r) => y0 - r * (y0 - yTop);

      nodes.push(
        txt(
          'INSTRUCTGPT SFT BASELINE · 16 EPOCHS · NO WARMUP · 10% COSINE FLOOR',
          0,
          -242,
          27,
          COSMOS.cyan,
          'mono',
        ),
        line([x0, y0], [x1, y0], { stroke: '#3a4b73', width: 2.8 }),
        line([x0, y0], [x0, yTop - 25], { stroke: '#3a4b73', width: 2.8 }),
        // 10% floor dashed guide
        line([x0, mapY(0.1)], [x1, mapY(0.1)], {
          stroke: COSMOS.gold,
          width: 2.2,
          dash: [10, 6],
        }).glow(6, COSMOS.gold),
        txt('10% floor', x1 + 92, mapY(0.1), 26, COSMOS.gold, 'mono'),
        txt('100%', x0 - 60, yTop, 26, COSMOS.cyan, 'mono'),
        txt('0%', x0 - 48, y0, 26, COSMOS.dim, 'mono'),
        txt('Epoch 0', x0, y0 + 44, 26, COSMOS.muted, 'mono'),
        txt('Epoch 16', x1, y0 + 44, 26, COSMOS.muted, 'mono'),
      );

      // Standard cosine decaying all the way to 0% (dim reference)
      const stdPts = Array.from({ length: 48 }, (_, i) => {
        const t = i / 47;
        return [mapX(t), mapY(instructGptCosine(t, 0.0))];
      });
      nodes.push(
        glowingTrail(stdPts, { color: COSMOS.dim, width: 2.4, glow: 0, core: false, opacity: 0.5 }),
        txt('Standard cosine (→ 0%)', mapX(0.32), 148, 26, COSMOS.dim, 'mono'),
      );

      // Active traced InstructGPT 10%-floor cosine curve
      const steps = Math.max(2, Math.round(tr * 60));
      const pts = Array.from({ length: steps }, (_, i) => {
        const t = (i / 59) * Math.max(0.02, tr);
        return [mapX(t), mapY(instructGptCosine(t, 0.1))];
      });
      const tip = pts.at(-1);
      nodes.push(
        glowingTrail(pts, {
          gradientColors: [COSMOS.cyan, COSMOS.emerald, COSMOS.gold],
          width: 5,
          glow: 11,
        }),
        glowDot(tip[0], tip[1], { radius: 9, color: COSMOS.gold }),
        txt(
          'Warmup shrinks early steps if used  ·  Adam still applies moment bias correction',
          0,
          365,
          28,
          COSMOS.muted,
          'sans',
        ),
      );
    } else {
      // Beat 2: AdamW decoupled weight decay + gradient clipping vs adaptive step
      const cy = -45;
      nodes.push(
        glassCell(-640, cy, 380, 116, COSMOS.blue, { fill: '#101a30', glow: 8 }),
        txt('RAW GRADIENT', -640, cy - 20, 26, COSMOS.muted, 'mono'),
        txt('Clip Norm', -640, cy + 24, 32, COSMOS.blue, 'mono'),
        arrow([-440, cy], [-315, cy], { stroke: COSMOS.cyan, width: 4, tip: 12 }),

        glassCell(-110, cy, 390, 116, COSMOS.cyan, { fill: '#0e2030', glow: 8 }),
        txt('ADAM MOMENTS', -110, cy - 20, 26, COSMOS.muted, 'mono'),
        txt('m̂ / (√v̂ + ε)', -110, cy + 24, 32, COSMOS.cyan, 'mono'),
        arrow([95, cy], [220, cy], { stroke: COSMOS.violet, width: 4, tip: 12 }),

        glassCell(430, cy, 400, 116, COSMOS.emerald, { fill: '#0c2624', glow: 10 * pulse }),
        txt('DECOUPLED DECAY', 430, cy - 20, 26, COSMOS.muted, 'mono'),
        txt('Next Weight θₜ', 430, cy + 24, 32, COSMOS.emerald, 'mono'),

        glassCell(0, 368, 1620, 96, COSMOS.violet, { fill: '#14122b', glow: 8 }),
        txt(
          'Clipping caps raw grad norm, NOT adaptive step size · Measure both grad norm & Δθ',
          0,
          368,
          28,
          COSMOS.violet,
          'mono',
        ),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('recipe-controlled-b1', () => s.play(stageIdx.to(0, { duration: 0.01 })));
  c.onBeat(1, () => s.play(stageIdx.to(1, { duration: 0.01 })));
  c.on('recipe-controlled-b2', () => s.play(curveTrace.to(1, { duration: 1.1 })));
  c.onBeat(2, () => s.play(stageIdx.to(2, { duration: 0.01 })));
  c.show('recipe-controlled-b3', eqAdamW);
  c.on('recipe-controlled-b3', () =>
    s.play(stageIdx.to(2, { duration: remainDuration(c, 'recipe-controlled-b3', 0.2) })),
  );
}
