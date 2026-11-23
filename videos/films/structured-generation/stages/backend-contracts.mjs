import { arrow, box, constructionFooter, focusProgress, label } from '../defaults.mjs';
export function drawBackendContracts(ctx, scene, state, api) {
  const { C, components: c, teaching: t, phase } = api,
    beat = state.beat ?? 0,
    p = state.beatP ?? 0,
    q = phase(p, 0.05, 0.88);
  {
    const { C: themeColors } = api,
      currentBeat = state.beat ?? 0;
    const done = (id) => focusProgress(ctx, api, id) >= 1;
    api.focus.target('sg-backend-contracts-mechanism', () => {
      if (currentBeat === 0) {
        const raw = done('sg-backend-raw'),
          parsed = focusProgress(ctx, api, 'sg-backend-parse');
        box(
          ctx,
          api,
          'Generator(model, RunTriage)',
          ['output constraint: Pydantic type'],
          180,
          315,
          1560,
          150,
          themeColors.blue,
        );
        box(
          ctx,
          api,
          'Returned text',
          raw
            ? ['{"run_id":"RUN-842",', ' "status":"failed",', ' "failing_job":"unit-tests"}']
            : ['Waiting for text'],
          180,
          575,
          720,
          225,
          themeColors.yellow,
        );
        box(
          ctx,
          api,
          'Explicit local model validation',
          parsed > 0
            ? [
                'RunTriage.model_validate_json(raw)',
                done('sg-backend-parse')
                  ? 'triage.status → "failed"'
                  : 'Checking fields',
              ]
            : ['not yet parsed'],
          1030,
          575,
          710,
          225,
          done('sg-backend-parse') ? themeColors.green : themeColors.blue,
        );
        if (parsed > 0) arrow(ctx, api, 915, 665, 1015, 665, themeColors.cyan);
      } else if (currentBeat === 1) {
        const skip = done('sg-gbnf-skip');
        box(
          ctx,
          api,
          'Original schema',
          ['retry_count: integer', 'minimum: 0'],
          180,
          330,
          650,
          210,
          themeColors.blue,
        );
        box(
          ctx,
          api,
          'Example grammar conversion',
          [
            'integer syntax present',
            skip ? 'suppose the bound is absent' : 'inspect emitted rules',
          ],
          1030,
          330,
          720,
          210,
          themeColors.yellow,
        );
        arrow(ctx, api, 850, 435, 1010, 435);
        box(
          ctx,
          api,
          'Candidate value',
          ['-1 is an integer'],
          180,
          690,
          650,
          145,
          themeColors.blue,
        );
        box(
          ctx,
          api,
          'Original validator survives',
          skip ? ['minimum 0 rejects -1'] : ['retained local contract'],
          1030,
          690,
          720,
          145,
          skip ? themeColors.pink : themeColors.blue,
        );
        constructionFooter(ctx, api, 'Inspect emitted grammar and keep the original validator.');
      } else {
        const removed = done('sg-backend-vllm');
        box(
          ctx,
          api,
          'Inspected vLLM request',
          [
            'structured_outputs',
            removed ? 'guided fields removed in 0.12.0' : 'inspect actual request fields',
          ],
          180,
          330,
          730,
          210,
          themeColors.blue,
        );
        box(
          ctx,
          api,
          'Hosted schema request',
          ['selected endpoint / model', 'supported schema subset'],
          1030,
          330,
          710,
          210,
          themeColors.yellow,
        );
        label(
          ctx,
          api,
          'Which rules does this endpoint support?',
          960,
          750,
          themeColors.ink,
          35,
        );
        constructionFooter(
          ctx,
          api,
          'Check the wire artifact, backend and selected model together.',
        );
      }
    });
  }
}
export default {
  id: 'backend-contracts',
  draw: drawBackendContracts,
  cues: [
    'sg-backend-contracts-0',
    'sg-outlines-raw',
    'sg-backend-raw',
    'sg-backend-parse',
    'sg-backend-contracts-1',
    'sg-gbnf-skip',
    'sg-backend-contracts-2',
    'sg-backend-vllm',
  ],
};
