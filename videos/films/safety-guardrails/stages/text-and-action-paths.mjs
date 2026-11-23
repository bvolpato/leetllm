import { approvalFixture, articleAction, articleActionHash, guardCue } from '../model.mjs';

const action = articleAction('a');
const hash = articleActionHash('a').slice(0, 8) + '…';
const approvalActor = 'engineer-9';
const outcome = approvalFixture([{ approvalActor }]).outcomes[0];

export function paintTextAndActionPaths(ctx, scene, state, api) {
  const { C, text, line, rect } = api;
  const beat = state.beat ?? 0;
  const compare = guardCue(state, 'binding-compare', 1);
  const decided = guardCue(state, 'binding-result', 2) === 1;

  api.focus.target('reviewed-reply', () => {
    text(ctx, 'Chat', 120, 270, 30, C.muted);
    text(ctx, '“I can prepare the change.”', 345, 270, 44, C.ink);
    text(ctx, 'Text review passed', 1775, 270, 29, C.green, 'right');
  });
  line(ctx, 120, 319, 1790, 319, C.muted, 2);
  text(ctx, 'Deploy proposal', 530, 425, 37, C.blue);
  text(ctx, 'Trusted approval record', 1170, 425, 37, C.cyan);
  const lookup = guardCue(state, 'binding-lookup', 0);
  const rows = [
    ['Approval ID', 'approval-42', 'approval-42'],
    [
      'Target',
      action.service + ' / ' + action.environment,
      action.service + ' / ' + action.environment,
    ],
    ['Action hash', hash, hash],
    ['Engineer', 'engineer-7', approvalActor],
  ];
  rows.forEach(([key, left, right], i) => {
    const y = 525 + i * 100;
    api.focus.target(i === 3 ? 'actor-pair' : 'action-pair', () => {
      text(ctx, key, 125, y, 31, C.muted);
      text(ctx, left, 530, y, 39, C.ink);
      text(ctx, lookup === 1 ? right : '…', 1170, y, 39, C.ink);
      if (i === 3) {
        text(ctx, 'Authenticated session', 530, y + 46, 26, C.blue);
        text(ctx, 'Actor named in the grant', 1170, y + 46, 26, C.cyan);
      }
      if (i === 3 && compare > 0) {
        line(ctx, 526, y + 13, 526 + 215 * compare, y + 13, C.yellow, 4);
        line(ctx, 1166, y + 13, 1166 + 215 * compare, y + 13, C.yellow, 4);
      }
    });
  });
  api.focus.target('binding-verdict', () => {
    const message = decided
      ? outcome.result + '   ·   ' + outcome.count + ' deployments'
      : beat === 1
        ? 'Does this approval belong to the caller?'
        : 'Tool admission pending';
    rect(ctx, 270, 915, 1380, 85, C.panel, decided ? C.yellow : C.muted, 8);
    text(ctx, message, 960, 970, 35, decided ? C.yellow : C.ink, 'center');
  });
}
export { paintTextAndActionPaths as drawTextAndActionPaths };
export default {
  id: 'text-and-action-paths',
  draw: paintTextAndActionPaths,
  cues: ['binding-reply', 'binding-lookup', 'binding-actor', 'binding-compare', 'binding-result'],
};
