// Act 1 (Scenes 1-6): Opening Alert Crop, Hourglass Bottleneck, Basis Decoder,
// Pixel-by-Pixel MSE, Code-Swap Test, Trained AE vs Constant Baseline.
import { dynamic, group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  TRAINED_AE,
  beatTo,
  center,
  cinemaGrid,
  codeSwapFrame,
  cueTo,
  decode,
  decorAura,
  fadeIn,
  fadeOut,
  glowBadge,
  glowBar,
  glowTex,
  guardedDynamic,
  heroTitle,
  livingDrift,
  lower,
  mix,
  mse,
  numCell,
  pixelPatch5x5,
  pixels,
  probeCode,
  recon,
  rule,
  txt,
  z,
} from '../shared.mjs';

// ---------------------------------------------------------------------------
// 1. intro: Which pixel trips the alert?
// Cues: badge-readings, badge-cutoff, badge-answer*, pool-center, pool-lower, badge-code
// ---------------------------------------------------------------------------
export function intro(s, c) {
  const rdP = s.value(0);
  const cutP = s.value(0);
  const ansP = s.value(0);
  const ctrP = s.value(0);
  const lowP = s.value(0);
  const codP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.pixel, seed: 1 }));
  s.add(decorAura(-340, 10, 480, '#5ce1e61e', '#ffd16614'));

  const headline = heroTitle(['Compress 25 Pixels', 'Into Two Numbers'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 64,
    accent: ROLE.pixel,
    eyebrow: '5×5 SCREENSHOT CROP  ·  ALERT CUTOFF > 0.90',
  });

  const live = dynamic(() => {
    const rd = rdP.value;
    const ct = cutP.value;
    const an = ansP.value;
    const ce = ctrP.value;
    const lo = lowP.value;
    const cd = codP.value;
    const nodes = [];

    // Left: 5x5 crop with glowing center/lower regions and alert outline ONLY after badge-answer*
    nodes.push(
      txt('5×5 GRAYSCALE CROP  (25 PIXELS)', -470, -210, 26, ROLE.pixel, 'mono'),
      pixelPatch5x5(pixels, -470, 20, {
        cell: 58,
        gap: 7,
        highlightCenter: ce > 0.2,
        highlightLower: lo > 0.2,
        alertCut: an > 0.2 ? 0.9 : null,
      }),
      txt(
        an > 0.2
          ? 'Center 2×2: [0.85, 0.88, 0.90, 0.92]  →  only 0.92 > 0.90'
          : ct > 0.2
            ? 'Center 2×2: [0.85, 0.88, 0.90, 0.92]  |  Alert > 0.90?'
            : 'Bright 2×2 center badge + faint 2-pixel lower strip',
        -470,
        245,
        26,
        an > 0.2 ? ROLE.warn : COSMOS.muted,
        'mono',
      ),
    );

    // Right: Alert count & 2-number latent code
    const rx = 400;
    nodes.push(
      txt('ALERT CHECK  (PIXEL > 0.90)', rx, -210, 26, ROLE.warn, 'mono'),
      glowBadge(
        an > 0.2 ? '1 PIXEL: 0.92' : '? PIXELS > 0.90',
        rx,
        -120,
        an > 0.2 ? ROLE.warn : COSMOS.dim,
        { w: 340, h: 64, size: 30 },
      ),
      rule(rx - 300, -35, rx + 300, -35, '#2a3759', 2.2),
      txt('2-NUMBER LATENT CODE  z', rx, 25, 26, ROLE.code, 'mono'),
      txt('z₁ (center)', rx - 155, 90, 26, ROLE.code, 'mono'),
      numCell(ce > 0.2 || cd > 0.2 ? z[0].toFixed(4) : '?', rx - 155, 165, {
        w: 210,
        h: 72,
        size: 32,
        stroke: ce > 0.2 ? ROLE.code : '#2b3b60',
        textColor: ce > 0.2 ? ROLE.code : COSMOS.dim,
        glow: ce > 0.2 ? 10 : 0,
      }),
      txt('z₂ (lower)', rx + 155, 90, 26, ROLE.post, 'mono'),
      numCell(lo > 0.2 || cd > 0.2 ? z[1].toFixed(3) : '?', rx + 155, 165, {
        w: 210,
        h: 72,
        size: 32,
        stroke: lo > 0.2 ? ROLE.post : '#2b3b60',
        textColor: lo > 0.2 ? ROLE.post : COSMOS.dim,
        glow: lo > 0.2 ? 10 : 0,
      }),
      txt(
        cd > 0.2
          ? 'Can two averages rebuild the badge, and preserve the > 0.90 alert?'
          : 'Only pixels strictly above 0.90 trip the screenshot alert',
        0,
        335,
        30,
        cd > 0.2 ? ROLE.code : COSMOS.ink,
        'serif',
      ),
    );

    return group(...nodes);
  });

  s.add(headline, live);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'badge-readings', rdP, 1, { dur: 0.65 });
  cueTo(s, c, 'badge-cutoff', cutP, 1, { dur: 0.65 });
  cueTo(s, c, 'badge-answer', ansP, 1, { dur: 0.7, after: true });
  cueTo(s, c, 'pool-center', ctrP, 1, { dur: 0.75 });
  cueTo(s, c, 'pool-lower', lowP, 1, { dur: 0.75 });
  cueTo(s, c, 'badge-code', codP, 1, { dur: 0.7 });
}

// ---------------------------------------------------------------------------
// 2. bottleneck: Two averages remember regions
// Cues: center-add, center-mean, lower-add, badge-decode, pixel-exchange,
//       candidate-code, equal-code, same-reconstruction
// ---------------------------------------------------------------------------
export function bottleneck(s, c) {
  const caP = s.value(0);
  const cmP = s.value(0);
  const laP = s.value(0);
  const decP = s.value(0);
  const exP = s.value(0);
  const ccP = s.value(0);
  const eqP = s.value(0);
  const smP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.code, seed: 2 }));
  s.add(decorAura(0, 10, 560, '#ffd1661a', '#5ce1e614'));

  const headline = heroTitle(['Hourglass Bottleneck:', 'Equal Averages Collide'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 64,
    accent: ROLE.code,
    eyebrow: 'ENCODER  25 → 2  ·  DECODER  2 → 25',
  });

  const live = dynamic(() => {
    const ca = caP.value;
    const cm = cmP.value;
    const la = laP.value;
    const dc = decP.value;
    const ex = exP.value;
    const eq = eqP.value;
    const sm = smP.value;

    const curPix = [...pixels];
    curPix[6] = mix(pixels[6], pixels[12], ex);
    curPix[12] = mix(pixels[12], pixels[6], ex);

    const nodes = [];
    // Left: Input patch (swaps 0.85 <-> 0.92 on pixel-exchange)
    nodes.push(
      txt(
        ex > 0.4 ? 'SWAPPED INPUT (0.92 ↔ 0.85)' : 'INPUT CROP  x',
        -610,
        -210,
        26,
        ROLE.pixel,
        'mono',
      ),
      pixelPatch5x5(curPix, -610, 10, {
        cell: 52,
        gap: 6,
        highlightCenter: ca > 0.2,
        highlightLower: la > 0.2,
      }),
      txt(
        ex > 0.4
          ? 'Swapped corners: still sum = 3.55'
          : ca > 0.2
            ? '0.85 + 0.88 + 0.90 + 0.92 = 3.55'
            : '25 input intensities',
        -610,
        220,
        26,
        ex > 0.4 ? ROLE.warn : COSMOS.muted,
        'mono',
      ),
    );

    // Center: 2D bottleneck code
    nodes.push(
      txt('BOTTLENECK  z', 0, -210, 26, ROLE.code, 'mono'),
      line([-430, 10], [-145, 10], { stroke: ROLE.code, width: 3.5 }).glow(8, ROLE.code),
      numCell(cm > 0.2 ? `z₁ = ${z[0].toFixed(4)}` : 'z₁ = ?', 0, -60, {
        w: 270,
        h: 70,
        size: 30,
        stroke: ROLE.code,
        textColor: ROLE.code,
        glow: eq > 0.2 ? 14 : 8,
      }),
      numCell(la > 0.2 ? `z₂ = ${z[1].toFixed(3)}` : 'z₂ = ?', 0, 80, {
        w: 270,
        h: 70,
        size: 30,
        stroke: ROLE.post,
        textColor: ROLE.post,
        glow: la > 0.2 ? 10 : 0,
      }),
      txt(
        eq > 0.2 ? 'IDENTICAL CODE!' : cm > 0.2 ? '3.55 / 4 = 0.8875' : 'Averaging discards order',
        0,
        180,
        26,
        eq > 0.2 ? ROLE.warn : COSMOS.muted,
        'mono',
      ),
      line([145, 10], [430, 10], { stroke: dc > 0.2 ? ROLE.good : '#3b4e78', width: 3.5 }),
    );

    // Right: Reconstructed patch
    nodes.push(
      txt('RECONSTRUCTION  x̂', 610, -210, 26, ROLE.good, 'mono'),
      pixelPatch5x5(dc > 0.2 ? recon : Array(25).fill(0.12), 610, 10, {
        cell: 52,
        gap: 6,
        highlightCenter: sm > 0.2,
        opacity: mix(0.45, 1, dc),
      }),
      txt(
        sm > 0.2
          ? 'Exact same output from deterministic g(z)!'
          : dc > 0.2
            ? 'Two basis maps repaint all 25 pixels'
            : 'Awaiting decoder g(z)...',
        610,
        220,
        26,
        sm > 0.2 ? ROLE.warn : COSMOS.muted,
        'mono',
      ),
      txt(
        sm > 0.2
          ? 'Permuting center pixels leaves their average unchanged: the bottleneck erases spatial order!'
          : '25 pixels shrink to 2 averages, then expand back to 25 pixels',
        0,
        325,
        29,
        sm > 0.2 ? ROLE.warn : COSMOS.ink,
        'serif',
      ),
    );

    return group(...nodes);
  });

  s.add(headline, live);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'center-add', caP, 1, { dur: 0.7 });
  cueTo(s, c, 'center-mean', cmP, 1, { dur: 0.7 });
  cueTo(s, c, 'lower-add', laP, 1, { dur: 0.7 });
  cueTo(s, c, 'badge-decode', decP, 1, { dur: 0.8 });
  cueTo(s, c, 'pixel-exchange', exP, 1, { dur: 0.9 });
  cueTo(s, c, 'candidate-code', ccP, 1, { dur: 0.65 });
  cueTo(s, c, 'equal-code', eqP, 1, { dur: 0.65 });
  cueTo(s, c, 'same-reconstruction', smP, 1, { dur: 0.7 });
}

// ---------------------------------------------------------------------------
// 3. decoder-pixel: Paint the badge from two numbers
// Cues: paint-center, show-center, flag-four*, paint-neighbor, show-neighbor, error-gain
// ---------------------------------------------------------------------------
export function decoderPixel(s, c) {
  const pcP = s.value(0);
  const scP = s.value(0);
  const flP = s.value(0);
  const pnP = s.value(0);
  const snP = s.value(0);
  const egP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.code, seed: 3 }));
  s.add(decorAura(-260, 10, 480, '#ffd1661c', '#5ce1e614'));

  const headline = heroTitle(['Linear Basis Decoder:', 'Center Paint & Bleed'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 64,
    accent: ROLE.code,
    eyebrow: 'x̂ = clip(z · W_dec + 0.08, 0, 1)',
  });

  const live = dynamic(() => {
    const pc = pcP.value;
    const sc = scP.value;
    const fl = flP.value;
    const pn = pnP.value;
    const sn = snP.value;
    const eg = egP.value;

    // Build progressive decoded crop: base 0.08 -> +center -> +neighbors/lower
    const partial = pixels.map((_, i) => {
      let v = 0.08;
      if (center.includes(i)) v += z[0] * pc;
      if ([5, 8, 10, 13].includes(i)) v += 0.12 * z[0] * pn;
      if (lower.includes(i)) v += z[1] * pn;
      if ([15, 18, 21, 22].includes(i)) v += 0.35 * z[1] * pn;
      return Math.min(1, v);
    });

    const nodes = [];
    nodes.push(
      txt('DECODED 5×5 CROP  x̂', -490, -210, 26, ROLE.code, 'mono'),
      pixelPatch5x5(partial, -490, 15, {
        cell: 58,
        gap: 7,
        highlightCenter: pc > 0.2 && fl < 0.2,
        alertCut: fl > 0.2 ? 0.9 : null,
      }),
      txt(
        fl > 0.2
          ? 'All 4 center pixels hit 0.9675 (> 0.90)!'
          : sc > 0.2
            ? 'Center pixel = 0.08 + 0.8875 = 0.9675'
            : 'Background floor = 0.08',
        -490,
        245,
        26,
        fl > 0.2 ? ROLE.warn : COSMOS.muted,
        'mono',
      ),
    );

    const rx = 380;
    nodes.push(
      txt('DECODER ARITHMETIC', rx, -210, 26, ROLE.pixel, 'mono'),
      numCell(sc > 0.2 ? '0.08 + 0.8875 = 0.968' : '0.08 + 1.0 · z₁ = ?', rx, -110, {
        w: 440,
        h: 66,
        size: 28,
        stroke: ROLE.code,
        textColor: ROLE.code,
        glow: sc > 0.2 ? 10 : 0,
      }),
      glowBadge(
        fl > 0.2 ? '4 PIXELS > 0.90 (VS 1 REAL!)' : 'HOW MANY > 0.90?',
        rx,
        -15,
        fl > 0.2 ? ROLE.warn : COSMOS.dim,
        { w: 460, h: 60, size: 26 },
      ),
      numCell(sn > 0.2 ? '0.08 + 0.12(0.8875) = 0.187' : 'Neighbor bleed: +0.12 · z₁', rx, 85, {
        w: 460,
        h: 66,
        size: 26,
        stroke: pn > 0.2 ? ROLE.good : '#2b3b60',
        textColor: pn > 0.2 ? ROLE.good : COSMOS.muted,
      }),
      txt(
        eg > 0.2
          ? 'Adding soft neighbor bleed cuts MSE down to 0.0027!'
          : 'Basis templates reconstruct smooth blobs, not exact single-pixel spikes',
        0,
        325,
        29,
        eg > 0.2 ? ROLE.good : COSMOS.ink,
        'serif',
      ),
    );

    return group(...nodes);
  });

  s.add(headline, live);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'paint-center', pcP, 1, { dur: 0.75 });
  cueTo(s, c, 'show-center', scP, 1, { dur: 0.65 });
  cueTo(s, c, 'flag-four', flP, 1, { dur: 0.7, after: true });
  cueTo(s, c, 'paint-neighbor', pnP, 1, { dur: 0.8 });
  cueTo(s, c, 'show-neighbor', snP, 1, { dur: 0.65 });
  cueTo(s, c, 'error-gain', egP, 1, { dur: 0.7 });
}

// ---------------------------------------------------------------------------
// 4. reconstruction: Build the error one pixel at a time
// Cues: pixel-subtract, pixel-square, error-sum, error-mean
// ---------------------------------------------------------------------------
export function reconstruction(s, c) {
  const subP = s.value(0);
  const sqP = s.value(0);
  const sumP = s.value(0);
  const mnP = s.value(0);
  const drift = s.value(0);

  const d6 = pixels[6] - recon[6]; // -0.1175
  const e6 = d6 * d6; // 0.013806
  const sumErr = recon.reduce((a, v, i) => a + (v - pixels[i]) ** 2, 0);

  s.add(cinemaGrid({ accent: ROLE.pixel, seed: 4 }));
  s.add(decorAura(0, 20, 540, '#5ce1e61a', '#ffd16614'));

  const headline = heroTitle(['Mean Squared Error', 'One Pixel at a Time'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 64,
    accent: ROLE.pixel,
    eyebrow: 'MSE = (1 / 25) Σ (xᵢ − x̂ᵢ)²',
  });

  const live = dynamic(() => {
    const sb = subP.value;
    const sq = sqP.value;
    const sm = sumP.value;
    const mn = mnP.value;
    const nodes = [];

    // Left: Side-by-side original & decoded patches with selected pixel #6 highlighted
    nodes.push(
      txt('ORIGINAL  x', -615, -210, 26, ROLE.pixel, 'mono'),
      pixelPatch5x5(pixels, -615, -25, { cell: 42, gap: 5, selectedIdx: 6 }),
      txt('DECODED  x̂', -255, -210, 26, ROLE.code, 'mono'),
      pixelPatch5x5(recon, -255, -25, { cell: 42, gap: 5, selectedIdx: 6 }),
      txt('Selected pixel (1,1):  0.85  vs  0.9675', -435, 165, 26, ROLE.code, 'mono'),
    );

    // Right: Step-by-step error accumulation
    const rx = 400;
    nodes.push(
      txt('RESIDUAL → SQUARE → SUM → MEAN', rx, -210, 26, ROLE.good, 'mono'),
      numCell(sb > 0.2 ? `0.85 − 0.9675 = ${d6.toFixed(4)}` : 'x₆ − x̂₆ = ?', rx, -110, {
        w: 440,
        h: 64,
        size: 27,
        stroke: sb > 0.2 ? ROLE.pixel : '#2b3b60',
        textColor: sb > 0.2 ? ROLE.pixel : COSMOS.dim,
      }),
      numCell(sq > 0.2 ? `(−0.1175)² = ${e6.toFixed(4)}` : '(x₆ − x̂₆)² = ?', rx, -15, {
        w: 440,
        h: 64,
        size: 27,
        stroke: sq > 0.2 ? ROLE.code : '#2b3b60',
        textColor: sq > 0.2 ? ROLE.code : COSMOS.dim,
      }),
      numCell(sm > 0.2 ? `Σ 25 pixels = ${sumErr.toFixed(4)}` : 'Sum over 25 pixels = ?', rx, 80, {
        w: 440,
        h: 64,
        size: 27,
        stroke: sm > 0.2 ? ROLE.post : '#2b3b60',
        textColor: sm > 0.2 ? ROLE.post : COSMOS.dim,
      }),
      numCell(mn > 0.2 ? `MSE = ${mse.toFixed(4)}` : 'MSE = Sum / 25 = ?', rx, 180, {
        w: 440,
        h: 72,
        size: 32,
        stroke: mn > 0.2 ? ROLE.good : '#2b3b60',
        textColor: mn > 0.2 ? ROLE.good : COSMOS.dim,
        glow: mn > 0.2 ? 12 : 0,
      }),
      txt(
        mn > 0.2
          ? 'MSE averages error across all 25 pixels: tiny overall, yet alert thresholds can still drift!'
          : 'Subtract, square, sum all 25 residuals, and divide by 25',
        0,
        325,
        29,
        mn > 0.2 ? ROLE.good : COSMOS.ink,
        'serif',
      ),
    );

    return group(...nodes);
  });

  s.add(headline, live);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'pixel-subtract', subP, 1, { dur: 0.7 });
  cueTo(s, c, 'pixel-square', sqP, 1, { dur: 0.7 });
  cueTo(s, c, 'error-sum', sumP, 1, { dur: 0.85 });
  cueTo(s, c, 'error-mean', mnP, 1, { dur: 0.75 });
}

// ---------------------------------------------------------------------------
// 5. code-test: Change the message, then inspect the picture
// Cues: probe-crop, code-swap, swapped-decode, swap-error
// ---------------------------------------------------------------------------
export function codeTest(s, c) {
  const prP = s.value(0);
  const swP = s.value(0);
  const sdP = s.value(0);
  const erP = s.value(0);
  const drift = s.value(0);

  const swap = codeSwapFrame();

  s.add(cinemaGrid({ accent: ROLE.good, seed: 5 }));
  s.add(decorAura(0, 10, 540, '#6ee7b71a', '#ffd16614'));

  const headline = heroTitle(['Code-Swap Diagnostic:', 'Does the Decoder Listen?'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 64,
    accent: ROLE.good,
    eyebrow: 'SWAP z = [0.888, 0.170]  →  z′ = [0.170, 0.888]',
  });

  const live = dynamic(() => {
    const sw = swP.value;
    const sd = sdP.value;
    const er = erP.value;
    const curZ = [mix(z[0], probeCode[0], sw), mix(z[1], probeCode[1], sw)];
    const curImg = decode(curZ);
    const nodes = [];

    // Left: Own reconstruction
    nodes.push(
      txt('OWN CODE  [0.888, 0.170]', -580, -210, 26, ROLE.pixel, 'mono'),
      pixelPatch5x5(swap.originalOutput, -580, -10, { cell: 48, gap: 6, highlightCenter: true }),
      txt(`Own MSE = ${swap.originalMSE.toFixed(4)}`, -580, 195, 28, ROLE.good, 'mono'),
    );

    // Middle: Live code cells flipping
    nodes.push(
      txt('ACTIVE CODE  z', 0, -185, 26, ROLE.code, 'mono'),
      numCell(`z₁ = ${curZ[0].toFixed(3)}`, 0, -65, {
        w: 240,
        h: 68,
        size: 30,
        stroke: sw > 0.3 ? ROLE.warn : ROLE.code,
        textColor: sw > 0.3 ? ROLE.warn : ROLE.code,
        glow: 9,
      }),
      numCell(`z₂ = ${curZ[1].toFixed(3)}`, 0, 55, {
        w: 240,
        h: 68,
        size: 30,
        stroke: sw > 0.3 ? ROLE.good : ROLE.post,
        textColor: sw > 0.3 ? ROLE.good : ROLE.post,
        glow: 9,
      }),
      txt(
        sw > 0.4 ? 'SWAPPED!' : 'ORIGINAL',
        0,
        155,
        26,
        sw > 0.4 ? ROLE.warn : COSMOS.muted,
        'mono',
      ),
    );

    // Right: Decoded result from swapped code
    nodes.push(
      txt('DECODED FROM z′', 580, -210, 26, ROLE.warn, 'mono'),
      pixelPatch5x5(sd > 0.2 ? curImg : swap.originalOutput, 580, -10, {
        cell: 48,
        gap: 6,
        highlightLower: sd > 0.3,
        opacity: mix(0.45, 1, Math.max(sw, sd)),
      }),
      txt(
        er > 0.2 ? `Swapped MSE = ${swap.changedMSE.toFixed(4)}` : 'Swapped MSE = ?',
        580,
        195,
        28,
        er > 0.2 ? ROLE.warn : COSMOS.dim,
        'mono',
      ),
      txt(
        er > 0.2
          ? `MSE jumps ${Math.round(swap.changedMSE / swap.originalMSE)}× (${swap.originalMSE.toFixed(4)} → ${swap.changedMSE.toFixed(4)}): the decoder reads both coordinates!`
          : 'A real latent code must visibly change the picture when swapped',
        0,
        320,
        29,
        er > 0.2 ? ROLE.good : COSMOS.ink,
        'serif',
      ),
    );

    return group(...nodes);
  });

  s.add(headline, live);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'probe-crop', prP, 1, { dur: 0.65 });
  cueTo(s, c, 'code-swap', swP, 1, { dur: 0.9 });
  cueTo(s, c, 'swapped-decode', sdP, 1, { dur: 0.8 });
  cueTo(s, c, 'swap-error', erP, 1, { dur: 0.7 });
}

// ---------------------------------------------------------------------------
// 6. training-baseline: Compare a learned bottleneck with the constant baseline
// Cues: vae-training-baseline-0-build, vae-training-baseline-1-build,
//       vae-training-baseline-trained, vae-training-baseline-constant,
//       vae-training-baseline-2-build
// ---------------------------------------------------------------------------
export function trainingBaseline(s, c) {
  const b0P = s.value(0);
  const b1P = s.value(0);
  const trP = s.value(0);
  const coP = s.value(0);
  const b2P = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.warn, seed: 6 }));
  s.add(decorAura(0, 10, 560, '#ff6b8b1a', '#5ce1e614'));

  const headline = heroTitle(['Trained AE vs', 'Constant-Mean Baseline'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 64,
    accent: ROLE.warn,
    eyebrow: '48 NOISY COPIES OF ONE TEMPLATE  ·  MSE 0.0006 VS 0.0006',
  });

  const live = dynamic(() => {
    const tr = trP.value;
    const co = coP.value;
    const b2 = b2P.value;
    const nodes = [];

    // Left: 2 sample noisy crops + constant mean crop
    nodes.push(
      txt('NOISY COPY #1', -660, -205, 26, ROLE.pixel, 'mono'),
      pixelPatch5x5(TRAINED_AE.rows[0], -660, -35, { cell: 38, gap: 4 }),
      txt('CONSTANT MEAN', -320, -205, 26, ROLE.code, 'mono'),
      pixelPatch5x5(TRAINED_AE.mean, -320, -35, { cell: 38, gap: 4 }),
      txt('All 48 crops share one template + small noise', -490, 145, 26, COSMOS.muted, 'mono'),
    );

    // Right: MSE bar comparison
    const bx = 90;
    const scale = 2800; // 0.1537 -> clipped, show log-feel normalized bars for before/after/baseline
    nodes.push(
      txt('RECONSTRUCTION MSE COMPARISON', bx, -205, 26, ROLE.warn, 'mono', 'left'),

      txt('Untrained AE', bx, -110, 28, COSMOS.muted, 'mono', 'left'),
      glowBar(bx + 250, -110, 320, 34, '#475569', { glow: 4 }),
      txt(TRAINED_AE.before.toFixed(4), bx + 610, -110, 28, COSMOS.muted, 'mono', 'left'),

      txt('Trained AE', bx, -10, 28, ROLE.good, 'mono', 'left'),
      glowBar(bx + 250, -10, mix(320, 32, tr), 34, ROLE.good, { glow: 10 }),
      txt(
        tr > 0.2 ? TRAINED_AE.after.toFixed(4) : '?',
        bx + 610,
        -10,
        28,
        ROLE.good,
        'mono',
        'left',
      ),

      txt('Constant Mean', bx, 90, 28, ROLE.warn, 'mono', 'left'),
      glowBar(bx + 250, 90, 34, 34, ROLE.warn, { glow: 10 }).opacity(mix(0.45, 1, co)),
      txt(
        co > 0.2 ? TRAINED_AE.baseline.toFixed(4) : '?',
        bx + 610,
        90,
        28,
        ROLE.warn,
        'mono',
        'left',
      ),

      glowBadge(
        b2 > 0.2 ? 'TIE! LOW MSE ≠ USEFUL CODE' : 'CHECK AGAINST BASELINE',
        440,
        200,
        b2 > 0.2 ? ROLE.warn : COSMOS.dim,
        { w: 500, h: 60, size: 26 },
      ),
      txt(
        b2 > 0.2
          ? 'Always beat the constant-mean baseline AND verify code swaps change the output!'
          : 'Can a constant predictor match a trained 2D autoencoder on single-template data?',
        0,
        325,
        29,
        b2 > 0.2 ? ROLE.warn : COSMOS.ink,
        'serif',
      ),
    );

    return group(...nodes);
  });

  s.add(headline, live);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'vae-training-baseline-0-build', b0P, 1, { dur: 0.65 });
  cueTo(s, c, 'vae-training-baseline-1-build', b1P, 1, { dur: 0.65 });
  cueTo(s, c, 'vae-training-baseline-trained', trP, 1, { dur: 0.85 });
  cueTo(s, c, 'vae-training-baseline-constant', coP, 1, { dur: 0.75 });
  cueTo(s, c, 'vae-training-baseline-2-build', b2P, 1, { dur: 0.75 });
}
