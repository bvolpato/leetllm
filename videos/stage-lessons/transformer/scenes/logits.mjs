// Scene 9: logits: "Turn the final state into a vocabulary choice"
// View 1 (Beat 0): Final norm Z[2] -> final[2], dot product with result's output weights,
//         then all 6 vocabulary logits across VOCAB.
// View 2 (Beats 1-3): Stable shifted exponentials -> shared denominator -> conserved
//         probability ribbon -> greedy decoding question WITHHELD until greedy-choice (after)!
import { COSMOS, glowTex, guardedDynamic, heroTitle, txt } from '../../cinematic-kit.mjs';
import {
  MODEL,
  ROLE,
  VOCAB,
  WOUT,
  cinemaAtmosphere,
  fmt,
  lerpRow,
  lumBar,
  playCue,
  shareRibbon,
  sum,
  swapVis,
  vectorRow,
} from '../parts.mjs';

export default function logits(s, c) {
  const title = heroTitle(['Final state to', 'vocabulary choice'], {
    x: -850,
    y: -430,
    size: 48,
    lineHeight: 56,
    accent: ROLE.valid,
  });

  const eq = glowTex('z_w = w_{\\text{out}} \\cdot \\operatorname{LN}(Z_2)', {
    x: 470,
    y: -385,
    size: 38,
    color: ROLE.attn,
  });

  const vScore = s.value(1);
  const vProbs = s.value(0);

  // View 1 channels
  const normProg = s.value(0);
  const prodProg = s.value(0); // 0 -> 4 products for result
  const allLogits = s.value(0); // 0 -> 6 vocab logits

  // View 2 channels
  const expProg = s.value(0); // 0 -> 6 shifted exponentials + denominator
  const shareProg = s.value(0); // 0 -> 6 probability shares
  const greedyReveal = s.value(0); // STRICTLY AFTER greedy-choice!

  const resProds = MODEL.final[2].map((v, i) => v * WOUT[3][i]);
  const vocabColors = [ROLE.stream, ROLE.mask, ROLE.attn, ROLE.valid, ROLE.pos, ROLE.query];

  // VIEW 1: Final normalization + dot products -> 6 vocabulary logits
  const scoreLayer = guardedDynamic(vScore, (alpha) => {
    const np = normProg.value;
    const pp = prodProg.value;
    const lp = allLogits.value;
    const pCnt = Math.min(4, Math.floor(pp + 1e-6));
    const lCnt = Math.min(6, Math.floor(lp + 1e-6));
    const curState = lerpRow(MODEL.Z[2], MODEL.final[2], np);
    const nodes = [];

    nodes.push(
      vectorRow({
        cx: 95,
        cy: -235,
        values: curState,
        cellW: 162,
        cellH: 72,
        gap: 16,
        color: ROLE.query,
        digits: 3,
        label: np > 0.5 ? 'final norm' : 'block Z2',
        opacity: alpha,
      }),
      vectorRow({
        cx: 95,
        cy: -105,
        values: WOUT[3],
        cellW: 162,
        cellH: 72,
        gap: 16,
        color: ROLE.attn,
        digits: 2,
        label: 'W_out[result]',
        opacity: alpha,
      }),
      vectorRow({
        cx: 95,
        cy: 25,
        values: resProds.map((v, i) => (i < pCnt ? v : '?')),
        cellW: 162,
        cellH: 72,
        gap: 16,
        color: ROLE.valid,
        digits: 3,
        label: pCnt === 4 ? `sum = ${fmt(MODEL.logits[3], 3)}` : 'products',
        opacity: alpha,
      }),
      txt('All six vocabulary logits', 0, 148, 28, ROLE.attn, 'mono', 'center').opacity(alpha),
    );

    const colW = 240;
    const startX = -600;
    VOCAB.forEach((word, i) => {
      const cx = startX + i * colW;
      const shown = i < lCnt || (i === 3 && pCnt === 4);
      nodes.push(
        lumBar(cx, 240, 210, 74, {
          color: shown ? ROLE.attn : ROLE.rule,
          fillOpacity: shown ? 0.24 : 0.08,
          strokeWidth: shown ? 2.4 : 1.5,
          glow: shown ? 7 : 0,
          opacity: alpha,
        }),
        txt(
          shown ? fmt(MODEL.logits[i], 3) : '?',
          cx,
          240,
          30,
          shown ? COSMOS.ink : COSMOS.dim,
          'mono',
          'center',
        ).opacity(alpha),
        txt(word, cx, 314, 26, COSMOS.muted, 'mono', 'center').opacity(alpha),
      );
    });

    return nodes;
  });

  // VIEW 2: Stable softmax exponentials -> conserved probability strip -> greedy winner
  const probsLayer = guardedDynamic(vProbs, (alpha) => {
    const ep = expProg.value;
    const sp = shareProg.value;
    const gr = greedyReveal.value;
    const eCnt = Math.min(6, Math.floor(ep + 1e-6));
    const sCnt = Math.min(6, Math.floor(sp + 1e-6));
    const nodes = [];

    nodes.push(
      txt('exp(logit - max logit)', 0, -250, 28, ROLE.attn, 'mono', 'center').opacity(alpha),
    );

    const colW = 240;
    const startX = -600;
    VOCAB.forEach((word, i) => {
      const cx = startX + i * colW;
      const shown = i < eCnt;
      const isWinner = gr > 0.5 && i === MODEL.choice;
      nodes.push(
        txt(word, cx, -190, 26, isWinner ? ROLE.valid : COSMOS.muted, 'mono', 'center').opacity(
          alpha,
        ),
        lumBar(cx, -118, 210, 74, {
          color: isWinner ? ROLE.valid : shown ? ROLE.attn : ROLE.rule,
          fillOpacity: isWinner ? 0.42 : shown ? 0.2 : 0.08,
          strokeWidth: isWinner ? 3 : 1.8,
          glow: isWinner ? 12 : shown ? 6 : 0,
          opacity: alpha,
        }),
        txt(
          shown ? fmt(MODEL.exps[i], 3) : '?',
          cx,
          -118,
          30,
          isWinner ? COSMOS.ink : shown ? ROLE.attn : COSMOS.dim,
          'mono',
          'center',
        ).opacity(alpha),
      );
    });

    const partialDenom = sum(MODEL.exps.slice(0, eCnt));
    nodes.push(
      txt(`shared denominator = ${fmt(partialDenom, 3)}`, 0, -12, 32, ROLE.query, 'mono', 'center')
        .glow(7, ROLE.query)
        .opacity(alpha),
      shareRibbon({
        x: 0,
        y: 110,
        width: 1380,
        height: 58,
        shares: MODEL.probs,
        colors: vocabColors,
        labels: VOCAB,
        count: sCnt,
        opacity: alpha,
      }),
    );

    // Greedy decoding question (neutral until AFTER greedy-choice!)
    if (gr < 0.25) {
      nodes.push(
        txt('Which token does greedy decoding choose?', 0, 325, 36, ROLE.query, 'serif', 'center')
          .glow(8, ROLE.query)
          .opacity((1 - gr * 4) * alpha),
      );
    } else {
      nodes.push(
        txt(
          `Greedy choice:  "${VOCAB[MODEL.choice]}"   (ID ${MODEL.choice} · logit ${fmt(MODEL.logits[MODEL.choice], 3)})`,
          0,
          325,
          36,
          ROLE.valid,
          'mono',
          'center',
        )
          .glow(10, ROLE.valid)
          .opacity(gr * alpha),
      );
    }

    return nodes;
  });

  s.add(cinemaAtmosphere(ROLE.valid, ROLE.attn), title, eq, scoreLayer, probsLayer);

  // Beat 0: final norm -> result products -> all 6 logits
  playCue(s, c, 'final-normalization', (d) => s.play(normProg.to(1, { duration: d })), {
    dur: 0.7,
  });
  playCue(s, c, 'result-product', (d) => s.play(prodProg.to(4, { duration: d })), { dur: 1.0 });
  playCue(s, c, 'vocabulary-products', (d) => s.play(allLogits.to(6, { duration: d })), {
    dur: 1.0,
  });

  // Beat 1: swap cleanly to softmax probabilities view
  playCue(
    s,
    c,
    'next-token-probabilities-b2-1',
    (d) => s.play(swapVis(vScore, vProbs, Math.min(0.65, d * 0.45))),
    { dur: 0.7, offset: -0.65 },
  );
  playCue(s, c, 'next-token-probabilities-b2-1', (d) => s.play(expProg.to(6, { duration: d })), {
    dur: 1.0,
  });
  playCue(s, c, 'probability-shares', (d) => s.play(shareProg.to(6, { duration: d })), {
    dur: 1.0,
  });

  // Beat 3: reveal greedy winner strictly AFTER greedy-choice!
  playCue(s, c, 'greedy-choice', (d) => s.play(greedyReveal.to(1, { duration: d })), {
    after: true,
    dur: 0.65,
  });
}
