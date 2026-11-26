// Scene 20: maxsim-readout - "Each query token selects its best document-token match"
// Pure Cinema: View 1 lights up MaxSim row maxima (0.93 + 0.91 = 1.84) and demonstrates column reuse;
// View 2 compares raw coordinate payload (16.7x); View 3 illustrates ColBERTv2 centroid + residual decoding.
import { arrow } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  cinemaAtmosphere,
  glowMatrix,
  glowTex,
  guardedDynamic,
  heroTitle,
  lumBar,
  playAfter,
  playOn,
  rule,
  swapVis,
  tokenMaxSim,
  txt,
  verifyApprox,
  verifyInvariant,
} from '../parts.mjs';

export default function maxsimReadout(s, c) {
  const baseVals = [
    [0.12, 0.93, 0.08],
    [0.19, 0.07, 0.91],
  ];
  const rBase = tokenMaxSim(baseVals);
  const swappedRow1 = [0.19, 0.91, 0.07];
  const rReuse = tokenMaxSim([baseVals[0], swappedRow1]);
  const ratio = (100 * 128) / 768;

  verifyApprox(rBase.sum, 1.84, 1e-12, 'MaxSim sum 1.84');
  verifyInvariant(rReuse.winners[0] === rReuse.winners[1], 'both tokens select column d2');
  verifyApprox(rReuse.sum, rBase.sum, 1e-12, 'reused column preserves 1.84');

  const vGrid = s.value(1);
  const vBytes = s.value(0);
  const vComp = s.value(0);
  const hiApi = s.value(0);
  const hiKey = s.value(0);
  const showSum = s.value(0);
  const reuseOn = s.value(0);
  const showRatio = s.value(0);
  const showReconstruct = s.value(0);

  const title = heroTitle(['ColBERT MaxSim:', 'row maxima and residual storage'], {
    x: -860,
    y: -450,
    size: 44,
    lineHeight: 52,
    accent: ROLE.positive,
  });

  const eqMaxSim = glowTex('\\text{MaxSim}(q, d) = \\sum_{i} \\max_{j} \\, q_i \\cdot d_j', {
    x: 420,
    y: -420,
    size: 32,
    color: ROLE.focus,
    glow: 6,
  });

  // View 1: 2x3 Token Similarity Grid + Sum Readout
  const gridLayer = guardedDynamic(vGrid, (alpha) => {
    const api = hiApi.value;
    const key = hiKey.value;
    const sm = showSum.value;
    const ru = reuseOn.value;
    const curVals = ru > 0.5 ? [baseVals[0], swappedRow1] : baseVals;
    const keyWinCol = ru > 0.5 ? 1 : 2;
    const nodes = [
      glowMatrix({
        cx: -230,
        cy: 5,
        rows: 2,
        cols: 3,
        cellW: 195,
        cellH: 120,
        gap: 16,
        values: curVals.map((r) => r.map((v) => v.toFixed(2))),
        rowLabels: ['API', 'key'],
        colLabels: ['d₁', 'd₂', 'd₃'],
        colors: [
          [COSMOS.dim, api > 0.3 ? ROLE.positive : ROLE.anchor, COSMOS.dim],
          [
            COSMOS.dim,
            ru > 0.5 ? ROLE.positive : COSMOS.dim,
            ru <= 0.5 && key > 0.3 ? ROLE.positive : COSMOS.dim,
          ],
        ],
        highlight: (r, k) =>
          (r === 0 && k === 1 && api > 0.3) || (r === 1 && k === keyWinCol && key > 0.3),
        fontSize: 38,
        opacity: alpha,
      }),
      rule(175, -240, 175, 250, COSMOS.rule, 1.8).opacity(0.55 * alpha),
      txt('SUM ROW MAXIMA', 530, -165, 30, ROLE.focus, 'mono', 'center').opacity(alpha),
    ];

    if (sm > 0.05) {
      nodes.push(
        txt('0.93  +  0.91', 530, -45, 42, COSMOS.ink, 'mono', 'center').opacity(sm * alpha),
        txt('=  1.84', 530, 55, 56, ROLE.positive, 'mono', 'center')
          .glow(10, ROLE.positive)
          .opacity(sm * alpha),
      );
    }
    if (ru > 0.3) {
      nodes.push(
        txt(
          'Both query tokens pick d₂ -> score still 1.84',
          530,
          165,
          28,
          ROLE.anchor,
          'sans',
          'center',
        ).opacity(ru * alpha),
      );
    }

    nodes.push(
      txt(
        ru > 0.3
          ? 'Independent row maxima allow token reuse and non-monotonic word order'
          : 'Raw payload = token count × vector width × bytes per coordinate',
        0,
        365,
        28,
        COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
    );
    return nodes;
  });

  // View 2: Raw Coordinate Payload Comparison (100x128 vs 1x768)
  const bytesLayer = guardedDynamic(vBytes, (alpha) => {
    const sr = showRatio.value;
    const maxW = 1120;
    const barLeft = -560;
    const wCol = maxW;
    const wBi = Math.max(18, (768 / 12800) * maxW);
    const nodes = [
      txt(
        'RAW COORDINATES PER DOCUMENT  (EQUAL PRECISION)',
        0,
        -240,
        30,
        ROLE.anchor,
        'mono',
        'center',
      ).opacity(alpha),
      txt(
        'ColBERT:  100 tokens × 128-d',
        barLeft,
        -110,
        32,
        ROLE.unrelated,
        'sans',
        'left',
      ).opacity(alpha),
      lumBar(barLeft + wCol / 2, -45, wCol, 56, {
        color: ROLE.unrelated,
        fillAlpha: 0.44,
        glow: 9,
        radius: 8,
        opacity: alpha,
      }),
      txt('12,800 coords', barLeft + wCol + 26, -45, 30, ROLE.unrelated, 'mono', 'left').opacity(
        alpha,
      ),
      txt('Bi-encoder:  1 vector × 768-d', barLeft, 85, 32, ROLE.anchor, 'sans', 'left').opacity(
        alpha,
      ),
      lumBar(barLeft + wBi / 2, 150, wBi, 56, {
        color: ROLE.anchor,
        fillAlpha: 0.48,
        glow: 9,
        radius: 8,
        opacity: alpha,
      }),
      txt('768 coords', barLeft + wBi + 26, 150, 30, ROLE.anchor, 'mono', 'left').opacity(alpha),
    ];

    if (sr > 0.05) {
      nodes.push(
        txt(
          `12,800 / 768  ≈  ${ratio.toFixed(1)}× more raw coordinates`,
          0,
          315,
          44,
          ROLE.focus,
          'mono',
          'center',
        )
          .glow(9, ROLE.focus)
          .opacity(sr * alpha),
      );
    }
    return nodes;
  });

  // View 3: ColBERTv2 Centroid + 1-2 Bit Residual Compression & Reconstruction
  const compLayer = guardedDynamic(vComp, (alpha) => {
    const rec = showReconstruct.value;
    const nodes = [
      txt(
        'COLBERTv2 RESIDUAL COMPRESSION   (ONE DOCUMENT TOKEN d₂)',
        0,
        -285,
        28,
        ROLE.anchor,
        'mono',
        'center',
      ).opacity(alpha),
      // Full 128-d vector strip at top
      lumBar(0, -175, 1020, 74, {
        color: ROLE.unrelated,
        fillAlpha: 0.24,
        glow: 8,
        radius: 12,
        opacity: alpha,
      }),
      txt(
        'Full vector v  [v₁, v₂, …, v₁₂₈]  (128 floats)',
        0,
        -175,
        28,
        COSMOS.ink,
        'mono',
        'center',
      ).opacity(alpha),
      // Split arrows down into Centroid ID and Quantized Residual
      arrow([-180, -130], [-450, -25], { stroke: ROLE.unrelated, width: 3.4, tip: 12 }).opacity(
        alpha,
      ),
      arrow([180, -130], [320, -25], { stroke: ROLE.anchor, width: 3.4, tip: 12 }).opacity(alpha),
      // Left branch: Centroid ID
      lumBar(-460, 50, 440, 118, {
        color: ROLE.unrelated,
        fillAlpha: 0.24,
        glow: 8,
        radius: 12,
        opacity: alpha,
      }),
      txt('Nearest Centroid ID  k', -460, 24, 30, ROLE.unrelated, 'sans', 'center').opacity(alpha),
      txt('codebook vector c_k', -460, 72, 26, COSMOS.muted, 'mono', 'center').opacity(alpha),
      // Right branch: 1-2 bit residual
      lumBar(320, 50, 820, 118, {
        color: ROLE.anchor,
        fillAlpha: 0.24,
        glow: 8,
        radius: 12,
        opacity: alpha,
      }),
      txt(
        'Quantized Residual  qᵢ = Q_b(vᵢ − c_{k,i})',
        320,
        24,
        28,
        ROLE.anchor,
        'mono',
        'center',
      ).opacity(alpha),
      txt(
        'b ∈ {1, 2} bits / coord  (128 × b bits)',
        320,
        72,
        26,
        COSMOS.muted,
        'mono',
        'center',
      ).opacity(alpha),
    ];

    if (rec > 0.05) {
      nodes.push(
        arrow([-280, 118], [-80, 210], { stroke: ROLE.focus, width: 3.4, tip: 12 }).opacity(
          rec * alpha,
        ),
        arrow([200, 118], [80, 210], { stroke: ROLE.focus, width: 3.4, tip: 12 }).opacity(
          rec * alpha,
        ),
        lumBar(0, 262, 1020, 76, {
          color: ROLE.focus,
          fillAlpha: 0.26,
          glow: 10,
          radius: 12,
          opacity: rec * alpha,
        }),
        txt(
          'v̂ ≈ c_k + decoded residual  (scored at query time)',
          0,
          262,
          28,
          ROLE.focus,
          'mono',
          'center',
        )
          .glow(6, ROLE.focus)
          .opacity(rec * alpha),
      );
    }

    nodes.push(
      txt(
        'Count codebook + index structures in total storage · verify reconstructed recall on held-out queries',
        0,
        378,
        26,
        COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
    );
    return nodes;
  });

  s.add(
    cinemaAtmosphere(ROLE.positive, ROLE.unrelated),
    title,
    eqMaxSim,
    gridLayer,
    bytesLayer,
    compLayer,
  );

  playOn(s, c, 'cl-maxsim-readout-api', (d) => hiApi.to(1, { duration: d }), 0.45);
  playOn(s, c, 'cl-maxsim-readout-key', (d) => hiKey.to(1, { duration: d }), 0.45);
  playAfter(s, c, 'cl-maxsim-readout-sum', (d) => showSum.to(1, { duration: d }), 0.45);
  playOn(s, c, 'cl-maxsim-readout-reuse', (d) => reuseOn.to(1, { duration: d }), 0.65);

  c.hide('repair-maxsim-payload', eqMaxSim);
  playOn(s, c, 'repair-maxsim-payload', (d) => swapVis(vGrid, vBytes, d), 0.65);
  playAfter(s, c, 'cl-maxsim-readout-bytes', (d) => showRatio.to(1, { duration: d }), 0.45);

  playOn(s, c, 'cl-maxsim-readout-compress', (d) => swapVis(vBytes, vComp, d), 0.7);
  playOn(s, c, 'repair-maxsim-reconstruct', (d) => showReconstruct.to(1, { duration: d }), 0.6);
}
