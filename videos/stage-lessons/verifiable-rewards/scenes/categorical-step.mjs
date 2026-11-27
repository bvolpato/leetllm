// Scene 21: A zero scalar loss can still move the eight logits (8-outcome uniform -> 50.625% rewarded mass)
import {
  COSMOS,
  GROUP_8_REWARDS,
  aura,
  glassCell,
  glowTex,
  group,
  guardedDynamic,
  heroTitle,
  line,
  rect,
  remainDuration,
  rlvrGroupUpdate,
  txt,
} from '../parts.mjs';

export default function categoricalStep(s, c) {
  const phase = s.value(0);
  const sGrad = s.value(0);
  const stepProg = s.value(0);
  const sMass = s.value(0);
  const sRef = s.value(0);

  const bgAura = aura(0, 20, 640, '#14385c26', '#2e1d5414');
  const title = heroTitle(['A Zero Scalar Loss Can Still', 'Move All Eight Logits'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: COSMOS.cyan,
    eyebrow: '8-OUTCOME LAB · INITIAL LOSS = 0 · NONZERO GRADIENT = -A / 8',
  });

  const live = guardedDynamic(s.value(1), () => {
    const sg = sGrad.value;
    const st = stepProg.value;
    const sm = sMass.value;
    const sr = sRef.value;
    const cur = rlvrGroupUpdate(GROUP_8_REWARDS, 0.1, st);

    const x0 = -770;
    const stride = 112;
    const baseY = 225;
    const scaleH = 1500; // 0.125 -> 187.5px

    const nodes = [
      txt('8 CATEGORICAL RESPONSES (lr = 0.1)', -830, -195, 26, COSMOS.cyan, 'mono', 'left'),
      line([-840, baseY], [90, baseY], { stroke: COSMOS.rule, width: 2.2 }),
    ];

    cur.probabilities.forEach((prob, i) => {
      const cx = x0 + i * stride;
      const pass = GROUP_8_REWARDS[i] === 1;
      const col = pass ? COSMOS.emerald : COSMOS.rose;
      const h = prob * scaleH;
      nodes.push(
        rect(74, h, { fill: pass ? '#12463b' : '#3a1421', stroke: col, width: 2.2, radius: 7 })
          .at(cx, baseY - h * 0.5)
          .glow(pass ? 7 : 3, col),
        txt(`#${i + 1}`, cx, baseY + 36, 26, COSMOS.muted, 'mono'),
        txt(
          st > 0.3 ? `${(prob * 100).toFixed(2)}%` : '12.5%',
          cx,
          baseY - h - 26,
          26,
          col,
          'mono',
        ),
      );
    });

    const rx = 505;
    nodes.push(
      glassCell(rx, -110, 620, 166, COSMOS.gold, { fill: '#231d0f', glow: sg > 0.3 ? 8 : 4 }),
      txt('INITIAL LOSS vs GRADIENT', rx, -152, 26, COSMOS.muted, 'mono'),
      txt('L_0 = -mean(1 * A) = 0.000', rx, -104, 28, COSMOS.gold, 'mono'),
      txt('dL / dz_i = -A_i / 8 = +-0.125', rx, -58, 28, COSMOS.cyan, 'mono').opacity(
        Math.max(0.7, sg),
      ),

      glassCell(rx, 74, 620, 152, COSMOS.emerald, { fill: '#0e2824', glow: sm > 0.3 ? 9 : 4 }),
      txt('REWARDED MASS AFTER 1 STEP', rx, 36, 26, COSMOS.emerald, 'mono'),
      txt(`${(cur.expectedReward * 100).toFixed(3)}%`, rx, 98, 52, COSMOS.emerald, 'mono').glow(
        8,
        COSMOS.emerald,
      ),

      txt(
        sr > 0.3
          ? 'At step 0, pi = pi_ref so KL & KL grad = 0 · green bars give next-sample pass chance'
          : 'delta z = +-0.0125 shifts passing mass 50.000% -> 50.625% (sum stays 1.0)',
        0,
        352,
        26,
        COSMOS.muted,
        'sans',
      ),
    );

    return group(...nodes);
  });

  const eqStep = glowTex('\\Delta z_i = +\\eta \\frac{A_i}{8} = \\pm 0.0125', {
    x: 505,
    y: 245,
    size: 36,
    color: COSMOS.gold,
    glow: 6,
  });

  s.add(bgAura, title, live, eqStep);

  c.on('vr-categorical-step-b0', () => s.play(phase.to(1.5, { duration: 0.4 })));
  c.on('vr-zero-loss-categorical-step', () => s.play(sGrad.to(0.5, { duration: 0.35 })));
  c.on('vr-gradient-categorical-step', () => s.play(sGrad.to(1, { duration: 0.45 })));
  c.on('vr-categorical-step-b1', () => s.play(stepProg.to(0.35, { duration: 0.35 })));
  c.on('vr-step-categorical-step', () => s.play(stepProg.to(1, { duration: 0.7 })));
  c.on('vr-mass-categorical-step', () => s.play(sMass.to(1, { duration: 0.45 })));
  c.on('vr-categorical-step-b2', () => s.play(sRef.to(0.6, { duration: 0.35 })));
  c.on('vr-reference-categorical-step', () =>
    s.play(sRef.to(1, { duration: remainDuration(c, 'vr-reference-categorical-step', 0.45) })),
  );
}
