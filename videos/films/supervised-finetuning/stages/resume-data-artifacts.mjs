import { text, upgradeBox } from '../defaults.mjs';

function draw(ctx, scene, state, api) {
  api.focus.target('resume-data-artifacts-mechanism', () => {
    const { C } = api;
    if (state.beat < 2) {
      const rows = [
        [
          'Serve the assistant',
          'Weights + architecture',
          'Tokenizer + template',
          'Adapter config + exact base',
        ],
        [
          'Continue training',
          'Optimizer + schedule',
          'Sampler + random state',
          'Step, recipe + manifests',
        ],
      ];
      rows.forEach((row, i) => {
        const cy = 350 + i * 314;
        text(ctx, api, row[0], 160, cy, 39, i ? C.yellow : C.blue);
        row
          .slice(1)
          .forEach((word, j) =>
            upgradeBox(ctx, api, word, 160 + 550 * j, cy + 52, 512, 100, i ? C.yellow : C.blue, 30),
          );
      });
      if (state.beat === 1)
        text(
          ctx,
          api,
          'Read and verify the saved contents. A filename checks only the manifest.',
          960,
          975,
          33,
          C.ink,
          'center',
        );
      return;
    }
    text(ctx, api, 'Interrupt just after an optimizer step', 960, 315, 41, C.ink, 'center');
    const xs = [710, 1140, 1580];
    ['Next batch + rate', 'Loss + gradient', 'Next weights'].forEach((v, j) =>
      text(ctx, api, v, xs[j], 441, 31, C.muted, 'center'),
    );
    ['Uninterrupted', 'Restored'].forEach((label, i) => {
      const y = 585 + 188 * i;
      text(ctx, api, label, 146, y + 13, 34, i ? C.yellow : C.blue);
      api.line(ctx, 480, y, 1730, y, C.muted, 3);
      xs.forEach((x) => api.circle(ctx, x, y, 11, i ? C.yellow : C.blue));
    });
    text(
      ctx,
      api,
      'Compare both runs at each point using the same numerical tolerance.',
      960,
      965,
      34,
      C.ink,
      'center',
    );
  });
}

export default {
  id: 'resume-data-artifacts',
  draw: draw,
  cues: ['resume-data-artifacts-b1', 'resume-data-artifacts-b2', 'resume-data-artifacts-b3'],
};
