import { cueComplete, cueProgress } from '../construction.mjs';
import { freshSandboxDecision } from '../model.mjs';

export default {
  id: 'fresh-boundary',
  cues: [
    'fresh-boundary-step-1',
    'fresh-path-follow',
    'fresh-path-resolve',
    'fresh-path-deny',
    'fresh-task-write',
    'fresh-worker-exit',
    'fresh-host-open',
    'fresh-boundary-step-2',
    'fresh-host-reveal',
  ],
  draw(ctx, scene, state, api) {
    const { C } = api;
    const label = (s, x, y, size, color = C.ink, font = 'sans') =>
      api.text(ctx, s, x, y, size, color, 'left', font);
    const file = freshSandboxDecision();
    const followed = cueProgress(state, 'fresh-path-follow', 1, 0.05, 0.28);
    const resolved = cueComplete(state, 'fresh-path-resolve', 1, 0.55);
    const denied = cueComplete(state, 'fresh-path-deny', 1, 0.76);
    const written = cueProgress(state, 'fresh-task-write', 2, 0.2, 0.4);
    const exit = cueProgress(state, 'fresh-worker-exit', 2, 0.4, 0.52);
    const open = cueProgress(state, 'fresh-host-open', 2, 0.57, 0.76);
    const owner = cueComplete(state, 'fresh-host-reveal', 3, 0.4);
    api.focus.target('fresh-path', () => {
      label('Write grant: src/', 130, 252, 36, C.blue);
      label('src/build-cache/config', 130, 346, 52, C.ink, 'mono');
      api.line(ctx, 261, 369, 607, 369, C.cyan, 4);
      label('link to .git/', 265, 418, 33, C.cyan);
      if (followed > 0) api.arrow(ctx, 888, 322, 888 + 125 * followed, 322, C.cyan, 3);
      label(
        resolved ? file.actual.slice('/workspace/'.length) : 'Which file?',
        1060,
        346,
        55,
        resolved ? C.ink : C.yellow,
        resolved ? 'mono' : 'sans',
      );
    });
    api.focus.target('fresh-path-outcome', () =>
      label(
        denied && !file.allowed
          ? 'DENY · resolved resource is metadata'
          : 'Would the grant allow the write?',
        1060,
        425,
        35,
        denied ? C.pink : C.yellow,
      ),
    );
    if (state.beat >= 2 || written > 0) {
      api.line(ctx, 130, 505, 1780, 505, C.muted, 2);
      api.focus.target('fresh-task', () => {
        label('Different checkout: project-wide write grant', 130, 595, 37, C.blue);
        label(exit >= 1 ? 'Worker exited' : 'Worker', 130, 710, 44, exit >= 1 ? C.muted : C.blue);
        label(
          open >= 1 ? 'Editor approved task' : 'Host editor',
          1250,
          710,
          41,
          open >= 1 ? C.cyan : C.muted,
        );
        const fileLeft = 590,
          fileRight = 1100;
        api.rect(
          ctx,
          fileLeft,
          648,
          fileRight - fileLeft,
          105,
          C.panel,
          written > 0 ? C.yellow : C.muted,
          8,
        );
        label(
          written > 0 ? 'Saved format task' : 'Folder-open task',
          fileLeft + 39,
          715,
          41,
          written > 0 ? C.yellow : C.muted,
        );
        if (written > 0) api.arrow(ctx, 452, 698, 452 + 115 * written, 698, C.blue, 3);
        if (open > 0)
          api.arrow(ctx, fileRight + 21, 698, fileRight + 21 + 100 * open, 698, C.cyan, 3);
      });
      api.focus.target('fresh-host-outcome', () =>
        label(
          owner ? 'Execution authority: HOST' : 'Whose authority will the formatter have?',
          130,
          908,
          47,
          owner ? C.cyan : C.yellow,
        ),
      );
    } else {
      label('Policy fixture', 130, 632, 31, C.muted);
      label('Only the final file can settle this write.', 130, 727, 47, C.ink);
    }
  },
};
