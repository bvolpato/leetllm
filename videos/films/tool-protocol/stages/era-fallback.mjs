import { eraDecision } from '../model.mjs';
import { chip, footer, line, text } from '../defaults.mjs';
export function drawEraFallback(ctx, scene, state, api) {
  return api.focus.target('era-fallback-mechanism', () => {
    const { C: themeColors } = api,
      currentBeat = state.beat ?? 0;
    const cueVisible = (key) => api.focus.visible(`t-era-fallback-${key}`);
    const cueComplete = (key) => api.focus.cue(`t-era-fallback-${key}`)?.phase === 'after';
    {
      const rows =
        currentBeat === 0
          ? [
              [
                'unsupported version',
                eraDecision({
                  kind: 'version',
                }),
                'supported versions',
              ],
              [
                'missing client capability',
                eraDecision({
                  kind: 'capability',
                }),
                'requiredCapabilities',
              ],
            ]
          : currentBeat === 1
            ? [
                [
                  'completed discovery',
                  eraDecision({
                    kind: 'complete',
                  }),
                  'stay modern',
                ],
                [
                  'other error / bounded silence',
                  eraDecision({
                    kind: 'other',
                  }),
                  'only if supported + permitted',
                ],
              ]
            : [
                [
                  'HTTP400 · recognized −32020',
                  eraDecision({
                    transport: 'http',
                    status: 400,
                    kind: 'header',
                  }),
                  'correct header',
                ],
                [
                  'HTTP400 · empty body',
                  eraDecision({
                    transport: 'http',
                    status: 400,
                    kind: 'empty',
                  }),
                  'inspect body first',
                ],
              ];
      text(
        ctx,
        api,
        currentBeat === 2
          ? 'HTTP status alone does not select an era'
          : 'Keep the successful probe and the selected era',
        960,
        265,
        34,
        themeColors.blue,
      );
      rows.forEach(([input, decision, note], i) => {
        const y = 370 + i * 260;
        chip(ctx, api, input, 150, y, 800, themeColors.blue, 100, 30);
        line(ctx, api, 950, y + 50, 1080, y + 50, themeColors.muted);
        const show =
          currentBeat === 0
            ? i === 0
              ? cueComplete('version')
              : cueComplete('capability')
            : currentBeat === 1
              ? i === 0
                ? cueComplete('modern')
                : cueComplete('legacy')
              : i === 0
                ? cueComplete('correct-modern')
                : cueComplete('empty');
        if (show) {
          chip(
            ctx,
            api,
            decision,
            1110,
            y,
            650,
            i ? themeColors.yellow : themeColors.cyan,
            100,
            29,
          );
          text(ctx, api, note, 1435, y + 160, 27, themeColors.muted);
        }
      });
      if (currentBeat === 2 && cueVisible('deprecation'))
        text(
          ctx,
          api,
          'deprecated ≠ removed · earliest revision ≥ 2027-07-28',
          960,
          865,
          31,
          themeColors.yellow,
        );
      footer(
        ctx,
        api,
        'Legacy initialize → response → initialized remains separate from modern per-request metadata.',
      );
    }
  });
}
export default {
  id: 'era-fallback',
  draw: drawEraFallback,
  cues: [
    'era-fallback-beat-0',
    't-era-fallback-version',
    't-era-fallback-capability',
    'era-fallback-beat-1',
    't-era-fallback-modern',
    't-era-fallback-legacy',
    'era-fallback-beat-2',
    't-era-fallback-body',
    't-era-fallback-correct-modern',
    't-era-fallback-empty',
    't-era-fallback-deprecation',
  ],
};
