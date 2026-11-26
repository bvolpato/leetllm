// Act 2: Reverse Posterior Mixture, Training Targets & Velocity Parameterization,
// Iterative Reverse Loop, and Exact Scalar Reverse Trace.
import { Node, arrow, circle, dot, dynamic, group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  POSTERIOR,
  SCALAR_TRACE,
  TOP_JUMP,
  TOP_PIXEL,
  aura,
  brightnessRuler,
  cinemaGrid,
  cueTo,
  decimal,
  exposure,
  fadeIn,
  fadeOut,
  glassPlate,
  glowTex,
  guardedDynamic,
  image,
  imageNoise,
  livingDrift,
  photonWire,
  pixelGrid,
  polyPath,
  pulseCue,
  recoverClean,
  txt,
} from '../shared.mjs';

// ---------------------------------------------------------------------------
// 6. reverse-posterior: What distribution takes the gray pixel one step back?
// Cues: causes-observed, cause-dark, cause-light, causes-half, causes-mix, causes-total*
// ---------------------------------------------------------------------------
export function reversePosterior(s, c) {
  const showObs = s.value(0);
  const darkP = s.value(0);
  const lightP = s.value(0);
  const halfP = s.value(0);
  const mixP = s.value(0);
  const totalRev = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: COSMOS.violet, opacity: 0.46 }));
  s.add(aura(-220, 10, 500, '#5ce1e622', '#17203d12'));
  s.add(aura(480, 0, 400, '#a78bfa22', '#17203d12'));

  const xs = Array.from({ length: 141 }, (_, i) => -2.25 + (4.5 * i) / 140);
  const gauss = (x, mean) =>
    Math.exp(-((x - mean) ** 2) / (2 * POSTERIOR.within)) /
    Math.sqrt(2 * Math.PI * POSTERIOR.within);

  const mapX = (v) => -250 + v * 220;
  const mapY = (d) => 220 - d * 540;

  const livePlot = dynamic(() => {
    const obs = showObs.value;
    const dP = darkP.value;
    const lP = lightP.value;
    const hP = halfP.value;
    const mP = mixP.value;
    const tot = totalRev.value > 0.5;
    const weight = 1 - 0.5 * hP;
    const showingCurves = dP > 0.02 || lP > 0.02;

    const nodes = [
      txt(
        showingCurves ? 'Density of the previous state' : 'Two clean values, one observation',
        -250,
        -375,
        40,
        COSMOS.ink,
        'serif',
      ),
      // Horizontal axis
      line([mapX(-2.25), mapY(0)], [mapX(2.25), mapY(0)], { stroke: '#6d82b0', width: 3 }),
      ...[-2, -1, 0, 1, 2].flatMap((tk) => [
        line([mapX(tk), mapY(0) - 8], [mapX(tk), mapY(0) + 12], { stroke: '#7b90bc', width: 2.2 }),
        txt(String(tk).replace('-', '−'), mapX(tk), mapY(0) + 46, 26, COSMOS.muted, 'mono'),
      ]),
      txt(
        showingCurves ? 'Previous pixel value' : 'Normalized brightness',
        -250,
        312,
        28,
        COSMOS.muted,
        'sans',
      ),
    ];

    // Beat 0: Two clean sources pointing inward to observed x = 0
    if (!showingCurves) {
      const pulseR = 19 + 3 * Math.sin(drift.value * Math.PI * 8);
      nodes.push(
        dot(16, COSMOS.blue).at(mapX(-1), 40).glow(12, COSMOS.blue),
        dot(16, COSMOS.violet).at(mapX(1), 40).glow(12, COSMOS.violet),
        arrow([mapX(-1) + 26, 40], [mapX(0) - 32, 40], {
          stroke: COSMOS.blue,
          width: 5,
          tip: 15,
        })
          .glow(8, COSMOS.blue)
          .opacity(0.35 + 0.65 * obs),
        arrow([mapX(1) - 26, 40], [mapX(0) + 32, 40], {
          stroke: COSMOS.violet,
          width: 5,
          tip: 15,
        })
          .glow(8, COSMOS.violet)
          .opacity(0.35 + 0.65 * obs),
        txt('Dark  (−1)', mapX(-1), 108, 30, COSMOS.blue, 'mono'),
        txt('Light  (+1)', mapX(1), 108, 30, COSMOS.violet, 'mono'),
        txt('Observed now', mapX(0), -34, 28, COSMOS.muted, 'sans'),
        dot(pulseR, COSMOS.gold).at(mapX(0), 40).glow(16, COSMOS.gold),
        txt('x = 0', mapX(0), 112, 40, COSMOS.gold, 'mono').glow(8, COSMOS.gold),
      );
    }

    // Conditional curves
    const curveSpecs = [
      { mean: POSTERIOR.means[0], prog: dP, col: COSMOS.blue },
      { mean: POSTERIOR.means[1], prog: lP, col: COSMOS.violet },
    ];
    for (const sp of curveSpecs) {
      if (sp.prog <= 0.02) continue;
      const count = Math.max(2, Math.round(xs.length * sp.prog));
      const pts = xs.slice(0, count).map((v) => [mapX(v), mapY(weight * gauss(v, sp.mean))]);
      nodes.push(
        new Node(polyPath(pts)).stroke(sp.col, 5.2, 0.92).glow(10, sp.col),
        dot(9, sp.col).at(mapX(sp.mean), mapY(0)).glow(10, sp.col),
      );
    }

    // Mixture curve (gold)
    if (mP > 0.02) {
      const count = Math.max(2, Math.round(xs.length * mP));
      const pts = xs.slice(0, count).map((v) => {
        const d = 0.5 * gauss(v, POSTERIOR.means[0]) + 0.5 * gauss(v, POSTERIOR.means[1]);
        return [mapX(v), mapY(d)];
      });
      nodes.push(new Node(polyPath(pts)).stroke(COSMOS.gold, 7, 0.98).glow(14, COSMOS.gold));
    }

    // Right-hand structured legend & state parameters (well clear of curves)
    const rx = 560;
    nodes.push(
      glassPlate(rx, -35, 510, 560, { stroke: '#3c5080', glow: 5 }),
      txt('CLEAN PIXEL CAUSES', rx, -262, 26, COSMOS.muted, 'mono'),
      dot(11, COSMOS.blue)
        .at(rx - 195, -184)
        .glow(10, COSMOS.blue),
      txt('Dark   −1', rx - 165, -184, 34, COSMOS.blue, 'mono', 'left'),
      txt(
        dP >= 0.98 ? `mean ${decimal(POSTERIOR.means[0])} · var 1/3` : 'prior chance  1/2',
        rx - 195,
        -132,
        26,
        COSMOS.ink,
        'mono',
        'left',
      ),
      dot(11, COSMOS.violet)
        .at(rx - 195, -52)
        .glow(10, COSMOS.violet),
      txt('Light  +1', rx - 165, -52, 34, COSMOS.violet, 'mono', 'left'),
      txt(
        lP >= 0.98 ? `mean +${decimal(POSTERIOR.means[1])} · var 1/3` : 'prior chance  1/2',
        rx - 195,
        0,
        26,
        COSMOS.ink,
        'mono',
        'left',
      ),
      line([rx - 210, 56], [rx + 210, 56], { stroke: '#2c3d66', width: 1.8 }),
      txt('Observed  x = 0', rx - 195, 106, 30, COSMOS.gold, 'mono', 'left'),
      txt('Prev ᾱ = 0.50 · β = 0.50', rx - 195, 160, 26, COSMOS.muted, 'mono', 'left'),
      txt('Curr ᾱ = 0.25', rx - 195, 206, 26, COSMOS.muted, 'mono', 'left'),
    );

    // Bottom takeaway line: strictly withholds 5/9 until causes-total AFTER!
    const bottomText = !showingCurves
      ? 'Which distribution takes the step back?'
      : mP < 0.05
        ? 'Known clean pixel → single conditional Gaussian'
        : tot
          ? 'Variance:  1/3 within  +  2/9 between  =  5/9'
          : 'Equal mixture  =  ½ dark curve  +  ½ light curve';

    nodes.push(
      txt(bottomText, 0, 405, 34, tot ? COSMOS.gold : COSMOS.ink, 'sans').glow(
        tot ? 10 : 0,
        COSMOS.gold,
      ),
    );

    return group(...nodes);
  });

  s.add(livePlot);
  livingDrift(s, c, drift, 1);

  cueTo(s, c, 'causes-observed', showObs, 1, { dur: 0.7 });
  cueTo(s, c, 'cause-dark', darkP, 1, { dur: 1.5 });
  cueTo(s, c, 'cause-light', lightP, 1, { dur: 1.5 });
  cueTo(s, c, 'causes-half', halfP, 1, { dur: 1.0 });
  cueTo(s, c, 'causes-mix', mixP, 1, { dur: 1.4 });
  // Prediction answer 5/9 strictly revealed AFTER spoken clause!
  cueTo(s, c, 'causes-total', totalRev, 1, { after: true, dur: 0.3 });
}

// ---------------------------------------------------------------------------
// 7. training-targets: What did the network predict?
// Cues: loss-residuals, loss-mean*, target-rotation, target-failure*, target-convert*
// ---------------------------------------------------------------------------
export function trainingTargets(s, c) {
  const resP = s.value(0);
  const mseRev = s.value(0);
  const pairMode = s.value(0); // 0 = beat 0 MSE table, 1 = beats 1-3 velocity/tabletop
  const phase = s.value(0); // 0 = beat 1 velocity, 1 = beat 2 question, 2 = beat 2 failure, 3 = beat 3 convert
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: COSMOS.gold, opacity: 0.44 }));
  s.add(aura(-420, 0, 440, '#2a588a22', '#151e3d12'));
  s.add(aura(420, 0, 440, '#ffd1661f', '#18244a12'));

  const lossRows = [
    { level: 100, noise: [0.2, -0.1, 0.05], pred: [0.18, -0.08, 0.02] },
    { level: 700, noise: [0.9, -0.4, 0.3], pred: [0.72, -0.35, 0.1] },
  ].map((row) => ({
    ...row,
    mse: row.noise.reduce((acc, v, i) => acc + (v - row.pred[i]) ** 2, 0) / row.noise.length,
  }));

  const a = Math.sqrt(0.5);
  const b = Math.sqrt(1 - 0.5);
  const velocity = image.map((clean, i) => a * imageNoise[i] - b * clean);
  const mistaken = TOP_JUMP.input.map((x, i) => recoverClean(x, velocity[i], 0.5));
  const converted = TOP_JUMP.input.map((x, i) => a * x - b * velocity[i]);

  // Beat 0: Exact coordinate residual pairing + MSE withholding until loss-mean AFTER
  const beat0View = guardedDynamic(
    () => fadeOut(pairMode.value),
    (vis) => {
      const rp = resP.value;
      const done = mseRev.value > 0.5;
      const nodes = [
        txt('NOISE PREDICTION LOSS', -810, -355, 28, COSMOS.cyan, 'mono', 'left'),
        txt('Injected noise  →  network prediction', -810, -295, 36, COSMOS.ink, 'serif', 'left'),
        txt('Mean square', 740, -295, 30, COSMOS.muted, 'mono', 'right'),
      ];

      lossRows.forEach((row, rIdx) => {
        const y = -115 + rIdx * 260;
        nodes.push(
          glassPlate(0, y + 25, 1620, 195, {
            stroke: rIdx === 0 ? COSMOS.cyan : COSMOS.violet,
            glow: 5,
          }),
          txt(`t = ${row.level}`, -770, y, 36, COSMOS.ink, 'mono', 'left'),
        );
        row.noise.forEach((tgt, i) => {
          const x = -475 + i * 335;
          const err = tgt - row.pred[i];
          const showSq = rp >= (i + 1) / 3 - 0.05;
          nodes.push(
            txt(
              `${decimal(tgt, 2)} → ${decimal(row.pred[i], 2)}`,
              x,
              y - 12,
              30,
              COSMOS.cyan,
              'mono',
              'left',
            ),
            showSq
              ? txt(`(${decimal(err, 2)})²`, x, y + 50, 30, COSMOS.gold, 'mono', 'left').glow(
                  6,
                  COSMOS.gold,
                )
              : group(),
          );
        });
        nodes.push(
          txt(
            done ? decimal(row.mse, 4) : '?',
            755,
            y + 18,
            46,
            done ? COSMOS.gold : COSMOS.muted,
            'mono',
            'right',
          ).glow(done ? 10 : 0, COSMOS.gold),
        );
      });

      nodes.push(
        txt(
          'Two supplied rows · three coordinates per row · no discriminator required',
          0,
          355,
          28,
          COSMOS.muted,
          'sans',
        ),
      );
      return group(...nodes).opacity(vis);
    },
  );

  // Beats 1-3: Velocity output & mistaken-noise vs velocity-inverse tabletop comparison
  const beat13View = guardedDynamic(
    () => fadeIn(pairMode.value),
    (vis) => {
      const ph = phase.value;
      const isBeat1 = ph < 0.5;
      const isAskingWrong = ph >= 0.5 && ph < 1.5;
      const isWrongRev = ph >= 1.5 && ph < 2.5;
      const isRepairRev = ph >= 2.5;

      const rightPixels = isBeat1
        ? TOP_JUMP.input
        : isAskingWrong
          ? null
          : isRepairRev
            ? converted
            : mistaken;

      const rightTitle = isBeat1
        ? 'Noisy input'
        : isRepairRev
          ? 'Velocity inverse'
          : 'Noise inverse';

      const midNotes = isBeat1
        ? [
            txt('VELOCITY TARGET', 0, -145, 26, COSMOS.cyan, 'mono'),
            txt('v = a·ε − b·x₀', 0, -76, 36, COSMOS.ink, 'mono'),
            txt(`v = ${decimal(velocity[TOP_PIXEL])}`, 0, -4, 42, COSMOS.gold, 'mono').glow(
              8,
              COSMOS.gold,
            ),
            txt(`x = ${decimal(TOP_JUMP.input[TOP_PIXEL])}`, 0, 62, 30, COSMOS.muted, 'mono'),
          ]
        : isRepairRev
          ? [
              txt('VELOCITY INVERSE', 0, -145, 26, COSMOS.emerald, 'mono'),
              txt('x̂₀ = a·x − b·v', 0, -76, 34, COSMOS.gold, 'mono'),
              txt('ε̂ = b·x + a·v', 0, -12, 34, COSMOS.cyan, 'mono'),
              txt('Restores x₀ = 1.000', 0, 56, 30, COSMOS.emerald, 'sans'),
            ]
          : [
              txt('READ AS NOISE?', 0, -145, 26, COSMOS.rose, 'mono'),
              txt('(x − b·v) / a', 0, -76, 34, COSMOS.ink, 'mono'),
              txt('a = b = √0.50', 0, -12, 28, COSMOS.muted, 'mono'),
              txt(
                isWrongRev ? `gives ${decimal(mistaken[TOP_PIXEL])}!` : 'result = ?',
                0,
                58,
                36,
                isWrongRev ? COSMOS.rose : COSMOS.gold,
                'mono',
              ).glow(8, isWrongRev ? COSMOS.rose : COSMOS.gold),
            ];

      return group(
        // Left clean reference
        txt('Known clean image', -540, -356, 36, COSMOS.cyan, 'serif'),
        pixelGrid(image, {
          cx: -540,
          cy: -62,
          size: 420,
          selected: TOP_PIXEL,
          frameColor: COSMOS.cyan,
        }),
        txt(`Marked pixel   ${decimal(image[TOP_PIXEL])}`, -540, 192, 32, COSMOS.cyan, 'mono'),
        // Right working or mystery plate
        txt(
          rightTitle,
          540,
          -356,
          36,
          isWrongRev ? COSMOS.rose : isRepairRev ? COSMOS.emerald : COSMOS.gold,
          'serif',
        ),
        rightPixels
          ? pixelGrid(rightPixels, {
              cx: 540,
              cy: -62,
              size: 420,
              selected: TOP_PIXEL,
              frameColor: isWrongRev ? COSMOS.rose : isRepairRev ? COSMOS.emerald : COSMOS.gold,
            })
          : group(
              glassPlate(540, -62, 420, 420, { stroke: COSMOS.rose, glow: 8 }),
              txt('?', 540, -62, 120, COSMOS.muted, 'mono'),
            ),
        txt(
          rightPixels ? `Marked pixel   ${decimal(rightPixels[TOP_PIXEL])}` : 'Marked pixel   ?',
          540,
          192,
          32,
          isWrongRev ? COSMOS.rose : COSMOS.gold,
          'mono',
        ),
        ...midNotes,
        photonWire(
          [
            [-310, 128],
            [-205, 128],
          ],
          drift.value * 2.8,
          { color: COSMOS.cyan, width: 2.5 },
        ),
        photonWire(
          [
            [205, 128],
            [310, 128],
          ],
          drift.value * 2.8 + 0.5,
          { color: COSMOS.gold, width: 2.5 },
        ),
        brightnessRuler({
          cx: 0,
          cy: 342,
          width: 1460,
          left: 0,
          right: 1.75,
          ticks: [0, 0.5, 1, 1.5],
          reference: image[TOP_PIXEL],
          current: rightPixels ? rightPixels[TOP_PIXEL] : null,
        }),
      ).opacity(vis);
    },
  );

  s.add(beat0View, beat13View);
  livingDrift(s, c, drift, 1);

  cueTo(s, c, 'loss-residuals', resP, 1, { dur: 1.2 });
  cueTo(s, c, 'loss-mean', mseRev, 1, { after: true, dur: 0.25 });

  c.onBeat(1, () => s.play(pairMode.to(1, { duration: 0.45 })));
  pulseCue(s, c, 'target-rotation', phase, 0.2, { dur: 0.4 });
  c.onBeat(2, () => s.play(phase.to(1, { duration: 0.25 })));
  cueTo(s, c, 'target-failure', phase, 2, { after: true, dur: 0.35 });
  cueTo(s, c, 'target-convert', phase, 3, { after: true, dur: 0.45 });
}

// ---------------------------------------------------------------------------
// 8. reverse: Sampling turns a prediction into an update
// Cues: reverse-sampler, reverse-sample, df-reverse-0,
//       reverse-ddpm-update, reverse-final-noise, df-reverse-1,
//       reverse-time, reverse-layers, reverse-depth-time, df-reverse-2
// ---------------------------------------------------------------------------
export function reverse(s, c) {
  const stepP = s.value(0.05);
  const showEq = s.value(0);
  const finalZero = s.value(0);
  const layersPulse = s.value(0);
  const timeHighlight = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: COSMOS.cyan, opacity: 0.46 }));
  s.add(aura(-560, -40, 420, '#2a588a24', '#151e3d12'));
  s.add(aura(180, -40, 460, '#5ce1e622', '#17203d12'));

  const ddpmEq = glowTex(String.raw`x_{t-1} = \mu_\theta(x_t, t) + \sigma_t z`, {
    x: 185,
    y: 295,
    size: 46,
    color: COSMOS.gold,
    glow: 8,
  });

  const liveLoop = dynamic(() => {
    const p = Math.max(0.02, Math.min(1, stepP.value));
    const stepNum = Math.max(1, Math.round(50 * (1 - p)));
    const alphaBar = 0.06 + 0.94 * p;
    const zeroFade = 1 - finalZero.value;
    const lGlow = layersPulse.value;
    const tGlow = timeHighlight.value;
    const ph = drift.value;

    const layerNodes = [];
    for (let i = 0; i < 5; i++) {
      const lx = -175 + i * 56;
      const lit = 0.55 + 0.45 * Math.sin(ph * 18 - i * 0.9);
      layerNodes.push(
        rect(34, 130, {
          fill: lGlow > 0.3 ? '#ffd16638' : '#5ce1e628',
          stroke: lGlow > 0.3 ? COSMOS.gold : COSMOS.cyan,
          width: 2.2,
          radius: 6,
        })
          .at(lx, -70)
          .opacity(0.45 + 0.55 * lit),
      );
    }

    return group(
      // Left persistent state tile
      txt('EVOLVING STATE x_t', -590, -345, 28, COSMOS.cyan, 'mono'),
      pixelGrid(exposure(alphaBar), {
        cx: -590,
        cy: -70,
        size: 400,
        selected: TOP_PIXEL,
        frameColor: COSMOS.cyan,
      }),
      txt(
        `t = ${stepNum}  /  50`,
        -590,
        180,
        38,
        tGlow > 0.3 ? COSMOS.gold : COSMOS.cyan,
        'mono',
      ).glow(tGlow > 0.3 ? 12 : 6, tGlow > 0.3 ? COSMOS.gold : COSMOS.cyan),
      txt('current state becomes next input', -590, 232, 26, COSMOS.muted, 'sans'),

      // Center Denoiser module showing all layers active per step
      glassPlate(-63, -70, 340, 260, {
        stroke: lGlow > 0.3 ? COSMOS.gold : COSMOS.cyan,
        glow: 10,
      }),
      txt('DENOISER', -63, -242, 30, COSMOS.cyan, 'mono'),
      ...layerNodes,
      txt(
        'All layers run each step',
        -63,
        98,
        26,
        lGlow > 0.3 ? COSMOS.gold : COSMOS.muted,
        'sans',
      ),

      // Timestep injection arrow
      photonWire(
        [
          [-63, -345],
          [-63, -274],
        ],
        ph * 3.2,
        { color: COSMOS.gold, width: 3 },
      ),
      txt(`timestep t = ${stepNum}`, -63, -378, 28, COSMOS.gold, 'mono'),

      // Right Sampler / Scheduler module
      glassPlate(520, -70, 380, 260, { stroke: COSMOS.violet, glow: 10 }),
      txt('SCHEDULER', 520, -242, 30, COSMOS.violet, 'mono'),
      txt('Predicted noise  ε̂', 520, -124, 28, COSMOS.cyan, 'sans'),
      txt('↓  mean μ_θ', 520, -68, 30, COSMOS.ink, 'mono'),
      txt(
        zeroFade > 0.2 ? '+ fresh Gaussian σ_t z' : 'final step:  σ₁ z = 0',
        520,
        -6,
        28,
        zeroFade > 0.2 ? COSMOS.gold : COSMOS.emerald,
        'mono',
      ).glow(8, zeroFade > 0.2 ? COSMOS.gold : COSMOS.emerald),

      // Routed loop wires
      photonWire(
        [
          [-385, -70],
          [-238, -70],
        ],
        ph * 3.6,
        { color: COSMOS.cyan, width: 3.5 },
      ),
      photonWire(
        [
          [112, -70],
          [325, -70],
        ],
        ph * 3.6 + 0.33,
        { color: COSMOS.violet, width: 3.5 },
      ),
      photonWire(
        [
          [520, 64],
          [520, 190],
          [-365, 190],
          [-365, 80],
        ],
        ph * 2.5,
        { color: COSMOS.gold, width: 3.5 },
      ),
      txt('next state x_{t−1}', 185, 154, 26, COSMOS.gold, 'mono'),
      txt('Network depth and sampling time are separate', 185, 376, 28, COSMOS.muted, 'sans'),
    );
  });

  s.add(liveLoop);
  livingDrift(s, c, drift, 1);

  cueTo(s, c, 'reverse-sampler', stepP, 0.45, { dur: 1.8 });
  cueTo(s, c, 'reverse-sample', stepP, 0.72, { dur: 1.8 });
  pulseCue(s, c, 'df-reverse-0', showEq, 0.05, { dur: 0.3 });

  c.show('reverse-ddpm-update', ddpmEq);
  cueTo(s, c, 'reverse-final-noise', finalZero, 1, { dur: 1.1 });
  cueTo(s, c, 'df-reverse-1', stepP, 0.92, { dur: 1.8 });

  cueTo(s, c, 'reverse-time', timeHighlight, 1, { dur: 0.6 });
  cueTo(s, c, 'reverse-layers', layersPulse, 1, { dur: 0.7 });
  cueTo(s, c, 'reverse-depth-time', stepP, 1.0, { dur: 1.2 });
  pulseCue(s, c, 'df-reverse-2', showEq, 1, { dur: 0.3 });
}

// ---------------------------------------------------------------------------
// 9. reverse-trace: Each completed state becomes the next step input
// Cues: df-reverse-trace-0, df-trace-first, df-reverse-trace-1,
//       df-trace-second, df-trace-final, df-reverse-trace-2, df-trace-resume
// ---------------------------------------------------------------------------
export function reverseTrace(s, c) {
  const row1Rev = s.value(0);
  const row2Rev = s.value(0);
  const row3Rev = s.value(0);
  const forkMode = s.value(0);
  const resumeRev = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: COSMOS.cyan, opacity: 0.45 }));
  s.add(aura(-380, 0, 440, '#2a588a22', '#151e3d12'));
  s.add(aura(400, 0, 440, '#a78bfa20', '#17203d12'));

  const meanEq = glowTex(
    String.raw`\mu_t = \frac{1}{\sqrt{\alpha_t}}\!\left(x_t - \frac{\beta_t}{\sqrt{1-\bar\alpha_t}}\hat\epsilon_t\right)`,
    { x: 0, y: 342, size: 38, color: COSMOS.gold, glow: 6 },
  );

  // Beats 0 & 1: 3-row live scalar trace + trajectory curve
  const traceView = guardedDynamic(
    () => fadeOut(forkMode.value),
    (vis) => {
      const r1 = row1Rev.value > 0.5;
      const r2 = row2Rev.value > 0.5;
      const r3 = row3Rev.value > 0.5;
      const revFlags = [r1, r2, r3];

      const cols = [-745, -520, -245, 50, 330, 635];
      const headers = ['Step', 'Input x', 'Pred ε̂', 'Mean μ', 'Draw z', 'Next x'];
      const nodes = [
        txt('EXACT 3-STEP SCALAR DDPM TRACE', 0, -372, 30, COSMOS.cyan, 'mono'),
        ...headers.map((h, i) => txt(h, cols[i], -290, 28, COSMOS.muted, 'mono')),
        line([-820, -252], [820, -252], { stroke: '#3a4f7c', width: 2 }),
      ];

      SCALAR_TRACE.rows.forEach((row, i) => {
        const y = -182 + i * 116;
        const hasInput = i === 0 || revFlags[i - 1];
        const done = revFlags[i];
        const stroke = done ? COSMOS.cyan : hasInput ? COSMOS.gold : '#2d3c61';
        nodes.push(
          glassPlate(0, y, 1650, 88, { stroke, glow: done ? 6 : 2 }),
          txt(`t = ${row.step}`, cols[0], y, 30, COSMOS.ink, 'mono'),
          txt(hasInput ? decimal(row.input) : '?', cols[1], y, 30, COSMOS.cyan, 'mono'),
          txt(hasInput ? decimal(row.prediction) : '?', cols[2], y, 30, COSMOS.muted, 'mono'),
          txt(hasInput ? decimal(row.mean) : '?', cols[3], y, 30, COSMOS.ink, 'mono'),
          txt(
            hasInput ? decimal(row.draw) : '?',
            cols[4],
            y,
            30,
            row.draw < 0 ? COSMOS.rose : row.draw > 0 ? COSMOS.emerald : COSMOS.muted,
            'mono',
          ),
          txt(
            done ? decimal(row.next) : '?',
            cols[5],
            y,
            34,
            done ? COSMOS.gold : COSMOS.muted,
            'mono',
          ).glow(done ? 8 : 0, COSMOS.gold),
        );
      });

      // Live scalar state sparkline below the table
      const sx = (idx) => -540 + idx * 360;
      const sy = (val) => 228 - (val - 1.08) * 520;
      const trajPts = [
        [sx(0), sy(1.25)],
        ...(r1 ? [[sx(1), sy(SCALAR_TRACE.rows[0].next)]] : []),
        ...(r2 ? [[sx(2), sy(SCALAR_TRACE.rows[1].next)]] : []),
        ...(r3 ? [[sx(3), sy(SCALAR_TRACE.final)]] : []),
      ];
      if (trajPts.length > 1) {
        nodes.push(new Node(polyPath(trajPts)).stroke(COSMOS.gold, 4.5, 0.92).glow(8, COSMOS.gold));
      }
      trajPts.forEach((pt, idx) => {
        nodes.push(
          dot(9, idx === trajPts.length - 1 ? COSMOS.gold : COSMOS.cyan)
            .at(pt[0], pt[1])
            .glow(10, COSMOS.gold),
        );
      });

      return group(...nodes).opacity(vis);
    },
  );

  // Beat 2: Diverging resume trajectory (Restored RNG vs Reset Seed)
  const forkView = guardedDynamic(
    () => fadeIn(forkMode.value),
    (vis) => {
      const rev = resumeRev.value > 0.5;
      const savedX = -590;
      const savedY = -20;
      const okX = 300;
      const okY = -170;
      const badX = 300;
      const badY = 170;

      return group(
        txt('MID-SAMPLE RESTART  ·  RNG STATE MATTERS', 0, -372, 32, COSMOS.gold, 'mono'),
        glassPlate(savedX, savedY, 440, 175, { stroke: COSMOS.cyan, glow: 8 }),
        txt('SAVED AFTER STEP 2', savedX, savedY - 40, 26, COSMOS.muted, 'mono'),
        txt(`x = ${SCALAR_TRACE.saved.toFixed(6)}`, savedX, savedY + 12, 34, COSMOS.cyan, 'mono'),
        txt('next step: t = 1', savedX, savedY + 56, 26, COSMOS.ink, 'mono'),

        // Upper branch: Restored generator
        photonWire(
          [
            [savedX + 224, savedY - 22],
            [okX - 245, okY],
          ],
          drift.value * 2.6,
          { color: COSMOS.emerald, width: 4 },
        ),
        glassPlate(okX, okY, 480, 195, { stroke: COSMOS.emerald, glow: 10 }),
        txt('RESTORE RNG STATE', okX, okY - 56, 28, COSMOS.emerald, 'mono'),
        txt(
          rev ? `next draw = +${SCALAR_TRACE.rows[1].draw.toFixed(6)}` : 'next draw = ?',
          okX,
          okY,
          28,
          COSMOS.ink,
          'mono',
        ),
        txt(
          rev ? `state = ${SCALAR_TRACE.restoredNext.toFixed(6)}` : 'state = ?',
          okX,
          okY + 54,
          34,
          COSMOS.emerald,
          'mono',
        ).glow(rev ? 8 : 0, COSMOS.emerald),

        // Lower branch: Reset seed (repeats draw 0!)
        photonWire(
          [
            [savedX + 224, savedY + 22],
            [badX - 245, badY],
          ],
          drift.value * 2.6 + 0.5,
          { color: COSMOS.rose, width: 4 },
        ),
        glassPlate(badX, badY, 480, 195, { stroke: COSMOS.rose, glow: 10 }),
        txt('RESET ORIGINAL SEED', badX, badY - 56, 28, COSMOS.rose, 'mono'),
        txt(
          `repeats draw 1 = ${decimal(SCALAR_TRACE.rows[0].draw, 6)}`,
          badX,
          badY,
          28,
          COSMOS.ink,
          'mono',
        ),
        txt(
          rev ? `diverges → ${SCALAR_TRACE.resetNext.toFixed(6)}` : 'diverges → ?',
          badX,
          badY + 54,
          34,
          COSMOS.rose,
          'mono',
        ).glow(rev ? 8 : 0, COSMOS.rose),

        txt(
          'Save latent, next timestep, RNG state, and solver history',
          0,
          368,
          30,
          COSMOS.muted,
          'sans',
        ),
      ).opacity(vis);
    },
  );

  s.add(traceView, forkView, meanEq);
  livingDrift(s, c, drift, 1);

  pulseCue(s, c, 'df-reverse-trace-0', row1Rev, 0.1, { dur: 0.3 });
  cueTo(s, c, 'df-trace-first', row1Rev, 1, { after: true, dur: 0.3 });
  pulseCue(s, c, 'df-reverse-trace-1', row2Rev, 0.1, { dur: 0.3 });
  cueTo(s, c, 'df-trace-second', row2Rev, 1, { after: true, dur: 0.3 });
  cueTo(s, c, 'df-trace-final', row3Rev, 1, { after: true, dur: 0.3 });

  c.hide('df-reverse-trace-2', meanEq);
  cueTo(s, c, 'df-reverse-trace-2', forkMode, 1, { dur: 0.45 });
  cueTo(s, c, 'df-trace-resume', resumeRev, 1, { after: true, dur: 0.35 });
}
