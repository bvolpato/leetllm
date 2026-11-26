// Act 1 (Scenes 1-6): Intro Forecast, Line Coefficients, Residuals Arch, Squared Error & R^2,
// 3D Convex Loss Bowl Gradient Descent, and Orthogonal Projection / Normal Equations.
import {
  arrow,
  circle,
  curve3d,
  dynamic,
  group,
  line,
  point3d,
  rect,
  surface,
} from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  cinemaGrid,
  cinematic3d,
  cueTo,
  data,
  decorAura,
  fadeIn,
  fadeOut,
  glowBar,
  glowDot,
  glowTex,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  livingDrift,
  mix,
  mse,
  orbitScene,
  oversizedPath,
  predict,
  rule,
  stablePath,
  txt,
} from '../shared.mjs';

// ---------------------------------------------------------------------------
// 1. intro: How long for another hundred tokens?
// Cues: clock-stops, last-gap, next-increase*, next-time
// ---------------------------------------------------------------------------
export function intro(s, c) {
  const clkP = s.value(0);
  const gapP = s.value(0);
  const incP = s.value(0);
  const tmP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.line, seed: 1 }));
  s.add(decorAura(-320, 20, 480, '#ffd1661c', '#07091000'));
  s.add(decorAura(380, 20, 480, '#5ce1e61c', '#07091000'));

  const headline = heroTitle(['How a Line', 'Learns to Predict'], {
    x: -855,
    y: -430,
    size: 56,
    lineHeight: 66,
    accent: ROLE.line,
    eyebrow: 'CONTEXT LENGTH  VS  REPLY LATENCY',
  });

  const live = dynamic(() => {
    const cl = clkP.value;
    const gp = gapP.value;
    const inc = incP.value;
    const tm = tmP.value;
    const nodes = [];

    // Left: Glowing stopwatch & live latency plot
    const gx0 = -800;
    const gx1 = -40;
    const gy0 = 260;
    const gy1 = -180;
    const xOf = (x) => mix(gx0, gx1, (x - 0.5) / 6.0);
    const yOf = (y) => mix(gy0, gy1, (y - 90) / 150);

    nodes.push(
      txt('MEASURED LATENCIES (MS)', gx0, -215, 26, ROLE.data, 'mono', 'left'),
      line([gx0, gy0], [gx1, gy0], { stroke: '#425582', width: 2.6 }),
      line([gx0, gy0], [gx0, gy1], { stroke: '#425582', width: 2.6 }),
    );
    data.forEach((row, i) => {
      const show = i < 4 ? 1 : cl;
      if (show < 0.05) return;
      const px = xOf(row.x);
      const py = yOf(row.y);
      nodes.push(
        glowDot(px, py, { radius: 11, color: ROLE.data, glow: 12, opacity: show }),
        txt(`${row.x * 100}`, px, gy0 + 40, 26, COSMOS.muted, 'mono'),
        txt(`${row.y}`, px, py - 34, 26, ROLE.data, 'mono').opacity(show),
      );
    });

    if (tm > 0.1) {
      nodes.push(
        glowDot(xOf(6), yOf(213), { radius: 13, color: ROLE.curve, glow: 14, opacity: tm }),
        txt('600', xOf(6), gy0 + 40, 26, ROLE.curve, 'mono'),
        txt('213 ms?', xOf(6), yOf(213) - 38, 28, ROLE.curve, 'mono').opacity(tm),
      );
    }

    // Right: Floating increment column (+23, +21, +19, +17, +15?)
    const rx = 120;
    const diffs = [
      { label: '100 → 200', val: '+23 ms', col: ROLE.line, show: 1 },
      { label: '200 → 300', val: '+21 ms', col: ROLE.line, show: 1 },
      { label: '300 → 400', val: '+19 ms', col: ROLE.line, show: 1 },
      { label: '400 → 500', val: '+17 ms', col: ROLE.data, show: gp },
      {
        label: '500 → 600',
        val: inc > 0.2 ? '+15 ms → 213 ms' : '+?? ms',
        col: inc > 0.2 ? ROLE.curve : COSMOS.dim,
        show: 1,
      },
    ];
    nodes.push(txt('SHRINKING INCREMENTS (−2 MS EACH)', rx, -215, 26, ROLE.line, 'mono', 'left'));
    diffs.forEach((d, idx) => {
      const ry = -120 + idx * 84;
      nodes.push(
        txt(d.label, rx, ry, 30, COSMOS.muted, 'mono', 'left').opacity(Math.max(0.25, d.show)),
        txt(d.val, rx + 260, ry, 34, d.col, 'mono', 'left')
          .glow(idx >= 3 && d.show > 0.2 ? 9 : 0, d.col)
          .opacity(Math.max(0.25, d.show)),
      );
    });

    nodes.push(
      txt(
        tm > 0.2
          ? 'A straight line adds a constant step per 100 tokens · What would it predict?'
          : '198 ms at 500 tokens · How much will the next 100 tokens add?',
        0,
        345,
        30,
        ROLE.data,
        'serif',
      ),
    );

    return group(...nodes);
  });

  s.add(headline, live);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'clock-stops', clkP, 1, { dur: 0.7 });
  cueTo(s, c, 'last-gap', gapP, 1, { dur: 0.65 });
  cueTo(s, c, 'next-increase', incP, 1, { after: true, dur: 0.55 });
  cueTo(s, c, 'next-time', tmP, 1, { dur: 0.65 });
}

// ---------------------------------------------------------------------------
// 2. line: What moves when a coefficient changes?
// Cues: intercept-update, slope-update, prediction-read, zero-context
// ---------------------------------------------------------------------------
export function lineScene(s, c) {
  const bP = s.value(0);
  const mP = s.value(0);
  const readP = s.value(0);
  const zeroP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.line, seed: 2 }));
  s.add(decorAura(0, 20, 560, '#5ce1e61c', '#ffd16612'));

  const headline = heroTitle(['Intercept Shifts,', 'Slope Tilts'], {
    x: -855,
    y: -430,
    size: 56,
    lineHeight: 66,
    accent: ROLE.line,
    eyebrow: 'ŷ = b + m·x  (x IN HUNDREDS OF TOKENS)',
  });

  const live = dynamic(() => {
    const b = mix(85, 100, bP.value);
    const m = mix(10, 20, mP.value);
    const rd = readP.value;
    const zr = zeroP.value;
    const pred3 = b + m * 3;
    const nodes = [];

    const gx0 = -760;
    const gx1 = 180;
    const gy0 = 270;
    const gy1 = -195;
    const xOf = (x) => mix(gx0, gx1, x / 5.5);
    const yOf = (y) => mix(gy0, gy1, (y - 70) / 150);

    nodes.push(
      line([gx0, gy0], [gx1, gy0], { stroke: '#425582', width: 2.8 }),
      line([gx0, gy0], [gx0, gy1], { stroke: '#425582', width: 2.8 }),
      // Guide at x = 3 (300 tokens)
      line([xOf(3), gy0], [xOf(3), yOf(162)], { stroke: ROLE.data, width: 2.2, dash: [8, 6] }),
      txt('0', gx0, gy0 + 40, 26, COSMOS.muted, 'mono'),
      txt('300 tok (x=3)', xOf(3), gy0 + 40, 26, ROLE.data, 'mono'),
      txt('500', xOf(5), gy0 + 40, 26, COSMOS.muted, 'mono'),
    );

    // Moving fitted line
    const linePts = [
      [xOf(0), yOf(b)],
      [xOf(5.2), yOf(b + m * 5.2)],
    ];
    nodes.push(glowingTrail(linePts, { color: ROLE.line, width: 4.8, glow: 11 }));

    // Measured point at x=3, y=162 and moving prediction dot
    data.forEach((row) => {
      nodes.push(
        glowDot(xOf(row.x), yOf(row.y), {
          radius: row.x === 3 ? 11 : 7,
          color: ROLE.data,
          glow: row.x === 3 ? 12 : 5,
        }),
      );
    });
    nodes.push(glowDot(xOf(3), yOf(pred3), { radius: 11, color: ROLE.line, glow: 12 }));

    if (zr > 0.1) {
      nodes.push(
        glowDot(xOf(0), yOf(b), { radius: 13, color: ROLE.ridge, glow: 14, opacity: zr }),
        txt(
          'x = 0: 100 ms (extrapolated)',
          xOf(0) + 24,
          yOf(b) + 46,
          26,
          ROLE.ridge,
          'mono',
          'left',
        ).opacity(zr),
      );
    }

    // Right live formula readout
    const rx = 280;
    nodes.push(
      txt('LIVE PARAMETERS', rx, -195, 26, COSMOS.muted, 'mono', 'left'),
      txt(`Intercept b = ${b.toFixed(0)} ms`, rx, -110, 36, ROLE.ridge, 'mono', 'left'),
      txt(`Slope     m = ${m.toFixed(0)} ms / 100t`, rx, -40, 36, ROLE.line, 'mono', 'left'),
      txt(`At x = 3:  ŷ = ${pred3.toFixed(0)} ms`, rx, 60, 42, ROLE.line, 'mono', 'left').glow(
        8,
        ROLE.line,
      ),
      txt('Measured:  y = 162 ms', rx, 130, 34, ROLE.data, 'mono', 'left'),
      rd > 0.1
        ? txt(
            `Gap above line: +${(162 - pred3).toFixed(0)} ms`,
            rx,
            210,
            34,
            ROLE.curve,
            'mono',
            'left',
          )
            .glow(8, ROLE.curve)
            .opacity(rd)
        : group(),
    );

    return group(...nodes);
  });

  s.add(headline, live);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'intercept-update', bP, 1, { dur: 0.9 });
  cueTo(s, c, 'slope-update', mP, 1, { dur: 0.9 });
  cueTo(s, c, 'prediction-read', readP, 1, { dur: 0.65 });
  cueTo(s, c, 'zero-context', zeroP, 1, { dur: 0.75 });
}

// ---------------------------------------------------------------------------
// 3. residuals: Where did the line miss?
// Cues: residual-transfer, residual-others, residual-shift, residual-return
// ---------------------------------------------------------------------------
export function residuals(s, c) {
  const trP = s.value(0);
  const othP = s.value(0);
  const shP = s.value(0);
  const retP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.curve, seed: 3 }));
  s.add(decorAura(0, 20, 560, '#ff6b8b1c', '#5ce1e614'));

  const headline = heroTitle(['Magnified Residuals', 'Reveal the Arch'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 64,
    accent: ROLE.curve,
    eyebrow: 'RESIDUAL  r = y − ŷ',
  });

  const live = dynamic(() => {
    const tr = trP.value;
    const oth = othP.value;
    const lift = 6 * shP.value * (1 - retP.value); // lifts line by +6ms -> shifts residuals by -6ms
    const nodes = [];

    const x0 = -740;
    const x1 = 740;
    const zeroY = 10;
    const xOf = (x) => mix(x0, x1, (x - 0.5) / 5.0);
    const yOf = (r) => zeroY - r * 20;

    nodes.push(
      txt(
        lift > 0.2
          ? `LINE LIFTED +${lift.toFixed(1)} MS  →  ALL RESIDUALS DROP`
          : 'RESIDUAL AXIS  (r = y − ŷ, IN MS)',
        x0,
        -215,
        28,
        lift > 0.2 ? ROLE.curve : ROLE.line,
        'mono',
        'left',
      ),
      line([x0, zeroY], [x1, zeroY], { stroke: ROLE.line, width: 3.2, dash: [10, 7] }),
      txt('0 ms (exact)', x1, zeroY - 34, 26, ROLE.line, 'mono', 'right'),
    );

    const pts = [];
    data.forEach((row, i) => {
      const show = i === 2 ? Math.max(0.3, tr) : oth;
      const r = row.y - (predict(row.x) + lift);
      const px = xOf(row.x);
      const py = yOf(r);
      if (show > 0.1) pts.push([px, py]);
      if (show < 0.05) return;
      const col = r >= 0 ? ROLE.curve : ROLE.data;
      nodes.push(
        group(
          line([px, zeroY], [px, py], { stroke: col, width: 4.5 }).glow(8, col),
          glowDot(px, py, { radius: 12, color: col, glow: 12 }),
          txt(
            `${r >= 0 ? '+' : ''}${r.toFixed(0)}`,
            px,
            r >= 0 ? py - 38 : py + 42,
            30,
            col,
            'mono',
          ),
          txt(`${row.x * 100}t`, px, 275, 26, COSMOS.muted, 'mono'),
        ).opacity(show),
      );
    });

    if (pts.length >= 2 && oth > 0.3) {
      nodes.push(glowingTrail(pts, { color: ROLE.curve, width: 3, glow: 8, opacity: 0.7 * oth }));
    }

    nodes.push(
      txt(
        lift > 0.3
          ? 'Middle misses by −4 ms and ends drop to −8 ms!'
          : 'Residuals [−2, +1, +2, +1, −2]: high at ends, low in middle',
        0,
        345,
        30,
        COSMOS.ink,
        'serif',
      ),
    );

    return group(...nodes);
  });

  s.add(headline, live);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'residual-transfer', trP, 1, { dur: 0.75 });
  cueTo(s, c, 'residual-others', othP, 1, { dur: 0.85 });
  cueTo(s, c, 'residual-shift', shP, 1, { dur: 0.9 });
  cueTo(s, c, 'residual-return', retP, 1, { dur: 0.85 });
}

// ---------------------------------------------------------------------------
// 4. loss: How much error did the line leave?
// Cues: loss-collect, loss-average, loss-root, loss-baseline, loss-score
// ---------------------------------------------------------------------------
export function loss(s, c) {
  const colP = s.value(0);
  const avgP = s.value(0);
  const rootP = s.value(0);
  const baseP = s.value(0);
  const scP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.curve, seed: 4 }));
  s.add(decorAura(0, 30, 560, '#ff6b8b1c', '#ffd16614'));

  const headline = heroTitle(['Squared Residuals,', 'MSE, RMSE & R²'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 64,
    accent: ROLE.curve,
    eyebrow: 'SIGNED SUM = 0  ·  SQUARES ADD TO 14',
  });

  const live = dynamic(() => {
    const cl = colP.value;
    const av = avgP.value;
    const rt = rootP.value;
    const bs = baseP.value;
    const sc = scP.value;
    const resids = [-2, 1, 2, 1, -2];
    const nodes = [];

    // Top row: 5 geometric squares whose side = |residual|
    nodes.push(
      txt(
        'FIVE SQUARED RESIDUALS:  4 + 1 + 4 + 1 + 4 = 14',
        -820,
        -210,
        28,
        ROLE.curve,
        'mono',
        'left',
      ),
    );
    resids.forEach((r, i) => {
      const cx = -640 + i * 320;
      const cy = -75;
      const side = Math.abs(r) * 56; // 112px for |r|=2, 56px for |r|=1
      nodes.push(
        rect(side, side, { fill: '#2a1222', stroke: ROLE.curve, width: 3, radius: 8 })
          .at(cx, cy)
          .glow(9, ROLE.curve)
          .opacity(Math.max(0.35, cl)),
        txt(`${r * r}`, cx, cy, 30, ROLE.curve, 'mono'),
        txt(`r = ${r >= 0 ? '+' : ''}${r}`, cx, cy + 88, 26, COSMOS.muted, 'mono'),
      );
    });

    // Bottom left: MSE & RMSE (quiet placeholder slots from t=0; answers withheld until cues)
    nodes.push(
      txt(
        av > 0.05 ? 'MSE = 14 / 5 = 2.8 ms²' : 'MSE = (Σ rᵢ²) / 5 = ?',
        -820,
        120,
        36,
        av > 0.05 ? ROLE.curve : COSMOS.dim,
        'mono',
        'left',
      )
        .glow(av > 0.05 ? 8 : 0, ROLE.curve)
        .opacity(mix(0.65, 1, av)),
      txt(
        rt > 0.1 ? 'RMSE = √2.8 ≈ 1.67 ms' : 'RMSE = √MSE = ?',
        -820,
        195,
        36,
        rt > 0.1 ? ROLE.data : COSMOS.dim,
        'mono',
        'left',
      )
        .glow(rt > 0.1 ? 9 : 0, ROLE.data)
        .opacity(mix(0.65, 1, rt)),
    );

    // Bottom right: Mean baseline comparison (802.8 vs 2.8) -> R^2 = 0.9965
    nodes.push(
      txt(
        bs > 0.05
          ? 'MEAN BASELINE (ŷ = 160 ms):  MSE = 802.8'
          : 'COMPARE VS FLAT MEAN BASELINE  (ŷ = 160 ms)',
        60,
        115,
        28,
        bs > 0.05 ? ROLE.ridge : COSMOS.dim,
        'mono',
        'left',
      ).opacity(mix(0.65, 1, bs)),
      glowBar(60, 175, bs > 0.05 ? 740 : 520, 32, bs > 0.05 ? ROLE.ridge : '#283654', {
        glow: bs > 0.05 ? 8 : 0,
      }).opacity(mix(0.45, 1, bs)),
      glowBar(60, 225, bs > 0.05 ? 16 : 64, 32, bs > 0.05 ? ROLE.good : '#283654', {
        glow: bs > 0.05 ? 10 : 0,
      }).opacity(mix(0.45, 1, bs)),
      txt(
        bs > 0.05 ? 'Fitted line: 2.8' : 'Fitted line MSE vs baseline',
        bs > 0.05 ? 100 : 145,
        225,
        26,
        bs > 0.05 ? ROLE.good : COSMOS.dim,
        'mono',
        'left',
      ).opacity(mix(0.65, 1, bs)),
      txt(
        sc > 0.1 ? 'R² = 0.9965  (arch hidden in average!)' : 'R² = 1 − MSE_line / MSE_mean = ?',
        60,
        300,
        30,
        sc > 0.1 ? ROLE.data : COSMOS.dim,
        'mono',
        'left',
      )
        .glow(sc > 0.1 ? 8 : 0, ROLE.data)
        .opacity(mix(0.65, 1, sc)),
    );

    return group(...nodes);
  });

  s.add(headline, live);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'loss-collect', colP, 1, { dur: 0.8 });
  cueTo(s, c, 'loss-average', avgP, 1, { dur: 0.7 });
  cueTo(s, c, 'loss-root', rootP, 1, { dur: 0.7 });
  cueTo(s, c, 'loss-baseline', baseP, 1, { dur: 0.8 });
  cueTo(s, c, 'loss-score', scP, 1, { dur: 0.7 });
}

// ---------------------------------------------------------------------------
// 5. fit: How do the errors move the line? (SIGNATURE 3D CONVEX LOSS BOWL)
// Cues: gradient-first, gradient-descent, gradient-oversized
// ---------------------------------------------------------------------------
export function fit(s, c) {
  const firstP = s.value(0);
  const descP = s.value(0);
  const overP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.line, seed: 5 }));
  s.add(decorAura(340, 20, 520, '#5ce1e622', '#ff6b8b14'));

  // 3D Convex MSE Loss Bowl over normalized (b, m) coordinates
  const view3d = cinematic3d({
    theta: -0.78,
    phi: 1.04,
    distance: 15.2,
    unit: 112,
    focus: [0, 0, 0.9],
  }).at(340, 20);

  const bowlZ = (u, v) => {
    const b = 100 + u * 42;
    const m = 20 + v * 14;
    const val = mse(b, m);
    return Math.min(2.75, Math.log1p(val / 28) * 0.62);
  };

  view3d.add(
    surface(bowlZ, {
      x: [-2.5, 2.5],
      y: [-2.5, 2.5],
      resolution: [32, 32],
      colors: ['#070b1a', '#1b275c', '#4c2f8a', '#1f7ec2', '#5ce1e6', '#ffd166'],
      mesh: '#7ce8ff',
      meshOpacity: 0.16,
      meshWidth: 0.55,
      opacity: 0.88,
    }),
    // Optimum bottom beacon at (b=100, m=20) -> (u=0, v=0)
    point3d([0, 0, bowlZ(0, 0) + 0.08], { color: ROLE.good, radius: 9, glow: 14 }),
    // Live moving GD ball on the 3D bowl
    point3d(
      () => {
        if (overP.value > 0.05) {
          const idx = Math.min(
            oversizedPath.length - 1,
            Math.floor(overP.value * (oversizedPath.length - 1)),
          );
          const st = oversizedPath[idx];
          const u = Math.max(-2.4, Math.min(2.4, (st.intercept - 100) / 42));
          const v = Math.max(-2.4, Math.min(2.4, (st.slope - 20) / 14));
          return [u, v, bowlZ(u, v) + 0.12];
        }
        const idx =
          descP.value > 0.02
            ? Math.min(
                stablePath.length - 1,
                Math.round(Math.pow(stablePath.length - 1, descP.value)),
              )
            : firstP.value > 0.2
              ? 1
              : 0;
        const st = stablePath[idx];
        const u = Math.max(-2.4, Math.min(2.4, (st.intercept - 100) / 42));
        const v = Math.max(-2.4, Math.min(2.4, (st.slope - 20) / 14));
        return [u, v, bowlZ(u, v) + 0.12];
      },
      { color: ROLE.curve, radius: 10, glow: 14 },
    ),
  );

  const headline = heroTitle(['Gradient Descent', 'Down the Convex Bowl'], {
    x: -855,
    y: -430,
    size: 52,
    lineHeight: 62,
    accent: ROLE.line,
    eyebrow: '3D MSE SURFACE  ·  η = 0.05 (STABLE) VS η = 0.09 (DIVERGES)',
  });

  const leftPanel = dynamic(() => {
    const fr = firstP.value;
    const ds = descP.value;
    const ov = overP.value;
    const nodes = [];

    const isOver = ov > 0.05;
    const idx = isOver
      ? Math.min(oversizedPath.length - 1, Math.floor(ov * (oversizedPath.length - 1)))
      : ds > 0.02
        ? Math.min(stablePath.length - 1, Math.round(Math.pow(stablePath.length - 1, ds)))
        : fr > 0.2
          ? 1
          : 0;
    const st = isOver ? oversizedPath[idx] : stablePath[idx];

    nodes.push(
      txt(
        isOver ? 'OVERSIZED RATE  η = 0.09 (DIVERGING!)' : 'STABLE RATE  η = 0.05',
        -855,
        -205,
        28,
        isOver ? ROLE.curve : ROLE.line,
        'mono',
        'left',
      ),
      txt(`Step ${idx}`, -855, -135, 32, COSMOS.muted, 'mono', 'left'),
      txt(`Intercept b = ${st.intercept.toFixed(1)}`, -855, -70, 38, ROLE.data, 'mono', 'left'),
      txt(`Slope     m = ${st.slope.toFixed(1)}`, -855, -5, 38, ROLE.line, 'mono', 'left'),
      txt(
        `MSE Loss    = ${st.loss.toFixed(1)}`,
        -855,
        70,
        44,
        isOver ? ROLE.curve : ROLE.good,
        'mono',
        'left',
      ).glow(10, isOver ? ROLE.curve : ROLE.good),
      txt(
        isOver
          ? 'Crosses the valley floor and blows up!'
          : fr > 0.2 && ds < 0.05
            ? 'First step from (0, 0) → (16, 52)'
            : 'Fast down steep wall, slow along shallow valley',
        -855,
        165,
        28,
        COSMOS.ink,
        'serif',
        'left',
      ),
      txt('3D CONVEX MSE LOSS SURFACE', 340, 395, 26, COSMOS.muted, 'mono'),
    );

    return group(...nodes);
  });

  s.add(view3d, headline, leftPanel);
  orbitScene(s, c, view3d, { theta: -0.26, phi: 0.94 });
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'gradient-first', firstP, 1, { dur: 0.75 });
  cueTo(s, c, 'gradient-descent', descP, 1, { dur: 1.4 });
  cueTo(s, c, 'gradient-oversized', overP, 1, { dur: 1.3 });
}

// ---------------------------------------------------------------------------
// 6. solve: Which weights give the shortest miss?
// Cues: solve-rows, solve-project, solve-balances, solve-duplicate
// ---------------------------------------------------------------------------
export function solve(s, c) {
  const rowP = s.value(0);
  const projP = s.value(0);
  const balP = s.value(0);
  const dupP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.good, seed: 6 }));
  s.add(decorAura(0, 20, 560, '#6ee7b71e', '#a78bfa16'));

  const headline = heroTitle(['Orthogonal Projection', '& Normal Equations'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 64,
    accent: ROLE.good,
    eyebrow: 'SHORTEST MISS MEETS COLUMN SPACE AT 90°',
  });

  const live = dynamic(() => {
    const rw = rowP.value;
    const pr = projP.value;
    const bl = balP.value;
    const dp = dupP.value;
    const ph = drift.value;
    const nodes = [];

    // Left: Orthogonal projection geometry (y -> y_hat + perpendicular r)
    const ox = -700;
    const oy = 180;
    const hatX = -150;
    const hatY = 180;
    const yX = -150;
    const yY = -120;
    nodes.push(
      txt('COLUMN SPACE  span([1], [x])', ox, oy + 62, 26, ROLE.good, 'mono', 'left'),
      line([ox - 40, oy], [hatX + 90, hatY], { stroke: ROLE.good, width: 3.5 }).glow(8, ROLE.good),
      arrow([ox, oy], [yX, yY], { stroke: ROLE.data, width: 4.5 }),
      txt('y (target)', -460, -25, 30, ROLE.data, 'mono'),
    );

    if (pr > 0.05) {
      nodes.push(
        arrow([ox, oy], [mix(ox, hatX, pr), hatY], { stroke: ROLE.line, width: 4.5 }),
        txt('ŷ = Xw', -420, oy - 34, 30, ROLE.line, 'mono').opacity(pr),
        line([hatX, hatY], [hatX, mix(hatY, yY, pr)], {
          stroke: ROLE.curve,
          width: 4,
          dash: [8, 6],
        }).glow(8, ROLE.curve),
        txt('r ⊥ X', hatX + 34, 30, 30, ROLE.curve, 'mono', 'left').opacity(pr),
        rect(28, 28, { fill: null, stroke: ROLE.good, width: 2.5 })
          .at(hatX - 14, hatY - 14)
          .opacity(pr),
      );
    }

    // Right: Row check, orthogonality dot products, and duplicate-column trade
    const rx = 80;
    if (dp > 0.1) {
      const w1 = mix(20, 4, dp);
      const w2 = mix(0, 8, dp);
      nodes.push(
        group(
          txt('COLLINEAR COLUMNS:  x  AND  2x', rx, -195, 28, ROLE.data, 'mono', 'left'),
          txt(
            `w₁ = ${w1.toFixed(1)},   w₂ = ${w2.toFixed(1)}`,
            rx,
            -100,
            44,
            ROLE.data,
            'mono',
            'left',
          ).glow(9, ROLE.data),
          glowTex(`${w1.toFixed(0)}\\cdot x + ${w2.toFixed(0)}\\cdot (2x) = 20\\,x`, {
            x: rx + 320,
            y: 25,
            size: 46,
            color: ROLE.good,
          }),
          txt(
            'Identical predictions from infinitely many weight pairs!',
            rx,
            145,
            28,
            COSMOS.ink,
            'serif',
            'left',
          ),
        ).opacity(dp),
      );
    } else {
      nodes.push(
        txt('DESIGN MATRIX  X w = ŷ', rx, -195, 26, ROLE.good, 'mono', 'left'),
        txt('Row 3:  1(100) + 3(20) = 160 ms', rx, -120, 30, COSMOS.ink, 'mono', 'left').opacity(
          Math.max(0.3, rw),
        ),
      );
      if (bl > 0.05) {
        nodes.push(
          group(
            txt('ORTHOGONALITY CHECKS:', rx, -10, 26, ROLE.line, 'mono', 'left'),
            glowTex('\\sum r_i = (-2)+1+2+1+(-2) = 0', {
              x: rx + 340,
              y: 70,
              size: 36,
              color: ROLE.line,
            }),
            glowTex('\\sum x_i r_i = -2+2+6+4-10 = 0', {
              x: rx + 340,
              y: 165,
              size: 36,
              color: ROLE.good,
            }),
          ).opacity(bl),
        );
      }
    }

    return group(...nodes);
  });

  s.add(headline, live);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'solve-rows', rowP, 1, { dur: 0.7 });
  cueTo(s, c, 'solve-project', projP, 1, { dur: 0.85 });
  cueTo(s, c, 'solve-balances', balP, 1, { dur: 0.85 });
  cueTo(s, c, 'solve-duplicate', dupP, 1, { dur: 1.0 });
}
