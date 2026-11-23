import { line, readoutCell, taskHeader, text } from '../defaults.mjs';
export function drawSessionAdmission(ctx, scene, state, api) {
  const currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0),
    { C: themeColors } = api,
    q = (i, a = 0.1, z = 0.85) =>
      currentBeat < i ? 0 : currentBeat > i ? 1 : api.phase(progress, a, z);
  const body = () => {
    taskHeader(ctx, api);
    if (currentBeat === 0) {
      const admitted = q(0) > 0.55;
      text(
        ctx,
        api,
        'Session admission happens before the first screenshot',
        960,
        365,
        36,
        themeColors.yellow,
        'center',
      );
      [
        ['profile', 'fresh task profile'],
        ['scope', 'CI domain + required app'],
        ['credentials', 'read-only service role'],
        ['budget', 'bounded time / steps / storage'],
      ].forEach(([k, v], i) => {
        text(ctx, api, k, 180, 465 + i * 125, 31, themeColors.muted);
        readoutCell(ctx, api, v, 700, 420 + i * 125, 1000, themeColors.blue, 95);
      });
      text(
        ctx,
        api,
        admitted
          ? 'Reused profile / mail domain / deploy capability → REJECT'
          : 'Inspect proposed session capabilities',
        960,
        1030,
        32,
        admitted ? themeColors.pink : themeColors.yellow,
        'center',
      );
    } else if (currentBeat === 1) {
      readoutCell(ctx, api, 'host credential broker', 170, 390, 660, themeColors.yellow, 160);
      readoutCell(ctx, api, 'model: task + resulting page', 1090, 390, 660, themeColors.blue, 160);
      line(ctx, api, 860, 470, 1060, 470, themeColors.muted, 3);
      text(
        ctx,
        api,
        'password/token remain host-owned',
        500,
        650,
        34,
        themeColors.yellow,
        'center',
      );
      text(
        ctx,
        api,
        'No home cookies, control sockets or unrelated files',
        960,
        805,
        34,
        themeColors.pink,
        'center',
      );
      text(
        ctx,
        api,
        'Clipboard and permitted pages can still become data paths',
        960,
        990,
        32,
        themeColors.pink,
        'center',
      );
    } else if (currentBeat === 2) {
      readoutCell(ctx, api, 'worker browser', 170, 410, 660, themeColors.blue, 170);
      readoutCell(ctx, api, 'host network policy', 1090, 410, 660, themeColors.yellow, 170);
      text(
        ctx,
        api,
        'scheme · port · redirect · address family',
        1420,
        700,
        30,
        themeColors.yellow,
        'center',
      );
      text(
        ctx,
        api,
        'gVisor: application-kernel sandbox',
        500,
        840,
        30,
        themeColors.cyan,
        'center',
      );
      text(ctx, api, 'Firecracker: KVM microVM', 1420, 840, 32, themeColors.cyan, 'center');
      text(
        ctx,
        api,
        'Enforce outside worker control; verify teardown and retained state',
        960,
        1020,
        32,
        themeColors.green,
        'center',
      );
    } else {
      const n = Math.max(1, Math.ceil(q(3) * 4));
      [
        ['proposal', 'expand failure / frame8'],
        ['host decision', 'allow bounded read'],
        ['observation reference', 'session9 / redacted frame8'],
        ['verifier outcome', 'local draft pending'],
      ]
        .slice(0, n)
        .forEach(([k, v], i) => {
          const y = 400 + i * 145;
          text(ctx, api, k, 180, y + 45, 31, themeColors.muted);
          readoutCell(ctx, api, v, 760, y, 980, themeColors.blue, 95);
        });
      text(
        ctx,
        api,
        'Allowlisted schema + redacted values + retention limit + operator stop',
        960,
        1020,
        30,
        themeColors.yellow,
        'center',
      );
    }
  };
  api.focus.target('session-admission-construction', body);
}
export default {
  id: 'session-admission',
  draw: drawSessionAdmission,
  cues: [
    'session-admission-construct-0',
    'session-admission-construct-1',
    'session-admission-construct-2',
    'session-admission-construct-3',
  ],
};
