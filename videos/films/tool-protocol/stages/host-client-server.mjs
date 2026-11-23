import { filmPainter } from '../defaults.mjs';
import { statusPayload } from '../fixtures.mjs';

function drawHostClientServer(ctx, scene, state, api) {
  const { C } = api;
  const { label, line, dot, target, started, finished, progress } = filmPainter(ctx, api);
  const rows = [385, 575, 765];
  const boundary = 835;
  label('Incident assistant', 145, 250, 37, C.blue, 'left');
  label('Host dispatch', boundary, 250, 32, C.yellow);
  label('Servers', 1510, 250, 37, C.cyan, 'left');
  line(boundary, 294, boundary, 848, C.yellow, 3);
  target('client-names', () => {
    ['Status client', 'Policy client', 'Traffic client'].forEach((name, i) =>
      label(name, 145, rows[i] - 40, 35, C.ink, 'left'),
    );
  });
  ['Deployments', 'Policy', 'Rollouts'].forEach((name, i) => {
    const y = rows[i];
    line(445, y, 1420, y, C.muted, 2);
    dot(1420, y, C.cyan, 9);
    label(name, 1490, y + 12, 36, C.cyan, 'left');
  });
  if (state.beat === 0) return;

  target('read-request', () => {
    label('Read v17', 145, rows[0] + 20, 42, C.blue, 'left');
    if (started('host-read-grant')) label('Read permitted', 460, rows[0] - 28, 31, C.blue, 'left');
    const motion = progress('host-send');
    dot(480 + motion * 940, rows[0], C.blue, 13);
  });
  target('read-reply', () => {
    if (started('host-return')) {
      dot(1420 - progress('host-return') * 940, rows[0] + 29, C.green, 10);
      if (finished('host-return'))
        label(statusPayload.status, 940, rows[0] - 28, 35, C.green, 'left');
    }
  });
  target('policy-receipt', () => {
    label('Clearance lookup', 145, rows[1] + 18, 34, C.ink, 'left');
    if (started('host-timeout')) label('Timed out', 940, rows[1] - 28, 35, C.yellow, 'left');
  });
  target('write-request', () => {
    label('Shift traffic', 145, rows[2] + 20, 42, C.blue, 'left');
    if (started('host-needs-policy'))
      label('Needs policy', 460, rows[2] - 28, 31, C.yellow, 'left');
    dot(480 + 320 * progress('host-hold'), rows[2], C.yellow, 13);
    if (finished('host-hold'))
      label('0 write requests sent', 940, rows[2] - 28, 34, C.yellow, 'left');
  });
  if (state.beat === 1 && finished('host-timeout'))
    label('Which proposal can the host send?', 960, 920, 40, C.ink);
}

export default {
  id: 'host-client-server',
  draw: drawHostClientServer,
  cues: [
    'host-clients',
    'host-read-grant',
    'host-needs-policy',
    'host-timeout',
    'host-send',
    'host-return',
    'host-hold',
  ],
};
