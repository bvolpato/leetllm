import { cueDone } from '../construction.mjs';
import { chapterText, focusTargets, footer, sheet } from '../defaults.mjs';
export function drawFormatContract(ctx, scene, state, api) {
  const { C: theme } = api,
    themeColors = {
      ...theme,
      purple: '#b7a2f7',
    },
    currentBeat = state.beat ?? 0,
    progress = state.beatP ?? 0;
  {
    chapterText(
      ctx,
      api,
      'Role-specific request → choose an evidence-supported project',
      960,
      285,
      31,
      themeColors.ink,
      'center',
    );
    const fields = ['audience', 'time + questions', 'permitted project', 'materials + tools'];
    fields.forEach((v, i) => {
      chapterText(ctx, api, v, 160 + i * 430, 365, 25, themeColors.muted);
      api.line(ctx, 160 + i * 430, 390, 510 + i * 430, 390, themeColors.blue, 2);
    });
    if (currentBeat === 0) {
      sheet(
        ctx,
        api,
        250,
        475,
        1420,
        365,
        'Rehearsal contract · fictional 15-minute slot',
        themeColors.cyan,
      );
      chapterText(ctx, api, 'Audience: role-specific reviewers', 300, 605, 32);
      chapterText(ctx, api, 'Question time shares the slot', 300, 675, 32);
      chapterText(
        ctx,
        api,
        'Confirm project scope and permitted tools',
        300,
        745,
        32,
        themeColors.yellow,
      );
    } else if (currentBeat === 1) {
      focusTargets(ctx, api, ['format-negative'], () => {
        sheet(ctx, api, 180, 465, 725, 390, 'Public research-method evidence', themeColors.cyan);
        ['hypothesis', 'matched baseline', 'negative result', 'declared limitation'].forEach(
          (v, i) =>
            chapterText(
              ctx,
              api,
              v,
              230,
              580 + i * 65,
              30,
              i === 2 ? themeColors.yellow : themeColors.ink,
            ),
        );
      });
      sheet(ctx, api, 1040, 465, 700, 390, 'Infrastructure evidence', themeColors.blue);
      chapterText(ctx, api, 'owned interface', 1090, 590, 33);
      chapterText(ctx, api, 'failure + migration', 1090, 665, 33);
      chapterText(ctx, api, 'measured boundary', 1090, 740, 33);
    } else {
      sheet(ctx, api, 220, 455, 1480, 430, 'Approved public packet', themeColors.cyan);
      chapterText(ctx, api, 'Aggregate comparison + sanitized request diagram', 270, 575, 31);
      focusTargets(ctx, api, ['format-private'], () => {
        const done = cueDone(state, 'format-private', 2, 0.25);
        chapterText(ctx, api, 'customer ID', 270, 665, 27, themeColors.muted);
        chapterText(ctx, api, 'secret', 270, 760, 27, themeColors.muted);
        api.rect(ctx, 580, 625, 980, 65, done ? themeColors.ink : themeColors.pink, undefined, 0);
        api.rect(ctx, 580, 720, 980, 65, done ? themeColors.ink : themeColors.pink, undefined, 0);
        chapterText(
          ctx,
          api,
          done ? 'removed from the presentation' : 'private fields require removal',
          1070,
          837,
          27,
          done ? themeColors.green : themeColors.pink,
          'center',
        );
      });
    }
    footer(ctx, api, 'Employer guidance describes its own format · permissions remain explicit');
  }
}
export default {
  id: 'format-contract',
  draw: drawFormatContract,
  cues: ['format-negative', 'format-private'],
};
