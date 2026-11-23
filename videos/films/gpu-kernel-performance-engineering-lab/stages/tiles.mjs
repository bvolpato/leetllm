import { sharedTileSnapshot } from '../construction.mjs';
import { sampleModel } from '../model.mjs';
import { text } from '../defaults.mjs';
export function drawTiles(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    modelState = sampleModel('tiles', state),
    currentBeat = modelState.step;
  {
    const tile = sharedTileSnapshot(currentBeat, state.beatP ?? 0),
      input = Array.from(
        {
          length: 4,
        },
        (_, r) =>
          Array.from(
            {
              length: 4,
            },
            (_, col) => (currentBeat === 0 || (r < 3 && col < 3) ? r * 4 + col : '—'),
          ),
      ),
      shared = Array.from(
        {
          length: 4,
        },
        () => Array(4).fill(''),
      ),
      out = Array.from(
        {
          length: 4,
        },
        () => Array(4).fill(''),
      );
    tile.entries
      .slice(0, tile.loaded)
      .forEach((entry) => (shared[entry.source[0]][entry.source[1]] = entry.value));
    tile.entries
      .slice(0, tile.read)
      .forEach((entry) => (out[entry.target[0]][entry.target[1]] = entry.value));
    const selected =
        tile.entries[Math.min(tile.entries.length - 1, tile.ready ? tile.read : tile.loaded)],
      source = selected.source,
      target = selected.target;
    text(ctx, api, 'Shared tile · ' + tile.phase, 150, 280, 35);
    text(
      ctx,
      api,
      tile.ready
        ? `Consumer reads shared[${source}] → output[${target}]`
        : `Producer stores input[${source}] → shared[${source}]`,
      960,
      345,
      28,
      themeColors.yellow,
      'center',
    );
    const drawGrid = (labels, x, color, highlights) =>
      teaching.grid({
        x,
        y: 400,
        width: 430,
        height: 340,
        rows: 4,
        columns: 4,
        labels,
        fill: themeColors.panel,
        stroke: color,
        textColor: themeColors.ink,
        fontSize: 32,
        highlights,
      });
    const hit = (coordinates) => [
      {
        row: coordinates[0],
        column: coordinates[1],
        fill: '#f4d47730',
        stroke: themeColors.yellow,
      },
    ];
    const a = api.focus.target('tile-global-input', () =>
        drawGrid(input, 140, themeColors.blue, tile.ready ? [] : hit(source)),
      ),
      middle = api.focus.target('tile-shared-storage', () =>
        drawGrid(shared, 745, tile.ready ? themeColors.green : themeColors.yellow, hit(source)),
      ),
      z = api.focus.target('tile-global-output', () =>
        drawGrid(out, 1350, themeColors.cyan, tile.ready ? hit(target) : []),
      );
    api.connect(ctx, a.shape, middle.shape, {
      color: tile.ready ? themeColors.muted : themeColors.yellow,
      gap: 18,
    });
    if (tile.ready)
      api.connect(ctx, middle.shape, z.shape, {
        color: themeColors.cyan,
        gap: 18,
      });
    text(ctx, api, 'GLOBAL INPUT · row loads', 355, 805, 27, themeColors.blue, 'center');
    text(ctx, api, 'SHARED STORAGE · same values', 960, 805, 27, themeColors.yellow, 'center');
    text(ctx, api, 'GLOBAL OUTPUT · swapped indices', 1565, 805, 27, themeColors.cyan, 'center');
    teaching.changeCue(
      {
        x: 250,
        y: 850,
        width: 1420,
        height: 75,
        from: 0,
        to: 16,
        progress: tile.arrived / 16,
        emphasis: tile.phase === 'BLOCK BARRIER' ? 0.8 : 0,
        color: themeColors.yellow,
        restColor: tile.ready ? themeColors.green : themeColors.yellow,
      },
      (cue) =>
        api.focus.target('tiles-written-barrier-arrivals-16-output-reads', () =>
          text(
            ctx,
            api,
            `Written ${tile.loaded}/${tile.entries.length} · barrier arrivals ${tile.arrived}/16 · output reads ${tile.read}/${tile.entries.length}`,
            960,
            900,
            31,
            cue.color,
            'center',
          ),
        ),
    );
    text(
      ctx,
      api,
      currentBeat === 0
        ? 'Consumers begin after every required producer arrives'
        : 'Partial tile: 9 valid writes; all 16 threads still reach the block barrier',
      960,
      975,
      29,
      themeColors.muted,
      'center',
    );
  }
}
export default {
  id: 'tiles',
  draw: drawTiles,
  cues: [
    'tile-load-rows',
    'tile-wait-producers',
    'tile-transposed-reads',
    'tile-matched-producers',
    'tile-all-threads-arrive',
  ],
};
