// Scene 4: mask: "Build one query's legal read"
// View 1 (Beat 0): Normalized "the" projects through W_Q to query q.
// View 2 (Beat 1): Query scores visible keys function, returns, the via dot / sqrt(2).
// View 3 (Beats 2-3): 4th training target enters -> prediction question WITHHELD ->
//         causal mask sets score to -inf (exp=0) -> legal weights sum to 1.
import { arrow } from 'vizmatic/stage';
import {
  COSMOS,
  glowDot,
  glowTex,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  txt,
} from '../../cinematic-kit.mjs';
import {
  FEEDBACK,
  MODEL,
  ROLE,
  TOK_COLORS,
  WORDS,
  WQ,
  cinemaAtmosphere,
  fmt,
  lumBar,
  playCue,
  shareRibbon,
  sum,
  swapVis,
  vectorRow,
} from '../parts.mjs';

export default function mask(s, c) {
  const title = heroTitle(["Build one query's", 'legal read'], {
    x: -850,
    y: -430,
    size: 48,
    lineHeight: 56,
    accent: ROLE.mask,
  });

  const vProj = s.value(1);
  const vScores = s.value(0);
  const vMask = s.value(0);

  // View 1 state
  const projProg = s.value(0); // 0 -> 4 products + final q
  const products0 = MODEL.N[2].map((v, j) => v * WQ[j][0]);

  // View 2 state
  const scoreProg = s.value(0); // 0 -> 3 visible keys scored

  // View 3 state (STRICT prediction withholding!)
  const trainKeyIn = s.value(0); // Beat 2: 4th token finite score appears + question
  const maskedIn = s.value(0); // Beat 3 AFTER causal-mask: score -> -inf, exp -> 0
  const weightsIn = s.value(0); // Beat 3 AFTER causal-weights: legal weights sum to 1
  const shiftedExps = MODEL.scores[2].map((v) => Math.exp(v - Math.max(...MODEL.scores[2])));
  const denom = sum(shiftedExps);

  // VIEW 1: Query projection Q = N * W_Q
  const projLayer = guardedDynamic(vProj, (alpha) => {
    const pp = projProg.value;
    const count = Math.min(4, Math.floor(pp + 1e-6));
    const nodes = [];

    nodes.push(
      vectorRow({
        cx: 90,
        cy: -210,
        values: MODEL.N[2],
        cellW: 165,
        cellH: 74,
        gap: 16,
        color: ROLE.query,
        digits: 3,
        label: 'norm(the)',
        opacity: alpha,
      }),
      vectorRow({
        cx: 90,
        cy: -65,
        values: WQ.map((r) => r[0]),
        cellW: 165,
        cellH: 74,
        gap: 16,
        color: ROLE.attn,
        digits: 2,
        label: 'W_Q col 1',
        opacity: alpha,
      }),
      vectorRow({
        cx: 90,
        cy: 80,
        values: products0.map((v, j) => (j < count ? v : '?')),
        cellW: 165,
        cellH: 74,
        gap: 16,
        color: ROLE.valid,
        digits: 3,
        label: 'products',
        highlightIdx: pp > 0.05 && count < 4 ? count : -1,
        opacity: alpha,
      }),
    );

    const partial = sum(products0.slice(0, count));
    nodes.push(
      txt(
        count === 4 ? `q1 = ${fmt(MODEL.Q[2][0], 3)}` : `partial sum = ${fmt(partial, 3)}`,
        -250,
        255,
        36,
        ROLE.valid,
        'mono',
        'center',
      )
        .glow(7, ROLE.valid)
        .opacity(alpha),
    );

    if (pp > 3.6) {
      const qOp = Math.min(1, (pp - 3.6) / 0.4) * alpha;
      nodes.push(
        vectorRow({
          cx: 410,
          cy: 255,
          values: MODEL.Q[2],
          cellW: 165,
          cellH: 74,
          gap: 16,
          color: ROLE.attn,
          digits: 3,
          label: 'query q',
          opacity: qOp,
        }),
      );
    }

    nodes.push(
      txt(
        'Value projection V keeps all 4 normalized coordinates intact',
        0,
        395,
        28,
        COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
    );

    return nodes;
  });

  // VIEW 2: Scaled dot products against visible keys
  const scoresLayer = guardedDynamic(vScores, (alpha) => {
    const sp = scoreProg.value;
    const count = Math.min(3, Math.floor(sp + 1e-6));
    const active = Math.min(2, count);
    const nodes = [];

    // Left: query q for "the"
    nodes.push(
      txt('query q ("the")', -610, -140, 30, ROLE.query, 'mono', 'center').opacity(alpha),
      vectorRow({
        cx: -610,
        cy: -55,
        values: MODEL.Q[2],
        cellW: 150,
        cellH: 74,
        gap: 14,
        color: ROLE.query,
        digits: 3,
        opacity: alpha,
      }),
      txt('divide by sqrt(2)', -610, 65, 28, COSMOS.muted, 'mono', 'center').opacity(alpha),
    );

    // Center & Right: 3 visible keys -> scaled scores
    nodes.push(
      txt('visible keys (d_k = 2)', 140, -280, 30, ROLE.attn, 'mono', 'center').opacity(alpha),
      txt('score / sqrt(2)', 640, -280, 30, ROLE.valid, 'mono', 'center').opacity(alpha),
    );

    WORDS.forEach((word, i) => {
      const y = -175 + i * 135;
      const doneKey = i < count;
      const isCur = i === active && sp > 0.05;
      nodes.push(
        glowingTrail(
          [
            [-420, -55],
            [-275, y],
          ],
          {
            color: isCur ? ROLE.query : ROLE.attn,
            width: isCur ? 3.5 : 2,
            glow: isCur ? 9 : 3,
            core: false,
            opacity: (isCur ? 0.9 : 0.35) * alpha,
          },
        ),
        vectorRow({
          cx: 140,
          cy: y,
          values: MODEL.K[i],
          cellW: 148,
          cellH: 74,
          gap: 14,
          color: TOK_COLORS[i],
          digits: 3,
          label: word,
          opacity: alpha,
        }),
        arrow([330, y], [505, y], {
          stroke: doneKey ? ROLE.valid : ROLE.rule,
          width: 3.2,
          tip: 13,
        }).opacity(alpha),
        lumBar(640, y, 210, 74, {
          color: doneKey ? ROLE.valid : ROLE.rule,
          fillOpacity: doneKey ? 0.28 : 0.1,
          strokeWidth: doneKey ? 2.6 : 1.6,
          glow: doneKey ? 9 : 0,
          opacity: alpha,
        }),
        txt(
          doneKey ? fmt(MODEL.scores[2][i], 3) : '?',
          640,
          y,
          32,
          doneKey ? ROLE.valid : COSMOS.dim,
          'mono',
          'center',
        ).opacity(alpha),
      );
    });

    // Bottom steady formula (avoids brief flashing across 3 keys)
    nodes.push(
      txt('score(q, k) = (q1 * k1 + q2 * k2) / sqrt(2)', 60, 295, 30, ROLE.query, 'mono', 'center')
        .glow(6, ROLE.query)
        .opacity((0.35 + 0.65 * Math.min(1, sp)) * alpha),
    );

    return nodes;
  });

  // VIEW 3: Causal mask (-inf -> 0) and stable softmax shares
  const maskLayer = guardedDynamic(vMask, (alpha) => {
    const tk = trainKeyIn.value;
    const mk = maskedIn.value;
    const wt = weightsIn.value;
    const nodes = [];

    const colXs = [-430, -140, 150, 440];
    const colNames = [...WORDS, tk > 0.3 ? '4th target' : 'next slot'];
    const rowYScore = -175;
    const rowYExp = -25;

    colNames.forEach((lbl, i) => {
      const col = i === 3 ? (mk > 0.4 ? ROLE.mask : ROLE.query) : TOK_COLORS[i];
      nodes.push(txt(lbl, colXs[i], -255, 28, col, 'mono', 'center').opacity(alpha));
    });

    nodes.push(
      txt('score', -625, rowYScore, 28, ROLE.query, 'mono', 'right').opacity(alpha),
      txt('exp(s - max)', -625, rowYExp, 26, ROLE.pos, 'mono', 'right').opacity(alpha),
    );

    // Score row
    for (let i = 0; i < 4; i++) {
      const isFuture = i === 3;
      const valStr = !isFuture
        ? fmt(MODEL.scores[2][i], 3)
        : mk > 0.45
          ? '-inf'
          : tk > 0.35
            ? fmt(FEEDBACK.scores[2][3], 3)
            : 'absent';
      const col = isFuture ? (mk > 0.45 ? ROLE.mask : ROLE.query) : ROLE.query;
      nodes.push(
        lumBar(colXs[i], rowYScore, 220, 76, {
          color: col,
          fillOpacity: isFuture && mk > 0.45 ? 0.36 : 0.18,
          strokeWidth: isFuture && (tk > 0.35 || mk > 0.45) ? 3 : 1.8,
          glow: isFuture ? 10 : 5,
          opacity: alpha,
        }),
        txt(
          valStr,
          colXs[i],
          rowYScore,
          32,
          isFuture && mk > 0.45 ? ROLE.mask : COSMOS.ink,
          'mono',
          'center',
        ).opacity(alpha),
      );
    }

    // Exponential row
    for (let i = 0; i < 4; i++) {
      const isFuture = i === 3;
      const valStr = isFuture
        ? mk > 0.45
          ? '0.000'
          : '?'
        : wt > 0.15
          ? fmt(shiftedExps[i], 3)
          : '?';
      const col = isFuture ? (mk > 0.45 ? ROLE.mask : ROLE.rule) : ROLE.pos;
      nodes.push(
        lumBar(colXs[i], rowYExp, 220, 76, {
          color: col,
          fillOpacity: 0.18,
          strokeWidth: 2,
          glow: isFuture && mk > 0.45 ? 10 : 4,
          opacity: alpha,
        }),
        txt(
          valStr,
          colXs[i],
          rowYExp,
          32,
          isFuture && mk > 0.45 ? ROLE.mask : col,
          'mono',
          'center',
        ).opacity(alpha),
      );
    }

    // Withheld prediction prompt during Beat 2 (vanishes once causal-mask fires!)
    if (tk > 0.3 && mk < 0.2) {
      nodes.push(
        txt(
          'How much weight should the future 4th key receive?',
          0,
          145,
          34,
          ROLE.query,
          'serif',
          'center',
        )
          .glow(8, ROLE.query)
          .opacity(tk * (1 - mk * 5) * alpha),
      );
    }

    // Denominator + conserved probability ribbon AFTER causal-weights!
    if (mk > 0.4) {
      nodes.push(
        txt(
          wt > 0.35 ? `shared denominator = ${fmt(denom, 3)}` : 'e^(-inf) = 0  (future blocked)',
          0,
          96,
          30,
          wt > 0.35 ? ROLE.valid : ROLE.mask,
          'mono',
          'center',
        )
          .glow(7, wt > 0.35 ? ROLE.valid : ROLE.mask)
          .opacity(mk * alpha),
      );
    }

    if (wt > 0.1) {
      nodes.push(
        shareRibbon({
          x: 0,
          y: 235,
          width: 1180,
          height: 54,
          shares: [...MODEL.weights[2], 0],
          colors: [...TOK_COLORS.slice(0, 3), ROLE.mask],
          labels: [...WORDS, 'future'],
          count: 4,
          opacity: wt * alpha,
        }),
        txt(
          'Legal attention weights sum to 1.000  ·  future mass = 0',
          0,
          395,
          28,
          ROLE.valid,
          'mono',
          'center',
        )
          .glow(6, ROLE.valid)
          .opacity(wt * alpha),
      );
    }

    return nodes;
  });

  const formula = glowTex(
    '\\operatorname{softmax}\\!\\left(\\frac{QK^\\top}{\\sqrt{2}} + M\\right)',
    {
      x: 470,
      y: -385,
      size: 36,
      color: ROLE.attn,
    },
  );

  s.add(cinemaAtmosphere(ROLE.mask, ROLE.attn), title, formula, projLayer, scoresLayer, maskLayer);

  // Beat 0: Query projection
  playCue(s, c, 'query-project', (d) => s.play(projProg.to(4, { duration: d })), { dur: 1.6 });

  // Beat 1: Swap cleanly to visible key scoring
  playCue(s, c, 'key-scores', (d) => s.play(swapVis(vProj, vScores, Math.min(0.65, d * 0.4))), {
    dur: 0.7,
    offset: -0.65,
  });
  playCue(s, c, 'key-scores', (d) => s.play(scoreProg.to(3, { duration: d })), { dur: 1.8 });

  // Beat 2: Swap cleanly to 4-token training mask view (withhold answer!)
  playCue(s, c, 'training-key', (d) => s.play(swapVis(vScores, vMask, Math.min(0.65, d * 0.45))), {
    dur: 0.7,
    offset: -0.5,
  });
  playCue(s, c, 'training-key', (d) => s.play(trainKeyIn.to(1, { duration: d })), { dur: 0.8 });

  // Beat 3: Spoken reveals AFTER causal-mask and causal-weights!
  playCue(s, c, 'causal-mask', (d) => s.play(maskedIn.to(1, { duration: d })), {
    after: true,
    dur: 0.6,
  });
  playCue(s, c, 'causal-weights', (d) => s.play(weightsIn.to(1, { duration: d })), {
    after: true,
    dur: 0.85,
  });
  void glowDot;
}
