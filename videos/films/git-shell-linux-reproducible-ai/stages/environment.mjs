import { cueProgress } from '../construction.mjs';
import { mark, terminal } from '../defaults.mjs';
export function drawEnvironment(ctx, scene, state, api) {
  const currentBeat = state.beat ?? 0,
    built = cueProgress(state, 'environment-receipt', 0, 0.4, 0.8);
  mark(api, 'environment-contract', () =>
    terminal(
      ctx,
      api,
      'Tracked setup contract',
      [
        '.python-version: 3.12',
        'requirements.txt: # standard library only',
        '.env.example: ACCESS_API_KEY=',
      ],
      150,
      335,
      1620,
      290,
      {
        color: api.C.blue,
        size: 34,
        lineHeight: 66,
      },
    ),
  );
  if (currentBeat === 0)
    mark(api, 'environment-build', () =>
      terminal(
        ctx,
        api,
        'New clone · local environment',
        [
          '$ source activate.sh',
          ...(built === 1
            ? [
                'Python executable: .../access-rag/.venv/bin/python',
                'Python >=3.12: verified · environment ready',
              ]
            : ['creating .venv and checking its interpreter']),
        ],
        150,
        700,
        1620,
        250,
        {
          color: api.C.green,
          size: 32,
          lineHeight: 60,
        },
      ),
    );
  else
    mark(api, 'lfs-contract', () =>
      terminal(
        ctx,
        api,
        'Large versioned weights · separate from this tiny fixture',
        [
          'Git commit → LFS pointer',
          'git lfs pull → separate model bytes',
          'Check required objects before running the evaluation',
        ],
        150,
        700,
        1620,
        250,
        {
          color: api.C.cyan,
          size: 34,
          lineHeight: 63,
        },
      ),
    );
}
export default {
  id: 'environment',
  draw: drawEnvironment,
  cues: ['rebuild-venv', 'environment-receipt', 'environment-names', 'lfs-boundary'],
};
