// Scene 01: What reaches the multiplier? 3D E4M3 saturation cliff + stale-scale 500 -> 10 prediction.
import {
  COSMOS,
  STALE_RT,
  afterDuration,
  aura,
  bitStrip8,
  buildSaturationCliff3d,
  glassCell,
  glowDot,
  glowTex,
  group,
  guardedDynamic,
  heroTitle,
  hexByte,
  line,
  orbitScene,
  rect,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function intro(s, c) {
  const phase = s.value(0);
  const showPeak = s.value(0);
  const showClip = s.value(0);
  const askQuestion = s.value(0);
  const revealTen = s.value(0);
  const revealLoss = s.value(0);

  const bgAura = aura(350, 20, 560, '#5ce1e624', '#ff6b8b1a');
  const title = heroTitle(['What Reaches', 'the Multiplier?'], {
    x: -855,
    y: -415,
    size: 62,
    lineHeight: 72,
    accent: COSMOS.gold,
    eyebrow: 'LOW-PRECISION KERNELS · OCP E4M3',
  });

  const cliff3d = buildSaturationCliff3d(phase, {
    x: 375,
    y: -15,
    capProgressVal: showClip,
  });

  const scaleEq = glowTex(String.raw`S_{\text{prev}} = \frac{10}{448}`, {
    x: -690,
    y: -185,
    size: 38,
    color: COSMOS.cyan,
  });

  const live = guardedDynamic(1, () => {
    const p = phase.value;
    const pk = showPeak.value;
    const cl = showClip.value;
    const ask = askQuestion.value;
    const ten = revealTen.value;
    const loss = revealLoss.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.4);

    // Ruler from 0 to 500 on the lower-left canvas
    const rx0 = -855;
    const rx1 = -85;
    const ry = 22;
    const mapX = (v) => rx0 + (v / 500) * (rx1 - rx0);
    const x10 = mapX(10);
    const x500 = mapX(500);

    const nodes = [
      // 3D labels
      txt('3D E4M3 SATURATION CLIFF (MAX 448)', 375, -398, 26, COSMOS.gold, 'mono').glow(
        5,
        COSMOS.gold,
      ),
      txt(
        cl > 0.5
          ? '500 / S = 22,400 clips hard at ceiling 448'
          : 'Prior scale maps 10 to ceiling 448',
        375,
        355,
        26,
        cl > 0.5 ? COSMOS.amber : COSMOS.muted,
        'sans',
      ),
      // Activation ruler
      txt('INCOMING ACTIVATION (ORIGINAL UNITS)', rx0, ry - 72, 26, COSMOS.muted, 'mono', 'left'),
      line([rx0, ry], [rx1, ry], { stroke: '#3a4c74', width: 3 }),
      // Filled 500 strip
      rect(x500 - rx0, 18, { fill: COSMOS.blue, stroke: null, radius: 5 })
        .at((rx0 + x500) * 0.5, ry)
        .opacity(0.45),
      // Previous peak 10 division
      rect(Math.max(18, x10 - rx0), 26, {
        fill: COSMOS.cyan,
        stroke: '#ffffff',
        width: 1.2,
        radius: 4,
      })
        .at(rx0 + Math.max(9, (x10 - rx0) * 0.5), ry)
        .glow(8 * pulse, COSMOS.cyan)
        .opacity(0.35 + 0.65 * pk),
      glowDot(x500, ry, { radius: 8, color: COSMOS.blue }),
      txt('0', rx0, ry + 42, 26, COSMOS.muted, 'mono', 'left'),
      txt('10 (prev peak)', x10 + 18, ry + 42, 26, COSMOS.cyan, 'mono', 'left').opacity(
        0.3 + 0.7 * pk,
      ),
      txt('500 in', x500, ry - 32, 28, COSMOS.blue, 'mono', 'right'),
    ];

    // Stored E4M3 8-bit register (0x7e = 448)
    nodes.push(
      txt(
        cl > 0.5
          ? `STORED BYTE ${hexByte(STALE_RT.code)} · VALUE = ${STALE_RT.value}`
          : 'FP8 E4M3 BYTE (CEILING = 448)',
        rx0,
        125,
        26,
        cl > 0.5 ? COSMOS.gold : COSMOS.muted,
        'mono',
        'left',
      ),
      bitStrip8(STALE_RT.code, -470, 200, {
        cellW: 62,
        cellH: 56,
        gap: 8,
        mode: 'e4m3',
        highlightIndices: cl > 0.5 ? [1, 2, 3, 4, 5, 6] : [],
        opacity: 0.45 + 0.55 * cl,
      }),
    );

    // Multiplier readout (STRICT PREDICTION WITHHOLDING until revealTen > 0.5!)
    const prodCol =
      ten > 0.5 ? (loss > 0.5 ? COSMOS.rose : COSMOS.cyan) : ask > 0.5 ? COSMOS.gold : COSMOS.muted;
    nodes.push(
      glassCell(-470, 385, 760, 126, prodCol, {
        fill: '#101729',
        glow: ten > 0.5 || ask > 0.5 ? 10 : 4,
      }),
      txt('MULTIPLIER INPUT = CODE × S_prev', -470, 344, 26, COSMOS.muted, 'mono'),
      txt(
        ten > 0.5
          ? `448 × (10 / 448) = ${STALE_RT.reconstructed}`
          : ask > 0.5
            ? '448 × (10 / 448) = ?'
            : 'code × (10 / 448)',
        -470,
        406,
        38,
        prodCol,
        'mono',
      ).glow(ten > 0.5 || ask > 0.5 ? 7 : 0, prodCol),
    );

    // 98% loss callout on right bottom only after revealLoss
    if (loss > 0.02) {
      nodes.push(
        glassCell(375, 430, 680, 96, COSMOS.rose, { fill: '#1f1020', glow: 9, opacity: loss }),
        txt('98% MAGNITUDE LOST · NO NaN · NO INF', 375, 430, 28, COSMOS.rose, 'mono')
          .glow(6, COSMOS.rose)
          .opacity(loss),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, cliff3d, title, scaleEq, live);
  runPhase(s, c, phase, 14);
  orbitScene(s, c, cliff3d, { theta: -0.25, phi: 0.94 });

  c.on('intro-spike', () =>
    s.play(showPeak.to(1, { duration: remainDuration(c, 'intro-spike', 0.45) })),
  );
  c.on('intro-cap', () =>
    s.play(showClip.to(1, { duration: remainDuration(c, 'intro-cap', 0.5) })),
  );
  c.on('intro-question', () =>
    s.play(askQuestion.to(1, { duration: remainDuration(c, 'intro-question', 0.4) })),
  );
  c.after('intro-read', () =>
    s.play(revealTen.to(1, { duration: afterDuration(c, 'intro-read', 0.45) })),
  );
  c.on('intro-loss', () =>
    s.play(revealLoss.to(1, { duration: remainDuration(c, 'intro-loss', 0.45) })),
  );
}
