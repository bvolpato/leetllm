import {
  C,
  arrow,
  center,
  dot,
  footer,
  gradient,
  heading,
  lamp,
  line,
  mono,
  plate,
  poly,
  rack,
  rr,
  slip,
  tag,
  terminal,
  txt,
} from './art.mjs';
import {
  after,
  before,
  cluster,
  exercise,
  fraction,
  groups,
  key,
  oldDone,
  oldQueue,
  payload,
  seatAction,
  sum,
} from './examples.mjs';
import { finalWait } from './limits.mjs';

function ageRuler(g, observation, { result = false, title, generated = false }) {
  heading(g, 'Evidence freshness   /   Controller unavailable', title);
  plate(g, 38, 135, 883, 257);
  const left = 89,
    right = 866,
    span = right - left;
  mono(g, 'TRUSTED CONTROLLER RECORD', 66, 169, 14, C.brass);
  slip(g, 67, 185, 314, 105, 'Observed at ' + observation.at, [
    observation.jobId + '  ' + observation.state,
    observation.runId + '  /  ' + observation.operationKey,
  ]);
  line(g, left, 291, left, 334, C.dim);
  line(g, left, 330, right, 330, C.dim, 3);
  dot(g, left, 330, 7, C.teal);
  const fresh = right - (span * observation.limitMinutes) / observation.ageMinutes;
  rr(g, fresh, 314, right - fresh, 32, 2, C.brass);
  line(g, right, 208, right, 349, C.red, 2);
  mono(g, 'Current-status window', right - 18, 215, 15, C.brass, { align: 'right' });
  mono(g, observation.limitMinutes + ' min', right - 18, 240, 16, C.brass, { align: 'right' });
  mono(g, observation.at, left, 366, 16, C.ivory);
  mono(g, observation.ageMinutes + ' min old', (left + right) / 2, 361, 15, C.dim, {
    align: 'center',
  });
  mono(g, observation.now, right, 366, 16, C.ivory, { align: 'right' });
  footer(
    g,
    generated
      ? 'A model-generated “live” flag has no trusted observation behind it.'
      : result && !observation.current
        ? 'Current status unavailable. The dated record still supports the earlier state.'
        : 'Compare the observation time with the allowed freshness window.',
  );
}

export function fallback(g, { b, cue }) {
  if (b === 3 || b === 4) {
    const terminalExample = b === 4 && cue(4, 'Even a completed observation');
    ageRuler(g, terminalExample ? oldDone : oldQueue, {
      title: 'Does this cache answer “finished now”?',
      result: cue(3, 'Report the time'),
      generated: !terminalExample && cue(4, 'generated has-live-evidence'),
    });
    return;
  }
  if (b >= 5) {
    const sealed = cue(6, 'user cancellation');
    heading(
      g,
      'Handoff   /   Approved fields',
      sealed
        ? 'What happens to the fallback on cancellation?'
        : 'What does the next operator need?',
    );
    plate(g, 38, 138, 352, 247);
    mono(g, 'RECOVERY RECORD', 62, 176, 15, C.brass);
    [
      key,
      payload.run + ' · ' + payload.revision,
      '1 send · no reply',
      'Live lookup unavailable',
    ].forEach((s, i) => mono(g, s, 62, 218 + 40 * i, 17, i === 0 ? C.teal : C.ivory));
    arrow(g, 392, 256, 487, 256, C.steel, 3);
    slip(g, 502, 143, 416, 239, 'Handoff from queued observation', [
      'Check rollback status',
      key,
      payload.run + ' / ' + payload.revision,
      '12:00   job-1 queued',
      'Current state unknown',
      '1 send · live route down',
    ]);
    if (sealed) tag(g, 'If canceled: 0 new sends', 491, 392, 430, C.red);
    footer(
      g,
      sealed
        ? 'The canceled run ends here. Cached access also requires current permission.'
        : 'The operator receives the exact operation and the reason automation stopped.',
    );
    return;
  }
  const reduced = cue(1, 'narrower route'),
    down = b === 2 && cue(2, 'same unavailable controller');
  heading(
    g,
    'Fallback routing   /   Same run budget',
    b === 1 ? 'What can the backup actually do?' : 'Where do the two status routes meet?',
  );
  plate(g, 41, 143, 327, 239);
  mono(g, 'MODEL ROUTES', 64, 177, 14, C.brass);
  for (const [i, s] of ['Primary', 'Backup'].entries()) {
    const y = 225 + i * 83;
    lamp(g, 73, y - 5, i === 1, C.teal);
    txt(g, s, 99, y + 3, 24, C.ivory, { font: 'Serif' });
    mono(
      g,
      b === 2
        ? 'Status read'
        : i === 1
          ? reduced
            ? 'log classification only'
            : 'check data policy'
          : 'unavailable',
      99,
      y + 28,
      14,
      i === 1 ? C.teal : C.red,
    );
  }
  if (b === 1) {
    slip(g, 515, 173, 362, 159, 'Allowed fallback task', [
      reduced ? 'Classify log excerpt' : 'Check route compatibility',
      reduced ? 'Mutation tools off' : 'Roles, tools, schema',
      'Same time and spend limit',
    ]);
    arrow(g, 371, 307, 505, 283, C.pine, 3);
  } else {
    for (const y of [223, 307]) {
      line(g, 368, y, 472, y, C.steel, 3);
      line(g, 472, y, 472, 261, C.steel, 3);
    }
    line(g, 472, 261, 635, 261, C.steel, 3);
    if (down) {
      line(g, 548, 249, 568, 273, C.brick, 5);
      line(g, 568, 249, 548, 273, C.brick, 5);
    }
    rack(g, 635, 155, 277, 208, {
      main: '',
      sub: down ? 'Live read unavailable' : 'Shared status service',
    });
  }
  footer(
    g,
    b === 1
      ? 'Check permission and evaluate the translated task on the backup route.'
      : down
        ? 'Both providers depend on the same controller for current job status.'
        : 'Trace the status read from each provider.',
  );
}

function pod(g, x, y, id, color) {
  const w = 42,
    h = 42,
    depth = 11;
  poly(
    g,
    [
      [x, y],
      [x + depth, y - depth],
      [x + w + depth, y - depth],
      [x + w, y],
    ],
    '#d3e7d8',
  );
  poly(
    g,
    [
      [x + w, y],
      [x + w + depth, y - depth],
      [x + w + depth, y + h - depth],
      [x + w, y + h],
    ],
    '#4e817a',
  );
  rr(g, x, y, w, h, 2, color);
  mono(g, id, x + w / 2, y + 26, 16, C.deep, { align: 'center', w: 700 });
}
function nodeDeck(g, x, y, node, showPods) {
  const w = 375,
    h = 65;
  poly(
    g,
    [
      [x, y],
      [x + 55, y - 51],
      [x + w + 55, y - 51],
      [x + w, y],
    ],
    '#50666b',
  );
  poly(
    g,
    [
      [x + w, y],
      [x + w + 55, y - 51],
      [x + w + 55, y + h - 51],
      [x + w, y + h],
    ],
    '#172f38',
  );
  rr(g, x, y, w, h, 3, gradient(g, x, y, x, y + h, '#435a5f', '#253c44'));
  for (let i = 0; i < 7; i++) {
    line(g, x + 164 + i * 18, y + 24, x + 169 + i * 18, y + 40, '#162f36', 4);
  }
  lamp(g, x + 339, y + 33, node.schedulable, node.schedulable ? C.teal : C.red);
  txt(g, 'Node ' + node.id, x + 17, y + 41, 25, C.ivory, { font: 'Serif' });
  for (let i = 0; i < 2; i++) {
    const sx = x + 90 + i * 117;
    poly(
      g,
      [
        [sx - 7, y - 13],
        [sx + 13, y - 34],
        [sx + 74, y - 34],
        [sx + 54, y - 13],
      ],
      '#273f47',
    );
    if (showPods && node.pods[i])
      pod(g, sx, y - 65, node.pods[i], node.id === 'A' ? C.blue : C.teal);
  }
  tag(
    g,
    node.schedulable ? 'Scheduling open' : 'Cordoned',
    x + 17,
    y + 79,
    200,
    node.schedulable ? C.teal : C.red,
  );
}
export function compensation(g, { b, cue }) {
  if (b >= 4) {
    const refunded = cue(4, 'confirms the refund');
    const read = cue(5, 'Read the reservation');
    const held = cue(5, 'still holds seat');
    const checking = cue(5, 'Check current permission');
    const authorized = cue(5, 'needed and authorized');
    const released = cue(5, 'already released seat');
    const state = released ? 'Released' : held ? 'Reserved' : 'Unknown';
    const action = seatAction(state, authorized);
    heading(
      g,
      'Compensation   /   Separate services',
      'What should you check before canceling seat 12B?',
    );
    slip(g, 45, 173, 373, 171, 'Payment service', [
      refunded ? 'Refund confirmed' : 'Refund requested',
      'Charge 204',
      'Payment authority',
    ]);
    line(g, 476, 148, 476, 391, '#9faba2', 2, [5, 6]);
    slip(
      g,
      531,
      173,
      375,
      171,
      'Reservation service',
      [
        'Seat 12B',
        'State: ' + state,
        released
          ? 'Alternate read'
          : held
            ? 'Fresh reservation record'
            : read
              ? 'Reading reservation…'
              : 'No current observation',
      ],
      C.brassDark,
    );
    if (action) tag(g, action, 530, 364, 373, released ? C.teal : C.brass);
    footer(
      g,
      released
        ? 'A released seat needs no further action.'
        : authorized
          ? 'Current approval must cover this reservation.'
          : checking
            ? 'Check whether the operator may cancel this reservation.'
            : read
              ? 'Use a fresh observation from the reservation service.'
              : 'The booking used two services. Which evidence does the operator have?',
    );
    return;
  }
  const cordon = cue(1, 'cordon node A'),
    evict = cue(1, 'pods are evicted'),
    replaced = cue(1, 'start replacements'),
    unlocked = cue(2, 'Uncordon A');
  const data = cluster(!!evict, !cordon || !!unlocked);
  heading(
    g,
    'Node maintenance   /   Confirmed effects',
    b === 3 ? 'What must the Saga preserve?' : 'Where do the replacement pods live?',
  );
  nodeDeck(g, 38, 275, data.nodes[0], true);
  nodeDeck(g, 491, 275, data.nodes[1], !!replaced);
  if (cue(1, 'replacement image for A is unavailable')) {
    tag(
      g,
      b === 3 ? 'Compensation recorded' : 'Replacement image unavailable',
      43,
      140,
      340,
      b === 3 ? C.teal : C.red,
    );
  }
  if (cue(2, 'both checks pass')) mono(g, 'A: health and permission checked', 49, 186, 16, C.pine);
  footer(
    g,
    b === 3
      ? 'Record each confirmed action and its own recovery status. A compensation can time out.'
      : unlocked
        ? 'A may accept new placements. Pods p3 and p4 remain on B.'
        : replaced
          ? 'The old pod identities end. Their controllers create new identities on B.'
          : evict
            ? 'The evicted pods have left node A.'
            : 'Cordoning affects future placement. Existing pods are separate state.',
  );
}

const labels = ['Task complete', 'Accepted degraded', 'Safe handoff', 'Unresolved'];
const tones = [C.teal, C.blue, C.brass, C.red];
function dispositions(g, { b, cue }) {
  heading(
    g,
    'Outcome accounting   /   Unique runs',
    'What fraction actually completed the task?',
    true,
  );
  plate(g, 39, 135, 883, 273);
  const visible = [
    'Sixty complete',
    'twelve supply',
    'eighteen hand off',
    'ten stay unresolved',
  ].map((s) => cue(5, s));
  const labelsOn = cue(5, 'Task completion is'),
    safeOn = cue(5, 'measure is ninety percent');
  const total = sum(groups);
  let group = 0,
    end = groups[0];
  for (let i = 0; i < total; i++) {
    if (i === end) {
      group++;
      end += groups[group];
    }
    const x = 67 + (i % 10) * 22,
      y = 159 + Math.floor(i / 10) * 23;
    rr(g, x, y, 16, 17, 3, visible[group] ? tones[group] : C.track);
  }
  groups.forEach((n, i) => {
    const y = 185 + i * 47;
    dot(g, 352, y - 6, 6, visible[i] ? tones[i] : C.track);
    txt(g, labels[i], 370, y, 19, C.ivory);
    mono(g, visible[i] ? n : '·', 609, y, 19, visible[i] ? tones[i] : C.dim, { align: 'right' });
  });
  line(g, 648, 161, 648, 372, C.track, 1.5);
  if (labelsOn) {
    txt(g, fraction(groups[0], total), 674, 218, 45, C.teal, { font: 'Serif' });
    mono(g, 'completion', 677, 244, 15, C.dim);
  }
  if (safeOn) {
    txt(g, fraction(sum(groups.slice(0, 3)), total), 674, 305, 45, C.brass, { font: 'Serif' });
    mono(g, 'safe disposition', 677, 331, 15, C.dim);
  }
  mono(g, 'Denominator   ' + total + ' intervened runs', 349, 382, 16, C.dim);
  footer(
    g,
    b === 6
      ? 'Keep retries in transport metrics and operation keys in protected traces.'
      : 'Each cell represents one run. Handoffs preserve safety and consume human work.',
    true,
  );
}
export function practice(g, scene) {
  const { b, cue } = scene;
  if (b <= 2) {
    finalWait(g, scene);
    return;
  }
  if (b === 3) {
    ageRuler(g, oldDone, {
      title: 'Does the backup know the current status?',
      result: cue(3, 'Current status unavailable'),
    });
    return;
  }
  if (b === 4) {
    heading(g, 'Reconciliation   /   Exact identity', 'Which key should the operator look up?');
    slip(g, 58, 164, 352, 166, 'Retained operation', [key, payload.run, payload.revision]);
    arrow(g, 412, 243, 582, 243, C.pine, 4);
    terminal(g, 584, 153, 325, 188, {
      kicker: 'LOOKUP',
      label: 'Original operation',
      primary: 'Status unknown',
      minor: key,
      color: C.brass,
    });
    footer(g, 'A fresh key would name a second operation. The first still needs evidence.');
    return;
  }
  if (b <= 6) {
    dispositions(g, scene);
    return;
  }
  if (b === 7 || (b === 8 && !cue(8, 'recursive language models'))) {
    const post = cue(7, 'after commit'),
      s = post ? after : before;
    heading(g, 'Fault laboratory   /   Test harness', 'What does moving the fault change?');
    plate(g, 39, 145, 426, 231);
    mono(g, 'SYSTEM UNDER TEST', 63, 180, 14, C.dim);
    mono(g, post ? 'Reply lost after commit' : 'Failure before commit', 63, 227, 19, C.brass);
    mono(g, 'Operation rows   ' + s.operationCount, 63, 286, 18, C.ivory);
    mono(g, 'Queue rows       ' + s.jobCount, 63, 323, 18, C.ivory);
    arrow(g, 465, 262, 553, 262, C.pine, 3);
    slip(g, 562, 168, 346, 178, 'External harness', [
      'Compare actual rows',
      'Expected pair: ' + (post ? '1, 1' : '0, 0'),
      'Expectations stay outside',
      'the measured agent',
    ]);
    footer(
      g,
      'A local harness can inspect database records. Remote execution needs its own evidence.',
    );
    return;
  }
  const close = b === 9 && cue(9, 'opening rollback'),
    book = cue(8, 'recursive language models');
  if (book && !close) {
    heading(
      g,
      'Transfer   /   Recursive language models',
      'How much of the manual did the calls inspect?',
    );
    const x = 91,
      y = 178;
    for (let i = 4; i >= 0; i--) rr(g, x + i * 5, y + i * 5, 340, 186, 5, '#c8bfa7');
    slip(g, x, y, 340, 187, 'Manual outside context', [
      'Deployment guide',
      '§ 1   Status',
      '§ 2   Rollbacks',
      '§ 3   Maintenance',
    ]);
    arrow(g, 453, 256, 555, 256, C.pine, 3);
    slip(g, 566, 183, 330, 154, 'Sub-call', [
      'Read § 2',
      'Other sections pending',
      'Shares the run budget',
    ]);
    footer(
      g,
      'Keep the original source accessible and check coverage against the execution budget.',
    );
    return;
  }
  heading(g, 'Rollback evidence   /   Handoff', 'What can the operator act on?');
  slip(g, 47, 153, 403, 205, 'Opening rollback', [
    key,
    payload.run + ' · ' + payload.revision,
    after.job.id + ' queued at 12:05',
    'Executor result pending',
  ]);
  slip(
    g,
    514,
    153,
    402,
    205,
    'Deadline exercise',
    [
      exercise.fits ? 'Wait fits' : 'Retry unsent',
      exercise.total / 1000 + ' s needed',
      exercise.left / 1000 + ' s remained',
      'Reconcile by original key',
    ],
    C.brassDark,
  );
  footer(g, 'Keep the operation identifiable until a fresh observation settles its outcome.');
}
