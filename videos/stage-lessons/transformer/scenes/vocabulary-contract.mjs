// Scene 19: vocabulary-contract: "How do four features score six words?"
// View 1 (Beat 0): Hidden states [3, 4] project through W_out into [3, 6] vocabulary logits.
// View 2 (Beat 1): Weight tying physically merges two 6x4 tables (48 weights) into one shared 6x4 table (24).
// View 3 (Beat 2): Live temperature spectrum smoothly reshapes probabilities across T = 0.5 -> 1.0 -> 2.0,
//         contrasting logits/T before softmax against probability rescaling cancellation.
import { arrow, line } from 'vizmatic/stage';
import { COSMOS, glowTex, guardedDynamic, heroTitle, txt } from '../../cinematic-kit.mjs';
import {
  EMBED,
  MODEL,
  ROLE,
  VOCAB,
  WOUT,
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

export default function vocabularyContract(s, c) {
  const title = heroTitle(['Vocabulary head:', 'tying & temperature'], {
    x: -850,
    y: -430,
    size: 48,
    lineHeight: 56,
    accent: ROLE.valid,
  });

  const vShape = s.value(1);
  const vTie = s.value(0);
  const vTemp = s.value(0);

  const logitReveal = s.value(0);
  const tieProg = s.value(0); // 0 = two separate tables (48), 1 = one tied table (24)
  const tempVal = s.value(0.5); // 0.5 -> 1.0 -> 2.0
  const cancelShow = s.value(0);

  const allScores = MODEL.final.map((r) => WOUT.map((w) => dotProduct(w, r)));

  // VIEW 1: [3, 4] -> [3, 6] vocabulary logits
  const shapeLayer = guardedDynamic(vShape, (alpha) => {
    const lr = logitReveal.value;
    const shownCells = Math.ceil(18 * lr);
    let idx = 0;
    const scoreStrs = allScores.map((row) =>
      row.map((v) => {
        const cur = idx++;
        return cur < shownCells ? fmt(v, 2) : '·';
      }),
    );

    return [
      txt(
        'Vocabulary head maps [B, T, d] -> [B, T, V]',
        180,
        -355,
        28,
        COSMOS.muted,
        'mono',
        'center',
      ).opacity(alpha),
      txt('Hidden states  [3, 4]', -490, -210, 28, ROLE.stream, 'mono', 'center').opacity(alpha),
      glowMatrix({
        cx: -490,
        cy: 15,
        rows: 3,
        cols: 4,
        cellW: 118,
        cellH: 82,
        gap: 10,
        values: MODEL.final.map((r) => r.map((v) => fmt(v, 2))),
        rowLabels: ['t0', 't1', 't2'],
        highlight: (r) => r === 2,
        colors: MODEL.final.map((r, ri) => r.map(() => (ri === 2 ? ROLE.query : ROLE.stream))),
        fontSize: 26,
        opacity: alpha,
      }),
      arrow([-185, 15], [-55, 15], { stroke: ROLE.valid, width: 4, tip: 15 })
        .glow(8, ROLE.valid)
        .opacity(alpha),
      txt('W_out', -120, -28, 26, ROLE.valid, 'mono', 'center').opacity(alpha),
      txt('Vocabulary logits  [3, 6]', 405, -210, 28, ROLE.valid, 'mono', 'center').opacity(alpha),
      glowMatrix({
        cx: 405,
        cy: 15,
        rows: 3,
        cols: 6,
        cellW: 118,
        cellH: 82,
        gap: 8,
        values: scoreStrs,
        colLabels: ['fn', 'ret', 'the', 'res', 'No', 'val'],
        highlight: (r) => r === 2,
        colors: allScores.map((r, ri) => r.map(() => (ri === 2 ? ROLE.valid : ROLE.attn))),
        fontSize: 26,
        opacity: alpha,
      }),
      txt(
        'Projecting just row 2 or slicing the last row of [3, 6] gives identical next-token scores',
        0,
        355,
        28,
        COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
    ];
  });

  // VIEW 2: Weight tying sequentially fades W_out away (0..0.42), then glides EMBED to center (0.45..0.85) -> zero overlap!
  const tieLayer = guardedDynamic(vTie, (alpha) => {
    const tp = tieProg.value;
    const isTied = tp > 0.7;
    const outFade = Math.max(0, 1 - tp / 0.42);
    const slideT = Math.max(0, Math.min(1, (tp - 0.45) / 0.4));
    const embCx = -400 * (1 - slideT);
    const outCx = 400;
    const nodes = [
      txt(
        isTied
          ? 'Weight tying: one shared 6 x 4 table'
          : 'Separate tables: 6 x 4 input + 6 x 4 output',
        0,
        -275,
        34,
        isTied ? ROLE.valid : ROLE.query,
        'mono',
        'center',
      )
        .glow(7, isTied ? ROLE.valid : ROLE.query)
        .opacity(alpha),
      glowMatrix({
        cx: embCx,
        cy: 20,
        rows: 6,
        cols: 4,
        cellW: 108,
        cellH: 52,
        gap: 8,
        values: EMBED.map((r) => r.map((v) => fmt(v, 1))),
        colors: EMBED.map((r) => r.map(() => ROLE.stream)),
        fontSize: 26,
        bracketColor: ROLE.stream,
        opacity: alpha,
      }),
    ];

    if (outFade > 0.04) {
      nodes.push(
        glowMatrix({
          cx: outCx,
          cy: 20,
          rows: 6,
          cols: 4,
          cellW: 108,
          cellH: 52,
          gap: 8,
          values: WOUT.map((r) => r.map((v) => fmt(v, 1))),
          colors: WOUT.map((r) => r.map(() => ROLE.mask)),
          fontSize: 26,
          bracketColor: ROLE.mask,
          opacity: outFade * alpha,
        }),
        txt('Input lookup', embCx, -210, 28, ROLE.stream, 'mono', 'center').opacity(
          outFade * alpha,
        ),
        txt('Output scoring', outCx, -210, 28, ROLE.mask, 'mono', 'center').opacity(
          outFade * alpha,
        ),
      );
    } else if (tp > 0.85) {
      const aOp = ((tp - 0.85) / 0.15) * alpha;
      nodes.push(
        txt('Look up token ID', -530, 20, 30, ROLE.stream, 'mono', 'right').opacity(aOp),
        arrow([-500, 20], [-290, 20], { stroke: ROLE.stream, width: 4, tip: 15 })
          .glow(8, ROLE.stream)
          .opacity(aOp),
        txt('Score all 6 words', 530, 20, 30, ROLE.mask, 'mono', 'left').opacity(aOp),
        arrow([500, 20], [290, 20], { stroke: ROLE.mask, width: 4, tip: 15 })
          .glow(8, ROLE.mask)
          .opacity(aOp),
      );
    }

    nodes.push(
      txt(
        isTied ? '24 stored weights  (saves 1 V x d table!)' : '48 stored weights  (24 + 24)',
        0,
        330,
        36,
        isTied ? ROLE.valid : ROLE.query,
        'mono',
        'center',
      )
        .glow(8, isTied ? ROLE.valid : ROLE.query)
        .opacity(alpha),
    );
    return nodes;
  });

  // VIEW 3: Live temperature T = 0.5 -> 1.0 -> 2.0 on fixed MODEL.logits
  const tempEq = glowTex('P_i = \\frac{e^{z_i / T}}{\\sum_j e^{z_j / T}}', {
    x: 495,
    y: -380,
    size: 38,
    color: ROLE.attn,
  });

  const tempLayer = guardedDynamic(vTemp, (alpha) => {
    const T = Math.max(0.25, tempVal.value);
    const probs = stableSoftmax(MODEL.logits.map((z) => z / T));
    const cs = cancelShow.value;
    const baseY = 195;
    const maxH = 320;
    const barXs = [-625, -375, -125, 125, 375, 625];
    const barCols = [ROLE.stream, ROLE.mask, ROLE.attn, ROLE.valid, ROLE.pos, ROLE.query];

    const nodes = [
      tempEq.opacity(alpha),
      txt(
        `Temperature  T = ${fmt(T, 2)}   (fixed logits / ${fmt(T, 2)})`,
        -120,
        -250,
        34,
        ROLE.query,
        'mono',
        'center',
      )
        .glow(8, ROLE.query)
        .opacity(alpha),
      line([-760, baseY], [760, baseY], { stroke: '#556894', width: 2.4 }).opacity(alpha),
    ];

    VOCAB.forEach((word, i) => {
      const bx = barXs[i];
      const h = Math.max(8, probs[i] * maxH);
      const col = barCols[i];
      nodes.push(
        lumBar(bx, baseY - h / 2, 120, h, {
          color: col,
          fillOpacity: i === 3 ? 0.52 : 0.36,
          strokeWidth: 2.5,
          glow: i === 3 ? 11 : 6,
          opacity: alpha,
        }),
        txt(pct(probs[i], 1), bx, baseY - h - 32, 28, col, 'mono', 'center').opacity(alpha),
        txt(word, bx, baseY + 42, 28, COSMOS.ink, 'mono', 'center').opacity(alpha),
      );
    });

    nodes.push(
      txt(
        cs > 0.35
          ? 'Dividing probabilities after softmax & renormalizing cancels out completely!'
          : 'T < 1 sharpens onto the top logit  ·  T > 1 spreads mass across alternatives',
        0,
        355,
        28,
        cs > 0.35 ? ROLE.mask : COSMOS.muted,
        'sans',
        'center',
      )
        .glow(cs > 0.35 ? 7 : 0, ROLE.mask)
        .opacity(alpha),
    );
    return nodes;
  });

  s.add(cinemaAtmosphere(ROLE.valid, ROLE.stream), title, shapeLayer, tieLayer, tempLayer);

  // Beat 0: [3,4] -> [3,6] logits
  playCue(
    s,
    c,
    'tr-vocabulary-contract-voice-0',
    (d) => s.play(logitReveal.to(0.65, { duration: d })),
    {
      dur: 1.2,
    },
  );
  playCue(s, c, 'tr-vocabulary-contract-shape', (d) => s.play(logitReveal.to(1, { duration: d })), {
    dur: 0.7,
  });

  // Beat 1: weight tying
  playCue(
    s,
    c,
    'tr-vocabulary-contract-voice-1',
    (d) => s.play(swapVis(vShape, vTie, Math.min(0.65, d * 0.35))),
    { dur: 0.7 },
  );
  playCue(s, c, 'tr-vocabulary-contract-tying', (d) => s.play(tieProg.to(1, { duration: d })), {
    dur: 1.0,
  });

  // Beat 2: temperature T=0.5 -> T=1.0 -> T=2.0 (swap cleanly right after beat-1-end!)
  const b2Swap = c.cue('tr-vocabulary-contract-voice-2').start - 8.5;
  c.at(Math.max(0.2, b2Swap - c.start), () => {
    s.play(swapVis(vTie, vTemp, 0.65));
  });
  playCue(s, c, 'tr-vocabulary-contract-voice-2', (d) => s.play(tempVal.to(1.0, { duration: d })), {
    dur: 0.85,
  });
  playCue(s, c, 'tr-vocabulary-contract-warm', (d) => s.play(tempVal.to(2.0, { duration: d })), {
    dur: 1.0,
  });
  playCue(
    s,
    c,
    'tr-vocabulary-contract-temperature',
    (d) => s.play(cancelShow.to(1, { duration: d })),
    { dur: 0.65 },
  );
}
