import { sentence, tinkerConstruction } from '../construction.mjs';
import {
  drawExtendedCard,
  drawExtendedEquation,
  drawExtendedNote,
  drawExtendedText,
} from '../defaults.mjs';
export function drawUniformGroups(ctx, scene, state, api) {
  return paintUniformGroups(ctx, scene, state, api);
}
function paintUniformGroups(ctx, scene, state, api) {
  const { C: themeColors, teaching, focus } = api,
    modelState = tinkerConstruction('uniform-groups', state),
    currentBeat = modelState.b;
  const cueProgress = (beat, index) => sentence(state, 'uniform-groups', beat, index),
    resultComplete = (beat, index) => cueProgress(beat, index) === 1;
  return focus.target('tk-uniform-groups-trace', () => {
    drawExtendedText(
      ctx,
      api,
      currentBeat === 0
        ? 'Center each prompt group separately'
        : 'Optional constant-group filter · demonstration enabled',
      960,
      275,
      34,
      themeColors.yellow,
      'center',
    );
    modelState.rewards.forEach((values, i) => {
      const y = 365 + i * 210,
        kept = !modelState.filterEnabled || i === 0,
        color = kept ? themeColors.blue : themeColors.muted;
      drawExtendedText(ctx, api, 'Prompt group ' + (i + 1), 170, y + 50, 30, color);
      teaching.grid({
        x: 540,
        y,
        width: 420,
        height: 100,
        rows: 1,
        columns: 2,
        labels: [values],
        fontSize: 34,
        fill: themeColors.panel,
        stroke: color,
        textColor: color,
      });
      drawExtendedText(ctx, api, 'mean ' + values[0], 1050, y + 55, 29, themeColors.cyan);
      if (resultComplete(0, 1))
        drawExtendedCard(
          ctx,
          api,
          kept ? 'A = [0, 0]' : 'removed',
          1320,
          y,
          400,
          100,
          kept ? themeColors.green : themeColors.muted,
          31,
        );
    });
    if (currentBeat === 1 && resultComplete(1, 0))
      drawExtendedCard(
        ctx,
        api,
        'All groups uniform → retain one + warning → nonempty list',
        200,
        755,
        1520,
        90,
        themeColors.yellow,
        31,
      );
    if (modelState.auxiliary)
      drawExtendedEquation(
        ctx,
        api,
        '\\nabla J=\\underbrace{0}_{centered\\ reward}+\\underbrace{\\nabla J_{aux}}_{separate\\ configured\\ term}',
        960,
        895,
        34,
        themeColors.cyan,
      );
    drawExtendedNote(
      ctx,
      api,
      currentBeat === 1
        ? 'Pinned training configuration: filtering disabled by default. The fallback creates no reward contrast.'
        : 'Equal rewards remove centered reward signal; they do not erase a separately configured objective.',
    );
  });
}
export default {
  id: 'uniform-groups',
  draw: drawUniformGroups,
  cues: [
    'tk-uniform-groups-0-0',
    'tk-uniform-groups-0-1',
    'tk-uniform-groups-0-2',
    'tk-uniform-groups-1-0',
    'tk-uniform-groups-1-1',
    'tk-uniform-groups-1-2',
    'tk-uniform-groups-1-3',
  ],
};
