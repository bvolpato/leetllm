import { sampleModel } from '../model.mjs';
import { fieldDrawing } from '../field-drawing.mjs';

export function drawUpdates(ctx, scene, state, api) {
  const p = fieldDrawing(ctx, api),
    { C, text, rect, line, dot, target } = p;
  const m = sampleModel('updates', state);
  text('Offline update   /   one running session', 155, 277, 35, C.muted);
  const left = [156, 1012],
    width = 744;
  ['A', 'B'].forEach((slot, i) => {
    const x = left[i],
      isActive = m.active === i + 1;
    const status = isActive
      ? 'active'
      : i === 0
        ? 'retained'
        : m.recovered
          ? 'failed health check'
          : 'staged';
    target(i === 0 ? 'updates-readout' : 'updates-readout-2', () => {
      rect(x, 341, width, 228, C.panel, isActive ? C.green : C.muted, 17);
      text('Storage slot ' + slot, x + 42, 399, 31, C.muted);
      text('version ' + (i + 1) + ' · ' + status, x + 42, 480, 42, isActive ? C.green : C.ink);
      const received = i === 0 ? 1 : m.bytes / m.expected;
      rect(x + 42, 516, width - 84, 19, C.bg, C.muted);
      rect(x + 43, 519, (width - 86) * received, 13, i === 0 ? C.blue : C.yellow);
    });
  });
  target('updates-readout-3', () => {
    const c = m.checked;
    const checks = [
      ['Signature', c.authenticated],
      ['Bytes / digest', c.length && c.digest],
      ['Version / expiry', c.version],
      ['Compatible', c.compatible],
    ];
    checks.forEach(([name, ok], i) => {
      const x = 972 + (i % 2) * 423,
        y = 649 + Math.floor(i / 2) * 67;
      dot(x, y - 10, 8, ok ? C.green : C.pink);
      text(name + '   ' + (ok ? 'pass' : 'fail'), x + 24, y, 29, ok ? C.ink : C.pink);
    });
  });
  target('updates-readout-4', () => {
    const x = left[m.active - 1] + 92;
    line(x, 569, x, 597, C.green, 4);
    line(x, 597, 690, 597, C.green, 4);
    line(690, 597, 690, 629, C.green, 4);
    text('Running session', 157, 672, 32, C.muted);
    text('active bundle ' + m.active + ' · fresh session ' + m.session, 157, 748, 39, C.green);
    text('B received ' + m.bytes + ' / ' + m.expected + ' bytes', 1012, 802, 32, C.yellow);
  });
  target('updates-readout-5', () => {
    const status = m.recovered
      ? 'Recovery complete   /   Next ticket opens with version 1.'
      : m.step === 2
        ? 'Health check failed   /   Version 2 needs recovery.'
        : m.active === 2
          ? 'Version 2 serves the next ticket in its own session.'
          : m.checked.accepted
            ? 'Candidate complete   /   Version 1 still serves.'
            : 'Four bytes missing   /   Version 1 still serves.';
    text(status, 960, 950, 40, m.step === 2 && !m.recovered ? C.pink : C.ink, 'center');
  });
}
export default {
  id: 'updates',
  draw: drawUpdates,
  cues: [
    'inactive-slot',
    'failed-integrity',
    'old-active',
    'verified-candidate',
    'fresh-session',
    'health-recovery',
    'recovery-session',
  ],
};
