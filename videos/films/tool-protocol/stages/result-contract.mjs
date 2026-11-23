import { chip, codePanel, footer, line, text } from '../defaults.mjs';
import {
  executeStatusCall,
  requestEnvelope,
  validateStatusReply,
  validationFixture,
} from '../model.mjs';
import { statusPayload } from '../fixtures.mjs';
export function drawResultContract(ctx, scene, state, api) {
  return api.focus.target('result-contract-mechanism', () => {
    const { C: themeColors } = api,
      currentBeat = state.beat ?? 0;
    const cueComplete = (key) => api.focus.cue(`t-result-contract-${key}`)?.phase === 'after';
    {
      if (currentBeat === 0) {
        const rows = [
          ['arguments: []', [], 'dispatch', 'contract-array'],
          [
            'arguments: {release_id: []}',
            { release_id: [] },
            'tool input check',
            't-result-contract-domain',
          ],
          [
            'arguments: {release_id: "missing"}',
            { release_id: 'missing' },
            'backend lookup',
            't-result-contract-unknown',
          ],
        ];
        rows.forEach(([input, args, layer, cue], i) => {
          const y = 325 + i * 170;
          chip(ctx, api, input, 130, y, 780, themeColors.blue, 85, 27);
          line(ctx, api, 910, y + 42, 1080, y + 42, themeColors.muted);
          text(ctx, api, layer, 1450, y + 135, 25, themeColors.muted);
          if (api.focus.cue(cue)?.phase === 'after') {
            const outcome = executeStatusCall(requestEnvelope(51 + i, 'get_release_status', args));
            const protocol = outcome.layer === 'protocol';
            const result = protocol
              ? 'protocol error ' + String(outcome.code).replace('-', '−')
              : outcome.resultType + ' · isError ' + outcome.isError;
            const col = protocol ? themeColors.red : themeColors.yellow;
            chip(ctx, api, result, 1110, y, 680, col, 85, 29);
          }
        });
        footer(ctx, api, 'Follow the arguments to the first check that rejects them.');
      } else if (currentBeat === 1) {
        const cases = [
          ['resultType missing', 'complete', cueComplete('legacy')],
          ['resultType input_required', 'continue workflow', cueComplete('continue')],
          ['isError true + valid fields', 'tool failure', cueComplete('error')],
          ['isError "false"', 'invalid flag', cueComplete('false-string')],
        ];
        cases.forEach(([value, result, show], i) => {
          const y = 315 + i * 135;
          chip(ctx, api, value, 190, y, 730, themeColors.blue, 80, 29);
          line(ctx, api, 920, y + 40, 1060, y + 40, themeColors.muted);
          if (show)
            chip(
              ctx,
              api,
              result,
              1090,
              y,
              610,
              i < 2 ? themeColors.cyan : themeColors.red,
              80,
              31,
            );
        });
        footer(
          ctx,
          api,
          'Unknown result-type extensions are invalid. Omitted isError means false for this tool.',
        );
      } else {
        const example = validationFixture();
        const reply = example.wrongReply;
        const changed = api.focus.progress('contract-right-input', 0) > 0;
        if (changed) reply.result.structuredContent = { ...statusPayload };
        const payload = reply.result.structuredContent;
        const valid = validateStatusReply(
          reply,
          example.expected.id,
          example.expected.params.arguments.release_id,
        );
        codePanel(
          ctx,
          api,
          'received structuredContent',
          [
            `release_id: "${payload.release_id}"`,
            `status: "${payload.status}"`,
            `health: "${payload.health}"`,
          ],
          160,
          330,
          750,
          330,
        );
        chip(ctx, api, 'exact schema: 3 fields', 1090, 330, 640, themeColors.cyan);
        chip(ctx, api, 'task needs reranker-v17', 1090, 470, 640, themeColors.yellow);
        if (!changed && cueComplete('target') && valid.schemaValid && !valid.identityMatches) {
          text(ctx, api, 'schema passes · target binding fails', 960, 780, 40, themeColors.red);
        } else if (
          changed &&
          api.focus.cue('contract-right-result')?.phase === 'after' &&
          valid.admitted
        ) {
          text(ctx, api, 'schema passes · target matches', 960, 780, 40, themeColors.green);
        }
        footer(
          ctx,
          api,
          'General structured content may be any JSON value; this declared status tool requires an object.',
        );
      }
    }
  });
}
export default {
  id: 'result-contract',
  draw: drawResultContract,
  cues: [
    'contract-array',
    't-result-contract-domain',
    't-result-contract-unknown',
    't-result-contract-error',
    't-result-contract-legacy',
    't-result-contract-false-string',
    't-result-contract-continue',
    'contract-shape',
    't-result-contract-target',
    'contract-right-input',
    'contract-right-result',
  ],
};
