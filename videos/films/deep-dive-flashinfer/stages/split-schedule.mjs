import { clip } from '../arithmetic.mjs';
import { flashCue, flashinferExtensionFrame } from '../construction.mjs';
import { extensionText, footer, header, rect } from '../defaults.mjs';
export function drawSplitSchedule(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = flashinferExtensionFrame('split-schedule', state),
    { b: currentBeat, p: progress } = modelState;
  return api.focus.target('fi-split-schedule-mechanism', () => {
    header(
      ctx,
      api,
      currentBeat >= 1
        ? 'Same four chunks, only two available lanes'
        : 'Supplied dependency model · cost units',
    );
    const lanes = modelState.lanes,
      clock =
        currentBeat > 1
          ? 9
          : currentBeat === 0
            ? 5 * flashCue(state, 'fi-split-schedule-four', 0)
            : 9 * flashCue(state, 'fi-split-schedule-two', 1),
      unit = 75,
      left = 380;
    for (let lane = 0; lane < lanes; lane++) {
      extensionText(ctx, api, 'Lane ' + lane, 180, 440 + lane * 120, 29, themeColors.blue);
      const assignments = Array.from(
        {
          length: 4,
        },
        (_, i) => i,
      ).filter((i) => i % lanes === lane);
      for (const chunk of assignments) {
        const start = Math.floor(chunk / lanes) * 4,
          x = left + start * unit,
          y = 390 + lane * 120;
        rect(ctx, api, x, y, 4 * unit, 75, themeColors.panel, themeColors.muted);
        const work = clip((clock - start) / 4);
        if (work > 0) rect(ctx, api, x, y, 4 * unit * work, 75, themeColors.blue, 'transparent');
        extensionText(
          ctx,
          api,
          'chunk ' + chunk + ' ·4',
          x + 145,
          y + 49,
          27,
          themeColors.ink,
          'center',
        );
      }
    }
    const mergeAt = (4 * 4) / lanes;
    rect(ctx, api, left + mergeAt * unit, 390, unit, 75, themeColors.panel, themeColors.muted);
    if (clock > mergeAt)
      rect(
        ctx,
        api,
        left + mergeAt * unit,
        390,
        unit * clip(clock - mergeAt),
        75,
        themeColors.yellow,
        'transparent',
      );
    extensionText(
      ctx,
      api,
      'merge 1',
      left + (mergeAt + 0.5) * unit,
      350,
      25,
      themeColors.yellow,
      'center',
    );
    if (modelState.resultReady)
      extensionText(
        ctx,
        api,
        'Finish ' + modelState.finish + ' cost units',
        1300,
        850,
        37,
        themeColors.green,
        'center',
      );
    if (modelState.speedReady)
      extensionText(ctx, api, '16 /5 =3.2× idealized', 500, 915, 34, themeColors.green, 'center');
    footer(
      ctx,
      api,
      'Original serial task 16 units · no launch, transfer or contention overhead in this supplied model',
    );
  });
}
export default {
  id: 'split-schedule',
  draw: drawSplitSchedule,
  cues: [
    'fi-split-schedule-0',
    'fi-split-schedule-0-result',
    'fi-split-schedule-four',
    'fi-split-schedule-speed',
    'fi-split-schedule-1',
    'fi-split-schedule-1-result',
    'fi-split-schedule-two',
    'fi-split-schedule-2',
    'fi-split-schedule-2-result',
  ],
};
