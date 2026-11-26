// Scene 26: evaluation-scope - "A benchmark name needs its task and version scope"
// Pure Cinema: View 1 renders an 8-category glowing MTEB dataset skyline (58 datasets, highlighting
// STS vs Retrieval, expanding to MMTEB 500+ tasks / 250+ languages). View 2 renders a visual
// context-window truncation guillotine slicing off required evidence before the encoder.
import { arrow, line } from 'vizmatic/stage';
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
  swapVis,
  txt,
  verifyInvariant,
} from '../parts.mjs';

export default function evaluationScope(s, c) {
  const categories = [
    ['retrieval', 15],
    ['classify', 12],
    ['cluster', 11],
    ['STS', 10],
    ['rerank', 4],
    ['pair', 3],
    ['bitext', 2],
    ['summary', 1],
  ];
  const total = categories.reduce((acc, [, n]) => acc + n, 0);
  verifyInvariant(total === 58, 'original MTEB has 58 datasets');

  const vChart = s.value(1);
  const vTrunc = s.value(0);
  const hiSts = s.value(0);
  const showOld = s.value(0);
  const hiRet = s.value(0);
  const showMmteb = s.value(0);

  const title = heroTitle(['A benchmark name needs', 'its task and version scope'], {
    x: -860,
    y: -450,
    size: 46,
    lineHeight: 54,
    accent: ROLE.anchor,
  });

  // View 1: Original MTEB 8-Category Bar Skyline
  const chartLayer = guardedDynamic(vChart, (alpha) => {
    const sts = hiSts.value;
    const old = showOld.value;
    const ret = hiRet.value;
    const mm = showMmteb.value;
    const baseY = 205;
    const maxH = 355;
    const leftX = -755;
    const stepX = 215;
    const nodes = [
      txt(
        'HUMAN RELATEDNESS (STS)  ≠  OPERATIONAL RETRIEVAL',
        0,
        -295,
        30,
        ROLE.anchor,
        'mono',
        'center',
      ).opacity(alpha),
      txt(
        'Original MTEB snapshot: datasets per category',
        0,
        -242,
        26,
        COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
      line([leftX - 75, baseY], [leftX + 7 * stepX + 75, baseY], {
        stroke: '#4c6294',
        width: 2.4,
      }).opacity(alpha),
    ];

    categories.forEach(([name, count], idx) => {
      const cx = leftX + idx * stepX;
      const bh = (count / 15) * maxH;
      const isRet = idx === 0;
      const isSts = idx === 3;
      const lit = (isRet && ret > 0.3) || (isSts && sts > 0.3 && ret < 0.3);
      const col = isRet ? ROLE.positive : isSts && lit ? ROLE.focus : ROLE.unrelated;
      nodes.push(
        lumBar(cx, baseY - bh / 2, 118, bh, {
          color: col,
          fillAlpha: lit ? 0.52 : 0.28,
          strokeWidth: lit ? 3.2 : 2.0,
          glow: lit ? 12 : 5,
          radius: 8,
          opacity: alpha,
        }),
        txt(
          String(count),
          cx,
          baseY - bh - 28,
          30,
          lit ? COSMOS.ink : col,
          'mono',
          'center',
        ).opacity(alpha),
        txt(name, cx, baseY + 38, 28, lit ? col : COSMOS.muted, 'sans', 'center').opacity(alpha),
      );
    });

    nodes.push(rule(-850, 295, 850, 295, COSMOS.rule, 1.6).opacity(0.55 * alpha));
    if (mm > 0.05) {
      nodes.push(
        txt(
          'MMTEB (2025):  > 500 tasks   ·   > 250 languages   (always record exact subset & version)',
          0,
          365,
          32,
          ROLE.focus,
          'mono',
          'center',
        )
          .glow(7, ROLE.focus)
          .opacity(mm * alpha),
      );
    } else if (old > 0.05) {
      nodes.push(
        txt(
          'Original MTEB:  33 models   ·   58 datasets   ·   8 categories   (no single model dominated all)',
          0,
          365,
          30,
          ROLE.anchor,
          'mono',
          'center',
        ).opacity(old * alpha),
      );
    } else {
      nodes.push(
        txt(
          'High overall average can hide weak retrieval behind classification or clustering',
          0,
          365,
          28,
          COSMOS.muted,
          'sans',
          'center',
        ).opacity(alpha),
      );
    }
    return nodes;
  });

  // View 2: Context-Window Truncation Guillotine
  const truncLayer = guardedDynamic(vTrunc, (alpha) => [
    txt('INPUT TRUNCATION BEFORE ENCODING', 0, -285, 30, ROLE.competitor, 'mono', 'center')
      .glow(6, ROLE.competitor)
      .opacity(alpha),
    // Retained window (left)
    lumBar(-285, -70, 920, 220, {
      color: ROLE.focus,
      fillAlpha: 0.14,
      strokeWidth: 3.0,
      glow: 9,
      radius: 14,
      opacity: alpha,
    }),
    txt('WITHIN MAX INPUT LENGTH', -285, -135, 26, ROLE.focus, 'mono', 'center').opacity(alpha),
    txt(
      'Step 1: Rotate API key   ·   Step 2: Restart workers',
      -285,
      -45,
      34,
      ROLE.anchor,
      'sans',
      'center',
    ).opacity(alpha),
    // Guillotine cutoff line
    line([215, -210], [215, 70], { stroke: ROLE.competitor, width: 4.5, dash: [10, 8] })
      .glow(10, ROLE.competitor)
      .opacity(alpha),
    // Cut-off evidence (right)
    lumBar(545, -70, 580, 220, {
      color: ROLE.competitor,
      fillAlpha: 0.16,
      strokeWidth: 2.2,
      glow: 7,
      radius: 14,
      dash: [8, 6],
      opacity: alpha,
    }),
    txt('BEYOND CUTOFF (DROPPED)', 545, -135, 26, ROLE.competitor, 'mono', 'center').opacity(alpha),
    txt('Step 3: Revoke old key', 545, -45, 34, ROLE.competitor, 'sans', 'center').opacity(alpha),
    // Arrow down to encoder
    arrow([-285, 52], [-285, 165], { stroke: ROLE.anchor, width: 4, tip: 14 }).opacity(alpha),
    lumBar(-285, 225, 920, 86, {
      color: ROLE.anchor,
      fillAlpha: 0.24,
      glow: 8,
      radius: 12,
      opacity: alpha,
    }),
    txt(
      'Encoder + pooling sees ONLY retained tokens',
      -285,
      225,
      30,
      COSMOS.ink,
      'mono',
      'center',
    ).opacity(alpha),
    txt(
      'Truncated evidence never reaches the encoder · pooling cannot rescue what was sliced away',
      0,
      365,
      30,
      ROLE.competitor,
      'sans',
      'center',
    )
      .glow(6, ROLE.competitor)
      .opacity(alpha),
  ]);

  s.add(cinemaAtmosphere(ROLE.anchor, ROLE.positive), title, chartLayer, truncLayer);

  playOn(s, c, 'cl-evaluation-scope-sts', (d) => hiSts.to(1, { duration: d }), 0.45);
  playAfter(s, c, 'cl-evaluation-scope-mteb', (d) => showOld.to(1, { duration: d }), 0.45);
  playOn(s, c, 'cl-evaluation-scope-categories', (d) => hiRet.to(1, { duration: d }), 0.45);
  playAfter(s, c, 'cl-evaluation-scope-languages', (d) => showMmteb.to(1, { duration: d }), 0.45);
  playOn(s, c, 'cl-evaluation-scope-truncate', (d) => swapVis(vChart, vTrunc, d), 0.7);
}
