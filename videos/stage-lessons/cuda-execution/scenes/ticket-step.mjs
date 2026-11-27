// Scene 04: Which tensor does the loss still need? 3D (4,8,16) batch pooling, device mismatch prediction, and SGD step.
import { delay, par } from 'vizmatic/stage';
import {
  COSMOS,
  TOKEN_VALUES,
  aura,
  box3d,
  cinematic3d,
  glassCell,
  glowDot,
  glowingArc,
  group,
  guardedDynamic,
  heroTitle,
  orbitScene,
  remainDuration,
  rule,
  txt,
} from '../parts.mjs';

export default function ticketStep(s, c) {
  const showPart1 = s.value(1);
  const poolProg = s.value(0);
  const logitsProg = s.value(0);

  const showPart2 = s.value(0);
  const showBytes = s.value(0);
  const showLabelBytes = s.value(0);
  const showMismatch = s.value(0);
  const labelsMoved = s.value(0);

  const showPart3 = s.value(0);
  const stepProg = s.value(0);

  const bgAura = aura(-220, 40, 520, '#5ce1e620', '#ffd16614');

  const title = heroTitle(['Four-Ticket', 'Training Step'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: COSMOS.cyan,
    eyebrow: 'PLACEMENT · SHAPES · CROSS-ENTROPY',
  });

  // 3D (4 x 8 x 16) tensor stack on the left for Beat 0
  const tensor3d = cinematic3d({
    theta: -0.68,
    phi: 1.04,
    distance: 15.2,
    unit: 82,
    focus: [0, 0, 0.2],
  }).at(-440, 65);

  for (let t = 0; t < 4; t++) {
    const z0 = -1.35 + t * 0.85;
    tensor3d.add(
      ...box3d(
        -1.9,
        -1.0,
        z0,
        3.8,
        2.0,
        0.48,
        t === 3 ? '#15435e' : '#12223d',
        t === 3 ? COSMOS.cyan : COSMOS.blue,
        0.72,
      ),
    );
  }
  // Highlight feature column 0 on top ticket
  tensor3d.add(...box3d(-1.9, -1.0, 1.24, 0.36, 2.0, 0.56, '#b8891d', COSMOS.gold, 0.85));

  const part1 = guardedDynamic(showPart1, (a) => {
    const pp = poolProg.value;
    const lp = logitsProg.value;
    const nodes = [
      txt('INPUT TENSOR (4, 8, 16)', -440, -210, 26, COSMOS.cyan, 'mono').opacity(a),
      txt('4 tickets · 8 tokens · 16 features', -440, 360, 28, COSMOS.muted, 'sans').opacity(a),
      txt(`Col 0 tokens: [${TOKEN_VALUES.join(', ')}]`, -440, 408, 26, COSMOS.gold, 'mono').opacity(
        a,
      ),
    ];

    // Pooled 4x16 + Linear(16, 3) -> 4x3 logits on the right
    nodes.push(
      glowingArc([-60, 40], [110, 40], -35, {
        color: COSMOS.cyan,
        width: 3.6,
        opacity: Math.max(0.25, pp) * a,
      }),
      glassCell(320, 40, 390, 210, pp > 0.5 ? COSMOS.emerald : COSMOS.rule, {
        fill: '#0e1d2b',
        glow: pp > 0.5 ? 9 : 0,
        opacity: a,
      }),
      txt('POOLED FEATURES', 320, -22, 26, COSMOS.cyan, 'mono').opacity(a),
      txt(pp > 0.5 ? '(4, 16)' : 'mean(dim=1)', 320, 40, 44, COSMOS.emerald, 'mono').opacity(a),
      txt(
        pp > 0.5 ? 'col 0: 21 / 8 = 2.625' : 'average 8 tokens',
        320,
        104,
        26,
        COSMOS.gold,
        'mono',
      ).opacity(a),

      glassCell(320, 305, 760, 140, lp > 0.5 ? COSMOS.gold : COSMOS.rule, {
        fill: '#181822',
        glow: lp > 0.5 ? 9 : 0,
        opacity: Math.max(0.25, lp) * a,
      }),
      txt('LINEAR(16 -> 3) · 3 × 16 + 3 = 51 PARAMS', 320, 268, 26, COSMOS.gold, 'mono').opacity(
        Math.max(0.25, lp) * a,
      ),
      txt(
        lp > 0.5 ? 'logits: (4, 3)  ·  3 scores per ticket' : 'mapping 16 features -> 3 logits',
        320,
        330,
        30,
        COSMOS.ink,
        'mono',
      ).opacity(Math.max(0.25, lp) * a),
    );
    return group(...nodes);
  });

  // Part 2: Byte counts + CPU vs cuda:0 placement + mismatch prediction -> move labels
  const part2 = guardedDynamic(showPart2, (a) => {
    const sb = showBytes.value;
    const lb = showLabelBytes.value;
    const mm = showMismatch.value;
    const mv = labelsMoved.value;

    const nodes = [
      // Top byte-size strip
      glassCell(-555, -180, 520, 118, COSMOS.cyan, { fill: '#0e1a2d', glow: 6, opacity: a }),
      txt('input  (4 × 8 × 16)', -555, -206, 26, COSMOS.muted, 'mono').opacity(a),
      txt('FP32 · 2,048 B', -555, -152, 34, COSMOS.cyan, 'mono').opacity(sb * a),

      glassCell(0, -180, 500, 118, COSMOS.cyan, { fill: '#0e1a2d', glow: 6, opacity: a }),
      txt('pooled  (4 × 16)', 0, -206, 26, COSMOS.muted, 'mono').opacity(a),
      txt('FP32 · 256 B', 0, -152, 34, COSMOS.cyan, 'mono').opacity(sb * a),

      glassCell(555, -180, 500, 118, COSMOS.cyan, { fill: '#0e1a2d', glow: 6, opacity: a }),
      txt('logits  (4 × 3)', 555, -206, 26, COSMOS.muted, 'mono').opacity(a),
      txt('FP32 · 48 B', 555, -152, 34, COSMOS.cyan, 'mono').opacity(sb * a),

      // Device boundary line
      txt('CPU HOST', -855, 18, 30, COSMOS.blue, 'mono', 'left').opacity(a),
      rule(-855, 112, 855, 112, COSMOS.rule, 3).opacity(a),
      txt('cuda:0 DEVICE', -855, 225, 30, COSMOS.cyan, 'mono', 'left').opacity(a),

      // Resident GPU tensors
      glassCell(-470, 225, 270, 118, COSMOS.cyan, { fill: '#0f1f30', glow: 7, opacity: a }),
      txt('model', -470, 225, 32, COSMOS.cyan, 'mono').opacity(a),

      glassCell(-140, 225, 290, 118, COSMOS.cyan, { fill: '#0f1f30', glow: 7, opacity: a }),
      txt('logits (4,3)', -140, 225, 30, COSMOS.cyan, 'mono').opacity(a),
    ];

    // Labels box (starts on CPU at y=18, moves to cuda:0 at y=225 when labelsMoved -> 1)
    const labelY = 18 + mv * 207;
    const labelColor = mv > 0.7 ? COSMOS.cyan : COSMOS.blue;
    nodes.push(
      glassCell(265, labelY, 390, 118, labelColor, {
        fill: mv > 0.7 ? '#0f2230' : '#101b36',
        glow: 8,
        opacity: a,
      }),
      txt('labels [0, 2, 1, 0]', 265, labelY - 14, 28, labelColor, 'mono').opacity(a),
      txt(
        lb > 0.5 ? 'int64 · 4 × 8 B = 32 B' : '4 class ints',
        265,
        labelY + 26,
        26,
        COSMOS.ink,
        'mono',
      ).opacity(a),
    );

    if (mv > 0.05 && mv < 0.95) {
      nodes.push(glowDot(265, labelY, { radius: 9, color: COSMOS.gold, glow: 14, opacity: a }));
    }

    // Cross-entropy loss box
    const lossReady = mv > 0.75;
    const lossFail = mm > 0.5 && !lossReady;
    const lossColor = lossReady ? COSMOS.emerald : lossFail ? COSMOS.rose : COSMOS.dim;
    nodes.push(
      glassCell(675, 225, 300, 118, lossColor, {
        fill: lossFail ? '#26111c' : lossReady ? '#0f2622' : '#101524',
        glow: lossReady || lossFail ? 10 : 0,
        opacity: a,
      }),
      txt('cross-entropy', 675, 206, 28, lossColor, 'mono').opacity(a),
      txt(
        lossReady ? 'same device · OK' : lossFail ? 'device mismatch!' : 'pending',
        675,
        248,
        26,
        lossReady ? COSMOS.emerald : lossFail ? COSMOS.rose : COSMOS.muted,
        'sans',
      ).opacity(a),
    );

    if (lossFail) {
      nodes.push(
        txt('Shapes match · Which tensor would you move?', 0, 385, 34, COSMOS.gold, 'serif')
          .glow(6, COSMOS.gold)
          .opacity(a),
      );
    } else if (lossReady) {
      nodes.push(
        glowingArc([468, 225], [520, 225], 0, { color: COSMOS.emerald, width: 4, opacity: a }),
        txt(
          'labels.to("cuda:0") puts scores and targets on the same device',
          0,
          385,
          30,
          COSMOS.emerald,
          'sans',
        ).opacity(a),
      );
    }

    return group(...nodes);
  });

  // Part 3: Full 6-stage SGD step
  const part3 = guardedDynamic(showPart3, (a) => {
    const sp = stepProg.value;
    const stages = [
      '1. Same device',
      '2. Logits (4 × 3)',
      '3. Cross-entropy',
      '4. Backward pass',
      '5. Finite check',
      '6. SGD update',
    ];
    const nodes = [
      txt('COMPLETE FOUR-TICKET SGD STEP', -855, -205, 26, COSMOS.emerald, 'mono', 'left').opacity(
        a,
      ),
    ];
    stages.forEach((label, i) => {
      const col = i % 3;
      const row = Math.floor(i / 3);
      const cx = -530 + col * 530;
      const cy = -40 + row * 215;
      const done = sp * 6 >= i + 0.6;
      const colHex = done ? COSMOS.emerald : COSMOS.rule;
      nodes.push(
        glassCell(cx, cy, 450, 128, colHex, {
          fill: done ? '#0e2422' : '#0d1322',
          glow: done ? 8 : 0,
          opacity: a,
        }),
        txt(label, cx, cy, 32, done ? COSMOS.emerald : COSMOS.dim, 'mono').opacity(a),
      );
    });
    nodes.push(
      txt(
        'Keep finite checks outside throughput timing: reading results in Python forces a wait',
        0,
        375,
        28,
        COSMOS.muted,
        'sans',
      ).opacity(a),
    );
    return group(...nodes);
  });

  s.add(bgAura, tensor3d, title, part1, part2, part3);
  orbitScene(
    s,
    c,
    tensor3d,
    { theta: -0.2, phi: 0.94 },
    {
      startOffset: 0.1,
      endMargin: Math.max(0.55, c.end - c.cue('ticket-byte-count').start + 0.35),
    },
  );

  c.on('ticket-pool', () => s.play(poolProg.to(1, { duration: 0.65 })));
  c.on('ticket-logits', () => s.play(logitsProg.to(1, { duration: 0.55 })));

  c.hide('ticket-byte-count', [tensor3d], { fade: 0.2 });
  c.on('ticket-byte-count', () => {
    s.play(
      par(
        showPart1.to(0, { duration: 0.2 }),
        delay(showPart2.to(1, { duration: 0.25 }), 0.22),
        delay(showBytes.to(1, { duration: 0.35 }), 0.25),
      ),
    );
  });
  c.on('ticket-label-bytes', () => s.play(showLabelBytes.to(1, { duration: 0.35 })));
  c.on('ticket-label-failure', () => s.play(showMismatch.to(1, { duration: 0.35 })));
  c.on('ticket-move-labels', () => s.play(labelsMoved.to(1, { duration: 0.7 })));

  c.on('ticket-complete', () => {
    s.play(
      par(
        showPart2.to(0, { duration: 0.2 }),
        delay(showPart3.to(1, { duration: 0.25 }), 0.22),
        delay(stepProg.to(1, { duration: remainDuration(c, 'ticket-complete', 1.6) }), 0.25),
      ),
    );
  });
}
