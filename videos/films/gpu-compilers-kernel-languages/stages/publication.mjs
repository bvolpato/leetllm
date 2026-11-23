import { sampleModel } from '../construction.mjs';
import { card, text } from '../defaults.mjs';
export function drawPublication(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    modelState = sampleModel('publication', state),
    currentBeat = modelState.step;
  {
    text(
      ctx,
      api,
      'Eight-byte artifact miniature · temporary construction stays private',
      150,
      290,
      32,
    );
    api.focus.target('publication-grid-publication', () =>
      teaching.grid({
        x: 170,
        y: 400,
        width: 1560,
        height: 130,
        rows: 1,
        columns: 8,
        fill: themeColors.panel,
        stroke: themeColors.muted,
        highlights: Array.from(
          {
            length: modelState.built,
          },
          (_, column) => ({
            row: 0,
            column,
            fill: '#89ddeb3a',
            stroke: themeColors.cyan,
          }),
        ),
      }),
    );
    api.focus.target('publication-s-published-public-complete-artifact-public-absent', () =>
      card(
        ctx,
        api,
        modelState.published ? 'PUBLIC: complete artifact' : 'PUBLIC: absent',
        350,
        680,
        1220,
        modelState.published ? themeColors.green : themeColors.yellow,
        120,
        43,
      ),
    );
    text(
      ctx,
      api,
      'Compile jobs for the same missing key: ' + modelState.duplicateJobs,
      960,
      865,
      36,
      themeColors.blue,
      'center',
    );
  }
}
export default {
  id: 'publication',
  draw: drawPublication,
  cues: [
    'publication-beat-1-focus-1',
    'publication-beat-1-focus-2',
    'publication-beat-2-focus-1',
    'publication-beat-2-focus-2',
  ],
};
