import { wrongRow } from '../fixtures.mjs';
import { commitBoundaryFrame } from '../model.mjs';
import { mark, terminal, text } from '../defaults.mjs';
export function drawCommitBoundary(ctx, scene, state, api) {
  const modelState = commitBoundaryFrame(state);
  mark(api, 'snapshot-counts', () => {
    terminal(
      ctx,
      api,
      'Working tree · unstaged repair',
      [
        'original rows: 101, 102, 103',
        modelState.repaired === 1 ? 'row 104 removed' : 'row 104 still present',
        ...(modelState.checked === 1 ? ['2/3 · local hook passes'] : ['local check pending']),
      ],
      150,
      335,
      760,
      315,
      {
        color: api.C.blue,
        size: 32,
      },
    );
    terminal(
      ctx,
      api,
      'Index · selected contents',
      [
        'original rows: 101, 102, 103',
        'row 104: approved → blocked',
        '2/4 · commit records these rows',
      ],
      1010,
      335,
      760,
      315,
      {
        color: api.C.yellow,
        size: 32,
      },
    );
  });
  if ((state.beat ?? 0) === 0)
    terminal(
      ctx,
      api,
      '$ git diff · working tree versus index',
      modelState.repaired === 1 ? ['- ' + JSON.stringify(wrongRow)] : ['(no unstaged removal yet)'],
      150,
      725,
      1620,
      160,
      {
        size: 26,
      },
    );
  else {
    mark(api, 'ci-terminal', () =>
      terminal(
        ctx,
        api,
        'CI · clean checkout of the recorded snapshot',
        [
          '$ ./repro.sh',
          ...(modelState.ci === 1
            ? ['Eval rows: 4 · accuracy 0.500 (2/4) · exit 1']
            : ['checking committed input...']),
        ],
        150,
        710,
        1620,
        200,
        {
          color: api.C.pink,
          size: 33,
        },
      ),
    );
    mark(api, 'bypass-command', () =>
      text(
        ctx,
        api,
        '$ git commit --no-verify   ·   explicit local-hook bypass',
        960,
        975,
        29,
        api.C.yellow,
        'center',
        true,
      ),
    );
  }
}
export default {
  id: 'commit-boundary',
  draw: drawCommitBoundary,
  cues: ['unstaged-repair', 'local-pass', 'committed-check', 'explicit-bypass'],
};
