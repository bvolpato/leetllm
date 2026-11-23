import { phase } from '../arithmetic.mjs';
import { chapterBox, chapterText, footer, line, subtitle, pointOnPath } from '../defaults.mjs';
export function drawAgreementCheck(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  api.focus.target('pf-agreement-check-mechanism', () => {
    subtitle(ctx, api, 'Five supplied replies · normalize each final deadline in minutes');
    const answers = [90, 90, 90, 90, 30],
      build = currentBeat === 0 ? 0 : api.focus.progress('pf-agreement-build'),
      result = currentBeat === 0 ? 0 : api.focus.progress('pf-agreement-result');
    const winnerVotes = answers.filter((answer) => answer === 90).length;
    for (let i = 0; i < answers.length; i++) {
      const x = 230 + i * 310;
      chapterBox(
        ctx,
        api,
        'P' + i + '\n' + answers[i] + ' min',
        x,
        370,
        250,
        120,
        themeColors.blue,
        29,
      );
      if (currentBeat === 1 && build >= i * 0.13) {
        const point = pointOnPath(
          [
            {
              x: x + 35,
              y: 510,
            },
            {
              x: x + 35,
              y: 590,
            },
            {
              x: i < 4 ? 280 + i * 190 : 1320,
              y: 590,
            },
            {
              x: i < 4 ? 280 + i * 190 : 1320,
              y: 735,
            },
          ],
          phase(build, i * 0.13, i * 0.13 + 0.28),
        );
        chapterBox(ctx, api, 'P' + i, point.x, point.y, 150, 65, themeColors.cyan, 25);
      }
    }
    line(ctx, api, 230, 825, 1090, 825, themeColors.cyan);
    line(ctx, api, 1280, 825, 1670, 825, themeColors.cyan);
    chapterText(ctx, api, '90 minutes', 660, 890, 30, themeColors.ink, 'center');
    chapterText(ctx, api, '30 minutes', 1470, 890, 30, themeColors.ink, 'center');
    if (currentBeat === 1 && result >= 0.999 && build >= 0.999) {
      footer(
        ctx,
        api,
        winnerVotes +
          ' of ' +
          answers.length +
          ' replies agree on 90 minutes (' +
          (100 * winnerVotes) / answers.length +
          '%)',
        themeColors.yellow,
      );
    } else footer(ctx, api, 'How many of these replies agree on one deadline?');
  });
  return;
}
export default {
  id: 'agreement-check',
  draw: drawAgreementCheck,
  cues: [
    'pf-agreement-check-b0',
    'pf-agreement-check-b1',
    'pf-agreement-build',
    'pf-agreement-result',
  ],
};
