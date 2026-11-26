// Scene 10: feedback: "Feed the chosen ID into the next real step"
// Persistent glowing token stream at top appends "result" (ID 3) at position 3.
// View 1 (Beat 0): Re-embed result + position 3 -> FEEDBACK_INPUT[3].
// View 2 (Beat 1): 4 legal attention weights -> mixture -> residual/FFN/final norm -> FEEDBACK.final[3].
// View 3 (Beats 2-3): Equal-unit (coord 3 vs coord 4) tie diagonal separating result vs value +
//         6-word logit spectrum. Strictly WITHHOLDS step-2 point & winner until feedback-point / feedback-choice!
import { line } from 'vizmatic/stage';
import { COSMOS, glowingTrail, guardedDynamic, heroTitle, txt } from '../../cinematic-kit.mjs';
import {
  EMBED,
  FEEDBACK,
  FEEDBACK_IDS,
  FEEDBACK_INPUT,
  MODEL,
  ROLE,
  TOK_COLORS,
  VOCAB,
  cinemaAtmosphere,
  fmt,
  glowRing,
  lerpRow,
  lumBar,
  playCue,
  position,
  sum,
  swapVis,
  vectorPlane,
  vectorRow,
} from '../parts.mjs';

export default function feedback(s, c) {
  const title = heroTitle(['Autoregressive loop:', 'feed the ID back'], {
    x: -850,
    y: -435,
    size: 40,
    lineHeight: 48,
    accent: ROLE.valid,
  });

  const appended = s.value(0);
  const vEmbed = s.value(1);
  const vBlock = s.value(0);
  const vDecide = s.value(0);

  const embProg = s.value(0); // 0 -> 4
  const mixProg = s.value(0); // 0 -> 4
  const stageIdx = s.value(0); // 0 -> 3
  const pointProg = s.value(0); // 0 -> 1 (STRICTLY at feedback-point!)
  const choiceReveal = s.value(0); // 0 -> 1 (STRICTLY AFTER feedback-choice!)

  // Persistent top token stream banner (floating pills, zero slide chrome)
  const topVis = s.value(1);
  const tokenLayer = guardedDynamic(topVis, (alpha) => {
    const app = appended.value > 0.45;
    const ch = choiceReveal.value > 0.5;
    const list = app
      ? [...FEEDBACK_IDS.map((id) => VOCAB[id]), ch ? VOCAB[FEEDBACK.choice] : '?']
      : ['function', 'returns', 'the', '?'];
    const step = 182;
    const startX = 335 - ((list.length - 1) * step) / 2;
    const y = -375;
    const nodes = [];
    list.forEach((word, i) => {
      const cx = startX + i * step;
      const isLast = i === list.length - 1;
      const isActive = app && i === 3;
      const col = isLast ? (ch ? ROLE.valid : COSMOS.dim) : isActive ? ROLE.query : ROLE.stream;
      nodes.push(
        lumBar(cx, y, 164, 62, {
          color: col,
          fillOpacity: isActive || (isLast && ch) ? 0.34 : 0.16,
          strokeWidth: isActive || (isLast && ch) ? 2.6 : 1.6,
          glow: isActive || (isLast && ch) ? 9 : 3,
          opacity: alpha,
        }),
        txt(
          word,
          cx,
          y,
          28,
          isActive || (isLast && ch) ? COSMOS.ink : col,
          'mono',
          'center',
        ).opacity(alpha),
      );
    });
    return nodes;
  });

  // VIEW 1: Append ID 3 -> EMBED[3] + position(3) -> FEEDBACK_INPUT[3]
  const embedLayer = guardedDynamic(vEmbed, (alpha) => {
    const cnt = Math.min(4, Math.floor(embProg.value + 1e-6));
    return [
      txt('result (ID 3) re-embedded at position 3', 0, -230, 32, ROLE.valid, 'mono', 'center')
        .glow(6, ROLE.valid)
        .opacity(alpha),
      vectorRow({
        cx: 95,
        cy: -115,
        values: EMBED[3],
        cellW: 165,
        cellH: 74,
        gap: 16,
        color: ROLE.stream,
        digits: 2,
        label: 'EMBED[3]',
        opacity: alpha,
      }),
      vectorRow({
        cx: 95,
        cy: 30,
        values: position(3),
        cellW: 165,
        cellH: 74,
        gap: 16,
        color: ROLE.pos,
        digits: 2,
        label: '+ pos(3)',
        opacity: alpha,
      }),
      vectorRow({
        cx: 95,
        cy: 185,
        values: FEEDBACK_INPUT[3].map((v, j) => (j < cnt ? v : '?')),
        cellW: 165,
        cellH: 76,
        gap: 16,
        color: ROLE.attn,
        digits: 2,
        label: 'new input',
        opacity: alpha,
      }),
      txt(
        'Fresh row for "result" joins the 4-token prefix; earlier rows stay unchanged',
        0,
        355,
        28,
        COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
    ];
  });

  // VIEW 2: 4-source causal mixture and block stages
  const stages = [FEEDBACK_INPUT[3], FEEDBACK.Y[3], FEEDBACK.Z[3], FEEDBACK.final[3]];
  const stageLabels = [
    '0. fresh input row',
    '1. input + attention update (Y3)',
    '2. contextual + FFN update (Z3)',
    '3. final normalized state (step 2)',
  ];

  const blockLayer = guardedDynamic(vBlock, (alpha) => {
    const cnt = Math.min(4, Math.floor(mixProg.value + 1e-6));
    const st = Math.min(3, Math.floor(stageIdx.value + 1e-6));
    const partialMix = [0, 1, 2, 3].map((j) =>
      sum(FEEDBACK.V.slice(0, cnt).map((row, i) => row[j] * FEEDBACK.weights[3][i])),
    );
    return [
      txt(
        'New query from "result" mixes 4 legal values',
        0,
        -240,
        30,
        ROLE.attn,
        'mono',
        'center',
      ).opacity(alpha),
      vectorRow({
        cx: 95,
        cy: -140,
        values: FEEDBACK.weights[3].map((v, i) => (i < cnt ? v : '?')),
        cellW: 165,
        cellH: 72,
        gap: 16,
        color: TOK_COLORS,
        digits: 3,
        label: '4 weights',
        opacity: alpha,
      }),
      vectorRow({
        cx: 95,
        cy: -10,
        values: partialMix,
        cellW: 165,
        cellH: 72,
        gap: 16,
        color: ROLE.query,
        digits: 3,
        label: 'mixture A3',
        opacity: alpha,
      }),
      txt(
        'Step 2 residual & FFN state (input -> Y3 -> Z3 -> final)',
        0,
        118,
        30,
        ROLE.valid,
        'mono',
        'center',
      )
        .glow(st === 3 ? 7 : 0, ROLE.valid)
        .opacity(alpha),
      vectorRow({
        cx: 95,
        cy: 215,
        values: stages[st],
        cellW: 165,
        cellH: 76,
        gap: 16,
        color: ROLE.valid,
        digits: 3,
        label: 'row state',
        opacity: alpha,
      }),
      txt(
        'Earlier 3 block outputs remain identically equal under the causal mask',
        0,
        365,
        26,
        COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
    ];
  });

  // VIEW 3: Pairwise decision boundary (coord 3 vs coord 4) + 6-word logit bars
  const plane3 = vectorPlane({
    originX: -720,
    originY: 310,
    scaleX: 350,
    scaleY: 350,
    xMin: 0,
    xMax: 1.5,
    yMin: 0,
    yMax: 1.5,
    xTicks: [0, 0.5, 1.0, 1.5],
    yTicks: [0, 0.5, 1.0, 1.5],
    tickDigits: 1,
    xLabel: 's3',
    yLabel: 's4',
  });

  const decideLayer = guardedDynamic(vDecide, (alpha) => {
    const mp = pointProg.value;
    const ch = choiceReveal.value;
    const known = mp > 0.85;
    const scores = known ? FEEDBACK.logits : MODEL.logits;

    const p0 = plane3.toScreen(0, 0);
    const p1 = plane3.toScreen(1.5, 1.5);
    const step1Pt = plane3.toScreen(MODEL.final[2][2], MODEL.final[2][3]);
    const resLbl = plane3.toScreen(0.3, 1.38);
    const valLbl = plane3.toScreen(1.18, 0.28);

    const nodes = [
      plane3.node.opacity(alpha),
      // Equal-score diagonal s3 = s4
      glowingTrail([p0, p1], {
        color: COSMOS.muted,
        width: 3,
        glow: 5,
        core: false,
        opacity: 0.75 * alpha,
      }),
      txt('result wins', resLbl[0], resLbl[1], 28, ROLE.attn, 'mono', 'center').opacity(alpha),
      txt('value wins', valLbl[0], valLbl[1], 28, ROLE.valid, 'mono', 'center').opacity(alpha),
      // Step 1 point ("the")
      glowRing(step1Pt[0], step1Pt[1], 12, ROLE.query, { width: 3, glow: 10, opacity: alpha }),
      txt('1: the', step1Pt[0] - 24, step1Pt[1] - 16, 26, ROLE.query, 'mono', 'right').opacity(
        alpha,
      ),
    ];

    // Step 2 point ("result") ONLY plotted at feedback-point!
    if (mp > 0.03) {
      const curCoords = lerpRow(
        [MODEL.final[2][2], MODEL.final[2][3]],
        [FEEDBACK.final[3][2], FEEDBACK.final[3][3]],
        mp,
      );
      const curPt = plane3.toScreen(curCoords[0], curCoords[1]);
      nodes.push(
        glowingTrail([step1Pt, curPt], {
          gradientColors: [ROLE.query, ROLE.valid],
          width: 4,
          glow: 10,
          opacity: alpha,
        }),
        glowRing(curPt[0], curPt[1], 14, ROLE.valid, { width: 3.5, glow: 14, opacity: alpha }),
      );
      if (known) {
        nodes.push(
          txt('2: res', curPt[0] + 24, curPt[1] + 24, 26, ROLE.valid, 'mono', 'left')
            .glow(7, ROLE.valid)
            .opacity(alpha),
        );
      }
    }

    // Right: Pairwise equations + 6-word logit bars
    const rx = 430;
    const zeroX = 435;
    nodes.push(
      txt(
        'z(result) = 0.5 s3 + s4   |   z(value) = 1.5 s3',
        rx,
        -225,
        26,
        ROLE.attn,
        'mono',
        'center',
      ).opacity(alpha),
      txt(
        known ? 'step 2 logits (all 6 words)' : 'step 1 logits shown  ·  predict step 2',
        rx,
        -155,
        28,
        known ? ROLE.valid : ROLE.query,
        'mono',
        'center',
      ).opacity(alpha),
      line([zeroX, -108], [zeroX, 245], { stroke: '#556894', width: 2 }).opacity(alpha),
    );

    VOCAB.forEach((word, i) => {
      const y = -80 + i * 56;
      const sc = scores[i];
      const w = Math.abs(sc) * 115;
      const isWin = ch > 0.5 && i === FEEDBACK.choice;
      const col = isWin ? ROLE.valid : i === 3 || i === 5 ? ROLE.attn : ROLE.stream;
      nodes.push(
        txt(word, 225, y, 26, isWin ? ROLE.valid : COSMOS.muted, 'mono', 'right').opacity(alpha),
        lumBar(sc >= 0 ? zeroX + w / 2 : zeroX - w / 2, y, Math.max(6, w), 30, {
          color: col,
          fillOpacity: isWin ? 0.65 : 0.34,
          strokeWidth: isWin ? 2.6 : 1.6,
          glow: isWin ? 11 : 4,
          opacity: alpha,
        }),
        txt(fmt(sc, 3), 795, y, 26, isWin ? ROLE.valid : COSMOS.ink, 'mono', 'right').opacity(
          alpha,
        ),
      );
    });

    // Bottom prediction / reveal readout (full-canvas centered so it stays well inside safe margins)
    const foot =
      ch > 0.5
        ? 'Selected token: "value" (ID 5)  ·  decoding loop continues'
        : known
          ? "Point 2 lands on value's side..."
          : 'Which token wins step 2 with fixed output weights?';
    nodes.push(
      txt(foot, 0, 412, 30, ch > 0.5 ? ROLE.valid : ROLE.query, 'mono', 'center')
        .glow(ch > 0.5 ? 9 : 6, ch > 0.5 ? ROLE.valid : ROLE.query)
        .opacity(alpha),
    );

    return nodes;
  });

  s.add(
    cinemaAtmosphere(ROLE.valid, ROLE.query),
    title,
    tokenLayer,
    embedLayer,
    blockLayer,
    decideLayer,
  );

  // Beat 0: append token ID 3 & re-embed
  playCue(s, c, 'append-token', (d) => s.play(appended.to(1, { duration: d })), { dur: 0.55 });
  playCue(s, c, 'feedback-embedding', (d) => s.play(embProg.to(4, { duration: d })), { dur: 1.0 });

  // Beat 1: swap cleanly to block calculation
  playCue(s, c, 'feedback-read', (d) => s.play(swapVis(vEmbed, vBlock, Math.min(0.65, d * 0.45))), {
    dur: 0.7,
    offset: -0.65,
  });
  playCue(s, c, 'feedback-read', (d) => s.play(mixProg.to(4, { duration: d })), { dur: 1.0 });
  playCue(s, c, 'feedback-state', (d) => s.play(stageIdx.to(3, { duration: d })), { dur: 1.2 });

  // Beat 2 (no cues! swap cleanly right at the start of Beat 2, strictly after beat-1-end!)
  const beat2Start = c.cue('feedback-point').start - 13.5;
  c.at(Math.max(0.2, beat2Start - c.start), () => {
    s.play(swapVis(vBlock, vDecide, 0.65));
  });

  // Beat 3: plot new point at feedback-point, reveal winner strictly AFTER feedback-choice!
  playCue(s, c, 'feedback-point', (d) => s.play(pointProg.to(1, { duration: d })), { dur: 0.85 });
  playCue(s, c, 'feedback-choice', (d) => s.play(choiceReveal.to(1, { duration: d })), {
    after: true,
    dur: 0.55,
  });
}
