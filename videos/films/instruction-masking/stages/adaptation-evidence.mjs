import { CONSTRUCTION_TARGETS } from '../fixtures.mjs';
import { cueProgress, done } from '../construction.mjs';
import { instructionF, instructionLine, instructionRow, instructionT } from '../defaults.mjs';
export function drawAdaptationEvidence(ctx, scene, state, api) {
  const { C: themeColors } = api,
    beat = state.beat ?? 0,
    cueProgress2 = (id, b = 0) => cueProgress(state, id, b),
    resultComplete = (id, b = 0) => done(state, id, b);
  const aliases = (ids, paint) =>
    ids.reduceRight((next, id) => () => instructionF(ctx, api, id, next), paint)();
  aliases(CONSTRUCTION_TARGETS['adaptation-evidence'] ?? [], () =>
    instructionF(ctx, api, 'adaptation-evidence-construction', () => {
      drawExtended();
    }),
  );
  function drawExtended() {
    if (beat === 0) {
      instructionT(ctx, api, 'Demonstrations', 180, 330, 35, themeColors.green);
      instructionRow(ctx, api, ['prompt', 'approved answer'], 180, 410, {
        step: 380,
        w: 350,
        size: 35,
        color: themeColors.green,
      });
      instructionT(ctx, api, 'InstructGPT', 180, 645, 32, themeColors.muted);
      instructionRow(ctx, api, ['SFT', 'reward model', 'PPO'], 180, 725, {
        step: 500,
        w: 450,
        size: 38,
        color: themeColors.blue,
      });
      instructionF(ctx, api, 'im-objectives', () => {
        const p = cueProgress2('im-objectives');
        instructionT(
          ctx,
          api,
          'FLAN: instruction-formatted tasks → held-out task types',
          180,
          945,
          35,
          p > 0 ? themeColors.yellow : themeColors.muted,
        );
      });
    } else if (beat === 1) {
      instructionT(ctx, api, 'LIMA · reported setup', 180, 315, 36, themeColors.yellow);
      instructionF(ctx, api, 'im-lima', () => {
        const n = Math.floor(cueProgress2('im-lima', 1) * 1000);
        for (let i = 0; i < 1000; i++)
          api.rect(
            ctx,
            180 + (i % 50) * 20,
            390 + Math.floor(i / 50) * 20,
            16,
            14,
            i < n ? themeColors.green : themeColors.panel,
          );
        instructionT(
          ctx,
          api,
          `${n} / 1000 curated demonstrations`,
          180,
          860,
          36,
          themeColors.green,
        );
        instructionT(ctx, api, 'One mark = one demonstration', 180, 930, 29, themeColors.muted);
      });
      instructionT(ctx, api, '65B parameter LLaMA', 1490, 470, 36, themeColors.blue, 'center');
      instructionT(ctx, api, 'supervised adaptation', 1490, 590, 32, themeColors.ink, 'center');
    } else {
      const p = cueProgress2('im-regression', 2);
      instructionT(ctx, api, 'Example change on held-out tasks', 180, 320, 32, themeColors.muted);
      const outcomes = [
        ['policy', p],
        ['coding', -p],
        ['reasoning', -p * 0.7],
      ];
      outcomes.forEach(([name, v], i) => {
        const y = 430 + i * 135;
        instructionT(ctx, api, name, 180, y + 35, 36, themeColors.ink);
        instructionLine(ctx, api, 700, y + 25, 1450, y + 25);
        instructionLine(ctx, api, 1075, y - 20, 1075, y + 70, themeColors.muted);
        const x = 1075 + 300 * v;
        api.circle(ctx, x, y + 25, 12, v >= 0 ? themeColors.green : themeColors.pink);
        instructionT(
          ctx,
          api,
          v === 0 ? 'baseline' : v > 0 ? 'improves' : 'regresses',
          1530,
          y + 35,
          30,
          v >= 0 ? themeColors.green : themeColors.pink,
        );
      });
      instructionF(ctx, api, 'im-freeze-protocol', () => {
        if (resultComplete('im-freeze-protocol', 2))
          instructionT(
            ctx,
            api,
            'Freeze tokenizer · template · decode · held-out cases',
            180,
            940,
            35,
            themeColors.yellow,
          );
      });
    }
  }
}
export default {
  id: 'adaptation-evidence',
  draw: drawAdaptationEvidence,
  cues: [
    'adaptation-evidence-b1',
    'im-objectives',
    'adaptation-evidence-b2',
    'im-lima',
    'adaptation-evidence-b3',
    'im-regression',
    'im-freeze-protocol',
  ],
};
