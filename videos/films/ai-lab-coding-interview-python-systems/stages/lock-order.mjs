import { codingChapterState } from '../construction.mjs';
import {
  drawArrow,
  drawChapterCard,
  drawChapterText,
  drawFooter,
  drawHeading,
  drawRow,
} from '../defaults.mjs';
export function drawLockOrder(ctx, scene, state, api) {
  api.focus.target('ci-lock-order-trace', () => {
    const { C: themeColors } = api,
      modelState = codingChapterState('lock-order', state),
      currentBeat = modelState.beat,
      progress = modelState.p,
      q = modelState.q;
    {
      if (currentBeat === 0) {
        drawHeading(ctx, api, 'Deduplicate, then use one shared acquisition order');
        drawRow(ctx, api, ['B', 'A', 'A'], 250, 380, 1420, 100, themeColors.blue, 38);
        drawRow(
          ctx,
          api,
          q > 0.5 ? ['A', 'B'] : ['sort + unique', 'pending'],
          450,
          630,
          1020,
          100,
          themeColors.yellow,
          38,
        );
        drawChapterText(ctx, api, 'caller 1: A then B', 350, 895, 31, themeColors.green);
        drawChapterText(ctx, api, 'caller 2: A then B', 1100, 895, 31, themeColors.green);
        drawFooter(ctx, api, 'One registry ensures that the same account names the same lock');
      } else if (currentBeat === 1) {
        drawHeading(ctx, api, 'An active ExitStack owns every acquired lock');
        drawChapterCard(
          ctx,
          api,
          'A: ' + (modelState.unwound ? 'unlocked' : modelState.held ? 'LOCKED' : 'not acquired'),
          220,
          430,
          650,
          130,
          modelState.unwound ? themeColors.green : themeColors.yellow,
          37,
        );
        drawChapterCard(
          ctx,
          api,
          modelState.unknown ? 'Z lookup → KeyError' : 'later lookup: Z',
          1050,
          430,
          650,
          130,
          modelState.unknown ? themeColors.pink : themeColors.blue,
          34,
        );
        const events = ['enter ExitStack', 'acquire A', 'lookup Z fails', 'unwind releases A'];
        drawRow(
          ctx,
          api,
          events.map((v, i) => (i <= modelState.phase ? v : 'pending')),
          170,
          750,
          1580,
          100,
          themeColors.cyan,
          25,
        );
        drawChapterText(
          ctx,
          api,
          modelState.unwound ? 'A.locked() = False' : 'cleanup registered before lookup',
          960,
          935,
          32,
          modelState.unwound ? themeColors.green : themeColors.yellow,
          'center',
        );
        drawFooter(
          ctx,
          api,
          'Returning a stack only after all acquisitions would miss this failure path',
        );
      } else {
        drawHeading(ctx, api, 'Account ordering and request-key ownership have different scopes');
        drawRow(ctx, api, ['A', 'B'], 200, 410, 650, 100, themeColors.blue, 36);
        drawRow(ctx, api, ['C', 'D'], 1070, 410, 650, 100, themeColors.cyan, 36);
        drawChapterCard(ctx, api, 'same request key K', 600, 660, 720, 110, themeColors.pink, 34);
        drawArrow(ctx, api, 520, 550, 740, 630, themeColors.blue);
        drawArrow(ctx, api, 1390, 550, 1180, 630, themeColors.cyan);
        drawChapterCard(
          ctx,
          api,
          'one synchronized global key registry',
          350,
          860,
          1220,
          100,
          themeColors.yellow,
          32,
        );
        drawFooter(
          ctx,
          api,
          'Sorted account locks do not establish fairness, crash recovery or an atomic transfer',
        );
      }
    }
  });
}
export default {
  id: 'lock-order',
  draw: drawLockOrder,
  cues: [
    'ci-lock-order-0-build',
    'ci-lock-order-1-build',
    'ci-lock-order-unwind',
    'ci-lock-order-2-build',
  ],
};
