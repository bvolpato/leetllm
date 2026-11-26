// Scene 5: shrinkage - "A magnitude penalty also shrinks real signals"
// Left: Glowing 2D activation plane with fixed blue arrow and shrinking pink arrow leaving emerald error.
// Right: Glowing 5-slot sparse code strip, MathJax scalar loss & optimum, sleek lambda_eff slider,
//        glowing tilted cost parabola with sliding gold minimum orb, and active support counter (2 -> 1).
import { assertEqual, dynamic, indicate, line } from 'vizmatic/stage';
import {
  COSMOS,
  EXAMPLE_SLOTS,
  ROLE,
  cinemaAtmosphere,
  cinemaPlane,
  cinemaRebuild,
  code,
  glowCodeStrip,
  glowDot,
  glowSlider,
  glowTex,
  glowingTrail,
  heroTitle,
  playCue,
  rule,
  txt,
} from '../parts.mjs';

const TARGET = code[1]; // 1
const optimum = (w) => Math.max(0, TARGET - w / 2);
const cost = (v, w) => (TARGET - v) ** 2 + w * v;
const WEIGHT = { nudge: 0.4, half: 1.2, low: 1.9, end: 2.4, max: 2.6 };

export default function shrinkage(s, c) {
  for (const w of Object.values(WEIGHT)) {
    const best = optimum(w);
    assertEqual(
      [0, best - 0.01, best + 0.01, 1, 2].every(
        (v) => v < 0 || cost(best, w) <= cost(v, w) + 1e-12,
      ),
      true,
      `shrinkage optimum at weight ${w}`,
    );
  }

  const atmo = cinemaAtmosphere(ROLE.second, ROLE.mark);
  const title = heroTitle(['A magnitude penalty also', 'shrinks real signals'], {
    x: -855,
    y: -435,
    size: 48,
    lineHeight: 56,
    accent: ROLE.second,
  });

  const b = cinemaPlane(s, {
    cx: -365,
    cy: 95,
    width: 960,
    height: 700,
    x: [-1.3, 2.9],
    y: [-1.4, 1.8],
  });

  const weight = s.value(0);
  const z = glowCodeStrip(s, {
    x: 515,
    y: -295,
    width: 640,
    height: 205,
    max: 2,
    colors: EXAMPLE_SLOTS,
    start: code,
    read: (i) => (i === 1 ? optimum(weight.value) : undefined),
  });
  const live = cinemaRebuild(b, () => [code[0], optimum(weight.value)]);

  const rx = 515;
  const scalarEq = glowTex('(t - z)^2 + \\lambda_{\\mathrm{eff}}|z|,\\quad z \\ge 0', {
    x: rx,
    y: -145,
    size: 32,
    color: COSMOS.muted,
    glow: 0,
  });
  const optRule = glowTex('z^{*} = \\max\\!\\left(0,\\ t - \\lambda_{\\mathrm{eff}}/2\\right)', {
    x: rx,
    y: -85,
    size: 38,
    color: ROLE.mark,
    glow: 7,
  });
  const convEq = glowTex('\\lambda_{\\mathrm{eff}} = D\\lambda / M', {
    x: rx,
    y: -25,
    size: 28,
    color: COSMOS.dim,
    glow: 0,
  });

  const knob = glowSlider({
    x: 390,
    y: 40,
    width: 320,
    value: weight,
    min: 0,
    max: WEIGHT.max,
    color: ROLE.mark,
    prefix: 'λ_eff = ',
    digits: 2,
    labelX: 575,
  });

  // Glowing tilted parabola cost plot (clean floating axes, no box chrome)
  const pLeft = 240;
  const pRight = 795;
  const pTop = 108;
  const pBottom = 348;
  const maxX = 1.15;
  const maxY = 2.8;
  const toPlot = (vx, vy) => [
    pLeft + (vx / maxX) * (pRight - pLeft),
    pBottom - (Math.min(maxY, vy) / maxY) * (pBottom - pTop),
  ];

  const plotAxes = [
    rule(pLeft, pBottom, pRight, pBottom, '#4c608d', 2.5),
    rule(pLeft, pBottom, pLeft, pTop, '#4c608d', 2.5),
    ...[0, 0.5, 1.0].flatMap((vx) => {
      const [sx] = toPlot(vx, 0);
      return [
        line([sx, pBottom], [sx, pBottom + 8], { stroke: '#4c608d', width: 2 }),
        txt(vx === 0 ? '0' : vx.toFixed(1), sx, pBottom + 32, 26, COSMOS.dim, 'mono', 'center'),
      ];
    }),
    ...[1, 2].flatMap((vy) => {
      const [, sy] = toPlot(0, vy);
      return [
        line([pLeft - 8, sy], [pLeft, sy], { stroke: '#4c608d', width: 2 }),
        txt(String(vy), pLeft - 22, sy, 26, COSMOS.dim, 'mono', 'right'),
      ];
    }),
    txt('cost', pLeft - 18, pTop - 16, 26, COSMOS.muted, 'sans', 'right'),
    txt('z₂', pRight + 22, pBottom, 26, ROLE.second, 'mono', 'left'),
  ];

  const costCurve = dynamic(() => {
    const pts = Array.from({ length: 46 }, (_, i) => {
      const vx = (i / 45) * maxX;
      return toPlot(vx, cost(vx, weight.value));
    });
    const best = optimum(weight.value);
    const minPt = toPlot(best, cost(best, weight.value));
    const footPt = toPlot(best, 0);
    return [
      glowingTrail(pts, { color: ROLE.second, width: 4.5, glow: 9 }),
      line(minPt, footPt, { stroke: ROLE.mark, width: 3, dash: [8, 7] }).opacity(0.85),
      glowDot(minPt[0], minPt[1], { radius: 9, color: ROLE.mark, glow: 14 }),
    ];
  });

  const activeCount = dynamic(() => {
    const active = code.filter((v, i) => (i === 1 ? optimum(weight.value) : v) > 1e-9).length;
    const col = active === 2 ? COSMOS.ink : ROLE.mark;
    return txt(`Active entries: ${active} of 5`, rx, 425, 36, col, 'mono', 'center').glow(
      active === 1 ? 8 : 0,
      col,
    );
  });

  s.add(
    atmo,
    title,
    b.node,
    live.error,
    live.blue,
    live.pink,
    live.point,
    live.rebuilt,
    z.rail,
    z.glyphs,
    z.bars,
    z.numbers,
    scalarEq,
    convEq,
    knob.rail,
    knob.activeTrack,
    knob.knob,
    knob.readout,
    ...plotAxes,
    costCurve,
  );

  const moveW = (to, dur) => (d) => s.play(weight.to(to, { duration: Math.min(dur, d) }));
  playCue(s, c, 'shrink-favors', moveW(WEIGHT.nudge, 1.3), { dur: 1.3 });
  c.show('shrinkage-b1-1', optRule);
  playCue(
    s,
    c,
    'shrink-clip',
    (d) =>
      s.play(
        ...optRule
          .part('\\max')
          .map((g) => indicate(g, { color: ROLE.mark, scale: 1.3, duration: d })),
      ),
    { dur: 0.7 },
  );
  playCue(s, c, 'shrinkage-b1-2', moveW(WEIGHT.half, 2.4), { dur: 2.4 });

  // Beat 1: Active count stays 2 until pink reaches 0, then drops to 1
  c.show('shrink-support', activeCount);
  playCue(s, c, 'shrinkage-b2-1', moveW(WEIGHT.low, 2.0), { dur: 2.0 });
  playCue(s, c, 'shrink-count', moveW(WEIGHT.end, 2.2), { dur: 2.2 });
}
