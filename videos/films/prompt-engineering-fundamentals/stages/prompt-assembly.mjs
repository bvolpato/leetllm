import { promptSections } from '../model.mjs';
import { card, promptEditor } from '../defaults.mjs';
export function drawPromptAssembly(ctx, scene, state, api) {
  const { C: themeColors } = api;
  const beat = state.beat ?? 0;
  const sectionCount = beat === 0 ? 1 + Number(api.focus.progress('assembly-facts') > 0) : beat + 2;
  {
    promptEditor(ctx, api, promptSections(false), sectionCount, false, {
      activeIndex: sectionCount - 1,
      sectionTargets: [
        'prompt-task-body',
        'prompt-facts-body',
        'prompt-example-body',
        'prompt-contract-body',
      ],
    });
    ['Task', 'Facts', 'One example', 'Contract'].forEach((label, i) =>
      card(
        ctx,
        api,
        `${i + 1} · ${label}`,
        1470,
        390 + i * 140,
        300,
        88,
        i < sectionCount ? themeColors.green : themeColors.muted,
        25,
      ),
    );
  }
}
export default {
  id: 'prompt-assembly',
  draw: drawPromptAssembly,
  cues: [
    'assembled-section-0-b1-1',
    'assembly-facts',
    'assembled-section-2-b2-1',
    'assembled-section-3-b3-1',
  ],
};
