import { mix, smooth } from '../arithmetic.mjs';
import { snapshotFrame } from '../model.mjs';
import { mark, panel, rowPane, terminal, text } from '../defaults.mjs';
export function drawGitStates(ctx, scene, state, api) {
  const modelState = snapshotFrame(state);
  mark(api, 'working-row', () =>
    rowPane(ctx, api, 'Working tree', modelState.working, 150, api.C.blue),
  );
  mark(api, 'index-row', () =>
    rowPane(
      ctx,
      api,
      'Index · next snapshot',
      modelState.index,
      720,
      api.C.yellow,
      modelState.staged > 0 ? 'copying selected contents' : 'fixture not staged',
    ),
  );
  mark(api, 'history-row', () =>
    rowPane(
      ctx,
      api,
      'Recorded commit',
      modelState.history,
      1290,
      api.C.green,
      modelState.committed > 0 ? 'recording index' : 'fixture not recorded',
    ),
  );
  const moving =
    modelState.staged > 0 && modelState.staged < 1
      ? {
          p: modelState.staged,
          from: 150,
          to: 720,
          color: api.C.yellow,
        }
      : modelState.committed > 0 && modelState.committed < 1
        ? {
            p: modelState.committed,
            from: 720,
            to: 1290,
            color: api.C.green,
          }
        : null;
  if (moving) {
    const x = mix(moving.from, moving.to, smooth(moving.p));
    panel(ctx, api, x, 770, 480, 70, moving.color);
    text(ctx, api, 'prediction: "escalated"', x + 20, 817, 27, moving.color, 'left', true);
  }
  mark(api, 'diff-output', () => {
    if ((state.beat ?? 0) < 2)
      terminal(
        ctx,
        api,
        '$ git diff · working tree versus index',
        modelState.workingDiff.length
          ? [modelState.workingDiff.join('    ')]
          : ['(no unstaged change yet)'],
        250,
        850,
        1420,
        135,
        {
          size: 28,
          lineHeight: 40,
        },
      );
    else
      terminal(
        ctx,
        api,
        modelState.committed === 1
          ? '$ git show HEAD:eval/access_requests.jsonl · selected miss retained'
          : '$ git diff --cached · index versus HEAD',
        ['prediction: "escalated"'],
        250,
        850,
        1420,
        135,
        {
          size: 28,
          lineHeight: 40,
        },
      );
  });
}
export default {
  id: 'git-states',
  draw: drawGitStates,
  cues: ['stage-row', 'edit-row', 'working-diff', 'commit-row', 'cached-diff'],
};
