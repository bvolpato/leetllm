import { visionFrame } from '../model.mjs';
import { visionCard, visionLine, visionNote, visionText } from '../defaults.mjs';
export function drawMonitoringResponse(ctx, scene, state, api) {
  const frameState = visionFrame('monitoring-response', state);
  return api.focus.target('dv-monitoring-response-mechanism', () => {
    const { C: themeColors } = api;
    const currentBeat = frameState.beat,
      resultComplete = frameState.after;
    {
      const immediate = visionCard(
          ctx,
          api,
          'Capture + service signals',
          150,
          360,
          650,
          110,
          themeColors.blue,
        ),
        later = visionCard(
          ctx,
          api,
          'Specialist-confirmed outcomes',
          1110,
          360,
          650,
          110,
          themeColors.cyan,
        );
      ['Unreadable · brightness · blur', 'Package presence · actual latency'].forEach((v, i) =>
        visionText(ctx, api, v, 475, 570 + i * 75, 30, themeColors.blue, 'center'),
      );
      ['Case precision · missed damage', 'Source + packaging denominators'].forEach((v, i) =>
        visionText(ctx, api, v, 1435, 570 + i * 75, 30, themeColors.cyan, 'center'),
      );
      visionLine(ctx, api, 960, 340, 960, 730, themeColors.muted, 3);
      visionText(ctx, api, 'Different clocks', 960, 800, 32, themeColors.yellow, 'center');
      if (currentBeat === 0 && resultComplete('immediate-evidence', 0))
        visionText(
          ctx,
          api,
          'Investigate capture now · accuracy waits for outcomes',
          960,
          915,
          34,
          themeColors.ink,
          'center',
        );
      if (currentBeat > 0 && resultComplete('candidate-boundary', 1))
        visionText(
          ctx,
          api,
          'Drift → training candidate → controlled evaluation → promotion',
          960,
          915,
          31,
          themeColors.ink,
          'center',
        );
      visionNote(
        ctx,
        api,
        currentBeat === 2
          ? 'Retain the original bundle and route with every later outcome.'
          : 'A candidate is evaluated before promotion; drift does not authorize an automatic weight swap.',
      );
    }
  });
}
export default {
  id: 'monitoring-response',
  draw: drawMonitoringResponse,
  cues: [
    'dv-monitoring-response-0',
    'dv-monitoring-response-operation-0',
    'dv-immediate-evidence',
    'dv-monitoring-response-1',
    'dv-monitoring-response-operation-1',
    'dv-candidate-boundary',
    'dv-monitoring-response-2',
    'dv-monitoring-response-operation-2',
  ],
};
