import {
  C,
  base,
  cue,
  caption,
  slip,
  box,
  label,
  line,
  arrow,
  text,
  dot,
  envelope,
  stamp,
  field,
  mix,
} from './art.mjs';
import { original, print, graph, activity, remaining } from './examples.mjs';

function machine(c, x, y, name, sub, offline) {
  const bg = offline ? '#d2cabb' : C.dark;
  box(c, x, y, 420, 215, bg, 18);
  for (let i = 0; i < 3; i++) {
    box(c, x + 22, y + 22 + i * 54, 376, 42, offline ? '#bdb7a9' : '#44616a', 7);
    for (let j = 0; j < 7; j++)
      line(
        c,
        x + 42 + j * 14,
        y + 33 + i * 54,
        x + 42 + j * 14,
        y + 52 + i * 54,
        offline ? C.line : '#7d9698',
        4,
      );
    dot(c, x + 365, y + 43 + i * 54, 6, offline ? C.mute : '#c7edaf');
  }
  text(c, name, x, y + 289, 51, offline ? C.mute : C.ink, 'Serif');
  text(c, sub, x, y + 346, 33, C.mute);
}
export function durable(c, k) {
  const saved = cue(k, 0, 'commits a pending record'),
    notified = cue(k, 0, 'notify Casey');
  const down = cue(k, 1, 'worker A stops'),
    loaded = cue(k, 2, 'Worker B reloads');
  base(c, 'Workflow storage   /   ' + original.operationId, 'Where does the request wait?');
  machine(
    c,
    100,
    395,
    loaded ? 'Worker B' : 'Worker A',
    loaded
      ? 'Reloaded same key'
      : down
        ? 'Process memory lost'
        : saved
          ? 'Saved ' + original.operationId
          : 'Preparing ' + original.operationId,
    down && !loaded,
  );
  if (!down) arrow(c, 558, 490, 637, 490, C.teal);
  else if (loaded) arrow(c, 635, 490, 553, 490, C.teal);
  slip(c, 667, 266, 757, 555, saved ? 'DURABLE STORE   /   PENDING' : 'PROPOSED   /   IN MEMORY', {
    accent: saved ? C.teal : C.ochre,
  });
  text(c, original.operationId + '   ·   packet v' + original.version, 704, 421, 43, C.ink, 'Mono');
  field(c, 'Target', '25%   ·   rev 3', 703, 504, 675);
  field(c, 'Digest prefix', print(original) + '…', 703, 574, 675);
  field(c, 'Reviewer', 'Release manager', 703, 644, 675);
  field(c, 'Review before', 'tick 200', 703, 714, 675);
  text(c, original.evidence.join('   /   '), 703, 787, 31, C.mute, 'Mono');
  const delivery = cue(k, 0, 'notify Casey', 0.8);
  if (notified) {
    arrow(c, 1454, 497, 1749, 497, C.line);
    envelope(c, mix(1455, 1645, delivery), 438, 140, C.pale);
    text(c, 'Casey', 1645, 651, 48, C.ink, 'Serif');
    text(c, delivery === 1 ? 'Notified' : 'In transit', 1645, 703, 32, C.mute);
  }
  caption(
    c,
    loaded
      ? 'Recovered    ' +
          original.operationId +
          '    ·    original arguments    ·    original deadline'
      : down
        ? 'The worker is offline. The committed record is still available.'
        : saved
          ? 'The pending record can survive the process that wrote it.'
          : 'The router continues to serve the original ranking.',
  );
}

export function graphPause(c, k) {
  const repaired = k.beat.beatIndex === 2;
  const resumed = repaired ? cue(k, 2, 'On resume') : cue(k, 1, 'Two notices');
  const s = graph(repaired, resumed);
  const noticeVisible = cue(k, 0, 'sends Casey a notice');
  const paused = cue(k, 0, 'calls interrupt');
  const activeRow = repaired ? (resumed ? 2 : 1) : resumed || paused ? 2 : noticeVisible ? 1 : 0;
  base(
    c,
    'LangGraph   /   Resume the same thread',
    repaired ? 'What changes when the notice moves?' : 'What runs twice on resume?',
  );
  const x = 90,
    y = 278;
  box(c, x, y, 1094, 534, C.dark, 14);
  label(
    c,
    repaired ? 'REPAIRED GRAPH   /   SAME THREAD' : 'ORIGINAL GRAPH   /   SAME THREAD',
    x + 38,
    y + 61,
    '#b9ded2',
  );
  const rows = repaired
    ? [
        'prepare    send notice once',
        'review     enter node',
        '           interrupt(packet)',
        'execute    guarded write',
      ]
    : [
        'review     enter node',
        '           send notice',
        '           interrupt(packet)',
        'execute    guarded write',
      ];
  rows.forEach((s, i) => {
    const ry = y + 165 + 92 * i;
    const active = i === activeRow;
    if (active) box(c, x + 24, ry - 48, 1040, 73, '#385b60', 7);
    text(c, s, x + 47, ry, 39, i === 3 ? '#adc4c2' : C.white, 'Mono');
  });
  if (resumed) {
    const top = repaired ? y + 219 : y + 126;
    line(c, 1127, y + 337, 1127, top, C.pale, 5);
    arrow(c, 1127, top, 1054, top, C.pale, 5);
  }
  label(c, 'CASEY’S INBOX', 1235, 342);
  for (let i = 0; i < (noticeVisible ? s.notices : 0); i++)
    envelope(c, 1238 + 204 * i, 392, 175, i ? C.blush : C.pale);
  text(
    c,
    (noticeVisible ? s.notices : 0) +
      ' ' +
      (noticeVisible && s.notices === 1 ? 'notice' : 'notices'),
    1235,
    615,
    60,
    C.ink,
    'Serif',
  );
  text(c, s.starts + ' review ' + (s.starts === 1 ? 'start' : 'starts'), 1235, 699, 39, C.mute);
  text(c, s.writes + ' production writes', 1235, 763, 39, C.mute);
  caption(
    c,
    repaired
      ? 'A completed notification node stays complete when the review node restarts.'
      : resumed
        ? 'The resume value returns at interrupt. Earlier lines of the same node run again.'
        : paused
          ? 'Paused at interrupt    ·    checkpoint saved under the thread ID'
          : noticeVisible
            ? 'One notice was sent before the pause.'
            : 'The node starts at its first line.',
  );
}

export function temporal(c, k) {
  const activityBeat = k.beat.beatIndex >= 3;
  if (k.beat.beatIndex === 2) {
    const restarted = cue(k, 2, 'Temporal replays');
    const reread = cue(k, 2, 'recorded results');
    base(c, 'Temporal   /   Event history', 'How does the replacement worker recover?');
    label(c, 'DURABLE HISTORY   /   REVIEW', 88, 318);
    const events = ['Timer started', 'Policy Activity returned', 'Decision recorded'];
    events.forEach((event, i) => {
      const x = 92 + i * 585;
      box(c, x, 427, 525, 158, i === 1 ? C.ice : C.paper, 9);
      label(c, 'Event ' + (i + 1), x + 25, 480);
      text(c, event, x + 25, 547, 39, C.ink, 'Serif');
      if (i < 2) arrow(c, x + 529, 505, x + 570, 505, C.line);
    });
    if (restarted) text(c, 'Replacement worker replays this history', 90, 713, 52, C.ink, 'Serif');
    if (reread) stamp(c, 'Policy result reused', 1230, 655, C.teal);
    caption(c, 'The timer retains its original deadline across the restart.');
    return;
  }
  if (!activityBeat) {
    const checked = cue(k, 1, 'Three differs'),
      current = cue(k, 1, 'With the current tab'),
      saved = cue(k, 1, 'records approval');
    base(c, 'Temporal   /   Decision messages', 'Which reply can Casey rely on?');
    slip(c, 88, 279, 644, 489, 'CASEY’S TAB');
    text(c, 'Packet ' + (current ? '4' : '3'), 126, 470, 67, C.ink, 'Serif');
    text(c, 'Approve this version', 128, 585, 37, C.mute);
    if (checked)
      stamp(
        c,
        current ? (saved ? 'Accepted' : 'Checking') : 'Refused',
        127,
        654,
        saved ? C.teal : current ? C.blue : C.red,
      );
    arrow(c, 779, 499, 1117, 499, C.teal, 6);
    text(
      c,
      k.beat.beatIndex === 0 ? 'Click' : 'Update',
      948,
      457,
      39,
      C.ink,
      'Sans',
      600,
      'center',
    );
    slip(c, 1167, 279, 664, 489, 'WORKFLOW   /   CURRENT');
    text(c, 'Packet 4', 1205, 470, 67, C.ink, 'Serif');
    text(c, saved ? 'Authorized' : 'Pending', 1206, 585, 45, saved ? C.teal : C.ochre);
    text(
      c,
      checked && !current
        ? 'Old tab failed validation'
        : saved
          ? 'Decision in event history'
          : 'Checks version and digest',
      1207,
      689,
      33,
      C.mute,
    );
    caption(
      c,
      k.beat.beatIndex === 0
        ? 'Signal acknowledges delivery. Query reads state. Casey needs an acceptance result.'
        : saved
          ? 'The authenticated decision passed validation and the handler’s current-state check.'
          : current
            ? 'The current packet and authenticated decision are being checked.'
            : checked
              ? 'A refused Update leaves version 4 waiting for a valid decision.'
              : 'An Update can return the workflow’s decision to its caller.',
    );
    return;
  }
  const asked = cue(k, 3, 'It waits twenty seconds'),
    answer = cue(k, 4, 'Twenty-five seconds');
  base(c, 'Temporal   /   Activity deadline', 'How much execution time is left?');
  label(c, 'ONE ATTEMPT   /   SCHEDULE TO CLOSE', 88, 311);
  const x = 175,
    w = 1574,
    y = 522,
    pos = (t) => x + (t / activity.scheduledLimit) * w;
  box(c, x, y, w, 98, C.ice, 6);
  if (asked) box(c, x, y, pos(activity.wait) - x, 98, C.pale, 6);
  if (answer)
    box(c, pos(activity.wait), y, pos(activity.scheduledLimit) - pos(activity.wait), 98, C.mint, 6);
  [
    [0, 'Scheduled'],
    [activity.scheduledLimit, 'Deadline'],
    ...(asked ? [[activity.wait, 'Starts']] : []),
  ].forEach(([t, s]) => {
    line(c, pos(t), y - 25, pos(t), y + 122, C.ink, 3);
    text(c, t + ' s', pos(t), y - 51, 42, C.ink, 'Mono', 400, 'center');
    text(c, s, pos(t), y + 182, 38, C.ink, 'Serif', 400, 'center');
  });
  if (asked) text(c, '20 s queued', pos(10), y + 62, 40, C.ink, 'Sans', 600, 'center');
  if (answer) text(c, remaining + ' s left', pos(32.5), y + 62, 40, C.teal, 'Sans', 700, 'center');
  caption(
    c,
    answer
      ? 'Usable time = min(30 s run limit, 45 s − 20 s wait) = 25 s.'
      : 'Run limit   30 s     ·     schedule-to-close limit   45 s including queue time.',
  );
}
