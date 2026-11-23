import { coreBox, coreFoot, coreTitle } from '../defaults.mjs';
export function drawHostedContract(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress2 = api.clamp(state.beatP ?? 0),
    operation = state.cues?.[`dec-hosted-contract-${currentBeat + 1}`],
    u =
      operation?.phase === 'before'
        ? 0
        : operation?.phase === 'after'
          ? 1
          : (operation?.progress ?? progress2);
  const done = (id) => state.cues?.['dec-' + id]?.phase === 'after';
  api.focus.target('dec-hosted-contract-mechanism', () => {
    coreTitle(
      ctx,
      api,
      currentBeat === 0
        ? 'A submitted field has an observable runtime outcome'
        : 'Documented controls depend on the effective model and API version',
    );
    if (currentBeat === 0) {
      ['accepted and applied', 'rejected: HTTP 400', 'accepted but ignored'].forEach((v, i) => {
        coreBox(ctx, api, 'temperature field', 180 + i * 560, 400, 480, 90, themeColors.blue);
        api.arrow(ctx, 420 + i * 560, 520, 420 + i * 560, 655, themeColors.muted, 3);
        coreBox(
          ctx,
          api,
          v,
          180 + i * 560,
          730,
          480,
          100,
          i === 1 ? themeColors.pink : themeColors.cyan,
          28,
        );
      });
    } else if (currentBeat === 1) {
      const rows = [
        ['Claude API 2026-10-21', 'sampling fields rejected', 'host-claude'],
        ['GPT-6, effort enabled', 'temperature / top-p removed', 'host-gpt'],
        ['Cited Gemini release', 'sampling fields ignored', 'host-gemini'],
      ];
      rows.forEach(([name, result, cue], i) => {
        const y = 380 + i * 190;
        coreBox(ctx, api, name, 180, y, 680, 100, themeColors.blue, 28);
        api.arrow(ctx, 920, y + 50, 1040, y + 50, themeColors.muted, 3);
        coreBox(
          ctx,
          api,
          done(cue) ? result : 'read exact versioned contract',
          1100,
          y,
          650,
          100,
          done(cue) ? themeColors.yellow : themeColors.muted,
          27,
        );
      });
    } else {
      coreBox(ctx, api, 'effort: reasoning-work policy', 230, 420, 660, 120, themeColors.blue);
      coreBox(ctx, api, 'temperature: next-token row', 1030, 420, 660, 120, themeColors.cyan);
      coreBox(
        ctx,
        api,
        'schema: eligible output structure',
        230,
        750,
        1460,
        115,
        themeColors.green,
      );
    }
    coreFoot(
      ctx,
      api,
      'These are inspected documentation contracts as of November 2026, not live API measurements.',
    );
    return;
  });
}
export default {
  id: 'hosted-contract',
  draw: drawHostedContract,
  cues: [
    'dec-hosted-contract-1',
    'dec-hosted-contract-2',
    'dec-host-claude',
    'dec-host-gpt',
    'dec-host-gemini',
    'dec-hosted-contract-3',
  ],
};
