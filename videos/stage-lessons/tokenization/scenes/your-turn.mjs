// Scene 21: your-turn: Three transfer exercises (BPE snow, WordPiece snowball, Unigram ▁snow) with strict answer withholding.
import {
  COSMOS,
  ROLE,
  SNOW,
  arcPts,
  aura,
  bindCueBeat,
  glowDot,
  glowingTrail,
  group,
  guardedDynamic,
  heroTitle,
  playCue,
  swapVis,
  tokenPill,
  txt,
} from '../parts.mjs';

export default function yourTurn(s, c) {
  const ex1Vis = s.value(1);
  const ex2Vis = s.value(0);
  const ex3Vis = s.value(0);

  // Strictly withheld reveals for all 3 exercises!
  const ex1Start = s.value(0); // 38 positions
  const ex1Merge = s.value(0); // o+w = 9
  const ex1Left = s.value(0); // 29 positions

  const ex2Commit = s.value(0); // snowb
  const ex2Unk = s.value(0); // [UNK]

  const ex3Win = s.value(0); // 0.25 * 0.40 = 0.10 > 0.05

  const bgAura = aura(0, 0, 740, '#1e2c5c28', '#2a1d5418');
  const title = heroTitle(['Your turn:', 'apply all three'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 62,
    accent: ROLE.merge,
  });

  // Exercise 1: BPE on snow (x4), snowy (x2), show (x3) -> 38 -> merge o+w (9) -> 29
  const ex1 = guardedDynamic(ex1Vis, (alpha) => {
    const s38 = ex1Start.value;
    const mow = ex1Merge.value;
    const s29 = ex1Left.value;
    const nodes = [
      txt('EXERCISE 1 · BPE FIRST MERGE', -855, -220, 28, ROLE.piece, 'mono', 'left').opacity(
        alpha,
      ),
      txt(
        'snow × 4  ·  snowy × 2  ·  show × 3',
        -855,
        -135,
        32,
        COSMOS.ink,
        'mono',
        'left',
      ).opacity(alpha),
    ];

    // Right-side visual letter tiles for snow / snowy / show so the mechanism fills the canvas
    const snap = mow > 0.5 ? SNOW[1].words : SNOW[0].words;
    snap.forEach((word, rowIdx) => {
      const y = -135 + rowIdx * 105;
      nodes.push(txt(`×${word.count}`, 255, y, 32, ROLE.merge, 'mono', 'center').opacity(alpha));
      let cx = 315;
      word.pieces.forEach((piece) => {
        const w = piece.length > 1 ? 114 : 74;
        const col = piece.length > 1 ? ROLE.merge : ROLE.piece;
        nodes.push(
          tokenPill(piece, cx + w * 0.5, y, {
            w,
            h: 68,
            color: col,
            size: 32,
            opacity: alpha,
          }),
        );
        cx += w + 14;
      });
    });

    if (s38 < 0.2) {
      nodes.push(
        txt(
          'How many starting positions, and which pair merges first?',
          -855,
          20,
          34,
          ROLE.merge,
          'serif',
          'left',
        )
          .glow(8, ROLE.merge)
          .opacity((1 - s38 * 5) * alpha),
      );
    }
    if (s38 > 0.2) {
      nodes.push(
        txt(
          `Start: 4×4 + 5×2 + 4×3 = ${SNOW[0].positions} positions`,
          -855,
          10,
          34,
          ROLE.piece,
          'mono',
          'left',
        ).opacity(s38 * alpha),
      );
    }
    if (mow > 0.2) {
      nodes.push(
        txt(
          `Top pair: "${SNOW[1].merged.left} + ${SNOW[1].merged.right}" appears ${SNOW[1].merged.count} times`,
          -855,
          95,
          36,
          ROLE.merge,
          'mono',
          'left',
        )
          .glow(8, ROLE.merge)
          .opacity(mow * alpha),
      );
    }
    if (s29 > 0.2) {
      nodes.push(
        txt(
          `${SNOW[0].positions} − ${SNOW[1].merged.count} = ${SNOW[1].positions} positions left`,
          -855,
          185,
          38,
          ROLE.ok,
          'mono',
          'left',
        )
          .glow(8, ROLE.ok)
          .opacity(s29 * alpha),
      );
    }
    return group(...nodes);
  });

  // Exercise 2: WordPiece on "snowball" with {snow, ##ball, snowb} -> [UNK]
  const ex2 = guardedDynamic(ex2Vis, (alpha) => {
    const com = ex2Commit.value;
    const unk = ex2Unk.value;
    const nodes = [
      txt('EXERCISE 2 · GREEDY WORDPIECE', -855, -220, 28, ROLE.piece, 'mono', 'left').opacity(
        alpha,
      ),
      tokenPill('snow', -730, -125, { w: 190, h: 70, color: ROLE.piece, opacity: alpha }),
      tokenPill('##ball', -500, -125, { w: 205, h: 70, color: ROLE.piece, opacity: alpha }),
      tokenPill('snowb', -255, -125, { w: 205, h: 70, color: ROLE.merge, opacity: alpha }),
      txt('Word:  "snowball"', 20, -125, 38, COSMOS.ink, 'mono', 'left').opacity(alpha),
    ];

    if (com < 0.2) {
      nodes.push(
        txt(
          'What does the greedy matcher return for "snowball"?',
          -855,
          45,
          36,
          ROLE.merge,
          'serif',
          'left',
        )
          .glow(8, ROLE.merge)
          .opacity((1 - com * 5) * alpha),
      );
    }
    if (com > 0.2) {
      nodes.push(
        txt(
          'Longest prefix takes "snowb" → no "##all" continuation exists',
          -855,
          45,
          32,
          ROLE.merge,
          'mono',
          'left',
        ).opacity(com * alpha),
      );
    }
    if (unk > 0.2) {
      nodes.push(
        tokenPill('[UNK]', -730, 185, {
          w: 220,
          h: 84,
          color: ROLE.warn,
          fill: '#2c1120',
          size: 42,
          glow: 14,
          opacity: unk * alpha,
        }),
        txt('No backtrack → [UNK]', -560, 185, 34, ROLE.warn, 'sans', 'left')
          .glow(6, ROLE.warn)
          .opacity(unk * alpha),
      );
    }
    return group(...nodes);
  });

  // Exercise 3: Unigram on "▁snow": ▁snow (0.05) vs ▁ (0.25) × snow (0.40) = 0.10
  const ex3 = guardedDynamic(ex3Vis, (alpha) => {
    const win = ex3Win.value;
    const bXs = [210, 370, 770];
    const ry = -20;
    const nodes = [
      txt('EXERCISE 3 · UNIGRAM COMPLETE PATHS', -855, -220, 28, ROLE.path, 'mono', 'left').opacity(
        alpha,
      ),
      txt('Path A:   ▁snow   =   0.05', -855, -120, 36, COSMOS.ink, 'mono', 'left').opacity(alpha),
      txt(
        'Path B:   ▁ (0.25)   +   snow (0.40)',
        -855,
        -35,
        36,
        ROLE.piece,
        'mono',
        'left',
      ).opacity(alpha),
      // Right-side mini Unigram lattice comparing Path A (top) vs Path B (bottom)
      glowDot(bXs[0], ry, { radius: 8, color: ROLE.piece, opacity: alpha }),
      glowDot(bXs[1], ry, { radius: 8, color: ROLE.piece, opacity: alpha }),
      glowDot(bXs[2], ry, { radius: 8, color: ROLE.piece, opacity: alpha }),
      txt('▁', (bXs[0] + bXs[1]) * 0.5, ry, 36, COSMOS.ink, 'mono', 'center').opacity(alpha),
      txt('snow', (bXs[1] + bXs[2]) * 0.5, ry, 36, COSMOS.ink, 'mono', 'center').opacity(alpha),
      glowingTrail(arcPts([bXs[0], ry - 12], [bXs[2], ry - 12], -150, 28), {
        color: win > 0.5 ? COSMOS.muted : ROLE.merge,
        width: 4,
        opacity: alpha,
      }),
      txt(
        '0.05',
        490,
        ry - 115,
        28,
        win > 0.5 ? COSMOS.muted : ROLE.merge,
        'mono',
        'center',
      ).opacity(alpha),
      glowingTrail(arcPts([bXs[0], ry + 12], [bXs[1], ry + 12], 105, 18), {
        color: win > 0.5 ? ROLE.ok : ROLE.piece,
        width: win > 0.5 ? 5.5 : 4,
        opacity: alpha,
      }),
      glowingTrail(arcPts([bXs[1], ry + 12], [bXs[2], ry + 12], 125, 24), {
        color: win > 0.5 ? ROLE.ok : ROLE.piece,
        width: win > 0.5 ? 5.5 : 4,
        opacity: alpha,
      }),
      txt('0.25', 290, ry + 115, 28, win > 0.5 ? ROLE.ok : ROLE.piece, 'mono', 'center').opacity(
        alpha,
      ),
      txt('0.40', 570, ry + 125, 28, win > 0.5 ? ROLE.ok : ROLE.piece, 'mono', 'center').opacity(
        alpha,
      ),
    ];

    if (win < 0.2) {
      nodes.push(
        txt('Which path wins?', -855, 110, 40, ROLE.merge, 'serif', 'left')
          .glow(8, ROLE.merge)
          .opacity((1 - win * 5) * alpha),
      );
    }
    if (win > 0.2) {
      nodes.push(
        txt('Path B wins:   0.25 × 0.40 = 0.10   >   0.05', -855, 110, 38, ROLE.ok, 'mono', 'left')
          .glow(10, ROLE.ok)
          .opacity(win * alpha),
        txt(
          'Fewer pieces lost because Unigram scores complete path probability',
          -855,
          205,
          30,
          COSMOS.muted,
          'sans',
          'left',
        ).opacity(win * alpha),
      );
    }
    return group(...nodes);
  });

  s.add(bgAura, title, ex1, ex2, ex3);

  // Exercise 1 answers strictly withheld until after spoken cues!
  playCue(s, c, 'thirty-eight', (d) => s.play(ex1Start.to(1, { duration: d })), {
    after: true,
    dur: 0.35,
  });
  playCue(s, c, 'ow', (d) => s.play(ex1Merge.to(1, { duration: d })), { after: true, dur: 0.35 });
  playCue(s, c, 'twenty-nine', (d) => s.play(ex1Left.to(1, { duration: d })), {
    after: true,
    dur: 0.35,
  });

  // Exercise 2
  playCue(s, c, 'vocab', (d) => s.play(swapVis(ex1Vis, ex2Vis, d)), { dur: 0.6 });
  playCue(s, c, 'longest', (d) => s.play(ex2Commit.to(1, { duration: d })), {
    after: true,
    dur: 0.35,
  });
  playCue(s, c, 'unknown', (d) => s.play(ex2Unk.to(1, { duration: d })), {
    after: true,
    dur: 0.4,
  });

  // Exercise 3
  playCue(s, c, 'marker', (d) => s.play(swapVis(ex2Vis, ex3Vis, d)), { dur: 0.6 });
  playCue(s, c, 'product-result', (d) => s.play(ex3Win.to(1, { duration: d })), {
    after: true,
    dur: 0.4,
  });
  bindCueBeat(s, c, s.value(0), [
    'corpus',
    'question',
    'question-wp',
    'no-finish',
    'alone',
    'question-u',
    'product',
    'comparison',
    'fewer',
  ]);
}
