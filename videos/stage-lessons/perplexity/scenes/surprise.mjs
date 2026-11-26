// Scene 3: surprise: "What does one small share cost?"
// Glowing -ln(p) surprise curve with live probe sliding from p = 0.80 down to 0.02,
// halving beacons (+ln 2 per halving), MathJax nats-to-bits conversion, and a
// one-hot probability ribbon showing only the narrow 2% observed "mat" slice enters loss.
import { arrow, line } from 'vizmatic/stage';
import {
  COSMOS,
  glowDot,
  glowTex,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  txt,
} from '../../cinematic-kit.mjs';
import { ROLE, cinemaAtmosphere, fmt, lumBar, negLogCurvePts, pct, playCue } from '../parts.mjs';

export default function surprise(s, c) {
  const title = heroTitle(['What does one', 'small share cost?'], {
    x: -850,
    y: -435,
    size: 50,
    lineHeight: 58,
    accent: ROLE.observed,
  });

  const probeP = s.value(0.8); // 0.80 -> 0.10 -> 0.02
  const showRule = s.value(0);
  const showHalvings = s.value(0);
  const showBits = s.value(0);
  const showOneHot = s.value(0);

  const stageVis = s.value(1);

  const curveLayer = guardedDynamic(stageVis, (alpha) => {
    const nodes = [];
    const p = Math.max(0.015, Math.min(1, probeP.value));
    const loss = -Math.log(p);
    const bits = loss / Math.LN2;
    const sr = showRule.value;
    const sh = showHalvings.value;
    const sb = showBits.value;
    const so = showOneHot.value;

    // Left/center: Glowing -ln(p) coordinate plane
    const x0 = -760;
    const y0 = 205;
    const plotW = 950;
    const plotH = 445;
    const pMin = 0.015;
    const pMax = 1.0;
    const yMax = 4.5;

    const toScreen = (pv, lv) => [
      x0 + ((pv - pMin) / (pMax - pMin)) * plotW,
      y0 - (Math.min(yMax, lv) / yMax) * plotH,
    ];

    // Axes and soft grid hairlines
    nodes.push(
      arrow([x0, y0], [x0 + plotW + 24, y0], { stroke: '#5c72a6', width: 2.6, tip: 12 }).opacity(
        alpha,
      ),
      arrow([x0, y0], [x0, y0 - plotH - 22], { stroke: '#5c72a6', width: 2.6, tip: 12 }).opacity(
        alpha,
      ),
      txt('p("mat")', x0 + plotW + 34, y0, 26, COSMOS.muted, 'mono', 'left').opacity(alpha),
      txt('surprise (nats)', x0, y0 - plotH - 46, 26, COSMOS.muted, 'mono', 'center').opacity(
        alpha,
      ),
    );

    [0.1, 0.5, 0.8, 1.0].forEach((tick) => {
      const [tx] = toScreen(tick, 0);
      nodes.push(
        line([tx, y0 - 8], [tx, y0 + 10], { stroke: '#6c82b8', width: 2 }).opacity(0.8 * alpha),
        txt(fmt(tick, 1), tx, y0 + 38, 26, COSMOS.muted, 'mono', 'center').opacity(alpha),
      );
    });
    [0, 1, 2, 3, 4].forEach((yt) => {
      const [, ty] = toScreen(pMin, yt);
      if (yt > 0) {
        nodes.push(
          line([x0, ty], [x0 + plotW, ty], { stroke: '#253358', width: 1.4 }).opacity(0.55 * alpha),
        );
      }
      nodes.push(txt(String(yt), x0 - 24, ty, 26, COSMOS.muted, 'mono', 'right').opacity(alpha));
    });

    // Main glowing -ln(p) curve
    const pts = negLogCurvePts({ x0, y0, w: plotW, h: plotH, pMin, pMax, yMax, steps: 120 });
    nodes.push(
      glowingTrail(pts, {
        gradientColors: [ROLE.warn, ROLE.observed, ROLE.prob],
        width: 5,
        glow: 12,
        opacity: alpha,
      }),
    );

    // Equal halving beacons (0.8 -> 0.4 -> 0.2 -> 0.1: each halving adds +ln 2 = 0.693 nats)
    if (sh > 0.08) {
      [0.8, 0.4, 0.2, 0.1].forEach((hp) => {
        const [hx, hy] = toScreen(hp, -Math.log(hp));
        nodes.push(glowDot(hx, hy, { radius: 6, color: ROLE.prob, glow: 9, opacity: sh * alpha }));
      });
      nodes.push(
        txt(
          'Halving p always adds +ln(2) ≈ +0.693 nats',
          x0 + plotW * 0.52,
          y0 - plotH + 22,
          26,
          ROLE.prob,
          'mono',
          'center',
        ).opacity(sh * alpha),
      );
    }

    // Active probe drop-lines and glowing photon
    const [px, py] = toScreen(p, loss);
    const probeCol = p < 0.08 ? ROLE.warn : p < 0.35 ? ROLE.observed : ROLE.good;
    nodes.push(
      line([px, y0], [px, py], { stroke: probeCol, width: 2.2, dash: [7, 6] }).opacity(
        0.85 * alpha,
      ),
      line([x0, py], [px, py], { stroke: probeCol, width: 2.2, dash: [7, 6] }).opacity(
        0.85 * alpha,
      ),
      glowDot(px, py, { radius: 11, color: probeCol, glow: 16, opacity: alpha }),
    );

    // Right column: Floating live telemetry gauge for observed target "mat"
    const rx = 565;
    nodes.push(
      txt('Observed target: "mat"', rx, -295, 32, ROLE.good, 'serif', 'center')
        .glow(6, ROLE.good)
        .opacity(alpha),
      txt(`p = ${fmt(p, 2)}  (${pct(p)})`, rx, -225, 42, probeCol, 'mono', 'center')
        .glow(8, probeCol)
        .opacity(alpha),
    );

    // Vertical luminous surprise thermometer bar
    const barW = 48;
    const barMaxH = 215;
    const barFillH = Math.max(8, (Math.min(yMax, loss) / yMax) * barMaxH);
    const barBottomY = 75;
    nodes.push(
      lumBar(rx - 150, barBottomY - barMaxH / 2, barW, barMaxH, {
        color: '#344775',
        fillOpacity: 0.14,
        strokeWidth: 2,
        glow: 3,
        opacity: alpha,
      }),
      lumBar(rx - 150, barBottomY - barFillH / 2, barW - 6, barFillH, {
        color: probeCol,
        fillOpacity: 0.58,
        strokeWidth: 2.6,
        glow: 12,
        opacity: alpha,
      }),
      txt(
        sr > 0.3 ? '-ln(p)' : 'surprise',
        rx + 50,
        -100,
        28,
        COSMOS.muted,
        'mono',
        'center',
      ).opacity(alpha),
      txt(`${fmt(loss, 3)}`, rx + 50, -32, 58, probeCol, 'mono', 'center')
        .glow(10, probeCol)
        .opacity(alpha),
      txt('nats', rx + 50, 28, 28, probeCol, 'mono', 'center').opacity(alpha),
    );

    if (sb > 0.08) {
      nodes.push(
        txt(`${fmt(bits, 3)} bits`, rx + 50, 108, 38, ROLE.prob, 'mono', 'center')
          .glow(8, ROLE.prob)
          .opacity(sb * alpha),
      );
    }

    // Beat 2 bottom strip: one-hot target mass (2% "mat" vs 98% all other words)
    if (so > 0.08) {
      const stripL = -760;
      const stripW = 1520;
      const stripY = 368;
      const matW = Math.max(26, stripW * p);
      nodes.push(
        lumBar(stripL + matW / 2, stripY, matW, 42, {
          color: ROLE.warn,
          fillOpacity: 0.72,
          strokeWidth: 3,
          glow: 14,
          radius: 6,
          opacity: so * alpha,
        }),
        lumBar(stripL + matW + (stripW - matW) / 2, stripY, stripW - matW - 6, 42, {
          color: '#3c4d78',
          fillOpacity: 0.18,
          strokeWidth: 1.8,
          glow: 3,
          radius: 6,
          opacity: so * alpha,
        }),
        txt('mat: 2% (scored)', stripL, stripY - 46, 26, ROLE.warn, 'mono', 'left')
          .glow(6, ROLE.warn)
          .opacity(so * alpha),
        txt(
          'other words: 98% (ignored)',
          stripL + stripW,
          stripY - 46,
          26,
          COSMOS.muted,
          'mono',
          'right',
        ).opacity(so * alpha),
        txt(
          'Only the observed target slice enters this step loss.',
          0,
          426,
          28,
          ROLE.observed,
          'serif',
          'center',
        ).opacity(so * alpha),
      );
    }

    return nodes;
  });

  const natsEq = glowTex('\\ell_{\\text{nats}} = -\\ln p', {
    x: 565,
    y: -385,
    size: 40,
    color: ROLE.observed,
  });

  const bitsEq = glowTex('\\ell_{\\text{bits}} = \\frac{\\ell_{\\text{nats}}}{\\ln 2}', {
    x: 565,
    y: 205,
    size: 36,
    color: ROLE.prob,
  });

  s.add(cinemaAtmosphere(ROLE.observed, ROLE.warn), title, curveLayer);

  // Beat 0: define -ln(p) at p = 0.80
  playCue(s, c, 'surprise-beat-1-focus-1', (d) => s.play(probeP.to(0.74, { duration: d })), {
    dur: 0.55,
  });
  c.show('surprise-rule', natsEq);
  playCue(
    s,
    c,
    'surprise-rule',
    (d) => s.play(showRule.to(1, { duration: d }), probeP.to(0.8, { duration: d })),
    { dur: 0.5 },
  );

  // Beat 1: slide probe down 0.80 -> 0.02, highlight nats, convert to bits
  playCue(
    s,
    c,
    'surprise-beat-2-focus-2',
    (d) => s.play(probeP.to(0.02, { duration: d }), showHalvings.to(1, { duration: d * 0.5 })),
    { dur: 1.6 },
  );
  playCue(s, c, 'surprise-beat-2-focus-1', (d) => s.play(showHalvings.to(1, { duration: d })), {
    dur: 0.45,
  });
  c.show('surprise-bits', bitsEq);
  playCue(s, c, 'surprise-bits', (d) => s.play(showBits.to(1, { duration: d })), { dur: 0.55 });

  // Beat 2: one-hot target strip (2% vs 98%)
  playCue(s, c, 'surprise-beat-3-focus-1', (d) => s.play(showOneHot.to(1, { duration: d })), {
    dur: 0.65,
  });
}
