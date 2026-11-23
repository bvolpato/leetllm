import { envelopeSnapshot } from '../construction.mjs';
import { code, foot, text, visualFocus } from '../defaults.mjs';
export function drawRequestEnvelope(ctx, scene, state, api) {
  const { C: themeColors, components: components, phase } = api,
    beat = state.beat ?? 0,
    progress2 = state.beatP ?? 0,
    q = phase(progress2, 0.05, 0.88);
  {
    const current = envelopeSnapshot(beat, progress2);
    text(
      ctx,
      api,
      beat === 1
        ? 'A separate streamed call · accumulate arguments before dispatch'
        : 'Complete internal proposal',
      960,
      270,
      32,
      themeColors.yellow,
      'center',
    );
    components.panel(
      {
        focusTarget: 'request-envelope-fields',
        x: 250,
        y: 330,
        width: 1390,
        height: 420,
        fill: themeColors.panel,
        stroke: themeColors.blue,
        padding: 30,
      },
      () => {
        code(ctx, api, 'tool: lookup_book', 300, 410, 36, themeColors.blue);
        code(
          ctx,
          api,
          `arguments: ${current.wire || 'awaiting first fragment'}`,
          300,
          520,
          36,
          current.ready ? themeColors.green : themeColors.yellow,
        );
        code(ctx, api, 'call_id: "read-7"', 300, 630, 36, themeColors.cyan);
      },
    );
    visualFocus(ctx, api, 'request-envelope-object-collected-128-bytes-6', () =>
      text(
        ctx,
        api,
        `Collected ${current.bytes} / 128 bytes · ${current.ready ? 'complete + shape accepted' : 'incomplete JSON · dispatch held'}`,
        960,
        815,
        32,
        current.ready ? themeColors.green : themeColors.yellow,
        'center',
      ),
    );
    text(
      ctx,
      api,
      'Complete proposal → parse → dispatch decision',
      960,
      885,
      32,
      themeColors.ink,
      'center',
    );
    foot(
      ctx,
      api,
      'Illustrative internal envelope. Adapt the actual provider call and result fields.',
    );
  }
}
export default {
  id: 'request-envelope',
  draw: drawRequestEnvelope,
  cues: [
    'request-envelope-beat-1-focus-1',
    'request-envelope-beat-2-focus-1',
    'request-envelope-beat-3-focus-1',
  ],
};
