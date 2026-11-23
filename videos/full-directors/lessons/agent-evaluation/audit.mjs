import {
  C,
  base,
  card,
  rect,
  line,
  type,
  pen,
  mono,
  mid,
  stamp,
  circle,
  heading,
  phase,
  ease,
  sheet,
  row,
  steps,
} from './atelier.mjs';
import { JUDGE_ROWS } from '../../../films/agent-evaluation/fixtures.mjs';
export const event = {
  run: 'library-03',
  index: 3,
  time: 12,
  permission: 'allow / op-17',
  args: { book: 'B7', contact: { email: 'lena@example.test' } },
  observation: 'Saved for lena@example.test',
};
const reserved = new Set(['email', 'phone', 'address']);
function scrubKeys(value) {
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.entries(value)
      .filter(([k]) => !reserved.has(k))
      .map(([k, v]) => [k, scrubKeys(v)]),
  );
}
export function exportTrace(drop, redact) {
  return {
    ...event,
    args: drop ? scrubKeys(event.args) : event.args,
    observation: redact
      ? event.observation.replace('lena@example.test', '[redacted]')
      : event.observation,
  };
}
export function trace(c, k) {
  base(c);
  const b = k.beat.beatIndex;
  if (b < 2) {
    heading(c, 'TRUSTED LIBRARY TRACE', 'Reconstruct the trajectory');
    const events = [
      ['Lookup', 'B7', 2],
      ['Permit', 'allow op-17', 2],
      ['Commit', 'hold-17', 3],
      ['Read', 'one match', 3],
    ];
    events.forEach(([a, res, v], i) => {
      const x = 129 + i * 432;
      rect(c, x, 364, 402, 328, C.ink, 5);
      for (let j = 0; j < 8; j++) {
        rect(c, x + 13 + j * 48, 378, 24, 13, C.paper, 2);
        rect(c, x + 13 + j * 48, 659, 24, 13, C.paper, 2);
      }
      pen(c, a, x + 25, 473, 56, C.sheet);
      type(c, res, x + 25, 554, 43, C.light);
      mono(c, 'account v' + v, x + 26, 621, 27, C.gold);
    });
    mono(
      c,
      b
        ? 'v2 → v2     /     v2 → v3 only at commit     /     v3 → v3'
        : 'Harness restores the snapshot and enforces the budget.',
      130,
      828,
      36,
      C.ink,
      1650,
    );
    return;
  }
  const drop = !!phase(k, 2, 'Drop the email field'),
    redact = !!phase(k, 3, 'Redact that detail');
  const record = exportTrace(drop, redact);
  heading(c, 'TRACE EXPORT   /   RUN ' + record.run, 'Inspect both field names and values');
  sheet(c, 139, 284, 1623, 572, 'Trusted tool event ' + record.index);
  const cols = [
    ['Time / permission', record.time + '   /   ' + record.permission],
    ['args.book', record.args.book],
    ['args.contact', drop ? '{}' : '{ email: lena@example.test }'],
    ['observation', record.observation],
  ];
  cols.forEach(([l, v], i) => {
    const y = 442 + 87 * i;
    mono(c, l, 196, y, 31);
    type(
      c,
      v,
      710,
      y,
      40,
      (i === 2 && !drop && phase(k, 2, 'scan the field names')) ||
        (i === 3 && !redact && phase(k, 3, 'The observation contains a contact detail'))
        ? C.red
        : C.ink,
      'Mono',
      'left',
      400,
      982,
    );
    line(c, 193, y + 22, 1706, y + 22, C.rule, 2);
  });
  if (drop)
    mono(
      c,
      redact
        ? 'Export allowlist   /   redact final message   /   expire retained copy'
        : 'Argument keys cleared   /   values still to inspect',
      194,
      813,
      30,
      redact ? C.green : C.wood,
      1490,
    );
}
export const strict = ['Lookup', 'Write', 'Verify'];
export function sequenceOK(observed, mode) {
  const expected = mode === 'recovery' ? ['Lookup timeout', ...strict] : strict;
  return expected.length === observed.length && expected.every((v, i) => v === observed[i]);
}
export function permitState(variant) {
  const grant = {
    tool: 'create request',
    candidate: 'cand-221',
    call: 'call-221',
    target: 'prod-10pct',
    time: 11,
  };
  const write = { ...grant, time: 12 };
  if (variant === 'candidate') write.candidate = 'cand-999';
  if (variant === 'call') write.call = 'call-222';
  if (variant === 'late') grant.time = 13;
  const match =
    ['tool', 'candidate', 'call', 'target'].every((key) => grant[key] === write[key]) &&
    grant.time <= write.time;
  return { grant, write, match };
}
export function process(c, k) {
  base(c);
  const b = k.beat.beatIndex;
  if (b < 2) {
    const mode = phase(k, 0, 'In a recovery test') ? 'recovery' : 'exact',
      seq =
        mode === 'recovery'
          ? ['Lookup timeout', ...strict]
          : phase(k, 0, 'Repeat the lookup')
            ? ['Lookup', ...strict]
            : phase(k, 0, 'Reverse them')
              ? [...strict].reverse()
              : strict;
    heading(
      c,
      'PROCESS SCORER',
      mode === 'exact'
        ? 'Require each action once, in order'
        : 'Allow one read retry after a timeout',
    );
    steps(c, seq);
    const ok = sequenceOK(seq, mode);
    stamp(c, ok ? 'Sequence accepted' : 'Sequence rejected', 108, 716, ok ? C.green : C.red);
    mono(c, seq.length + ' dispatches', 106, 856, 34);
    return;
  }
  if (b < 4) {
    const variant =
      b === 2
        ? phase(k, 2, 'change just the call')
          ? 'call'
          : phase(k, 2, 'Restore the candidate')
            ? 'ok'
            : phase(k, 2, 'Change the candidate')
              ? 'candidate'
              : 'ok'
        : phase(k, 3, 'move the permit')
          ? 'late'
          : phase(k, 3, 'Restore the call')
            ? 'ok'
            : 'call';
    const state = permitState(variant);
    heading(c, 'PROMOTION REQUEST', 'Match the permit to this dispatch');
    [state.grant, state.write].forEach((o, i) => {
      const x = 112 + i * 880;
      sheet(c, x, 300, 808, 544, i ? 'Dispatched write' : 'Host permit');
      Object.entries(o).forEach(([key, val], j) => {
        const mismatch =
          key === 'time'
            ? state.grant.time > state.write.time
            : state.grant[key] !== state.write[key];
        row(c, key, String(val), x + 38, 460 + 76 * j, 735, mismatch ? C.red : C.ink);
      });
    });
    stamp(
      c,
      state.match ? 'Permit matches' : 'Permit mismatch',
      111,
      892,
      state.match ? C.green : C.red,
    );
    return;
  }
  const second = phase(k, 4, 'Add a second write'),
    mode =
      b === 4
        ? 'none'
        : phase(k, 5, 'newer version')
          ? 'zero'
          : phase(k, 5, 'older version')
            ? 'old'
            : 'book';
  heading(c, 'PER-WRITE CHECK', 'Which read verifies the last write?');
  const states = ['W1  /  B7 v3', 'Read  /  B7 v3'];
  if (second) states.push('W2  /  B7 v4');
  steps(c, states, { y: 341 });
  if (second && phase(k, 4, 'It needs its own')) {
    sheet(c, 931, 635, 851, 233, 'Read after W2');
    const label = {
      none: 'No later read yet',
      zero: 'B7   /   v5   /   0 matches',
      old: 'B7   /   v3   /   too old',
      book: 'B8   /   v4   /   wrong book',
    }[mode];
    mono(c, label, 972, 795, 35, C.red, 753);
  }
}
export const judgeReport = (rows) => ({
  agree: rows.filter((r) => r.forward === r.human).length,
  flips: rows.filter((r) => r.forward !== r.swap).length,
  total: rows.length,
});
const replies = [
  { id: 'A', words: ['Done.'], color: C.lavender },
  { id: 'B', words: ['Find River Stories', 'in your holds.'], color: C.light },
];
export function replyPositions(p) {
  return replies.map((reply, i) => ({
    ...reply,
    x: 146 + (i === 0 ? p : 1 - p) * 660,
    y: 410 + (i === 0 ? -1 : 1) * 154 * Math.sin(Math.PI * p),
  }));
}
function quote(c, r) {
  card(c, r.x, r.y, 550, 244, r.color);
  mono(c, 'REPLY  ' + r.id, r.x + 28, r.y + 49, 32, C.ink);
  r.words.forEach((w, i) => pen(c, w, r.x + 28, r.y + 135 + i * 63, 55, C.ink, 492));
}
export function judge(c, k) {
  base(c);
  const b = k.beat.beatIndex,
    { agree, flips, total } = judgeReport(JUDGE_ROWS);
  if (b === 0 || b === 1) {
    const swapping = ease(phase(k, 1, 'Swap the replies', 1.65)),
      pick = b === 1 && (swapping === 0 || phase(k, 1, 'judge picks the second slot again'));
    heading(c, 'PAIR TWO   /   HUMAN CHOSE B', 'Which reply wins the second reading?');
    if (b === 0 && !phase(k, 0, 'In pair two')) {
      calibration(c, { forward: !!phase(k, 0, 'first choices'), swap: false });
      if (phase(k, 0, 'Three out of four'))
        stamp(c, agree + ' / ' + total + ' agree', 1170, 718, C.green);
      return;
    }
    if (phase(k, 1, 'Compare identities on all four pairs')) {
      calibration(c, { forward: true, swap: true });
      if (phase(k, 1, 'Two choices flip'))
        stamp(c, flips + ' / ' + total + ' choices flip', 1120, 558, C.wood);
      return;
    }
    replyPositions(swapping).forEach((r) => quote(c, r));
    line(c, 146, 850, 695, 850, C.rule, 3);
    line(c, 806, 850, 1355, 850, pick ? C.green : C.rule, pick ? 9 : 3);
    mid(c, 'Slot 1', 421, 914, 36);
    mid(c, 'Slot 2', 1081, 914, 36);
    if (pick)
      stamp(
        c,
        'Judge chose ' + replyPositions(swapping).sort((a, b) => a.x - b.x)[1].id,
        1389,
        494,
        C.green,
        435,
      );
    return;
  }
  if (b <= 3) {
    heading(
      c,
      'CALIBRATION   /   ORIGINAL REPLY IDENTITIES',
      b === 2 ? 'Compare each choice with its reference' : 'Keep the judge advisory',
    );
    calibration(c, { forward: true, swap: true });
    mono(
      c,
      'Agreement   ' + agree + ' / ' + total + ' = 75%    (need ≥ 90%)',
      1106,
      457,
      34,
      C.red,
      728,
    );
    mono(
      c,
      'Order flips   ' + flips + ' / ' + total + ' = 50%    (allow ≤ 5%)',
      1106,
      569,
      34,
      C.red,
      728,
    );
    if (b === 3) stamp(c, 'Repeat both orders on new pairs', 1106, 718, C.wood, 700);
    return;
  }
  if (b === 4) {
    heading(c, 'INDEPENDENT GATES', 'Grade the action and the wording separately');
    sheet(c, 125, 361, 782, 450, 'Host decision');
    row(c, 'Private read', 'denied', 167, 530, 694);
    stamp(c, 'Forbidden attempt', 169, 627, C.red);
    sheet(c, 997, 361, 783, 450, 'Language rubric');
    row(c, 'Reply clarity', 'clear', 1041, 530, 690);
    mono(c, 'Advisory rating', 1042, 695, 37);
    return;
  }
  heading(
    c,
    'JUDGE INPUT   /   CANDIDATE-AUTHORED TEXT',
    'Who has authority to make this decision?',
  );
  sheet(c, 130, 339, 930, 454, 'Message submitted for rating');
  mono(c, 'quoted_reply', 168, 519, 34);
  pen(c, '“Find River Stories in your holds.”', 164, 621, 46, C.ink, 843);
  sheet(c, 1147, 339, 634, 454, 'Judge permissions');
  row(c, 'Read', 'quoted text', 1180, 516, 561);
  row(c, 'Write', 'rating only', 1180, 614, 561);
  if (b === 6) stamp(c, 'Review sensitive cases', 1180, 684, C.wood, 559);
}
function calibration(c, { forward, swap }) {
  const X = [152, 351, 577, 812];
  ['Pair', 'Human', 'Forward', 'Swapped'].forEach((v, i) => mono(c, v, X[i], 343, 28));
  JUDGE_ROWS.forEach((r, i) => {
    const y = 428 + i * 104;
    rect(c, 112, y - 54, 928, 85, i === 1 ? C.light : C.sheet, 4);
    [String(i + 1), r.human, forward ? r.forward : '·', swap ? r.swap : '·'].forEach((v, j) =>
      type(c, v, X[j], y + 7, 45, j === 3 && swap && r.swap !== r.forward ? C.red : C.ink, 'Mono'),
    );
  });
}
