import { codeText, focusTarget, line, note, rectangle, text } from '../defaults.mjs';
import { FIXTURE } from '../fixtures.mjs';
import { mountState } from '../model.mjs';

export function drawMounts(ctx, scene, state, api) {
  const { C } = api;
  const view = mountState(state);
  const { switchPosition } = view;
  const attached = switchPosition === 1;
  const failed = view.errorVisible;
  const fallback = state.cues?.['mount-fallback']?.phase === 'after' && attached;
  const returned = state.cues?.['mount-restore']?.phase === 'after';
  const startY = 462;
  const hostY = 733;
  const sourceY = startY + (hostY - startY) * switchPosition;
  const color = attached ? C.cyan : switchPosition === 0 ? C.blue : C.yellow;

  focusTarget(ctx, api, 'baked-directory', () => {
    rectangle(ctx, api, 125, 322, 745, 219, C.panel, C.blue);
    codeText(ctx, api, 'Image I1', 162, 385, 36, C.blue);
    codeText(ctx, api, '/app/eval/access_requests.jsonl', 162, 452, 32, C.ink, 'left', 'mono');
    codeText(
      ctx,
      api,
      FIXTURE.map((row) => row.id).join('     '),
      162,
      507,
      27,
      C.muted,
      'left',
      'mono',
    );
  });
  focusTarget(ctx, api, 'host-directory', () => {
    rectangle(ctx, api, 125, 600, 745, 219, C.panel, C.cyan);
    codeText(ctx, api, 'Host directory', 162, 663, 36, C.cyan);
    codeText(ctx, api, '.docker-lab/empty-eval/', 162, 730, 32, C.ink, 'left', 'mono');
    codeText(ctx, api, '0 files', 162, 785, 27, C.muted);
  });
  focusTarget(ctx, api, 'mount-path', () => {
    rectangle(ctx, api, 1230, 343, 563, 474, C.panel, C.muted);
    codeText(ctx, api, 'Scorer', 1270, 419, 44);
    codeText(ctx, api, 'open from /app', 1270, 493, 30, C.muted);
    codeText(ctx, api, 'eval/access_requests.jsonl', 1270, 554, 29, C.ink, 'left', 'mono');
    if (fallback) {
      codeText(ctx, api, 'Next lookup', 1270, 656, 29, C.muted);
      codeText(ctx, api, 'assets/access_requests.jsonl', 1270, 722, 28, C.ink, 'left', 'mono');
    }
    // The endpoints stay attached to the two directories. The selector follows the mount.
    for (const y of [startY, hostY]) {
      line(ctx, api, 888, y, 972, y, C.muted);
      api.circle(ctx, 979, y, 8, C.muted);
    }
    line(ctx, api, 985, sourceY, 1130, 545, color, 5);
    line(ctx, api, 1130, 545, 1212, 545, color, 5);
    api.circle(ctx, 979, sourceY, 11, color);
    api.circle(ctx, 1130, 545, 9, color);
    if (attached) text(ctx, api, 'bind · readonly', 1049, 813, 27, C.cyan);
  });
  focusTarget(ctx, api, 'mount-result', () =>
    focusTarget(ctx, api, 'restored-result', () => {
      if (failed || state.cues?.['mount-failure']?.phase === 'during') {
        codeText(ctx, api, 'Standard error', 145, 862, 30, C.muted);
        if (failed) codeText(ctx, api, view.error, 145, 920, 30, C.pink, 'left', 'mono');
        if (state.cues?.['mount-exit']?.phase === 'after')
          codeText(ctx, api, 'exit ' + view.exitCode, 1590, 920, 33, C.pink, 'left', 'mono');
      } else if (returned) {
        text(
          ctx,
          api,
          'Same I1 · ' +
            view.report.fraction.toFixed(3) +
            ' (' +
            view.report.matches +
            '/' +
            view.report.total +
            ') · exit ' +
            view.exitCode,
          960,
          920,
          40,
          C.green,
        );
      } else if (state.beat === 0 || state.beat === 3) {
        text(
          ctx,
          api,
          state.beat === 0 ? 'Next run: bind the empty directory at /app/eval' : 'Run without a bind',
          960,
          920,
          33,
          C.muted,
        );
      }
    }),
  );
  if (state.beat === 0)
    note(ctx, api, 'Keep Image I1 fixed and follow /app/eval into the next run');
}

export default {
  id: 'mounts',
  draw: drawMounts,
  cues: [
    'mount-prediction',
    'mount-overlay',
    'mount-fallback',
    'mount-failure',
    'mount-exit',
    'mount-detach',
    'mount-restore',
  ],
};
