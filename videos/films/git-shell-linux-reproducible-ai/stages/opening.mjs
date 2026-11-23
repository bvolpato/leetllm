import { fixturePath } from '../fixtures.mjs';
import { cueProgress } from '../construction.mjs';
import { mark, terminal, text } from '../defaults.mjs';
export function drawOpening(ctx, scene, state, api) {
  const local = cueProgress(state, 'local-receipt', 0, 0.05, 0.28),
    missing = cueProgress(state, 'clone-error', 0, 0.48, 0.8);
  mark(api, 'local-terminal', () =>
    terminal(
      ctx,
      api,
      'Original checkout · /workspace/access-rag',
      [
        '$ ./repro.sh',
        ...(local === 1
          ? [
              'Eval rows: 3',
              'Exact-match accuracy',
              'on tiny fixture: 0.667 (2/3)',
              'Gate passed. You may commit.',
            ]
          : ['evaluation pending']),
      ],
      150,
      350,
      760,
      430,
      {
        color: api.C.green,
        size: 29,
      },
    ),
  );
  mark(api, 'clone-terminal', () =>
    terminal(
      ctx,
      api,
      'Fresh clone · /tmp/access-rag',
      [
        '$ ./repro.sh',
        ...(missing === 1
          ? [
              'ERROR: ' + fixturePath,
              'missing. Did you forget to commit',
              'the fixture or pull the latest repo?',
              'exit status: 1',
            ]
          : ['evaluation pending']),
      ],
      1010,
      350,
      760,
      430,
      {
        color: missing === 1 ? api.C.pink : api.C.cyan,
        size: 29,
      },
    ),
  );
  mark(api, 'missing-question', () =>
    text(ctx, api, 'Which required file reached the commit?', 960, 900, 43, api.C.yellow, 'center'),
  );
}
export default {
  id: 'opening',
  draw: drawOpening,
  cues: ['local-receipt', 'clone-error', 'opening-question'],
};
