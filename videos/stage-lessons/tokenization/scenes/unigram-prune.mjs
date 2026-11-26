// Scene 11: unigram-prune: Compare dropping "in" vs "▁rain" -> 41 -> 33 -> 26 -> 21 EM pruning rounds.
import {
  CANDIDATES,
  COSMOS,
  PATHS,
  PRUNE_ROUNDS,
  ROLE,
  aura,
  bindCueBeat,
  group,
  guardedDynamic,
  heroTitle,
  lumBar,
  playCue,
  swapVis,
  tokenPill,
  txt,
} from '../parts.mjs';

export default function unigramPrune(s, c) {
  const view1Vis = s.value(1);
  const view2Vis = s.value(0);
  const showTotal = s.value(0);
  const showQuestion = s.value(0);
  const trialState = s.value(0); // 0=all 3, 1=drop "in", 2=reset, 3=drop "▁rain", 4=verdict
  const pruneRound = s.value(0); // 0=41, 1=33, 2=26, 3=21

  const bgAura = aura(0, 0, 740, '#2a185228', '#113a4f18');
  const title = heroTitle(['Unigram Pruning:', 'which piece can we lose?'], {
    x: -855,
    y: -430,
    size: 52,
    lineHeight: 60,
    accent: ROLE.path,
  });

  const fullSum = PATHS[0] + PATHS[1] + PATHS[2]; // 0.31509
  const withoutInSum = PATHS[0] + PATHS[1]; // 0.31500
  const withoutWholeSum = PATHS[1] + PATHS[2]; // 0.01509

  const view1 = guardedDynamic(view1Vis, (alpha) => {
    const tot = showTotal.value;
    const q = showQuestion.value;
    const tr = Math.round(trialState.value);
    const dropIn = tr === 1;
    const dropWhole = tr === 3;
    const verdict = tr >= 4;
    const nodes = [];

    const rows = [
      { label: '▁rain', score: PATHS[0], dead: dropWhole, col: ROLE.merge },
      { label: '▁  +  rain', score: PATHS[1], dead: false, col: ROLE.piece },
      { label: '▁  +  ra  +  in', score: PATHS[2], dead: dropIn, col: ROLE.path },
    ];

    rows.forEach((row, idx) => {
      const y = -165 + idx * 115;
      const col = row.dead ? ROLE.warn : row.col;
      nodes.push(
        txt(row.label, -855, y, 34, col, 'mono', 'left').opacity((row.dead ? 0.45 : 1) * alpha),
        lumBar(-430, y, (row.score / 0.32) * 560, 32, col, {
          opacity: (row.dead ? 0.18 : 0.92) * alpha,
          maxTrackW: 560,
        }),
        txt(row.dead ? 'BROKEN' : row.score.toFixed(5), 165, y, 30, col, 'mono', 'left').opacity(
          alpha,
        ),
      );
    });

    if (tot > 0.05) {
      const curSum = dropIn ? withoutInSum : dropWhole ? withoutWholeSum : fullSum;
      const pctKept = (curSum / fullSum) * 100;
      const sumCol = dropWhole ? ROLE.warn : ROLE.ok;
      nodes.push(
        txt('SURVIVING WORD PROBABILITY', -855, 200, 26, COSMOS.muted, 'mono', 'left').opacity(
          tot * alpha,
        ),
        lumBar(-855, 255, (curSum / fullSum) * 860, 36, sumCol, {
          opacity: tot * alpha,
          maxTrackW: 860,
        }),
        txt(`${curSum.toFixed(5)}  (${pctKept.toFixed(1)}%)`, 45, 255, 34, sumCol, 'mono', 'left')
          .glow(8, sumCol)
          .opacity(tot * alpha),
      );
    }

    if (q > 0.05 && tr === 0) {
      nodes.push(
        txt(
          'Drop "in" or drop "▁rain": which leaves more probability?',
          -855,
          365,
          30,
          ROLE.merge,
          'mono',
          'left',
        )
          .glow(8, ROLE.merge)
          .opacity(q * alpha),
      );
    }
    if (dropWhole) {
      nodes.push(
        txt(
          'Best path drops 20× (−3.0 nats); only 4.8% total remains',
          -855,
          365,
          30,
          ROLE.warn,
          'mono',
          'left',
        )
          .glow(6, ROLE.warn)
          .opacity(alpha),
      );
    }
    if (verdict) {
      nodes.push(
        txt(
          'Dropping "in" costs less here; EM scores loss across the whole corpus',
          -855,
          365,
          30,
          ROLE.ok,
          'sans',
          'left',
        )
          .glow(6, ROLE.ok)
          .opacity(alpha),
      );
    }

    return group(...nodes);
  });

  // View 2: 41 -> 33 -> 26 -> 21 vocabulary pruning shelf
  const view2 = guardedDynamic(view2Vis, (alpha) => {
    const rd = Math.max(0, Math.min(3, Math.round(pruneRound.value)));
    const goneSet = new Set();
    for (let i = 0; i < rd; i++) {
      for (const p of PRUNE_ROUNDS[i].gone) goneSet.add(p);
    }
    const keptCount = CANDIDATES.length - goneSet.size;
    const nodes = [
      txt(
        `EM PRUNING ROUND ${rd} / 3   ·   KEEPING ~80% EACH STEP`,
        -855,
        -220,
        28,
        ROLE.piece,
        'mono',
        'left',
      ).opacity(alpha),
      txt(`${keptCount} pieces`, 855, -220, 44, ROLE.ok, 'mono', 'right')
        .glow(8, ROLE.ok)
        .opacity(alpha),
    ];

    // 7 columns x 6 rows grid of compact candidate tokens (required 1-char alphabet in emerald!)
    CANDIDATES.forEach((piece, idx) => {
      const col = idx % 7;
      const row = Math.floor(idx / 7);
      const x = -740 + col * 245;
      const y = -120 + row * 82;
      const isGone = goneSet.has(piece);
      const isRequired = piece.length === 1;
      const pillCol = isGone ? COSMOS.rule : isRequired ? ROLE.ok : ROLE.piece;
      nodes.push(
        tokenPill(piece, x, y, {
          w: 215,
          h: 62,
          color: pillCol,
          size: 28,
          glow: isGone ? 0 : isRequired ? 10 : 5,
          opacity: (isGone ? 0.16 : 0.95) * alpha,
        }),
      );
    });

    nodes.push(
      txt(
        '41 → 33 → 26 → 21   ·   Green single-character alphabet pieces always survive',
        -855,
        395,
        28,
        ROLE.ok,
        'sans',
        'left',
      ).opacity(alpha),
    );
    return group(...nodes);
  });

  s.add(bgAura, title, view1, view2);
  playCue(s, c, 'sum', (d) => s.play(showTotal.to(1, { duration: d })), { after: true, dur: 0.45 });
  playCue(s, c, 'which', (d) => s.play(showQuestion.to(1, { duration: d })), { dur: 0.4 });
  // Strictly withhold drop-in outcome until after `remove-short`!
  playCue(s, c, 'remove-short', (d) => s.play(trialState.to(1, { duration: d })), {
    after: true,
    dur: 0.4,
  });
  playCue(s, c, 'reset', (d) => s.play(trialState.to(2, { duration: d })), { dur: 0.35 });
  playCue(s, c, 'remove-whole', (d) => s.play(trialState.to(3, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'choice', (d) => s.play(trialState.to(4, { duration: d })), {
    after: true,
    dur: 0.4,
  });

  playCue(s, c, 'vocabulary', (d) => s.play(swapVis(view1Vis, view2Vis, d)), { dur: 0.65 });
  playCue(s, c, 'round-one', (d) => s.play(pruneRound.to(1, { duration: d })), {
    after: true,
    dur: 0.45,
  });
  playCue(s, c, 'round-two', (d) => s.play(pruneRound.to(2, { duration: d })), {
    after: true,
    dur: 0.45,
  });
  playCue(s, c, 'round-three', (d) => s.play(pruneRound.to(3, { duration: d })), {
    after: true,
    dur: 0.45,
  });
  bindCueBeat(s, c, s.value(0), [
    'restore-score',
    'other-cuts',
    'add',
    'consider-short',
    'consider-whole',
    'short-total',
    'best-left',
    'best-ratio',
    'log-drop',
    'whole-total',
    'fit',
    'fraction',
  ]);
}
