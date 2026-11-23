import { voiceDirection } from '../construction.mjs';
import { drawLegacyCard, drawLegacyRoute, drawLegacyText } from '../defaults.mjs';
export function drawCascadedVsNative(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    cueProgress = api.clamp(state.beatP ?? 0, 0, 1);
  const phaseForBeat = (i, a = 0.07, z = 0.9) =>
    currentBeat < i ? 0 : currentBeat > i ? 1 : api.phase(cueProgress, a, z);
  {
    const cascade = api.focus.progress('cascaded-stages', phaseForBeat(0)),
      nativeShown = voiceDirection(state).native;
    drawLegacyText(ctx, api, '“Wait, page owner”', 260, 330, 24, themeColors.blue, 'center');
    const capture = api.focus.target('cascaded-capture', () =>
      drawLegacyCard(ctx, api, 'capture', 130, 400, 260, themeColors.blue, 1, 86),
    );
    const stt = api.focus.target('cascaded-recognition', () =>
      drawLegacyCard(
        ctx,
        api,
        'transcript\nWait, page owner',
        490,
        400,
        300,
        themeColors.cyan,
        1,
        120,
      ),
    );
    const llm = api.focus.target('cascaded-language-model', () =>
      drawLegacyCard(ctx, api, 'language model', 860, 400, 300, themeColors.yellow, 1, 86),
    );
    const tts = api.focus.target('cascaded-synthesis', () =>
      drawLegacyCard(ctx, api, 'synthesize', 1260, 400, 270, themeColors.green, 1, 86),
    );
    const sink = api.focus.target('cascaded-playback', () =>
      drawLegacyCard(ctx, api, 'playback', 1630, 400, 220, themeColors.pink, 1, 86),
    );
    [capture, stt, llm, tts].forEach((node, i) =>
      drawLegacyRoute(ctx, api, node, [stt, llm, tts, sink][i], themeColors.cyan, cascade),
    );
    api.focus.reveal('native-audio-path', () => {
      const native = api.focus.target('native-audio-model', () =>
        drawLegacyCard(
          ctx,
          api,
          'native audio model\nreceived ≠ played',
          750,
          690,
          460,
          themeColors.yellow,
          nativeShown ? 1 : phaseForBeat(1),
          120,
        ),
      );
      if (nativeShown) {
        drawLegacyRoute(ctx, api, capture, native, themeColors.blue, 1);
        drawLegacyRoute(ctx, api, native, sink, themeColors.pink, 1);
      }
    });
    api.focus.reveal('voice-shared-policy', () =>
      api.focus.target('voice-shared-policy', () =>
        drawLegacyCard(
          ctx,
          api,
          'shared: tools · turn policy · cancellation · playback history',
          290,
          880,
          1340,
          themeColors.green,
          1,
          86,
        ),
      ),
    );
  }
}
export default {
  id: 'cascaded-vs-native',
  draw: drawCascadedVsNative,
  cues: [
    'cascaded-stages',
    'cascaded-inspection',
    'native-audio-path',
    'voice-shared-policy',
    'voice-path-comparison',
    'voice-inspection-evidence',
  ],
};
