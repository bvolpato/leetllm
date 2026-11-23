export const choices = [
  'Test regression',
  'Registry authentication',
  'Insufficient evidence',
  'Compile failure',
];

export function drawTicket(
  ctx,
  api,
  { run, detailed, testsKnown, testFailure = false, selected, reviewed = false, count },
) {
  const { C } = api;
  const write = (value, x, y, size, color = C.ink) => api.text(ctx, value, x, y, size, color);
  const right = 1050;
  api.focus.target('build-log', () => {
    write(run + '   /   collector log', 105, 266, 35, C.muted);
    api.line(ctx, 105, 298, 933, 298, C.muted, 2);
    write('Build failed', 110, 405, 68);
    const line1 = testFailure ? 'Image pull succeeded' : 'Image pull failed';
    const line2 = testFailure ? 'Tests started' : '401 Unauthorized from registry';
    if (detailed) {
      write(line1, 110, 524, 45, testFailure ? C.ink : C.yellow);
      write(line2, 110, 606, 41, testFailure ? C.ink : C.yellow);
    } else {
      write('Summary only', 110, 524, 40, C.muted);
    }
  });
  api.focus.target('test-stage', () => {
    if (testsKnown) {
      write(
        testFailure ? 'Assertion failed' : 'Tests never started',
        110,
        709,
        45,
        testFailure ? C.yellow : C.ink,
      );
    }
  });
  api.focus.target('choices', () => {
    write('Caller’s allowed answers', right, 266, 35, C.muted);
    api.line(ctx, right, 298, 1810, 298, C.muted, 2);
    for (const [i, description] of choices.slice(0, count).entries()) {
      const y = 404 + i * 112;
      const active = i === selected;
      const color = active ? C.cyan : C.muted;
      api.circle(ctx, right + 40, y - 14, 33, active ? C.cyan : C.panel, color, 2);
      api.text(
        ctx,
        String.fromCharCode(65 + i),
        right + 40,
        y - 1,
        35,
        active ? C.bg : C.ink,
        'center',
      );
      write(description, right + 102, y, 40, active ? C.cyan : C.ink);
      if (active && reviewed) write('Reviewed answer', right + 104, y + 41, 29, C.cyan);
    }
  });
}
