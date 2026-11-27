// Scene 09: Repeated pages spend repeated practice: Exact duplicate collapse + Trigram shingle Jaccard 2/6 = 1/3.
import { delay, par } from 'vizmatic/stage';
import {
  COSMOS,
  NEAR_DUPLICATE_TEXT,
  aura,
  dedupSnapshot,
  glassCell,
  glowTex,
  glowingArc,
  group,
  guardedDynamic,
  heroTitle,
  photonStream,
  remainDuration,
  txt,
} from '../parts.mjs';

export default function dedup(s, c) {
  const showPart1 = s.value(1);
  const exactMerged = s.value(0);

  const showPart2 = s.value(0);
  const shinglesOn = s.value(0);
  const setsCompare = s.value(0);
  const unionOn = s.value(0);
  const docsNote = s.value(0);
  const jaccardDecision = s.value(0);

  const snap = dedupSnapshot(1, 1);
  const bgAura = aura(0, 0, 640, '#16284f2a', '#6ee7b714');

  const eqJaccard = glowTex(
    String.raw`J = \frac{|A \cap B|}{|A \cup B|} = \frac{2}{6} = \frac{1}{3} < 0.50`,
    {
      x: 0,
      y: 295,
      size: 42,
      color: COSMOS.gold,
    },
  );

  // Part 1: Exact mirror collapse (A and B share normalized digest -> keep A, link B lineage)
  const part1Live = guardedDynamic(showPart1, (a) => {
    const mg = exactMerged.value;
    const nodes = [
      heroTitle(['Exact Mirrors', '& Near Duplicates'], {
        x: -855,
        y: -430,
        size: 56,
        lineHeight: 66,
        accent: COSMOS.cyan,
        eyebrow: 'DEDUPLICATION · NORMALIZED DIGEST MATCH',
      }).opacity(a),

      // Mirror A
      glassCell(-460, -85, 650, 175, COSMOS.emerald, {
        fill: '#0e2026',
        glow: 10,
        opacity: a,
      }),
      txt('RECORD A · RETAINED', -460, -135, 26, COSMOS.emerald, 'mono').opacity(a),
      txt('"The cat sat on the mat."', -460, -75, 34, COSMOS.ink, 'serif').opacity(a),
      txt('240 tokens · hash 8f4c...a9', -460, -22, 26, COSMOS.cyan, 'mono').opacity(a),

      // Mirror B
      glassCell(460, -85, 650, 175, mg > 0.5 ? COSMOS.dim : COSMOS.amber, {
        fill: mg > 0.5 ? '#0b0e18' : '#1e1624',
        glow: mg > 0.5 ? 0 : 8,
        opacity: (1 - 0.58 * mg) * a,
        dash: mg > 0.5 ? [10, 6] : undefined,
      }),
      txt(
        mg > 0.5 ? 'RECORD B · DROPPED (LINEAGE -> A)' : 'RECORD B · MIRROR COPY',
        460,
        -135,
        26,
        mg > 0.5 ? COSMOS.rose : COSMOS.amber,
        'mono',
      ).opacity(a),
      txt(
        '"The cat sat on the mat."',
        460,
        -75,
        34,
        mg > 0.5 ? COSMOS.dim : COSMOS.ink,
        'serif',
      ).opacity((1 - 0.5 * mg) * a),
      txt(
        '240 tokens · hash 8f4c...a9',
        460,
        -22,
        26,
        mg > 0.5 ? COSMOS.dim : COSMOS.amber,
        'mono',
      ).opacity((1 - 0.5 * mg) * a),

      // Lineage link arc from B back to A
      ...photonStream([135, -85], [-135, -85], -65, 0, {
        color: mg > 0.5 ? COSMOS.emerald : COSMOS.gold,
        count: 4,
        opacity: (0.4 + 0.6 * mg) * a,
      }),
      txt(
        mg > 0.5 ? 'SAME NORMALIZED DIGEST -> COLLAPSE TO 1 COPY' : 'IDENTICAL NORMALIZED TEXT',
        0,
        145,
        34,
        mg > 0.5 ? COSMOS.emerald : COSMOS.gold,
        'mono',
      )
        .glow(6, mg > 0.5 ? COSMOS.emerald : COSMOS.gold)
        .opacity(a),
      txt(
        'Drop duplicate B while keeping its source lineage pointing to representative A',
        0,
        265,
        30,
        COSMOS.muted,
        'sans',
      ).opacity(a),
    ];
    return group(...nodes);
  });

  // Part 2: Overlapping word trigram shingles, set comparison, Jaccard 2/6 = 1/3 < 0.50 -> retain both
  const part2Live = guardedDynamic(showPart2, (a) => {
    const sh = shinglesOn.value;
    const sc = setsCompare.value;
    const un = unionOn.value;
    const dn = docsNote.value;
    const jd = jaccardDecision.value;

    const nodes = [
      txt(
        'NEAR-DUPLICATE SHINGLES · WORD TRIGRAMS',
        -855,
        -430,
        26,
        COSMOS.cyan,
        'mono',
        'left',
      ).opacity(a),
      txt('Overlap Does Not Always Merge', -855, -355, 52, COSMOS.ink, 'serif', 'left').opacity(a),

      // Original two sentences
      txt(`S1: "${NEAR_DUPLICATE_TEXT[0]}"`, -855, -248, 28, COSMOS.blue, 'mono', 'left').opacity(
        a,
      ),
      txt(`S2: "${NEAR_DUPLICATE_TEXT[1]}"`, 855, -248, 28, COSMOS.violet, 'mono', 'right').opacity(
        a,
      ),
    ];

    // Trigram pills for S1 (left) and S2 (right)
    snap.sets[0].forEach((gram, i) => {
      const shared = snap.intersection.includes(gram);
      const y = -140 + i * 86;
      const col = sc > 0.5 && shared ? COSMOS.emerald : COSMOS.blue;
      nodes.push(
        glassCell(-470, y, 470, 68, col, {
          fill: sc > 0.5 && shared ? '#0e2426' : '#10182c',
          glow: sc > 0.5 && shared ? 9 : 3,
          opacity: (0.25 + 0.75 * sh) * a,
        }),
        txt(
          gram,
          -470,
          y + 2,
          28,
          sc > 0.5 && shared ? COSMOS.emerald : COSMOS.ink,
          'mono',
        ).opacity((0.25 + 0.75 * sh) * a),
      );
      if (sc > 0.5 && shared) {
        nodes.push(
          glowingArc([-235, y], [235, y], -18, {
            color: COSMOS.emerald,
            width: 3.4,
            glow: 9,
            opacity: sc * a,
          }),
        );
      }
    });

    snap.sets[1].forEach((gram, i) => {
      const shared = snap.intersection.includes(gram);
      const y = -140 + i * 86;
      const col = sc > 0.5 && shared ? COSMOS.emerald : COSMOS.violet;
      nodes.push(
        glassCell(470, y, 470, 68, col, {
          fill: sc > 0.5 && shared ? '#0e2426' : '#14152c',
          glow: sc > 0.5 && shared ? 9 : 3,
          opacity: (0.25 + 0.75 * sh) * a,
        }),
        txt(gram, 470, y + 2, 28, sc > 0.5 && shared ? COSMOS.emerald : COSMOS.ink, 'mono').opacity(
          (0.25 + 0.75 * sh) * a,
        ),
      );
    });

    if (sc > 0.5) {
      nodes.push(
        txt('2 SHARED', 0, -205, 28, COSMOS.emerald, 'mono')
          .glow(6, COSMOS.emerald)
          .opacity(sc * a),
        txt('6 IN UNION', 0, 175, 28, COSMOS.gold, 'mono').opacity(un * a),
      );
    }

    if (jd > 0.02 || dn > 0.02) {
      nodes.push(
        txt(
          'Retain both (1/3 < 0.50) · inspect removed docs & tokens',
          0,
          410,
          30,
          jd > 0.5 ? COSMOS.emerald : COSMOS.cyan,
          'sans',
        ).opacity(Math.max(jd, dn) * a),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, part1Live, part2Live);

  c.on('dedup-b1-1', () =>
    s.play(exactMerged.to(1, { duration: remainDuration(c, 'dedup-b1-1', 0.8) })),
  );

  c.onBeat(1, () => {
    s.play(
      par(showPart1.to(0, { duration: 0.2 }), delay(showPart2.to(1, { duration: 0.25 }), 0.22)),
    );
  });

  c.on('dedup-b2-1', () =>
    s.play(shinglesOn.to(1, { duration: remainDuration(c, 'dedup-b2-1', 0.6) })),
  );
  c.on('dedup-b2-2', () =>
    s.play(setsCompare.to(1, { duration: remainDuration(c, 'dedup-b2-2', 0.6) })),
  );
  c.on('dedup-b2-3', () =>
    s.play(unionOn.to(1, { duration: remainDuration(c, 'dedup-b2-3', 0.6) })),
  );
  c.show('dedup-b2-3', eqJaccard, { fade: 0.4 });

  c.on('dedup-b3-1', () =>
    s.play(docsNote.to(1, { duration: remainDuration(c, 'dedup-b3-1', 0.5) })),
  );
  c.on('dedup-b3-2', () =>
    s.play(jaccardDecision.to(1, { duration: remainDuration(c, 'dedup-b3-2', 0.6) })),
  );
}
