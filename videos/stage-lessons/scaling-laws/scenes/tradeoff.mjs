// Scene 7: tradeoff: "Two shapes on one budget"
// Left: Glowing N x D = 100 iso-compute hyperbola with active rectangle sweeping from 5x20 to 10x10.
// Right: Stacked parameter (blue) + data (cyan) penalty bars on one scale.
// STRICT PREDICTION WITHHOLDING: Totals and winning shape stay completely hidden throughout!
import {
  COSMOS,
  glowDot,
  glowTex,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  txt,
} from '../../cinematic-kit.mjs';
import {
  ROLE,
  cinemaAtmosphere,
  fmt,
  isoRect,
  lumBar,
  playCue,
  plotPlane,
  sampleCurve,
  scenePulse,
} from '../parts.mjs';

const PLANS = [
  { name: 'Tall', n: 5, d: 20 },
  { name: 'Square', n: 10, d: 10 },
];

export default function tradeoff(s, c) {
  const title = heroTitle(['Two shapes on', 'one budget'], {
    x: -850,
    y: -435,
    size: 50,
    lineHeight: 58,
    accent: ROLE.tokens,
  });

  const tallGlow = s.value(0); // tradeoff-tall
  const widenT = s.value(0); // tradeoff-widen: N slides 5 -> 10
  const showSquareBar = s.value(0); // tradeoff-square-terms
  const pulse = s.value(0);

  const stageLayer = guardedDynamic(s.value(1), (alpha) => {
    const nodes = [];
    const nVal = 5 + 5 * widenT.value;
    const dVal = 100 / nVal;
    const sq = showSquareBar.value;

    // Left: Fixed-budget curve & active rectangle
    const plane = plotPlane({
      left: -775,
      right: -175,
      top: -215,
      bottom: 260,
      xDomain: [0, 22],
      yDomain: [0, 22],
      xTicks: [5, 10, 20],
      yTicks: [5, 10, 20],
      xLabel: 'Parameter units N',
      yLabel: 'Token units D',
      opacity: alpha,
    });
    nodes.push(plane.node);

    nodes.push(
      isoRect(plane, nVal, dVal, {
        color: ROLE.params,
        fillOpacity: 0.24,
        strokeWidth: 2.8,
        glow: 9 + 4 * tallGlow.value,
        opacity: alpha,
      }),
    );

    const pts = sampleCurve(plane, (x) => 100 / x, 100 / 21.8, 21.8, 72);
    nodes.push(glowingTrail(pts, { color: ROLE.tokens, width: 4.2, glow: 10, opacity: alpha }));

    for (const pl of PLANS) {
      const [px, py] = plane.toScreen(pl.n, pl.d);
      nodes.push(
        glowDot(px, py, { radius: 7, color: COSMOS.muted, glow: 4, opacity: 0.8 * alpha }),
      );
    }

    const [ax, ay] = plane.toScreen(nVal, dVal);
    nodes.push(
      glowDot(ax, ay, { radius: 11, color: ROLE.compute, glow: 16, opacity: alpha }),
      txt('N × D = 100', -175, -253, 30, ROLE.tokens, 'mono', 'right')
        .glow(6, ROLE.tokens)
        .opacity(alpha),
    );

    // Right: Stacked penalty bars (NO totals, NO winner highlight!)
    const barLeft = 65;
    const scale = 385; // 1.34 * 385 ≈ 516 px (stays comfortably inside x=860)

    nodes.push(
      txt('Floor = 1  (shared by both)', barLeft, -210, 28, COSMOS.muted, 'sans', 'left').opacity(
        alpha,
      ),
      txt('2 / √N', barLeft, -150, 32, ROLE.params, 'mono', 'left')
        .glow(5, ROLE.params)
        .opacity(alpha),
      txt('2 / √D', barLeft + 265, -150, 32, ROLE.tokens, 'mono', 'left')
        .glow(5, ROLE.tokens)
        .opacity(alpha),
    );

    PLANS.forEach((plan, i) => {
      const rowY = -10 + i * 215;
      nodes.push(
        txt(
          `${plan.name}   ${plan.n} × ${plan.d}`,
          barLeft,
          rowY - 68,
          34,
          COSMOS.ink,
          'mono',
          'left',
        ).opacity(alpha),
      );
      if (i === 1 && sq < 0.04) {
        nodes.push(txt('?', barLeft + 40, rowY, 56, COSMOS.dim, 'mono', 'left').opacity(alpha));
        return;
      }
      const rowAlpha = i === 1 ? sq * alpha : alpha;
      const pN = 2 / Math.sqrt(plan.n);
      const pD = 2 / Math.sqrt(plan.d);
      const wN = pN * scale;
      const wD = pD * scale;

      nodes.push(
        lumBar(barLeft + wN / 2, rowY, wN - 4, 74, {
          color: ROLE.params,
          fillOpacity: 0.44,
          strokeWidth: 2.6,
          glow: 9,
          opacity: rowAlpha,
        }),
        txt(fmt(pN, 3), barLeft + wN / 2, rowY, 28, COSMOS.ink, 'mono', 'center').opacity(rowAlpha),
        lumBar(barLeft + wN + wD / 2, rowY, wD - 4, 74, {
          color: ROLE.tokens,
          fillOpacity: 0.44,
          strokeWidth: 2.6,
          glow: 9,
          opacity: rowAlpha,
        }),
        txt(fmt(pD, 3), barLeft + wN + wD / 2, rowY, 28, COSMOS.ink, 'mono', 'center').opacity(
          rowAlpha,
        ),
        txt('?', barLeft + wN + wD + 38, rowY, 42, COSMOS.muted, 'mono', 'left').opacity(rowAlpha),
      );
    });

    const promptText =
      sq > 0.5
        ? 'Which shape has the lower fitted loss?'
        : 'Both proposals spend the same 100 units';
    nodes.push(
      txt(promptText, 0, 395, 36, ROLE.compute, 'serif', 'center')
        .glow(8, ROLE.compute)
        .opacity(alpha),
    );

    return nodes;
  });

  const eq = glowTex('L = 1 + \\frac{2}{\\sqrt{N}} + \\frac{2}{\\sqrt{D}}', {
    x: 470,
    y: -365,
    size: 38,
    color: ROLE.compute,
  });

  s.add(cinemaAtmosphere(ROLE.params, ROLE.tokens), title, stageLayer, eq);
  scenePulse(s, c, pulse);

  playCue(s, c, 'tradeoff-tall', (d) => s.play(tallGlow.to(1, { duration: d })), { dur: 0.65 });
  playCue(s, c, 'tradeoff-widen', (d) => s.play(widenT.to(1, { duration: d })), { dur: 1.4 });
  playCue(s, c, 'tradeoff-square-terms', (d) => s.play(showSquareBar.to(1, { duration: d })), {
    dur: 0.7,
  });
}
