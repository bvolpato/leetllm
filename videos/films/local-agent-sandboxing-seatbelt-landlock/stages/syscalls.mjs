import { cueComplete, cueProgress } from '../construction.mjs';
import { resolveFixture, syscallAllowed } from '../model.mjs';

const readGrant = '/workspace/src';
const reads = ['src/report.txt', 'private/note.txt'].map((name) => {
  const resolved = resolveFixture('/workspace/' + name, {}).actual;
  return {
    name,
    syscallPasses: syscallAllowed('openat'),
    resourcePasses: resolved.startsWith(readGrant + '/'),
  };
});

export default {
  id: 'syscalls',
  cues: ['calls-filter', 'calls-open', 'calls-predict', 'calls-file', 'calls-deny'],
  draw(ctx, scene, state, api) {
    const { C } = api;
    const label = (s, x, y, size, color = C.ink) => api.text(ctx, s, x, y, size, color);
    const filter = cueProgress(state, 'calls-filter', 0, 0.26, 0.44);
    const passed = cueProgress(state, 'calls-open', 0, 0.55, 0.68);
    const filesystem = cueProgress(state, 'calls-file', 1, 0.02, 0.19);
    const finish = cueProgress(state, 'calls-deny', 1, 0.36, 0.56);
    const result = cueComplete(state, 'calls-deny', 1, 0.56);
    const nextX = 703 + filter * 152 + passed * 251 + filesystem * 287 + finish * 167;
    label('Request', 128, 337, 37, C.muted);
    api.focus.target('call-gate', () => {
      label('Seccomp', 783, 337, 42, C.blue);
      api.line(ctx, 855, 380, 855, 781, C.blue, 4);
      label(
        filter > 0 ? 'Filename argument = address' : 'Call number + arguments',
        561,
        865,
        33,
        C.blue,
      );
    });
    api.focus.target('file-gate', () => {
      label('Filesystem policy', 1270, 337, 42, C.yellow);
      api.line(ctx, 1393, 380, 1393, 781, C.yellow, 4);
      label('Read grant: src/', 1270, 865, 33, C.yellow);
    });
    api.focus.target('read-requests', () => {
      for (const [i, file] of reads.entries()) {
        const y = 475 + i * 210;
        label('openat', 128, y, 42);
        label(file.name, 128, y + 53, 38, C.muted);
        api.line(ctx, 598, y - 12, 1560, y - 12, C.muted, 3);
        const stop = !file.syscallPasses ? 855 : file.resourcePasses ? 1560 : 1393;
        const x = Math.min(stop, nextX);
        api.circle(
          ctx,
          x,
          y - 12,
          15,
          result ? (file.resourcePasses ? C.green : C.pink) : C.cyan,
          C.bg,
          3,
        );
      }
    });
    if (result)
      api.focus.target('file-gate', () => {
        for (const [i, file] of reads.entries()) {
          const permitted = file.syscallPasses && file.resourcePasses;
          const status = permitted ? 'Read allowed' : 'Read denied';
          label(status, 1489, 531 + i * 210, 35, permitted ? C.green : C.pink);
        }
      });
  },
};
