import { RS_TAPES } from '../fixtures.mjs';
import { researchEvent } from '../construction.mjs';
import { cueProgress } from '../evidence.mjs';

export function drawIndexedTapes(ctx, scene, state, api) {
  const { C } = api;
  const event = (beat, clause) => researchEvent(scene.id, state, beat, clause);
  api.focus.target('rs-indexed-tapes-mechanism', () => {
    if (state.beat === 0) {
      api.text(ctx, 'One slip draw per move', 150, 275, 45, C.ink);
      const travel = event(0, 1);
      for (const [i, steps] of [6, 12].entries()) {
        const y = 455 + i * 208;
        const color = i ? C.cyan : C.blue;
        api.text(ctx, i ? 'Shaped' : 'Sparse', 150, y + 40, 40, color);
        const used = Math.min(steps, Math.floor(12 * travel));
        const nextVisible = i
          ? cueProgress(state, 'next-shaped-draw', 0, 0.89, 1) === 1
          : cueProgress(state, 'next-sparse-draw', 0, 0.77, 0.89) === 1;
        for (let j = 0; j < 13; j++) {
          const x = 450 + 100 * j;
          api.rect(
            ctx,
            x,
            y - 27,
            82,
            79,
            j < used ? color : C.panel,
            nextVisible && j === used ? C.yellow : C.muted,
            7,
          );
          api.text(ctx, String(j + 1), x + 41, y + 24, 33, j < used ? C.bg : C.ink, 'center');
        }
        if (nextVisible) api.text(ctx, `Next draw: ${used + 1}`, 450, y + 114, 35, C.yellow);
      }
      if (event(0, 2) > 0) api.text(ctx, 'Next trip, first move', 960, 905, 42, C.ink, 'center');
      return;
    }
    // The coordinates below are printed one-based, in the same order as the spoken trips.
    const secondTrip = state.beat === 2 || event(1, 2) > 0;
    const moves = state.beat === 2 ? 3 * event(2, 0) : 0;
    const column = Math.round(moves);
    const row = Number(secondTrip);
    api.text(ctx, 'Slip tape   /   Seed 0', 150, 280, 43, C.ink);
    api.text(ctx, '80 trips × 12 moves', 1760, 280, 36, C.muted, 'right');
    for (let j = 0; j < 12; j++) {
      api.text(ctx, String(j + 1), 404 + j * 121, 380, 31, C.muted, 'center');
    }
    RS_TAPES.slip.forEach((values, i) => {
      const y = 421 + i * 135;
      api.text(ctx, `Trip ${i + 1}`, 150, y + 60, 38, C.ink);
      values.forEach((value, j) => {
        const selected = i === row && j === column;
        api.rect(ctx, 350 + j * 121, y, 108, 93, selected ? C.yellow : C.panel, C.muted, 8);
        api.text(
          ctx,
          value.toFixed(2),
          404 + j * 121,
          y + 58,
          32,
          selected ? C.bg : C.ink,
          'center',
        );
      });
    });
    if (state.beat === 2 && event(2, 0) === 1) {
      const slip = RS_TAPES.slip[1][3] < 0.15;
      api.text(ctx, `${RS_TAPES.slip[1][3].toFixed(2)} < 0.15`, 960, 775, 52, C.yellow, 'center');
      if (event(2, 1) > 0 && slip) {
        api.text(ctx, 'Choose left   →   move right', 550, 917, 40, C.blue, 'center');
        api.text(ctx, 'Choose right   →   move left', 1370, 917, 40, C.cyan, 'center');
      }
    } else {
      api.text(ctx, 'Both learners read the highlighted cell.', 960, 822, 40, C.ink, 'center');
    }
  });
}
export default { id: 'indexed-tapes', draw: drawIndexedTapes };
