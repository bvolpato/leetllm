import { featureFrame } from '../model.mjs';

const offline = { runner_pool: 'a100-pool', queue_backlog: 18, priority_job: 0 };
const stale = { ...offline, queue_backlog: 0 };
const missingPriority = { runner_pool: 'a100-pool', queue_backlog: 18 };
const fmt = (value) => (value === undefined ? 'absent' : String(value));

export function drawParity(ctx, scene, state, api) {
  const { C } = api;
  const f = featureFrame(state);
  const sample = f.started('parity-missing', 2) ? 2 : f.started('parity-stale', 1) ? 1 : 0;
  const online = [offline, stale, missingPriority][sample];
  const keys = [...new Set([...Object.keys(offline), ...Object.keys(online)])];
  const differences = keys.filter((key) => offline[key] !== online[key]);
  const t = (s, x, y, size, color = C.ink, align = 'center') =>
    api.text(ctx, s, x, y, size, color, align);
  api.focus.target('parity-table', () => {
    t('J-204   /   09:00   /   same preprocessing version', 150, 251, 34, C.muted, 'left');
    t('Offline replay', 967, 366, 37, C.cyan);
    t('Serving sample ' + (sample + 1), 1493, 366, 37);
    keys.forEach((key, i) => {
      const y = 470 + i * 135;
      const same = !differences.includes(key);
      api.line(ctx, 150, y - 52, 1760, y - 52, C.panel, 3);
      api.text(ctx, key, 180, y + 22, 39, C.ink, 'left', 'mono');
      t(fmt(offline[key]), 967, y + 22, 52, C.cyan);
      t(same ? '=' : '≠', 1228, y + 22, 52, same ? C.muted : C.pink);
      t(fmt(online[key]), 1493, y + 22, 52, same ? C.ink : C.pink);
    });
    t(
      differences.length
        ? 'Parity failed on ' + differences[0].replaceAll('_', ' ')
        : 'All three fields match',
      960,
      941,
      46,
      differences.length ? C.pink : C.green,
    );
  });
}

export default {
  id: 'parity',
  draw: drawParity,
  cues: ['parity-match', 'parity-stale', 'parity-missing'],
};
