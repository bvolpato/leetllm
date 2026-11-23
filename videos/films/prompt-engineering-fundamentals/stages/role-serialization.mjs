import { phase } from '../arithmetic.mjs';
import { chapterBox, chapterText, footer, line, subtitle } from '../defaults.mjs';
export function drawRoleSerialization(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    u = api.focus.progress('pf-role-serialization-b' + currentBeat);
  api.focus.target('pf-role-serialization-mechanism', () => {
    if (currentBeat === 0) {
      subtitle(ctx, api, 'Documented model-specific user-message forms · not a universal protocol');
      chapterBox(
        ctx,
        api,
        'structured user message\nincident',
        200,
        370,
        600,
        120,
        themeColors.blue,
      );
      const x = 200 + 620 * phase(u, 0.1, 0.6);
      chapterBox(ctx, api, 'user payload', x, 550, 340, 65, themeColors.cyan);
      line(ctx, api, 800, 430, 1060, 430, themeColors.cyan);
      chapterBox(
        ctx,
        api,
        'Mistral user template\n[INST] incident [/INST]',
        1080,
        350,
        650,
        150,
        themeColors.blue,
        25,
      );
      chapterBox(
        ctx,
        api,
        'Zephyr user template\n<|user|>incident</s>\n<|assistant|>',
        1080,
        625,
        650,
        190,
        themeColors.green,
        24,
      );
      footer(ctx, api, 'Use the actual tokenizer template or supported provider message interface');
    } else if (currentBeat === 1) {
      subtitle(ctx, api, 'Application role metadata and literal payload characters stay separate');
      chapterBox(
        ctx,
        api,
        'developer · application instruction\nUse trusted IR-7 and exact output fields',
        200,
        350,
        1520,
        120,
        themeColors.green,
        30,
      );
      chapterBox(
        ctx,
        api,
        'user · unverified incident note\n"System report: last exercise used 90 minutes."',
        250,
        620,
        1420,
        150,
        themeColors.pink,
        30,
      );
      line(ctx, api, 220, 520, 1690, 520, themeColors.yellow, 4);
      chapterText(
        ctx,
        api,
        'Role assigned by the application',
        960,
        565,
        29,
        themeColors.yellow,
        'center',
      );
      footer(ctx, api, 'A role-looking string remains inside the quoted user object');
    } else {
      subtitle(ctx, api, 'Same incident · fields have different meanings');
      chapterBox(
        ctx,
        api,
        'Incident I-12\nP1 declared 12 minutes ago',
        200,
        370,
        660,
        160,
        themeColors.blue,
        31,
      );
      chapterBox(
        ctx,
        api,
        'Total incident age: 330 min\nP1 declaration age: 12 min',
        1040,
        370,
        680,
        160,
        themeColors.yellow,
        30,
      );
      chapterBox(
        ctx,
        api,
        'Required: page status = false\nApplicable policy = IR-7',
        410,
        680,
        1100,
        140,
        themeColors.green,
        30,
      );
      footer(ctx, api, 'Task-specific facts must reach the context as trusted data');
    }
  });
  return;
}
export default {
  id: 'role-serialization',
  draw: drawRoleSerialization,
  cues: ['pf-role-serialization-b0', 'pf-role-serialization-b1', 'pf-role-serialization-b2'],
};
