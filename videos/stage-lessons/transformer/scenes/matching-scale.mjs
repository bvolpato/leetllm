// Scene 12: matching-scale: "What gives one key a larger share?"
// View 1 (Beat 0): Symmetric X X^T scores vs asymmetric row-wise softmax (A=[1,0], B=[1,1]).
// View 2 (Beat 1): Variance accumulator Var(q.k) = d_k, sigma = sqrt(d_k).
// View 3 (Beat 2): Head width 64 raw scores [12.4, 9.1, 3.8] unscaled blue vs scaled (/8) emerald bars.
// View 4 (Beat 3): Length growth 3 -> 6 tokens: score grid quadruples (9 -> 36) while projected rows double (3 -> 6).
import { arrow, line } from 'vizmatic/stage';
import { COSMOS, glowTex, guardedDynamic, heroTitle, txt } from '../../cinematic-kit.mjs';
import {
  ROLE,
  cinemaAtmosphere,
  dotProduct,
  fmt,
  glowMatrix,
  lumBar,
  pct,
  playCue,
  stableSoftmax,
  swapVis,
} from '../parts.mjs';

export default function matchingScale(s, c) {
  const title = heroTitle(['What gives one key', 'a larger share?'], {
    x: -850,
    y: -430,
    size: 48,
    lineHeight: 56,
    accent: ROLE.attn,
  });

  const vRow = s.value(1);
  const vVar = s.value(0);
  const vScale = s.value(0);
  const vLen = s.value(0);

  // View 1 channels
  const showCross = s.value(0);
  const showSelf = s.value(0);
  const showRowA = s.value(0);
  const showRowB = s.value(0);

  // View 2 channels
  const varCount = s.value(1); // 1 -> 8 products
  const varEqShow = s.value(0);

  // View 3 channels
  const scaleProg = s.value(0); // 0 -> 1 divisor ramps 1 -> 8

  // View 4 channels
  const lenProg = s.value(0); // 0 -> 1 grows 3 -> 6 tokens

  const inputs = [
    [1, 0],
    [1, 1],
  ];
  const matScores = inputs.map((q) => inputs.map((k) => dotProduct(q, k)));
  const matShares = matScores.map((r) => stableSoftmax(r));

  // VIEW 1: Symmetric scores vs asymmetric row denominators
  const rowLayer = guardedDynamic(vRow, (alpha) => {
    const sc = showCross.value > 0.35;
    const ss = showSelf.value > 0.35;
    const rA = showRowA.value > 0.35;
    const rB = showRowB.value > 0.35;

    const scoreVals = [
      [ss ? '1' : '·', sc ? '1' : '·'],
      [sc ? '1' : '·', ss ? '2' : '·'],
    ];
    const shareVals = [
      rA ? matShares[0].map((v) => pct(v)) : ['?', '?'],
      rB ? matShares[1].map((v) => pct(v)) : ['?', '?'],
    ];

    return [
      txt(
        'A = [1, 0]   ·   B = [1, 1]   ·   unmasked self-scores',
        180,
        -345,
        28,
        COSMOS.muted,
        'mono',
        'center',
      ).opacity(alpha),
      glowMatrix({
        cx: -410,
        cy: 5,
        rows: 2,
        cols: 2,
        cellW: 190,
        cellH: 112,
        gap: 18,
        values: scoreVals,
        rowLabels: ['A', 'B'],
        colLabels: ['A', 'B'],
        highlight: (r, k) => sc && r !== k,
        colors: [
          [ROLE.attn, ROLE.query],
          [ROLE.query, ROLE.attn],
        ],
        fontSize: 34,
        opacity: alpha,
      }),
      txt('raw dot scores  X X^T', -410, 195, 30, ROLE.attn, 'mono', 'center').opacity(alpha),
      arrow([-130, 5], [100, 5], { stroke: ROLE.valid, width: 4, tip: 16 })
        .glow(8, ROLE.valid)
        .opacity(alpha),
      txt('row softmax', -15, -36, 26, ROLE.valid, 'mono', 'center').opacity(alpha),
      glowMatrix({
        cx: 410,
        cy: 5,
        rows: 2,
        cols: 2,
        cellW: 190,
        cellH: 112,
        gap: 18,
        values: shareVals,
        rowLabels: ['A', 'B'],
        colLabels: ['A', 'B'],
        highlight: (r, k) => rB && r === 1 && k === 0,
        colors: [
          [ROLE.valid, ROLE.valid],
          [ROLE.query, ROLE.valid],
        ],
        fontSize: 34,
        opacity: alpha,
      }),
      txt('attention shares per row', 410, 195, 30, ROLE.valid, 'mono', 'center').opacity(alpha),
      txt(
        rB
          ? 'Same dot product (1) wins 50% in row A vs 27% in row B: each row has its own denominator'
          : 'Rows are queries  ·  columns are keys A and B',
        0,
        360,
        28,
        rB ? ROLE.query : COSMOS.muted,
        'sans',
        'center',
      )
        .glow(rB ? 6 : 0, ROLE.query)
        .opacity(alpha),
    ];
  });

  // VIEW 2: Independent coordinate products -> variance d_k, std sqrt(d_k)
  const varEq = glowTex(
    '\\operatorname{Var}(q \\cdot k) = d_k \\;\\Rightarrow\\; \\sigma = \\sqrt{d_k}',
    {
      x: 415,
      y: -380,
      size: 38,
      color: ROLE.query,
    },
  );

  const varLayer = guardedDynamic(vVar, (alpha) => {
    const n = Math.max(1, Math.min(8, Math.round(varCount.value)));
    const eqOn = varEqShow.value;
    const nodes = [
      varEq.opacity(eqOn * alpha),
      txt(
        'Independent zero-mean, unit-variance coordinates',
        0,
        -245,
        30,
        COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
    ];

    for (let i = 0; i < 8; i++) {
      const cx = -665 + i * 190;
      const lit = i < n;
      nodes.push(
        lumBar(cx, -50, 152, 130, {
          color: lit ? ROLE.attn : ROLE.rule,
          fillOpacity: lit ? 0.36 : 0.1,
          strokeWidth: lit ? 2.6 : 1.5,
          glow: lit ? 9 : 0,
          opacity: alpha,
        }),
        txt(
          lit ? 'Var 1' : '?',
          cx,
          -50,
          28,
          lit ? COSMOS.ink : COSMOS.dim,
          'mono',
          'center',
        ).opacity(alpha),
        txt(
          `q${i + 1}k${i + 1}`,
          cx,
          52,
          26,
          lit ? ROLE.attn : COSMOS.dim,
          'mono',
          'center',
        ).opacity(alpha),
      );
    }

    nodes.push(
      txt(
        `sum of ${n} coordinate products  ->  variance = ${n}`,
        0,
        185,
        34,
        ROLE.attn,
        'mono',
        'center',
      )
        .glow(7, ROLE.attn)
        .opacity(alpha),
      txt(
        eqOn > 0.35
          ? 'For width d_k:  Var = d_k   ·   Std = sqrt(d_k)'
          : 'How does variance grow with d_k?',
        0,
        280,
        34,
        ROLE.query,
        'mono',
        'center',
      )
        .glow(eqOn > 0.35 ? 8 : 0, ROLE.query)
        .opacity(alpha),
      txt(
        'Dividing by sqrt(d_k) keeps score spread steady under these assumptions',
        0,
        385,
        26,
        COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
    );
    return nodes;
  });

  // VIEW 3: d_k = 64 raw [12.4, 9.1, 3.8] unscaled vs divided by 8
  const raw64 = [12.4, 9.1, 3.8];
  const unscaled64 = stableSoftmax(raw64);
  const scaleLayer = guardedDynamic(vScale, (alpha) => {
    const sp = scaleProg.value;
    const div = 1 + sp * 7;
    const scaled64 = stableSoftmax(raw64.map((v) => v / div));
    const shareTxt = (v) => (v > 0 && v < 0.0005 ? '<0.001' : fmt(v, 3));

    const barLeft = -110;
    const barW = 860;
    const nodes = [
      txt(
        'Head width d_k = 64  (sqrt(64) = 8)',
        220,
        -355,
        32,
        ROLE.query,
        'mono',
        'center',
      ).opacity(alpha),
      txt('raw score', -445, -245, 28, COSMOS.muted, 'mono', 'center').opacity(alpha),
      txt('0%', barLeft, -245, 26, COSMOS.dim, 'mono', 'center').opacity(alpha),
      txt('100%', barLeft + barW, -245, 26, COSMOS.dim, 'mono', 'center').opacity(alpha),
      line([barLeft, -205], [barLeft, 265], { stroke: '#4d608f', width: 2 }).opacity(alpha),
    ];

    raw64.forEach((v, i) => {
      const y = -120 + i * 165;
      const bw = Math.max(8, barW * unscaled64[i]);
      nodes.push(
        txt(`key ${i + 1}`, -740, y, 32, COSMOS.ink, 'mono', 'left').opacity(alpha),
        txt(fmt(v, 1), -445, y, 32, ROLE.query, 'mono', 'center').opacity(alpha),
        // Unscaled blue bar (top)
        txt(
          shareTxt(unscaled64[i]),
          barLeft - 24,
          y - 22,
          26,
          ROLE.stream,
          'mono',
          'right',
        ).opacity(alpha),
        lumBar(barLeft + bw / 2, y - 22, bw, 30, {
          color: ROLE.stream,
          fillOpacity: 0.45,
          strokeWidth: 2.2,
          glow: 7,
          opacity: alpha,
        }),
      );
      if (sp > 0.02) {
        const sw = Math.max(8, barW * scaled64[i]);
        nodes.push(
          txt(shareTxt(scaled64[i]), barLeft - 24, y + 26, 26, ROLE.valid, 'mono', 'right').opacity(
            alpha,
          ),
          lumBar(barLeft + sw / 2, y + 26, sw, 30, {
            color: ROLE.valid,
            fillOpacity: 0.52,
            strokeWidth: 2.4,
            glow: 9,
            opacity: alpha,
          }),
        );
      }
    });

    nodes.push(
      txt('Blue: unscaled scores', -420, 355, 30, ROLE.stream, 'mono', 'center').opacity(alpha),
      txt(
        sp > 0.02
          ? `Green: scores / ${fmt(div, sp > 0.95 ? 0 : 1)}  (order preserved, softer gaps)`
          : 'Ready to divide by 8',
        260,
        355,
        30,
        ROLE.valid,
        'mono',
        'center',
      )
        .glow(sp > 0.9 ? 7 : 0, ROLE.valid)
        .opacity(alpha),
    );
    return nodes;
  });

  // VIEW 4: Length growth 3 -> 6 tokens (quadratic grid vs linear rows)
  const lenLayer = guardedDynamic(vLen, (alpha) => {
    const lp = lenProg.value;
    const n = 3 + Math.round(3 * lp);
    const cell = 68;
    const gap = 8;
    const gLeft = -675;
    const gTop = -205;
    const nodes = [
      txt('Explicit Q x K score grid  (T^2)', -450, -270, 32, ROLE.attn, 'mono', 'center').opacity(
        alpha,
      ),
      txt('Projected rows per token  (T)', 415, -270, 32, ROLE.stream, 'mono', 'center').opacity(
        alpha,
      ),
    ];

    for (let r = 0; r < n; r++) {
      for (let k = 0; k < n; k++) {
        const isOrig = r < 3 && k < 3;
        nodes.push(
          lumBar(
            gLeft + k * (cell + gap) + cell / 2,
            gTop + r * (cell + gap) + cell / 2,
            cell,
            cell,
            {
              color: isOrig ? ROLE.stream : ROLE.attn,
              fillOpacity: isOrig ? 0.34 : 0.42,
              strokeWidth: 2,
              glow: isOrig ? 5 : 9,
              radius: 6,
              opacity: alpha,
            },
          ),
        );
      }
      const isOrigRow = r < 3;
      nodes.push(
        lumBar(415, gTop + r * (cell + gap) + cell / 2, 420, cell, {
          color: isOrigRow ? ROLE.stream : ROLE.valid,
          fillOpacity: isOrigRow ? 0.34 : 0.42,
          strokeWidth: 2,
          glow: isOrigRow ? 5 : 9,
          radius: 6,
          opacity: alpha,
        }),
      );
    }

    nodes.push(
      txt(`${n} x ${n} = ${n * n} pair scores`, -450, 320, 36, ROLE.query, 'mono', 'center')
        .glow(8, ROLE.query)
        .opacity(alpha),
      txt(`${n} rows  ·  fixed feature width`, 415, 320, 34, ROLE.valid, 'mono', 'center').opacity(
        alpha,
      ),
      txt(
        'Doubling T quadruples the explicit score grid while Q, K, V rows only double',
        0,
        405,
        26,
        COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
    );
    return nodes;
  });

  s.add(cinemaAtmosphere(ROLE.attn, ROLE.valid), title, rowLayer, varLayer, scaleLayer, lenLayer);

  // Beat 0: symmetric dot products -> asymmetric row softmax
  playCue(s, c, 'tr-matching-scale-cross', (d) => s.play(showCross.to(1, { duration: d })), {
    dur: 0.5,
  });
  playCue(s, c, 'tr-matching-scale-raw', (d) => s.play(showSelf.to(1, { duration: d })), {
    dur: 0.5,
  });
  playCue(s, c, 'tr-matching-scale-first', (d) => s.play(showRowA.to(1, { duration: d })), {
    dur: 0.5,
  });
  playCue(s, c, 'tr-matching-scale-shares', (d) => s.play(showRowB.to(1, { duration: d })), {
    dur: 0.6,
  });

  // Beat 1: variance growth
  playCue(
    s,
    c,
    'tr-matching-scale-voice-1',
    (d) => s.play(swapVis(vRow, vVar, Math.min(0.65, d * 0.45))),
    { dur: 0.7, offset: -0.65 },
  );
  playCue(s, c, 'tr-matching-scale-voice-1', (d) => s.play(varCount.to(8, { duration: d })), {
    dur: 1.4,
  });
  playCue(s, c, 'tr-matching-scale-variance', (d) => s.play(varEqShow.to(1, { duration: d })), {
    dur: 0.65,
  });

  // Beat 2: d_k = 64 scaling (swap cleanly right after beat-1-end!)
  const b2SwapAt = c.cue('tr-matching-scale-scaled').start - 12.2;
  c.at(Math.max(0.2, b2SwapAt - c.start), () => {
    s.play(swapVis(vVar, vScale, 0.65));
  });
  playCue(s, c, 'tr-matching-scale-scaled', (d) => s.play(scaleProg.to(1, { duration: d })), {
    dur: 1.3,
  });

  // Beat 3: sequence length 3 -> 6
  const b3SwapAt = Math.min(
    c.cue('tr-matching-scale-length').start - 0.75,
    c.cue('tr-matching-scale-scaled').end + 1.8,
  );
  c.at(Math.max(0.2, b3SwapAt - c.start), () => {
    s.play(swapVis(vScale, vLen, 0.65));
  });
  playCue(s, c, 'tr-matching-scale-length', (d) => s.play(lenProg.to(1, { duration: d })), {
    dur: 1.2,
  });
}
