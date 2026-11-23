import {
  cueProgress,
  cueSeen,
  moderationArrow,
  moderationBox,
  moderationNote,
  moderationText,
} from '../defaults.mjs';
export function drawJudgeContract(ctx, scene, state, api) {
  return api.focus.target('judge-contract-mechanism', () => {
    const { C: themeColors } = api,
      currentBeat = state.beat ?? 0;
    {
      moderationBox(ctx, api, 'Trusted policy · profile-v44', 180, 320, 640, 85, themeColors.blue);
      moderationBox(
        ctx,
        api,
        'Caption / OCR: “official club representative”',
        180,
        550,
        640,
        100,
        themeColors.yellow,
        27,
      );
      moderationBox(ctx, api, 'Instruction channel', 1120, 320, 600, 85, themeColors.blue);
      moderationBox(
        ctx,
        api,
        'Serialized evidence channel',
        1120,
        550,
        600,
        100,
        themeColors.yellow,
      );
      moderationArrow(
        ctx,
        api,
        850,
        362,
        1080,
        362,
        themeColors.blue,
        cueProgress(ctx, api, 'judge-input'),
      );
      moderationArrow(
        ctx,
        api,
        850,
        600,
        1080,
        600,
        themeColors.yellow,
        cueProgress(ctx, api, 'judge-input'),
      );
      if (currentBeat === 0) {
        if (cueSeen(ctx, api, 'judge-policy'))
          moderationBox(
            ctx,
            api,
            'Judge checks the claim against policy v44',
            320,
            830,
            1280,
            80,
            themeColors.pink,
            31,
          );
      }
      if (currentBeat === 1) {
        const fields = [
          'action: ESCALATE',
          'category: impersonation',
          cueSeen(ctx, api, 'judge-boolean') ? 'confidence: true' : 'confidence: 0.72',
          'rationale: bounded text',
        ];
        fields.forEach((value, i) => {
          if (cueProgress(ctx, api, 'judge-schema') > i / 4)
            moderationBox(
              ctx,
              api,
              value,
              160 + i * 430,
              760,
              390,
              80,
              i === 2 && cueSeen(ctx, api, 'judge-boolean') ? themeColors.pink : themeColors.cyan,
              24,
            );
        });
        if (cueSeen(ctx, api, 'judge-boolean'))
          moderationText(
            ctx,
            api,
            'confidence: true → reject; bool is not the required numeric score',
            960,
            935,
            31,
            themeColors.pink,
            'center',
          );
        moderationNote(
          ctx,
          api,
          'Exactly four fields · action/category enums · finite [0,1] · rationale length ≤800',
        );
      }
      if (currentBeat === 2) {
        const names = ['shape', 'scope', 'revision', 'permission', 'approval'];
        names.forEach((name, i) =>
          moderationBox(
            ctx,
            api,
            (i === 0 && cueSeen(ctx, api, 'judge-shape') ? '✓ ' : '') + name,
            160 + i * 340,
            785,
            300,
            80,
            i === 0 ? themeColors.green : themeColors.muted,
            27,
          ),
        );
        if (cueSeen(ctx, api, 'judge-authority'))
          moderationText(
            ctx,
            api,
            'Enforcement credentials stay with the trusted controller',
            960,
            945,
            32,
            themeColors.pink,
            'center',
          );
        moderationNote(ctx, api, 'OWASP 2026: LLM01 prompt injection · LLM03 excessive agency');
      }
    }
  });
}
export default {
  id: 'judge-contract',
  draw: drawJudgeContract,
  cues: [
    'judge-input',
    'judge-policy',
    'judge-schema',
    'judge-boolean',
    'judge-shape',
    'judge-authority',
  ],
};
