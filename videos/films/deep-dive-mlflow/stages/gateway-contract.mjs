import { bound } from '../arithmetic.mjs';
import { mlflowSentenceProgress, sampleMlflowChapter } from '../construction.mjs';
import { chapterText, chip, flow, footer } from '../defaults.mjs';
export function drawGatewayContract(ctx, scene, state, api) {
  const modelState = sampleMlflowChapter('gateway-contract', state),
    currentBeat = modelState.b;
  const teaching2 = (beat, sentence) =>
    mlflowSentenceProgress('gateway-contract', state, beat, sentence);
  {
    const { C } = api,
      id = 'gateway-contract';
    {
      const request = chip(ctx, api, 'Gateway example G1', 150, 390, 400, C.blue, 100),
        A = chip(ctx, api, 'Preferred A', 770, 365, 400, modelState.attempt ? C.pink : C.cyan, 100),
        B = chip(
          ctx,
          api,
          'Fallback B',
          1370,
          600,
          400,
          modelState.attempt === 2 ? C.green : C.cyan,
          100,
        );
      flow(ctx, api, request, A, currentBeat ? 1 : teaching2(0, 2), C.blue);
      if (modelState.attempt) {
        chapterText(ctx, api, 'A failed', 970, 530, 30, C.pink, 'center');
        flow(ctx, api, A, B, currentBeat ? 1 : bound(teaching2(0, 2) * 2 - 1), C.cyan);
      }
      if (modelState.attempt === 2)
        chip(ctx, api, 'Actual responder B · model B1', 180, 690, 900, C.green, 100);
      if (currentBeat === 1) {
        ['Validate JSON', 'Check the citation', 'Authorize the action'].forEach((name, i) =>
          chip(ctx, api, name, 155 + i * 575, 870, 530, C.yellow, 85, 29),
        );
      }
      if (currentBeat === 2) {
        const inputs = [
          ['Prompt alias', '17', '18'],
          ['Gateway target', 'A', 'B'],
          ['Provider revision', 'B1', 'B2'],
        ];
        inputs.forEach(([name, old, now], i) =>
          chip(
            ctx,
            api,
            name + ': ' + (i < modelState.mutations ? now : old),
            150 + i * 575,
            870,
            530,
            i < modelState.mutations ? C.yellow : C.muted,
            85,
            24,
          ),
        );
      }
      footer(
        ctx,
        api,
        currentBeat === 2
          ? 'Historical request receipt stays B / B1 while independent routing inputs move'
          : 'The gateway records which provider served the request.',
      );
    }
  }
}
export default {
  id: 'gateway-contract',
  draw: drawGatewayContract,
  cues: [
    'mf-gateway-contract-0',
    'mf-sentence-gateway-contract-0-0',
    'mf-sentence-gateway-contract-0-1',
    'mf-sentence-gateway-contract-0-2',
    'mf-sentence-gateway-contract-0-3',
    'mf-gateway-contract-1',
    'mf-sentence-gateway-contract-1-0',
    'mf-sentence-gateway-contract-1-1',
    'mf-sentence-gateway-contract-1-2',
    'mf-gateway-contract-2',
    'mf-sentence-gateway-contract-2-0',
    'mf-sentence-gateway-contract-2-1',
    'mf-sentence-gateway-contract-2-2',
    'mf-sentence-gateway-contract-2-3',
  ],
};
