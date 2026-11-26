// Scene 24: retrieval - "Training comparisons become an independent search index"
// Pure Cinema: orbiting 3D unit hypersphere holding stored document vectors beside the stored
// coordinate index, ranked cosine list, shortlist cutoff failure (omitting puppy runs), and reranker flow.
import { line3d, linear, point3d, rect } from 'vizmatic/stage';
import {
  ANGLES,
  COLORS,
  COSMOS,
  NAMES,
  ROLE,
  START,
  buildHypersphere3d,
  cinemaAtmosphere,
  evaluate,
  glowDot,
  glowMatrix,
  guardedDynamic,
  heroTitle,
  lumBar,
  orbitScene,
  playAfter,
  playOn,
  rule,
  txt,
  vector,
} from '../parts.mjs';

export default function retrieval(s, c) {
  const scores = evaluate().scores;
  const storedVecs = ANGLES.map(vector);

  const hiStored = s.value(0);
  const showRank = s.value(0);
  const showAllBox = s.value(0);
  const showMissing = s.value(0);
  const flowT = s.value(0);
  const showScope = s.value(0);

  const title = heroTitle(['Training comparisons become', 'an independent search index'], {
    x: -860,
    y: -450,
    size: 46,
    lineHeight: 54,
    accent: ROLE.anchor,
  });

  // Left: Orbiting 3D unit hypersphere holding fixed stored corpus vectors + query vector
  const sphere = buildHypersphere3d({
    x: -445,
    y: 40,
    radius: 2.5,
    theta: -0.75,
    phi: 1.06,
    distance: 13.6,
    unit: 108,
    accent: ROLE.anchor,
  });
  const qPt = sphere.ptOnSphere(START, 0.14);
  const cPts = ANGLES.map((a, i) => sphere.ptOnSphere(a, i === 0 ? 0.18 : i === 1 ? -0.16 : 0.24));
  sphere.view.add(
    line3d([0, 0, 0], qPt, {
      color: ROLE.anchor,
      width: 4.5,
      glow: 10,
      blend: 'screen',
      onTop: true,
    }),
    point3d(qPt, { color: '#ffffff', radius: 8, glow: 14, blend: 'screen', onTop: true }),
    ...cPts.flatMap((pt, i) => [
      line3d([0, 0, 0], pt, {
        color: COLORS[i],
        width: 3.6,
        glow: 8,
        blend: 'screen',
        onTop: true,
      }),
      point3d(pt, { color: COLORS[i], radius: 7.5, glow: 12, blend: 'screen', onTop: true }),
    ]),
  );

  const stageLayer = guardedDynamic(s.value(1), () => {
    const hs = hiStored.value;
    const sr = showRank.value;
    const sab = showAllBox.value;
    const sm = showMissing.value;
    const ft = flowT.value;
    const sc = showScope.value;
    const nodes = [
      rule(-15, -335, -15, 420, COSMOS.rule, 1.8).opacity(0.55),
      txt('FIXED STORED CORPUS INDEX', -445, -275, 26, COSMOS.muted, 'mono', 'center'),
    ];

    if (sc > 0.05) {
      nodes.push(
        txt(
          'Evaluate held-out relevance under a stable setup',
          -445,
          365,
          28,
          ROLE.positive,
          'sans',
          'center',
        )
          .glow(6, ROLE.positive)
          .opacity(sc),
      );
    } else {
      nodes.push(
        txt(
          'Encode documents once · score new queries fast',
          -445,
          365,
          28,
          COSMOS.muted,
          'sans',
          'center',
        ),
      );
    }

    // Right top: Stored coordinate table [3 x 2]
    nodes.push(
      glowMatrix({
        cx: 485,
        cy: -215,
        rows: 3,
        cols: 2,
        cellW: 165,
        cellH: 54,
        gap: 10,
        values: storedVecs.map((v) => v.map((x) => x.toFixed(2))),
        rowLabels: NAMES,
        colLabels: ['stored x', 'stored y'],
        colors: storedVecs.map((_, r) => [COLORS[r], COLORS[r]]),
        highlight: (r) => hs > 0.3 && r === 0,
        fontSize: 28,
      }),
    );

    // Right middle: Ranked candidates & shortlist cutoff boundary
    const rankYs = [-18, 46, 110];
    if (sr > 0.05) {
      nodes.push(txt('COSINE RANKING', 65, -72, 26, COSMOS.dim, 'mono', 'left').opacity(sr));
      NAMES.forEach((n, i) => {
        const y = rankYs[i];
        const omitted = sm > 0.3 && i === 0;
        nodes.push(
          txt(n, 85, y, 30, omitted ? COSMOS.dim : COLORS[i], 'sans', 'left').opacity(sr),
          txt(
            scores[i].toFixed(3),
            390,
            y,
            30,
            omitted ? COSMOS.dim : COSMOS.ink,
            'mono',
            'center',
          ).opacity(sr),
        );
        if (omitted) {
          nodes.push(
            txt('outside shortlist!', 525, y, 28, ROLE.competitor, 'mono', 'left')
              .glow(6, ROLE.competitor)
              .opacity(sm),
          );
        }
      });
    }

    // Candidate pool boundary -> shrinks to exclude puppy runs on cl-retrieval-missing
    if (sab > 0.05 && sm < 0.3) {
      nodes.push(
        rect(770, 192, { fill: null, stroke: ROLE.anchor, width: 2.4, radius: 10 })
          .at(445, 46)
          .opacity(sab * (1 - sm * 3)),
      );
    }
    if (sm > 0.05) {
      nodes.push(
        rect(770, 126, { fill: null, stroke: ROLE.focus, width: 3.2, radius: 10 })
          .at(445, 78)
          .glow(8, ROLE.focus)
          .opacity(sm),
      );

      // Reranker receiving ONLY the shortlisted candidates [dog sleeps, sky is blue]
      nodes.push(
        txt(
          'RERANKER INPUT  (SELECTED CANDIDATES ONLY)',
          445,
          215,
          26,
          ROLE.focus,
          'mono',
          'center',
        ).opacity(sm),
        lumBar(245, 290, 320, 66, {
          color: COLORS[1],
          fillAlpha: 0.24,
          glow: 7,
          radius: 10,
          opacity: sm,
        }),
        txt(NAMES[1], 245, 290, 30, COLORS[1], 'sans', 'center').opacity(sm),
        lumBar(645, 290, 320, 66, {
          color: COLORS[2],
          fillAlpha: 0.24,
          glow: 7,
          radius: 10,
          opacity: sm,
        }),
        txt(NAMES[2], 645, 290, 30, COLORS[2], 'sans', 'center').opacity(sm),
        txt(
          'Evidence missing from the shortlist stays missing',
          445,
          375,
          28,
          ROLE.competitor,
          'sans',
          'center',
        ).opacity(sm),
      );

      if (ft > 0.02 && ft < 0.98) {
        const yFlow = 110 + ft * 165;
        nodes.push(
          glowDot(245, yFlow, { radius: 8, color: COLORS[1], glow: 12 }),
          glowDot(645, yFlow, { radius: 8, color: COLORS[2], glow: 12 }),
        );
      }
    }

    return nodes;
  });

  s.add(cinemaAtmosphere(ROLE.anchor, ROLE.unrelated), title, sphere.view, stageLayer);
  orbitScene(s, c, sphere.view, { theta: 0.48, phi: 0.96 }, { startOffset: 0.1, endMargin: 0.55 });

  playOn(s, c, 'retrieval-ranked-document-0-b1-1', (d) => hiStored.to(1, { duration: d }), 0.5);
  playAfter(s, c, 'cl-retrieval-rank', (d) => showRank.to(1, { duration: d }), 0.45);
  playOn(s, c, 'retrieval-ranked-document-0-b2-1', (d) => showAllBox.to(1, { duration: d }), 0.45);
  playAfter(
    s,
    c,
    'cl-retrieval-missing',
    (d) => [
      showMissing.to(1, { duration: Math.min(0.5, d) }),
      flowT.to(1, { duration: d, ease: linear }),
    ],
    0.9,
  );
  playOn(s, c, 'retrieval-ranked-document-0-b3-1', (d) => showScope.to(1, { duration: d }), 0.55);
}
