import { sampleSlimeChapter } from '../construction.mjs';
import { drawSlimeRule, drawSlimeTile, drawSlimeTitle } from '../defaults.mjs';
import { progress } from '../phrase-clock.mjs';
export function drawProjectScope(ctx, scene, state, api) {
  return api.focus.target('sl-project-scope-mechanism', () =>
    paintProjectScope(ctx, scene, state, api),
  );
}
function paintProjectScope(ctx, scene, state, api) {
  const modelState = sampleSlimeChapter('project-scope', state, scene),
    currentBeat = modelState.b;
  const { C: themeColors } = api;
  {
    if (currentBeat === 2) {
      const sources = [
        ['Project README', 'GLM post-training'],
        ['v0.1.0 release notes', 'Faster weight updates and memory offload'],
        ['Model launch script', 'Time one weight update on your hardware'],
      ];
      sources.forEach(([source, detail], i) => {
        const y = 385 + 195 * i;
        if (i > 0 && progress(scene, state, `sl-project-scope-b2-s${i}`) === 0) return;
        api.text(ctx, source, 155, y, 43, themeColors.blue);
        api.text(ctx, detail, 755, y, 44, themeColors.ink);
        api.line(ctx, 155, y + 50, 1770, y + 50, themeColors.muted, 2);
      });
      return;
    }
    drawSlimeTitle(ctx, api, 'Who maintains slime?');
    drawSlimeTile(
      ctx,
      api,
      'THUDM / THUKEG / Z.ai lineage',
      170,
      370,
      1540,
      themeColors.blue,
      100,
      34,
    );
    drawSlimeTile(
      ctx,
      api,
      'source: Apache 2.0 · Zhipu AI notices',
      170,
      550,
      780,
      modelState.licence >= 1 ? themeColors.green : themeColors.muted,
      100,
      31,
    );
    drawSlimeTile(
      ctx,
      api,
      'weights / data / environment: own terms',
      1040,
      550,
      700,
      modelState.terms >= 1 ? themeColors.yellow : themeColors.muted,
      100,
      29,
    );
    if (currentBeat > 0) {
      drawSlimeTile(
        ctx,
        api,
        'bug fix → CI or routine-training verification',
        220,
        760,
        1450,
        modelState.fix >= 1 ? themeColors.cyan : themeColors.muted,
        90,
        33,
      );
    }
    drawSlimeRule(
      ctx,
      api,
      currentBeat === 1
        ? 'Application teams build agent loops with the public hooks.'
        : 'Zilin Zhu · Chengxing Xie · Xin Lv · contributors',
      945,
      themeColors.cyan,
      31,
    );
    return;
  }
}
export default {
  id: 'project-scope',
  draw: drawProjectScope,
  cues: [
    'sl-project-scope-b0-operation',
    'sl-project-scope-b0-s0',
    'sl-project-scope-b0-s1',
    'sl-project-scope-b0-s2',
    'sl-project-scope-b0-s3',
    'sl-project-scope-b0-s4',
    'sl-project-scope-b1-operation',
    'sl-project-scope-b1-s0',
    'sl-project-scope-b1-s1',
    'sl-project-scope-b1-s2',
    'sl-project-scope-b1-s3',
    'sl-project-scope-b2-operation',
    'sl-project-scope-b2-s0',
    'sl-project-scope-b2-s1',
    'sl-project-scope-b2-s2',
  ],
};
