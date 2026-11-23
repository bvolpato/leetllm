import { reasoningDecision } from './arithmetic.mjs';

export const cleanRelease = Object.freeze({
  tests_passed: true,
  security_scan_clear: true,
  reviewer_approved: true,
});
export const scanFields = [
  ['tests_passed', 'Tests passed'],
  ['security_scan_clear', 'Scan clear'],
  ['reviewer_approved', 'Review approved'],
];

function drawSlip(ctx, api, { x, y, source, accent, checks, action, scanColor }) {
  const { C, circle, line, rect, text } = api;
  const width = 716;
  rect(ctx, x, y, width, 558, C.ink, undefined, 14);
  rect(ctx, x + 19, y + 18, width - 38, 179, accent, undefined, 8);
  text(ctx, source, x + 50, y + 72, 37, C.bg);
  const label =
    action === 'merge_release'
      ? 'Merge'
      : action === 'manual_review'
        ? 'Manual review'
        : 'Awaiting check';
  text(ctx, label, x + 50, y + 161, 65, C.bg);
  if (action === 'merge_release') {
    const rail = x + width - 117;
    line(ctx, rail, y + 66, rail, y + 146, C.bg, 8);
    api.path(
      ctx,
      [
        { x: rail + 54, y: y + 72 },
        { x: rail + 54, y: y + 103 },
        { x: rail, y: y + 135 },
      ],
      { color: C.bg, width: 8 },
    );
    for (const [dx, dy] of [
      [0, 60],
      [54, 66],
      [0, 152],
    ]) {
      circle(ctx, rail + dx, y + dy, 10, accent, C.bg, 6);
    }
  }
  for (const [i, [key, name]] of scanFields.entries()) {
    const row = y + 283 + i * 104;
    const boxX = x + 492;
    const value = checks[key];
    const mark = key === 'security_scan_clear' && scanColor;
    rect(ctx, boxX, row - 51, 179, 72, mark || C.ink, C.bg, 7);
    text(ctx, name, x + 49, row + 2, 41, C.bg);
    if (typeof value === 'boolean') {
      text(ctx, value ? 'True' : 'False', boxX + 90, row + 2, 43, C.bg, 'center');
    }
  }
}

export function releaseSheet(
  ctx,
  api,
  { facts, record, scanMarked, showPolicy = true, comparison = false, arrival = 1 },
) {
  const { C } = api;
  const scanColor =
    scanMarked &&
    (comparison && facts.security_scan_clear === record.checks.security_scan_clear
      ? C.green
      : C.yellow);
  drawSlip(ctx, api, {
    x: 190,
    y: 245,
    source: 'Release service',
    accent: C.cyan,
    checks: facts,
    action: showPolicy ? reasoningDecision(facts) : undefined,
    scanColor,
  });
  drawSlip(ctx, api, {
    x: 1008 + 112 * (1 - arrival),
    y: 245 - 66 * (1 - arrival),
    source: 'Model proposal',
    accent: C.blue,
    checks: record.checks,
    action: record.final_action,
    scanColor,
  });
}
