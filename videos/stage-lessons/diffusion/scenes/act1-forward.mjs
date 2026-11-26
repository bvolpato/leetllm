// Act 1: The Tabletop Pixel Study, Forward Corruption, Unit-Circle Coefficients,
// Multiplicative Schedule, and Known-Noise Training.
import { Node, arrow, circle, dot, dynamic, group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  TOP_JUMP,
  TOP_PIXEL,
  aura,
  blend,
  brightnessRuler,
  cinemaGrid,
  cueTo,
  decimal,
  exposure,
  fadeIn,
  fadeOut,
  forwardValue,
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
  safeDur,
  txt,
} from '../shared.mjs';

// ---------------------------------------------------------------------------
// 1. intro: Can a sampler bring this pixel back?
// Cues: table-clear, table-edge, table-first-exposure, table-save,
//       table-second-exposure, table-question, table-return*
// ---------------------------------------------------------------------------
export function intro(s, c) {
  const clearP = s.value(0);
  const edgePulse = s.value(0);
  const splitMode = s.value(0); // 0 = hero beat 0, 1 = side-by-side pair
  const firstP = s.value(0);
  const savedP = s.value(0);
  const secondP = s.value(0);
  const askP = s.value(0);
  const returnP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: COSMOS.cyan, opacity: 0.45 }));
  s.add(aura(-360, -20, 480, '#2a588a2c', '#18274a14'));
  s.add(aura(400, -20, 480, '#ffd16622', '#26305212'));

  // Beat 0: Large emerging tabletop + glowing live brightness & retained-variance gauge
  const beat0View = guardedDynamic(
    () => fadeOut(splitMode.value),
    (vis) => {
      const p = clearP.value;
      const alpha = 0.36 + (1 - 0.36) * p;
      const pixels = exposure(alpha);
      const val = pixels[TOP_PIXEL];
      const barW = 540;
      const fillW = Math.max(12, barW * alpha);
      const ringScale = 1 + 0.15 * Math.sin(drift.value * Math.PI * 6) * edgePulse.value;

      return group(
        pixelGrid(pixels, {
          cx: -360,
          cy: -10,
          size: 590,
          selected: TOP_PIXEL,
          frameColor: COSMOS.cyan,
          markColor: COSMOS.gold,
        }),
        edgePulse.value > 0.05
          ? circle(34 * ringScale, { fill: null, stroke: COSMOS.gold, width: 3.2 })
              .at(-360 - 590 / 2 + 6 + (3.5 * 578) / 16, -10 - 590 / 2 + 6 + (5.5 * 578) / 16)
              .glow(12, COSMOS.gold)
              .opacity(0.8 * edgePulse.value)
          : group(),
        txt('TABLETOP PIXEL STUDY', 100, -250, 26, COSMOS.cyan, 'mono', 'left'),
        txt('Marked Pixel Brightness', 100, -182, 46, COSMOS.ink, 'serif', 'left'),
        txt(decimal(val, 3), 100, -64, 118, COSMOS.gold, 'mono', 'left').glow(12, COSMOS.gold),
        txt('Retained signal variance  ᾱ', 100, 68, 30, COSMOS.muted, 'sans', 'left'),
        rect(barW, 18, { fill: '#17213a', stroke: '#344774', width: 1.5, radius: 9 }).at(
          100 + barW / 2,
          122,
        ),
        rect(fillW, 18, { fill: COSMOS.cyan, stroke: null, radius: 9 })
          .at(100 + fillW / 2, 122)
          .glow(10, COSMOS.cyan),
        txt(`${Math.round(alpha * 100)}%`, 100 + barW + 28, 122, 36, COSMOS.cyan, 'mono', 'left'),
        txt('Clean tabletop pixel = 1.000', 100, 206, 28, COSMOS.muted, 'mono', 'left'),
      ).opacity(vis);
    },
  );

  // Beats 1-3: Left reference exposure vs Right working copy + glowing brightness ruler
  const pairView = guardedDynamic(
    () => fadeIn(splitMode.value),
    (vis) => {
      const f = firstP.value;
      const sv = savedP.value > 0.5;
      const sec = secondP.value;
      const ret = returnP.value;
      const landed = ret >= 0.98;
      const asking = askP.value > 0.5 && !landed;

      const alpha = 1 - 0.1 * f - 0.4 * sec;
      const leftPixels = sv ? TOP_JUMP.reference : image;
      const rightPixels =
        ret > 0 ? blend(TOP_JUMP.input, TOP_JUMP.destination, ret) : exposure(alpha);

      const leftTitle = sv ? 'Saved exposure' : 'Clean reference';
      const leftSub = sv ? 'Retained variance  0.90' : '16 × 16 pixels';
      const rightTitle = ret > 0 ? 'Sampler output' : 'Working copy';
      const rightSub = ret > 0 ? 'Jump  0.50 → 0.90' : `Retained variance  ${alpha.toFixed(2)}`;

      const midLines = landed
        ? [
            txt('Exact match', 0, -110, 38, COSMOS.emerald, 'serif').glow(8, COSMOS.emerald),
            txt('Same noise field', 0, -48, 28, COSMOS.muted, 'sans'),
            txt('0.822 = 0.822', 0, 14, 34, COSMOS.gold, 'mono'),
          ]
        : asking
          ? [
              txt('Return to 0.90', 0, -115, 34, COSMOS.cyan, 'mono'),
              txt('No fresh noise draw', 0, -55, 26, COSMOS.muted, 'sans'),
              txt('Which reading?', 0, 20, 42, COSMOS.gold, 'serif').glow(10, COSMOS.gold),
            ]
          : [
              txt('Known pixel noise', 0, -108, 28, COSMOS.muted, 'sans'),
              txt('ε = −0.400', 0, -44, 42, COSMOS.gold, 'mono').glow(8, COSMOS.gold),
              txt('Fixed noise field', 0, 22, 28, COSMOS.cyan, 'sans'),
            ];

      return group(
        // Left exposure
        txt(leftTitle, -540, -372, 38, COSMOS.cyan, 'serif').glow(5, COSMOS.cyan),
        txt(leftSub, -540, -322, 26, COSMOS.muted, 'mono'),
        pixelGrid(leftPixels, {
          cx: -540,
          cy: -64,
          size: 420,
          selected: TOP_PIXEL,
          frameColor: COSMOS.cyan,
          markColor: COSMOS.gold,
        }),
        txt(`Marked pixel   ${decimal(leftPixels[TOP_PIXEL])}`, -540, 194, 32, COSMOS.cyan, 'mono'),
        // Right exposure
        txt(rightTitle, 540, -372, 38, COSMOS.gold, 'serif').glow(5, COSMOS.gold),
        txt(rightSub, 540, -322, 26, COSMOS.muted, 'mono'),
        pixelGrid(rightPixels, {
          cx: 540,
          cy: -64,
          size: 420,
          selected: TOP_PIXEL,
          frameColor: COSMOS.gold,
          markColor: COSMOS.gold,
        }),
        txt(`Marked pixel   ${decimal(rightPixels[TOP_PIXEL])}`, 540, 194, 32, COSMOS.gold, 'mono'),
        // Center bridge notes
        ...midLines,
        // Subtle animated connecting pulse wave between left and right (well clear of center text)
        photonWire(
          [
            [-310, 128],
            [-195, 128],
          ],
          drift.value * 3,
          { color: COSMOS.cyan, width: 2.4, glow: 5 },
        ),
        photonWire(
          [
            [195, 128],
            [310, 128],
          ],
          drift.value * 3 + 0.5,
          { color: COSMOS.gold, width: 2.4, glow: 5 },
        ),
        // Bottom brightness ruler
        brightnessRuler({
          cx: 0,
          cy: 342,
          width: 1460,
          left: -1,
          right: 1.25,
          ticks: [-1, -0.5, 0, 0.5, 1],
          reference: leftPixels[TOP_PIXEL],
          current: rightPixels[TOP_PIXEL],
        }),
      ).opacity(vis);
    },
  );

  s.add(beat0View, pairView);

  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'table-clear', clearP, 1, { dur: 2.0 });
  pulseCue(s, c, 'table-edge', edgePulse, 1, { dur: 0.6 });

  c.onBeat(1, () => s.play(splitMode.to(1, { duration: 0.45 })));
  cueTo(s, c, 'table-first-exposure', firstP, 1, { dur: 1.4 });
  cueTo(s, c, 'table-save', savedP, 1, { after: true, dur: 0.35 });
  cueTo(s, c, 'table-second-exposure', secondP, 1, { dur: 1.4 });
  pulseCue(s, c, 'table-question', askP, 1, { dur: 0.35 });

  // Strict prediction withholding: yellow dot stays at 0.424 until the spoken reveal finishes!
  cueTo(s, c, 'table-return', returnP, 1, { after: true, dur: 0.75 });
}

// ---------------------------------------------------------------------------
// 2. forward: Follow the edge into the noise
// Cues: forward-add-noise, forward-edges-fade, df-forward-0,
//       forward-sweep, forward-retained-signal, df-forward-1,
//       forward-beat-3-focus-1, forward-beat-3-focus-2, df-forward-2
// ---------------------------------------------------------------------------
export function forward(s, c) {
  const noiseLevel = s.value(0); // 0 -> 0.88 in beat 0, sweeps in beat 1
  const showBatch = s.value(0);
  const pulse = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: COSMOS.cyan, opacity: 0.48 }));
  s.add(aura(-430, 0, 500, '#2a588a28', '#151e3d12'));
  s.add(aura(420, 0, 500, '#a78bfa22', '#171f3b12'));

  const batchLevels = [0.92, 0.55, 0.18, 0.03];

  const liveStage = dynamic(() => {
    const t = Math.max(0, Math.min(0.98, noiseLevel.value));
    const alphaBar = Math.max(0.02, 1 - t);
    const sigAmp = Math.sqrt(alphaBar);
    const noiseAmp = Math.sqrt(1 - alphaBar);
    const pixels = exposure(alphaBar);
    const val = pixels[TOP_PIXEL];
    const bVis = showBatch.value;
    const barW = 560;

    const nodes = [
      txt('FORWARD CORRUPTION', -440, -378, 26, COSMOS.cyan, 'mono'),
      pixelGrid(pixels, {
        cx: -440,
        cy: -24,
        size: 560,
        selected: TOP_PIXEL,
        frameColor: alphaBar > 0.35 ? COSMOS.cyan : COSMOS.violet,
        markColor: COSMOS.gold,
      }),
      txt(
        `ᾱ = ${alphaBar.toFixed(2)}   ·   pixel = ${decimal(val)}`,
        -440,
        304,
        32,
        COSMOS.gold,
        'mono',
      ).glow(6, COSMOS.gold),
      txt('Fixed noise draw ε = −0.400', -440, 358, 26, COSMOS.muted, 'mono'),
    ];

    const oldOp = fadeOut(bVis);
    if (oldOp > 0.02) {
      nodes.push(
        group(
          txt('SIGNAL AMPLITUDE', 70, -290, 26, COSMOS.cyan, 'mono', 'left'),
          txt(`√ᾱ = ${sigAmp.toFixed(3)}`, 630, -290, 32, COSMOS.cyan, 'mono', 'right'),
          rect(barW, 24, { fill: '#151f38', stroke: '#2c3d66', width: 1.5, radius: 12 }).at(
            70 + barW / 2,
            -232,
          ),
          rect(Math.max(12, barW * sigAmp), 24, { fill: COSMOS.cyan, stroke: null, radius: 12 })
            .at(70 + Math.max(12, barW * sigAmp) / 2, -232)
            .glow(10, COSMOS.cyan),
          txt('NOISE AMPLITUDE', 70, -132, 26, COSMOS.gold, 'mono', 'left'),
          txt(`√(1 − ᾱ) = ${noiseAmp.toFixed(3)}`, 630, -132, 32, COSMOS.gold, 'mono', 'right'),
          rect(barW, 24, { fill: '#151f38', stroke: '#2c3d66', width: 1.5, radius: 12 }).at(
            70 + barW / 2,
            -74,
          ),
          rect(Math.max(12, barW * noiseAmp), 24, { fill: COSMOS.gold, stroke: null, radius: 12 })
            .at(70 + Math.max(12, barW * noiseAmp) / 2, -74)
            .glow(10, COSMOS.gold),
          // Energy conservation ring readout
          txt('TOTAL VARIANCE CONSERVED', 70, 36, 26, COSMOS.muted, 'mono', 'left'),
          txt(
            `ᾱ + (1 − ᾱ) = ${alphaBar.toFixed(2)} + ${(1 - alphaBar).toFixed(2)} = 1.00`,
            70,
            92,
            30,
            COSMOS.emerald,
            'mono',
            'left',
          ),
          // Live wave visualization of signal vs noise amplitude
          ...(() => {
            const ptsS = [];
            const ptsN = [];
            for (let i = 0; i <= 40; i++) {
              const u = i / 40;
              const wx = 70 + u * barW;
              const wyS = 228 + Math.sin(u * Math.PI * 4 + drift.value * 8) * 48 * sigAmp;
              const wyN =
                228 +
                Math.sin(u * Math.PI * 19 + drift.value * 14) *
                  Math.cos(u * Math.PI * 7) *
                  52 *
                  noiseAmp;
              ptsS.push([wx, wyS]);
              ptsN.push([wx, wyN]);
            }
            return [
              line([70, 228], [70 + barW, 228], { stroke: '#2a3a5e', width: 1.4 }),
              new Node(polyPath(ptsS)).stroke(COSMOS.cyan, 3.2, 0.85).glow(6, COSMOS.cyan),
              new Node(polyPath(ptsN)).stroke(COSMOS.gold, 2.2, 0.78).glow(5, COSMOS.gold),
            ];
          })(),
          txt('Marginal comparison across noise levels', 70, 336, 26, COSMOS.muted, 'sans', 'left'),
        ).opacity(oldOp),
      );
    }

    const newOp = fadeIn(bVis);
    if (newOp > 0.02) {
      const op = newOp;
      const batchNodes = [
        txt('DIRECT JUMP TO ANY NOISE LEVEL', 385, -378, 26, COSMOS.gold, 'mono'),
        txt(
          'One training batch mixes light noise and near-static',
          385,
          344,
          28,
          COSMOS.ink,
          'sans',
        ),
      ];
      batchLevels.forEach((lvl, idx) => {
        const col = idx % 2;
        const row = Math.floor(idx / 2);
        const cx = 195 + col * 370;
        const cy = -155 + row * 310;
        const pulseGlow = 1 + 0.05 * Math.sin(drift.value * 12 + idx * 1.6);
        batchNodes.push(
          pixelGrid(exposure(lvl), {
            cx,
            cy,
            size: 215 * pulseGlow,
            selected: TOP_PIXEL,
            frameColor: lvl > 0.4 ? COSMOS.cyan : COSMOS.violet,
            markColor: COSMOS.gold,
          }),
          txt(`ᾱ = ${lvl.toFixed(2)}`, cx, cy + 136, 26, COSMOS.gold, 'mono'),
        );
      });
      nodes.push(group(...batchNodes).opacity(op));
    }

    return group(...nodes);
  });

  s.add(liveStage);

  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'forward-add-noise', noiseLevel, 0.52, { dur: 2.2 });
  cueTo(s, c, 'forward-edges-fade', noiseLevel, 0.88, { dur: 2.2 });
  pulseCue(s, c, 'df-forward-0', pulse, 0.3, { dur: 0.3 });

  cueTo(s, c, 'forward-retained-signal', noiseLevel, 0.22, { dur: 1.8 });
  cueTo(s, c, 'forward-sweep', noiseLevel, 0.78, { dur: 2.0 });
  pulseCue(s, c, 'df-forward-1', pulse, 0.6, { dur: 0.3 });

  cueTo(s, c, 'forward-beat-3-focus-1', showBatch, 1, { dur: 0.65 });
  cueTo(s, c, 'forward-beat-3-focus-2', noiseLevel, 0.94, { dur: 1.6 });
  pulseCue(s, c, 'df-forward-2', pulse, 1, { dur: 0.3 });
}

// ---------------------------------------------------------------------------
// 3. coefficients: Two coefficients control the mixture
// Cues: coefficients-mixture, coefficients-amplitude, df-coefficients-0,
//       coefficients-halfway, coefficients-cancellation, df-coefficients-1,
//       coefficients-unit-variance, coefficients-snr, df-coefficients-2
// ---------------------------------------------------------------------------
export function coefficients(s, c) {
  const alphaVal = s.value(0.95);
  const cancelP = s.value(0);
  const showUnit = s.value(0);
  const showSnr = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: COSMOS.cyan, opacity: 0.45 }));
  s.add(aura(-460, 40, 440, '#2a588a28', '#151e3d12'));
  s.add(aura(380, -30, 460, '#ffd1661f', '#18244a12'));

  const mixEq = glowTex(
    String.raw`x_t = \sqrt{\bar\alpha_t}\,x_0 + \sqrt{1-\bar\alpha_t}\,\epsilon`,
    { x: 340, y: -335, size: 48, color: COSMOS.gold, glow: 8 },
  );
  const inputsEq = glowTex(String.raw`x_0 = 1, \qquad \epsilon = -0.4`, {
    x: 340,
    y: -242,
    size: 38,
    color: COSMOS.muted,
    glow: 0,
  });
  const unitEq = glowTex(String.raw`a^2 + b^2 = \bar\alpha_t + (1 - \bar\alpha_t) = 1`, {
    x: -445,
    y: 356,
    size: 34,
    color: COSMOS.emerald,
    glow: 6,
  });

  // Precompute quarter unit circle arc
  const cx = -635;
  const cy = 225;
  const R = 365;
  const arcPts = Array.from({ length: 73 }, (_, i) => {
    const th = (i / 72) * (Math.PI / 2);
    return [cx + R * Math.cos(th), cy - R * Math.sin(th)];
  });

  const liveGeometry = dynamic(() => {
    const alpha = Math.max(0.05, Math.min(0.99, alphaVal.value));
    const a = Math.sqrt(alpha);
    const b = Math.sqrt(1 - alpha);
    const px = cx + R * a;
    const py = cy - R * b;
    const cp = cancelP.value;
    const total = a - 0.4 * b * cp;
    const snr = alpha / (1 - alpha);

    // Number line on right
    const nlLeft = -45;
    const nlRight = 765;
    const nlY = 75;
    const mapV = (v) => nlLeft + ((v + 0.5) / 1.5) * (nlRight - nlLeft);
    const xZero = mapV(0);
    const xSig = mapV(a);
    const xTot = mapV(total);

    const pulseR = 12 + 2.5 * Math.sin(drift.value * Math.PI * 10);

    const nodes = [
      // Quarter circle axes and glowing arc
      new Node(polyPath(arcPts)).stroke('#6178aa', 3.2, 0.72),
      line([cx, cy], [cx + R + 32, cy], { stroke: '#4d6089', width: 2.2 }),
      line([cx, cy], [cx, cy - R - 32], { stroke: '#4d6089', width: 2.2 }),
      // Signal leg (cyan) and noise leg (gold)
      line([cx, cy], [px, cy], { stroke: COSMOS.cyan, width: 7.5 }).glow(10, COSMOS.cyan),
      line([px, cy], [px, py], { stroke: COSMOS.gold, width: 7.5 }).glow(10, COSMOS.gold),
      // Unit radius hypotenuse
      line([cx, cy], [px, py], { stroke: COSMOS.ink, width: 3.2 }),
      dot(pulseR, COSMOS.ink).at(px, py).glow(14, COSMOS.cyan),
      txt(`a = √ᾱ = ${a.toFixed(3)}`, cx + R * 0.52, cy + 48, 28, COSMOS.cyan, 'mono'),
      txt(`b = √(1−ᾱ) = ${b.toFixed(3)}`, cx + 10, cy - R - 54, 28, COSMOS.gold, 'mono', 'left'),
      txt('r = 1', (cx + px) / 2 - 42, (cy + py) / 2 - 22, 26, COSMOS.muted, 'mono'),
      // Number line axis
      line([nlLeft, nlY], [nlRight, nlY], { stroke: '#60749f', width: 3.2 }),
      ...[-0.5, 0, 0.5, 1.0].flatMap((tk) => [
        line([mapV(tk), nlY - 11], [mapV(tk), nlY + 13], { stroke: '#7f93bd', width: 2.4 }),
        txt(tk.toFixed(1).replace('-', '−'), mapV(tk), nlY + 46, 26, COSMOS.muted, 'mono'),
      ]),
      // Positive signal arrow
      arrow([xZero, nlY - 102], [xSig, nlY - 102], {
        stroke: COSMOS.cyan,
        width: 6.5,
        tip: 16,
      }).glow(10, COSMOS.cyan),
      txt(`+a·x₀ = +${a.toFixed(3)}`, (xZero + xSig) / 2, nlY - 144, 28, COSMOS.cyan, 'mono'),
      // Negative noise arrow when cancellation starts
      cp > 0.02
        ? arrow([xSig, nlY - 48], [xTot, nlY - 48], {
            stroke: COSMOS.gold,
            width: 6.5,
            tip: 16,
          }).glow(10, COSMOS.gold)
        : group(),
      cp > 0.05
        ? txt(
            `b·ε = ${(cp * -0.4 * b).toFixed(3).replace('-', '−')}`,
            (xSig + xTot) / 2,
            nlY - 76,
            26,
            COSMOS.gold,
            'mono',
          )
        : group(),
      // Live result orb on number line
      line([xTot, nlY - 42], [xTot, nlY], { stroke: COSMOS.ink, width: 2, dash: [5, 5] }),
      dot(12, COSMOS.ink).at(xTot, nlY).glow(14, COSMOS.gold),
      txt(
        cp < 0.98 ? `partial = ${decimal(total)}` : `x_t ≈ ${decimal(total)}`,
        340,
        214,
        46,
        COSMOS.ink,
        'mono',
      ).glow(8, COSMOS.gold),
      // SNR readout
      showSnr.value > 0.05
        ? txt(`SNR(t) = ᾱ / (1 − ᾱ) = ${snr.toFixed(2)}`, 340, 326, 34, COSMOS.cyan, 'mono')
            .glow(8, COSMOS.cyan)
            .opacity(showSnr.value)
        : group(),
    ];

    return group(...nodes);
  });

  s.add(liveGeometry, inputsEq);
  livingDrift(s, c, drift, 1);

  c.show('coefficients-mixture', mixEq);
  cueTo(s, c, 'coefficients-amplitude', alphaVal, 0.72, { dur: 1.8 });
  pulseCue(s, c, 'df-coefficients-0', showUnit, 0.01, { dur: 0.2 });

  cueTo(s, c, 'coefficients-halfway', alphaVal, 0.5, { dur: 1.2 });
  cueTo(s, c, 'coefficients-cancellation', cancelP, 1, { dur: 1.5 });
  pulseCue(s, c, 'df-coefficients-1', showSnr, 0.01, { dur: 0.2 });

  c.show('coefficients-unit-variance', unitEq);
  cueTo(s, c, 'coefficients-snr', showSnr, 1, { dur: 0.65 });
  pulseCue(s, c, 'df-coefficients-2', showUnit, 1, { dur: 0.35 });
}

// ---------------------------------------------------------------------------
// 4. forward-schedule: The product of retained fractions sets the noise level
// Cues: df-forward-schedule-0, df-forward-schedule-1, df-schedule-product,
//       df-forward-schedule-2, df-schedule-values
// ---------------------------------------------------------------------------
export function forwardSchedule(s, c) {
  const mode = s.value(0); // 0 = beat 0, 1 = beat 1, 2 = beat 2
  const prodRev = s.value(0);
  const valRev = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: COSMOS.blue, opacity: 0.45 }));
  s.add(aura(-360, -20, 480, '#2a588a24', '#151e3d12'));
  s.add(aura(400, 40, 480, '#5ce1e622', '#17203d12'));

  const prodEq = glowTex(String.raw`\bar\alpha_t = \prod_{s=1}^{t} (1 - \beta_s)`, {
    x: 0,
    y: -365,
    size: 50,
    color: COSMOS.gold,
    glow: 8,
  });

  const snrEq = glowTex(String.raw`\mathrm{SNR}(t) = \frac{\bar\alpha_t}{1 - \bar\alpha_t}`, {
    x: 0,
    y: 368,
    size: 42,
    color: COSMOS.cyan,
    glow: 6,
  });

  // Precompute 1000-step DDPM linear schedule curve beta in [1e-4, 0.02]
  const linearCurve = [];
  let ab = 1;
  for (let step = 0; step <= 1000; step++) {
    if (step > 0) {
      const beta = 0.0001 + ((0.02 - 0.0001) * (step - 1)) / 999;
      ab *= 1 - beta;
    }
    if (step % 20 === 0) linearCurve.push([step / 1000, ab]);
  }

  const betas = [0.02, 0.03, 0.04];
  const alphas = betas.map((b) => 1 - b);
  const product3 = alphas.reduce((p, a) => p * a, 1);

  const stageRows = [
    { alphaBar: 0.9, label: '0.900' },
    { alphaBar: 0.5, label: '0.500' },
    { alphaBar: 0.001, label: '0.001' },
  ].map((row) => ({
    ...row,
    sig: Math.sqrt(row.alphaBar),
    noise: -0.4 * Math.sqrt(1 - row.alphaBar),
    state: forwardValue(1, -0.4, row.alphaBar),
    snr: row.alphaBar / (1 - row.alphaBar),
  }));

  const view = dynamic(() => {
    const m = mode.value;
    const pRev = prodRev.value > 0.5;
    const vRev = valRev.value > 0.5;

    if (m < 1.5) {
      // Beats 0 & 1: Multiplicative chain on left/top + 1000-step decay curve on bottom/right
      const chainNodes = [];
      betas.forEach((b, i) => {
        const cx = -570 + i * 330;
        const cy = -135;
        chainNodes.push(
          glassPlate(cx, cy, 260, 150, { stroke: COSMOS.cyan, glow: 6 }),
          txt(`step ${i + 1}`, cx, cy - 44, 26, COSMOS.muted, 'mono'),
          txt(`β = ${b.toFixed(2)}`, cx, cy, 28, COSMOS.rose, 'mono'),
          txt(`α = ${alphas[i].toFixed(2)}`, cx, cy + 42, 32, COSMOS.cyan, 'mono'),
        );
        if (i < 2) {
          chainNodes.push(
            txt('×', cx + 165, cy, 40, COSMOS.gold, 'mono'),
            photonWire(
              [
                [cx + 132, cy + 44],
                [cx + 198, cy + 44],
              ],
              drift.value * 3 + i * 0.33,
              { color: COSMOS.gold, width: 2.5 },
            ),
          );
        }
      });

      const resCx = 530;
      const resCy = -135;
      chainNodes.push(
        txt('=', 285, resCy, 44, COSMOS.gold, 'mono'),
        glassPlate(resCx, resCy, 400, 150, {
          stroke: pRev ? COSMOS.gold : COSMOS.muted,
          glow: pRev ? 10 : 3,
        }),
        txt('3-STEP RETAINED ᾱ₃', resCx, resCy - 38, 26, COSMOS.muted, 'mono'),
        txt(
          pRev ? product3.toFixed(6) : '0.98 × 0.97 × 0.96',
          resCx,
          resCy + 24,
          pRev ? 46 : 30,
          COSMOS.gold,
          'mono',
        ).glow(pRev ? 10 : 0, COSMOS.gold),
      );

      // Lower wide 1000-step decay curve
      const gx0 = -720;
      const gx1 = 720;
      const gy0 = 280;
      const gy1 = 42;
      const pts = linearCurve.map(([u, v]) => [gx0 + u * (gx1 - gx0), gy0 - v * (gy0 - gy1)]);
      const dotU = (drift.value * 1.4) % 1;
      const idx = Math.min(pts.length - 1, Math.floor(dotU * (pts.length - 1)));
      const dp = pts[idx];

      chainNodes.push(
        line([gx0, gy0], [gx1, gy0], { stroke: '#4d6089', width: 2.4 }),
        line([gx0, gy0], [gx0, gy1 - 16], { stroke: '#4d6089', width: 2.4 }),
        new Node(polyPath(pts)).stroke(COSMOS.cyan, 4.2, 0.92).glow(8, COSMOS.cyan),
        dot(8, COSMOS.gold).at(dp[0], dp[1]).glow(14, COSMOS.gold),
        txt('1,000-step linear schedule  ᾱ(t)', 120, gy1 - 12, 28, COSMOS.cyan, 'sans', 'center'),
        txt('t = 0  (ᾱ = 1.0)', gx0, gy0 + 40, 26, COSMOS.muted, 'mono', 'left'),
        txt('t = 1,000  (ᾱ ≈ 4.04 × 10⁻⁵)', gx1, gy0 + 40, 26, COSMOS.gold, 'mono', 'right'),
      );

      return group(...chainNodes);
    }

    // Beat 2: Three levels of the same pixel x0=1, eps=-0.4 with live tabletop thumbnails
    const cols = [
      txt('SAME PIXEL x₀ = 1   ·   SAME NOISE DRAW ε = −0.400', 0, -372, 30, COSMOS.cyan, 'mono'),
    ];
    stageRows.forEach((row, i) => {
      const cx = -540 + i * 540;
      const cy = -40;
      const col = i === 0 ? COSMOS.cyan : i === 1 ? COSMOS.gold : COSMOS.violet;
      cols.push(
        txt(`ᾱ = ${row.label}`, cx, -264, 34, col, 'mono').glow(6, col),
        pixelGrid(exposure(row.alphaBar), {
          cx,
          cy,
          size: 300,
          selected: TOP_PIXEL,
          frameColor: col,
          markColor: COSMOS.gold,
        }),
        txt(
          `sig ${decimal(row.sig)}  ·  noise ${decimal(row.noise)}`,
          cx,
          144,
          26,
          COSMOS.muted,
          'mono',
        ),
        txt(
          vRev ? `pixel = ${decimal(row.state)}` : 'pixel = ?',
          cx,
          204,
          38,
          vRev ? COSMOS.gold : COSMOS.muted,
          'mono',
        ).glow(vRev ? 8 : 0, COSMOS.gold),
        txt(
          `SNR = ${row.snr >= 0.1 ? row.snr.toFixed(2) : row.snr.toFixed(4)}`,
          cx,
          260,
          26,
          col,
          'mono',
        ),
      );
      if (i < 2) {
        cols.push(
          photonWire(
            [
              [cx + 175, cy],
              [cx + 365, cy],
            ],
            drift.value * 2.5 + i * 0.4,
            { color: COSMOS.gold, width: 3 },
          ),
        );
      }
    });
    return group(...cols);
  });

  s.add(view, prodEq);
  livingDrift(s, c, drift, 1);

  pulseCue(s, c, 'df-forward-schedule-0', mode, 0.2, { dur: 0.4 });
  cueTo(s, c, 'df-forward-schedule-1', mode, 1, { dur: 0.4 });
  cueTo(s, c, 'df-schedule-product', prodRev, 1, { after: true, dur: 0.3 });

  c.hide('df-forward-schedule-2', prodEq);
  cueTo(s, c, 'df-forward-schedule-2', mode, 2, { dur: 0.45 });
  cueTo(s, c, 'df-schedule-values', valRev, 1, { after: true, dur: 0.35 });
  c.show('df-schedule-values', snrEq);
}

// ---------------------------------------------------------------------------
// 5. training: Training knows the noise it added
// Cues: training-choose-input, training-known-noise, df-training-0,
//       training-network-input, training-comparison, df-training-1,
//       training-errors, training-shared-network, df-training-2
// ---------------------------------------------------------------------------
export function training(s, c) {
  const stepStage = s.value(0);
  const netGlow = s.value(0);
  const errProgress = s.value(0);
  const sharedGlow = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: COSMOS.cyan, opacity: 0.44 }));
  s.add(aura(-580, -40, 400, '#2a588a24', '#151e3d12'));
  s.add(aura(40, -40, 420, '#5ce1e626', '#16203e12'));
  s.add(aura(580, 0, 400, '#ff6b8b20', '#181e3a12'));

  const targets = imageNoise.slice(0, 3);
  const initial = targets.map((t, i) => t + [0.7, -0.55, 0.4][i]);
  const finalOffset = [0.02, -0.02, -0.03];
  const netEq = glowTex(String.raw`\epsilon_\theta(x_t, t)`, {
    x: 40,
    y: -35,
    size: 46,
    color: COSMOS.cyan,
    glow: 8,
  });

  const liveCircuit = dynamic(() => {
    const ph = drift.value;
    const ep = errProgress.value;
    const nG = netGlow.value;
    const sG = sharedGlow.value;

    const nodes = [
      // Clean image & noise tile on far left
      txt('Clean image x₀', -700, -345, 28, COSMOS.cyan, 'mono'),
      pixelGrid(image, {
        cx: -700,
        cy: -185,
        size: 225,
        selected: TOP_PIXEL,
        frameColor: COSMOS.cyan,
      }),
      txt('Known noise ε', -700, 75, 28, COSMOS.gold, 'mono'),
      pixelGrid(imageNoise, {
        cx: -700,
        cy: 220,
        size: 205,
        selected: TOP_PIXEL,
        frameColor: COSMOS.gold,
      }),
      // Noisy input x_t
      txt('Noisy input x_t', -335, -345, 28, COSMOS.cyan, 'mono'),
      pixelGrid(exposure(0.35), {
        cx: -335,
        cy: -185,
        size: 225,
        selected: TOP_PIXEL,
        frameColor: COSMOS.violet,
      }),
      // Mix wires
      photonWire(
        [
          [-580, -185],
          [-455, -185],
        ],
        ph * 3,
        { color: COSMOS.cyan, width: 3 },
      ),
      photonWire(
        [
          [-592, 165],
          [-335, -62],
        ],
        ph * 3 + 0.3,
        { color: COSMOS.gold, width: 3 },
      ),
      // Known noise target wire routing to MSE loss on right
      photonWire(
        [
          [-592, 275],
          [325, 275],
          [325, 130],
          [375, 130],
        ],
        ph * 2.2,
        { color: COSMOS.gold, width: 3.2 },
      ),
      txt('target ε', -160, 244, 26, COSMOS.gold, 'mono'),
      // Denoiser network module
      glassPlate(40, -110, 340, 250, {
        stroke: sG > 0.3 ? COSMOS.gold : COSMOS.cyan,
        strokeWidth: 2.8 + nG * 1.4,
        glow: 10 + nG * 8,
      }),
      txt('DENOISER', 40, -172, 30, COSMOS.cyan, 'mono').glow(6, COSMOS.cyan),
      txt('shared weights θ', 40, -130, 26, sG > 0.3 ? COSMOS.gold : COSMOS.muted, 'sans'),
      // Timestep input
      photonWire(
        [
          [40, 128],
          [40, 24],
        ],
        ph * 3.2,
        { color: COSMOS.gold, width: 3 },
      ),
      txt('timestep t', 40, 162, 28, COSMOS.gold, 'mono'),
      // Wire from noisy input to denoiser and denoiser to loss
      photonWire(
        [
          [-215, -185],
          [-135, -145],
        ],
        ph * 3.1,
        { color: COSMOS.cyan, width: 3.2 },
      ),
      photonWire(
        [
          [215, -110],
          [375, -110],
        ],
        ph * 3.1 + 0.4,
        { color: COSMOS.cyan, width: 3.2 },
      ),
      // MSE residual visualization on right
      glassPlate(605, -20, 440, 580, { stroke: COSMOS.rose, glow: 8 }),
      txt('SQUARED NOISE ERROR', 605, -264, 28, COSMOS.ink, 'mono'),
      txt('coordinates  0 · 1 · 2', 605, -218, 26, COSMOS.gold, 'mono'),
    ];

    let mse = 0;
    for (let i = 0; i < 3; i++) {
      const pred = initial[i] + (targets[i] + finalOffset[i] - initial[i]) * ep;
      const err = pred - targets[i];
      mse += (err * err) / 3;
      const yy = -120 + i * 124;
      const mapV = (v) => 430 + ((v + 1.3) / 2.6) * 350;
      const xT = mapV(targets[i]);
      const xP = mapV(pred);
      const sqSide = Math.max(4, Math.abs(err) * 76);

      nodes.push(
        line([430, yy], [780, yy], { stroke: '#4d6089', width: 2.2 }),
        line([xT, yy], [xP, yy], { stroke: COSMOS.rose, width: 7 }).glow(8, COSMOS.rose),
        rect(sqSide, sqSide, { fill: '#ff6b8b55', stroke: COSMOS.rose, width: 2 }).at(
          Math.min(xT, xP) + sqSide / 2,
          yy + 10 + sqSide / 2,
        ),
        dot(8.5, COSMOS.gold).at(xT, yy).glow(10, COSMOS.gold),
        dot(7.5, COSMOS.cyan).at(xP, yy).glow(10, COSMOS.cyan),
      );
    }

    nodes.push(
      txt(`MSE  ${mse.toFixed(4)}`, 605, 224, 38, COSMOS.gold, 'mono').glow(8, COSMOS.gold),
      txt('Schematic gradient update', 40, 355, 28, COSMOS.muted, 'sans'),
    );

    return group(...nodes);
  });

  s.add(liveCircuit, netEq);
  livingDrift(s, c, drift, 1);

  pulseCue(s, c, 'training-choose-input', stepStage, 0.3, { dur: 0.4 });
  pulseCue(s, c, 'training-known-noise', stepStage, 0.6, { dur: 0.4 });
  pulseCue(s, c, 'df-training-0', stepStage, 0.7, { dur: 0.3 });

  cueTo(s, c, 'training-network-input', netGlow, 1, { dur: 0.6 });
  cueTo(s, c, 'training-comparison', errProgress, 0.25, { dur: 0.8 });
  pulseCue(s, c, 'df-training-1', netGlow, 0.8, { dur: 0.3 });

  cueTo(s, c, 'training-errors', errProgress, 1, { dur: 2.2 });
  cueTo(s, c, 'training-shared-network', sharedGlow, 1, { dur: 0.6 });
  pulseCue(s, c, 'df-training-2', stepStage, 1, { dur: 0.3 });
}
