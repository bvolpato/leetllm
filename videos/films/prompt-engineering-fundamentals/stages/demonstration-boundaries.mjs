import { phase } from '../arithmetic.mjs';
import { chapterBox, chapterText, footer, line, subtitle } from '../defaults.mjs';
export function drawDemonstrationBoundaries(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    u = api.focus.progress('pf-demonstration-boundaries-b' + currentBeat);
  api.focus.target('pf-demonstration-boundaries-mechanism', () => {
    const names = ['T1', 'T2', 'T3'],
      causes = [
        'Guide promises writes.\nProgram only simulates,\nas designed.',
        'Guide is correct.\nProgram crashes.',
        'Please add JSON output.\nThat flag does not exist.',
      ],
      labels = ['docs', 'bug', 'feature'];
    subtitle(ctx, api, 'Support tickets · label the cause of each request');
    if (currentBeat < 2) {
      const labelCues = ['ticket-docs', 'ticket-bug', 'ticket-feature'];
      for (let i = 0; i < 3; i++) {
        chapterBox(
          ctx,
          api,
          names[i] + '\n' + causes[i],
          180 + i * 560,
          370,
          490,
          218,
          themeColors.blue,
          31,
        );
        if (currentBeat === 1 && api.focus.progress(labelCues[i]) > 0) {
          const y = 620 + 60 * (1 - api.focus.progress(labelCues[i]));
          chapterBox(
            ctx,
            api,
            names[i] + ' → ' + labels[i],
            240 + i * 560,
            y,
            370,
            85,
            themeColors.green,
            31,
          );
        }
      }
      if (currentBeat === 1 && api.focus.cue('ticket-bug')?.phase === 'after')
        footer(ctx, api, 'Two tickets mention the guide. Only T1 needs a documentation fix.');
    } else if (currentBeat === 2) {
      chapterText(
        ctx,
        api,
        'Controlled order permutation · labels stay attached',
        960,
        340,
        31,
        themeColors.yellow,
        'center',
      );
      names.forEach((name, i) => {
        let x = 220 + i * 540,
          y = 470;
        if (i === 0) {
          if (u < 0.15) y = 470 + (310 * u) / 0.15;
          else if (u < 0.65) y = 780;
          else if (u < 0.85) {
            x = 220 + (1080 * (u - 0.65)) / 0.2;
            y = 780;
          } else {
            x = 1300;
            y = 780 - (310 * (u - 0.85)) / 0.15;
          }
        } else x -= 540 * phase(u, i === 1 ? 0.2 : 0.45, i === 1 ? 0.4 : 0.65);
        chapterBox(ctx, api, name + ' · ' + labels[i], x, y, 400, 90, themeColors.blue, 28);
      });
      footer(ctx, api, 'Label balance, order and quality effects need evaluation on this task');
    } else {
      chapterBox(
        ctx,
        api,
        'DEVELOPMENT PROMPT\nT1 docs · T2 bug · T3 feature',
        210,
        360,
        720,
        170,
        themeColors.blue,
        29,
      );
      line(ctx, api, 1030, 340, 1030, 920, themeColors.yellow, 4);
      chapterBox(
        ctx,
        api,
        'Untouched case T4\nnot inserted as a demonstration',
        1120,
        550,
        610,
        160,
        themeColors.pink,
        28,
      );
      footer(
        ctx,
        api,
        'Reusing a final error as an example turns it into development evidence',
        themeColors.yellow,
      );
    }
  });
  return;
}
export default {
  id: 'demonstration-boundaries',
  draw: drawDemonstrationBoundaries,
  cues: [
    'pf-demonstration-boundaries-b0',
    'pf-demonstration-boundaries-b1',
    'ticket-docs',
    'ticket-bug',
    'ticket-feature',
    'pf-demonstration-boundaries-b2',
    'pf-demonstration-boundaries-b3',
  ],
};
