import { codeText, focusTarget, line, rectangle } from '../defaults.mjs';
import { cueProgress } from '../construction.mjs';
import { FIXTURE } from '../fixtures.mjs';
import { reportLines, score } from '../model.mjs';

const script = 'scripts/score_access_requests.py';
const firstOutput = reportLines(score(FIXTURE))[0];

function shellError(ctx, api, state) {
  const { C } = api;
  rectangle(ctx, api, 120, 275, 1680, 553, C.panel, C.border);
  codeText(ctx, api, 'bash   ~/access-rag', 187, 357, 36, C.muted, 'left', 'mono');
  line(ctx, api, 120, 396, 1800, 396, C.border);
  focusTarget(ctx, api, 'opening-command', () => {
    codeText(ctx, api, '$ python', 187, 516, 57, C.pink, 'left', 'mono');
    const underline = Math.min(1, state.t / 0.35);
    line(ctx, api, 256, 540, 256 + 202 * underline, 540, C.pink, 6);
  });
  codeText(ctx, api, script, 501, 516, 57, C.ink, 'left', 'mono');
  codeText(ctx, api, 'bash: python: command not found', 187, 662, 76, C.pink, 'left', 'mono');
  codeText(ctx, api, '$', 187, 768, 49, C.muted, 'left', 'mono');
  api.rect(ctx, 245, 731, 24, 41, C.muted, null, 0, 0);
}

function layer(ctx, api, x, y, value, color, size) {
  const width = 875,
    height = 92,
    depth = 31;
  api.path(
    ctx,
    [
      { x, y },
      { x: x + depth, y: y - depth },
      { x: x + width + depth, y: y - depth },
      { x: x + width, y },
    ],
    { closed: true, color, fill: api.C.panel, width: 3 },
  );
  api.path(
    ctx,
    [
      { x: x + width, y },
      { x: x + width + depth, y: y - depth },
      { x: x + width + depth, y: y + height - depth },
      { x: x + width, y: y + height },
    ],
    { closed: true, color, fill: api.C.panel, width: 3 },
  );
  api.rect(ctx, x, y, width, height, api.C.panel, color, 3);
  codeText(ctx, api, value, x + 38, y + 62, size, color, 'left', 'mono');
}

export function drawOpening(ctx, scene, state, api) {
  if (state.beat === 0) return shellError(ctx, api, state);

  const { C } = api;
  const copyScript = cueProgress(state, 'opening-script', 1);
  const copyData = cueProgress(state, 'opening-data', 1);
  const run = cueProgress(state, 'opening-run', 2);
  // The base tag begins where Bash printed the missing interpreter's name.
  const x = 422 - 295 * run;
  const baseY = 600 + 64 * copyScript + 50 * copyData;
  focusTarget(ctx, api, 'opening-python', () =>
    layer(ctx, api, x, baseY, 'python:3.12-slim-trixie', C.cyan, 53),
  );
  if (copyScript > 0)
    focusTarget(ctx, api, 'opening-script', () =>
      layer(ctx, api, x, baseY - 126 - 40 * (1 - copyScript), script, C.blue, 39),
    );
  if (copyData > 0)
    focusTarget(ctx, api, 'opening-data', () =>
      layer(
        ctx,
        api,
        x,
        baseY - 252 - 40 * (1 - copyData),
        'eval/access_requests.jsonl',
        C.blue,
        39,
      ),
    );
  if (copyData === 1) {
    codeText(ctx, api, 'Docker image', x, baseY + 173, 32, C.muted);
    codeText(ctx, api, 'access-rag:local', x + 228, baseY + 173, 37, C.ink, 'left', 'mono');
  }

  if (state.beat < 2) return;
  focusTarget(ctx, api, 'opening-run', () =>
    codeText(ctx, api, '$ docker run --rm access-rag:local', 1080, 341, 36, C.blue, 'left', 'mono'),
  );
  if (run < 1) return;
  line(ctx, api, 1080, 379, 1825, 379, C.border);
  codeText(ctx, api, 'Container entrypoint', 1080, 474, 37, C.muted);
  focusTarget(ctx, api, 'opening-entrypoint', () => {
    codeText(ctx, api, 'python', 1080, 565, 68, C.cyan, 'left', 'mono');
    codeText(ctx, api, script, 1080, 631, 35, C.ink, 'left', 'mono');
  });
  focusTarget(ctx, api, 'opening-output', () => {
    codeText(ctx, api, 'Standard output', 1080, 758, 34, C.muted);
    if (state.cues?.['opening-output']?.phase === 'after')
      codeText(ctx, api, firstOutput, 1080, 862, 72, C.green, 'left', 'mono');
  });
}

export default {
  id: 'opening',
  draw: drawOpening,
  cues: [
    'opening-missing',
    'opening-base',
    'opening-script',
    'opening-data',
    'opening-run',
    'opening-entrypoint',
    'opening-output',
  ],
};
