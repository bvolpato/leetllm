// Scene 34: What will the next update reinforce? (Finale: repaired 3-group step 38%/31%/31% vs weak parser 35.8%!)
import {
  COSMOS,
  REPAIR_STRICT,
  REPAIR_WEAK,
  STEP_STRICT,
  STEP_WEAK,
  aura,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  line,
  rect,
  remainDuration,
  rlvrGroupUpdate,
  runPhase,
  txt,
} from '../parts.mjs';

export default function freshStepPayoff(s, c) {
  const phase = s.value(0);
  const sAsk = s.value(0);
  const sGrad = s.value(0);
  const sLogits = s.value(0);
  const stepProg = s.value(0);
  const sReplay = s.value(0);
  const sCompare = s.value(0);
  const sTransfer = s.value(0);

  const bgAura = aura(0, 20, 640, '#123e3628', '#2e1d5414');
  const title = heroTitle(['What Will the Next', 'Update Reinforce?'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.emerald,
    eyebrow: 'REPAIRED GROUP POLICY STEP · lr = 0.3 · PARSER REPAIR PAYOFF',
  });

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);
    const ak = sAsk.value;
    const gr = sGrad.value;
    const st = stepProg.value;
    const rp = sReplay.value;
    const cm = sCompare.value;
    const tf = sTransfer.value;

    const cur = rlvrGroupUpdate(REPAIR_STRICT.rewards, 0.3, st);
    const labels = ['R1: 1-box 252', 'R2: 2-box (bug)', 'R3: timeout'];
    const cols = [COSMOS.emerald, COSMOS.rose, COSMOS.amber];

    const x0 = -720;
    const stride = 270;
    const baseY = 215;
    const scaleH = 720; // 0.38 -> 274px

    const nodes = [
      txt('REPAIRED 3-CHOICE POLICY PROBABILITIES', -830, -196, 26, COSMOS.emerald, 'mono', 'left'),
      txt('Gold dashed line: uniform 1/3 = 33.3%', -830, -150, 26, COSMOS.gold, 'mono', 'left'),
      line([-840, baseY], [20, baseY], { stroke: COSMOS.rule, width: 2.2 }),
      // 1/3 baseline line
      line([-840, baseY - (1 / 3) * scaleH], [20, baseY - (1 / 3) * scaleH], {
        stroke: COSMOS.gold,
        width: 2.6,
        dash: [10, 8],
      }).opacity(0.75),
    ];

    cur.probabilities.forEach((prob, i) => {
      const cx = x0 + i * stride;
      const col = cols[i];
      const h = prob * scaleH;
      nodes.push(
        rect(168, h, {
          fill: i === 0 ? '#12463b' : i === 1 ? '#3a1421' : '#3a2610',
          stroke: col,
          width: 2.6,
          radius: 8,
        })
          .at(cx, baseY - h * 0.5)
          .glow(i === 1 && ak > 0.3 ? 10 * pulse : 5, col),
        txt(labels[i], cx, baseY + 38, 26, col, 'mono'),
        txt(
          st > 0.5 ? `${(STEP_STRICT.probabilities[i] * 100).toFixed(1)}%` : '33.3%',
          cx,
          baseY - h * 0.5 + 2,
          32,
          COSMOS.ink,
          'mono',
        ),
      );
    });

    // Right column: Step arithmetic + Counterfactual replay (old weak parser -> 35.8%!)
    const rx = 470;
    nodes.push(
      glassCell(rx, -105, 680, 165, COSMOS.emerald, {
        fill: '#0e2824',
        glow: st > 0.5 ? 9 : sLogits.value > 0.3 ? 6 : 4,
      }),
      txt('REPAIRED STEP (SINGLE-BOX)', rx, -150, 26, COSMOS.emerald, 'mono'),
      txt(
        st > 0.5
          ? `R1 -> ${(STEP_STRICT.probabilities[0] * 100).toFixed(1)}%   ·   R2, R3 -> ${(STEP_STRICT.probabilities[1] * 100).toFixed(1)}%`
          : gr > 0.3
            ? 'grad_i = -A_i / 3   ·   lr = 0.3'
            : 'Which way should R2 move on this step?',
        rx,
        -90,
        28,
        st > 0.5 ? COSMOS.emerald : COSMOS.gold,
        'mono',
      ),
      txt('Unrounded shares still sum to 1.000', rx, -42, 26, COSMOS.muted, 'sans'),

      glassCell(rx, 100, 680, 175, cm > 0.3 ? COSMOS.rose : COSMOS.muted, {
        fill: cm > 0.3 ? '#291018' : '#12182b',
        glow: cm > 0.3 ? 10 * pulse : 3,
        opacity: Math.max(0.72, rp),
      }),
      txt(
        'COUNTERFACTUAL: OLD FIRST-BOX PARSER',
        rx,
        52,
        26,
        cm > 0.3 ? COSMOS.rose : COSMOS.muted,
        'mono',
      ).opacity(Math.max(0.72, rp)),
      txt(
        cm > 0.3
          ? `Old checker pushes R2 UP to ${(STEP_WEAK.probabilities[1] * 100).toFixed(1)}%!`
          : 'Same 3 responses, revert parser only',
        rx,
        112,
        28,
        cm > 0.3 ? COSMOS.rose : COSMOS.muted,
        'mono',
      )
        .glow(cm > 0.3 ? 7 : 0, COSMOS.rose)
        .opacity(Math.max(0.72, rp)),
      txt(
        cm > 0.3
          ? `Repaired checker pushes R2 DOWN to ${(STEP_STRICT.probabilities[1] * 100).toFixed(1)}%`
          : 'Parser contract directs the gradient',
        rx,
        158,
        26,
        cm > 0.3 ? COSMOS.emerald : COSMOS.muted,
        'sans',
      ).opacity(Math.max(0.72, rp)),

      glowDot(-820, 345, { radius: 6, color: COSMOS.emerald }),
      txt(
        tf > 0.3
          ? 'Train on rescored group · keep host crashes out · verify transfer on fresh worker counts!'
          : 'RLVR reinforces exactly what the verifier scores: verify the checker first',
        -790,
        347,
        28,
        tf > 0.3 ? COSMOS.emerald : COSMOS.muted,
        'sans',
        'left',
      ),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('step-start', () => s.play(phase.to(1.5, { duration: 0.4 })));
  c.on('step-ask', () => s.play(sAsk.to(1, { duration: 0.45 })));
  c.on('step-grad', () => s.play(sGrad.to(1, { duration: 0.45 })));
  c.on('step-logits', () => s.play(sLogits.to(0.5, { duration: 0.4 })));
  c.on('step-normalize', () => s.play(sLogits.to(1, { duration: 0.4 })));
  c.after('step-move', () => s.play(stepProg.to(1, { duration: 0.35 })));
  c.on('step-replay', () => s.play(sReplay.to(1, { duration: 0.45 })));
  c.on('step-compare', () => s.play(sCompare.to(0.6, { duration: 0.35 })));
  c.after('step-old-value', () => s.play(sCompare.to(1, { duration: 0.45 })));
  c.on('step-transfer', () =>
    s.play(sTransfer.to(1, { duration: remainDuration(c, 'step-transfer', 0.45) })),
  );
}
