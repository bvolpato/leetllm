import { liveRewardDecision } from '../arithmetic.mjs';
import { counterTransition, skyChapterModel } from '../model.mjs';
import {
  drawSkyChapterBox,
  drawSkyChapterEquation,
  drawSkyChapterRow,
  drawSkyChapterTable,
  drawSkyChapterText,
  drawSkyChapterTitle,
} from '../defaults.mjs';
export function drawZeroVariancePolicy(ctx, scene, state, api) {
  const { C: themeColors } = api,
    { b: currentBeat, p: progress } = skyChapterModel('zero-variance-policy', state),
    R = (id) => api.focus.progress('sky-' + id, state.cues ? 0 : progress),
    done = (id) => R(id) >= 1;
  api.focus.target('sky-zero-variance-policy-mechanism', () => {
    drawSkyChapterTitle(
      ctx,
      api,
      !currentBeat
        ? 'Conserve submitted = accepted + filtered + running'
        : currentBeat === 1
          ? 'Only live trajectories enter the spread comparison'
          : 'Which prompts reached training?',
    );
    if (!currentBeat) {
      let counter = {
        submitted: 4,
        accepted: 2,
        filtered: 0,
        running: 2,
      };
      const steps = [
        ['reserve-slot', 'reserve'],
        ['complete-group', 'complete'],
        ['filter-group', 'filter'],
      ];
      let operation = 'initial supplied state';
      for (const [id, event] of steps)
        if (done(id)) {
          counter = counterTransition(counter, event);
          operation = event;
        }
      drawSkyChapterTable(
        ctx,
        api,
        [
          ['submitted', 'accepted', 'filtered', 'running'],
          [counter.submitted, counter.accepted, counter.filtered, counter.running],
        ],
        200,
        405,
        1520,
        225,
        36,
      );
      drawSkyChapterText(
        ctx,
        api,
        'last operation: ' + operation,
        960,
        745,
        34,
        themeColors.yellow,
        'center',
      );
      drawSkyChapterEquation(
        ctx,
        api,
        `${counter.submitted}=${counter.accepted}+${counter.filtered}+${counter.running}`,
        960,
        875,
        48,
        themeColors.green,
      );
      drawSkyChapterText(
        ctx,
        api,
        'trainer step remains 4',
        960,
        965,
        31,
        themeColors.muted,
        'center',
      );
    } else if (currentBeat === 1) {
      const singleton = done('single-live'),
        live = singleton ? [true, false, false] : [true, true, false],
        r = liveRewardDecision([1, 1, 0], live);
      drawSkyChapterRow(ctx, api, ['trajectory0', 'trajectory1', 'trajectory2'], 380, {
        x: 240,
        width: 1440,
      });
      drawSkyChapterRow(ctx, api, [1, 1, 0], 520, {
        x: 240,
        width: 1440,
      });
      drawSkyChapterRow(
        ctx,
        api,
        live.map((v) => (v ? 'LIVE' : 'MASKED OUT')),
        660,
        {
          x: 240,
          width: 1440,
          colors: live.map((v) => (v ? themeColors.cyan : themeColors.muted)),
          size: 28,
        },
      );
      if (done('live-only'))
        drawSkyChapterText(
          ctx,
          api,
          'live spread ' +
            r.spread +
            ' · ' +
            (r.keep ? 'keep the single live response' : 'drop equal live group'),
          960,
          900,
          33,
          r.keep ? themeColors.yellow : themeColors.pink,
          'center',
        );
    } else {
      const names = ['attempted', 'filtered', 'retained', 'trained'];
      names.forEach((v, i) =>
        drawSkyChapterBox(
          ctx,
          api,
          v,
          175 + i * 440,
          440,
          380,
          100,
          [themeColors.blue, themeColors.pink, themeColors.cyan, themeColors.green][i],
          34,
        ),
      );
      drawSkyChapterRow(
        ctx,
        api,
        ['prompt Q42', 'checker all-success', 'live masks', 'optimizer not run'],
        730,
        {
          x: 170,
          width: 1580,
          size: 25,
        },
      );
      drawSkyChapterText(
        ctx,
        api,
        'Inspect evaluator evidence before interpreting a flat reward curve',
        960,
        940,
        32,
        themeColors.yellow,
        'center',
      );
    }
  });
}
export default {
  id: 'zero-variance-policy',
  draw: drawZeroVariancePolicy,
  cues: [
    'sky-zero-variance-policy-b0',
    'sky-reserve-slot',
    'sky-complete-group',
    'sky-filter-group',
    'sky-zero-variance-policy-b1',
    'sky-live-only',
    'sky-single-live',
    'sky-zero-variance-policy-b2',
  ],
};
