import { arrow, box, constructionCode, constructionText, focusProgress } from '../defaults.mjs';
export function drawToolProtocol(ctx, scene, state, api) {
  const { C, components: c, teaching: t, phase } = api,
    beat = state.beat ?? 0,
    p = state.beatP ?? 0,
    q = phase(p, 0.05, 0.88);
  {
    const { C: themeColors } = api,
      currentBeat = state.beat ?? 0;
    const done = (id) => focusProgress(ctx, api, id) >= 1;
    api.focus.target('sg-tool-protocol-mechanism', () => {
      const returned = done('sg-tool-result');
      box(
        ctx,
        api,
        'Proposed call',
        ['name: get_run_status', 'run_id: RUN-842'],
        180,
        335,
        650,
        200,
        themeColors.blue,
      );
      box(
        ctx,
        api,
        'Trusted host check',
        ['caller scope: project-alpha', 'operation: read CI status'],
        1040,
        335,
        700,
        200,
        themeColors.yellow,
      );
      arrow(ctx, api, 850, 435, 1020, 435);
      if (returned) {
        box(ctx, api, 'Tool result', ['RUN-842: failed'], 1040, 700, 700, 135, themeColors.green);
        arrow(ctx, api, 1020, 760, 850, 760);
        box(
          ctx,
          api,
          'Next model context',
          ['same call + returned snapshot'],
          180,
          700,
          650,
          135,
          themeColors.blue,
        );
      }
      if (done('sg-tool-record')) {
        constructionText(ctx, api, 'Dashboard record', 180, 950, 36, themeColors.cyan);
        constructionCode(ctx, api, '{"run_id":"RUN-842","status":"failed"}', 585, 950, 42);
      }
    });
  }
}
export default {
  id: 'tool-protocol',
  draw: drawToolProtocol,
  cues: [
    'sg-tool-protocol-0',
    'sg-tool-protocol-1',
    'sg-tool-receive',
    'sg-tool-result',
    'sg-tool-protocol-2',
    'sg-tool-record',
  ],
};
