// Act 4 (Scenes 21-25): VQ-VAE Nearest Codebook & Spatial Downsampling, VQ Gradient Routing,
// Learned Discrete Code Prior, Spatial Budget (Positions vs Scalars), Fresh Collision Capstone.
import { circle, dynamic, group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  book,
  cinemaGrid,
  cueTo,
  decorAura,
  dist,
  enc,
  fadeIn,
  fadeOut,
  freshCollisionState,
  glowBadge,
  glowBar,
  glowDot,
  guardedDynamic,
  heroTitle,
  livingDrift,
  mix,
  numCell,
  pixelPatch5x5,
  rule,
  txt,
  vqGradientSnapshot,
} from '../shared.mjs';

// ---------------------------------------------------------------------------
// 21. codes: Choose a code, then route its gradients
// Cues: code-compare, code-snap, vq-reconstruction-path, vq-codebook-path,
//       vq-commitment-path, latent-patch-b3-1, latent-position-count-b3-2,
//       spatial-cost-caveat-b3-3
// ---------------------------------------------------------------------------
export function codes(s, c) {
  const cmpP = s.value(0);
  const snpP = s.value(0);
  const recP = s.value(0);
  const cbkP = s.value(0);
  const cmtP = s.value(0);
  const patP = s.value(0);
  const cntP = s.value(0);
  const cstP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.blue, seed: 21 }));
  s.add(decorAura(0, 15, 560, '#6ea8fe1c', '#ffd16614'));

  const headline = heroTitle(['VQ-VAE Discrete Lookup', '& 64× Spatial Compression'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 64,
    accent: ROLE.blue,
    eyebrow: 'NEAREST CODEBOOK ENTRY  ·  STRAIGHT-THROUGH GRADIENTS  ·  512² → 64²',
  });

  // View 1: VQ-VAE codebook nearest-neighbor lookup & 3 gradient paths
  const view1 = guardedDynamic(
    () => fadeOut(patP.value),
    (vis) => {
      const cm = cmpP.value;
      const sn = snpP.value;
      const rc = recP.value;
      const cb = cbkP.value;
      const ct = cmtP.value;

      const cx = -420;
      const cy = 20;
      const sc = 175;
      const px = (v) => cx + v * sc;
      const py = (v) => cy - v * sc;

      const curX = mix(enc[0], book[1][0], sn);
      const curY = mix(enc[1], book[1][1], sn);

      const nodes = [
        txt('2D CODEBOOK SPACE', cx, -215, 26, ROLE.blue, 'mono'),
        rule(cx - 210, cy, cx + 210, cy, '#2a3759', 2),
        rule(cx, cy - 190, cx, cy + 190, '#2a3759', 2),
      ];
      book.forEach((b, i) => {
        const isWin = i === 1;
        nodes.push(
          line([px(enc[0]), py(enc[1])], [px(b[0]), py(b[1])], {
            stroke: isWin ? ROLE.good : '#3b4e78',
            width: isWin ? 3.5 : 2,
            dash: [6, 5],
          }).opacity(mix(0.35, 1, cm)),
          glowDot(px(b[0]), py(b[1]), {
            radius: isWin && sn > 0.2 ? 15 : 12,
            color: isWin ? ROLE.good : ROLE.blue,
            glow: isWin ? 14 : 6,
          }),
          txt(
            `e_${i}`,
            px(b[0]) + (i === 0 ? -50 : 50),
            py(b[1]) + (i === 1 ? -40 : -30),
            26,
            isWin ? ROLE.good : ROLE.blue,
            'mono',
          ),
        );
      });
      nodes.push(
        glowDot(px(curX), py(curY), { radius: 13, color: ROLE.code, glow: 14 }),
        txt('z_e', px(enc[0]) + 42, py(enc[1]) + 42, 26, ROLE.code, 'mono'),
      );

      // Right: Distances + 3 gradient paths
      const rx = 410;
      nodes.push(
        txt('DISTANCES TO z_e = [0.72, −0.10]', rx, -215, 26, ROLE.code, 'mono'),
        numCell(
          cm > 0.2
            ? `d²:  e₀=${dist[0].toFixed(2)}  |  e₁=${dist[1].toFixed(4)} ★  |  e₂=${dist[2].toFixed(2)}`
            : 'Compare squared distances',
          rx,
          -120,
          {
            w: 660,
            h: 64,
            size: 26,
            stroke: ROLE.good,
            textColor: ROLE.good,
            glow: sn > 0.2 ? 10 : 0,
          },
        ),
        numCell('1. Straight-through: copy ∂L/∂e₁ → z_e', rx, -15, {
          w: 660,
          h: 62,
          size: 26,
          stroke: rc > 0.2 ? ROLE.pixel : '#2b3b60',
          textColor: rc > 0.2 ? ROLE.pixel : COSMOS.muted,
        }),
        numCell('2. Codebook loss: pull e₁ → sg[z_e]', rx, 75, {
          w: 660,
          h: 62,
          size: 26,
          stroke: cb > 0.2 ? ROLE.blue : '#2b3b60',
          textColor: cb > 0.2 ? ROLE.blue : COSMOS.muted,
        }),
        numCell('3. Commitment: pull z_e → sg[e₁]', rx, 165, {
          w: 660,
          h: 62,
          size: 26,
          stroke: ct > 0.2 ? ROLE.post : '#2b3b60',
          textColor: ct > 0.2 ? ROLE.post : COSMOS.muted,
        }),
        txt(
          ct > 0.2
            ? 'Nearest-neighbor argmin has zero gradient, so VQ-VAE splits updates into three explicit paths!'
            : 'Snap encoder output z_e to its closest discrete codebook vector e₁ (d² = 0.0074)',
          0,
          315,
          29,
          COSMOS.ink,
          'serif',
        ),
      );

      return group(...nodes).opacity(vis);
    },
  );

  // View 2: 512x512 -> 64x64 latent diffusion spatial grid (64x position reduction)
  const view2 = guardedDynamic(
    () => fadeIn(patP.value),
    (vis) => {
      const cnt = cntP.value;
      const cst = cstP.value;
      return group(
        txt('PIXEL GRID  512 × 512', -480, -210, 28, ROLE.pixel, 'mono'),
        rect(290, 290, { fill: '#0f1c38', stroke: ROLE.pixel, width: 3.2, radius: 12 }).at(
          -480,
          10,
        ),
        rect(48, 48, { fill: '#ffd16644', stroke: ROLE.code, width: 3, radius: 4 })
          .at(-565, -75)
          .glow(10, ROLE.code),
        txt('8×8 patch', -520, -15, 26, ROLE.code, 'mono'),
        txt('262,144 positions', -480, 200, 28, ROLE.pixel, 'mono'),

        line([-315, 10], [295, 10], { stroke: ROLE.good, width: 4 }).glow(10, ROLE.good),
        glowBadge(cnt > 0.2 ? '64× FEWER POSITIONS' : '8× PER AXIS', 0, -55, ROLE.good, {
          w: 360,
          h: 62,
          size: 26,
        }),

        txt('LATENT GRID  64 × 64', 480, -210, 28, ROLE.good, 'mono'),
        rect(140, 140, { fill: '#0f2822', stroke: ROLE.good, width: 3.2, radius: 10 }).at(480, 10),
        rect(22, 22, { fill: ROLE.code, radius: 4 }).at(432, -38).glow(10, ROLE.code),
        txt('4,096 positions', 480, 200, 28, ROLE.good, 'mono'),

        txt(
          cst > 0.2
            ? 'Watch channels: fewer spatial positions cuts attention cost, while scalar count depends on C!'
            : 'Latent diffusion shrinks 512×512 pixels by 8× per axis into 64×64 spatial latent cells',
          0,
          320,
          29,
          cst > 0.2 ? ROLE.code : COSMOS.ink,
          'serif',
        ),
      ).opacity(vis);
    },
  );

  s.add(headline, view1, view2);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'code-compare', cmpP, 1, { dur: 0.75 });
  cueTo(s, c, 'code-snap', snpP, 1, { dur: 0.8 });
  cueTo(s, c, 'vq-reconstruction-path', recP, 1, { dur: 0.7 });
  cueTo(s, c, 'vq-codebook-path', cbkP, 1, { dur: 0.7 });
  cueTo(s, c, 'vq-commitment-path', cmtP, 1, { dur: 0.7 });
  cueTo(s, c, 'latent-patch-b3-1', patP, 1, { dur: 0.85 });
  cueTo(s, c, 'latent-position-count-b3-2', cntP, 1, { dur: 0.7 });
  cueTo(s, c, 'spatial-cost-caveat-b3-3', cstP, 1, { dur: 0.7 });
}

// ---------------------------------------------------------------------------
// 22. vq-gradients: Who should move after the lookup?
// Cues: lookup-operands, route-recon*, value-recon, commitment, entry-loss,
//       second-operands, second-recon*, second-commit, encoder-sum, second-entry
// ---------------------------------------------------------------------------
export function vqGradients(s, c) {
  const op1P = s.value(0);
  const rr1P = s.value(0);
  const vr1P = s.value(0);
  const cm1P = s.value(0);
  const en1P = s.value(0);
  const op2P = s.value(0);
  const rr2P = s.value(0);
  const cm2P = s.value(0);
  const esP = s.value(0);
  const en2P = s.value(0);
  const drift = s.value(0);

  const g = vqGradientSnapshot(0.1);
  // axis 0: recon=+0.15, commit=+0.035, enc=+0.185, codebook=-0.14
  // axis 1: recon=-0.15, commit=-0.025, enc=-0.175, codebook=+0.10

  s.add(cinemaGrid({ accent: ROLE.code, seed: 22 }));
  s.add(decorAura(0, 15, 560, '#ffd1661a', '#6ea8fe14'));

  const headline = heroTitle(['VQ-VAE Gradient Routing:', 'Exact Numbers by Axis'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 64,
    accent: ROLE.code,
    eyebrow: 'z_e = [0.72, −0.10]  ·  e₁ = [0.65, −0.05]  ·  TARGET = [0.50, 0.10]',
  });

  const live = dynamic(() => {
    const rr1 = rr1P.value;
    const cm1 = cm1P.value;
    const en1 = en1P.value;
    const op2 = op2P.value;
    const rr2 = rr2P.value;
    const cm2 = cm2P.value;
    const es = esP.value;
    const en2 = en2P.value;

    return group(
      // Left: Axis 1 (x-coordinate)
      txt('COORDINATE 1  (z_e=0.72, e₁=0.65, y=0.50)', -440, -210, 26, ROLE.pixel, 'mono'),
      numCell(
        rr1 > 0.2
          ? `Recon grad → z_e:  +${g.reconstructionGradient[0].toFixed(3)}`
          : 'Recon grad → z_e:  ?',
        -440,
        -110,
        {
          w: 540,
          h: 64,
          size: 26,
          stroke: rr1 > 0.2 ? ROLE.pixel : '#2b3b60',
          textColor: rr1 > 0.2 ? ROLE.pixel : COSMOS.dim,
          glow: rr1 > 0.2 ? 9 : 0,
        },
      ),
      numCell(
        cm1 > 0.2
          ? `Commit grad → z_e: +${g.commitmentGradient[0].toFixed(3)}`
          : 'Commit grad (β=0.25): ?',
        -440,
        -15,
        {
          w: 540,
          h: 64,
          size: 26,
          stroke: cm1 > 0.2 ? ROLE.post : '#2b3b60',
          textColor: cm1 > 0.2 ? ROLE.post : COSMOS.dim,
        },
      ),
      numCell(
        en1 > 0.2
          ? `Codebook → e₁:     ${g.codebookGradient[0].toFixed(3)}`
          : 'Codebook grad → e₁: ?',
        -440,
        80,
        {
          w: 540,
          h: 64,
          size: 26,
          stroke: en1 > 0.2 ? ROLE.blue : '#2b3b60',
          textColor: en1 > 0.2 ? ROLE.blue : COSMOS.dim,
        },
      ),
      numCell(
        en1 > 0.2
          ? `Total encoder grad: +${g.encoderGradient[0].toFixed(3)}`
          : 'Encoder total: recon + commit',
        -440,
        175,
        {
          w: 540,
          h: 64,
          size: 26,
          stroke: ROLE.good,
          textColor: ROLE.good,
        },
      ),

      // Right: Axis 2 (y-coordinate)
      txt('COORDINATE 2  (z_e=−0.10, e₁=−0.05, y=0.10)', 440, -210, 26, ROLE.code, 'mono'),
      numCell(
        rr2 > 0.2
          ? `Recon grad → z_e:  ${g.reconstructionGradient[1].toFixed(3)}`
          : 'Recon grad → z_e:  ?',
        440,
        -110,
        {
          w: 540,
          h: 64,
          size: 26,
          stroke: rr2 > 0.2 ? ROLE.code : '#2b3b60',
          textColor: rr2 > 0.2 ? ROLE.code : COSMOS.dim,
          glow: rr2 > 0.2 ? 9 : 0,
        },
      ),
      numCell(
        cm2 > 0.2
          ? `Commit grad → z_e: ${g.commitmentGradient[1].toFixed(3)}`
          : 'Commit grad (β=0.25): ?',
        440,
        -15,
        {
          w: 540,
          h: 64,
          size: 26,
          stroke: cm2 > 0.2 ? ROLE.post : '#2b3b60',
          textColor: cm2 > 0.2 ? ROLE.post : COSMOS.dim,
        },
      ),
      numCell(
        en2 > 0.2
          ? `Codebook → e₁:     +${g.codebookGradient[1].toFixed(3)}`
          : 'Codebook grad → e₁: ?',
        440,
        80,
        {
          w: 540,
          h: 64,
          size: 26,
          stroke: en2 > 0.2 ? ROLE.blue : '#2b3b60',
          textColor: en2 > 0.2 ? ROLE.blue : COSMOS.dim,
        },
      ),
      numCell(
        es > 0.2
          ? `Total encoder grad: ${g.encoderGradient[1].toFixed(3)}`
          : 'Encoder total: recon + commit',
        440,
        175,
        {
          w: 540,
          h: 64,
          size: 26,
          stroke: es > 0.2 ? ROLE.good : '#2b3b60',
          textColor: es > 0.2 ? ROLE.good : COSMOS.dim,
          glow: es > 0.2 ? 10 : 0,
        },
      ),

      txt(
        en2 > 0.2
          ? 'Both z_e and e₁ step smoothly: encoder gets recon + commitment, entry gets codebook pull!'
          : op2 > 0.2
            ? 'Check coordinate 2 next: signs flip because e₁ (−0.05) sits below target (+0.10)'
            : 'Straight-through routes reconstruction gradient to z_e while stop-gradient splits codebook vs commitment',
        0,
        320,
        29,
        COSMOS.ink,
        'serif',
      ),
    );
  });

  s.add(headline, live);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'lookup-operands', op1P, 1, { dur: 0.65 });
  cueTo(s, c, 'route-recon', rr1P, 1, { dur: 0.7, after: true });
  cueTo(s, c, 'value-recon', vr1P, 1, { dur: 0.65 });
  cueTo(s, c, 'commitment', cm1P, 1, { dur: 0.7 });
  cueTo(s, c, 'entry-loss', en1P, 1, { dur: 0.7 });
  cueTo(s, c, 'second-operands', op2P, 1, { dur: 0.65 });
  cueTo(s, c, 'second-recon', rr2P, 1, { dur: 0.7, after: true });
  cueTo(s, c, 'second-commit', cm2P, 1, { dur: 0.7 });
  cueTo(s, c, 'encoder-sum', esP, 1, { dur: 0.7 });
  cueTo(s, c, 'second-entry', en2P, 1, { dur: 0.7 });
}

// ---------------------------------------------------------------------------
// 23. code-prior: Learn how valid code sequences fit together
// Cues: vae-code-prior-0-build, vae-code-prior-1-build
// ---------------------------------------------------------------------------
export function codePrior(s, c) {
  const b0P = s.value(0);
  const b1P = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.post, seed: 23 }));
  s.add(decorAura(0, 15, 560, '#a78bfa1c', '#6ea8fe14'));

  const headline = heroTitle(['Discrete Code Prior:', 'Sampling Valid Sequences'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 64,
    accent: ROLE.post,
    eyebrow: 'UNIFORM CODE INDICES BREAK STRUCTURE  ·  LEARN p(c₁, c₂, …, c_K)',
  });

  const live = dynamic(() => {
    const b1 = b1P.value;
    const randCodes = ['e₂', 'e₀', 'e₂', 'e₁', 'e₀', 'e₂'];
    const learnedCodes = ['e₁', 'e₁', 'e₁', 'e₀', 'e₀', 'e₀'];

    const nodes = [
      txt('UNIFORM RANDOM INDICES  (NO PRIOR)', -440, -185, 26, ROLE.warn, 'mono'),
      txt('LEARNED PRIOR  p(cₜ | c<ₜ)', 440, -185, 26, ROLE.good, 'mono'),
    ];
    randCodes.forEach((tok, i) => {
      const col = i % 3;
      const row = Math.floor(i / 3);
      nodes.push(
        numCell(tok, -580 + col * 140, -65 + row * 100, {
          w: 112,
          h: 66,
          size: 28,
          stroke: ROLE.warn,
          textColor: ROLE.warn,
        }),
      );
    });
    learnedCodes.forEach((tok, i) => {
      const col = i % 3;
      const row = Math.floor(i / 3);
      nodes.push(
        numCell(tok, 300 + col * 140, -65 + row * 100, {
          w: 112,
          h: 66,
          size: 28,
          stroke: b1 > 0.2 ? ROLE.good : '#2b3b60',
          textColor: b1 > 0.2 ? ROLE.good : COSMOS.muted,
          glow: b1 > 0.2 ? 9 : 0,
        }),
      );
    });

    nodes.push(
      txt('Mismatched tiles → incoherent decode', -440, 145, 26, ROLE.warn, 'mono'),
      txt('Coherent spatial sequence → crisp image', 440, 145, 26, ROLE.good, 'mono').opacity(
        mix(0.45, 1, b1),
      ),
      txt(
        b1 > 0.2
          ? 'Unlike a continuous VAE with fixed N(0,I), a VQ-VAE fits a second-stage prior over code tokens!'
          : 'A codebook alone does not tell you which code sequences occur together in real images',
        0,
        305,
        29,
        COSMOS.ink,
        'serif',
      ),
    );
    return group(...nodes);
  });

  s.add(headline, live);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'vae-code-prior-0-build', b0P, 1, { dur: 0.7 });
  cueTo(s, c, 'vae-code-prior-1-build', b1P, 1, { dur: 0.8 });
}

// ---------------------------------------------------------------------------
// 24. spatial-budget: What survives a smaller latent grid?
// Cues: vae-spatial-budget-0-build, vae-spatial-budget-positions,
//       vae-spatial-budget-scalars, vae-spatial-budget-1-build, vae-spatial-budget-2-build
// ---------------------------------------------------------------------------
export function spatialBudget(s, c) {
  const b0P = s.value(0);
  const posP = s.value(0);
  const sclP = s.value(0);
  const b1P = s.value(0);
  const b2P = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.pixel, seed: 24 }));
  s.add(decorAura(0, 15, 560, '#5ce1e61a', '#6ee7b714'));

  const headline = heroTitle(['Spatial Budget:', 'Positions vs Total Scalars'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 64,
    accent: ROLE.pixel,
    eyebrow: '512×512×3 PIXELS  →  64×64×C LATENTS  (64× POSITIONS, 48× SCALARS AT C=4)',
  });

  const live = dynamic(() => {
    const ps = posP.value;
    const sc = sclP.value;
    const b2 = b2P.value;

    return group(
      // Left: Spatial positions drop 64x
      txt('SPATIAL POSITIONS (H × W)', -440, -205, 26, ROLE.pixel, 'mono'),
      txt('Pixel Grid  512²', -780, -100, 26, ROLE.pixel, 'mono', 'left'),
      glowBar(-510, -100, 390, 36, ROLE.pixel, { glow: 8 }),
      txt('262,144', -100, -100, 26, ROLE.pixel, 'mono', 'left'),

      txt('Latent Grid  64²', -780, 0, 26, ROLE.good, 'mono', 'left'),
      glowBar(-510, 0, 22, 36, ROLE.good, { glow: 10 }).opacity(mix(0.45, 1, ps)),
      txt('4,096  (64× smaller!)', -470, 0, 26, ROLE.good, 'mono', 'left').opacity(
        mix(0.45, 1, ps),
      ),

      // Right: Total scalars depend on channel depth C
      txt('TOTAL SCALARS (H × W × C)', 430, -205, 26, ROLE.code, 'mono'),
      numCell('RGB Pixels: 512² × 3 = 786,432', 430, -100, {
        w: 660,
        h: 64,
        size: 26,
        stroke: ROLE.pixel,
        textColor: ROLE.pixel,
      }),
      numCell(
        sc > 0.2 ? 'Latent C=4:  64² × 4 = 16,384 (48×)' : 'Latent C=4:  64² × C = ?',
        430,
        0,
        {
          w: 660,
          h: 64,
          size: 26,
          stroke: sc > 0.2 ? ROLE.code : '#2b3b60',
          textColor: sc > 0.2 ? ROLE.code : COSMOS.dim,
          glow: sc > 0.2 ? 9 : 0,
        },
      ),
      numCell(
        b2 > 0.2
          ? 'More channels C = richer detail, more RAM'
          : 'Channels C set exact scalar ratio',
        430,
        100,
        {
          w: 660,
          h: 64,
          size: 26,
          stroke: b2 > 0.2 ? ROLE.good : '#2b3b60',
          textColor: b2 > 0.2 ? ROLE.good : COSMOS.muted,
        },
      ),

      txt(
        b2 > 0.2
          ? 'Count BOTH spatial positions (for quadratic attention) and channel scalars (for memory)!'
          : '8× downsampling per axis cuts spatial positions 64×, making latent denoising dramatically cheaper',
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
  cueTo(s, c, 'vae-spatial-budget-0-build', b0P, 1, { dur: 0.65 });
  cueTo(s, c, 'vae-spatial-budget-positions', posP, 1, { dur: 0.75 });
  cueTo(s, c, 'vae-spatial-budget-scalars', sclP, 1, { dur: 0.75 });
  cueTo(s, c, 'vae-spatial-budget-1-build', b1P, 1, { dur: 0.65 });
  cueTo(s, c, 'vae-spatial-budget-2-build', b2P, 1, { dur: 0.7 });
}

// ---------------------------------------------------------------------------
// 25. fresh-collision: Could you report the original alert? (CAPSTONE TRANSFER)
// Cues: vae-fresh-collision-0-build, sum-centers, vae-fresh-collision-code*,
//       vae-fresh-collision-decoded*, compare-miss, vae-fresh-collision-errors*,
//       return-cutoff, audit-peaks*, retain-flag, retain-positions
// ---------------------------------------------------------------------------
export function freshCollision(s, c) {
  const b0P = s.value(0);
  const sumP = s.value(0);
  const codP = s.value(0);
  const decP = s.value(0);
  const cmpP = s.value(0);
  const errP = s.value(0);
  const cutP = s.value(0);
  const audP = s.value(0);
  const flgP = s.value(0);
  const posP = s.value(0);
  const drift = s.value(0);

  const col = freshCollisionState(2, 1); // codes=[[0.7,0.3],[0.7,0.3]], decoded peak=0.78, mse=[0.0132, 0.0068]

  s.add(cinemaGrid({ accent: ROLE.warn, seed: 25 }));
  s.add(decorAura(0, 15, 560, '#ff6b8b1e', '#6ee7b714'));

  const headline = heroTitle(['Transfer Capstone:', 'Hidden Alert Collision'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 64,
    accent: ROLE.warn,
    eyebrow: 'CROP A (PEAK 1.00 > 0.90)  VS  CROP B (PEAK 0.80 ≤ 0.90)',
  });

  const live = dynamic(() => {
    const cd = codP.value;
    const dc = decP.value;
    const er = errP.value;
    const au = audP.value;
    const fl = flgP.value;
    const ps = posP.value;

    return group(
      // Left: Crop A (alert!) vs Crop B (safe)
      txt('CROP A  (MAX = 1.00)', -690, -210, 26, ROLE.warn, 'mono'),
      pixelPatch5x5(col.inputs[0], -690, -45, {
        cell: 38,
        gap: 4,
        alertCut: au > 0.2 ? 0.9 : null,
      }),
      txt(
        er > 0.2 ? `MSE = ${col.mse[0].toFixed(4)}` : '[0.4, 0.8, 0.6, 1.0]',
        -690,
        130,
        26,
        ROLE.warn,
        'mono',
      ),

      txt('CROP B  (MAX = 0.80)', -265, -210, 26, ROLE.pixel, 'mono'),
      pixelPatch5x5(col.inputs[1], -265, -45, { cell: 38, gap: 4 }),
      txt(
        er > 0.2 ? `MSE = ${col.mse[1].toFixed(4)}` : '[0.6, 0.6, 0.8, 0.8]',
        -265,
        130,
        26,
        ROLE.pixel,
        'mono',
      ),

      // Center: Identical code [0.70, 0.30] -> identical decoded crop (peak 0.78!)
      txt('SHARED CODE  z', 170, -210, 26, ROLE.code, 'mono'),
      numCell(cd > 0.2 ? '[0.70, 0.30]' : '[?, ?]', 170, -105, {
        w: 240,
        h: 68,
        size: 30,
        stroke: cd > 0.2 ? ROLE.code : '#2b3b60',
        textColor: cd > 0.2 ? ROLE.code : COSMOS.dim,
        glow: cd > 0.2 ? 12 : 0,
      }),
      glowBadge(
        au > 0.2 ? 'ALERT MISSED ON x̂!' : dc > 0.2 ? 'BOTH PEAK = 0.78' : 'DECODED PEAK = ?',
        170,
        5,
        au > 0.2 ? ROLE.warn : dc > 0.2 ? ROLE.code : COSMOS.dim,
        { w: 300, h: 62, size: 26 },
      ),
      txt(
        fl > 0.2
          ? ps > 0.2
            ? 'Save peak + positions!'
            : 'Keep original peak / flag!'
          : cd > 0.2
            ? 'Same code → same x̂'
            : 'Do both crops collide?',
        170,
        130,
        26,
        fl > 0.2 ? ROLE.good : COSMOS.muted,
        'mono',
      ),

      // Right: Shared decoded crop
      txt('SHARED DECODE  x̂', 630, -210, 26, ROLE.good, 'mono'),
      pixelPatch5x5(dc > 0.2 ? col.outputs[0] : Array(25).fill(0.12), 630, -45, {
        cell: 38,
        gap: 4,
        opacity: mix(0.45, 1, dc),
      }),
      txt(
        dc > 0.2 ? 'Max = 0.78 (< 0.90)' : 'Waiting for decode...',
        630,
        130,
        26,
        ROLE.good,
        'mono',
      ),

      txt(
        ps > 0.2
          ? 'Keep original peaks/positions when exact alerts matter; next, Transformers keep per-token vectors!'
          : au > 0.2
            ? 'Crop A crossed 0.90 (peak 1.00), yet its bottleneck reconstruction peaks at 0.78 and hides the alert!'
            : dc > 0.2
              ? 'Both crops decode to identical peak 0.78 (< 0.90), erasing Crop A’s 1.00 spike!'
              : 'Both crops average to 0.70 in the center: can the bottleneck preserve Crop A’s 1.00 peak?',
        0,
        305,
        29,
        au > 0.2 ? ROLE.warn : dc > 0.2 ? ROLE.code : COSMOS.ink,
        'serif',
      ),
    );
  });

  s.add(headline, live);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'vae-fresh-collision-0-build', b0P, 1, { dur: 0.65 });
  cueTo(s, c, 'sum-centers', sumP, 1, { dur: 0.65 });
  cueTo(s, c, 'vae-fresh-collision-code', codP, 1, { dur: 0.7, after: true });
  cueTo(s, c, 'vae-fresh-collision-decoded', decP, 1, { dur: 0.7, after: true });
  cueTo(s, c, 'compare-miss', cmpP, 1, { dur: 0.65 });
  cueTo(s, c, 'vae-fresh-collision-errors', errP, 1, { dur: 0.7, after: true });
  cueTo(s, c, 'return-cutoff', cutP, 1, { dur: 0.65 });
  cueTo(s, c, 'audit-peaks', audP, 1, { dur: 0.7, after: true });
  cueTo(s, c, 'retain-flag', flgP, 1, { dur: 0.65 });
  cueTo(s, c, 'retain-positions', posP, 1, { dur: 0.65 });
}
