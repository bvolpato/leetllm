// Scene 04: grid: Unsigned 4-bit ruler (step 0.1, z=0): 0.73 -> 0.76 -> predict code? -> AFTER ask-code reveal code 8 (0.8, +0.04) + encode/decode formulas.
import {
  COSMOS,
  ROLE,
  aura,
  chipPill,
  circle,
  glowDot,
  glowTex,
  group,
  guardedDynamic,
  heroTitle,
  line,
  playCue,
  txt,
} from '../parts.mjs';

export default function grid(s, c) {
  const slide076 = s.value(0);
  const revealEight = s.value(0); // strictly withheld until AFTER nearest-level!
  const showGap = s.value(0);
  const showFormula = s.value(0);

  const bgAura = aura(0, 0, 740, '#14335c28', '#20184422');
  const title = heroTitle(['Rounding on a Uniform Grid:', '0.73 vs 0.76'], {
    x: -855,
    y: -430,
    size: 50,
    lineHeight: 58,
    accent: ROLE.grid,
  });

  const eq = glowTex(
    String.raw`q = \operatorname{clip}\!\left(\operatorname{round}(w/s)+z,\; q_{\min}, q_{\max}\right), \quad \hat{w} = s\,(q - z)`,
    { scale: 1.55, color: COSMOS.ink, glow: 8, glowColor: ROLE.grid },
  ).at(0, 295);

  const eqWrap = guardedDynamic(showFormula, (a) => eq.opacity(0.45 + 0.55 * a));

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const sl = slide076.value;
    const r8 = revealEight.value;
    const gp = showGap.value;

    const rLeft = -740;
    const rRight = 740;
    const rY = -95;
    const toX = (v) => rLeft + ((v - 0.5) / 0.5) * (rRight - rLeft);
    const wVal = 0.73 + 0.03 * sl;
    const xW = toX(wVal);
    const xSnap = toX(0.8);

    const nodes = [
      txt(
        'UNSIGNED 4-BIT RULER (SCALE s = 0.1, ZERO-POINT z = 0)',
        -855,
        -220,
        26,
        ROLE.grid,
        'mono',
        'left',
      ).opacity(alpha),
      line([rLeft, rY], [rRight, rY], { stroke: COSMOS.rule, width: 4 }).opacity(alpha),
    ];

    for (let k = 5; k <= 10; k++) {
      const v = k / 10;
      const tx = toX(v);
      const hi = (k === 8 && r8 > 0.35) || (k === 7 && sl < 0.3);
      nodes.push(
        line([tx, rY - 22], [tx, rY + 22], {
          stroke: hi ? ROLE.ok : COSMOS.muted,
          width: hi ? 4.5 : 2.5,
        }).opacity(alpha),
        txt(v.toFixed(1), tx, rY + 48, 28, hi ? ROLE.ok : COSMOS.muted, 'mono', 'center').opacity(
          alpha,
        ),
        txt(`code ${k}`, tx, rY - 48, 26, hi ? ROLE.gold : COSMOS.dim, 'mono', 'center').opacity(
          alpha,
        ),
      );
    }

    if (gp > 0.3) {
      nodes.push(line([xW, rY], [xSnap, rY], { stroke: ROLE.err, width: 6 }).opacity(alpha * gp));
    }

    nodes.push(
      circle(11, { fill: '#182442', stroke: ROLE.weight, width: 3 }).at(xW, rY).opacity(alpha),
      glowDot(r8 > 0.35 ? xSnap : xW, rY, {
        radius: 13,
        color: r8 > 0.35 ? ROLE.ok : ROLE.gold,
        glow: 14,
        opacity: alpha,
      }),
      chipPill(
        r8 > 0.35
          ? 'w = 0.76 -> Store code 8 -> Read back 0.80 (+0.04 above original!)'
          : sl > 0.35
            ? 'w slid to 0.76 (+0.03 right) -> Which integer code will we store?'
            : 'w = 0.73 sits closer to 0.7 (code 7) than to 0.8 (code 8)',
        0,
        105,
        {
          w: 1460,
          h: 78,
          color: r8 > 0.35 ? ROLE.ok : ROLE.gold,
          fill: r8 > 0.35 ? '#0f2d24' : '#261e10',
          size: 28,
          glow: 10,
          opacity: alpha,
        },
      ),
      txt(
        'Packing preserves the integer code losslessly; information loss happens when choosing the mark',
        0,
        205,
        26,
        COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, layer, eqWrap);
  playCue(s, c, 'grid-scale', (d) => s.play(slide076.to(0, { duration: d })));
  playCue(s, c, 'new-weight', (d) => s.play(slide076.to(1, { duration: d })));
  playCue(s, c, 'ask-code', (d) => s.play(revealEight.to(0, { duration: d })));
  // Strict prediction withholding: reveal code 8 only after nearest-level!
  playCue(s, c, 'nearest-level', (d) => s.play(revealEight.to(1, { duration: d })), {
    after: true,
  });
  playCue(s, c, 'rounding-gap', (d) => s.play(showGap.to(1, { duration: d })));
  playCue(s, c, 'codec-steps', (d) => s.play(showFormula.to(1, { duration: d })));
}
