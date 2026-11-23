import { drawFooter, drawPill, drawText } from '../defaults.mjs';
import { formatClock } from '../arithmetic.mjs';
import { cutoff09 } from '../fixtures.mjs';
import { minuteScale, requestLine } from '../request-clock.mjs';
export function drawJoinContract(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    cue = (k) => state.cues?.['sf-join-contract-' + k],
    cueVisible = (k) => !!cue(k) && cue(k).phase !== 'before';
  api.focus.target('join-contract-mechanism', () => {
    if (currentBeat === 0) {
      const rows = cueVisible('sort')
        ? [
            ['J-201', '08:50', 5],
            ['J-201', '09:15', 12],
            ['J-202', '09:20', 8],
          ]
        : [
            ['J-201', '09:15', 12],
            ['J-201', '08:50', 5],
            ['J-202', '09:20', 8],
          ];
      drawText(
        ctx,
        api,
        cueVisible('sort') ? 'Sorted by time across jobs' : 'Grouped by job',
        960,
        300,
        36,
        themeColors.yellow,
      );
      rows.forEach(([job, time, value], i) => {
        const y = 460 + i * 150;
        drawPill(ctx, api, job, 430, y, 420, job === 'J-201' ? themeColors.blue : themeColors.cyan);
        drawPill(ctx, api, time, 960, y, 390, themeColors.yellow);
        drawPill(ctx, api, 'backlog ' + value, 1470, y, 470, themeColors.blue);
      });
      if (cueVisible('backward'))
        drawFooter(ctx, api, 'Backward match within job · exact times included');
      else if (cueVisible('wrongsort') && !cueVisible('sort'))
        drawFooter(ctx, api, 'The time column runs backward from 09:15 to 08:50.');
    } else if (currentBeat === 1) {
      const sent = 510;
      const published = 555;
      const x = minuteScale(sent, published, 360, 1580);
      const publication = cue('tolerance');
      api.text(ctx, 'Join lookback   24 h', 108, 298, 41, themeColors.ink);
      requestLine(ctx, api, x, cutoff09, 393, 689);
      api.line(ctx, x(sent), 552, x(published), 552, themeColors.muted, 3);
      api.circle(ctx, x(sent), 552, 13, themeColors.cyan);
      api.text(ctx, `Sent ${formatClock(sent)}`, x(sent), 508, 39, themeColors.cyan, 'center');
      if (cueVisible('tolerance')) {
        const tip = x(sent + (published - sent) * publication.progress);
        api.line(ctx, x(sent), 552, tip, 552, themeColors.blue, 8);
        api.circle(ctx, tip, 552, 11, themeColors.blue);
      }
      if (publication?.phase === 'after') {
        api.text(
          ctx,
          `Published ${formatClock(published)}`,
          x(published),
          625,
          39,
          themeColors.blue,
          'center',
        );
        drawText(
          ctx,
          api,
          `Published ${published - cutoff09} minutes after the request`,
          960,
          795,
          44,
          themeColors.pink,
        );
      }
      if (cueVisible('retention'))
        drawFooter(ctx, api, 'Replay the publications the scheduler could read by 09:00.');
    } else {
      drawText(
        ctx,
        api,
        'Feast historical versus online contracts',
        960,
        300,
        36,
        themeColors.yellow,
      );
      const rows = [
        ['default historical', 'event time ≤ cutoff'],
        ['created-time filter', 'creation ≤ cutoff · supported store'],
        ['online lookup', 'latest feature values'],
      ];
      rows.forEach(([name, rule], i) => {
        const y = 470 + i * 180;
        drawPill(ctx, api, name, 490, y, 650, themeColors.blue);
        if (cueVisible(['default', 'created', 'latest'][i]))
          drawPill(ctx, api, rule, 1410, y, 790, themeColors.cyan, 85, 27);
      });
      drawFooter(ctx, api, 'For a serving replay, use the time the feature became readable.');
    }
  });
}
export default {
  id: 'join-contract',
  draw: drawJoinContract,
  cues: [
    'sf-join-contract-sort',
    'sf-join-contract-backward',
    'sf-join-contract-wrongsort',
    'sf-join-contract-tolerance',
    'sf-join-contract-retention',
    'sf-join-contract-default',
    'sf-join-contract-created',
    'sf-join-contract-latest',
  ],
};
