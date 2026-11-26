// Scene 12: One draw from two versions of a policy.
// Magnified softmax probability stage [0.4994, 0.5001] sliced by uniform draw u = 0.49975,
// showing FP32 logits [1, 1.002] -> Action 1 vs BF16 rounded [1, 1] -> Action 0 + diverging rollout trails.
import {
  COSMOS,
  POLICY_FIX,
  aura,
  glowDot,
  glowingTrail,
  group,
  guardedDynamic,
  heroTitle,
  line,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function policyMismatch(s, c) {
  const phase = s.value(0);
  const showDraw = s.value(0);
  const showLogits = s.value(0);
  const showWideProb = s.value(0);
  const showWideAct = s.value(0);
  const showRoundLogits = s.value(0);
  const showRoundProb = s.value(0);
  const showRoundAct = s.value(0);
  const showDiverge = s.value(0);

  const bgAura = aura(0, 0, 680, '#ffd1661c', '#ff6b8b16');

  const title = heroTitle(['One Draw,', 'Two Policies'], {
    x: -855,
    y: -445,
    size: 52,
    lineHeight: 60,
    accent: COSMOS.gold,
    eyebrow: 'RL TRAIN-INFERENCE LOGIT MISMATCH',
  });

  // Probability axis [0.4994, 0.5001] across [-520, 660]
  const pLeft = -520;
  const pRight = 660;
  const xProb = (p) => pLeft + ((p - 0.4994) / 0.0007) * (pRight - pLeft);
  const xU = xProb(POLICY_FIX.uniform); // 0.49975 -> exact midpoint!
  const xWideP = xProb(POLICY_FIX.wideProbability);
  const xRoundP = xProb(POLICY_FIX.roundedProbability);

  const yFp32 = -55;
  const yBf16 = 165;

  const live = guardedDynamic(1, () => {
    const sd = showDraw.value;
    const sl = showLogits.value;
    const wp = showWideProb.value;
    const wa = showWideAct.value;
    const rl = showRoundLogits.value;
    const rp = showRoundProb.value;
    const ra = showRoundAct.value;
    const dv = showDiverge.value;
    const ph = phase.value;
    const pulse = 0.72 + 0.28 * Math.sin(ph * 3.8);

    const nodes = [
      // Top-right logit conversion readout
      txt(
        `FP32 logits: [ ${POLICY_FIX.logits[0]},  ${POLICY_FIX.logits[1]} ]`,
        -100,
        -355,
        30,
        COSMOS.cyan,
        'mono',
        'left',
      )
        .glow(sl > 0.2 ? 6 : 0, COSMOS.cyan)
        .opacity(0.45 + 0.55 * sl),
      txt('→', 370, -355, 34, rl > 0.2 ? COSMOS.rose : COSMOS.dim, 'mono'),
      txt(
        rl > 0.3
          ? `BF16 logits: [ ${POLICY_FIX.rounded[0]},  ${POLICY_FIX.rounded[1]} ]`
          : 'BF16 logits: [ ?, ? ]',
        415,
        -355,
        30,
        rl > 0.3 ? COSMOS.rose : COSMOS.dim,
        'mono',
        'left',
      ).glow(rl > 0.3 ? 6 : 0, COSMOS.rose),

      // Blazing golden uniform-draw laser slicing BOTH rails
      line([xU, -225], [xU, 265], { stroke: COSMOS.gold, width: 4.5, dash: [10, 6] })
        .glow(10 * pulse, COSMOS.gold)
        .opacity(0.5 + 0.5 * sd),
      txt(`uniform draw u = ${POLICY_FIX.uniform}`, xU, -258, 28, COSMOS.gold, 'mono').glow(
        6,
        COSMOS.gold,
      ),

      // Axis scale subtitle
      txt('MAGNIFIED P(ACTION 0)', -845, -185, 26, COSMOS.muted, 'mono', 'left'),
      txt('u < P(a₀) → Action 0', -845, -142, 26, COSMOS.rose, 'sans', 'left'),
      txt('u ≥ P(a₀) → Action 1', -845, -102, 26, COSMOS.cyan, 'sans', 'left'),
    ];

    // Draw both probability rails
    const rails = [
      {
        label: 'FP32',
        y: yFp32,
        prob: POLICY_FIX.wideProbability,
        px: xWideP,
        action: POLICY_FIX.wideAction,
        pVal: wp,
        aVal: wa,
        col: COSMOS.cyan,
      },
      {
        label: 'BF16',
        y: yBf16,
        prob: POLICY_FIX.roundedProbability,
        px: xRoundP,
        action: POLICY_FIX.roundedAction,
        pVal: rp,
        aVal: ra,
        col: COSMOS.rose,
      },
    ];

    for (const r of rails) {
      nodes.push(
        txt(r.label, pLeft - 52, r.y, 38, r.col, 'mono', 'right').glow(6, r.col),
        line([pLeft, r.y], [pRight, r.y], { stroke: '#2c3d61', width: 4 }),
      );
      for (const tick of [0.4994, 0.4996, 0.4998, 0.5]) {
        const tx = xProb(tick);
        nodes.push(
          line([tx, r.y - 10], [tx, r.y + 10], { stroke: COSMOS.dim, width: 2.5 }),
          txt(tick.toFixed(4), tx, r.y + 52, 26, COSMOS.muted, 'mono'),
        );
      }
      if (r.pVal > 0.02) {
        const curX = pLeft + (r.px - pLeft) * r.pVal;
        nodes.push(
          glowingTrail(
            [
              [pLeft, r.y],
              [curX, r.y],
            ],
            { color: r.col, width: 8, glow: 10 },
          ),
          line([curX, r.y - 28], [curX, r.y + 18], { stroke: r.col, width: 5.5 }).glow(8, r.col),
          txt(`P(a₀) = ${r.prob.toFixed(5)}`, pLeft, r.y - 60, 28, r.col, 'mono', 'left')
            .glow(5, r.col)
            .opacity(r.pVal),
        );
      }
      if (r.aVal > 0.05) {
        nodes.push(
          glowDot(xU, r.y, { radius: 10, color: COSMOS.gold, glow: 13, opacity: r.aVal }),
          txt(`Action ${r.action}`, pRight + 45, r.y, 38, r.col, 'mono', 'left')
            .glow(8, r.col)
            .opacity(r.aVal),
        );
      } else {
        nodes.push(txt('Action ?', pRight + 45, r.y, 34, COSMOS.dim, 'mono', 'left'));
      }
    }

    // Diverging twin rollout trails on Beat 2 (policy-mismatch-b3)
    if (dv > 0.02) {
      const nPts = 22;
      const topTrail = [];
      const botTrail = [];
      for (let i = 0; i <= nPts; i++) {
        const t = (i / nPts) * dv;
        const x = -640 + t * 1280;
        topTrail.push([x, 345 - t * 44 - Math.sin(t * 9) * 10]);
        botTrail.push([x, 345 + t * 44 + Math.sin(t * 7) * 10]);
      }
      if (topTrail.length >= 2) {
        nodes.push(
          glowingTrail(topTrail, { color: COSMOS.cyan, width: 4, glow: 9, opacity: dv }),
          glowingTrail(botTrail, { color: COSMOS.rose, width: 4, glow: 9, opacity: dv }),
          txt(
            'One flipped token diverges the entire rollout trajectory',
            0,
            442,
            28,
            COSMOS.gold,
            'sans',
          )
            .glow(5, COSMOS.gold)
            .opacity(dv),
        );
      }
    } else {
      nodes.push(
        txt(
          'Rounding [1, 1.002] to BF16 shifts the boundary across the fixed draw',
          0,
          410,
          28,
          ra > 0.5 ? COSMOS.rose : COSMOS.muted,
          'sans',
        ),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('policy-mismatch-b1', () => s.play(showDraw.to(1, { duration: 0.6 })));
  c.on('policy-mismatch-b2', () => s.play(showLogits.to(1, { duration: 0.5 })));
  c.on('policy-wide-probability', () => s.play(showWideProb.to(1, { duration: 0.7 })));
  c.after('policy-wide-action', () =>
    s.play(
      showWideAct.to(1, { duration: remainDuration(c, 'policy-wide-action', 0.4, 0.35, true) }),
    ),
  );
  c.on('policy-rounded-logits', () => s.play(showRoundLogits.to(1, { duration: 0.55 })));
  c.on('policy-rounded-probability', () => s.play(showRoundProb.to(1, { duration: 0.7 })));
  c.after('policy-rounded-action', () =>
    s.play(
      showRoundAct.to(1, { duration: remainDuration(c, 'policy-rounded-action', 0.4, 0.35, true) }),
    ),
  );
  c.on('policy-mismatch-b3', () =>
    s.play(showDiverge.to(1, { duration: remainDuration(c, 'policy-mismatch-b3', 1.2) })),
  );
}
