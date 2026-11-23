import { cueComplete, cueProgress } from '../construction.mjs';
import { canWrite, helperAllows } from '../model.mjs';

export default {
  id: 'path-helper-boundary',
  cues: [
    'helper-resolve',
    'path-helper-boundary-step-1',
    'path-helper-boundary-step-2',
    'helper-scope',
    'helper-use',
  ],
  draw(ctx, scene, state, api) {
    const { C } = api;
    const label = (s, x, y, size, color = C.ink, font = 'sans') =>
      api.text(ctx, s, x, y, size, color, 'left', font);
    const paths =
      state.beat === 0
        ? [
            'src/app.py',
            '../.ssh/authorized_keys',
            '.git/hooks/post-checkout',
            '.git/config',
            '.vscode/tasks.json',
          ]
        : ['.env', '.env.local', '.git', '.git/config.bak'];
    const showAnswers = state.beat > 0 || cueComplete(state, 'helper-resolve', 0, 0.3);
    const stdout = cueProgress(state, 'path-helper-boundary-step-1', 0, 0.65, 0.74) > 0;
    const scope = cueProgress(state, 'helper-scope', 1, 0.39, 0.5) > 0;
    api.focus.target(state.beat === 0 ? 'helper-execution' : 'helper-policy-gap', () => {
      label('Name in workspace', 134, 315, 37, C.muted);
      label('Python helper', 963, 315, 37, C.blue);
      label(state.beat === 0 ? 'Printed?' : 'Source-only grant', 1384, 315, 37, C.cyan);
      for (const [i, name] of paths.entries()) {
        const y = 419 + i * 101;
        const path = '/workspace/' + name;
        const allowed = helperAllows(path);
        label(name, 134, y, 39, C.ink, 'mono');
        if (showAnswers) label(allowed ? 'Allow' : 'Deny', 963, y, 39, allowed ? C.green : C.pink);
        if (state.beat === 0 && stdout)
          label(name === '.git/config' ? 'No' : 'Yes', 1384, y, 36, C.muted);
        if (state.beat === 1 && scope) {
          const writable = canWrite(path);
          label(writable ? 'Allow' : 'Deny', 1384, y, 39, writable ? C.green : C.pink);
        }
      }
    });
    const changing = state.beat === 1 && cueProgress(state, 'helper-use', 1, 0.57, 0.7) > 0;
    api.focus.target('helper-clock', () => {
      if (changing) {
        label('Check the link', 134, 965, 37, C.blue);
        api.arrow(ctx, 462, 951, 703, 951, C.muted, 3);
        label('A directory entry can change', 759, 965, 37, C.yellow);
        api.arrow(ctx, 1290, 951, 1434, 951, C.muted, 3);
        label('Open the file', 1480, 965, 37, C.blue);
      } else {
        label(
          state.beat === 0
            ? 'Path decisions in one temporary directory'
            : 'Compare the exact filename with the permitted subtree.',
          134,
          965,
          36,
          C.muted,
        );
      }
    });
  },
};
