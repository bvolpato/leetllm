import {
  cueProgress,
  cueSeen,
  moderationArrow,
  moderationBar,
  moderationBox,
  moderationLine,
  moderationNote,
  moderationText,
} from '../defaults.mjs';
export function drawModalityContract(ctx, scene, state, api) {
  return api.focus.target('modality-contract-mechanism', () => {
    const { C: themeColors } = api,
      currentBeat = state.beat ?? 0;
    {
      const rows = [
        'violence',
        'graphic violence',
        'self-harm',
        'self-harm intent',
        'self-harm instructions',
        'sexual (excluding minors)',
        'harassment',
        'hate',
      ];
      if (currentBeat === 0) {
        moderationText(
          ctx,
          api,
          'Inspect coverage before interpreting a returned zero',
          150,
          270,
          33,
        );
        moderationText(ctx, api, 'Category', 160, 355, 28, themeColors.muted);
        moderationText(ctx, api, 'Image input', 1040, 355, 28, themeColors.muted);
        moderationText(ctx, api, 'Applied types / meaning', 1390, 355, 27, themeColors.muted);
        rows.forEach((name, i) => {
          const y = 420 + i * 63;
          moderationText(ctx, api, name, 160, y, 27);
          const ready = cueProgress(ctx, api, 'modality-six') > i / 6;
          moderationText(
            ctx,
            api,
            i < 6 && ready ? 'supported' : i < 6 ? 'pending' : 'unsupported',
            1040,
            y,
            26,
            i < 6 ? themeColors.blue : themeColors.yellow,
          );
          if (i >= 6 && cueSeen(ctx, api, 'modality-zero'))
            moderationText(ctx, api, '0 · [] · UNASSESSED', 1390, y, 25, themeColors.pink);
        });
      } else if (currentBeat === 1) {
        moderationText(
          ctx,
          api,
          'Different model sizes and taxonomies; compare coverage',
          150,
          275,
          32,
        );
        const ready = [cueSeen(ctx, api, 'modality-guard'), cueSeen(ctx, api, 'modality-gemma')];
        [
          ['Llama Guard 4', 12, 'Text + multiple images'],
          ['ShieldGemma 2', 4, 'Image: sexual / violent / dangerous'],
        ].forEach(([name, size, scope], i) => {
          const y = 420 + i * 260;
          moderationText(ctx, api, name, 170, y, 35, themeColors.blue);
          if (ready[i]) {
            moderationBar(ctx, api, 650, y - 45, 1000, 70, [size], 12, [
              i ? themeColors.cyan : themeColors.blue,
            ]);
            moderationText(ctx, api, size + 'B parameters', 650, y + 75, 31, themeColors.cyan);
            moderationText(ctx, api, scope, 650, y + 145, 28, themeColors.muted);
          }
        });
        moderationNote(
          ctx,
          api,
          'Who owns the account? Check the claim and the evidence of ownership.',
        );
      } else {
        moderationText(
          ctx,
          api,
          'Authored observation errors · inspect the original evidence',
          150,
          265,
          32,
        );
        const q = cueProgress(ctx, api, 'modality-missing'),
          rows = [
            ['Image overlay', 'not official', 'official'],
            ['Spoken words', 'do not send', 'do send'],
          ];
        rows.forEach(([name, original, observed], i) => {
          const y = 375 + i * 190;
          moderationText(ctx, api, name, 170, y - 30, 27, themeColors.muted);
          api.rect(ctx, 170, y, 650, 105, themeColors.panel, themeColors.blue, 0);
          if (i === 0) {
            api.rect(ctx, 195, y + 18, 12, 69, themeColors.blue);
            moderationText(ctx, api, original, 495, y + 66, 34, themeColors.blue, 'center');
          } else {
            for (let j = 0; j < 28; j++) {
              const height = 12 + 24 * Math.abs(Math.sin(j * 1.7));
              moderationLine(
                ctx,
                api,
                190 + j * 8,
                y + 52 - height / 2,
                190 + j * 8,
                y + 52 + height / 2,
                themeColors.blue,
                3,
              );
            }
            moderationText(ctx, api, original, 585, y + 65, 32, themeColors.blue, 'center');
          }
          moderationArrow(
            ctx,
            api,
            860,
            y + 52,
            1030,
            y + 52,
            themeColors.yellow,
            Math.min(1, q * 2),
          );
          if (q > i / 3) {
            moderationBox(ctx, api, observed, 1080, y, 650, 105, themeColors.yellow, 34);
            moderationText(
              ctx,
              api,
              i ? 'ASR changed the words' : 'OCR omitted “not”',
              1405,
              y + 150,
              26,
              themeColors.pink,
              'center',
            );
          }
        });
        moderationText(ctx, api, 'Non-speech audio', 170, 790, 27, themeColors.muted);
        for (let j = 0; j < 64; j++) {
          const height = 12 + 46 * Math.abs(Math.sin(j * 0.73) * Math.cos(j * 0.13));
          moderationLine(
            ctx,
            api,
            190 + j * 9,
            845 - height / 2,
            190 + j * 9,
            845 + height / 2,
            themeColors.blue,
            4,
          );
        }
        if (q > 0.65) {
          moderationArrow(ctx, api, 860, 845, 1030, 845, themeColors.yellow);
          moderationText(
            ctx,
            api,
            'Transcript supplies no sound assessment',
            1405,
            855,
            28,
            themeColors.yellow,
            'center',
          );
        }
        if (cueSeen(ctx, api, 'modality-hold'))
          moderationBox(
            ctx,
            api,
            'Required assessment unavailable → approved HOLD / REVIEW',
            250,
            920,
            1420,
            70,
            themeColors.pink,
            31,
          );
      }
    }
  });
}
export default {
  id: 'modality-contract',
  draw: drawModalityContract,
  cues: [
    'modality-six',
    'modality-zero',
    'modality-guard',
    'modality-gemma',
    'modality-missing',
    'modality-hold',
  ],
};
