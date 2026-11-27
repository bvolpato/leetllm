// Scene 21: Which columns are still missing? (Opening row with 3 of 4 shards arrived; rank 2 late -> cols 4 & 5 empty while col 6 stays 1.5; rank 2 arrives -> probe gives 3.0).
import {
  CHECKPOINT_ROW,
  COSMOS,
  ROLE,
  TRACKED_COL,
  aura,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  txt,
  wireStepCues,
} from '../parts.mjs';

export default function recovery(s, c) {
  // step: 0=3 shards arrived (HOLD!), 1=find 2 missing cols (HOLD!), 2=cols 4&5 empty, 3=rank2 lands at offsets, 4=replay probe, 5=both give 3.0
  const step = s.value(0);

  const bgAura = aura(0, 15, 620, '#fbbf241c', '#34d39918');
  const title = heroTitle(['Which Columns Are', 'Still Missing?'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: COSMOS.gold,
    eyebrow: 'PARTIAL SHARD ARRIVAL · GLOBAL OFFSET INTEGRITY',
  });

  const live = guardedDynamic(1, () => {
    const st = Math.round(step.value);
    const nodes = [];

    nodes.push(
      txt(
        st >= 3
          ? 'ALL 4 SAVED SHARDS ARRIVED -> GLOBAL OFFSETS 0..7 COMPLETE'
          : '3 OF 4 SAVED SHARDS ARRIVED (ONE SHARD STILL IN FLIGHT)',
        0,
        -238,
        26,
        st >= 3 ? ROLE.good : COSMOS.gold,
        'mono',
      ),
    );

    CHECKPOINT_ROW.forEach((val, colIdx) => {
      const x = -700 + colIdx * 200;
      const y = -85;
      const isLate = colIdx === 4 || colIdx === 5;
      const isTracked = colIdx === TRACKED_COL;
      const missingNow = isLate && st < 3;
      const col = isTracked ? COSMOS.gold : missingNow ? (st >= 2 ? ROLE.bad : ROLE.dim) : ROLE.tp;

      nodes.push(
        txt(`col ${colIdx}`, x, y - 82, 26, col, 'mono'),
        glassCell(x, y, 168, 108, col, {
          fill: isTracked ? '#282010' : missingNow ? '#2b1220' : '#101f38',
          glow: isTracked || (missingNow && st >= 2) ? 10 : 4,
        }),
        txt(
          missingNow ? (st >= 2 ? 'GAP' : '?') : `${val}`,
          x,
          y,
          30,
          missingNow ? (st >= 2 ? ROLE.bad : COSMOS.muted) : isTracked ? COSMOS.gold : COSMOS.ink,
          'mono',
        ),
        txt(
          `R${Math.floor(colIdx / 2)}`,
          x,
          y + 82,
          26,
          missingNow && st >= 2 ? ROLE.bad : COSMOS.muted,
          'mono',
        ),
      );
    });

    // Status & probe box
    const statusHeadline =
      st <= 1
        ? 'Predict: Which two global column indices are missing from the new reader?'
        : st === 2
          ? 'Cols 4 & 5 are empty (Saved Rank 2 late); col 6 stays anchored at offset 6!'
          : st === 3
            ? 'Saved Rank 2 lands -> metadata places both values at global offsets 4 & 5'
            : st === 4
              ? 'Replay opening probe on col 6: x = 2, w = 1.5 -> compute y = w * x'
              : 'Both TP=4 and TP=2 layouts produce y = 1.5 x 2 = 3.0 (exact match)';

    nodes.push(
      glassCell(0, 165, 1520, 148, st >= 5 ? ROLE.good : st === 2 ? ROLE.bad : COSMOS.gold, {
        fill: st >= 5 ? '#0e2624' : '#111a2e',
        glow: 9,
      }),
      txt(
        st >= 5
          ? 'PROBE VERIFIED: y = 3.0  (NEXT: TEST ONE TRAINING STEP TO CHECK RESTART STATE)'
          : st <= 1
            ? 'Gold weight (1.5) sits at col 6 -> 1.5 x 2 = 3.0'
            : st === 2
              ? 'NEVER CONCATENATE ARRIVED FILES (WOULD SLIDE COL 6 INTO COL 4!)'
              : 'GLOBAL OFFSETS RESTORED: [0, 1, 2, 3, 4, 5, 6, 7]',
        0,
        130,
        26,
        st >= 5 ? ROLE.good : st === 2 ? ROLE.bad : COSMOS.gold,
        'mono',
      ),
      txt(statusHeadline, 0, 192, 26, COSMOS.ink, 'sans'),
    );

    nodes.push(
      txt(
        'Publish a checkpoint only after every required shard and global offset manifest completes',
        0,
        365,
        26,
        COSMOS.muted,
        'sans',
      ),
    );
    return group(...nodes);
  });

  s.add(bgAura, title, live);
  wireStepCues(s, c, step, [
    ['recover-probe', 0],
    ['recover-gap', 1],
    ['recover-offsets', 2, true],
    ['recover-fill', 3, true],
    ['recover-fixed-probe', 4],
    ['recover-fixed-score', 5, true],
  ]);
}
