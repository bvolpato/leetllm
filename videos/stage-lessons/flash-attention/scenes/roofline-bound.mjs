// Scene 07: Derive a bandwidth roof before interpreting utilization: H100 log-log roofline model.
import {
  COSMOS,
  H100_SPEC,
  aura,
  dot,
  glassCell,
  glowDot,
  glowTex,
  glowingTrail,
  group,
  guardedDynamic,
  heroTitle,
  line,
  remainDuration,
  txt,
} from '../parts.mjs';

const RX0 = -340;
const RX1 = 810;
const RY0 = 285;
const RY1 = -265;
const LOG_AI_MIN = Math.log10(0.5);
const LOG_AI_MAX = Math.log10(2000);
const LOG_TF_MIN = Math.log10(1);
const LOG_TF_MAX = Math.log10(1600);

const mapAI = (ai) =>
  RX0 + ((Math.log10(ai) - LOG_AI_MIN) / (LOG_AI_MAX - LOG_AI_MIN)) * (RX1 - RX0);
const mapTF = (tf) =>
  RY0 - ((Math.log10(tf) - LOG_TF_MIN) / (LOG_TF_MAX - LOG_TF_MIN)) * (RY0 - RY1);
const roofPerf = (ai) => Math.min(H100_SPEC.denseTflops, ai * H100_SPEC.hbmTbs);

const ROOF_SAMPLES = 100;
const ROOF_PTS = Array.from({ length: ROOF_SAMPLES }, (_, i) => {
  const ai = Math.pow(10, LOG_AI_MIN + ((LOG_AI_MAX - LOG_AI_MIN) * i) / (ROOF_SAMPLES - 1));
  return [mapAI(ai), mapTF(roofPerf(ai))];
});

export default function rooflineBound(s, c) {
  const roofDraw = s.value(0.2);
  const showRidge = s.value(0);
  const climb = s.value(0);

  const bgAura = aura(180, -20, 560, '#5ce1e622', '#ff6b8b14');
  const title = heroTitle(['H100', 'Roofline'], {
    x: -855,
    y: -410,
    size: 60,
    lineHeight: 68,
    accent: COSMOS.gold,
    eyebrow: 'BANDWIDTH VS COMPUTE CEILING',
  });

  const eq = glowTex(String.raw`\min\!\big(P_{\text{peak}},\; \text{AI} \cdot \text{BW}\big)`, {
    x: -660,
    y: -170,
    size: 34,
    color: COSMOS.cyan,
  });

  const ridgeX = mapAI(H100_SPEC.ridgeAi);
  const peakY = mapTF(H100_SPEC.denseTflops);
  const ai1X = mapAI(1);
  const ai1Y = mapTF(H100_SPEC.hbmTbs);

  const live = guardedDynamic(1, () => {
    const rd = roofDraw.value;
    const sr = showRidge.value;
    const cl = climb.value;
    const count = Math.max(2, Math.floor(rd * ROOF_SAMPLES));

    const nodes = [
      // Axes
      line([RX0, RY0], [RX1, RY0], { stroke: '#465885', width: 2.4 }),
      line([RX0, RY0], [RX0, RY1], { stroke: '#465885', width: 2.4 }),
      txt(
        'Arithmetic Intensity (FLOP / byte)',
        (RX0 + RX1) * 0.5,
        RY0 + 84,
        28,
        COSMOS.muted,
        'sans',
      ),
      txt('TFLOP/s', RX0 - 16, RY1 - 42, 26, COSMOS.muted, 'mono', 'right'),
      // Left spec callouts
      txt(`Dense: ${H100_SPEC.denseTflops} TFLOP/s`, -855, -55, 26, COSMOS.gold, 'mono', 'left'),
      txt(`HBM3: ${H100_SPEC.hbmTbs} TB/s`, -855, -10, 26, COSMOS.cyan, 'mono', 'left'),
      txt('(half of 1,979 sparse)', -855, 34, 26, COSMOS.muted, 'sans', 'left'),
    ];

    // Log gridlines
    for (const v of [1, 10, 100, 1000]) {
      const x = mapAI(v);
      nodes.push(
        line([x, RY0], [x, RY1], { stroke: '#1d2846', width: 1.2 }),
        txt(String(v), x, RY0 + 36, 26, COSMOS.muted, 'mono'),
      );
    }
    for (const v of [10, 100, 989.5]) {
      const y = mapTF(v);
      nodes.push(
        line([RX0, y], [RX1, y], { stroke: '#1d2846', width: 1.2 }),
        txt(
          v === 989.5 ? '989.5' : String(v),
          RX0 - 20,
          y,
          26,
          v === 989.5 ? COSMOS.gold : COSMOS.muted,
          'mono',
          'right',
        ),
      );
    }

    // Glowing roofline curve
    nodes.push(
      glowingTrail(ROOF_PTS.slice(0, count), {
        gradientColors: [COSMOS.rose, COSMOS.amber, COSMOS.cyan, COSMOS.gold],
        width: 5.2,
        glow: 12,
      }),
      txt('COMPUTE CEILING (989.5)', ridgeX + 185, peakY - 34, 26, COSMOS.gold, 'mono').opacity(rd),
    );

    // Ridge + AI=1 operating point
    if (sr > 0.02) {
      nodes.push(
        line([ridgeX, RY0], [ridgeX, peakY], {
          stroke: COSMOS.gold,
          width: 2.2,
          dash: [8, 8],
        }).opacity(0.8 * sr),
        glowDot(ridgeX, peakY, { radius: 9, color: COSMOS.gold, opacity: sr }),
        txt(
          `Ridge ≈ ${H100_SPEC.ridgeAi.toFixed(1)}`,
          ridgeX + 18,
          RY0 - 30,
          26,
          COSMOS.gold,
          'mono',
          'left',
        )
          .glow(6, COSMOS.gold)
          .opacity(sr),
        // AI = 1 point
        glowDot(ai1X, ai1Y, { radius: 8, color: COSMOS.rose, opacity: sr }),
        glassCell(-665, 210, 380, 154, COSMOS.rose, { fill: '#1a1020', glow: 8, opacity: sr }),
        txt('AT 1 FLOP / BYTE', -665, 160, 26, COSMOS.muted, 'mono').opacity(sr),
        txt('3.35 TFLOP/s', -665, 212, 36, COSMOS.rose, 'mono').glow(6, COSMOS.rose).opacity(sr),
        txt('~0.34% of peak', -665, 258, 26, COSMOS.amber, 'mono').opacity(sr),
      );
    }

    // Tiling climbs up the bandwidth slope
    if (cl > 0.02) {
      const curAi = Math.pow(10, Math.log10(1) + (Math.log10(160) - Math.log10(1)) * cl);
      const cx = mapAI(curAi);
      const cy = mapTF(roofPerf(curAi));
      const trail = Array.from({ length: 32 }, (_, i) => {
        const u = (i / 31) * cl;
        const ai = Math.pow(10, Math.log10(1) + (Math.log10(160) - Math.log10(1)) * u);
        return [mapAI(ai), mapTF(roofPerf(ai))];
      });
      nodes.push(
        glowingTrail(trail, {
          gradientColors: [COSMOS.rose, COSMOS.emerald],
          width: 6.0,
          glow: 14,
        }),
        glowDot(cx, cy, { radius: 10, color: COSMOS.emerald, opacity: cl }),
        dot(4.5, '#ffffff').at(cx, cy).opacity(cl),
        txt('Tiling climbs slope ↗', RX0 + 34, RY1 + 46, 28, COSMOS.emerald, 'mono', 'left')
          .glow(6, COSMOS.emerald)
          .opacity(cl),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, title, eq, live);

  c.on('roofline-bound-beat-1', () => s.play(roofDraw.to(1, { duration: 1.4 })));
  c.on('roofline-bound-beat-2', () => s.play(showRidge.to(0.6, { duration: 0.4 })));
  c.on('fa-ridge', () => s.play(showRidge.to(1, { duration: 0.45 })));
  c.on('roofline-bound-beat-3', () =>
    s.play(climb.to(1, { duration: remainDuration(c, 'roofline-bound-beat-3', 1.8) })),
  );
}
