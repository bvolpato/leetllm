// Scene 01: Which score goes with the penalty? Replay freeze, exclusive vs inclusive scan, and 8-play reduction.
import {
  ARTICLE_INPUT,
  ARTICLE_SCORES,
  COSMOS,
  aura,
  buildScoreTraceNodes,
  circle,
  evalArc2d,
  glassCell,
  glowDot,
  glowingArc,
  glowingTrail,
  group,
  guardedDynamic,
  heroTitle,
  line,
  number,
  remainDuration,
  runPhase,
  signed,
  swapViews,
  traceBeaconNodes,
  tracePolylineNodes,
  txt,
} from '../parts.mjs';

const GAIN_IDX = 4;
const PENALTY_IDX = 5;

export default function subjectIntro(s, c) {
  const phase = s.value(0);
  const showPart1 = s.value(1);
  const addProgress = s.value(0);
  const frozen = s.value(0);
  const showBefore = s.value(0);
  const penaltyProgress = s.value(0);
  const showThrough = s.value(0);
  const showExclusive = s.value(0);
  const showInclusive = s.value(0);

  const showPart2 = s.value(0);
  const finishSteps = s.value(0);
  const showTotal = s.value(0);

  const bgAura = aura(0, 40, 620, '#5ce1e622', '#ffd16618');

  const part1 = guardedDynamic(showPart1, (a) => {
    const p = phase.value;
    const addP = addProgress.value;
    const frz = frozen.value;
    const bef = showBefore.value;
    const penP = penaltyProgress.value;
    const thr = showThrough.value;
    const exc = showExclusive.value;
    const inc = showInclusive.value;

    const xLeft = -560;
    const xMid = 0;
    const xRight = 560;
    const nodeY = 42;
    const trackY = 236;
    const pulse = 0.65 + 0.35 * Math.sin(p * 3.8);

    const cursorX = xLeft + (xMid - xLeft) * addP + (xRight - xMid) * penP;
    const cursorCol =
      frz > 0.5 && penP < 0.05 ? COSMOS.gold : penP > 0.05 ? COSMOS.cyan : COSMOS.blue;

    const nodes = [
      heroTitle(['Which Score Goes', 'With the Penalty?'], {
        x: -855,
        y: -420,
        size: 56,
        lineHeight: 66,
        accent: COSMOS.gold,
        eyebrow: 'GPU PARALLEL PRIMITIVES · LANE OWNERSHIP',
      }).opacity(a),

      // Three glowing hardware scoreboard stations
      txt('AFTER 4 PLAYS', xLeft, -124, 26, COSMOS.blue, 'mono').opacity(a),
      glassCell(xLeft, nodeY, 310, 224, COSMOS.blue, {
        fill: '#0e1930',
        glow: 8,
        opacity: a,
      }),
      txt(String(ARTICLE_SCORES[GAIN_IDX]), xLeft, nodeY + 6, 108, COSMOS.blue, 'mono')
        .glow(10, COSMOS.blue)
        .opacity(a),

      txt('BEFORE PENALTY', xMid, -124, 26, COSMOS.gold, 'mono').opacity(a),
      glassCell(xMid, nodeY, 310, 224, COSMOS.gold, {
        fill: bef > 0.5 ? '#241c10' : '#141728',
        glow: bef > 0.5 ? 12 : 7 * pulse,
        opacity: a,
      }),
      txt(
        bef > 0.5 ? String(ARTICLE_SCORES[PENALTY_IDX]) : '?',
        xMid,
        nodeY + 6,
        108,
        COSMOS.gold,
        'mono',
      )
        .glow(10, COSMOS.gold)
        .opacity(a),

      txt('AFTER PENALTY', xRight, -124, 26, thr > 0.5 ? COSMOS.cyan : COSMOS.dim, 'mono').opacity(
        a,
      ),
      glassCell(xRight, nodeY, 310, 224, thr > 0.5 ? COSMOS.cyan : COSMOS.rule, {
        fill: thr > 0.5 ? '#0e2230' : '#101423',
        glow: thr > 0.5 ? 10 : 0,
        opacity: a,
      }),
      txt(
        thr > 0.5 ? String(ARTICLE_SCORES[PENALTY_IDX + 1]) : '·',
        xRight,
        nodeY + 6,
        108,
        thr > 0.5 ? COSMOS.cyan : COSMOS.dim,
        'mono',
      )
        .glow(thr > 0.5 ? 10 : 0, COSMOS.cyan)
        .opacity(a),

      // Glowing arc +5 (left -> mid) and -9 (mid -> right)
      glowingArc([xLeft + 168, nodeY - 12], [xMid - 168, nodeY - 12], -74, {
        color: COSMOS.blue,
        width: 4.5,
        opacity: (0.4 + 0.6 * addP) * a,
      }),
      txt(signed(ARTICLE_INPUT[GAIN_IDX]), (xLeft + xMid) * 0.5, -52, 46, COSMOS.blue, 'mono')
        .glow(8, COSMOS.blue)
        .opacity(a),

      glowingArc([xMid + 168, nodeY - 12], [xRight - 168, nodeY - 12], -74, {
        color: COSMOS.rose,
        width: 4.5,
        opacity: (0.4 + 0.6 * penP) * a,
      }),
      txt(signed(ARTICLE_INPUT[PENALTY_IDX]), (xMid + xRight) * 0.5, -52, 46, COSMOS.rose, 'mono')
        .glow(8, COSMOS.rose)
        .opacity(a),

      // Replay timeline rail
      line([xLeft, trackY], [xRight, trackY], { stroke: '#2c3a5e', width: 4 }).opacity(a),
      line([xLeft, trackY - 16], [xLeft, trackY + 16], { stroke: COSMOS.blue, width: 3 }).opacity(
        a,
      ),
      line([xMid, trackY - 16], [xMid, trackY + 16], { stroke: COSMOS.gold, width: 3 }).opacity(a),
      line([xRight, trackY - 16], [xRight, trackY + 16], { stroke: COSMOS.cyan, width: 3 }).opacity(
        a,
      ),
    ];

    // Active lit rail up to cursor
    if (cursorX > xLeft + 2) {
      nodes.push(
        glowingTrail(
          [
            [xLeft, trackY],
            [cursorX, trackY],
          ],
          { color: cursorCol, width: 6, glow: 10, opacity: a },
        ),
      );
    }

    // Moving arc photons
    if (addP > 0.02 && addP < 0.98) {
      const [px, py] = evalArc2d([xLeft + 168, nodeY - 12], [xMid - 168, nodeY - 12], -74, addP);
      nodes.push(glowDot(px, py, { radius: 8, color: COSMOS.gold, opacity: a }));
    }
    if (penP > 0.02 && penP < 0.98) {
      const [px, py] = evalArc2d([xMid + 168, nodeY - 12], [xRight - 168, nodeY - 12], -74, penP);
      nodes.push(glowDot(px, py, { radius: 8, color: COSMOS.rose, opacity: a }));
    }

    nodes.push(
      circle(15, { fill: COSMOS.bg, stroke: cursorCol, width: 4.5 })
        .at(cursorX, trackY)
        .glow(10, cursorCol)
        .opacity(a),
    );

    if (exc > 0.02) {
      nodes.push(
        txt('EXCLUSIVE SCAN', xMid, 336, 30, COSMOS.gold, 'mono')
          .glow(7, COSMOS.gold)
          .opacity(exc * a),
        txt('score before its play', xMid, 382, 26, COSMOS.muted, 'sans').opacity(exc * a),
      );
    }
    if (inc > 0.02) {
      nodes.push(
        txt('INCLUSIVE SCAN', xRight, 336, 30, COSMOS.cyan, 'mono')
          .glow(7, COSMOS.cyan)
          .opacity(inc * a),
        txt('score after its play', xRight, 382, 26, COSMOS.muted, 'sans').opacity(inc * a),
      );
    }

    return group(...nodes);
  });

  const part2 = guardedDynamic(showPart2, (a) => {
    const fin = finishSteps.value;
    const tot = showTotal.value;

    const { nodes, bx, sy } = buildScoreTraceNodes({
      row: ARTICLE_INPUT,
      scores: ARTICLE_SCORES,
      x0: -680,
      stepX: 178,
      zeroY: 220,
      pxPerPoint: 23,
      chipY: -175,
      ticks: [-4, 0, 4, 8, 12],
      markedPlays: [PENALTY_IDX],
      alpha: a,
    });

    const out = [
      heroTitle(['Full 8-Play Replay:', 'Scan vs Reduction'], {
        x: -855,
        y: -420,
        size: 52,
        lineHeight: 62,
        accent: COSMOS.emerald,
        eyebrow: 'ALL 8 GPU LANES · CUMULATIVE SCORE',
      }).opacity(a),
      ...nodes,
      ...tracePolylineNodes(ARTICLE_SCORES.slice(0, PENALTY_IDX + 1), bx, sy, {
        start: 0,
        color: COSMOS.blue,
        alpha: a,
      }),
      ...tracePolylineNodes(ARTICLE_SCORES.slice(PENALTY_IDX, PENALTY_IDX + 2), bx, sy, {
        start: PENALTY_IDX,
        color: COSMOS.gold,
        alpha: a,
      }),
      ...tracePolylineNodes(ARTICLE_SCORES.slice(PENALTY_IDX + 1), bx, sy, {
        start: PENALTY_IDX + 1,
        steps: tot > 0.5 ? 2 : fin * 2,
        color: COSMOS.cyan,
        alpha: a,
      }),
      ...traceBeaconNodes(bx, sy, PENALTY_IDX, ARTICLE_SCORES[PENALTY_IDX], '12', COSMOS.gold, {
        below: false,
        alpha: a,
      }),
      ...traceBeaconNodes(
        bx,
        sy,
        PENALTY_IDX + 1,
        ARTICLE_SCORES[PENALTY_IDX + 1],
        '3',
        COSMOS.cyan,
        { dx: 36, dy: 26, alpha: a },
      ),
    ];

    if (tot > 0.02) {
      out.push(
        ...traceBeaconNodes(
          bx,
          sy,
          8,
          ARTICLE_SCORES[8],
          String(ARTICLE_SCORES[8]),
          COSMOS.emerald,
          {
            below: false,
            alpha: tot * a,
          },
        ),
        glassCell(0, 392, 1340, 82, COSMOS.emerald, {
          fill: '#0c2422',
          glow: 10,
          opacity: tot * a,
        }),
        txt(
          `Final score = ${number(ARTICLE_SCORES[8])}  ·  combine plays in pairs = reduction`,
          0,
          392,
          28,
          COSMOS.emerald,
          'mono',
        )
          .glow(6, COSMOS.emerald)
          .opacity(tot * a),
      );
    }

    return group(...out);
  });

  s.add(bgAura, part1, part2);
  runPhase(s, c, phase, 14);

  c.on('intro-add-five', () => s.play(addProgress.to(1, { duration: 0.7 })));
  c.on('intro-freeze', () => s.play(frozen.to(1, { duration: 0.3 })));
  c.after('intro-before', () => s.play(showBefore.to(1, { duration: 0.35 })));
  c.on('intro-penalty', () => s.play(penaltyProgress.to(1, { duration: 0.65 })));
  c.after('intro-through', () => s.play(showThrough.to(1, { duration: 0.35 })));
  c.on('intro-exclusive', () => s.play(showExclusive.to(1, { duration: 0.4 })));
  c.on('intro-inclusive', () => s.play(showInclusive.to(1, { duration: 0.4 })));

  c.on('intro-finish', () => {
    swapViews(s, showPart1, showPart2, 0.16, 0.2);
    s.play(finishSteps.to(1, { duration: 0.85 }));
  });
  c.after('intro-total', () =>
    s.play(showTotal.to(1, { duration: remainDuration(c, 'intro-total', 0.4) })),
  );
}
