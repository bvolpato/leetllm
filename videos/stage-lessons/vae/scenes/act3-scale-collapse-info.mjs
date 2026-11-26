// Act 3 (Scenes 14-20): Likelihood Scale & Sum vs Mean, Trained 2-Family VAE Swaps,
// Posterior Collapse, Information Ledger (ELBO Surgery), Collapse Repairs, Free Bits,
// 3D Latent Manifold & Geodesic Interpolation.
import { circle, dynamic, group, line, point3d, rect, surface } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  TRAINED_VAE,
  binaryInformationState,
  cinemaGrid,
  cinematic3d,
  collapseCodes,
  collapseOutputs,
  coordinateSwapStudy,
  cueTo,
  decode,
  decorAura,
  fadeIn,
  fadeOut,
  freeBitsState,
  gaussianPixelLoss,
  glowBadge,
  glowBar,
  glowDot,
  glowTex,
  guardedDynamic,
  heroTitle,
  livingDrift,
  mix,
  numCell,
  orbitScene,
  pixelPatch5x5,
  rule,
  txt,
} from '../shared.mjs';

// ---------------------------------------------------------------------------
// 14. likelihood-scale: What happens if we count the pixels twice?
// Cues: square-four, gaussian-error, gaussian-normalization, gaussian-total,
//       copy-four, double-error*, same-mean*, compare-divisors, change-units,
//       repeat-draw, variance-result
// ---------------------------------------------------------------------------
export function likelihoodScale(s, c) {
  const sqP = s.value(0);
  const geP = s.value(0);
  const gnP = s.value(0);
  const gtP = s.value(0);
  const cpP = s.value(0);
  const dbP = s.value(0);
  const smP = s.value(0);
  const cdP = s.value(0);
  const cuP = s.value(0);
  const rdP = s.value(0);
  const vrP = s.value(0);
  const drift = s.value(0);

  const x4 = [0.1, 0.9, 0.85, 0.12];
  const p4 = [0.12, 0.84, 0.8, 0.14];
  const four = gaussianPixelLoss(x4, p4, 0.25); // error=0.0138, mean=0.001725
  const eight = gaussianPixelLoss([...x4, ...x4], [...p4, ...p4], 0.25); // error=0.0276, mean=0.001725

  s.add(cinemaGrid({ accent: ROLE.code, seed: 14 }));
  s.add(decorAura(0, 15, 560, '#ffd1661a', '#ff6b8b14'));

  const headline = heroTitle(['Gaussian Likelihood Scale:', 'Sum Doubles, Mean Stays'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 64,
    accent: ROLE.code,
    eyebrow: '−log p(x | z) = Σ(xᵢ − x̂ᵢ)² / (2σ²) + CONST  ·  σ² = 0.25',
  });

  const live = dynamic(() => {
    const ge = geP.value;
    const cp = cpP.value;
    const db = dbP.value;
    const sm = smP.value;
    const vr = vrP.value;

    return group(
      // Left: 4 pixels column
      txt('4 PIXELS  (N = 4)', -460, -205, 28, ROLE.pixel, 'mono'),
      numCell(`SSE = ${four.sum.toFixed(4)}`, -460, -105, {
        w: 380,
        h: 64,
        size: 27,
        stroke: ROLE.pixel,
        textColor: ROLE.pixel,
      }),
      numCell(ge > 0.2 ? `Error term = ${four.error.toFixed(4)}` : 'SSE / (2σ²) = ?', -460, -5, {
        w: 380,
        h: 64,
        size: 27,
        stroke: ROLE.code,
        textColor: ROLE.code,
        glow: ge > 0.2 ? 9 : 0,
      }),
      numCell(`Mean MSE = ${four.mean.toFixed(5)}`, -460, 95, {
        w: 380,
        h: 64,
        size: 27,
        stroke: ROLE.good,
        textColor: ROLE.good,
      }),

      // Right: Duplicated 8 pixels column (strictly withheld answers!)
      txt('DUPLICATED 8 PIXELS  (N = 8)', 440, -205, 28, ROLE.warn, 'mono'),
      numCell(
        cp > 0.2 ? `SSE = ${eight.sum.toFixed(4)}  (2×)` : 'Copy all 4 pixels → N = 8',
        440,
        -105,
        {
          w: 440,
          h: 64,
          size: 27,
          stroke: cp > 0.2 ? ROLE.warn : '#2b3b60',
          textColor: cp > 0.2 ? ROLE.warn : COSMOS.dim,
        },
      ),
      numCell(
        db > 0.2 ? `Error term = ${eight.error.toFixed(4)} (2×)` : 'Error term = ?',
        440,
        -5,
        {
          w: 440,
          h: 64,
          size: 27,
          stroke: db > 0.2 ? ROLE.warn : '#2b3b60',
          textColor: db > 0.2 ? ROLE.warn : COSMOS.dim,
          glow: db > 0.2 ? 10 : 0,
        },
      ),
      numCell(sm > 0.2 ? `Mean MSE = ${eight.mean.toFixed(5)} (1×)` : 'Mean MSE = ?', 440, 95, {
        w: 440,
        h: 64,
        size: 27,
        stroke: sm > 0.2 ? ROLE.good : '#2b3b60',
        textColor: sm > 0.2 ? ROLE.good : COSMOS.dim,
        glow: sm > 0.2 ? 10 : 0,
      }),

      txt(
        vr > 0.2
          ? 'Changing pixel count N or observation variance σ² shifts the recon-to-KL balance: recalibrate β!'
          : 'True Gaussian negative log-likelihood SUMS over pixels; averaging divides recon by N',
        0,
        295,
        29,
        vr > 0.2 ? ROLE.code : COSMOS.ink,
        'serif',
      ),
    );
  });

  s.add(headline, live);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'square-four', sqP, 1, { dur: 0.65 });
  cueTo(s, c, 'gaussian-error', geP, 1, { dur: 0.65 });
  cueTo(s, c, 'gaussian-normalization', gnP, 1, { dur: 0.65 });
  cueTo(s, c, 'gaussian-total', gtP, 1, { dur: 0.65 });
  cueTo(s, c, 'copy-four', cpP, 1, { dur: 0.7 });
  cueTo(s, c, 'double-error', dbP, 1, { dur: 0.7, after: true });
  cueTo(s, c, 'same-mean', smP, 1, { dur: 0.7, after: true });
  cueTo(s, c, 'compare-divisors', cdP, 1, { dur: 0.65 });
  cueTo(s, c, 'change-units', cuP, 1, { dur: 0.65 });
  cueTo(s, c, 'repeat-draw', rdP, 1, { dur: 0.65 });
  cueTo(s, c, 'variance-result', vrP, 1, { dur: 0.7 });
}

// ---------------------------------------------------------------------------
// 15. trained-vae: Which number moves the badge?
// Cues: training-families, encoder-heads, sampled-pair, training-loss,
//       matched-means, matched-result, swap-first, first-result*, reset-first,
//       swap-second, second-result*, swap-both, axis-kl, three-priors
// ---------------------------------------------------------------------------
export function trainedVae(s, c) {
  const fmP = s.value(0);
  const ehP = s.value(0);
  const spP = s.value(0);
  const tlP = s.value(0);
  const mmP = s.value(0);
  const mrP = s.value(0);
  const s1P = s.value(0);
  const r1P = s.value(0);
  const rfP = s.value(0);
  const s2P = s.value(0);
  const r2P = s.value(0);
  const sbP = s.value(0);
  const klP = s.value(0);
  const prP = s.value(0);
  const drift = s.value(0);

  const study = coordinateSwapStudy;

  s.add(cinemaGrid({ accent: ROLE.good, seed: 15 }));
  s.add(decorAura(0, 10, 560, '#6ee7b71a', '#5ce1e614'));

  const headline = heroTitle(['Trained 2D VAE:', 'One Active Axis, One Spare'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 64,
    accent: ROLE.good,
    eyebrow: 'HEALTHY β = 0.02  ·  COORDINATE-SWAP INTERVENTION',
  });

  // View 1: Coordinate-swap intervention study
  const view1 = guardedDynamic(
    () => fadeOut(prP.value),
    (vis) => {
      const mr = mrP.value;
      const r1 = r1P.value;
      const s2 = s2P.value;
      const r2 = r2P.value;
      const klv = klP.value;

      const showSwapped = s2 > 0.3;
      const dec0 = showSwapped ? TRAINED_VAE.swappedDecodedRows[0] : TRAINED_VAE.meanDecodedRows[0];
      const dec1 = showSwapped ? TRAINED_VAE.swappedDecodedRows[1] : TRAINED_VAE.meanDecodedRows[1];

      return group(
        txt('FAMILY A (CENTER)', -640, -210, 26, ROLE.pixel, 'mono'),
        pixelPatch5x5(dec0, -640, -35, { cell: 40, gap: 4 }),
        txt('FAMILY B (LOWER)', -310, -210, 26, ROLE.post, 'mono'),
        pixelPatch5x5(dec1, -310, -35, { cell: 40, gap: 4 }),
        txt(
          showSwapped
            ? 'Swapping Axis 2 flips both families!'
            : 'Two distinct crop families trained at β = 0.02',
          -475,
          155,
          26,
          showSwapped ? ROLE.warn : COSMOS.muted,
          'mono',
        ),

        // Right: Swap MSE table (strict withholding on first-result* and second-result*!)
        txt('BATCH MSE BY INTERVENTION', 410, -210, 26, ROLE.good, 'mono'),
        numCell(
          mr > 0.2 ? `Own codes:    ${study.batchMSE.own.toFixed(4)}` : 'Own codes:    ?',
          410,
          -115,
          {
            w: 610,
            h: 62,
            size: 27,
            stroke: ROLE.good,
            textColor: ROLE.good,
          },
        ),
        numCell(
          r1 > 0.2
            ? `Swap Axis 1:  ${study.batchMSE.first.toFixed(4)} (no change!)`
            : 'Swap Axis 1:  ?',
          410,
          -20,
          {
            w: 610,
            h: 62,
            size: 26,
            stroke: r1 > 0.2 ? ROLE.pixel : '#2b3b60',
            textColor: r1 > 0.2 ? ROLE.pixel : COSMOS.dim,
          },
        ),
        numCell(
          r2 > 0.2
            ? `Swap Axis 2:  ${study.batchMSE.second.toFixed(4)} (280×!)`
            : 'Swap Axis 2:  ?',
          410,
          75,
          {
            w: 610,
            h: 62,
            size: 26,
            stroke: r2 > 0.2 ? ROLE.warn : '#2b3b60',
            textColor: r2 > 0.2 ? ROLE.warn : COSMOS.dim,
            glow: r2 > 0.2 ? 10 : 0,
          },
        ),
        numCell(klv > 0.2 ? 'Axis KL: [0.001, 0.761] nats' : 'Per-axis KL diagnostic', 410, 170, {
          w: 610,
          h: 62,
          size: 26,
          stroke: klv > 0.2 ? ROLE.code : '#2b3b60',
          textColor: klv > 0.2 ? ROLE.code : COSMOS.muted,
        }),
        txt(
          klv > 0.2
            ? 'Two families need ~1 bit (ln 2 ≈ 0.693 nats): one axis carries it, the spare stays quiet!'
            : 'Swap one latent coordinate at a time to see which axis controls the badge',
          0,
          320,
          29,
          COSMOS.ink,
          'serif',
        ),
      ).opacity(vis);
    },
  );

  // View 2: Three fresh prior draws decoded from N(0, I)
  const view2 = guardedDynamic(
    () => fadeIn(prP.value),
    (vis) =>
      group(
        txt('THREE FRESH DRAWS FROM PRIOR  z ~ N(0, I)', 0, -210, 28, ROLE.code, 'mono'),
        txt('Prior Draw #1', -520, -145, 26, ROLE.post, 'mono'),
        pixelPatch5x5(TRAINED_VAE.priorDecodedRows[0], -520, 35, { cell: 46, gap: 5 }),
        txt('Lower strip', -520, 215, 26, ROLE.post, 'mono'),

        txt('Prior Draw #2', 0, -145, 26, ROLE.pixel, 'mono'),
        pixelPatch5x5(TRAINED_VAE.priorDecodedRows[1], 0, 35, { cell: 46, gap: 5 }),
        txt('Center badge', 0, 215, 26, ROLE.pixel, 'mono'),

        txt('Prior Draw #3', 520, -145, 26, ROLE.good, 'mono'),
        pixelPatch5x5(TRAINED_VAE.priorDecodedRows[2], 520, 35, { cell: 46, gap: 5 }),
        txt('Center badge', 520, 215, 26, ROLE.good, 'mono'),

        txt(
          'Random draws from N(0, I) now paint crisp, recognizable crops from both families!',
          0,
          325,
          30,
          ROLE.good,
          'serif',
        ),
      ).opacity(vis),
  );

  s.add(headline, view1, view2);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'training-families', fmP, 1, { dur: 0.65 });
  cueTo(s, c, 'encoder-heads', ehP, 1, { dur: 0.65 });
  cueTo(s, c, 'sampled-pair', spP, 1, { dur: 0.65 });
  cueTo(s, c, 'training-loss', tlP, 1, { dur: 0.65 });
  cueTo(s, c, 'matched-means', mmP, 1, { dur: 0.65 });
  cueTo(s, c, 'matched-result', mrP, 1, { dur: 0.65 });
  cueTo(s, c, 'swap-first', s1P, 1, { dur: 0.65 });
  cueTo(s, c, 'first-result', r1P, 1, { dur: 0.7, after: true });
  cueTo(s, c, 'reset-first', rfP, 1, { dur: 0.65 });
  cueTo(s, c, 'swap-second', s2P, 1, { dur: 0.75 });
  cueTo(s, c, 'second-result', r2P, 1, { dur: 0.7, after: true });
  cueTo(s, c, 'swap-both', sbP, 1, { dur: 0.65 });
  cueTo(s, c, 'axis-kl', klP, 1, { dur: 0.7 });
  cueTo(s, c, 'three-priors', prP, 1, { dur: 0.85 });
}

// ---------------------------------------------------------------------------
// 16. collapse: Ask the decoder whether it uses the code
// Cues: decoder-ignore, collapsed-swap
// ---------------------------------------------------------------------------
export function collapse(s, c) {
  const igP = s.value(0);
  const swP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.warn, seed: 16 }));
  s.add(decorAura(0, 15, 560, '#ff6b8b1e', '#ffd16614'));

  const headline = heroTitle(['Posterior Collapse:', 'Same Output for Both Codes'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 64,
    accent: ROLE.warn,
    eyebrow: 'OVER-PENALIZED β = 0.50  ·  KL → 0.0000  ·  OWN MSE = SWAP MSE = 0.0326',
  });

  const live = dynamic(() => {
    const u = swP.value;
    const [outA, outB] = collapseOutputs(u);

    return group(
      txt(
        `CODE A = [${collapseCodes[0][0]}, ${collapseCodes[0][1]}]`,
        -480,
        -210,
        26,
        ROLE.pixel,
        'mono',
      ),
      pixelPatch5x5(outA, -480, 5, { cell: 54, gap: 6 }),
      txt(
        u > 0.8 ? 'Blurry average crop' : 'Distinct center badge',
        -480,
        220,
        26,
        u > 0.8 ? ROLE.warn : ROLE.pixel,
        'mono',
      ),

      glowBadge(
        u > 0.8 ? 'IDENTICAL OUTPUT!' : 'SENSITIVITY FALLING',
        0,
        5,
        u > 0.8 ? ROLE.warn : ROLE.code,
        {
          w: 330,
          h: 64,
          size: 26,
        },
      ),

      txt(
        `CODE B = [${collapseCodes[1][0]}, ${collapseCodes[1][1]}]`,
        480,
        -210,
        26,
        ROLE.post,
        'mono',
      ),
      pixelPatch5x5(outB, 480, 5, { cell: 54, gap: 6 }),
      txt(
        u > 0.8 ? 'Blurry average crop' : 'Distinct lower strip',
        480,
        220,
        26,
        u > 0.8 ? ROLE.warn : ROLE.post,
        'mono',
      ),

      txt(
        u > 0.8
          ? 'At β = 0.50, KL hits 0.000 and swapping codes leaves MSE flat at 0.0326 vs 0.0326!'
          : 'When KL pressure dominates, the decoder ignores z and collapses to the dataset mean',
        0,
        330,
        29,
        u > 0.8 ? ROLE.warn : COSMOS.ink,
        'serif',
      ),
    );
  });

  s.add(headline, live);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'decoder-ignore', igP, 1, { dur: 0.7 });
  cueTo(s, c, 'collapsed-swap', swP, 1, { dur: 1.2 });
}

// ---------------------------------------------------------------------------
// 17. information-ledger: Prior matching can coexist with informative codes
// Cues: vae-information-ledger-0-build, vae-information-ledger-1-build,
//       vae-information-ledger-copy, vae-information-ledger-2-build,
//       vae-information-ledger-noise, vae-information-ledger-uniform
// ---------------------------------------------------------------------------
export function informationLedger(s, c) {
  const b0P = s.value(0);
  const b1P = s.value(0);
  const cpP = s.value(0);
  const b2P = s.value(0);
  const nsP = s.value(0);
  const unP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.pixel, seed: 17 }));
  s.add(decorAura(0, 15, 560, '#5ce1e61a', '#a78bfa14'));

  const headline = heroTitle(['KL Surgery:', 'Mutual Info + Prior Mismatch'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 64,
    accent: ROLE.pixel,
    eyebrow: 'E_x[KL(q(z|x) || p(z))] = I_q(X; Z) + KL(q(z) || p(z))',
  });

  const live = dynamic(() => {
    const prog = Math.max(nsP.value * 0.5, unP.value);
    const st = binaryInformationState(prog);
    const isUnif = unP.value > 0.5;
    const isClean = cpP.value > 0.2 && prog < 0.2;

    return group(
      glowTex(
        '\\mathbb{E}_X D_{\\mathrm{KL}}(q_\\phi(z|X) \\| p(z)) = I_q(X;Z) + D_{\\mathrm{KL}}(q(z) \\| p(z))',
        { x: 0, y: -205, size: 38, color: ROLE.pixel },
      ),
      // Left: 2x2 joint table P(X, Z)
      txt('JOINT TABLE  P(X, Z)', -430, -105, 26, ROLE.code, 'mono'),
      txt('Z = 0', -520, -45, 26, COSMOS.muted, 'mono'),
      txt('Z = 1', -340, -45, 26, COSMOS.muted, 'mono'),
      txt('X = 0', -660, 25, 26, COSMOS.muted, 'mono'),
      txt('X = 1', -660, 115, 26, COSMOS.muted, 'mono'),
      numCell(st.joint[0][0].toFixed(2), -520, 25, {
        w: 155,
        h: 68,
        stroke: ROLE.good,
        textColor: ROLE.good,
      }),
      numCell(st.joint[0][1].toFixed(2), -340, 25, {
        w: 155,
        h: 68,
        stroke: ROLE.warn,
        textColor: ROLE.warn,
      }),
      numCell(st.joint[1][0].toFixed(2), -520, 115, {
        w: 155,
        h: 68,
        stroke: ROLE.warn,
        textColor: ROLE.warn,
      }),
      numCell(st.joint[1][1].toFixed(2), -340, 115, {
        w: 155,
        h: 68,
        stroke: ROLE.good,
        textColor: ROLE.good,
      }),

      // Right: Exact ledger bars
      txt('EXACT DECOMPOSITION', 390, -105, 26, ROLE.good, 'mono'),
      numCell(`Aggregate KL(q(z)||p(z)) = 0.000`, 390, -20, {
        w: 540,
        h: 64,
        size: 26,
        stroke: ROLE.good,
        textColor: ROLE.good,
        glow: 8,
      }),
      numCell(
        isUnif ? 'Mutual Info I(X;Z) = 0.000 nats' : 'Mutual Info I(X;Z) = 0.693 nats',
        390,
        75,
        {
          w: 540,
          h: 64,
          size: 26,
          stroke: isUnif ? ROLE.warn : ROLE.code,
          textColor: isUnif ? ROLE.warn : ROLE.code,
          glow: 9,
        },
      ),
      txt(
        isUnif
          ? 'Driving average KL to 0 wipes out mutual information I(X;Z) = 0!'
          : 'You can match the prior perfectly (aggregate KL = 0) while keeping 1 full bit of useful code!',
        0,
        295,
        29,
        isUnif ? ROLE.warn : ROLE.good,
        'serif',
      ),
    );
  });

  s.add(headline, live);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'vae-information-ledger-0-build', b0P, 1, { dur: 0.65 });
  cueTo(s, c, 'vae-information-ledger-1-build', b1P, 1, { dur: 0.65 });
  cueTo(s, c, 'vae-information-ledger-copy', cpP, 1, { dur: 0.7 });
  cueTo(s, c, 'vae-information-ledger-2-build', b2P, 1, { dur: 0.65 });
  cueTo(s, c, 'vae-information-ledger-noise', nsP, 1, { dur: 0.9 });
  cueTo(s, c, 'vae-information-ledger-uniform', unP, 1, { dur: 0.9 });
}

// ---------------------------------------------------------------------------
// 18. collapse-repairs: Did the code or the history change the picture?
// Cues: history-code, history-bit, history-verdict*, half-influence, anneal-beta, drop-history
// ---------------------------------------------------------------------------
export function collapseRepairs(s, c) {
  const hcP = s.value(0);
  const hbP = s.value(0);
  const hvP = s.value(0);
  const hfP = s.value(0);
  const anP = s.value(0);
  const dhP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.good, seed: 18 }));
  s.add(decorAura(0, 10, 560, '#6ee7b71a', '#a78bfa14'));

  const headline = heroTitle(['Preventing Collapse:', 'Annealing & Context Dropout'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 64,
    accent: ROLE.good,
    eyebrow: 'AUTOREGRESSIVE HISTORY VS LATENT CODE  ·  THREE COLLAPSE LEVERS',
  });

  const live = dynamic(() => {
    const hv = hvP.value;
    const hf = hfP.value;
    const an = anP.value;
    const dh = dhP.value;

    const zShare = mix(0.08, 0.72, Math.max(hf * 0.55, dh));
    const hShare = 1 - zShare;

    return group(
      // Left: Decoder dependence bars (Latent z vs Pixel History)
      txt('WHAT DRIVES THE AUTOREGRESSIVE DECODER?', -420, -205, 26, ROLE.code, 'mono'),
      txt('Pixel History', -790, -100, 28, ROLE.warn, 'mono', 'left'),
      glowBar(-530, -100, hShare * 460, 38, ROLE.warn, { glow: 8 }),
      txt('Latent Code z', -790, 5, 28, ROLE.good, 'mono', 'left'),
      glowBar(-530, 5, zShare * 460, 38, ROLE.good, { glow: 10 }),

      glowBadge(
        hv > 0.2 ? 'HISTORY DOMINATED (CODE IGNORED!)' : 'WHICH INPUT CHANGED OUTPUT?',
        -420,
        130,
        hv > 0.2 ? ROLE.warn : COSMOS.dim,
        { w: 580, h: 62, size: 26 },
      ),

      // Right: Three levers
      txt('THREE PRACTICAL REPAIRS', 430, -205, 26, ROLE.good, 'mono'),
      numCell('1. KL Annealing: ramp β slowly', 430, -105, {
        w: 520,
        h: 66,
        size: 26,
        stroke: an > 0.2 ? ROLE.code : '#2b3b60',
        textColor: an > 0.2 ? ROLE.code : COSMOS.muted,
        glow: an > 0.2 ? 9 : 0,
      }),
      numCell('2. History Dropout: mask context', 430, 0, {
        w: 520,
        h: 66,
        size: 26,
        stroke: dh > 0.2 ? ROLE.good : '#2b3b60',
        textColor: dh > 0.2 ? ROLE.good : COSMOS.muted,
        glow: dh > 0.2 ? 10 : 0,
      }),
      numCell('3. Free Bits: floor group KL ≥ τ', 430, 105, {
        w: 520,
        h: 66,
        size: 26,
        stroke: ROLE.post,
        textColor: ROLE.post,
      }),
      txt(
        dh > 0.2
          ? 'Dropping decoder context forces the network to rely on latent code z again!'
          : 'Powerful autoregressive decoders can paint sharp crops from history while ignoring z',
        0,
        310,
        29,
        COSMOS.ink,
        'serif',
      ),
    );
  });

  s.add(headline, live);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'history-code', hcP, 1, { dur: 0.65 });
  cueTo(s, c, 'history-bit', hbP, 1, { dur: 0.65 });
  cueTo(s, c, 'history-verdict', hvP, 1, { dur: 0.7, after: true });
  cueTo(s, c, 'half-influence', hfP, 1, { dur: 0.8 });
  cueTo(s, c, 'anneal-beta', anP, 1, { dur: 0.75 });
  cueTo(s, c, 'drop-history', dhP, 1, { dur: 0.8 });
}

// ---------------------------------------------------------------------------
// 19. free-bits: Average the group before applying its floor
// Cues: vae-free-bits-0-build, below-floor, vae-free-bits-1-build,
//       vae-free-bits-group, vae-free-bits-each, vae-free-bits-2-build
// ---------------------------------------------------------------------------
export function freeBits(s, c) {
  const b0P = s.value(0);
  const bfP = s.value(0);
  const b1P = s.value(0);
  const grP = s.value(0);
  const eaP = s.value(0);
  const b2P = s.value(0);
  const drift = s.value(0);

  const fb = freeBitsState(); // values=[0.2, 2.2], floor=1.0, avg=1.2, group=1.2 (grads [0.5,0.5]), each=1.6 (grads [0,0.5])

  s.add(cinemaGrid({ accent: ROLE.post, seed: 19 }));
  s.add(decorAura(0, 15, 560, '#a78bfa1c', '#ffd16614'));

  const headline = heroTitle(['Free Bits Floor:', 'Average First, Then Max'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 64,
    accent: ROLE.post,
    eyebrow: 'EXAMPLES KL = [0.2, 2.2]  ·  FLOOR τ = 1.0 NAT',
  });

  const live = dynamic(() => {
    const gr = grP.value;
    const ea = eaP.value;
    const b2 = b2P.value;

    return group(
      // Left: Correct Group-Averaged Free Bits
      txt('GROUP AVERAGE FIRST  (CORRECT)', -440, -205, 26, ROLE.good, 'mono'),
      numCell('avg(0.2, 2.2) = 1.20', -440, -105, {
        w: 620,
        h: 66,
        size: 28,
        stroke: ROLE.pixel,
        textColor: ROLE.pixel,
      }),
      numCell(
        gr > 0.2 ? `max(1.0, 1.2) = ${fb.groupCharge.toFixed(1)} nats` : 'max(τ, E[KL]) = ?',
        -440,
        -5,
        {
          w: 620,
          h: 66,
          size: 28,
          stroke: ROLE.good,
          textColor: ROLE.good,
          glow: gr > 0.2 ? 10 : 0,
        },
      ),
      numCell(
        gr > 0.2 ? 'Gradients: [0.5, 0.5]  (both active!)' : 'Both share batch gradient',
        -440,
        95,
        {
          w: 620,
          h: 66,
          size: 26,
          stroke: ROLE.good,
          textColor: ROLE.good,
        },
      ),

      // Right: Per-Example Clamping Mistake
      txt('CLAMP EACH EXAMPLE  (HIGHER CHARGE)', 440, -205, 26, ROLE.warn, 'mono'),
      numCell('max(1, 0.2)=1.0  |  max(1, 2.2)=2.2', 440, -105, {
        w: 640,
        h: 66,
        size: 26,
        stroke: ea > 0.2 ? ROLE.warn : '#2b3b60',
        textColor: ea > 0.2 ? ROLE.warn : COSMOS.muted,
      }),
      numCell(
        ea > 0.2 ? `avg(1.0, 2.2) = ${fb.exampleCharge.toFixed(1)} nats` : 'E[max(τ, KL)] = ?',
        440,
        -5,
        {
          w: 640,
          h: 66,
          size: 28,
          stroke: ea > 0.2 ? ROLE.warn : '#2b3b60',
          textColor: ea > 0.2 ? ROLE.warn : COSMOS.dim,
          glow: ea > 0.2 ? 10 : 0,
        },
      ),
      numCell(
        ea > 0.2 ? 'Gradients: [0.0, 0.5]  (low clipped!)' : 'Per-example clip zeros low grad',
        440,
        95,
        {
          w: 640,
          h: 66,
          size: 26,
          stroke: ea > 0.2 ? ROLE.warn : '#2b3b60',
          textColor: ea > 0.2 ? ROLE.warn : COSMOS.muted,
        },
      ),

      txt(
        b2 > 0.2
          ? 'Free bits floors the batch mean max(τ, E_x[KL]) so individual examples can vary cleanly!'
          : 'Applying max(τ, ·) before vs after averaging changes both the loss (1.2 vs 1.6) and gradients',
        0,
        305,
        29,
        COSMOS.ink,
        'serif',
      ),
    );
  });

  s.add(headline, live);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'vae-free-bits-0-build', b0P, 1, { dur: 0.65 });
  cueTo(s, c, 'below-floor', bfP, 1, { dur: 0.65 });
  cueTo(s, c, 'vae-free-bits-1-build', b1P, 1, { dur: 0.65 });
  cueTo(s, c, 'vae-free-bits-group', grP, 1, { dur: 0.75 });
  cueTo(s, c, 'vae-free-bits-each', eaP, 1, { dur: 0.75 });
  cueTo(s, c, 'vae-free-bits-2-build', b2P, 1, { dur: 0.7 });
}

// ---------------------------------------------------------------------------
// 20. interpolation: What does the halfway code draw? (SIGNATURE 3D LATENT MANIFOLD)
// Cues: vae-interpolation-0-build, vae-interpolation-1-build, finish-slide
// ---------------------------------------------------------------------------
export function interpolation(s, c) {
  const b0P = s.value(0);
  const midP = s.value(0);
  const endP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.pixel, seed: 20 }));
  s.add(decorAura(340, 15, 480, '#5ce1e622', '#a78bfa16'));

  const headline = heroTitle(['Latent Interpolation:', 'Smooth Morph Across Space'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 64,
    accent: ROLE.pixel,
    eyebrow: 'SLIDING z(t) FROM CENTER BADGE [0.90, 0.15] → LOWER STRIP [0.15, 0.90]',
  });

  // Right: Orbiting 3D Latent Landscape with glowing geodesic traveler
  const view3d = cinematic3d({
    theta: -0.64,
    phi: 1.04,
    distance: 11.4,
    unit: 132,
    focus: [0, 0, 0.5],
  }).at(410, 50);
  const manifold = surface(
    (u, v) => {
      const z1 = (u + 1.5) / 3;
      const z2 = (v + 1.5) / 3;
      const a = Math.exp(-((z1 - 0.85) ** 2 + (z2 - 0.15) ** 2) * 8.5);
      const b = Math.exp(-((z1 - 0.15) ** 2 + (z2 - 0.85) ** 2) * 8.5);
      return (a + b) * 1.45;
    },
    {
      x: [-1.5, 1.5],
      y: [-1.5, 1.5],
      resolution: [26, 26],
      colors: ['#0c1733', '#1c4478', '#5ce1e6', '#a78bfa', '#ffd166'],
      mesh: '#7ce8ff',
      meshOpacity: 0.18,
      meshWidth: 0.6,
      opacity: 0.92,
    },
  );
  const peakA = point3d([0.85 * 3 - 1.5, 0.15 * 3 - 1.5, 1.5], {
    radius: 10,
    color: ROLE.pixel,
    glow: 12,
  });
  const peakB = point3d([0.15 * 3 - 1.5, 0.85 * 3 - 1.5, 1.5], {
    radius: 10,
    color: ROLE.post,
    glow: 12,
  });
  const midPt = point3d([0, 0, 0.55], { radius: 11, color: ROLE.code, glow: 14 });
  view3d.add(manifold, peakA, peakB, midPt);
  orbitScene(s, c, view3d, { theta: -0.64, phi: 1.04, deltaTheta: 0.46, deltaPhi: 0.08 });

  const live = dynamic(() => {
    const t = Math.min(1, midP.value * 0.5 + endP.value * 0.5);
    const curZ = [mix(0.9, 0.15, t), mix(0.15, 0.9, t)];
    const crop = decode(curZ);

    return group(
      txt('LIVE DECODED CROP  g(z(t))', -460, -215, 26, ROLE.pixel, 'mono'),
      pixelPatch5x5(crop, -460, 0, { cell: 58, gap: 7 }),
      // Slider bar beneath patch
      rule(-680, 215, -240, 215, '#3b4e78', 4),
      glowDot(mix(-680, -240, t), 215, { radius: 13, color: ROLE.code, glow: 13 }),
      txt('Center', -680, 258, 26, ROLE.pixel, 'mono'),
      txt('Halfway', -460, 258, 26, ROLE.code, 'mono'),
      txt('Lower', -240, 258, 26, ROLE.post, 'mono'),

      txt('3D LATENT MANIFOLD', 390, -225, 26, ROLE.code, 'mono'),
      txt(
        t > 0.8
          ? 'Smooth KL-shaped latent space decodes valid crops all the way across the midpoint!'
          : t > 0.3
            ? 'At halfway [0.525, 0.525], both center badge and lower strip glow at half strength'
            : 'Walk straight through latent space from one family to the other',
        0,
        345,
        29,
        COSMOS.ink,
        'serif',
      ),
    );
  });

  s.add(headline, view3d, live);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'vae-interpolation-0-build', b0P, 1, { dur: 0.65 });
  cueTo(s, c, 'vae-interpolation-1-build', midP, 1, { dur: 1.0 });
  cueTo(s, c, 'finish-slide', endP, 1, { dur: 1.0 });
}
