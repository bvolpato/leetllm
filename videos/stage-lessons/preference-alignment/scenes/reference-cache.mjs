// Scene 21: A cached score belongs to one complete scoring recipe (Reference precompute contract + EOS mask invalidation)
import {
  COSMOS,
  TOKEN_BASE,
  TOKEN_NO_EOS,
  aura,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  line,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function referenceCache(s, c) {
  const phase = s.value(0);
  const sContract = s.value(0);
  const sAlter = s.value(0);
  const sMask = s.value(0);
  const sFull = s.value(0);

  const bgAura = aura(0, 20, 620, '#14385c26', '#3c1b2a18');
  const title = heroTitle(['A Cached Score Belongs to', 'One Complete Scoring Recipe'], {
    x: -855,
    y: -415,
    size: 52,
    lineHeight: 62,
    accent: COSMOS.gold,
    eyebrow: 'PRECOMPUTED REFERENCE LOG-PROBS · WEIGHTS · MASK · TRUNCATION · REDUCTION',
  });

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);
    const ct = Math.max(0.75, sContract.value);
    const changed = sMask.value > 0.35 || sAlter.value > 0.6;
    const fl = sFull.value;

    const ids = TOKEN_BASE.fixture.chosenIds; // [0, 2, 1, 2, 4, 0]
    const activeSet = changed ? TOKEN_NO_EOS : TOKEN_BASE;
    const x0 = -730;
    const stride = 250;
    const tokY = -125;

    const nodes = [
      txt(
        'FIXED TEXT RIBBON  [0, 2, 1, 2, 4(EOS), 0(PAD)]  ·  REF R0',
        -855,
        -214,
        26,
        COSMOS.cyan,
        'mono',
        'left',
      ),
    ];

    ids.forEach((id, i) => {
      const cx = x0 + i * stride + 115;
      const sel = activeSet.selected[i];
      const isFlippedEos = i === 4 && changed;
      const col = isFlippedEos
        ? COSMOS.rose
        : sel
          ? COSMOS.emerald
          : i < 2
            ? COSMOS.blue
            : COSMOS.dim;

      nodes.push(
        glassCell(cx, tokY, 210, 88, col, {
          fill: isFlippedEos ? '#29101a' : sel ? '#0e2824' : '#12182b',
          glow: isFlippedEos ? 10 * pulse : sel ? 5 : 2,
          opacity: ct,
        }),
        txt(`t=${i}  id=${id}`, cx, tokY - 12, 26, col, 'mono'),
        txt(
          sel ? 'SCORED' : isFlippedEos ? 'MASKED OUT' : 'EXCLUDED',
          cx,
          tokY + 22,
          26,
          col,
          'mono',
        ),
      );
    });

    // Middle: Old cached scalar vs New mask scalar
    nodes.push(
      glassCell(-440, 62, 800, 146, changed ? COSMOS.rose : COSMOS.cyan, {
        fill: changed ? '#29101a' : '#0f2138',
        glow: changed ? 9 * pulse : 5,
      }),
      txt(
        'OLD CACHED REF SCALAR (WITH EOS)',
        -805,
        22,
        26,
        changed ? COSMOS.rose : COSMOS.cyan,
        'mono',
        'left',
      ),
      txt(
        `ref_sum = ${TOKEN_BASE.chosenRef.toFixed(4)}   ${changed ? '(STALE FOR NEW MASK!)' : '(VALID FOR R0 + MASK)'}`,
        -805,
        84,
        28,
        COSMOS.ink,
        'mono',
        'left',
      ),

      glassCell(440, 62, 800, 146, changed ? COSMOS.emerald : COSMOS.gold, {
        fill: changed ? '#0e2824' : '#221c0e',
        glow: changed ? 9 * pulse : 4,
      }),
      txt(
        changed ? 'RECOMPUTED REF SCALAR (NO EOS)' : 'CACHE KEY OWNERS (ALL MUST MATCH)',
        75,
        22,
        26,
        changed ? COSMOS.emerald : COSMOS.gold,
        'mono',
        'left',
      ),
      txt(
        changed
          ? `ref_sum = ${TOKEN_NO_EOS.chosenRef.toFixed(4)} (same text, new sum)`
          : 'R0 weights · tokenizer · mask · sum/mean',
        75,
        84,
        26,
        COSMOS.ink,
        'mono',
        'left',
      ),

      // Bottom: Full-model post-update constraint
      glassCell(0, 294, 1680, 174, fl > 0.2 ? COSMOS.amber : COSMOS.dim, {
        fill: '#13192b',
        glow: fl > 0.2 ? 8 * pulse : 3,
        opacity: Math.max(0.75, fl),
      }),
      txt(
        'FULL-MODEL PRECOMPUTE CONTRACT (TRL 1.17.1)',
        -805,
        240,
        26,
        COSMOS.amber,
        'mono',
        'left',
      ),
      txt(
        '1. Updated actor pi_1 cannot recreate original R0 scores for a NEW uncached eval split (raises error).',
        -805,
        294,
        26,
        COSMOS.ink,
        'sans',
        'left',
      ),
      txt(
        '2. Precompute conflicts with sync_ref_model -> provide planned eval splits at init or retain frozen R0.',
        -805,
        346,
        26,
        COSMOS.cyan,
        'sans',
        'left',
      ),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('reference-cache-b0', () =>
    s.play(sContract.to(1, { duration: remainDuration(c, 'reference-cache-b0', 0.45) })),
  );
  c.on('reference-cache-b1', () =>
    s.play(sAlter.to(1, { duration: remainDuration(c, 'reference-cache-b1', 0.5) })),
  );
  c.on('pa-cache-mask', () =>
    s.play(sMask.to(1, { duration: remainDuration(c, 'pa-cache-mask', 0.55) })),
  );
  c.on('reference-cache-b2', () =>
    s.play(sFull.to(1, { duration: remainDuration(c, 'reference-cache-b2', 0.55) })),
  );
}
