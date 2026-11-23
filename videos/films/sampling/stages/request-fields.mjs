import { clamp, cueStep } from '../construction.mjs';

export function drawRequestFields(ctx, scene, state, api) {
  const { C } = api;
  const route = cueStep(state, 'sp-request-fields-0', 0, 0.22, 0.34);
  const tools = cueStep(state, 'request-tools', 0, 0.36, 0.59);
  const finish = cueStep(state, 'request-finish', 0, 0.65, 0.85);
  const support = cueStep(state, 'sp-request-fields-1', 1, 0.08, 0.54);
  const countSupport = cueStep(state, 'request-count-support', 1, 0.38, 0.47);
  const timeSupport = cueStep(state, 'request-time-support', 1, 0.48, 0.58);
  const x = (seconds) => 260 + 160 * seconds;
  const toolCount = Math.floor(3 * tools);
  const positions = [1.2, 3.7, 6.1];
  api.focus.target('sp-request-fields-visual', () => {
    api.text(ctx, 'R17', 156, 295, 46, C.yellow);
    api.text(ctx, '“Can I roll back this deploy?”', 335, 295, 46, C.ink);
    api.line(ctx, x(0), 515, x(8.4), 515, C.muted, 3);
    api.circle(ctx, x(0), 515, 14, C.cyan);
    api.text(ctx, 'received', x(0), 595, 33, C.muted, 'center');
    positions.forEach((time, i) => {
      if (clamp(tools * 3 - i) === 0) return;
      api.line(ctx, x(time), 515, x(time), 453, C.blue, 4);
      api.circle(ctx, x(time), 453, 13, C.blue);
      api.text(ctx, 'tool ' + (i + 1), x(time), 408, 32, C.blue, 'center');
    });
    if (finish > 0) {
      api.circle(ctx, x(8.4), 515, 16 * finish, C.cyan);
      api.text(ctx, 'reply · 8.4 s', x(8.4), 595, 33, C.cyan, 'center');
    }
    const fields = [
      ['Resolution', finish === 1 ? '1' : '…', '0 or 1'],
      ['Route', route === 1 ? 'rollback' : '…', 'one of four labels'],
      ['Tool calls', String(toolCount), 'whole count ≥ 0'],
      ['Duration', finish === 1 ? '8.4 s' : '…', 'positive seconds'],
    ];
    fields.forEach(([name, value, allowed], i) => {
      const mid = 303 + 433 * i;
      api.text(ctx, name, mid, 722, 32, C.muted, 'center');
      api.text(ctx, value, mid, 810, 53, C.ink, 'center');
      if ([support > 0, support > 0.5, countSupport > 0, timeSupport > 0][i]) {
        api.text(ctx, allowed, mid, 908, 30, C.cyan, 'center');
      }
    });
  });
}

export default {
  id: 'request-fields',
  draw: drawRequestFields,
  cues: [
    'sp-request-fields-0',
    'request-tools',
    'request-finish',
    'sp-request-fields-1',
    'request-count-support',
    'request-time-support',
  ],
};
