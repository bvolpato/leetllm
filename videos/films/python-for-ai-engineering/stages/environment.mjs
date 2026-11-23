import { cueProgress } from '../construction.mjs';
import { examples } from '../fixtures.mjs';
import { code, footer, mark, rail, text } from '../defaults.mjs';
export function drawEnvironment(ctx, scene, state, api) {
  if ((state.beat ?? 0) === 1) {
    const opened = cueProgress(state, 'open-fixture', 1, 0.3, 0.8);
    mark(api, 'uv-command', () =>
      code(ctx, api, ['$ uv run scripts/score_access_requests.py'], 200, 300, 35, 60),
    );
    mark(api, 'project-inputs', () =>
      text(ctx, api, 'Working copy of the Docker lab fixture', 200, 375, 29, api.C.muted),
    );
    mark(api, 'fixture-path', () => {
      rail(ctx, api, 200, 440, 1510, 'Path("eval/access_requests.jsonl")', api.C.blue, 90, 36);
      const lines = examples.map((row, i) =>
        (101 + i) + '  ' + JSON.stringify(row.expected) + ' / ' + JSON.stringify(row.prediction),
      );
      lines.forEach((v, i) =>
        text(ctx, api, v, 230, 640 + i * 100, 33, i === 1 ? api.C.cyan : api.C.muted, 'left', true),
      );
      text(ctx, api, 'UTF-8 open handle', 1430, 625, 34, api.C.cyan, 'center');
      const row = Math.min(2, Math.floor(opened * 3));
      text(ctx, api, '▶', 1080, 640 + row * 100, 43, api.C.yellow);
      rail(
        ctx,
        api,
        1190,
        700,
        500,
        opened === 1 ? 'one complete JSON line' : 'read next physical line',
        api.C.cyan,
        95,
        27,
      );
    });
    footer(ctx, api, 'Selected fields from each line: expected / prediction');
    return;
  }
  const project = cueProgress(state, 'project-declare', 0, 0.46, 0.54);
  if (project === 0) {
    const spell = cueProgress(state, 'variant-spelling', 0, 0.18, 0.36);
    const row = examples[1];
    mark(api, 'working-copy', () => {
      text(ctx, api, row.prompt, 200, 333, 51, api.C.ink);
      text(ctx, api, 'Docker lab file', 200, 520, 36, api.C.muted);
      text(ctx, api, 'Working copy', 1010, 520, 36, api.C.muted);
      rail(ctx, api, 200, 572, 655, '"escalated"', api.C.blue, 140, 54);
      rail(ctx, api, 1010, 572, 655, spell > 0 ? JSON.stringify(row.prediction) : '…', api.C.cyan, 140, 54);
      text(ctx, api, 'Expected in both files: ' + JSON.stringify(row.expected), 200, 855, 37, api.C.ink);
    });
    return;
  }
  const sync = cueProgress(state, 'sync-project', 0, 0.72, 0.87);
  mark(api, 'project-inputs', () => {
    text(ctx, api, 'pyproject.toml', 175, 315, 30, api.C.cyan);
    code(
      ctx,
      api,
      ['[project]', 'name = "access-eval"', 'version = "0.1.0"', 'requires-python = ">=3.12"'],
      175,
      385,
      30,
      60,
    );
    text(ctx, api, '.python-version   3.12', 175, 670, 32, api.C.blue, 'left', true);
  });
  mark(api, 'uv-command', () => {
    text(ctx, api, 'Project terminal', 1010, 315, 30, api.C.green);
    code(
      ctx,
      api,
      [
        '$ uv sync',
        ...(sync === 1
          ? ['.venv/ created · uv.lock written', '$ uv run python --version', 'Python 3.12.x']
          : ['environment pending']),
      ],
      1010,
      385,
      29,
      60,
      0,
    );
    text(ctx, api, 'Portable: project + pin + lock', 1010, 670, 28, api.C.muted);
    text(ctx, api, 'Local installation: .venv/', 1010, 720, 28, api.C.muted);
  });
}
export default {
  id: 'environment',
  draw: drawEnvironment,
  cues: ['variant-spelling', 'project-declare', 'sync-project', 'open-fixture'],
};
