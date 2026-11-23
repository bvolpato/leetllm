import { passingCandidates } from '../fixtures.mjs';
import { cueProgress, resultOrOperation } from '../model.mjs';
import {
  constructionBox,
  constructionCaption,
  constructionEquation,
  constructionHeading,
  constructionText,
  mark,
} from '../defaults.mjs';
export function drawPasskTarget(ctx, scene, state, api) {
  const themeColors = api.C,
    currentBeat = state.beat ?? 0,
    checked = (id) => {
      if (state.cues && !Object.hasOwn(state.cues, id))
        throw Error('Undeclared hypothesis cue ' + id);
    },
    cp = (id, beat) => {
      checked(id);
      return cueProgress(state, id, beat);
    },
    on = (id, beat) => {
      checked(id);
      return resultOrOperation(state, id, beat);
    };
  mark(api, 'passk-target-construction', () => {
    if (currentBeat === 0) {
      const rows = [
        [1, 0, 0],
        [0, 0, 1],
        [0, 0, 0],
      ];
      const names = ['Timestamp', 'Retry state', 'Quota rounding'];
      const any = on('target-open-three', 0);
      const unordered = on('target-unordered-view', 0);
      constructionHeading(
        ctx,
        api,
        unordered ? 'Choose any one position per task' : 'Which tasks can the assistant solve?',
      );
      for (let j = 0; j < 3; j++)
        constructionText(
          ctx,
          api,
          (unordered ? 'Position ' : 'Attempt ') + (j + 1),
          624 + j * 300,
          373,
          33,
          themeColors.ink,
          'center',
        );
      for (const [i, r] of rows.entries()) {
        const y = 485 + i * 126;
        constructionText(ctx, api, names[i], 214, y + 11, 33, themeColors.ink);
        for (const [j, v] of r.entries()) {
          const visible = j === 0 || any;
          constructionBox(
            ctx,
            api,
            visible ? (v ? 'pass' : 'fail') : '·',
            624 + j * 300,
            y,
            210,
            86,
            visible ? (v ? themeColors.green : themeColors.muted) : themeColors.muted,
            33,
          );
        }
        if (unordered)
          constructionText(
            ctx,
            api,
            r.reduce((sum, v) => sum + v, 0) + ' / 3',
            1555,
            y + 11,
            40,
            themeColors.cyan,
            'center',
          );
      }
      if (on('hyp-target-unordered', 0))
        constructionText(
          ctx,
          api,
          'Macro pass@1     (1/3 + 1/3 + 0) / 3 = 2/9',
          960,
          943,
          42,
          themeColors.cyan,
          'center',
        );
      else if (!unordered && on('hyp-target-any', 0))
        constructionText(
          ctx,
          api,
          'Any of three     2 of 3 tasks solved',
          960,
          943,
          42,
          themeColors.green,
          'center',
        );
      else if (!any && on('hyp-target-first', 0))
        constructionText(
          ctx,
          api,
          'First attempt     1 of 3 tasks solved',
          960,
          943,
          42,
          themeColors.blue,
          'center',
        );
    } else if (currentBeat === 1) {
      constructionHeading(
        ctx,
        api,
        'A fixed subset of distinct positions carries k independent draws',
      );
      const plot = api.teaching.axes({
          x: 280,
          y: 440,
          width: 1300,
          height: 340,
          xDomain: [0, 1],
          yDomain: [0, 1],
          xTicks: [0, 0.25, 0.5, 0.75, 1],
          yTicks: [0, 0.5, 1],
          xLabel: 'unknown per-task completion success p',
          yLabel: 'any-of-k target',
          fontSize: 25,
        }),
        q = cp('hyp-target-curve', 1),
        points = Array.from(
          {
            length: 101,
          },
          (_, i) => ({
            x: i / 100,
            y: 1 - (1 - i / 100) ** 3,
          }),
        ).slice(0, Math.max(1, Math.floor(q * 101)));
      api.teaching.curve({
        plot,
        points,
        color: themeColors.cyan,
        width: 5,
      });
      constructionEquation(
        ctx,
        api,
        String.raw`P(\mathrm{any\ success})=1-(1-p)^k`,
        960,
        350,
        46,
        themeColors.cyan,
      );
      constructionText(
        ctx,
        api,
        'Illustrated k = 3 · estimation pool n can exceed k',
        960,
        940,
        33,
        themeColors.yellow,
        'center',
      );
      constructionCaption(
        ctx,
        api,
        'The target belongs to the task decoding distribution; a subset’s expected indicator equals this probability.',
      );
    } else {
      constructionHeading(ctx, api, 'Overlapping subsets reuse candidate occurrences');
      for (let i = 0; i < 10; i++)
        constructionBox(
          ctx,
          api,
          'C' + (i + 1),
          260 + i * 155,
          370,
          120,
          75,
          passingCandidates.includes(i) ? themeColors.green : themeColors.blue,
          28,
        );
      const sets = [
        [0, 1, 2],
        [1, 2, 3],
      ];
      sets.forEach((ids, row) => {
        ids.forEach((id, i) => {
          const x = 600 + i * 350,
            y = 600 + row * 180;
          constructionBox(
            ctx,
            api,
            'C' + (id + 1),
            x,
            y,
            250,
            90,
            id === 1 || id === 2 ? themeColors.yellow : themeColors.blue,
            32,
          );
        });
      });
      constructionText(
        ctx,
        api,
        'C2 and C3 occur in both subsets · shared randomness',
        960,
        965,
        33,
        themeColors.yellow,
        'center',
      );
      constructionCaption(
        ctx,
        api,
        'HumanEval study: 164 problems, 200 samples per problem, attempt budgets up to 100.',
      );
    }
  });
}
export default {
  id: 'passk-target',
  draw: drawPasskTarget,
  cues: [
    'passk-target-0',
    'hyp-target-first',
    'target-open-three',
    'hyp-target-any',
    'target-unordered-view',
    'hyp-target-unordered',
    'passk-target-1',
    'hyp-target-curve',
    'passk-target-2',
  ],
};
