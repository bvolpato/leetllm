// Scene 15: What did the smaller model learn from? (Gemma 2, DeepSeek-R1 & recipe taxonomy)
import {
  COSMOS,
  aura,
  glassCell,
  glowDot,
  glowingArc,
  group,
  guardedDynamic,
  heroTitle,
  line,
  rect,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function recipeEvidence(s, c) {
  const phase = s.value(0);
  const beatMode = s.value(0); // 0=Gemma 2 (b0), 1=DeepSeek-R1 (b1), 2=Taxonomy (b2)
  const gemmaProg = s.value(0.25);
  const r1DataProg = s.value(0);
  const r1ScoreProg = s.value(0);

  const bgAura = aura(0, 30, 620, '#13345b26', '#2e1c5214');
  const title = heroTitle(['What Did the Smaller', 'Model Learn From?'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: COSMOS.blue,
    eyebrow: 'EMPIRICAL EVIDENCE · GEMMA 2 · DEEPSEEK-R1 · RECIPE MATRIX',
  });

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);
    const mode = Math.round(beatMode.value);

    if (mode === 0) {
      // Beat 0: Controlled Gemma 2 experiment (2B student, 500B tokens: 60.3 vs 67.7)
      const gp = gemmaProg.value;
      const baseY = 230;
      const maxH = 300;
      const hScratch = (60.3 / 80) * maxH * gp;
      const hDistill = (67.7 / 80) * maxH * gp;

      return group(
        txt(
          'GEMMA 2 CONTROLLED EXPERIMENT · 2B STUDENT · 500B TOKENS',
          -855,
          -206,
          28,
          COSMOS.cyan,
          'mono',
          'left',
        ),
        line([-680, baseY], [220, baseY], { stroke: COSMOS.rule, width: 2.4 }),

        // From scratch bar
        rect(220, Math.max(16, hScratch), {
          fill: '#123447',
          stroke: COSMOS.cyan,
          width: 2.6,
          radius: 8,
        })
          .at(-440, baseY - Math.max(16, hScratch) * 0.5)
          .glow(5, COSMOS.cyan),
        txt('FROM SCRATCH', -440, baseY + 42, 28, COSMOS.cyan, 'mono'),
        txt(
          (60.3 * gp).toFixed(1),
          -440,
          baseY - Math.max(16, hScratch) - 34,
          44,
          COSMOS.cyan,
          'mono',
        ),

        // Distilled bar
        rect(220, Math.max(16, hDistill), {
          fill: '#17386b',
          stroke: COSMOS.blue,
          width: 2.8,
          radius: 8,
        })
          .at(-40, baseY - Math.max(16, hDistill) * 0.5)
          .glow(9 * pulse, COSMOS.blue),
        txt('7B LOGIT DISTILL', -40, baseY + 42, 28, COSMOS.blue, 'mono'),
        txt(
          (67.7 * gp).toFixed(1),
          -40,
          baseY - Math.max(16, hDistill) - 34,
          44,
          COSMOS.blue,
          'mono',
        ).glow(7, COSMOS.blue),

        // Delta arc
        glowingArc([-440, baseY - hScratch - 74], [-40, baseY - hDistill - 74], -36, {
          color: COSMOS.emerald,
          width: 3.6,
          opacity: gp,
        }),
        txt(
          '+7.4 pts mean',
          -240,
          baseY - Math.max(hScratch, hDistill) - 134,
          32,
          COSMOS.emerald,
          'mono',
        ).opacity(gp),

        // Right summary glass card
        glassCell(555, 20, 560, 320, COSMOS.blue, { fill: '#101d35', glow: 6 }),
        txt('SAME SIZE & TOKEN BUDGET', 555, -88, 26, COSMOS.muted, 'mono'),
        txt('+7.4 pts', 555, -16, 68, COSMOS.emerald, 'mono').glow(8, COSMOS.emerald),
        txt('3-benchmark average', 555, 58, 30, COSMOS.ink, 'sans'),
        txt('Controlled 7B -> 2B comparison', 555, 118, 26, COSMOS.muted, 'sans'),

        txt(
          'Same 2B architecture & 500B token budget: teacher token probabilities lift quality sharply',
          0,
          358,
          28,
          COSMOS.muted,
          'sans',
        ),
      );
    }

    if (mode === 1) {
      // Beat 1: DeepSeek-R1 Jan 2025 report (600k reasoning + 200k general -> Qwen-32B SFT)
      const dp = Math.max(0.25, r1DataProg.value);
      const sp = r1ScoreProg.value;
      const stripL = -780;
      const wReas = 1170 * dp;
      const wGen = 390 * dp;

      const nodes = [
        txt(
          'DEEPSEEK-R1 REPORT (JAN 2025) · RESPONSE DISTILLATION SFT',
          -855,
          -206,
          28,
          COSMOS.violet,
          'mono',
          'left',
        ),
        rect(1560, 82, { fill: '#10182b', stroke: COSMOS.rule, width: 2, radius: 8 }).at(0, -104),
        rect(Math.max(20, wReas), 78, {
          fill: '#1b3a6e',
          stroke: COSMOS.blue,
          width: 2.4,
          radius: 8,
        })
          .at(stripL + wReas * 0.5, -104)
          .glow(6, COSMOS.blue),
        rect(Math.max(20, wGen), 78, {
          fill: '#0e3c50',
          stroke: COSMOS.cyan,
          width: 2.4,
          radius: 8,
        })
          .at(stripL + wReas + wGen * 0.5, -104)
          .glow(5, COSMOS.cyan),
        txt('~600k reasoning examples (75%)', stripL + 380, -24, 28, COSMOS.blue, 'mono').opacity(
          dp,
        ),
        txt('~200k general (25%)', stripL + 1320, -24, 28, COSMOS.cyan, 'mono').opacity(dp),

        glassCell(-425, 134, 760, 210, sp > 0.4 ? COSMOS.emerald : COSMOS.rule, {
          fill: '#0f2824',
          glow: sp > 0.4 ? 9 * pulse : 2,
          opacity: Math.max(0.65, sp),
        }),
        txt('QWEN-32B · AIME 2024 PASS@1', -425, 76, 26, COSMOS.emerald, 'mono'),
        txt('72.6%', -425, 146, 68, COSMOS.emerald, 'mono').glow(8, COSMOS.emerald),
        txt('Single sampled answer (not cons@64)', -425, 206, 26, COSMOS.muted, 'sans'),

        glassCell(425, 134, 760, 210, sp > 0.4 ? COSMOS.gold : COSMOS.rule, {
          fill: '#201b0d',
          glow: sp > 0.4 ? 8 * pulse : 2,
          opacity: Math.max(0.65, sp),
        }),
        txt('QWEN-32B · MATH-500', 425, 76, 26, COSMOS.gold, 'mono'),
        txt('94.3%', 425, 146, 68, COSMOS.gold, 'mono').glow(8, COSMOS.gold),
        txt('T = 0.6 · top-p = 0.95 · max 32,768 tokens', 425, 206, 26, COSMOS.muted, 'mono'),

        txt(
          'Decoding temperature, top-p, max length, and pass@1 vs majority vote are part of the result',
          0,
          354,
          27,
          COSMOS.muted,
          'sans',
        ),
      ];
      return group(...nodes);
    }

    // Beat 2: Recipe taxonomy (Orca, Phi-1.5, Gemma 2, GKD)
    const recipes = [
      { name: 'Orca', sig: 'Written explanation traces (SFT)', col: COSMOS.blue, x: -435, y: -64 },
      {
        name: 'Phi-1.5',
        sig: 'Synthetic textbook-like pretraining',
        col: COSMOS.cyan,
        x: 435,
        y: -64,
      },
      {
        name: 'Gemma 2',
        sig: 'Teacher next-token probabilities',
        col: COSMOS.emerald,
        x: -435,
        y: 128,
      },
      {
        name: 'GKD',
        sig: 'Task-dependent loss (JSD vs Fwd KL)',
        col: COSMOS.violet,
        x: 435,
        y: 128,
      },
    ];
    return group(
      txt(
        'MATCH THE RECIPE TO ITS SIGNAL, FAMILY & BUDGET',
        -855,
        -206,
        28,
        COSMOS.gold,
        'mono',
        'left',
      ),
      ...recipes.flatMap(({ name, sig, col, x, y }) => [
        glassCell(x, y, 790, 146, col, { fill: '#101a2f', glow: 6 }),
        glowDot(x - 350, y - 24, { radius: 7, color: col }),
        txt(name, x - 322, y - 22, 34, col, 'mono', 'left'),
        txt(sig, x - 322, y + 30, 28, COSMOS.ink, 'sans', 'left'),
      ]),
      glassCell(0, 336, 1660, 88, COSMOS.gold, { fill: '#201b0d', glow: 6 }),
      txt(
        'Borrow a result only with its signal, model family, decoding settings, and eval budget',
        0,
        338,
        28,
        COSMOS.gold,
        'sans',
      ),
    );
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('gemma-evidence', () => s.play(gemmaProg.to(1, { duration: 1.1 })));
  c.onBeat(1, () => s.play(beatMode.to(1, { duration: 0.25 })));
  c.on('r1-dataset', () => s.play(r1DataProg.to(1, { duration: 0.9 })));
  c.on('r1-evidence', () =>
    s.play(r1ScoreProg.to(1, { duration: remainDuration(c, 'r1-evidence', 0.7) })),
  );
  c.onBeat(2, () => s.play(beatMode.to(2, { duration: 0.25 })));
}
