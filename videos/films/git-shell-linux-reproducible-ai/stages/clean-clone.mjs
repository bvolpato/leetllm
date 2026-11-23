import { cloneFrame } from '../model.mjs';
import { mark, terminal, text } from '../defaults.mjs';
export function drawCleanClone(ctx, scene, state, api) {
  const modelState = cloneFrame(state),
    currentBeat = state.beat ?? 0;
  if (currentBeat === 0) {
    mark(api, 'clone-files', () =>
      terminal(
        ctx,
        api,
        'Empty temporary directory · receive the recorded files',
        [
          '$ git clone --no-local "$repo_root" "$clone_root/access-rag"',
          ...(modelState.files === 1
            ? [
                'eval/access_requests.jsonl · scripts/score_access_requests.py',
                'scripts/install_hooks.sh · activate.sh · repro.sh',
              ]
            : ['waiting for committed files']),
        ],
        150,
        330,
        1620,
        290,
        {
          size: 28,
          lineHeight: 67,
        },
      ),
    );
    mark(api, 'clone-setup', () =>
      terminal(
        ctx,
        api,
        'Inside the clone',
        [
          '$ ./scripts/install_hooks.sh',
          '$ source activate.sh && ./repro.sh',
          modelState.setup === 1
            ? 'Setup complete · evaluation is the next observation'
            : 'installing hook and rebuilding local environment',
        ],
        150,
        690,
        1620,
        260,
        {
          size: 32,
          lineHeight: 62,
          color: api.C.yellow,
        },
      ),
    );
  } else {
    mark(api, 'clone-receipt', () =>
      terminal(
        ctx,
        api,
        'Fresh clone · same original three rows',
        [
          '$ ./repro.sh',
          ...(modelState.result
            ? [
                'Eval rows: 3',
                'Exact-match accuracy: 0.667 (2/3)',
                'Gate passed. · exit 0',
                '$ git status --short → (empty)',
              ]
            : ['evaluation pending']),
        ],
        150,
        320,
        1620,
        490,
        {
          color: api.C.green,
          size: 36,
          lineHeight: 70,
        },
      ),
    );
    mark(api, 'host-boundary', () =>
      text(
        ctx,
        api,
        modelState.hostBoundary === 1
          ? 'Files and setup verified here · OS, Python build and GPU driver remain host inputs'
          : 'Clone check exit status: ' + (modelState.clean ? '0' : 'pending'),
        960,
        920,
        33,
        api.C.yellow,
        'center',
      ),
    );
  }
}
export default {
  id: 'clean-clone',
  draw: drawCleanClone,
  cues: ['clone-files', 'clone-setup', 'final-receipt', 'host-boundary'],
};
