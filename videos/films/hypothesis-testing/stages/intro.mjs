import { paired } from '../fixtures.mjs';
import { pairedOutcomeFocusTarget, resultOrOperation, slug } from '../model.mjs';
import { card, mark, text } from '../defaults.mjs';

export function drawIntro(ctx, scene, state, api) {
  const C = api.C;
  const permission = paired.find((row) => row.task === 'permission');
  const revealed = resultOrOperation(state, 'intro-pass', 1);
  const settled = resultOrOperation(state, 'intro-receipt', 1);
  const passesA = paired.reduce((sum, row) => sum + row.a, 0);
  const passesB = paired.reduce(
    (sum, row) => sum + (row === permission && !revealed ? 0 : row.b),
    0,
  );

  mark(api, 'opening-scores', () => {
    text(ctx, api, 'Current assistant A', 630, 288, 40, C.blue, 'center');
    text(ctx, api, 'Challenger B', 1290, 288, 40, C.green, 'center');
    text(ctx, api, passesA, 630, 503, 210, C.blue, 'center');
    text(ctx, api, passesB, 1290, 503, 210, C.green, 'center');
    text(ctx, api, 'passes', 960, 433, 40, C.ink, 'center');
  });

  for (const [i, row] of paired.entries()) {
    const x = 235 + i * 245;
    const last = row === permission;
    const columnColor = last ? (revealed ? C.green : C.yellow) : C.muted;
    mark(api, `paired-task-${slug(row.task)}`, () =>
      text(ctx, api, row.task, x + 96, 622, last ? 35 : 28, columnColor, 'center'),
    );
    for (const [model, y] of [
      ['a', 647],
      ['b', 746],
    ]) {
      const pending = last && model === 'b' && !revealed;
      const label = pending ? '?' : row[model] ? 'pass' : 'fail';
      mark(api, pairedOutcomeFocusTarget(row, model), () => {
        if (last) {
          card(
            ctx,
            api,
            label,
            x,
            y,
            192,
            80,
            pending ? C.yellow : row[model] ? C.green : C.pink,
            40,
          );
        } else {
          text(ctx, api, label, x + 96, y + 54, 31, C.muted, 'center');
        }
      });
    }
  }
  text(ctx, api, 'A', 187, 702, 40, C.blue, 'right');
  text(ctx, api, 'B', 187, 801, 40, C.green, 'right');

  if (!revealed) {
    const predict = resultOrOperation(state, 'opening-predict', 0);
    mark(api, 'opening-question', () =>
      text(
        ctx,
        api,
        predict ? 'If B passes, would you switch?' : 'A denied request must stay blocked',
        960,
        967,
        44,
        predict ? C.yellow : C.ink,
        'center',
      ),
    );
  } else {
    mark(api, 'intro-lift', () =>
      text(
        ctx,
        api,
        settled
          ? `Net gain   +${passesB - passesA} pass in ${paired.length} tasks`
          : 'B kept the request blocked',
        960,
        967,
        44,
        C.green,
        'center',
      ),
    );
  }
}

export default {
  id: 'intro',
  draw: drawIntro,
  cues: [
    'opening-current',
    'opening-pairs',
    'opening-predict',
    'intro-permission',
    'intro-pass',
    'intro-denial',
    'intro-receipt',
  ],
};
