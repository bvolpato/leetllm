// Scene 17: mining-loop - "Audit the competitor before teaching it as wrong"
// Pure Cinema: 3-gate candidate filtering funnel (relevance -> lexical overlap -> teacher score)
// feeding hard-negative InfoNCE mass impact, transitioning to an orbiting 6-node iterative flywheel.
import { arrow } from 'vizmatic/stage';
import {
  COSMOS,
  MINING_FIXTURE,
  ROLE,
  cinemaAtmosphere,
  comparisonRow,
  guardedDynamic,
  heroTitle,
  lumBar,
  miningCandidates,
  playAfter,
  playOn,
  rule,
  swapVis,
  txt,
  verifyApprox,
} from '../parts.mjs';

export default function miningLoop(s, c) {
  const query = 'How do I rotate an API key?';
  const labels = {
    replacement: 'API replacement',
    'service account': 'Service signing key',
    'KMS intent': 'KMS encryption',
    'GPU guide': 'GPU guide',
  };
  const selected = miningCandidates(query);
  const baseLoss = comparisonRow([0.9, 0.2], 0.05).loss;
  const minedLoss = comparisonRow([0.9, 0.2, 0.72], 0.05).loss;
  verifyApprox(minedLoss, 0.026958, 1e-5, 'mined hard negative loss');

  const overlaps = MINING_FIXTURE.map(
    (r) => miningCandidates(query, [{ ...r, relevant: false }])[0]?.overlap ?? 0,
  );

  const vTable = s.value(1);
  const vSorted = s.value(0);
  const vLoop = s.value(0);
  const colAudit = s.value(0);
  const colLex = s.value(0);
  const colTeacher = s.value(0);
  const showInputs = s.value(0);
  const showLoss = s.value(0);
  const showHoldout = s.value(0);

  const title = heroTitle(['Audit competitors before', 'teaching them as wrong'], {
    x: -860,
    y: -450,
    size: 46,
    lineHeight: 54,
    accent: ROLE.anchor,
  });

  // View 1: 3-Gate Audit Table (clean floating columns, zero bullet boxes)
  const tableLayer = guardedDynamic(vTable, (alpha) => {
    const c1 = colAudit.value;
    const c2 = colLex.value;
    const c3 = colTeacher.value;
    const colXs = [-820, -320, 185, 575];
    const nodes = [
      txt(`Query: "${query}"`, -850, -315, 32, ROLE.anchor, 'sans', 'left')
        .glow(5, ROLE.anchor)
        .opacity(alpha),
      txt('CANDIDATE', colXs[0], -230, 26, COSMOS.dim, 'mono', 'left').opacity(alpha),
      txt('RELEVANCE GATE', colXs[1], -230, 26, COSMOS.dim, 'mono', 'left').opacity(alpha),
      txt('WORD OVERLAP', colXs[2], -230, 26, COSMOS.dim, 'mono', 'center').opacity(alpha),
      txt('TEACHER SCORE', colXs[3], -230, 26, COSMOS.dim, 'mono', 'center').opacity(alpha),
      rule(-850, -196, 850, -196, COSMOS.rule, 1.5).opacity(0.55 * alpha),
    ];

    MINING_FIXTURE.forEach((r, idx) => {
      const ry = -115 + idx * 102;
      const keep = !r.relevant && overlaps[idx] > 0;
      nodes.push(
        txt(
          labels[r.id],
          colXs[0],
          ry,
          34,
          keep || c1 < 0.3 ? COSMOS.ink : COSMOS.dim,
          'sans',
          'left',
        ).opacity(alpha),
      );
      if (c1 > 0.05) {
        nodes.push(
          txt(
            r.relevant ? 'relevant -> exclude' : 'non-match -> pass',
            colXs[1],
            ry,
            30,
            r.relevant ? ROLE.positive : COSMOS.muted,
            'mono',
            'left',
          ).opacity(c1 * alpha),
        );
      }
      if (c2 > 0.05) {
        nodes.push(
          txt(
            String(overlaps[idx]),
            colXs[2],
            ry,
            34,
            overlaps[idx] === 0 ? ROLE.competitor : ROLE.anchor,
            'mono',
            'center',
          ).opacity(c2 * alpha),
        );
      }
      if (c3 > 0.05) {
        nodes.push(
          txt(r.teacher.toFixed(2), colXs[3], ry, 34, ROLE.focus, 'mono', 'center')
            .glow(keep ? 6 : 0, ROLE.focus)
            .opacity(c3 * alpha),
        );
      }
    });

    nodes.push(
      txt(
        'BM25 finds lexical lookalikes; relevance audit removes hidden positives first',
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

  // View 2: Surviving ranked hard negatives + live InfoNCE loss jump
  const sortedLayer = guardedDynamic(vSorted, (alpha) => {
    const inp = showInputs.value;
    const ls = showLoss.value;
    const nodes = [
      txt(
        'VERIFIED HARD NEGATIVES  (NON-MATCH & OVERLAP > 0)',
        0,
        -295,
        28,
        ROLE.anchor,
        'mono',
        'center',
      ).opacity(alpha),
    ];

    selected.forEach((r, idx) => {
      const ry = -175 + idx * 105;
      const barW = r.teacher * 620;
      nodes.push(
        txt(`#${idx + 1}`, -740, ry, 34, ROLE.focus, 'mono', 'center').opacity(alpha),
        txt(labels[r.id], -670, ry, 36, ROLE.competitor, 'sans', 'left').opacity(alpha),
        lumBar(-160 + barW / 2, ry, barW, 40, {
          color: ROLE.competitor,
          fillAlpha: 0.36,
          glow: 8,
          radius: 8,
          opacity: alpha,
        }),
        txt(
          `teacher ${r.teacher.toFixed(2)}`,
          -160 + barW + 28,
          ry,
          30,
          ROLE.focus,
          'mono',
          'left',
        ).opacity(alpha),
      );
    });

    nodes.push(
      txt(
        'Excluded:  API replacement (relevant)   ·   GPU guide (0 shared words)',
        0,
        25,
        28,
        COSMOS.muted,
        'mono',
        'center',
      ).opacity(alpha),
      rule(-850, 88, 850, 88, COSMOS.rule, 1.6).opacity(0.65 * alpha),
      // Baseline InfoNCE row visible immediately so lower canvas stays balanced
      txt(
        inp > 0.3
          ? 'Add one mined negative (0.72) to row [0.90, 0.20]   ·   τ = 0.05'
          : 'Baseline easy row:  [0.90 positive,  0.20 easy negative]   ·   τ = 0.05',
        0,
        162,
        32,
        inp > 0.3 ? ROLE.anchor : COSMOS.muted,
        'mono',
        'center',
      ).opacity(alpha),
    );
    if (ls > 0.05) {
      nodes.push(
        txt(
          `InfoNCE loss:  ${baseLoss.toExponential(2)}   ->   ${minedLoss.toFixed(6)} nats`,
          0,
          255,
          42,
          ROLE.focus,
          'mono',
          'center',
        )
          .glow(9, ROLE.focus)
          .opacity(ls * alpha),
        txt('Hard negative wakes up the row', 0, 338, 28, ROLE.positive, 'sans', 'center').opacity(
          ls * alpha,
        ),
      );
    } else {
      nodes.push(
        txt(
          `Baseline easy-only InfoNCE loss:  ${baseLoss.toExponential(2)} nats (almost silent)`,
          0,
          255,
          32,
          COSMOS.dim,
          'mono',
          'center',
        ).opacity(alpha),
      );
    }
    return nodes;
  });

  // View 3: Orbiting 6-Node Iterative Mining Flywheel + Held-out Evaluation Barrier
  const loopNodes = [
    { x: -560, y: -155, label: '1. Checkpoint θ', col: ROLE.anchor },
    { x: 0, y: -155, label: '2. Re-encode corpus', col: ROLE.unrelated },
    { x: 560, y: -155, label: '3. Refreshed index', col: ROLE.unrelated },
    { x: 560, y: 85, label: '4. Retrieve lookalikes', col: ROLE.competitor },
    { x: 0, y: 85, label: '5. Audit labels', col: ROLE.focus },
    { x: -560, y: 85, label: '6. Train next round', col: ROLE.positive },
  ];

  const loopLayer = guardedDynamic(vLoop, (alpha) => {
    const ho = showHoldout.value;
    const nodes = [
      txt(
        'ITERATIVE HARD-NEGATIVE MINING FLYWHEEL',
        0,
        -285,
        28,
        ROLE.anchor,
        'mono',
        'center',
      ).opacity(alpha),
    ];

    loopNodes.forEach((nd) => {
      nodes.push(
        lumBar(nd.x, nd.y, 410, 86, {
          color: nd.col,
          fillAlpha: 0.22,
          strokeWidth: 2.6,
          glow: 8,
          radius: 14,
          opacity: alpha,
        }),
        txt(nd.label, nd.x, nd.y, 30, COSMOS.ink, 'sans', 'center').opacity(alpha),
      );
    });

    // 6 clean connecting arrows around the loop
    const edges = [
      [
        [-345, -155],
        [-215, -155],
      ],
      [
        [215, -155],
        [345, -155],
      ],
      [
        [560, -104],
        [560, 34],
      ],
      [
        [345, 85],
        [215, 85],
      ],
      [
        [-215, 85],
        [-345, 85],
      ],
      [
        [-560, 34],
        [-560, -104],
      ],
    ];
    edges.forEach(([p0, p1]) => {
      nodes.push(arrow(p0, p1, { stroke: '#6c84b8', width: 3.2, tip: 12 }).opacity(alpha));
    });

    // Held-out firewall below
    if (ho > 0.05) {
      nodes.push(
        rule(-850, 215, 850, 215, ROLE.positive, 2.8)
          .glow(6, ROLE.positive)
          .opacity(ho * alpha),
        txt('HELD-OUT EVALUATION BARRIER', 0, 275, 30, ROLE.positive, 'mono', 'center')
          .glow(6, ROLE.positive)
          .opacity(ho * alpha),
        txt(
          'Keep evaluation queries and near-duplicate groups strictly outside training and mining',
          0,
          335,
          28,
          COSMOS.ink,
          'sans',
          'center',
        ).opacity(ho * alpha),
      );
    }

    return nodes;
  });

  s.add(cinemaAtmosphere(ROLE.anchor, ROLE.competitor), title, tableLayer, sortedLayer, loopLayer);

  playOn(s, c, 'cl-mining-loop-audit', (d) => colAudit.to(1, { duration: d }), 0.45);
  playOn(s, c, 'cl-mining-loop-lexical', (d) => colLex.to(1, { duration: d }), 0.45);
  playAfter(s, c, 'cl-mining-loop-teacher', (d) => colTeacher.to(1, { duration: d }), 0.45);
  playAfter(s, c, 'repair-mining-sorted', (d) => swapVis(vTable, vSorted, d), 0.65);
  playOn(s, c, 'repair-mining-inputs', (d) => showInputs.to(1, { duration: d }), 0.45);
  playAfter(s, c, 'cl-mining-loop-mass', (d) => showLoss.to(1, { duration: d }), 0.45);
  playOn(s, c, 'cl-mining-loop-round', (d) => swapVis(vSorted, vLoop, Math.min(0.65, d)), 0.75);
  playOn(s, c, 'cl-mining-loop-holdout', (d) => showHoldout.to(1, { duration: d }), 0.55);
}
