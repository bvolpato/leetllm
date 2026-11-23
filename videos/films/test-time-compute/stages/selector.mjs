import { answer, scored } from '../fixtures.mjs';
import { text } from '../defaults.mjs';
import { ttSmooth, ttMix } from '../arithmetic.mjs';
import { sceneClock } from '../scene-clock.mjs';

export function drawSelector(ctx, scene, state, api) {
  const { C } = api,
    cue = sceneClock(scene, state);
  const count = 1 + Number(cue('scorer-ranking').started) + Number(cue('overrated-answer').started);
  const pool = scored.slice(0, count);
  const winner = pool.reduce((a, b) => (b.score > a.score ? b : a));
  const move = cue('winner-moves');
  const view = (s, x, y, size, color = C.ink) => text(ctx, api, s, x, y, size, color);
  view('Chairs', 140, 306, 35, C.muted);
  view('Learned score', 540, 306, 35, C.muted);
  view('Room check', 1305, 306, 35, C.muted);
  api.focus.target('score-rows', () => {
    pool.forEach((row, i) => {
      const y = 389 + i * 155;
      const amount = i === 1 ? cue('scorer-ranking').p : i === 2 ? cue('overrated-answer').p : 1;
      const passing = row.answer === answer;
      const mark = () => {
        view(String(row.answer), 155, y + 54, 70);
        api.rect(ctx, 540, y + 8, 560, 37, C.panel, C.muted, 4);
        const width = 560 * row.score * amount;
        if (width > 0) api.rect(ctx, 540, y + 8, width, 37, C.blue, undefined, 4);
        if (amount === 1) view(row.score.toFixed(2), 1140, y + 48, 46, C.blue);
        api.focus.target(passing ? 'checked-row' : 'failed-row', () =>
          view(passing ? '✓   44' : '×', 1335, y + 49, 47, passing ? C.green : C.muted),
        );
      };
      if (i === 2) api.focus.target('third-score', mark);
      else mark();
    });
  });
  api.focus.target('selected-slot', () => {
    const index = scored.indexOf(winner);
    const y = ttMix(415, 415 + 155 * index, ttSmooth(move.p));
    api.arrow(ctx, 495, y, 350, y, move.done ? C.pink : C.yellow, 6);
    const shown = move.done ? winner.answer : scored[0].answer;
    const message =
      !move.done && cue('score-question').started
        ? 'Largest score returns … ?'
        : `Return slot   ${shown} chairs`;
    view(message, 540, 931, 55, move.done ? C.pink : C.yellow);
  });
}

export default { id: 'selector', draw: drawSelector };
