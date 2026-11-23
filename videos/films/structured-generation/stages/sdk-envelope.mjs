import { box, constructionFooter, focusProgress, label } from '../defaults.mjs';
export function drawSdkEnvelope(ctx, scene, state, api) {
  const { C, components: c, teaching: t, phase } = api,
    beat = state.beat ?? 0,
    p = state.beatP ?? 0,
    q = phase(p, 0.05, 0.88);
  {
    const { C: themeColors } = api,
      currentBeat = state.beat ?? 0;
    const done = (id) => focusProgress(ctx, api, id) >= 1;
    api.focus.target('sg-sdk-envelope-mechanism', () => {
      if (currentBeat === 0) {
        const a = done('sg-sdk-responses'),
          d = done('sg-sdk-claude');
        box(
          ctx,
          api,
          'One local schema artifact',
          ['RunStatusUpdate'],
          180,
          325,
          1560,
          140,
          themeColors.blue,
        );
        box(
          ctx,
          api,
          'OpenAI Responses',
          a ? ['text.format', 'strict schema'] : ['place schema in request'],
          180,
          630,
          720,
          190,
          a ? themeColors.cyan : themeColors.blue,
        );
        box(
          ctx,
          api,
          'Claude Messages',
          d ? ['output_config.format', 'supported strict subset'] : ['place schema in request'],
          1030,
          630,
          710,
          190,
          d ? themeColors.cyan : themeColors.blue,
        );
        constructionFooter(
          ctx,
          api,
          'Constructed local request objects do not execute a provider model.',
        );
      } else if (currentBeat === 1) {
        const gates = [
          ['Protocol completed', 'sg-sdk-completed'],
          ['Refusal examined', 'sg-sdk-refusal'],
          ['Parsed data present', 'sg-sdk-parsed'],
        ];
        box(
          ctx,
          api,
          'Reply envelope',
          ['status / refusal / parsed data'],
          180,
          315,
          1560,
          155,
          themeColors.blue,
        );
        gates.forEach(([name, id], i) => {
          const x = 200 + i * 550;
          box(
            ctx,
            api,
            name,
            [done(id) ? 'check required' : 'not examined'],
            x,
            610,
            460,
            150,
            done(id) ? themeColors.yellow : themeColors.blue,
          );
        });
        if (done('sg-sdk-no-delta-commit'))
          label(ctx, api, 'A parsed delta alone earns no commit', 960, 880, themeColors.pink, 35);
        constructionFooter(
          ctx,
          api,
          'Parsing exceptions and transport failures remain different outcomes.',
        );
      } else {
        box(
          ctx,
          api,
          'Response accounting',
          ['internal reasoning tokens', 'visible final response'],
          180,
          345,
          720,
          210,
          themeColors.blue,
        );
        box(
          ctx,
          api,
          'Application commit',
          ['completion', 'local validation'],
          1030,
          345,
          710,
          210,
          themeColors.yellow,
        );
        label(
          ctx,
          api,
          'Final-format restrictions do not expose internal reasoning',
          960,
          795,
          themeColors.ink,
          34,
        );
        constructionFooter(
          ctx,
          api,
          'Raw text, typed values and streams keep the same application checks.',
        );
      }
    });
  }
}
export default {
  id: 'sdk-envelope',
  draw: drawSdkEnvelope,
  cues: [
    'sg-sdk-envelope-0',
    'sg-sdk-responses',
    'sg-sdk-claude',
    'sg-sdk-envelope-1',
    'sg-sdk-completed',
    'sg-sdk-refusal',
    'sg-sdk-parsed',
    'sg-sdk-no-delta-commit',
    'sg-sdk-envelope-2',
  ],
};
