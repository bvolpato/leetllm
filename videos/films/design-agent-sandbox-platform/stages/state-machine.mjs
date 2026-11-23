import { clamp, motion, sandboxPages } from '../arithmetic.mjs';
import { drawArrow, drawCell, drawFooter, drawRectangle, drawText } from '../defaults.mjs';
export function drawStateMachine(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = clamp(state.beatP ?? 0);
  const cue = (name, index) => {
      const q = state.cues?.['sp-state-machine-' + name];
      if (state.cues && !q) throw Error('Missing current scene cue sp-state-machine-' + name);
      return q
        ? {
            q: q.phase === 'before' ? 0 : q.phase === 'after' ? 1 : q.progress,
            done: q.phase === 'after',
          }
        : {
            q: currentBeat < index ? 0 : currentBeat > index ? 1 : motion(progress),
            done: currentBeat > index || (currentBeat === index && progress > 0.8),
          };
    },
    resultComplete = (n, i) => cue(n, i).done;
  api.focus.target('sp-state-machine-mechanism', () => {
    const cancelled = currentBeat > 1 || (currentBeat === 1 && resultComplete('cancel', 1)),
      cleared = currentBeat === 2 && resultComplete('clear', 2),
      wrong = currentBeat === 2 && resultComplete('wrong', 2),
      m = sandboxPages(
        [10, 20, 30],
        currentBeat > 0 && !cleared
          ? [
              {
                clone: 'A',
                index: 1,
                value: 99,
              },
            ]
          : [],
      ),
      names = ['restored', 'ready', 'running', 'cancelled', 'retired', 'disposed'],
      current = cleared
        ? 5
        : currentBeat === 2
          ? resultComplete('retired', 2)
            ? 4
            : 3
          : cancelled
            ? 3
            : currentBeat === 0
              ? resultComplete('admit', 0)
                ? 2
                : 0
              : 2;
    names.forEach((n, i) => {
      const x = 170 + i * 275;
      drawRectangle(
        ctx,
        api,
        x,
        315,
        240,
        100,
        i === current ? themeColors.green : themeColors.muted,
      );
      drawText(
        ctx,
        api,
        n,
        x + 120,
        380,
        28,
        i === current ? themeColors.green : themeColors.muted,
        'center',
      );
      if (i) drawArrow(ctx, api, x - 30, 365, x - 10, 365, themeColors.muted);
    });
    drawCell(ctx, api, 'Owner', 'A / generation 4', 180, 530, 700, themeColors.blue);
    drawCell(ctx, api, 'State', names[current], 1010, 530, 700, themeColors.yellow);
    drawCell(
      ctx,
      api,
      'Private index1',
      currentBeat > 0 && !cleared ? '99 retained' : 'empty',
      180,
      725,
      700,
      currentBeat > 0 && !cleared ? themeColors.pink : themeColors.green,
    );
    drawCell(
      ctx,
      api,
      'Scratch',
      currentBeat > 0 && !cleared ? 'output.csv retained' : 'empty',
      1010,
      725,
      700,
      currentBeat > 0 && !cleared ? themeColors.pink : themeColors.green,
    );
    if (currentBeat === 0 && resultComplete('index', 0))
      drawText(
        ctx,
        api,
        'read(-1) → reject before Python negative indexing',
        180,
        940,
        30,
        themeColors.pink,
      );
    if (currentBeat === 1 && resultComplete('dispose-fail', 1))
      drawText(
        ctx,
        api,
        'dispose after cancel → execution retirement required',
        180,
        940,
        30,
        themeColors.pink,
      );
    if (currentBeat === 2)
      drawText(
        ctx,
        api,
        cleared
          ? 'Matching retirement → dispose; B still reads 20'
          : wrong
            ? 'Wrong g5 notice → fails; resources retained'
            : 'Await matching owner confirmation',
        180,
        940,
        30,
        cleared ? themeColors.green : themeColors.pink,
      );
    drawFooter(
      ctx,
      api,
      'Deterministic dictionary contract, not process-exit or mount-retirement proof.',
    );
  });
}
export default {
  id: 'state-machine',
  draw: drawStateMachine,
  cues: [
    'sp-state-machine-0',
    'sp-state-machine-admit',
    'sp-state-machine-index',
    'sp-state-machine-1',
    'sp-state-machine-cancel',
    'sp-state-machine-dispose-fail',
    'sp-state-machine-2',
    'sp-state-machine-wrong',
    'sp-state-machine-clear',
    'sp-state-machine-retired',
  ],
};
