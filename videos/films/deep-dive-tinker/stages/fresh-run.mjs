import { timedScene } from '../timed-scene.mjs';

const full = [30, 31, 32, 40, 41, 42];
const promptLength = 3;
const targets = full.slice(1);
const weights = targets.map((_, i) => Number(i + 1 >= promptLength));
const answerCount = weights.reduce((sum, w) => sum + w, 0);
const trainer = 9;
const budget = 1;
const original = { name: 'A', step: 6 };
const replacement = { name: 'B', step: 9 };
const lag = (sample) => trainer - sample.step;
const verdict = (sample) => (lag(sample) <= budget ? 'passes' : 'withhold');

export default timedScene('fresh-run', [3, 3, 2, 4], (ctx, api, time) => {
  const { C, focus } = api;
  const tokenX = (i) => 595 + 205 * i;
  const roleColor = (i) => (i < promptLength ? C.blue : C.yellow);
  const shifted = time.started(0, 2);
  focus.target('fresh-tokens', () => {
    api.text(ctx, 'A  ·  clamp sample', 125, 246, 36, C.cyan);
    api.text(ctx, shifted ? 'Predicting input' : 'Full sequence', 125, 354, 33, C.ink);
    full.forEach((id, i) => {
      if (!shifted || i < targets.length)
        api.text(ctx, String(id), tokenX(i), 356, 49, roleColor(i), 'center');
    });
    if (shifted) {
      api.text(ctx, 'Next target', 125, 457, 33, C.ink);
      targets.forEach((id, i) => {
        const x = tokenX(i);
        api.text(ctx, String(id), x, 461, 51, roleColor(i + 1), 'center');
        if (id === full[promptLength] && time.done(1, 0))
          api.line(ctx, x - 39, 472, x + 39, 472, C.yellow, 4);
      });
    }
  });
  const showRaw = time.done(1, 0);
  const showMean = time.done(1, 1);
  focus.target('fresh-decisions', () => {
    focus.target('fresh-weights', () => {
      api.text(ctx, showMean ? 'SFT mean weight' : 'SFT weight', 125, 570, 33, C.muted);
      weights.forEach((w, i) => {
        const value = showMean && w ? '1/' + answerCount : String(w);
        const shown = showMean || (showRaw && i === promptLength - 1);
        api.text(
          ctx,
          shown ? value : '?',
          tokenX(i),
          572,
          47,
          shown && w ? C.yellow : C.muted,
          'center',
        );
      });
    });
    if (time.beat === 0 && time.started(0, 2))
      api.text(ctx, 'First weighted target?     Admit A?', 960, 992, 41, C.ink, 'center');
  });
  const stepX = (step) => 560 + (step - original.step) * 350;
  const versionVisible = time.started(0, 1);
  const ageKnown = time.done(1, 2);
  const selected = time.done(2, 0);
  const hasNew = time.done(3, 1);
  const evaluated = time.done(3, 2);
  focus.target('fresh-versions', () => {
    api.text(
      ctx,
      'Trainer step ' + trainer + '     ·     Maximum lag ' + budget,
      125,
      681,
      35,
      C.ink,
    );
    api.line(ctx, stepX(6), 789, stepX(9), 789, C.muted, 4);
    if (ageKnown) api.line(ctx, stepX(trainer - budget), 789, stepX(trainer), 789, C.green, 9);
    for (let step = original.step; step <= trainer; step++) {
      api.line(ctx, stepX(step), 777, stepX(step), 801, C.ink, 3);
      api.text(ctx, String(step), stepX(step), 844, 34, C.ink, 'center');
    }
    if (versionVisible) {
      api.circle(ctx, stepX(original.step), 789, 13, C.cyan);
      api.text(ctx, 'Sample A', stepX(original.step), 751, 32, C.cyan, 'center');
      const label = ageKnown
        ? 'A   ·   ' +
          trainer +
          ' − ' +
          original.step +
          ' = ' +
          lag(original) +
          '   ·   ' +
          verdict(original)
        : 'Sample A   ·   path ' + original.step;
      api.text(ctx, label, stepX(original.step), 927, 37, ageKnown ? C.pink : C.cyan, 'center');
    }
    focus.target('fresh-new', () => {
      if (selected) {
        api.circle(ctx, stepX(replacement.step), 789, 13, C.yellow);
        api.text(
          ctx,
          hasNew ? 'Sample B' : 'New client',
          stepX(replacement.step),
          751,
          32,
          C.yellow,
          'center',
        );
        const label = evaluated
          ? 'B   ·   lag ' + lag(replacement) + '   ·   ' + verdict(replacement)
          : (hasNew ? 'B sampled from ' : 'Selected path ') + replacement.step;
        api.text(
          ctx,
          label,
          stepX(replacement.step),
          927,
          37,
          evaluated ? C.green : C.yellow,
          'center',
        );
        if (time.started(3, 3))
          api.text(ctx, 'Grade B and keep its token–score pairs', 1400, 1007, 32, C.ink, 'center');
      }
    });
  });
  if (time.beat === 2 && time.started(2, 1))
    api.text(ctx, 'What changes on A’s receipt?', 960, 1005, 39, C.ink, 'center');
});
