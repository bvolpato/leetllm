import { cueClock, drawAge, drawReservation } from '../cued-trace.mjs';
import {
  accountB,
  accountBCandidate as candidate,
  actionReceipt,
  checkRotation,
  freshBudget,
} from '../model.mjs';

function record(ctx, api, clock, beat) {
  const { C } = api;
  const rejected = beat >= 2 || clock.after('ap-fresh-candidate-rejected');
  const showReturned = beat > 0 || clock.started('fresh-field');
  api.focus.target('account-facts', () => {
    api.text(ctx, 'Account B', 220, 270, 48, C.ink);
    let facts = 'Account record';
    if (beat > 0 || clock.started('fresh-age')) facts = 'Stale  /  ' + accountB.ageDays + ' days';
    if (beat > 0 || clock.started('fresh-policy'))
      facts += '     P-7 minimum ' + accountB.thresholdDays;
    api.text(ctx, facts, 220, 335, 31, C.cyan);
  });
  api.focus.target('candidate-record', () => {
    api.rect(ctx, 220, 395, 570, 187, C.panel, rejected ? C.pink : C.blue, 10);
    const arrived = beat > 0 || clock.started('fresh-label');
    api.text(ctx, arrived ? 'Model reply  /  cites P-7' : 'Model reply', 251, 448, 30, C.muted);
    if (arrived) api.text(ctx, candidate.decision, 251, 509, 43, C.ink);
    if (showReturned)
      api.text(ctx, 'returned threshold: ' + candidate.minimum_key_age_days, 251, 556, 31, C.ink);
    if (rejected && checkRotation(candidate, accountB).status === 'policy_mismatch') {
      api.text(ctx, 'Candidate rejected', 220, 672, 40, C.pink);
      api.text(
        ctx,
        'Returned ' + candidate.minimum_key_age_days + '  /  policy ' + accountB.thresholdDays,
        220,
        729,
        33,
        C.ink,
      );
    }
  });
}

function budget(ctx, api, clock, beat) {
  const { C } = api;
  const plan = freshBudget;
  api.focus.target('fresh-budget', () => {
    api.text(ctx, 'Separate read  /  temporary rate limit', 889, 268, 36, C.ink);
    if (clock.started('fresh-budget'))
      api.text(ctx, 'Task 10 s    −    elapsed 6 s', 889, 343, 34, C.blue);
    if (clock.started('fresh-draw'))
      api.text(ctx, 'Wait   1 s floor  +  ¼ × 2 s', 889, 421, 35, C.yellow);
    if (clock.started('fresh-allowances'))
      api.text(ctx, 'Call   2 s          Validation   0.7 s', 889, 488, 34, C.ink);
    if (clock.started('fresh-budget')) {
      drawReservation(ctx, api, plan, {
        left: 890,
        width: 835,
        domain: 5,
        y: 775,
        progress: [
          clock.p('ap-fresh-wait'),
          clock.p('ap-fresh-wait'),
          clock.p('fresh-call'),
          clock.p('fresh-check'),
        ],
      });
    }
    if (clock.after('fresh-total'))
      api.text(
        ctx,
        plan.wait + ' + ' + plan.call + ' + ' + plan.check + ' = ' + plan.required + ' s',
        889,
        895,
        38,
        C.ink,
      );
    if (beat === 2 && clock.after('fresh-allowances'))
      api.text(ctx, 'Can the wrapper schedule the retry?', 889, 986, 37, C.ink);
    if (clock.after('fresh-stop') && !plan.admitted)
      api.text(ctx, 'Retry withheld  /  0 further calls', 889, 986, 39, C.pink);
  });
}

function action(ctx, api, clock) {
  const { C } = api;
  const key = 'R-B';
  const sent = clock.after('fresh-send');
  const lost = clock.after('fresh-lost');
  const lookup = clock.started('fresh-lookup');
  const operations = [];
  if (sent) operations.push({ kind: 'create', key });
  if (clock.after('fresh-job')) operations.push({ kind: 'status', key, jobId: 'JOB-042' });
  const receipt = actionReceipt(key, operations);
  if (receipt.jobId && clock.after('show-confirmation')) {
    api.focus.target('write-path', () => {
      api.rect(ctx, 286, 275, 1348, 529, C.panel, C.green, 22);
      api.text(ctx, 'Rotation job confirmed', 385, 395, 52, C.green);
      api.text(ctx, receipt.jobId, 378, 558, 117, C.ink, 'left', 'mono');
      api.line(ctx, 385, 618, 1530, 618, C.muted, 2);
      api.text(ctx, 'Action key   ' + key, 385, 720, 42, C.ink);
      api.text(ctx, receipt.writes + ' write    /    1 status read', 1530, 720, 42, C.ink, 'right');
    });
    api.text(ctx, 'Model usage  /  unknown', 1625, 930, 30, C.muted, 'right');
    return;
  }
  const left = 530,
    right = 1480;
  api.text(ctx, 'Later  /  fresh check passed  /  rotation authorized', 165, 263, 37, C.ink);
  api.text(ctx, 'Caller', left, 375, 40, C.cyan, 'center');
  api.text(ctx, 'Job service', right, 375, 40, C.blue, 'center');
  api.focus.target('write-path', () => {
    function message(y, label, start, end, p, color) {
      api.text(ctx, label, 150, y + 11, 32, C.ink);
      api.line(ctx, left, y, right, y, C.muted, 2);
      const position = start + (end - start) * p;
      api.line(ctx, start, y, position, y, color, 8);
      api.circle(ctx, position, y, 10, color);
    }
    message(472, 'Create  /  ' + key, left, right, clock.p('fresh-send'), C.cyan);
    if (sent) {
      const lostAt = (left + right) / 2;
      message(580, 'Reply', right, lostAt, clock.p('fresh-lost'), C.yellow);
      if (lost) {
        api.line(ctx, lostAt - 12, 564, lostAt + 12, 596, C.pink, 5);
        api.line(ctx, lostAt + 12, 564, lostAt - 12, 596, C.pink, 5);
        api.text(ctx, 'Lost', lostAt, 642, 30, C.pink, 'center');
      }
    }
    if (lookup)
      message(731, 'Status read  /  ' + key, left, right, clock.p('fresh-lookup'), C.blue);
    if (clock.started('fresh-job'))
      message(826, 'Status reply', right, left, clock.p('fresh-job'), C.green);
    if (receipt.jobId) api.text(ctx, receipt.jobId, left, 899, 42, C.green, 'center');
  });
  if (lost && !lookup)
    api.text(ctx, 'How could you find the job with just a read?', 150, 854, 42, C.ink);
  const count = receipt.writes;
  const outcome = receipt.jobId
    ? 'Job confirmed'
    : lost
      ? 'Outcome unknown'
      : 'Waiting for receipt';
  api.text(
    ctx,
    count + (count === 1 ? ' write attempt' : ' write attempts') + '     /     ' + outcome,
    150,
    1000,
    42,
    receipt.jobId ? C.green : C.ink,
  );
  if (receipt.jobId) api.text(ctx, 'Model usage  /  unknown', 1755, 1000, 31, C.muted, 'right');
}

export function drawFreshRequest(ctx, scene, state, api) {
  const clock = cueClock(scene, state);
  if (state.beat >= 4) return action(ctx, api, clock);
  record(ctx, api, clock, state.beat);
  if (state.beat >= 2) return budget(ctx, api, clock, state.beat);
  drawAge(ctx, api, {
    left: 962,
    width: 705,
    maxAge: 40,
    y: 620,
    age: accountB.ageDays,
    minimum: accountB.thresholdDays,
    ageShown: clock.started('fresh-age'),
    policyShown: clock.started('fresh-policy'),
  });
  if (state.beat === 0 && clock.after('fresh-field'))
    api.text(ctx, 'Can the server return this candidate?', 220, 942, 45, api.C.ink);
}

export default {
  id: 'fresh-request',
  draw: drawFreshRequest,
  cues: [
    'fresh-age',
    'fresh-policy',
    'fresh-label',
    'fresh-field',
    'ap-fresh-candidate-rejected',
    'fresh-budget',
    'fresh-draw',
    'fresh-allowances',
    'fresh-stop',
    'ap-fresh-wait',
    'fresh-call',
    'fresh-check',
    'fresh-total',
    'fresh-send',
    'fresh-lost',
    'fresh-lookup',
    'fresh-job',
    'show-confirmation',
  ],
};
