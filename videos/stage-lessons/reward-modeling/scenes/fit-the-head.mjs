// Scene 15: What did the reward head learn? Live 300-step weight trajectories, confounded vs balanced shortcut test.
import {
  BALANCED_FIT,
  CONFOUNDED_FIT,
  CONTROLLED_PAIRS,
  COSMOS,
  FINAL_RULE_FIXTURE,
  afterDuration,
  aura,
  circle,
  glowDot,
  glowingTrail,
  group,
  guardedDynamic,
  headScore,
  heroTitle,
  line,
  remainDuration,
  tokenCell,
  txt,
} from '../parts.mjs';

export default function fitTheHead(s, c) {
  const swapped = s.value(0);
  const stepFrac = s.value(0.05); // 0 -> 1 over 300 gradient steps
  const showTestD = s.value(0);
  const revealConf = s.value(0);
  const revealBal = s.value(0);
  const showCtrl = s.value(0);

  const bgAura = aura(150, 15, 580, '#fb923c1c', '#6ee7b716');
  const title = heroTitle(['What Did the', 'Head Learn?'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.amber,
    eyebrow: '300 GRADIENT STEPS · COMPLIANCE VS LENGTH',
  });

  // Weight-space plane (w_compliance on x, w_length on y) on top-right
  const gx0 = -150;
  const gx1 = 420;
  const gy0 = 90;
  const gy1 = -345;
  const mapWc = (v) => gx0 + (v / 3.0) * (gx1 - gx0);
  const mapWl = (v) => gy0 - ((v + 0.2) / 2.2) * (gy0 - gy1);

  const confW = CONFOUNDED_FIT.weights;
  const balW = BALANCED_FIT.weights;
  const featA = FINAL_RULE_FIXTURE.reviewFirst.features; // [1, 0]
  const featD = FINAL_RULE_FIXTURE.verbose.features; // [0, 2]
  const confScoreA = headScore(confW, featA); // 1.629
  const confScoreD = headScore(confW, featD); // 3.259
  const balScoreA = headScore(balW, featA); // 2.667
  const balScoreD = headScore(balW, featD); // 0.000

  const live = guardedDynamic(1, () => {
    const sw = swapped.value;
    const sf = stepFrac.value;
    const td = showTestD.value;
    const rc = revealConf.value;
    const rb = revealBal.value;
    const ct = showCtrl.value;

    const maxIdx = Math.max(1, Math.min(300, Math.round(sf * 300)));
    const confPts = [];
    const balPts = [];
    const stride = Math.max(1, Math.floor(maxIdx / 45));
    for (let i = 0; i <= maxIdx; i += stride) {
      const cw = CONFOUNDED_FIT.trajectory[i];
      const bw = BALANCED_FIT.trajectory[i];
      confPts.push([mapWc(cw[0]), mapWl(cw[1])]);
      balPts.push([mapWc(bw[0]), mapWl(bw[1])]);
    }
    const curConf = CONFOUNDED_FIT.trajectory[maxIdx];
    const curBal = BALANCED_FIT.trajectory[maxIdx];
    confPts.push([mapWc(curConf[0]), mapWl(curConf[1])]);
    balPts.push([mapWc(curBal[0]), mapWl(curBal[1])]);

    const nodes = [
      // Left: Training pair contrast (Confounded vs Balanced)
      txt('TRAINING PAIRS  Δh = [Δcomp, Δlen]', -855, -205, 26, COSMOS.muted, 'mono', 'left'),
      tokenCell(-680, -108, 330, 118, COSMOS.amber, { fill: '#1f1612', glow: 6 }),
      txt('CONFOUNDED', -680, -142, 26, COSMOS.amber, 'mono'),
      txt('Pair 1: (+1, +1)', -680, -102, 26, COSMOS.ink, 'mono'),
      txt('Pair 2: (+1, +1)', -680, -68, 26, COSMOS.amber, 'mono'),

      tokenCell(-680, 42, 330, 118, COSMOS.emerald, {
        fill: '#0d2224',
        glow: sw > 0.5 ? 9 : 3,
        opacity: Math.max(0.45, sw),
      }),
      txt('BALANCED', -680, 8, 26, COSMOS.emerald, 'mono').opacity(Math.max(0.45, sw)),
      txt('Pair 1: (+1, +1)', -680, 48, 26, COSMOS.ink, 'mono').opacity(Math.max(0.45, sw)),
      txt(
        sw > 0.5 ? 'Pair 2: (+1, -1)' : 'Pair 2: (+1, +1)',
        -680,
        82,
        26,
        COSMOS.emerald,
        'mono',
      ).opacity(Math.max(0.45, sw)),

      // Center-top: Live 2D weight-space optimization plane
      line([gx0, gy0], [gx1, gy0], { stroke: '#455885', width: 2.5 }),
      line([gx0, gy0], [gx0, gy1], { stroke: '#455885', width: 2.5 }),
      line([gx0, mapWl(0)], [gx1, mapWl(0)], { stroke: '#2c3d66', width: 1.8, dash: [6, 6] }),
      txt('w_compliance', (gx0 + gx1) * 0.5, gy0 + 46, 26, COSMOS.emerald, 'mono'),
      txt('w_length', gx0 - 18, gy1 - 24, 26, COSMOS.amber, 'mono', 'right'),
      txt(`step ${maxIdx} / 300`, gx1 - 10, gy1 - 24, 26, COSMOS.muted, 'mono', 'right'),

      // Glowing weight trajectories (live coordinates placed cleanly in unobstructed legend above plot)
      glowingTrail(confPts, { color: COSMOS.amber, width: 4.8, glow: 11 }),
      glowingTrail(balPts, { color: COSMOS.emerald, width: 4.8, glow: 11 }),
      glowDot(mapWc(curConf[0]), mapWl(curConf[1]), { radius: 9, color: COSMOS.amber }),
      glowDot(mapWc(curBal[0]), mapWl(curBal[1]), { radius: 9, color: COSMOS.emerald }),
      txt(
        `Conf: [${curConf[0].toFixed(2)}, ${curConf[1].toFixed(2)}]`,
        gx0 + 18,
        gy1 + 18,
        26,
        COSMOS.amber,
        'mono',
        'left',
      ),
      txt(
        `Bal: [${curBal[0].toFixed(2)}, ${curBal[1].toFixed(2)}]`,
        gx0 + 18,
        gy1 + 56,
        26,
        COSMOS.emerald,
        'mono',
        'left',
      ),

      // Right-top: Held-out challenge pair A=[1,0] vs verbose D=[0,2]
      txt('CHALLENGE PAIR', 670, -345, 26, COSMOS.gold, 'mono'),
      tokenCell(670, -252, 340, 108, COSMOS.cyan, { fill: '#0f1c2e', glow: td > 0.4 ? 8 : 3 }),
      txt('A: waits for review', 670, -278, 26, COSMOS.cyan, 'sans'),
      txt('h(A) = [1, 0]', 670, -230, 30, COSMOS.ink, 'mono'),

      tokenCell(670, -110, 340, 118, COSMOS.rose, { fill: '#221120', glow: td > 0.4 ? 9 : 3 }),
      txt('D: grants now (wordy)', 670, -142, 26, COSMOS.rose, 'sans'),
      txt(td > 0.4 ? 'h(D) = [0, 2]' : 'h(D) = [0, ?]', 670, -90, 30, COSMOS.amber, 'mono'),

      // Prediction / Verdict readouts on right (STRICT WITHHOLDING until rc / rb > 0.5!)
      txt('CONFOUNDED HEAD', 670, 26, 26, COSMOS.amber, 'mono'),
      txt(
        rc > 0.5 ? `D=${confScoreD.toFixed(2)} > A=${confScoreA.toFixed(2)}` : 'A vs D = ?',
        670,
        74,
        30,
        rc > 0.5 ? COSMOS.rose : COSMOS.gold,
        'mono',
      ).glow(rc > 0.5 ? 7 : 4, rc > 0.5 ? COSMOS.rose : COSMOS.gold),

      txt('BALANCED HEAD', 670, 165, 26, COSMOS.emerald, 'mono'),
      txt(
        rb > 0.5 ? `A=${balScoreA.toFixed(2)} > D=${balScoreD.toFixed(2)}` : 'A vs D = ?',
        670,
        213,
        30,
        rb > 0.5 ? COSMOS.emerald : COSMOS.gold,
        'mono',
      ).glow(rb > 0.5 ? 7 : 4, rb > 0.5 ? COSMOS.emerald : COSMOS.gold),
    ];

    // Bottom strip: 3 Controlled Held-Out Pairs comparison (cleanly spaced below header)
    line([-855, 255], [810, 255], { stroke: '#253355', width: 2 });
    if (ct > 0.05) {
      nodes.push(
        txt(
          '3 FRESH HELD-OUT PAIRS  ·  Confounded: 1/3   |   Balanced: 3/3',
          0,
          294,
          26,
          COSMOS.gold,
          'mono',
        ).opacity(ct),
      );
      const labels = ['Row 1: D longer (+2)', 'Row 2: D longer (+3)', 'Row 3: same length'];
      CONTROLLED_PAIRS.forEach(([fa, fd], idx) => {
        const rx = -560 + idx * 560;
        const cOk = headScore(confW, fa) > headScore(confW, fd);
        const bOk = headScore(balW, fa) > headScore(balW, fd);
        nodes.push(
          txt(labels[idx], rx, 344, 26, COSMOS.ink, 'sans').opacity(ct),
          txt(
            `Conf: ${cOk ? 'A ✓' : 'D FAIL'}`,
            rx - 110,
            396,
            26,
            cOk ? COSMOS.emerald : COSMOS.rose,
            'mono',
          ).opacity(ct),
          txt(
            `Bal: ${bOk ? 'A ✓' : 'D FAIL'}`,
            rx + 110,
            396,
            26,
            bOk ? COSMOS.emerald : COSMOS.rose,
            'mono',
          ).opacity(ct),
        );
      });
    } else {
      const cap =
        rb > 0.5
          ? `Balanced head keeps A (${balScoreA.toFixed(2)}) above D (${balScoreD.toFixed(2)}) because w_length = 0`
          : rc > 0.5
            ? `Confounded head ranks verbose D (${confScoreD.toFixed(2)}) above A (${confScoreA.toFixed(2)}) via w_length`
            : td > 0.4
              ? 'Multiply each feature by its weight and add: which head ranks D above A?'
              : 'L2 shrinks weight norm; only opposing length pairs cancel w_length to zero';
      const capCol =
        rb > 0.5 ? COSMOS.emerald : rc > 0.5 ? COSMOS.rose : td > 0.4 ? COSMOS.gold : COSMOS.muted;
      nodes.push(txt(cap, 0, 345, 28, capCol, 'sans'));
    }

    return group(...nodes);
  });

  s.add(bgAura, title, live);

  c.on('fit-swap', () => s.play(swapped.to(1, { duration: 0.45 })));
  c.on('fit-updates', () => s.play(stepFrac.to(1, { duration: 1.4 })));
  c.on('fit-add-words', () => s.play(showTestD.to(1, { duration: 0.5 })));
  c.after('fit-confounded', () =>
    s.play(revealConf.to(1, { duration: afterDuration(c, 'fit-confounded', 0.45) })),
  );
  c.after('fit-balanced', () =>
    s.play(revealBal.to(1, { duration: afterDuration(c, 'fit-balanced', 0.45) })),
  );
  c.on('fit-controlled', () =>
    s.play(showCtrl.to(1, { duration: remainDuration(c, 'fit-controlled', 0.6) })),
  );
}
