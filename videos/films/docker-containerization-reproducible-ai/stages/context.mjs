import { PROJECT_FILES } from '../fixtures.mjs';
import { cueProgress } from '../construction.mjs';
import { codeText, focusTarget, line, text } from '../defaults.mjs';

export function drawContext(ctx, scene, state, api) {
  const { C } = api;
  const ignored = cueProgress(state, 'context-ignore', 1);
  const copying = cueProgress(state, 'context-copy', 2);
  const stageCopy = cueProgress(state, 'context-stage-copy', 2);
  const rules = { '.env': '.env*', '.venv/': '.venv/', 'models/example.bin': 'models/' };

  codeText(ctx, api, 'Project directory', 125, 290, 38, C.ink);
  text(ctx, api, 'Eligible build context', 1050, 290, 38, C.blue);
  codeText(ctx, api, 'Copy destination', 1440, 290, 38, C.cyan);
  focusTarget(ctx, api, 'project-files', () => {
    PROJECT_FILES.forEach((file, i) => {
      const y = 391 + i * 80;
      const excluded = !file.keep && ignored > 0;
      codeText(ctx, api, file.path, 125, y, 31, excluded ? C.muted : C.ink, 'left', 'mono');
      const eligible = !excluded;
      const trace = () => {
        line(ctx, api, 730, y - 10, 940, y - 10, excluded ? C.muted : C.blue);
        if (excluded) {
          line(ctx, api, 940, y - 27, 940, y + 7, C.pink, 5);
          codeText(ctx, api, rules[file.path], 980, y, 29, C.pink, 'left', 'mono');
        } else {
          api.circle(ctx, 1050, y - 10, 11, C.blue);
        }
        if (file.copy && copying > 0) {
          const p = Math.max(0, Math.min(1, copying * 3 - (i - 1)));
          if (p > 0) line(ctx, api, 1080, y - 10, 1080 + 316 * p, y - 10, C.cyan, 4);
          if (p === 1)
            codeText(
              ctx,
              api,
              file.path === 'requirements.txt' ? 'builder' : 'runtime',
              1440,
              y,
              33,
              C.cyan,
            );
        }
      };
      focusTarget(
        ctx,
        api,
        eligible && file.copy ? 'copy-inputs' : !file.keep ? 'ignored-paths' : 'recipe',
        trace,
      );
    });
  });
  if (state.beat < 2)
    focusTarget(ctx, api, 'dockerignore-rules', () =>
      codeText(
        ctx,
        api,
        ignored > 0 ? 'With .dockerignore' : 'Before applying .dockerignore',
        125,
        1010,
        31,
        C.muted,
      ),
    );
  if (state.beat === 2)
    focusTarget(ctx, api, 'builder-copy', () => {
      if (stageCopy === 0 && state.cues?.['context-stage-copy']?.phase === 'before') return;
      line(ctx, api, 125, 926, 1776, 926, C.muted);
      codeText(ctx, api, 'COPY --from=builder', 125, 1002, 32, C.blue, 'left', 'mono');
      codeText(ctx, api, '/opt/venv in builder', 680, 1002, 30);
      if (stageCopy > 0) api.arrow(ctx, 1050, 990, 1050 + 335 * stageCopy, 990, C.cyan, 4);
      if (stageCopy === 1) codeText(ctx, api, '/opt/venv in runtime', 1420, 1002, 30, C.cyan);
    });
}

export default {
  id: 'context',
  draw: drawContext,
  cues: ['context-files', 'context-ignore', 'context-copy', 'context-stage-copy'],
};
