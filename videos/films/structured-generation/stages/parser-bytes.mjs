import { arrow, box, constructionFooter, focusProgress, label } from '../defaults.mjs';
export function drawParserBytes(ctx, scene, state, api) {
  const { C, components: c, teaching: t, phase } = api,
    beat = state.beat ?? 0,
    p = state.beatP ?? 0,
    q = phase(p, 0.05, 0.88);
  {
    const { C: themeColors } = api,
      currentBeat = state.beat ?? 0;
    const done = (id) => focusProgress(ctx, api, id) >= 1;
    api.focus.target('sg-parser-bytes-mechanism', () => {
      if (currentBeat === 0) {
        const pairs = focusProgress(ctx, api, 'sg-parser-pairs'),
          last = done('sg-parser-last');
        box(
          ctx,
          api,
          'Completed reply · ordered pairs',
          ['("run_id", "842")', '("run_id", "999")'],
          180,
          320,
          750,
          220,
          themeColors.blue,
        );
        box(
          ctx,
          api,
          'Duplicate-aware object hook',
          [
            pairs > 0 ? 'seen run ID: 842' : 'await completed text',
            done('sg-duplicate-reject') ? 'second run ID → reject' : 'inspect each pair',
          ],
          1050,
          320,
          690,
          220,
          done('sg-duplicate-reject') ? themeColors.pink : themeColors.yellow,
        );
        if (pairs > 0) arrow(ctx, api, 945, 425, 1030, 425, themeColors.yellow);
        box(
          ctx,
          api,
          'Ordinary dictionary conversion',
          last ? ['run ID: 999', '842 was overwritten'] : ['two pairs remain inspectable'],
          350,
          700,
          1220,
          170,
          last ? themeColors.pink : themeColors.blue,
        );
        constructionFooter(
          ctx,
          api,
          'The duplicate check runs before dictionary conversion destroys the evidence.',
        );
      } else if (currentBeat === 1) {
        const finite = focusProgress(ctx, api, 'sg-parser-overflow');
        box(
          ctx,
          api,
          'Nonstandard constants',
          ['NaN / Infinity'],
          180,
          320,
          700,
          170,
          themeColors.blue,
        );
        box(ctx, api, 'Decimal exponent', ['1e999'], 1030, 320, 710, 170, themeColors.blue);
        if (done('sg-parser-constants'))
          label(ctx, api, 'constant hook rejects', 530, 575, themeColors.pink, 31);
        if (finite > 0) {
          box(ctx, api, 'Converted float', ['Infinity'], 1030, 620, 710, 145, themeColors.yellow);
          arrow(ctx, api, 1385, 505, 1385, 600, themeColors.yellow);
        }
        if (done('sg-finite-reject'))
          label(ctx, api, 'finite check rejects', 1385, 845, themeColors.pink, 31);
        if (done('sg-parser-object'))
          label(
            ctx,
            api,
            '[] parses, but the required object contract rejects it',
            960,
            915,
            themeColors.pink,
            30,
          );
        constructionFooter(
          ctx,
          api,
          'Syntax acceptance and finite typed values are separate checks.',
        );
      } else {
        const stop = done('sg-parser-incomplete');
        box(
          ctx,
          api,
          'Protocol envelope',
          ['status: incomplete', 'text: {broken'],
          180,
          350,
          720,
          210,
          themeColors.yellow,
        );
        box(
          ctx,
          api,
          'Local parser',
          stop ? ['NOT CALLED', 'return incomplete'] : ['await completion check'],
          1030,
          350,
          710,
          210,
          stop ? themeColors.pink : themeColors.blue,
        );
        if (stop)
          label(ctx, api, 'No provisional record is committed', 960, 795, themeColors.pink, 37);
        constructionFooter(
          ctx,
          api,
          'External byte and nesting limits still bound the receiving interface.',
        );
      }
    });
  }
}
export default {
  id: 'parser-bytes',
  draw: drawParserBytes,
  cues: [
    'sg-parser-bytes-0',
    'sg-duplicate-reject',
    'sg-parser-provisional',
    'sg-parser-pairs',
    'sg-parser-last',
    'sg-parser-bytes-1',
    'sg-finite-reject',
    'sg-parser-constants',
    'sg-parser-overflow',
    'sg-parser-object',
    'sg-parser-bytes-2',
    'sg-parser-incomplete',
  ],
};
