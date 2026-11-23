import { CASES } from '../fixtures.mjs';
import { predict } from '../model.mjs';
import { cueClock } from '../report-picture.mjs';

function routeStamp(ctx, api, route, x, y, expected) {
  const color = route === expected ? api.C.green : api.C.pink;
  api.rect(ctx, x - 126, y - 55, 252, 86, api.C.bg, color, 12);
  api.text(ctx, route, x, y + 6, 44, color, 'center', 'mono');
}

export function drawOpening(ctx, scene, state, api) {
  const at = cueClock(scene, state);
  const { C } = api;
  const [deploy, , rollback] = CASES;
  const repaired = at('use-release-record') > 0;
  const hasRunbook = at('bring-runbook') > 0;
  const answered = at('rollback-answer') === 1;
  const time = state.t ?? 0;
  if (time < 0.35) ctx.globalAlpha = 1;

  const request = hasRunbook ? 'rollback' : 'approval';
  api.focus.target(request, () => {
    api.text(ctx, hasRunbook ? 'Rollback request' : 'Request 205', 128, 274, 36, C.cyan);
    // The tail anchors the question to the request while the route travels to the report.
    api.path(
      ctx,
      [
        { x: 122, y: 320 },
        { x: 775, y: 320 },
        { x: 775, y: 466 },
        { x: 218, y: 466 },
        { x: 166, y: 514 },
        { x: 166, y: 466 },
        { x: 122, y: 466 },
      ],
      { closed: true, fill: C.panel, color: C.cyan, width: 4 },
    );
    api.text(
      ctx,
      hasRunbook ? 'How do I roll back?' : 'May I deploy?',
      163,
      416,
      63,
      C.ink,
      'left',
      'serif',
    );
    api.text(ctx, 'Evidence', 128, 597, 32, C.muted);
    api.text(ctx, hasRunbook ? 'Rollback runbook' : 'No approval record', 128, 666, 49, C.ink);
  });
  api.focus.target('rule', () => {
    api.text(ctx, repaired ? 'Run 2 rule' : 'Run 1 rule', 128, 804, 32, C.muted);
    api.text(ctx, repaired ? 'Require a release record' : 'Always serve', 128, 876, 48, C.ink);
  });

  // A folded report page keeps the first run in place when the replay adds a second column.
  const right = 1790;
  const fold = 76;
  api.path(
    ctx,
    [
      { x: 882, y: 218 },
      { x: right - fold, y: 218 },
      { x: right, y: 218 + fold },
      { x: right, y: 968 },
      { x: 882, y: 968 },
    ],
    { closed: true, fill: C.panel, color: C.muted, width: 3 },
  );
  api.path(
    ctx,
    [
      { x: right - fold, y: 218 },
      { x: right - fold, y: 218 + fold },
      { x: right, y: 218 + fold },
    ],
    { color: C.muted, width: 3 },
  );
  api.text(ctx, 'Saved routes', 940, 330, 63, C.ink, 'left', 'serif');
  const originalX = 1150;
  const repairX = 1520;
  api.text(ctx, 'Run 1', originalX, 421, 35, C.cyan, 'center');
  if (repaired) api.text(ctx, 'Run 2', repairX, 421, 35, C.cyan, 'center');
  api.line(ctx, 940, 452, 1724, 452, C.muted, 2);

  api.focus.target('approval-row', () => {
    api.text(ctx, 'Deploy approval', 940, 520, 41, C.ink);
    api.text(ctx, 'Expected  ' + deploy.expected, 940, 570, 29, C.muted);
    const travel = Math.min(1, time / 1.25);
    const x = api.lerp(765, originalX, 1 - (1 - travel) ** 2);
    routeStamp(ctx, api, predict('regressed', deploy), x, 660, deploy.expected);
    if (at('withhold-approval') === 1)
      routeStamp(ctx, api, predict('first repair', deploy), repairX, 660, deploy.expected);
  });
  if (!hasRunbook) return;
  api.line(ctx, 940, 727, 1724, 727, C.muted, 2);
  api.focus.target('runbook-row', () => {
    api.text(ctx, 'Rollback steps', 940, 789, 41, C.ink);
    api.text(ctx, 'Expected  ' + rollback.expected, 940, 839, 29, C.muted);
  });
  api.focus.target('decision', () => {
    if (answered)
      routeStamp(ctx, api, predict('first repair', rollback), repairX, 911, rollback.expected);
    else api.text(ctx, '?', repairX, 919, 65, C.yellow, 'center');
  });
}

export default {
  id: 'opening',
  draw: drawOpening,
  cues: [
    'original-approval',
    'use-release-record',
    'withhold-approval',
    'bring-runbook',
    'ask-rollback',
    'rollback-answer',
    'keep-both',
  ],
};
