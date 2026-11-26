// Scene 07: Where does this target belong? (Vocab ID alignment, 1-step shift, global token mean)
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
  line,
  rect,
  remainAfterDuration,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function alignmentMask(s, c) {
  const phase = s.value(0);
  const stageMode = s.value(0); // 0=vocab IDs (b0), 1=causal shift (b1), 2=token mean (b2), 3=all masked (b3)
  const mapProg = s.value(0);
  const shiftProg = s.value(0);
  const softProg = s.value(0);
  const secondProg = s.value(0);
  const meanRevealed = s.value(0);

  const bgAura = aura(0, 30, 620, '#14335c26', '#2e1d5214');
  const title = heroTitle(['Where Does Each', 'Target Belong?'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: COSMOS.cyan,
    eyebrow: 'VOCAB IDENTITY · 1-STEP CAUSAL SHIFT · GLOBAL TOKEN MEAN',
  });

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);
    const mode = Math.round(stageMode.value);

    if (mode === 0) {
      // Beat 0: Same vocab size (2), swapped IDs for bird and dog
      const mp = mapProg.value;
      const colX = [-180, 420];
      const tY = -95;
      const sY = 175;
      const nodes = [
        txt('SAME VOCAB SIZE, SWAPPED TOKEN IDs', -855, -210, 28, COSMOS.amber, 'mono', 'left'),
        txt('ID 0', colX[0], -192, 28, COSMOS.muted, 'mono'),
        txt('ID 1', colX[1], -192, 28, COSMOS.muted, 'mono'),
        txt('TEACHER HEAD', -660, tY, 32, COSMOS.blue, 'mono'),
        txt('STUDENT HEAD', -660, sY, 32, COSMOS.cyan, 'mono'),

        glassCell(colX[0], tY, 310, 108, COSMOS.gold, { fill: '#17294a', glow: 8 * pulse }),
        txt('bird', colX[0], tY - 14, 34, COSMOS.gold, 'mono'),
        txt('q = 0.80', colX[0], tY + 26, 28, COSMOS.blue, 'mono'),

        glassCell(colX[1], tY, 310, 108, COSMOS.rule, { fill: '#121b30', glow: 3 }),
        txt('dog', colX[1], tY - 14, 34, COSMOS.muted, 'mono'),
        txt('q = 0.20', colX[1], tY + 26, 28, COSMOS.muted, 'mono'),

        glassCell(colX[0], sY, 310, 108, COSMOS.rule, { fill: '#121b30', glow: 3 }),
        txt('dog', colX[0], sY - 14, 34, COSMOS.muted, 'mono'),
        txt(
          mp > 0.8 ? 'target = 0.20' : 'ID 0 != bird!',
          colX[0],
          sY + 26,
          26,
          COSMOS.rose,
          'mono',
        ),

        glassCell(colX[1], sY, 310, 108, mp > 0.8 ? COSMOS.emerald : COSMOS.gold, {
          fill: mp > 0.8 ? '#0f2c27' : '#102438',
          glow: 8 * pulse,
        }),
        txt('bird', colX[1], sY - 14, 34, COSMOS.gold, 'mono'),
        txt(
          mp > 0.8 ? 'target = 0.80' : 'bird lives here',
          colX[1],
          sY + 26,
          26,
          mp > 0.8 ? COSMOS.emerald : COSMOS.cyan,
          'mono',
        ),
      ];

      // Crossing probability packets
      const birdX = colX[0] + (colX[1] - colX[0]) * mp;
      const birdY = tY + 62 + (sY - tY - 124) * mp - 42 * Math.sin(Math.PI * mp);
      const dogX = colX[1] + (colX[0] - colX[1]) * mp;
      const dogY = tY + 62 + (sY - tY - 124) * mp + 42 * Math.sin(Math.PI * mp);

      nodes.push(
        glowingArc([colX[0], tY + 56], [colX[1], sY - 56], -48, {
          color: COSMOS.gold,
          width: 3.4,
          opacity: Math.max(0.45, mp),
        }),
        glowingArc([colX[1], tY + 56], [colX[0], sY - 56], 48, {
          color: COSMOS.dim,
          width: 2.6,
          opacity: Math.max(0.35, mp),
        }),
        glowDot(birdX, birdY, { radius: 9, color: COSMOS.gold }),
        glowDot(dogX, dogY, { radius: 7, color: COSMOS.cyan }),
        txt(
          mp > 0.8
            ? 'Re-indexed student target: [0.20, 0.80] · Check full token-to-ID map & chat template'
            : 'Follow "bird" (0.80) from teacher ID 0 to student ID 1',
          0,
          342,
          28,
          mp > 0.8 ? COSMOS.emerald : COSMOS.gold,
          'sans',
        ),
      );
      return group(...nodes);
    }

    if (mode === 1) {
      // Beat 1: 5-token causal sequence [BOS, prompt, answer 1, answer 2, PAD]
      const slots = ['BOS', 'prompt', 'ans 1', 'ans 2', 'PAD'];
      const slotX = (i) => -640 + i * 320;
      const sh = shiftProg.value;
      const sf = softProg.value;
      const sc = secondProg.value;

      const nodes = [
        txt(
          'SAME INPUT SEQUENCE · RESPONSE-ONLY MASKING',
          -855,
          -210,
          28,
          COSMOS.cyan,
          'mono',
          'left',
        ),
        txt('TEACHER LOGITS', -830, 88, 26, COSMOS.blue, 'mono', 'left'),
        txt('STUDENT LOGITS', -830, 178, 26, COSMOS.cyan, 'mono', 'left'),
      ];

      slots.forEach((word, i) => {
        const cx = slotX(i);
        const isSup = i === 1 || i === 2;
        const isLabel = i === 2 || i === 3;
        const masked = i === 0 || i === 4;
        nodes.push(
          txt(`slot ${i}`, cx, -138, 26, COSMOS.muted, 'mono'),
          glassCell(cx, -70, 236, 86, isLabel ? COSMOS.gold : masked ? COSMOS.dim : COSMOS.cyan, {
            fill: masked ? '#131724' : '#101d35',
            glow: isSup ? 6 : 2,
          }),
          txt(word, cx, -68, 32, masked ? COSMOS.dim : COSMOS.ink, 'mono'),
        );
      });

      // Pair 1 (slot 1 -> hard label slot 2; soft KL at slot 1)
      const pairs = [
        { from: 1, to: 2, hardV: sh, softV: sf, label: 'label 2' },
        { from: 2, to: 3, hardV: sc, softV: sc, label: 'label 3' },
      ];
      pairs.forEach(({ from, to, hardV, softV, label }) => {
        const fx = slotX(from);
        const tx = slotX(to);
        if (hardV > 0.08) {
          nodes.push(
            glowingArc([fx + 24, 62], [tx - 24, -18], -52, {
              color: COSMOS.gold,
              width: 3.6,
              opacity: hardV,
            }),
            glowDot(tx - 24, -18, { radius: 6.5, color: COSMOS.gold, opacity: hardV }),
            txt(`hard -> ${label}`, (fx + tx) * 0.5 + 36, 48, 26, COSMOS.gold, 'mono').opacity(
              hardV,
            ),
          );
        }
        if (softV > 0.08) {
          nodes.push(
            line([fx, 88], [fx, 178], { stroke: COSMOS.emerald, width: 3.4 })
              .glow(7, COSMOS.emerald)
              .opacity(softV),
            glowDot(fx, 88, { radius: 9, color: COSMOS.blue, opacity: softV }),
            glowDot(fx, 178, { radius: 9, color: COSMOS.cyan, opacity: softV }),
            txt(`KL @ slot ${from}`, fx, 238, 28, COSMOS.emerald, 'mono').opacity(softV),
          );
        }
      });

      nodes.push(
        txt(
          'Hard CE shifts labels left (t+1) · Soft KL compares Teacher & Student at same slot t',
          0,
          354,
          28,
          COSMOS.muted,
          'sans',
        ),
      );
      return group(...nodes);
    }

    // Beats 2 & 3: Global token mean (0.65) vs unweighted batch mean (0.50), then all-masked batch skip
    const isEmpty = mode >= 3;
    const rev = meanRevealed.value;
    const losses = [
      { batch: 'Batch A', val: 0.2, col: COSMOS.blue },
      { batch: 'Batch B', val: 0.8, col: COSMOS.cyan },
      { batch: 'Batch B', val: 0.8, col: COSMOS.cyan },
      { batch: 'Batch B', val: 0.8, col: COSMOS.cyan },
    ];

    const nodes = [
      txt(
        isEmpty
          ? 'ALL TARGETS MASKED (0 VALID TOKENS)'
          : 'FLATTEN TO [VALID_TOKENS, VOCAB] BEFORE BATCHMEAN',
        -855,
        -210,
        28,
        isEmpty ? COSMOS.rose : COSMOS.gold,
        'mono',
        'left',
      ),
    ];

    losses.forEach((item, i) => {
      const cx = -570 + i * 380;
      nodes.push(
        txt(item.batch, cx, -128, 28, COSMOS.muted, 'mono'),
        glassCell(cx, -32, 268, 126, isEmpty ? COSMOS.dim : item.col, {
          fill: isEmpty ? '#131724' : '#101d35',
          glow: isEmpty ? 0 : 6,
        }),
        txt(
          isEmpty ? 'masked' : item.val.toFixed(1),
          cx,
          -30,
          isEmpty ? 32 : 46,
          isEmpty ? COSMOS.dim : item.col,
          'mono',
        ),
      );
    });

    if (isEmpty) {
      nodes.push(
        glassCell(0, 178, 1280, 140, COSMOS.rose, { fill: '#2a121c', glow: 10 * pulse }),
        txt('0 VALID TOKENS  ->  SKIP optimizer.step()', 0, 148, 36, COSMOS.rose, 'mono').glow(
          7,
          COSMOS.rose,
        ),
        txt(
          'AdamW still applies decoupled weight decay when .grad is a zero tensor (skips None)',
          0,
          208,
          26,
          COSMOS.ink,
          'sans',
        ),
      );
    } else {
      nodes.push(
        glassCell(-420, 184, 720, 152, rev > 0.5 ? COSMOS.emerald : COSMOS.gold, {
          fill: rev > 0.5 ? '#0f2c27' : '#1b1910',
          glow: rev > 0.5 ? 9 * pulse : 4,
        }),
        txt('GLOBAL TOKEN MEAN (CORRECT)', -420, 140, 26, COSMOS.emerald, 'mono'),
        txt(
          rev > 0.5 ? '(1 x 0.2 + 3 x 0.8) / 4  =  0.65' : 'Sum all 4 valid tokens / 4 = ?',
          -420,
          202,
          32,
          rev > 0.5 ? COSMOS.emerald : COSMOS.gold,
          'mono',
        ),

        glassCell(420, 184, 720, 152, rev > 0.5 ? COSMOS.rose : COSMOS.rule, {
          fill: rev > 0.5 ? '#28121b' : '#12192b',
          glow: rev > 0.5 ? 6 : 2,
        }),
        txt('UNWEIGHTED BATCH MEAN (BIASED)', 420, 140, 26, COSMOS.rose, 'mono'),
        txt(
          rev > 0.5 ? '(0.2 + 0.8) / 2  =  0.50' : 'Average two batch means = ?',
          420,
          202,
          32,
          rev > 0.5 ? COSMOS.rose : COSMOS.muted,
          'mono',
        ),

        txt(
          'Under grad accumulation or DDP, normalize by global valid token count',
          0,
          342,
          28,
          COSMOS.muted,
          'sans',
        ),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('map-bird', () => s.play(mapProg.to(1, { duration: 1.0 })));
  c.onBeat(1, () => s.play(stageMode.to(1, { duration: 0.25 })));
  c.on('shift-hard', () => s.play(shiftProg.to(1, { duration: 0.65 })));
  c.on('response-mask', () => s.play(softProg.to(1, { duration: 0.65 })));
  c.on('second-answer', () => s.play(secondProg.to(1, { duration: 0.65 })));
  c.onBeat(2, () => s.play(stageMode.to(2, { duration: 0.25 })));
  c.after('token-mean', () =>
    s.play(meanRevealed.to(1, { duration: remainAfterDuration(c, 'token-mean', 0.45) })),
  );
  c.onBeat(3, () => s.play(stageMode.to(3, { duration: 0.25 })));
}
