// Scene 27: release-metrics - "A first relevant result and all relevant results use different denominators"
// Pure Cinema: three glowing query lanes (Q1..Q3) comparing top-2 shortlists against all judged
// relevant documents. Smoothly arcs Q1's P1 from rank 2 to rank 1 (RR doubles, Recall unchanged!),
// then adds P2 (Recall lifts to 1.00 while Q3 still misses its evidence).
import {
  COSMOS,
  ROLE,
  cinemaAtmosphere,
  guardedDynamic,
  heroTitle,
  lumBar,
  playAfter,
  playOn,
  rule,
  shortlistMetrics,
  txt,
  verifyApprox,
} from '../parts.mjs';

export default function releaseMetrics(s, c) {
  const baseRankings = [
    ['X', 'P1'],
    ['P3', 'X'],
    ['X', 'Y'],
  ];
  const relevant = [['P1', 'P2'], ['P3'], ['P4']];

  const m0 = shortlistMetrics(baseRankings[0], relevant[0], 2);
  verifyApprox(m0.recall, 0.5, 1e-12, 'Q1 base recall 0.50');
  verifyApprox(m0.rr, 0.5, 1e-12, 'Q1 base RR 0.50');

  const showFormula = s.value(0);
  const hiFirst = s.value(0);
  const showBase = s.value(0);
  const swapT = s.value(0); // Q1 swaps X and P1 along smooth non-overlapping arcs!
  const addP2 = s.value(0); // Q1 replaces X with P2
  const showHeldout = s.value(0);

  const title = heroTitle(['Recall@K vs. Reciprocal Rank:', 'different denominators'], {
    x: -860,
    y: -450,
    size: 46,
    lineHeight: 54,
    accent: ROLE.positive,
  });

  const stageLayer = guardedDynamic(s.value(1), () => {
    const sf = showFormula.value;
    const hf = hiFirst.value;
    const sb = showBase.value;
    const st = swapT.value;
    const ap = addP2.value;
    const ho = showHeldout.value;
    const nodes = [];

    const colQ = -830;
    const colRank0 = -560;
    const colRank1 = -360;
    const colRel0 = 15;
    const colRel1 = 215;
    const colMet = 610;
    const rowYs = [-145, 25, 195];

    nodes.push(
      txt('QUERY', colQ, -265, 26, COSMOS.dim, 'mono', 'left'),
      txt('TOP-2 SHORTLIST', (colRank0 + colRank1) / 2, -265, 26, ROLE.anchor, 'mono', 'center'),
      txt(
        'ALL JUDGED RELEVANT',
        (colRel0 + colRel1) / 2,
        -265,
        26,
        ROLE.positive,
        'mono',
        'center',
      ),
      txt('RECALL@2  /  RR@2', colMet, -265, 26, ROLE.focus, 'mono', 'center'),
      rule(-850, -230, 850, -230, COSMOS.rule, 1.5).opacity(0.55),
    );

    const curQ1 = ap > 0.5 ? ['P1', 'P2'] : st > 0.5 ? ['P1', 'X'] : baseRankings[0];
    const curRankings = [curQ1, baseRankings[1], baseRankings[2]];

    for (let q = 0; q < 3; q++) {
      const y = rowYs[q];
      nodes.push(txt(`Q${q + 1}`, colQ, y, 36, ROLE.anchor, 'mono', 'left').glow(4, ROLE.anchor));

      // Top-2 shortlist tiles
      if (q === 0 && ap < 0.5) {
        // Animate X (slot 0 -> slot 1) and P1 (slot 1 -> slot 0) along clean upper/lower arcs!
        const xX = colRank0 + (colRank1 - colRank0) * st;
        const yX = y - 56 * Math.sin(Math.PI * st);
        const xP = colRank1 + (colRank0 - colRank1) * st;
        const yP = y + 56 * Math.sin(Math.PI * st);
        nodes.push(
          lumBar(xX, yX, 165, 76, { color: ROLE.unrelated, fillAlpha: 0.22, glow: 5, radius: 10 }),
          txt('X', xX, yX, 34, COSMOS.muted, 'mono', 'center'),
          lumBar(xP, yP, 165, 76, {
            color: ROLE.positive,
            fillAlpha: 0.36,
            strokeWidth: hf > 0.3 ? 3.2 : 2.4,
            glow: hf > 0.3 ? 12 : 8,
            radius: 10,
          }),
          txt('P1', xP, yP, 34, COSMOS.ink, 'mono', 'center'),
        );
      } else {
        curRankings[q].forEach((docId, slot) => {
          const sx = slot === 0 ? colRank0 : colRank1;
          const isRel = relevant[q].includes(docId);
          nodes.push(
            lumBar(sx, y, 165, 76, {
              color: isRel ? ROLE.positive : ROLE.unrelated,
              fillAlpha: isRel ? 0.36 : 0.2,
              glow: isRel ? 9 : 4,
              radius: 10,
            }),
            txt(docId, sx, y, 34, isRel ? COSMOS.ink : COSMOS.muted, 'mono', 'center'),
          );
        });
      }

      // All judged relevant tiles
      relevant[q].forEach((docId, idx) => {
        const rx = idx === 0 ? colRel0 : colRel1;
        nodes.push(
          lumBar(rx, y, 165, 76, { color: ROLE.positive, fillAlpha: 0.22, glow: 6, radius: 10 }),
          txt(docId, rx, y, 34, ROLE.positive, 'mono', 'center'),
        );
      });

      // Live computed Recall@2 & RR@2 readouts
      if (sb > 0.05) {
        const met = shortlistMetrics(curRankings[q], relevant[q], 2);
        const col = met.recall === 0 ? ROLE.competitor : ROLE.focus;
        nodes.push(
          txt(
            `R ${met.recall.toFixed(2)}   ·   RR ${met.rr.toFixed(2)}`,
            colMet,
            y,
            34,
            col,
            'mono',
            'center',
          )
            .glow(q === 0 && (st > 0.5 || ap > 0.5) ? 7 : 3, col)
            .opacity(sb),
        );
      }
    }

    // Bottom formula / held-out release contract bar
    nodes.push(rule(-850, 298, 850, 298, COSMOS.rule, 1.6).opacity(0.55));
    if (ho > 0.05) {
      nodes.push(
        txt(
          'Hold out queries + source groups · ship only when Recall@K, slices, and serving gates pass',
          0,
          365,
          28,
          ROLE.positive,
          'sans',
          'center',
        )
          .glow(5, ROLE.positive)
          .opacity(ho),
      );
    } else if (sf > 0.05) {
      const mList = curRankings.map((r, i) => shortlistMetrics(r, relevant[i], 2));
      const meanR = mList.reduce((a, m) => a + m.recall, 0) / 3;
      const meanRR = mList.reduce((a, m) => a + m.rr, 0) / 3;
      nodes.push(
        txt(
          sb > 0.3
            ? `Mean Recall@2 = ${meanR.toFixed(2)}   ·   MRR@2 = ${meanRR.toFixed(2)}   (Q3 still misses P4)`
            : 'Recall@K = found / all relevant     ·     RR@K = 1 / first relevant rank',
          0,
          365,
          30,
          ROLE.focus,
          'mono',
          'center',
        ).opacity(sf),
      );
    } else {
      nodes.push(
        txt(
          'Keep corpus, judgment universe, cutoff K, and grouping fixed across comparisons',
          0,
          365,
          28,
          COSMOS.muted,
          'sans',
          'center',
        ),
      );
    }

    return nodes;
  });

  s.add(cinemaAtmosphere(ROLE.positive, ROLE.focus), title, stageLayer);

  playAfter(s, c, 'cl-release-metrics-recall', (d) => showFormula.to(1, { duration: d }), 0.45);
  playOn(s, c, 'cl-release-metrics-rr', (d) => hiFirst.to(1, { duration: d }), 0.45);
  playAfter(s, c, 'cl-release-metrics-base', (d) => showBase.to(1, { duration: d }), 0.45);
  playAfter(s, c, 'cl-release-metrics-move', (d) => swapT.to(1, { duration: d }), 1.15);
  playAfter(s, c, 'cl-release-metrics-add', (d) => addP2.to(1, { duration: d }), 0.55);
  playOn(s, c, 'cl-release-metrics-heldout', (d) => showHeldout.to(1, { duration: d }), 0.55);
}
