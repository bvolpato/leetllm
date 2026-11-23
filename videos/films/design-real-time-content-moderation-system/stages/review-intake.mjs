import {
  cueProgress,
  cueSeen,
  moderationArrow,
  moderationBox,
  moderationNote,
  moderationText,
} from '../defaults.mjs';
export function drawReviewIntake(ctx, scene, state, api) {
  return api.focus.target('review-intake-mechanism', () => {
    const { C: themeColors } = api,
      currentBeat = state.beat ?? 0;
    {
      const routes = [
        ['I17', 'impersonation', 'STANDARD', themeColors.blue],
        ['U18', 'urgent evidence', 'URGENT', themeColors.yellow],
        ['R19', 'restricted evidence', 'RESTRICTED', themeColors.pink],
      ];
      moderationText(ctx, api, 'Intake authority is independent of model confidence', 150, 265, 33);
      routes.forEach(([id, reason, route, color], i) => {
        const y = 365 + i * 170,
          ready = currentBeat > 0 || cueProgress(ctx, api, 'intake-build') > i / 3;
        moderationBox(ctx, api, id + ' · ' + reason, 150, y, 580, 80, color, 27);
        if (ready) {
          moderationArrow(ctx, api, 750, y + 40, 1010, y + 40, color);
          moderationBox(ctx, api, route, 1050, y, 620, 80, color);
        }
      });
      if (currentBeat === 0 && cueSeen(ctx, api, 'intake-trust'))
        moderationText(
          ctx,
          api,
          'Uploader flag ≠ trusted intake evidence',
          960,
          925,
          32,
          themeColors.pink,
          'center',
        );
      if (currentBeat === 1) {
        if (cueSeen(ctx, api, 'intake-priority'))
          moderationBox(
            ctx,
            api,
            'R19 · restricted=true · urgent=true → RESTRICTED',
            240,
            890,
            1440,
            70,
            themeColors.pink,
            29,
          );
        if (cueSeen(ctx, api, 'intake-reserve'))
          moderationNote(
            ctx,
            api,
            'Reserved ownership + oldest case age · low confidence cannot demote U18',
          );
      }
      if (currentBeat === 2) {
        const authorized = cueSeen(ctx, api, 'intake-access');
        if (authorized) {
          moderationBox(ctx, api, 'Assigned specialist', 200, 890, 500, 70, themeColors.green);
          moderationBox(ctx, api, 'Protected R19 reference', 1010, 890, 700, 70, themeColors.pink);
          moderationArrow(ctx, api, 720, 925, 980, 925, themeColors.green);
        }
        if (cueSeen(ctx, api, 'intake-learning'))
          moderationNote(ctx, api, 'Governed, quality-controlled outcome → evaluation candidate');
      }
    }
  });
}
export default {
  id: 'review-intake',
  draw: drawReviewIntake,
  cues: [
    'intake-build',
    'intake-trust',
    'intake-priority',
    'intake-reserve',
    'intake-access',
    'intake-learning',
  ],
};
