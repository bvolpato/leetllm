import { codeText, focusTarget, line, rectangle } from '../defaults.mjs';

export function drawMountDiagnostics(ctx, scene, state, api) {
  const { C } = api;
  const cue = (id) => state.cues?.['dk-mount-diagnostics-' + id];
  const after = (id) => cue(id)?.phase === 'after';
  const created = after('created');
  const trials = [
    { flag: '--mount', directory: 'absent', attached: false, done: after('absent') },
    { flag: '-v', directory: 'absent', attached: created, done: after('empty') },
    {
      flag: '--mount',
      directory: 'exists · empty',
      attached: after('beat2'),
      done: after('again'),
    },
  ];

  codeText(ctx, api, 'Directory on the Docker Engine host', 140, 275, 38);
  focusTarget(ctx, api, 'mount-host-path', () => {
    rectangle(ctx, api, 140, 314, 1635, 111, C.panel, created ? C.cyan : C.muted);
    codeText(ctx, api, '/srv/lab/scratch/', 171, 385, 42, C.ink, 'left', 'mono');
    if (created) {
      api.path(
        ctx,
        [
          { x: 995, y: 394 },
          { x: 995, y: 343 },
          { x: 1027, y: 343 },
          { x: 1036, y: 353 },
          { x: 1079, y: 353 },
          { x: 1079, y: 394 },
          { x: 995, y: 394 },
        ],
        { color: C.cyan, width: 4 },
      );
    }
    codeText(
      ctx,
      api,
      created ? 'empty directory' : 'directory absent',
      1110,
      382,
      39,
      created ? C.cyan : C.muted,
    );
  });

  const columns = [155, 540, 948, 1420];
  ['Run option', 'Source at start', 'Docker Engine', 'Python'].forEach((s, i) =>
    codeText(ctx, api, s, columns[i], 511, 31, C.muted),
  );
  const count = state.beat === 0 ? 1 : state.beat === 1 && !after('retained') ? 2 : 3;
  trials.slice(0, count).forEach((trial, i) => {
    const y = 601 + 115 * i;
    line(ctx, api, 140, y + 31, 1775, y + 31, C.muted);
    focusTarget(ctx, api, 'mount-trial-' + (i + 1), () => {
      codeText(ctx, api, '--rm ' + trial.flag, columns[0], y, 36, C.ink, 'left', 'mono');
      codeText(ctx, api, trial.directory, columns[1], y, 35);
      if (trial.attached || trial.done)
        codeText(
          ctx,
          api,
          trial.attached ? 'mount attached' : 'source missing',
          columns[2],
          y,
          35,
          trial.attached ? C.blue : C.pink,
        );
      if (trial.done)
        codeText(
          ctx,
          api,
          trial.attached ? 'file missing' : 'never started',
          columns[3],
          y,
          35,
          trial.attached ? C.pink : C.muted,
        );
    });
  });

  if (state.beat === 1 && cue('cleanup') && cue('cleanup').phase !== 'before')
    focusTarget(ctx, api, 'mount-cleanup', () =>
      codeText(
        ctx,
        api,
        after('cleanup') ? 'Container from run 2: removed' : 'Container from run 2',
        144,
        979,
        34,
        C.muted,
      ),
    );
  if (state.beat === 2 && cue('restore') && cue('restore').phase !== 'before')
    focusTarget(ctx, api, 'mount-restore-result', () =>
      codeText(
        ctx,
        api,
        after('restore') ? 'Next run without bind → reads the image copy' : 'Next run without bind',
        144,
        979,
        34,
        C.blue,
      ),
    );
}

export default {
  id: 'mount-diagnostics',
  draw: drawMountDiagnostics,
  cues: [
    'dk-mount-diagnostics-beat0',
    'dk-mount-diagnostics-absent',
    'dk-mount-diagnostics-empty',
    'dk-mount-diagnostics-beat1',
    'dk-mount-diagnostics-created',
    'dk-mount-diagnostics-cleanup',
    'dk-mount-diagnostics-retained',
    'dk-mount-diagnostics-beat2',
    'dk-mount-diagnostics-again',
    'dk-mount-diagnostics-restore',
  ],
};
