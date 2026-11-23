import { sampleSlimeChapter } from '../construction.mjs';
import {
  drawSlimeNote,
  drawSlimeRule,
  drawSlimeText,
  drawSlimeTile,
  drawSlimeTitle,
  drawSlimeWire,
} from '../defaults.mjs';
export function drawAgentHook(ctx, scene, state, api) {
  return api.focus.target('sl-agent-hook-mechanism', () => paintAgentHook(ctx, scene, state, api));
}
function paintAgentHook(ctx, scene, state, api) {
  const modelState = sampleSlimeChapter('agent-hook', state, scene),
    currentBeat = modelState.b;
  const { C: themeColors } = api;
  {
    drawSlimeTitle(ctx, api, 'Application behavior enters through explicit extension points');
    drawSlimeTile(ctx, api, 'custom generate hook', 170, 360, 540, themeColors.blue, 90, 33);
    drawSlimeTile(ctx, api, 'custom reward verifier', 1180, 360, 580, themeColors.green, 90, 30);
    drawSlimeWire(ctx, api, 710, 405, 1180, 405, modelState.hook, themeColors.cyan);
    const names = [
      'exact IDs',
      'mask',
      'sampled log p',
      'policy version',
      modelState.graded ? 'reward = 1.0' : 'reward pending',
      modelState.completed ? 'completed' : 'awaiting completion',
    ];
    names.forEach((v, i) =>
      drawSlimeTile(
        ctx,
        api,
        i < modelState.fields ? v : currentBeat ? 'pending field' : v,
        170 + (i % 3) * 560,
        570 + Math.floor(i / 3) * 150,
        510,
        i < modelState.fields ? themeColors.cyan : themeColors.muted,
        90,
        30,
      ),
    );
    if (currentBeat === 2 && modelState.observation > 0) {
      drawSlimeText(ctx, api, 'tool observation', 170, 890, 30, themeColors.pink);
      drawSlimeTile(
        ctx,
        api,
        'context: present · target mask: 0',
        630,
        840,
        1030,
        themeColors.cyan,
        90,
        32,
      );
    } else
      drawSlimeRule(
        ctx,
        api,
        modelState.completed
          ? 'Assign completion only after terminal condition and verifier succeed'
          : currentBeat === 0
            ? 'Replace the full scheduler only when grouping or buffering requires it'
            : modelState.graded
              ? 'The clean test passed.'
              : 'The verifier runs the test in a clean copy.',
        940,
        themeColors.yellow,
        31,
      );
    drawSlimeNote(
      ctx,
      api,
      'Tools, credentials, browser state and write permission remain application responsibilities',
    );
    return;
  }
}
export default {
  id: 'agent-hook',
  draw: drawAgentHook,
  cues: [
    'sl-agent-hook-b0-operation',
    'sl-agent-hook-b0-s0',
    'sl-agent-hook-b0-s1',
    'sl-agent-hook-b0-s2',
    'sl-agent-hook-b1-operation',
    'sl-agent-hook-b1-s0',
    'sl-agent-hook-b1-s1',
    'sl-agent-hook-b1-s2',
    'sl-agent-hook-b1-s3',
    'sl-agent-hook-b2-operation',
    'sl-agent-hook-b2-s0',
    'sl-agent-hook-b2-s1',
    'sl-agent-hook-b2-s2',
  ],
};
