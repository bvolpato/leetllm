// Scene 7: Index layout shapes the cost (Ordered postings, gap/delta encoding, segment merges)
import {
  COSMOS,
  GAP_IDS,
  GAP_VALUES,
  aura,
  decodeGapValues,
  glassCell,
  glowDot,
  glowingArc,
  group,
  guardedDynamic,
  heroTitle,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function storage(s, c) {
  const phase = s.value(0);
  const showOrdered = s.value(0);
  const showIds = s.value(0);
  const showGaps = s.value(0);
  const showDecode = s.value(0);

  const bgAura = aura(0, 10, 660, '#12325c26', '#281a5014');
  const title = heroTitle(['Index Layout', 'Shapes the Cost'], {
    x: -855,
    y: -415,
    size: 58,
    lineHeight: 68,
    accent: COSMOS.cyan,
    eyebrow: 'STORAGE & CODECS · ORDERED POSTINGS · GAP ENCODING · SEGMENTS',
  });

  const decoded = decodeGapValues(GAP_VALUES);

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const so = showOrdered.value;
    const si = showIds.value;
    const sg = showGaps.value;
    const sd = showDecode.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);

    const xs = [-520, -140, 240];
    const nodes = [
      txt('ORDERED DOCUMENT IDs (MONOTONIC)', -855, -205, 26, COSMOS.cyan, 'mono', 'left'),
      txt('DELTA / GAP STREAM (COMPACT)', -855, -18, 26, COSMOS.gold, 'mono', 'left'),
      txt('PREFIX-SUM DECODED IDs', -855, 170, 26, COSMOS.emerald, 'mono', 'left'),
    ];

    // Row 1: Original ordered doc IDs [12, 20, 25]
    GAP_IDS.forEach((id, i) => {
      const cx = xs[i];
      nodes.push(
        glassCell(cx, -120, 260, 88, si > 0.3 || so > 0.3 ? COSMOS.cyan : COSMOS.muted, {
          fill: '#10223b',
          glow: si > 0.3 ? 8 * pulse : 3,
        }),
        txt(`doc ${id}`, cx, -118, 34, COSMOS.cyan, 'mono'),
      );
      if (i < 2) {
        nodes.push(
          glowingArc([cx + 136, -120], [xs[i + 1] - 136, -120], -18, {
            color: COSMOS.cyan,
            width: 3.2,
          }),
        );
      }
    });

    // Row 2: Gap values [12, 8, 5]
    const gapLabels = ['12', '+8  (20-12)', '+5  (25-20)'];
    GAP_VALUES.forEach((g, i) => {
      const cx = xs[i];
      nodes.push(
        glassCell(cx, 66, 260, 88, sg > 0.3 ? COSMOS.gold : COSMOS.muted, {
          fill: sg > 0.3 ? '#241e10' : '#12182b',
          glow: sg > 0.3 ? 9 * pulse : 2,
          opacity: Math.max(0.75, sg),
        }),
        txt(
          sg > 0.3 ? gapLabels[i] : `gap ${g}`,
          cx,
          68,
          30,
          sg > 0.3 ? COSMOS.gold : COSMOS.muted,
          'mono',
        ),
      );
    });

    // Row 3: Decoded IDs [12, 20, 25]
    decoded.forEach((id, i) => {
      const cx = xs[i];
      nodes.push(
        glassCell(cx, 252, 260, 88, sd > 0.3 ? COSMOS.emerald : COSMOS.muted, {
          fill: sd > 0.3 ? '#0e2824' : '#12182b',
          glow: sd > 0.3 ? 9 * pulse : 2,
          opacity: Math.max(0.75, sd),
        }),
        txt(
          sd > 0.3 ? `sum = ${id}` : 'decode -> ?',
          cx,
          254,
          30,
          sd > 0.3 ? COSMOS.emerald : COSMOS.muted,
          'mono',
        ),
      );
    });

    // Right column: Segment build & operational trade-offs
    nodes.push(
      glassCell(645, 65, 430, 460, sd > 0.3 ? COSMOS.cyan : COSMOS.muted, {
        fill: '#10182d',
        glow: sd > 0.3 ? 7 : 2,
      }),
      txt('INDEX LIFECYCLE', 645, -120, 26, COSMOS.cyan, 'mono'),
      txt('· Ordered IDs enable', 460, -45, 26, COSMOS.ink, 'sans', 'left'),
      txt('  skip lists & merges', 460, -10, 26, COSMOS.muted, 'sans', 'left'),
      txt('· Small gaps pack tight', 460, 58, 26, COSMOS.ink, 'sans', 'left'),
      txt('  into varint blocks', 460, 93, 26, COSMOS.muted, 'sans', 'left'),
      txt('· New docs merge into', 460, 162, 26, COSMOS.ink, 'sans', 'left'),
      txt('  searchable segments', 460, 197, 26, COSMOS.gold, 'sans', 'left'),
      txt('Measure latency + freshness', 645, 258, 26, COSMOS.emerald, 'sans'),

      glowDot(-840, 368, { radius: 6, color: COSMOS.gold }),
      txt(
        'Gap coding compresses monotonic IDs; decoding restores exact IDs before scoring',
        -812,
        370,
        28,
        COSMOS.muted,
        'sans',
        'left',
      ),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('storage-ordered', () => s.play(showOrdered.to(1, { duration: 0.45 })));
  c.on('storage-id-values', () => s.play(showIds.to(1, { duration: 0.45 })));
  c.on('storage-gap-values', () => s.play(showGaps.to(1, { duration: 0.45 })));
  c.on('storage-decoding', () =>
    s.play(showDecode.to(1, { duration: remainDuration(c, 'storage-decoding', 0.45) })),
  );
}
