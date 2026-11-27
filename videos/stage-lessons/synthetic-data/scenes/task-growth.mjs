// Scene 04: Construct a task pool from reviewed seeds (Self-Instruct 175 -> 52,445, output-first, ROUGE-L < 0.7)
import {
  COSMOS,
  aura,
  glassCell,
  glowDot,
  glowTex,
  glowingArc,
  group,
  guardedDynamic,
  heroTitle,
  rect,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function taskGrowth(s, c) {
  const phase = s.value(0);
  const sDemos = s.value(0);
  const sDemoSplit = s.value(0);
  const sTotal = s.value(0);
  const sAct2 = s.value(0);
  const sLabels = s.value(0);
  const sInputs = s.value(0);
  const sAct3 = s.value(0);
  const sRouge = s.value(0);

  const bgAura = aura(0, 15, 680, '#133a5c2a', '#2b1b4e16');

  const title = heroTitle(['Construct a Task Pool', 'From Reviewed Seeds'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.cyan,
    eyebrow: 'SELF-INSTRUCT BOOTSTRAPPING · OUTPUT-FIRST & ROUGE-L < 0.7',
  });

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.6);
    const dm = sDemos.value;
    const ds = sDemoSplit.value;
    const tot = sTotal.value;
    const a2 = sAct2.value;
    const lb = sLabels.value;
    const inp = sInputs.value;
    const a3 = sAct3.value;
    const rg = sRouge.value;

    // Act 3: ROUGE-L similarity screening
    if (a3 > 0.5) {
      const nodes = [
        txt('HISTORICAL SELF-INSTRUCT NOVELTY SCREEN', 0, -185, 28, COSMOS.blue, 'mono'),
        glassCell(-465, -45, 560, 120, COSMOS.cyan, { fill: '#0f2138', glow: 7 }),
        txt('PROPOSED INSTRUCTION x', -465, -43, 30, COSMOS.cyan, 'mono'),
        glassCell(465, -45, 600, 120, COSMOS.blue, { fill: '#0f1c38', glow: 6 }),
        txt('EXISTING POOL { x_i }', 465, -43, 30, COSMOS.blue, 'mono'),
        glowingArc([-175, -45], [155, -45], 0, { color: COSMOS.gold, width: 4.2 }),

        // Similarity threshold bar
        glassCell(0, 290, 1320, 130, rg > 0.3 ? COSMOS.gold : COSMOS.rule, {
          fill: '#11182c',
          glow: rg > 0.3 ? 8 : 3,
        }),
        txt('KEEP  (< 0.70)', -440, 292, 30, COSMOS.emerald, 'mono'),
        txt('CUTOFF 0.70', 110, 292, 30, COSMOS.gold, 'mono'),
        txt('REJECT (>= 0.70)', 460, 292, 30, COSMOS.rose, 'mono'),
        txt(
          'Plus instance validity checks to keep repeated wording out of the pool',
          0,
          404,
          28,
          COSMOS.muted,
          'sans',
        ),
      ];
      return group(...nodes);
    }

    // Act 2: Output-first classification instances
    if (a2 > 0.5) {
      const nodes = [
        txt('OUTPUT-FIRST CLASSIFICATION BALANCES RARE CLASSES', 0, -188, 28, COSMOS.cyan, 'mono'),

        // Left branch: rare class "rate limited"
        glassCell(-440, -56, 700, 114, COSMOS.gold, {
          fill: '#241b0c',
          glow: lb > 0.2 ? 9 * pulse : 5,
        }),
        txt('1. PICK LABEL:  rate limited', -440, -54, 32, COSMOS.gold, 'mono'),
        glassCell(-440, 186, 700, 130, inp > 0.2 ? COSMOS.gold : COSMOS.rule, {
          fill: '#131a2e',
          glow: inp > 0.2 ? 7 : 2,
          opacity: Math.max(0.75, inp),
        }),
        txt(
          inp > 0.2 ? '2. INPUT: HTTP 429 / same cursor' : '2. GENERATE MATCHING INPUT...',
          -440,
          188,
          28,
          inp > 0.2 ? COSMOS.ink : COSMOS.dim,
          'mono',
        ),

        // Right branch: common class "success"
        glassCell(440, -56, 700, 114, COSMOS.emerald, {
          fill: '#0e2824',
          glow: lb > 0.2 ? 8 : 4,
        }),
        txt('1. PICK LABEL:  success', 440, -54, 32, COSMOS.emerald, 'mono'),
        glassCell(440, 186, 700, 130, inp > 0.2 ? COSMOS.emerald : COSMOS.rule, {
          fill: '#102030',
          glow: inp > 0.2 ? 7 : 2,
          opacity: Math.max(0.75, inp),
        }),
        txt(
          inp > 0.2 ? '2. INPUT: HTTP 200 / next_cursor' : '2. GENERATE MATCHING INPUT...',
          440,
          188,
          28,
          inp > 0.2 ? COSMOS.ink : COSMOS.dim,
          'mono',
        ),

        txt(
          'Classification: label -> input   ·   Other tasks: input -> output',
          0,
          365,
          28,
          COSMOS.muted,
          'sans',
        ),
      ];
      if (inp > 0.15) {
        nodes.push(
          glowingArc([-440, 6], [-440, 116], 0, { color: COSMOS.gold, width: 3.6, opacity: inp }),
          glowingArc([440, 6], [440, 116], 0, { color: COSMOS.emerald, width: 3.6, opacity: inp }),
        );
      }
      return group(...nodes);
    }

    // Act 1: 175 human seeds -> 8 prompt demos (6 human + 2 model) -> 52,445 pool
    const nodes = [
      txt('175 HUMAN SEED TASKS (EACH CELL = 5)', -490, -186, 26, COSMOS.blue, 'mono'),
      glassCell(-490, 42, 680, 380, COSMOS.blue, { fill: '#0d182d', glow: 5 }),
    ];

    for (let i = 0; i < 35; i++) {
      const col = i % 7;
      const row = Math.floor(i / 7);
      const cx = -730 + col * 80;
      const cy = -86 + row * 64;
      const lit = (i + Math.floor(p * 3)) % 9 === 0;
      nodes.push(
        rect(58, 42, {
          fill: lit ? '#2563eb' : '#163566',
          stroke: COSMOS.blue,
          width: 1.6,
          radius: 6,
        }).at(cx, cy),
      );
    }

    // Right: 8 prompt demonstrations (6 human + 2 model)
    nodes.push(
      txt(
        ds > 0.2 ? '8 PROMPT DEMOS: 6 HUMAN + 2 MODEL' : '8 SAMPLED PROMPT DEMOS',
        395,
        -186,
        26,
        COSMOS.cyan,
        'mono',
      ),
      glassCell(395, 42, 810, 380, dm > 0.2 ? COSMOS.cyan : COSMOS.rule, {
        fill: '#0e192d',
        glow: dm > 0.2 ? 6 : 2,
        opacity: Math.max(0.76, dm),
      }),
    );

    for (let i = 0; i < 8; i++) {
      const col = i % 4;
      const row = Math.floor(i / 4);
      const cx = 115 + col * 186;
      const cy = -44 + row * 144;
      const isHuman = i < 6;
      const accent = isHuman ? COSMOS.blue : COSMOS.cyan;
      nodes.push(
        glassCell(cx, cy, 162, 86, accent, {
          fill: isHuman ? '#102446' : '#0f2c3c',
          glow: dm > 0.3 ? 5 : 1,
          opacity: Math.max(0.72, dm),
        }),
        txt(isHuman ? `Human ${i + 1}` : `Model ${i - 5}`, cx, cy + 2, 26, accent, 'mono').opacity(
          Math.max(0.72, dm),
        ),
      );
    }

    if (dm > 0.2) {
      nodes.push(
        glowingArc([-140, 42], [-20, 42], 0, { color: COSMOS.cyan, width: 4, opacity: dm }),
        glowDot(-20, 42, { radius: 6, color: COSMOS.cyan, opacity: dm }),
      );
    }

    // Bottom pool counter
    nodes.push(
      glassCell(0, 344, 1640, 108, tot > 0.3 ? COSMOS.emerald : COSMOS.rule, {
        fill: tot > 0.3 ? '#0e2624' : '#0c1222',
        glow: tot > 0.3 ? 8 * pulse : 2,
      }),
      txt(
        tot > 0.3
          ? 'FILTERED INSTRUCTION POOL:   52,445 INSTRUCTIONS   (FROM 175 SEEDS)'
          : 'ITERATIVE GENERATION + FILTERING LOOP:   175 SEEDS -> GROWING POOL',
        0,
        346,
        30,
        tot > 0.3 ? COSMOS.emerald : COSMOS.muted,
        'mono',
      ),
    );

    return group(...nodes);
  });

  const eqRouge = glowTex('\\max_i \\operatorname{ROUGE\\text{-}L}(x, x_i) < 0.7', {
    x: 0,
    y: 120,
    size: 46,
    color: COSMOS.gold,
    glow: 7,
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('task-demos', () => s.play(sDemos.to(1, { duration: 0.45 })));
  c.on('task-demo-count', () => s.play(sDemoSplit.to(1, { duration: 0.45 })));
  c.after('task-total', () => s.play(sTotal.to(1, { duration: 0.45 })));
  c.on('output-first', () => s.play(sAct2.to(1, { duration: 0.35 })));
  c.on('labels-first', () => s.play(sLabels.to(1, { duration: 0.45 })));
  c.on('class-inputs', () => s.play(sInputs.to(1, { duration: 0.45 })));
  c.on('rouge-rule', () => s.play(sAct3.to(1, { duration: 0.35 })));
  c.show('rouge-cutoff', eqRouge, { after: true });
  c.after('rouge-cutoff', () =>
    s.play(sRouge.to(1, { duration: remainDuration(c, 'rouge-cutoff', 0.45) })),
  );
}
