// Scene 29: fresh-embedding - "Two decisions for a repair manual" (Finale!)
// Pure Cinema: Part 1 audits a mirrored wheel guide (0.65/0.65/0.05 at tau=0.15 -> +3.303 -> mask B -> 0.01815 nats);
// Part 2 runs a held-out short-index road test ("Where can I safely lift this car?") comparing
// Control vs Short index across a K=2 gold cutoff against a 0.75 Recall floor (RR doubles, Recall stays 0.50 -> HOLD!).
import { line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  cinemaAtmosphere,
  comparisonRow,
  glowRing,
  guardedDynamic,
  heroTitle,
  lumBar,
  playAfter,
  playOn,
  rule,
  shortlistMetrics,
  swapVis,
  txt,
  verifyApprox,
  verifyInvariant,
} from '../parts.mjs';
import { poolGeometry } from '../pool.mjs';

export default function freshEmbedding(s, c) {
  // Part 1: Repair manual mirror audit
  const scores = [0.65, 0.65, 0.05];
  const tau = 0.15;
  const full = comparisonRow(scores, tau);
  const masked = comparisonRow(scores, tau, 0, [true, false, true]);
  verifyApprox(full.gradients[1], 3.303, 0.002, 'mirror derivative +3.303');
  verifyInvariant(masked.gradients[1] === 0, 'masked mirror gradient 0');
  verifyApprox(masked.loss, 0.01815, 0.0002, 'masked mirror loss 0.01815');

  const pg = poolGeometry({
    query: 'Query: "How do I change a flat tire?"',
    names: ['A · wheel guide', 'B · mirror of A', 'C · route planner'],
    colors: [ROLE.positive, ROLE.competitor, ROLE.unrelated],
    scores,
    all: full,
    tau,
    topY: -295,
    track1Y: 20,
    track2Y: 205,
    footY: 385,
  });

  // Part 2: Held-out short-index release check
  const allowed = ['Jack points', 'Lift diagram'];
  const kCut = 2;
  const floor = 0.75;
  const rankings = [
    ['Tire sizes', 'Jack points', 'Lift diagram'],
    ['Jack points', 'Tire sizes', 'Lift diagram'],
  ];
  const mControl = shortlistMetrics(rankings[0], allowed, kCut);
  const mShort = shortlistMetrics(rankings[1], allowed, kCut);
  verifyInvariant(mControl.rr < mShort.rr && mShort.recall < floor, 'higher RR still misses floor');

  const vMirror = s.value(1);
  const vRoad = s.value(0);

  // Part 1 values
  const showComp = s.value(0);
  const showAsk = s.value(0);
  const showExcl = s.value(0);
  const showDir = s.value(0);
  const bMassKeep = s.value(1);
  const showSolved = s.value(0);

  // Part 2 values
  const showCand = s.value(0);
  const showGate = s.value(0);
  const showRanks = s.value(0);
  const showHold = s.value(0);
  const pulseOutside = s.value(0);

  const title = heroTitle(['Two decisions for', 'a repair manual'], {
    x: -860,
    y: -450,
    size: 46,
    lineHeight: 54,
    accent: ROLE.anchor,
  });

  // Part 1 Layer: Mirror-copy false-negative audit
  const mirrorLayer = guardedDynamic(vMirror, (alpha) => {
    const sc = showComp.value;
    const ask = showAsk.value;
    const ex = showExcl.value;
    const dr = showDir.value;
    const bk = bMassKeep.value;
    const sl = showSolved.value;
    const nodes = [
      pg.headerBar(alpha),
      pg.candidateRow({ showMass: sc > 0.3, opacity: alpha }),
      pg.stripView({
        y: pg.track1Y,
        caption: 'Current training row:  target A · mirror B competes',
        row: full,
        masses: full.masses,
        showSegments: sc > 0.05,
        showResult: sc > 0.05,
        opacity: (sc > 0.05 ? sc : 0.35) * alpha,
      }),
    ];

    if (ex > 0.05) {
      const curMasses = [full.masses[0], full.masses[1] * bk, full.masses[2]];
      const isMasked = bk < 0.25;
      nodes.push(
        pg.stripView({
          y: pg.track2Y,
          caption: isMasked
            ? 'Repaired row:  target A · verified mirror B excluded'
            : 'Working row:  excluding mirror B',
          row: isMasked ? masked : full,
          masses: curMasses,
          showSegments: true,
          showResult: sl > 0.05,
          opacity: ex * alpha,
          captionColor: isMasked ? ROLE.positive : ROLE.competitor,
        }),
      );
    }

    if (sl > 0.05) {
      nodes.push(
        pg.footerLine(
          `Masked B: ∂L/∂score = 0   ·   loss ${full.loss.toFixed(5)} -> ${masked.loss.toFixed(5)} nats`,
          ROLE.positive,
          34,
          'mono',
          sl * alpha,
        ),
      );
    } else if (dr > 0.05) {
      nodes.push(
        pg.footerLine(
          `Before masking B:  ∂L/∂s_B = +${full.gradients[1].toFixed(3)}   ->   descent lowers the mirror`,
          ROLE.competitor,
          34,
          'mono',
          dr * alpha,
        ),
      );
    } else if (ex > 0.05) {
      nodes.push(
        pg.footerLine(
          'Exclude the verified mirror from this row.',
          ROLE.positive,
          36,
          'sans',
          ex * alpha,
        ),
      );
    } else if (ask > 0.05) {
      nodes.push(pg.footerLine('Should B compete with A?', ROLE.focus, 40, 'serif', ask * alpha));
    } else {
      nodes.push(
        pg.footerLine(
          'A and B are verified mirrors of the same wheel guide (both score 0.650)',
          COSMOS.muted,
          30,
          'sans',
          alpha,
        ),
      );
    }

    return nodes;
  });

  // Part 2 Layer: Held-Out Road Test (Control vs Short Index)
  const roadLayer = guardedDynamic(vRoad, (alpha) => {
    const cd = showCand.value;
    const gt = showGate.value;
    const rk = showRanks.value;
    const hd = showHold.value;
    const po = pulseOutside.value;
    const nodes = [
      txt(
        'Held-out query: "Where can I safely lift this car?"',
        -850,
        -305,
        34,
        ROLE.anchor,
        'sans',
        'left',
      )
        .glow(5, ROLE.anchor)
        .opacity(alpha),
      txt(
        'Relevant: Jack points + Lift diagram   ·   Cutoff K = 2   ·   Required Recall@2 ≥ 0.75',
        -850,
        -252,
        28,
        COSMOS.muted,
        'mono',
        'left',
      ).opacity(alpha),
      rule(-850, -214, 850, -214, COSMOS.rule, 1.5).opacity(0.55 * alpha),
    ];

    const slotXs = [-430, -100, 275];
    const cutX = 88;
    const laneYs = [-85, 115];
    const laneNames = ['Control', 'Short index'];
    const laneMetrics = [mControl, mShort];

    // Gold vertical cutoff line spanning both lanes
    nodes.push(
      line([cutX, -170], [cutX, 195], { stroke: ROLE.focus, width: 4, dash: [10, 8] })
        .glow(9, ROLE.focus)
        .opacity(alpha),
      txt('cutoff K = 2', cutX, -190, 26, ROLE.focus, 'mono', 'center').opacity(alpha),
    );

    rankings.forEach((docs, rowIdx) => {
      const y = laneYs[rowIdx];
      const vis = rowIdx === 0 ? 1 : cd;
      if (vis < 0.05) return;

      nodes.push(
        txt(
          laneNames[rowIdx],
          -835,
          y,
          32,
          rowIdx === 0 ? COSMOS.muted : ROLE.anchor,
          'sans',
          'left',
        ).opacity(vis * alpha),
      );

      docs.forEach((docId, j) => {
        const isRel = allowed.includes(docId);
        const outside = j >= kCut;
        const col = isRel
          ? outside && po > 0.3 && rowIdx === 1
            ? ROLE.focus
            : ROLE.positive
          : COSMOS.dim;
        nodes.push(
          lumBar(slotXs[j], y, 275, 82, {
            color: col,
            fillAlpha: isRel ? 0.28 : 0.14,
            strokeWidth: outside && po > 0.3 && rowIdx === 1 ? 3.8 : 2.2,
            glow: outside && po > 0.3 && rowIdx === 1 ? 14 : isRel ? 8 : 2,
            radius: 10,
            opacity: vis * alpha,
          }),
          txt(docId, slotXs[j], y, 30, isRel ? COSMOS.ink : COSMOS.muted, 'sans', 'center').opacity(
            vis * alpha,
          ),
        );
      });

      // Outer dashed glowing frame around stranded Lift diagram (rank 3 of short index, zero text crossing!)
      if (rowIdx === 1 && po > 0.05) {
        nodes.push(
          lumBar(slotXs[2], y, 306, 108, {
            color: ROLE.focus,
            fillAlpha: 0,
            strokeWidth: 3.4,
            glow: 14,
            radius: 14,
            opacity: po * alpha,
            dash: [9, 7],
          }),
          txt('stranded at rank 3', slotXs[2], y + 86, 26, ROLE.focus, 'mono', 'center').opacity(
            po * alpha,
          ),
        );
      }

      // Live RR & Recall readouts on right
      if (rk > 0.05) {
        const m = laneMetrics[rowIdx];
        nodes.push(
          txt(`RR  ${m.rr.toFixed(2)}`, 510, y - 22, 32, ROLE.anchor, 'mono', 'left').opacity(
            rk * vis * alpha,
          ),
          txt(`Recall  ${m.recall.toFixed(2)}`, 510, y + 24, 32, ROLE.competitor, 'mono', 'left')
            .glow(6, ROLE.competitor)
            .opacity(rk * vis * alpha),
        );
      }
    });

    // Bottom verdict bar (strictly withheld until fresh-hold!)
    nodes.push(rule(-850, 290, 850, 290, COSMOS.rule, 1.6).opacity(0.55 * alpha));
    if (hd > 0.05) {
      nodes.push(
        txt(
          'HOLD THE SHORT INDEX   ·   Recall@2 = 1/2 = 0.50 < floor 0.75   (even though RR doubled)',
          0,
          355,
          34,
          ROLE.focus,
          'mono',
          'center',
        )
          .glow(8, ROLE.focus)
          .opacity(hd * alpha),
        txt(
          'Full-width rescoring can only reorder the top 2 · Lift diagram must cross the cutoff first',
          0,
          405,
          26,
          COSMOS.muted,
          'sans',
          'center',
        ).opacity(hd * alpha),
      );
    } else if (gt > 0.05) {
      nodes.push(
        txt(
          'Does the short index clear the 0.75 recall floor?',
          0,
          368,
          38,
          ROLE.focus,
          'serif',
          'center',
        )
          .glow(7, ROLE.focus)
          .opacity(gt * alpha),
      );
    } else {
      nodes.push(
        txt(
          cd > 0.5
            ? 'Both rankings put Jack points inside the top 2 and leave Lift diagram outside'
            : 'Control puts Jack points second and leaves Lift diagram outside the top 2',
          0,
          368,
          28,
          COSMOS.muted,
          'sans',
          'center',
        ).opacity(alpha),
      );
    }

    return nodes;
  });

  s.add(cinemaAtmosphere(ROLE.anchor, ROLE.focus), title, mirrorLayer, roadLayer);

  // Part 1 cues
  playOn(s, c, 'fresh-competition', (d) => showComp.to(1, { duration: d }), 0.55);
  playOn(s, c, 'fresh-ask', (d) => showAsk.to(1, { duration: d }), 0.45);
  playAfter(
    s,
    c,
    'fresh-exclude',
    (d) => [showAsk.to(0, { duration: d * 0.35 }), showExcl.to(1, { duration: d })],
    0.55,
  );
  playAfter(s, c, 'fresh-direction', (d) => showDir.to(1, { duration: d }), 0.45);
  playOn(s, c, 'fresh-mask', (d) => bMassKeep.to(0, { duration: d }), 1.2);
  playAfter(s, c, 'fresh-solved', (d) => showSolved.to(1, { duration: d }), 0.45);

  // Part 2 cues
  playOn(s, c, 'fresh-road-test', (d) => swapVis(vMirror, vRoad, d), 0.7);
  playOn(s, c, 'fresh-candidate', (d) => showCand.to(1, { duration: d }), 0.55);
  playOn(s, c, 'fresh-gate', (d) => showGate.to(1, { duration: d }), 0.45);
  playAfter(s, c, 'fresh-ranks', (d) => showRanks.to(1, { duration: d }), 0.5);
  playAfter(
    s,
    c,
    'fresh-hold',
    (d) => [showGate.to(0, { duration: d * 0.35 }), showHold.to(1, { duration: d })],
    0.5,
  );
  playOn(s, c, 'fresh-outside', (d) => pulseOutside.to(1, { duration: d }), 0.75);
}
