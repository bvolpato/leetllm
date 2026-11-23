import assert from 'node:assert/strict';
import {
  arrow,
  draw,
  dynamic,
  fade,
  fadeIn,
  lagged,
  linear,
  Node,
  rect,
  smoother,
  to,
} from 'vizmatic/stage';
import { chip } from '../../../stage-lessons/kit.mjs';
import { KIB, GIB, BIG_PER_TOKEN } from '../model.mjs';

export const RETENTION_POSITIONS = 20;
export const DROPPED_POSITIONS = Object.freeze([2, 3, 5, 8, 9, 11, 12, 14]);
/** Each retained position stores all of this model's keys and values. */
export function retentionState(droppedCount) {
  const retained = RETENTION_POSITIONS - droppedCount;
  return {
    retained,
    kib: (retained * BIG_PER_TOKEN) / KIB,
    savedKib: (droppedCount * BIG_PER_TOKEN) / KIB,
  };
}
export function buildPositionRetention(
  stage,
  shrink,
  { T, M, place, brief, bar, frameBar, growBar, arrive, clearFirst, handoff },
  { RQ_X },
  { blockParts },
) {
  // Keep fewer positions: some tokens leave the cache, and a later token may need one of them.
  const POS_COUNT = RETENTION_POSITIONS,
    POS_W = 80,
    POS_X = (i) => RQ_X + POS_W / 2 + i * POS_W,
    POS_ROW = -220;
  const dropped = new Set(DROPPED_POSITIONS),
    NEEDED_POS = 9;
  assert.ok(dropped.has(NEEDED_POS));
  const keepFrames = Array.from(
    {
      length: POS_COUNT,
    },
    (_, i) =>
      rect(POS_W - 8, 120, {
        radius: 8,
        fill: 'surface',
        stroke: 'dim',
        width: 2,
      }).at(POS_X(i), POS_ROW),
  );
  const keepCells = Array.from(
    {
      length: POS_COUNT,
    },
    (_, i) =>
      new Node()
        .add(
          rect(POS_W - 8, 120, { radius: 8, fill: 'blue', stroke: null }),
          M(String(i), { size: 32, color: 'bg' }).at(0, 0),
        )
        .at(POS_X(i), POS_ROW)
        .zIndex(1),
  );
  const keepNote = place(
    T('Keep fewer positions', {
      size: 64,
      color: 'blue',
    }),
    RQ_X,
    -340,
  );
  const approxWord = place(
    T('Approximate', {
      italic: true,
      size: 64,
      color: 'red',
    }),
    330,
    -340,
  );
  const laterChip = chip('a later token', {
    w: 370,
    h: 80,
    color: 'red',
    size: 42,
  }).at(POS_X(NEEDED_POS) + 260, -60);
  const laterArrow = arrow([POS_X(NEEDED_POS) + 70, -60], [POS_X(NEEDED_POS), POS_ROW + 66], {
    stroke: 'red',
    width: 6,
    tip: 24,
    bend: -30,
  });
  const laterRing = rect(POS_W + 4, 134, {
    radius: 10,
    stroke: 'red',
    width: 6,
  })
    .at(POS_X(NEEDED_POS), POS_ROW)
    .glow(8)
    .zIndex(2);
  const laterName = place(
    M('may need a dropped token', {
      size: 33,
      color: 'red',
    }),
    POS_X(NEEDED_POS) + 464,
    -60,
  );
  const removed = stage.value(0);
  const dropName = dynamic(() => {
    const count = Math.min(dropped.size, Math.floor(removed.value + 1e-6));
    const { retained, kib, savedKib } = retentionState(count);
    return new Node().add(
      place(
        M(`${retained} × ${BIG_PER_TOKEN / KIB} KiB = ${kib.toLocaleString('en-US')} KiB`, {
          size: 64,
          color: 'blue',
        }),
        RQ_X,
        100,
      ),
      frameBar(RQ_X, 220, 1600, 90),
      bar(RQ_X, 220, (1600 * retained) / POS_COUNT, 90, 'blue'),
      place(
        M(`${savedKib.toLocaleString('en-US')} KiB removed`, { size: 48, color: 'teal' }),
        RQ_X,
        335,
      ),
      place(
        T('FP16 baseline. The selected positions are illustrative.', { size: 38, color: 'dim' }),
        RQ_X,
        425,
      ),
    );
  });
  shrink.on('positions', () =>
    handoff(blockParts, () =>
      arrive(
        lagged(
          keepFrames.map((node) => fadeIn(node)),
          {
            lag: 0.02,
          },
        ),
        lagged(
          keepCells.map((node) => fadeIn(node)),
          {
            lag: 0.02,
          },
        ),
        fadeIn([keepNote, dropName]),
        {
          duration: 0.6,
        },
      ),
    ),
  );
  shrink.on('evicting', () => {
    const step = Math.min(
      0.3,
      (shrink.cue('approx').start - shrink.cue('evicting').start - 0.3) / dropped.size,
    );
    [...dropped].forEach((position, index) =>
      stage.play(
        to(keepCells[position], (node) => node.at(POS_X(position), POS_ROW + 180)),
        brief(fade(keepCells[position], 0), step * 0.35, step * 0.65),
        removed.to(index + 1),
        { duration: step, ease: smoother },
      ),
    );
  });
  shrink.on('approx', () =>
    stage.play(
      fadeIn(approxWord, {
        shift: [12, 0],
      }),
      {
        duration: 0.5,
      },
    ),
  );
  shrink.on('later', () =>
    stage.play(
      fadeIn(laterChip, {
        shift: [0, 12],
      }),
      draw(laterArrow),
      draw(laterRing),
      fadeIn(laterName),
      {
        duration: 0.7,
      },
    ),
  );
  // Two contexts on one scale: 1,600 pixels is forty gibibytes.
  const LONG_SCALE = 1600 / (40 * GIB),
    LONG_TOKENS = 131072,
    ABOUT_TOKENS = 131000;
  assert.equal((LONG_TOKENS * BIG_PER_TOKEN) / GIB, 40);
  assert.equal(Math.round((ABOUT_TOKENS * BIG_PER_TOKEN) / GIB), 40);
  const SHORT_Y = 165,
    LONG_Y = 345;
  const shortTrack = frameBar(RQ_X, SHORT_Y, 1600, 70),
    shortFill = bar(RQ_X, SHORT_Y, BIG_PER_TOKEN * 4096 * LONG_SCALE, 70, 'yellow');
  const shortName = place(
    M(`4,096 tokens: ${(BIG_PER_TOKEN * 4096) / GIB} GiB`, {
      size: 46,
      color: 'yellow',
    }),
    RQ_X,
    SHORT_Y - 62,
  );
  const longTrack = frameBar(RQ_X, LONG_Y, 1600, 70),
    longFill = growBar(RQ_X, LONG_Y, 1600, 70, 'yellow');
  const longName = place(
    M('Target: about 131,000 tokens', {
      size: 46,
      color: 'yellow',
    }),
    RQ_X,
    LONG_Y - 64,
  );
  const longStat = place(
    M(`at ${BIG_PER_TOKEN / KIB} KiB per token: about 40 GiB`, {
      size: 52,
      color: 'yellow',
    }),
    RQ_X,
    420,
  );
  const longNote = place(
    T('FP16 baseline. Llama 3.1 context limit.', {
      size: 50,
      color: 'dim',
    }),
    RQ_X,
    484,
  );
  const toReach = shrink.cue('reach').end - shrink.cue('at-131').start;
  shrink.on('long', () =>
    handoff(
      [dropName],
      () =>
        arrive(fadeIn([shortTrack, shortFill, shortName, longTrack]), {
          duration: 0.45,
        }),
      clearFirst,
    ),
  );
  shrink.on('at-131', () =>
    stage.play(
      brief(fadeIn(longName), 0.4),
      brief(fadeIn(longNote), 0.4),
      brief(fadeIn(longFill.node), 0.1),
      longFill.grow({
        duration: toReach,
        ease: linear,
      }),
      {
        duration: toReach,
      },
    ),
  );
  shrink.after('reach', () =>
    stage.play(
      fadeIn(longStat, {
        shift: [0, 8],
      }),
      {
        duration: 0.5,
      },
    ),
  );
  const keepParts = [
    ...keepFrames,
    ...keepCells,
    keepNote,
    approxWord,
    laterChip,
    laterArrow,
    laterRing,
    laterName,
    dropName,
    shortTrack,
    shortFill,
    shortName,
    longTrack,
    longFill.node,
    longName,
    longStat,
    longNote,
  ];
  return {
    keepParts,
  };
}
