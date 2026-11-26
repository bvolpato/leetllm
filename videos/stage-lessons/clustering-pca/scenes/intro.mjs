// Scene 01 (intro): "Which past message will the circle reach first?"
// Expanding luminous distance ring from query [2.8, 2.71] toward B (1.841) vs C (1.913) + magnified ruler + full 6-message map.
import {
  COSMOS,
  GROUP_COLOR,
  LETTERS,
  QUERY_COLOR,
  aura,
  distance,
  glowDot,
  glowRing,
  guardedDynamic,
  heroTitle,
  labels,
  makePlot,
  messages,
  query,
  rule,
  runAmbientPhase,
  tweenCue,
  txt,
  xy,
} from '../parts.mjs';

const DIST_B = distance(query, xy[1]); // 1.841
const DIST_C = distance(query, xy[2]); // 1.913

export default function intro(s, c) {
  const phase = s.value(0);
  const ringR = s.value(0.88);
  const showRuler = s.value(0);
  const showPredict = s.value(0);
  const showAnswer = s.value(0);
  const showAll = s.value(0);

  const bgAura = aura(320, 20, 560, '#133a4a36', '#2a1c4f18');
  const title = heroTitle(['Which Message Will', 'the Circle Reach First?'], {
    x: -855,
    y: -430,
    size: 52,
    lineHeight: 60,
    accent: QUERY_COLOR,
    eyebrow: 'CLUSTERING & PCA · NEAREST-NEIGHBOR SEARCH',
  });

  const live = guardedDynamic(s.value(1), () => {
    const r = ringR.value;
    const rul = showRuler.value;
    const ans = showAnswer.value;
    const all = showAll.value;
    const pulse = 0.72 + 0.28 * Math.sin(phase.value * 3.0);

    const plot = makePlot(60, -280, 790, 580, { x: [0, 10], y: [0, 5.2] });
    const qPt = plot.pt(query);
    const scalePx = plot.w / 10;
    const nodes = [
      ...plot.axesNodes(0.85),
      txt('QUERY:  "Why was I charged twice?"', -855, -245, 28, QUERY_COLOR, 'mono', 'left').glow(
        6,
        QUERY_COLOR,
      ),
      // Expanding golden radar ring centered at query
      glowRing(qPt[0], qPt[1], r * scalePx, QUERY_COLOR, {
        width: 3.2,
        glow: 11,
        opacity: 0.9,
      }),
      glowDot(qPt[0], qPt[1], { radius: 9, color: QUERY_COLOR, glow: 14 }),
      txt('Q', qPt[0] - 28, qPt[1] - 28, 28, QUERY_COLOR, 'mono'),
    ];

    // Render B (idx 1) and C (idx 2) always; reveal A, D, E, F when `all` opens the full map
    xy.forEach((p, i) => {
      const isClose = i === 1 || i === 2;
      const vis = isClose ? 1 : all;
      if (vis < 0.02) return;
      const [mx, my] = plot.pt(p);
      const col = GROUP_COLOR[labels[i]];
      const isWinner = i === 1 && ans > 0.5;
      nodes.push(
        glowDot(mx, my, {
          radius: isWinner ? 10 : 7.5,
          color: col,
          glow: isWinner ? 15 : 9,
          opacity: vis,
        }),
        txt(
          LETTERS[i],
          mx + (i === 1 ? -40 : i === 2 ? 28 : 0),
          my + (i === 1 ? 38 : -28),
          28,
          col,
          'mono',
        ).opacity(vis),
      );
      if (isWinner) {
        nodes.push(glowRing(mx, my, 24 + 5 * pulse, col, { width: 3.2, glow: 12, opacity: ans }));
      }
    });

    // Left stage: magnified ruler for the final stretch [1.60 .. 2.00]
    const rx0 = -830;
    const rx1 = -70;
    const ry = -45;
    const rMap = (d) => rx0 + ((d - 1.6) / 0.4) * (rx1 - rx0);
    const curX = Math.max(rx0, Math.min(rx1, rMap(r)));

    nodes.push(
      txt(
        'MAGNIFIED RADIUS RULER (1.60 → 2.00)',
        -855,
        -138,
        26,
        COSMOS.cyan,
        'mono',
        'left',
      ).opacity(0.45 + 0.55 * rul),
      rule(rx0, ry, rx1, ry, COSMOS.muted, 3.5).opacity(0.5 + 0.5 * rul),
      glowDot(rMap(DIST_B), ry, {
        radius: 8,
        color: GROUP_COLOR[0],
        glow: 10,
        opacity: 0.45 + 0.55 * rul,
      }),
      txt('B', rMap(DIST_B), ry - 36, 28, GROUP_COLOR[0], 'mono').opacity(0.45 + 0.55 * rul),
      glowDot(rMap(DIST_C), ry, {
        radius: 8,
        color: GROUP_COLOR[1],
        glow: 10,
        opacity: 0.45 + 0.55 * rul,
      }),
      txt('C', rMap(DIST_C), ry - 36, 28, GROUP_COLOR[1], 'mono').opacity(0.45 + 0.55 * rul),
      glowDot(curX, ry, { radius: 10, color: QUERY_COLOR, glow: 14, opacity: 0.5 + 0.5 * rul }),
      txt('1.60', rx0, ry + 42, 26, COSMOS.muted, 'mono', 'left').opacity(0.5 + 0.5 * rul),
      txt('2.00', rx1, ry + 42, 26, COSMOS.muted, 'mono', 'right').opacity(0.5 + 0.5 * rul),
    );

    // Non-overlapping prediction -> answer handoff
    const pOp = showPredict.value * Math.max(0, 1 - ans * 2.6);
    if (pOp > 0.02) {
      nodes.push(
        txt(
          'Which message will the expanding circle touch first?',
          -855,
          125,
          32,
          QUERY_COLOR,
          'serif',
          'left',
        )
          .glow(6, QUERY_COLOR)
          .opacity(pOp),
      );
    }

    const aOp = Math.max(0, (ans - 0.45) / 0.55);
    if (aOp > 0.02) {
      nodes.push(
        txt(
          `B ("${messages[1].text}") wins at d = ${DIST_B.toFixed(2)}`,
          -855,
          125,
          32,
          GROUP_COLOR[0],
          'mono',
          'left',
        )
          .glow(7, GROUP_COLOR[0])
          .opacity(aOp),
        txt(
          `C ("${messages[2].text}") is ${(DIST_C - DIST_B).toFixed(2)} farther (d = ${DIST_C.toFixed(2)})`,
          -855,
          182,
          26,
          COSMOS.muted,
          'mono',
          'left',
        ).opacity(aOp),
      );
    }

    if (all > 0.02) {
      nodes.push(
        txt('Two shortcuts ahead:', -855, 290, 26, COSMOS.cyan, 'mono', 'left').opacity(all),
        txt(
          '1. PCA: compress to fewer coordinates',
          -855,
          342,
          28,
          COSMOS.ink,
          'sans',
          'left',
        ).opacity(all),
        txt(
          '2. Clustering: search one group at a time',
          -855,
          392,
          28,
          COSMOS.ink,
          'sans',
          'left',
        ).opacity(all),
      );
    }

    nodes.push(txt('2D MESSAGE EMBEDDING MAP (6 MESSAGES)', 455, -325, 26, COSMOS.cyan, 'mono'));
    return nodes;
  });

  s.add(bgAura, title, live);
  runAmbientPhase(s, c, phase, 2.0);

  c.at(0.2, () => {
    s.play(ringR.to(1.74, { duration: Math.max(1.2, c.cue('ruler').start - c.start - 0.3) }));
  });
  tweenCue(s, c, 'ruler', showRuler, 1, { duration: 0.45 });
  tweenCue(s, c, 'predict', showPredict, 1, { duration: 0.45 });
  c.after('answer', () => {
    s.play(ringR.to(DIST_B, { duration: 0.5 }));
    s.play(showAnswer.to(1, { duration: 0.45 }));
  });
  tweenCue(s, c, 'all', showAll, 1, { duration: 0.65 });
}
