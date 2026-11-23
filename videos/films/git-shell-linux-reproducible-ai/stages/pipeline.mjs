import { cueProgress } from '../construction.mjs';
import { mark, terminal, text } from '../defaults.mjs';
export function drawPipeline(ctx, scene, state, api) {
  const stream = cueProgress(state, 'pipe-stream', 0),
    status = cueProgress(state, 'last-status', 0, 0.65, 0.9),
    fixed = cueProgress(state, 'pipefail-result', 1),
    currentBeat = state.beat ?? 0;
  text(
    ctx,
    api,
    currentBeat ? '$ set -o pipefail' : '$ set +o pipefail',
    180,
    315,
    36,
    api.C.yellow,
    'left',
    true,
  );
  text(
    ctx,
    api,
    '$ grep \'"denied"\' eval/missing.jsonl | wc -l',
    180,
    390,
    35,
    api.C.ink,
    'left',
    true,
  );
  mark(api, 'pipe-processes', () => {
    terminal(
      ctx,
      api,
      'grep · upstream',
      ['stderr: missing file', 'stdout: empty', 'exit 2'],
      180,
      455,
      620,
      290,
      {
        color: api.C.pink,
        size: 35,
      },
    );
    terminal(
      ctx,
      api,
      'wc -l · downstream',
      stream === 1 ? ['empty input', 'stdout: 0', 'exit 0'] : ['waiting for input'],
      1120,
      455,
      620,
      290,
      {
        color: api.C.cyan,
        size: 35,
      },
    );
    api.line(ctx, 825, 600, 1095, 600, api.C.cyan, 3);
    text(ctx, api, 'stdout', 960, 565, 27, api.C.cyan, 'center');
    text(ctx, api, '0 lines', 960, 650, 27, api.C.muted, 'center');
  });
  mark(api, 'pipeline-status', () =>
    text(
      ctx,
      api,
      fixed === 1
        ? 'Pipeline status: 2 · upstream read error preserved'
        : currentBeat === 0 && status === 1
          ? 'Pipeline status: 0 · last command succeeded'
          : 'Pipeline status: pending',
      960,
      870,
      40,
      fixed === 1 ? api.C.pink : api.C.yellow,
      'center',
    ),
  );
}
export default {
  id: 'pipeline',
  draw: drawPipeline,
  cues: ['pipe-stream', 'last-status', 'pipefail-result'],
};
