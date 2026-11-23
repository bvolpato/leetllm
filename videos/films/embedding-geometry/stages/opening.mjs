import { PASSAGES, QUERY } from '../fixtures.mjs';
import { TRACKS } from '../construction.mjs';
import { openingCandidates } from '../model.mjs';
import { cell, geometryText, heading, line, text, vector } from '../defaults.mjs';
function drawComplete(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0),
    cueProgress = (a = 0.12, z = 0.85) => api.phase(progress, a, z);
  if (currentBeat === 2) {
    heading(ctx, api, 'Carry the same named passage cards onto their hand-built coordinates');
    const a = api.teaching.axes({
      x: 250,
      y: 350,
      width: 900,
      height: 540,
      xDomain: [-1, 5],
      yDomain: [-1, 3],
      xTicks: [],
      yTicks: [],
      equalUnits: true,
      xLabel: '',
      yLabel: '',
    });
    api.focus.target('search-question', () => vector(ctx, api, a, QUERY, themeColors.cyan));
    geometryText(ctx, api, 'ripe apple · query [1,0]', 420, 1030, 27, themeColors.cyan, 'center');
    PASSAGES.forEach((r, i) => {
      const end = vector(
          ctx,
          api,
          a,
          r.vector,
          i ? themeColors.pink : themeColors.green,
          i ? cueProgress(0.7, 0.96) : 1,
        ),
        x = i ? 1280 : 1280 - 630 * cueProgress(0.04, 0.35),
        y = i ? 670 - 230 * cueProgress(0.72, 0.96) : 545 + 405 * cueProgress(0.36, 0.7),
        col = i ? themeColors.pink : themeColors.green;
      if (i === 0 || progress > 0.7) line(ctx, api, end.x + 18, end.y, x - 14, y + 40, col, 2);
      api.focus.target('nearest-candidates', () =>
        cell(
          ctx,
          api,
          r.id + ' · ' + r.phrase + ' [' + r.vector.join(', ') + ']',
          x,
          y,
          520,
          80,
          col,
        ),
      );
    });
    return true;
  }
  return false;
}
export function drawOpening(ctx, scene, state, api) {
  if (drawComplete(ctx, scene, state, api)) return;
  const { C: themeColors, components, teaching } = api;
  const beat = state.beat ?? 0;
  const progress = api.clamp(state.beatP ?? 0);
  const phaseForBeat = (from = 0.08, to = 0.82) => api.phase(progress, from, to);
  const card = (
    label,
    x,
    y,
    width,
    height = 82,
    color = themeColors.cyan,
    opacity = 1,
    fontSize = 27,
  ) =>
    components.card({
      id: `${'opening'}-${String(label).slice(0, 15)}-${x}-${y}`,
      label,
      x,
      y,
      width,
      height,
      fill: themeColors.panel,
      stroke: color,
      textColor: color,
      radius: 14,
      padding: 10,
      fontSize,
      opacity,
    });
  const snapshot = TRACKS['opening'].sample({
    beat,
    beatP: progress,
  }).snapshot;
  {
    const candidates = openingCandidates(beat, progress, state.cues);
    const query = api.focus.target('search-question', () =>
      card('Question · ripe apple', 260, 420, 440, 90, themeColors.cyan, 1, 27),
    );
    const vector = api.focus.target('encoder-coordinates', () =>
      components.panel(
        {
          x: 790,
          y: 420,
          width: 390,
          height: 110,
          fill: themeColors.panel,
          stroke: themeColors.blue,
        },
        () => {
          text(ctx, api, 'Toy query coordinates', 985, 461, 25, themeColors.blue, 'center');
          text(
            ctx,
            api,
            `[${QUERY.map((value) => value.toFixed(1)).join(', ')}]`,
            985,
            503,
            25,
            themeColors.blue,
            'center',
          );
        },
      ),
    );
    const result = api.focus.target('nearest-candidates', () => {
      const box = components.panel({
        x: 1260,
        y: 350,
        width: 550,
        height: 370,
        fill: themeColors.panel,
        stroke: themeColors.green,
      });
      text(ctx, api, 'Cosine preview · hand-built fixture', 1284, 391, 25, themeColors.green);
      if (!candidates.stored)
        text(ctx, api, 'Stored passages arrive next', 1284, 480, 26, themeColors.muted);
      else
        candidates.rows.forEach((row, i) => {
          const y = 420 + i * 135,
            color = row.id === 'A' ? themeColors.green : themeColors.pink;
          components.panel({
            x: 1280,
            y,
            width: 510,
            height: 105,
            fill: themeColors.panel,
            stroke: color,
          });
          text(
            ctx,
            api,
            `${candidates.ranked ? row.rank + ' · ' : ''}${row.id} · ${row.phrase}`,
            1300,
            y + 36,
            25,
            color,
          );
          text(
            ctx,
            api,
            `${candidates.ranked ? 'cos ' + row.cosine.toFixed(3) + ' · ' : ''}[${row.vector.map((value) => value.toFixed(1)).join(', ')}]`,
            1300,
            y + 78,
            25,
            themeColors.ink,
          );
        });
      if (candidates.ranked)
        text(ctx, api, 'Higher cosine ranks first', 1284, 697, 24, themeColors.yellow);
      return box;
    });
    if (candidates.stored || snapshot.stage >= 1)
      teaching.transfer({
        source: {
          shape: query,
          opacity: 1,
        },
        target: {
          shape: vector,
          opacity: 1,
        },
        progress: candidates.ranked ? 1 : beat > 1 ? 1 : phaseForBeat(0.1, 0.7),
        color: themeColors.cyan,
        particle: {
          radius: 8,
          fill: themeColors.yellow,
        },
        gap: 14,
      });
    if (candidates.ranked)
      teaching.transfer({
        source: {
          shape: vector,
          opacity: 1,
        },
        target: {
          shape: result,
          opacity: 1,
        },
        progress: 1,
        color: themeColors.green,
        particle: {
          radius: 8,
          fill: themeColors.yellow,
        },
        gap: 14,
      });
    text(ctx, api, snapshot.title, 960, 850, 32, themeColors.yellow, 'center');
  }
}
export default {
  id: 'opening',
  draw: drawOpening,
  cues: [
    'opening-nearest-candidates-b1-1',
    'opening-stored-passages',
    'opening-encoder-coordinates-b2-1',
    'opening-search-question-b3-1',
  ],
};
