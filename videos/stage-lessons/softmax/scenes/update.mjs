// Scene 08 (update): "Make the correction earn more target probability"
// Orbiting 3D loss landscape + live interpolated logit update z -> z - 1.5*(p-y) + real-time loss drop.
import {
  COSMOS,
  LOGITS,
  MARK_COLOR,
  TARGET,
  TARGET_COLOR,
  UPDATED,
  WORD_COLOR,
  WORDS,
  aura,
  buildLossLandscape3d,
  fmtPct,
  glowDot,
  glowTex,
  guardedDynamic,
  heroTitle,
  lossTrace,
  lumBar,
  orbitScene,
  rule,
  stableSoftmax,
  tweenCue,
  txt,
  unitRibbon,
} from '../parts.mjs';

export default function update(s, c) {
  const progress = s.value(0);
  const showRule = s.value(0);
  const showLossRead = s.value(0);
  const showResult = s.value(0);

  const curLogits = () => LOGITS.map((z, i) => z + (UPDATED[i] - z) * progress.value);
  const curProbs = () => stableSoftmax(curLogits());

  const bgAura = aura(430, 25, 530, '#123e3a38', '#1f235418');
  const { view: surf3d } = buildLossLandscape3d(
    () => {
      const z = curLogits();
      return [z[1], z[0]];
    },
    { x: 430, y: 0, unit: 98 },
  );

  const title = heroTitle(['One Step Down', 'the Loss Surface'], {
    x: -855,
    y: -425,
    size: 56,
    lineHeight: 66,
    accent: TARGET_COLOR,
    eyebrow: 'DIRECT LOGIT UPDATE · η = 1.5',
  });

  const eqStep = glowTex('z_i \\leftarrow z_i - 1.5\\,(p_i - y_i)', {
    x: -480,
    y: -225,
    size: 38,
    color: COSMOS.cyan,
    glow: 6,
  });

  const live = guardedDynamic(s.value(1), () => {
    const z = curLogits();
    const p = curProbs();
    const tr = lossTrace(z, TARGET);
    const res = showResult.value;
    const lOn = showLossRead.value;

    // Fixed-column luminous probability bars (zero text collision while logits cross!)
    const baseY = 78;
    const maxH = 230;
    const colXs = [-715, -455, -195];
    const nodes = [rule(-835, baseY, -75, baseY, COSMOS.muted, 2.5).opacity(0.8)];
    WORDS.forEach((w, i) => {
      const h = Math.max(8, p[i] * maxH);
      nodes.push(
        lumBar(colXs[i], baseY - h / 2, 118, h, {
          color: WORD_COLOR[i],
          fillOpacity: 0.76,
          strokeWidth: i === TARGET ? 3.2 : 2.2,
          glow: i === TARGET ? 12 : 8,
        }),
        txt(fmtPct(p[i]), colXs[i], baseY - h - 30, 28, WORD_COLOR[i], 'mono'),
        txt(w, colXs[i], baseY + 38, 30, WORD_COLOR[i], 'sans'),
        txt(`z=${z[i].toFixed(2)}`, colXs[i], baseY + 80, 26, COSMOS.muted, 'mono'),
      );
    });

    // Live crossing score dots on a compact ruler below
    const rLeft = -815;
    const rRight = -95;
    const rY = 205;
    const xOf = (v) => rLeft + ((v + 0.5) / 4.0) * (rRight - rLeft);
    nodes.push(rule(rLeft, rY, rRight, rY, COSMOS.rule, 3));
    z.forEach((zv, i) => {
      nodes.push(glowDot(xOf(zv), rY, { radius: 8.5, color: WORD_COLOR[i], glow: 12 }));
    });

    // Live conserved ribbon under the score dots
    const ribLeft = -815;
    const ribW = 720;
    const ribY = 278;
    nodes.push(...unitRibbon(ribLeft, ribY, ribW, 46, p, WORD_COLOR));

    if (lOn > 0.02 || progress.value > 0.05) {
      const op = Math.max(lOn, Math.min(1, progress.value * 2));
      nodes.push(
        txt(
          `Cross-entropy loss:  ${tr.loss.toFixed(3)} nats`,
          -855,
          404,
          32,
          tr.loss < 1.0 ? TARGET_COLOR : MARK_COLOR,
          'mono',
          'left',
        )
          .glow(7, tr.loss < 1.0 ? TARGET_COLOR : MARK_COLOR)
          .opacity(op),
      );
    }

    if (res > 0.02) {
      nodes.push(
        txt(
          `slept: 11.4% → ${fmtPct(p[TARGET])}  (new leader!)`,
          430,
          -345,
          30,
          TARGET_COLOR,
          'mono',
        )
          .glow(8, TARGET_COLOR)
          .opacity(res),
      );
    }

    nodes.push(
      txt('3D DESCENT TRAJECTORY', 430, -405, 26, COSMOS.cyan, 'mono').glow(5, COSMOS.cyan),
      txt(
        'Beacon rolls along the geodesic from 2.17 to 0.49 nats',
        430,
        452,
        26,
        COSMOS.muted,
        'sans',
      ),
    );

    return nodes;
  });

  s.add(bgAura, surf3d, title, live);
  orbitScene(s, c, surf3d, { theta: 0.42, phi: 0.94 });

  c.show('update-step', eqStep);
  tweenCue(s, c, 'update-step', showRule, 1, { duration: 0.4 });
  tweenCue(s, c, 'logit-update-rule-b1-1', progress, 0.5, { duration: 0.85 });
  tweenCue(s, c, 'updated-probabilities-b2-1', progress, 0.8, { duration: 0.65 });
  c.on('updated-target-loss-b2-2', () => {
    s.play(showLossRead.to(1, { duration: 0.4 }));
    s.play(progress.to(1, { duration: 0.65 }));
  });
  tweenCue(s, c, 'update-result', showResult, 1, { duration: 0.5, after: true });
}
