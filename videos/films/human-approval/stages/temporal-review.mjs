import { PROPOSAL } from '../fixtures.mjs';
import { cueClock } from '../routing.mjs';

const openVersion = PROPOSAL.version;
const editedVersion = openVersion + 1;
const runLimit = 30,
  totalLimit = 45,
  queueWait = 20;
const available = Math.min(runLimit, totalLimit - queueWait);

function reviewScreen(ctx, api, cue, beat) {
  const { C } = api;
  const done = (id) => cue(id).phase === 'after';
  const tab = done('temporal-refresh') ? editedVersion : openVersion;
  const current = done('temporal-edit') ? editedVersion : openVersion;
  const recorded = done('temporal-record');

  api.focus.target('reviewer', () => {
    api.text(ctx, 'Casey’s open tab', 115, 268, 42, C.ink);
    api.text(ctx, 'v' + tab, 115, 441, 130, C.yellow, 'left', 'serif');
    api.text(
      ctx,
      (tab === current ? done('temporal-resubmit') : done('temporal-click'))
        ? 'Approve clicked'
        : 'Approval request',
      326,
      424,
      37,
      C.yellow,
    );
  });
  api.focus.target('workflow', () => {
    api.text(ctx, 'Current proposal', 1065, 268, 42, C.ink);
    api.text(ctx, 'v' + current, 1065, 441, 130, C.blue, 'left', 'serif');
    api.text(
      ctx,
      recorded ? 'Approval recorded' : 'Pending review',
      1280,
      424,
      37,
      recorded ? C.green : C.blue,
    );
    if (beat === 2 && cue('temporal-check').phase !== 'before')
      api.text(ctx, 'Action  ·  version  ·  digest  ·  deadline', 1065, 505, 31, C.muted);
  });
  api.line(ctx, 115, 550, 1805, 550, C.muted, 2);

  api.focus.target('messages', () => {
    if (beat === 0) {
      if (done('temporal-click'))
        api.text(ctx, 'What reply would help Casey?', 960, 777, 61, C.ink, 'center', 'serif');
      return;
    }
    if (beat === 2) {
      if (cue('temporal-expiry').phase !== 'before') {
        api.text(ctx, 'If nobody decides by the deadline', 115, 713, 38, C.muted);
        if (done('temporal-expiry'))
          api.text(ctx, 'Review expires. Traffic stays put.', 115, 820, 50, C.ink, 'left', 'serif');
      } else if (recorded)
        api.text(ctx, 'Casey approved version ' + current, 115, 780, 53, C.green, 'left', 'serif');
      return;
    }
    for (const [i, [method, response, requestCue, replyCue, color]] of [
      ['Signal', 'Message received', 'temporal-signal', 'temporal-signal', C.cyan],
      [
        'Update',
        tab !== current ? 'Rejected · stale version' : 'Version matches',
        'temporal-validate',
        'temporal-update',
        C.yellow,
      ],
      ['Query', 'Version ' + current + ' · pending', 'temporal-observe', 'temporal-query', C.blue],
    ].entries()) {
      const reply = cue(replyCue);
      const y = 640 + i * 151;
      if (cue(requestCue).phase === 'before' && i !== 0) continue;
      api.text(ctx, method, 1210, y + 16, 46, color, 'left', 'serif');
      api.line(ctx, 640, y, 1130, y, C.muted, 2);
      if (reply.phase === 'during') api.circle(ctx, 1130 - 490 * reply.progress, y, 12, color);
      if (reply.phase === 'after') api.text(ctx, response, 115, y + 16, 41, color);
    }
  });
}

function replay(ctx, api, cue) {
  const { C } = api;
  api.focus.target('history', () => {
    api.text(ctx, 'Event history', 115, 294, 48, C.blue, 'left', 'serif');
    api.text(ctx, 'Restarted worker', 1135, 294, 48, C.cyan, 'left', 'serif');
    const replaying = cue('temporal-replay');
    api.text(ctx, 'Review timer started', 115, 455, 44, C.ink);
    api.line(ctx, 696, 440, 1035, 440, C.muted, 3);
    if (replaying.phase === 'during')
      api.circle(ctx, 696 + 339 * replaying.progress, 440, 12, C.cyan);
    if (replaying.phase === 'after') api.text(ctx, 'Rebuild waiting state', 1135, 455, 41, C.ink);
    if (cue('temporal-deadline').phase === 'after')
      api.text(ctx, 'Original review deadline', 1135, 532, 36, C.yellow);
    const read = cue('temporal-read');
    if (cue('temporal-activity').phase === 'after') {
      api.text(ctx, 'Policy and metrics snapshot', 115, 749, 42, C.ink);
      api.text(ctx, 'Activity result', 115, 820, 35, C.muted);
      api.line(ctx, 696, 733, 1035, 733, C.muted, 3);
      if (read.phase === 'during') api.circle(ctx, 696 + 339 * read.progress, 733, 12, C.cyan);
      if (read.phase === 'after') api.text(ctx, 'Use the recorded snapshot', 1135, 749, 40, C.cyan);
    }
  });
}

function executionClock(ctx, api, cue) {
  const { C } = api;
  const left = 210,
    right = 1710;
  const x = (seconds) => left + ((right - left) * seconds) / totalLimit;
  const wait = cue('temporal-wait');
  const answer = cue('temporal-remaining');
  api.focus.target('clock', () => {
    api.text(ctx, 'Promotion Activity', 115, 284, 49, C.ink, 'left', 'serif');
    api.text(ctx, '1 attempt  ·  up to ' + runLimit + ' s running', 115, 364, 37, C.muted);
    if (cue('temporal-timeouts').phase === 'before') return;
    api.line(ctx, left, 607, right, 607, C.muted, 4);
    for (const [seconds, word] of [
      [0, 'Scheduled'],
      [totalLimit, 'Deadline'],
    ]) {
      api.line(ctx, x(seconds), 575, x(seconds), 647, C.ink, 3);
      api.text(ctx, seconds + ' s', x(seconds), 713, 42, C.ink, 'center');
      api.text(ctx, word, x(seconds), 774, 32, C.muted, 'center');
    }
    if (wait.phase !== 'before') {
      const elapsed = queueWait * wait.progress;
      api.line(ctx, left, 607, x(elapsed), 607, C.yellow, 19);
      api.text(ctx, 'Waiting for a worker', (left + x(queueWait)) / 2, 546, 36, C.yellow, 'center');
      if (wait.phase === 'after') {
        api.line(ctx, x(queueWait), 575, x(queueWait), 647, C.ink, 3);
        api.text(ctx, queueWait + ' s', x(queueWait), 713, 42, C.ink, 'center');
        api.text(ctx, 'Started', x(queueWait), 774, 32, C.muted, 'center');
      }
    }
    if (answer.phase === 'after') {
      api.line(ctx, x(queueWait), 607, x(queueWait + available), 607, C.cyan, 19);
      api.text(
        ctx,
        available + ' s left to run',
        (x(queueWait) + right) / 2,
        546,
        43,
        C.cyan,
        'center',
      );
    }
  });
}

function handoff(ctx, api, cue) {
  const { C } = api;
  api.focus.target('handoff', () => {
    api.text(ctx, 'Current history', 115, 370, 56, C.blue, 'left', 'serif');
    api.text(ctx, 'New history', 1160, 370, 56, C.cyan, 'left', 'serif');
    api.text(ctx, 'Finish active message handlers', 115, 519, 39, C.ink);
    const carry = cue('temporal-carry');
    if (carry.phase === 'before') return;
    api.text(ctx, 'Workflow state', 115, 722, 42, C.ink);
    api.text(ctx, 'Operation keys', 115, 814, 42, C.ink);
    for (const y of [705, 797]) {
      api.line(ctx, 660, y, 1045, y, C.muted, 3);
      api.circle(ctx, 660 + 385 * carry.progress, y, 12, C.cyan);
    }
    if (carry.phase === 'after') {
      api.text(ctx, 'Workflow state', 1160, 722, 42, C.cyan);
      api.text(ctx, 'Operation keys', 1160, 814, 42, C.cyan);
    }
  });
}

export function drawTemporalReview(ctx, scene, state, api) {
  const cue = cueClock(scene, state);
  if (state.beat < 3) reviewScreen(ctx, api, cue, state.beat);
  else if (state.beat === 3) replay(ctx, api, cue);
  else if (cue('temporal-new').phase === 'before') executionClock(ctx, api, cue);
  else handoff(ctx, api, cue);
}

export default {
  id: 'temporal-review',
  draw: drawTemporalReview,
  cues: [
    'temporal-edit',
    'temporal-click',
    'temporal-signal',
    'temporal-validate',
    'temporal-update',
    'temporal-observe',
    'temporal-query',
    'temporal-refresh',
    'temporal-resubmit',
    'temporal-check',
    'temporal-record',
    'temporal-expiry',
    'temporal-replay',
    'temporal-deadline',
    'temporal-activity',
    'temporal-read',
    'temporal-timeouts',
    'temporal-wait',
    'temporal-remaining',
    'temporal-new',
    'temporal-carry',
  ],
};
