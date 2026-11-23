import { visionFrame } from '../model.mjs';
import { visionCard, visionLine, visionNote, visionText } from '../defaults.mjs';
export function drawOutcomeClock(ctx, scene, state, api) {
  const frameState = visionFrame('outcome-clock', state);
  return api.focus.target('dv-outcome-clock-mechanism', () => {
    const { C: themeColors } = api;
    const currentBeat = frameState.beat,
      resultComplete = frameState.after;
    {
      const x = (day) => 280 + (day - 10) * 460;
      visionText(
        ctx,
        api,
        'R-408 · separate event clocks',
        960,
        300,
        38,
        themeColors.ink,
        'center',
      );
      visionLine(ctx, api, x(10), 520, x(13), 520, themeColors.muted, 4);
      const events = [
        ['Capture', 10, themeColors.blue],
        ['Reviewed', 12, themeColors.yellow],
        ['Available', frameState.late ? 13 : 12, themeColors.cyan],
      ];
      events.forEach(([label, day, color], i) => {
        const y = i === 1 ? 420 : 650;
        api.circle(ctx, x(day), 520, 13, color);
        visionLine(ctx, api, x(day), 520, x(day), y, color, 3);
        visionText(
          ctx,
          api,
          label + ' · day ' + day,
          x(day),
          i === 1 ? 380 : y + 45,
          30,
          color,
          'center',
        );
      });
      visionLine(ctx, api, x(12) + 200, 340, x(12) + 200, 740, themeColors.pink, 3);
      visionText(ctx, api, 'Readout day 12', x(12) + 200, 800, 29, themeColors.pink, 'center');
      if (resultComplete('eligible-join', 0))
        visionCard(
          ctx,
          api,
          currentBeat === 1 && resultComplete('outcome-duplicates', 1)
            ? 'Duplicate → error · wrong guideline → excluded'
            : frameState.late
              ? 'Not available at cutoff'
              : 'Eligible at day 12',
          480,
          860,
          960,
          75,
          frameState.late ? themeColors.pink : themeColors.cyan,
        );
      visionNote(
        ctx,
        api,
        currentBeat === 2
          ? 'Append versioned corrections and select them explicitly. Keep the served route unchanged.'
          : 'Review must follow the final case capture; availability must be no later than the report cutoff.',
      );
    }
  });
}
export default {
  id: 'outcome-clock',
  draw: drawOutcomeClock,
  cues: [
    'dv-outcome-clock-0',
    'dv-outcome-clock-operation-0',
    'dv-eligible-join',
    'dv-outcome-clock-1',
    'dv-outcome-clock-operation-1',
    'dv-late-join',
    'dv-outcome-duplicates',
    'dv-outcome-clock-2',
    'dv-outcome-clock-operation-2',
  ],
};
