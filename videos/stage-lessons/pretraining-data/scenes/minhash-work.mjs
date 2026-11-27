// Scene 10: Construct the candidate signature from real shingles: Exact byte check, 6/10 bigram Jaccard, 4 real 64-bit band-1 minima & edge verification.
import { delay, par } from 'vizmatic/stage';
import {
  COSMOS,
  MINHASH_BAND1_HASHES,
  MINHASH_SHARED,
  MINHASH_UNIQUE_A,
  MINHASH_UNIQUE_B,
  aura,
  glassCell,
  glowTex,
  glowingArc,
  group,
  guardedDynamic,
  heroTitle,
  photonStream,
  remainAfterDuration,
  remainDuration,
  txt,
} from '../parts.mjs';

export default function minhashWork(s, c) {
  const showPart1 = s.value(1);
  const exactCheck = s.value(0);

  const showPart2 = s.value(0);
  const shinglesLit = s.value(0);
  const sixShown = s.value(0);
  const minimaShown = s.value(0);

  const showPart3 = s.value(0);
  const bandsLit = s.value(0);
  const edgeLit = s.value(0);
  const keepLit = s.value(0);

  const bgAura = aura(0, 0, 640, '#1628522a', '#ffd16614');

  const eqSix = glowTex(String.raw`J(A, B) = \frac{6}{10} = 0.60`, {
    x: 0,
    y: 280,
    size: 46,
    color: COSMOS.gold,
  });

  const eqEdge = glowTex(String.raw`0.60 \ge 0.50 \implies \text{verified edge } (A, B)`, {
    x: 0,
    y: 255,
    size: 42,
    color: COSMOS.emerald,
  });

  // Part 1: Exact hashing pipeline + byte equality verification
  const part1Live = guardedDynamic(showPart1, (a) => {
    const ex = exactCheck.value;
    const steps = [
      { label: 'Source bytes', sub: 'O(bytes) read', x: -580, color: COSMOS.blue },
      { label: 'Normalize', sub: 'strip / lowercase', x: 0, color: COSMOS.cyan },
      { label: 'Hash digest', sub: 'O(1) bucket lookup', x: 580, color: COSMOS.gold },
    ];
    const nodes = [
      heroTitle(['Exact Digests', 'to MinHash Bands'], {
        x: -855,
        y: -430,
        size: 56,
        lineHeight: 66,
        accent: COSMOS.cyan,
        eyebrow: 'NEAR-DUPLICATE SIGNATURES · 32 SALTED HASHES',
      }).opacity(a),
      ...photonStream([-350, -55], [-230, -55], 0, 0, {
        color: COSMOS.cyan,
        count: 3,
        opacity: a,
      }),
      ...photonStream([230, -55], [350, -55], 0, 0, {
        color: COSMOS.gold,
        count: 3,
        opacity: a,
      }),
    ];

    steps.forEach((st) => {
      nodes.push(
        glassCell(st.x, -55, 430, 148, st.color, { fill: '#0f172b', glow: 8, opacity: a }),
        txt(st.label, st.x, -78, 34, st.color, 'serif').opacity(a),
        txt(st.sub, st.x, -26, 26, COSMOS.muted, 'mono').opacity(a),
      );
    });

    const exOp = (0.48 + 0.52 * ex) * a;
    nodes.push(
      glassCell(0, 185, 1180, 118, ex > 0.3 ? COSMOS.emerald : '#34496e', {
        fill: '#0e2226',
        glow: ex > 0.3 ? 9 : 3,
        opacity: exOp,
      }),
      txt(
        'Compare grouped bytes directly · digest collision != string equality',
        0,
        187,
        30,
        ex > 0.3 ? COSMOS.emerald : COSMOS.muted,
        'sans',
      ).opacity(exOp),
      txt(
        'One edited timestamp flips the digest even when 99% of text is unchanged',
        0,
        360,
        30,
        ex > 0.3 ? COSMOS.amber : COSMOS.muted,
        'sans',
      ).opacity(exOp),
    );

    return group(...nodes);
  });

  // Part 2: Bigram shingle sets for A and B (6 shared + 2 unique each = 10 union)
  const part2Live = guardedDynamic(showPart2, (a) => {
    const sl = shinglesLit.value;
    const sx = sixShown.value;
    const mn = minimaShown.value;

    const listA = [...MINHASH_SHARED, ...MINHASH_UNIQUE_A];
    const listB = [...MINHASH_SHARED, ...MINHASH_UNIQUE_B];

    const nodes = [
      txt('WORD BIGRAM SHINGLES · A vs B', -855, -430, 26, COSMOS.cyan, 'mono', 'left').opacity(a),
      txt('6 Shared in a Union of 10', -855, -355, 52, COSMOS.ink, 'serif', 'left').opacity(a),
      txt('DOC A BIGRAMS (8)', -460, -250, 28, COSMOS.blue, 'mono').opacity(a),
      txt('DOC B BIGRAMS (8)', 460, -250, 28, COSMOS.violet, 'mono').opacity(a),
    ];

    // Arrange each doc's 8 bigrams in a crisp 2-column x 4-row constellation
    listA.forEach((gram, i) => {
      const colIdx = i % 2;
      const rowIdx = Math.floor(i / 2);
      const x = -655 + colIdx * 365;
      const y = -165 + rowIdx * 92;
      const isShared = i < 6;
      const col = isShared && sl > 0.4 ? COSMOS.cyan : COSMOS.blue;
      nodes.push(
        glassCell(x, y, 335, 68, col, {
          fill: isShared && sl > 0.4 ? '#0d2230' : '#10182c',
          glow: isShared && sl > 0.4 ? 8 : 2,
          opacity: a,
        }),
        txt(gram, x, y + 2, 26, isShared && sl > 0.4 ? COSMOS.cyan : COSMOS.ink, 'mono').opacity(a),
      );
    });

    listB.forEach((gram, i) => {
      const colIdx = i % 2;
      const rowIdx = Math.floor(i / 2);
      const x = 290 + colIdx * 365;
      const y = -165 + rowIdx * 92;
      const isShared = i < 6;
      const col = isShared && sl > 0.4 ? COSMOS.cyan : COSMOS.violet;
      nodes.push(
        glassCell(x, y, 335, 68, col, {
          fill: isShared && sl > 0.4 ? '#0d2230' : '#16142e',
          glow: isShared && sl > 0.4 ? 8 : 2,
          opacity: a,
        }),
        txt(gram, x, y + 2, 26, isShared && sl > 0.4 ? COSMOS.cyan : COSMOS.ink, 'mono').opacity(a),
      );
    });

    if (sl > 0.4) {
      nodes.push(
        glowingArc([-120, -70], [120, -70], -30, {
          color: COSMOS.cyan,
          width: 4,
          glow: 10,
          opacity: sl * a,
        }),
        txt('6 shared', 0, -135, 28, COSMOS.cyan, 'mono').opacity(sl * a),
      );
    }

    if (mn > 0.02) {
      nodes.push(
        txt(
          '32 salted blake2b minima -> 8 bands x 4 rows per signature',
          0,
          395,
          32,
          COSMOS.cyan,
          'mono',
        )
          .glow(6, COSMOS.cyan)
          .opacity(mn * a),
      );
    }
    if (sx < 0.05 && mn < 0.05) {
      nodes.push(
        txt(
          'Intersection = 6 bigrams · Union = 10 bigrams',
          0,
          395,
          28,
          COSMOS.muted,
          'mono',
        ).opacity(a),
      );
    }
    return group(...nodes);
  });

  // Part 3: Actual 64-bit Band 1 minima (salts 4..7) colliding between A & B -> verified edge -> keep A, C
  const part3Live = guardedDynamic(showPart3, (a) => {
    const bl = bandsLit.value;
    const el = edgeLit.value;
    const kl = keepLit.value;

    const nodes = [
      txt(
        'EXECUTED BAND-1 MINIMA · SALTS 4, 5, 6, 7',
        -855,
        -430,
        26,
        COSMOS.gold,
        'mono',
        'left',
      ).opacity(a),
      txt(
        'Collision Proposes, Jaccard Verifies',
        -855,
        -355,
        50,
        COSMOS.ink,
        'serif',
        'left',
      ).opacity(a),
      txt('SIGNATURE A · BAND 1', -470, -255, 28, COSMOS.blue, 'mono').opacity(a),
      txt('SIGNATURE B · BAND 1', 470, -255, 28, COSMOS.violet, 'mono').opacity(a),
    ];

    MINHASH_BAND1_HASHES.forEach((hex, i) => {
      const y = -170 + i * 82;
      nodes.push(
        glassCell(-470, y, 470, 64, COSMOS.cyan, { fill: '#0e1b2d', glow: 6, opacity: a }),
        txt(hex, -470, y + 2, 28, COSMOS.cyan, 'mono').opacity(a),
        glassCell(470, y, 470, 64, COSMOS.cyan, { fill: '#0e1b2d', glow: 6, opacity: a }),
        txt(hex, 470, y + 2, 28, COSMOS.cyan, 'mono').opacity(a),
        ...photonStream([-230, y], [230, y], 0, 0, {
          color: COSMOS.gold,
          count: 2,
          opacity: bl * a,
        }),
      );
    });

    if (bl > 0.02) {
      nodes.push(
        txt('MATCHED BANDS: 1 & 3 -> CANDIDATE (A, B)', 0, 155, 32, COSMOS.gold, 'mono')
          .glow(8, COSMOS.gold)
          .opacity(bl * a),
      );
    }
    if (kl > 0.02) {
      nodes.push(
        txt(
          'Component keeps A, drops B (lineage -> A) · C stays separate',
          0,
          390,
          32,
          COSMOS.emerald,
          'sans',
        )
          .glow(6, COSMOS.emerald)
          .opacity(kl * a),
      );
    } else if (el < 0.05) {
      nodes.push(
        txt(
          'All 4 minima in band 1 are identical bit-for-bit',
          0,
          390,
          28,
          COSMOS.muted,
          'sans',
        ).opacity(a),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, part1Live, part2Live, part3Live);

  c.on('pt-minhash-work-exact', () =>
    s.play(exactCheck.to(1, { duration: remainDuration(c, 'pt-minhash-work-exact', 0.6) })),
  );

  c.onBeat(1, () => {
    s.play(
      par(showPart1.to(0, { duration: 0.2 }), delay(showPart2.to(1, { duration: 0.25 }), 0.22)),
    );
  });
  c.on('pt-minhash-work-shingles', () =>
    s.play(shinglesLit.to(1, { duration: remainDuration(c, 'pt-minhash-work-shingles', 0.6) })),
  );
  c.on('pt-minhash-work-six', () =>
    s.play(sixShown.to(1, { duration: remainDuration(c, 'pt-minhash-work-six', 0.5) })),
  );
  c.show('pt-minhash-work-six', eqSix, { fade: 0.35 });
  c.on('pt-minhash-work-minima', () =>
    s.play(minimaShown.to(1, { duration: remainDuration(c, 'pt-minhash-work-minima', 0.6) })),
  );

  c.onBeat(2, () => {
    s.play(
      par(showPart2.to(0, { duration: 0.2 }), delay(showPart3.to(1, { duration: 0.25 }), 0.22)),
    );
  });
  c.hide(2, [eqSix], { fade: 0.2 });

  c.on('pt-minhash-work-bands', () =>
    s.play(bandsLit.to(1, { duration: remainDuration(c, 'pt-minhash-work-bands', 0.6) })),
  );
  c.on('pt-minhash-work-edge', () =>
    s.play(edgeLit.to(1, { duration: remainDuration(c, 'pt-minhash-work-edge', 0.6) })),
  );
  c.show('pt-minhash-work-edge', eqEdge, { fade: 0.35 });
  c.after('pt-minhash-work-keep', () =>
    s.play(keepLit.to(1, { duration: remainAfterDuration(c, 'pt-minhash-work-keep', 0.5) })),
  );
}
