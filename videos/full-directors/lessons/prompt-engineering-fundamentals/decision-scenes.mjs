import {
  C,
  title,
  rect,
  line,
  txt,
  label,
  result,
  sheet,
  cue,
  arrow,
  circle,
  poly,
} from './art.mjs';
import {
  facts,
  good,
  cases,
  oldPass,
  newPass,
} from '../../../films/prompt-engineering-fundamentals/fixtures.mjs';
import {
  expectedFields,
  responseChecks,
} from '../../../films/prompt-engineering-fundamentals/model.mjs';
import { offeredDeadline } from './clock-scenes.mjs';

const stale = { ...good, deadline_minutes: offeredDeadline };
export const staleVerdict = responseChecks(JSON.stringify(stale));
export function provenance(c, k) {
  const i = k.beat.beatIndex,
    lookup = cue(k, 1, 'fetch the current rule', 1);
  const compare = cue(k, 1, 'borrows ninety', 1);
  title(c, 'Which source owns the deadline?');
  sheet(c, 116, 255, 691, 316, '#f5e1c7');
  label(c, 'ARCHIVED EXERCISE   /   USER NOTE', 153, 324, C.muted, 26);
  txt(c, '“Last exercise:', 153, 410, 52, C.ink, 'Serif');
  txt(c, offeredDeadline + ' minutes.”', 153, 483, 55, C.ink, 'Serif');
  if (lookup) {
    rect(c, 1086, 247, 699, 320, C.green, 12);
    sheet(c, 1114, 257, 672, 309);
    label(c, 'APPROVED STORAGE    /    IR-7', 1150, 325, C.green);
    txt(c, 'First page within', 1150, 414, 49, C.ink, 'Serif');
    txt(c, facts.deadline + ' min of declaration', 1150, 487, 51, C.green, 'Serif');
  }
  if (compare) {
    line(c, 460, 574, 460, 687, C.muted, 4);
    line(c, 460, 687, 633, 687, C.muted, 4);
    arrow(c, 633, 687, 633, 757, C.muted, 4);
    line(c, 1440, 571, 1440, 687, C.green, 6);
    line(c, 1440, 687, 1300, 687, C.green, 6);
    arrow(c, 1300, 687, 1300, 757, C.green, 6);
    label(c, 'REPLY', 460, 809, C.blue);
    label(c, 'CURRENT RULE', 1210, 809, C.green);
    txt(c, stale.deadline_minutes + ' min', 470, 870, 66, C.blue, 'Mono');
    txt(c, facts.deadline + ' min', 1210, 870, 66, C.green, 'Mono');
    if (i === 2)
      txt(c, staleVerdict.policy ? 'agrees' : '≠', 962, 870, 94, C.red, 'Serif', 'center');
  } else {
    label(c, 'PAST EXERCISE', 161, 701);
    result(c, 'Filed with the ticket', 161, 785, C.muted);
  }
}
export const reviewFields = expectedFields({ ...facts, ruleAvailable: false });
export function dispatch({ permission, policyCurrent, claimed }) {
  if (!permission || !policyCurrent) return { claimed, sent: false };
  return { claimed: true, sent: !claimed };
}
export function execution(c, k) {
  const i = k.beat.beatIndex;
  if (i === 0) {
    title(c, 'Can this incident wait for review?');
    sheet(c, 118, 250, 796, 557);
    label(c, 'MODEL PROPOSAL', 168, 332, C.blue);
    txt(c, reviewFields.action, 168, 455, 64, C.ink, 'Mono');
    txt(c, 'null   null   []', 168, 555, 44, C.muted, 'Mono');
    const compared = cue(k, 0, 'Compare the decision');
    label(c, 'KNOWN UNPAGED P1    /    IR-7', 1001, 332, C.green);
    txt(c, good.action, 1001, 455, 64, C.green, 'Mono');
    if (compared) result(c, 'Wrong fallback', 1001, 580, C.red, 58);
    if (cue(k, 0, 'harmless marker')) {
      line(c, 153, 825, 1763, 825, C.hair);
      txt(
        c,
        'Literal-copy check   /   Search the reply for TEST-MARIGOLD',
        155,
        875,
        37,
        C.muted,
        'Mono',
      );
    }
    return;
  }
  title(c, 'Which worker can send the first page?', true);
  const other = cue(k, 1, 'another worker sends', 1);
  const stopped = cue(k, 3, 'loses the claim', 0.8);
  const claimed = other === 1;
  label(c, 'AUTHORIZED DISPATCHER', 979, 275, C.mint);
  label(c, 'VALIDATED SNAPSHOT   /   I-12', 121, 275, C.sky);
  const lanes = [
    ['Worker A', false],
    ['Worker B', true],
  ];
  lanes.forEach(([s, isB], j) => {
    const y = 404 + 251 * j;
    txt(c, s, 125, y, 51, C.light, 'Serif');
    txt(c, 'read unpaged', 125, y + 69, 35, C.sky, 'Mono');
    const progress = isB ? 0.37 + 0.63 * stopped : other;
    line(c, 484, y - 11, 967, y - 11, '#62777a', 4);
    circle(c, 493 + 460 * progress, y - 11, 14, isB ? C.brass : C.mint);
  });
  rect(c, 997, 345, 802, 445, C.night, 18, '#779094');
  label(c, 'ATOMIC FIRST-PAGE CLAIM    /    I-12', 1040, 416, C.mint, 28);
  const first = dispatch({ permission: true, policyCurrent: true, claimed: false });
  const second = dispatch({ permission: true, policyCurrent: true, claimed: first.claimed });
  result(
    c,
    claimed && first.sent ? 'A owns the first page' : 'Slot available',
    1040,
    536,
    C.light,
    58,
  );
  line(c, 1040, 587, 1742, 587, '#6e8386', 2);
  if (stopped === 1)
    result(c, second.sent ? 'B sends' : 'B stops · already claimed', 1040, 700, C.peach, 48);
  else
    txt(
      c,
      claimed ? 'One page recorded' : 'Fresh policy + permission',
      1040,
      700,
      38,
      C.mint,
      'Mono',
    );
  txt(
    c,
    'Recommendation carries incident ID, rule version and validation result.',
    125,
    855,
    41,
    C.light,
    'Serif',
  );
}
export const pairs = cases.map((name, i) => ({ name, old: oldPass[i], revised: newPass[i] }));
function scoreMark(c, x, y, pass) {
  circle(c, x, y, 26, pass ? C.green : C.red);
  if (pass) {
    line(c, x - 12, y - 1, x - 3, y + 9, C.white, 4);
    line(c, x - 3, y + 9, x + 13, y - 10, C.white, 4);
  } else {
    line(c, x - 9, y - 9, x + 9, y + 9, C.white, 4);
    line(c, x - 9, y + 9, x + 9, y - 9, C.white, 4);
  }
}
export function paired(c, k) {
  title(c, 'What do equal scores hide?');
  const opened = cue(k, 1, 'Walk through', 3);
  const labels = cue(k, 2, 'The prior-page case improves');
  sheet(c, 155, 217, 1592, 724);
  label(c, 'SUPPLIED CASE', 215, 304);
  label(c, 'OLD', 865, 304);
  label(c, 'REVISED', 1114, 304);
  let oldCount = 0,
    newCount = 0;
  pairs.forEach((row, j) => {
    const y = 377 + j * 77,
      seen = opened > j / pairs.length;
    if (labels && row.old !== row.revised)
      rect(c, 195, y - 45, 1490, 63, row.revised ? '#d6e5c8' : '#f3d6c3', 6);
    txt(c, row.name, 225, y, 39, C.ink, 'Serif');
    if (seen) {
      scoreMark(c, 905, y - 10, row.old);
      scoreMark(c, 1190, y - 10, row.revised);
      oldCount += Number(row.old);
      newCount += Number(row.revised);
    }
    if (labels && row.old !== row.revised)
      txt(
        c,
        row.revised ? 'fixed' : 'regressed',
        1364,
        y,
        35,
        row.revised ? C.green : C.red,
        'Mono',
      );
  });
  line(c, 212, 796, 1677, 796, C.hair, 2);
  if (opened) {
    txt(c, opened === 1 ? 'Full decisions correct' : 'Passing so far', 226, 831, 43, C.ink, 'Serif');
    txt(c, oldCount + ' / ' + pairs.length, 905, 830, 45, C.ink, 'Mono', 'center');
    txt(c, newCount + ' / ' + pairs.length, 1190, 830, 45, C.ink, 'Mono', 'center');
  }
}
export function changes(c, k) {
  const i = k.beat.beatIndex;
  if (!i) {
    const lost = cue(k, 0, 'Now look at the unpaged incident');
    title(c, 'Read the fields behind the two changed rows');
    label(c, 'SUPPLIED CASE', 128, 305);
    label(c, 'OLD REPLY', 792, 305);
    label(c, 'REVISED REPLY', 1310, 305);
    function row(y, name, field, a, b) {
      line(c, 128, y - 67, 1779, y - 67, C.hair, 2);
      txt(c, name, 128, y + 9, 48, C.ink, 'Serif');
      label(c, field, 128, y + 77);
      txt(c, a, 792, y + 47, 42, lost && field === 'overdue' ? C.green : C.red, 'Mono');
      txt(c, b, 1310, y + 47, 42, field === 'overdue' ? C.red : C.green, 'Mono');
    }
    row(469, 'Prior page sent', 'action', good.action, reviewFields.action);
    if (lost) row(724, 'Unpaged at minute 31', 'overdue', 'true', 'false');
  } else {
    title(c, 'How should Luna compare the next three prompts?');
    const opened = cue(k, 1, 'add a boundary example'),
      last = cue(k, 1, 'one evidence sentence');
    label(c, 'DEVELOPMENT INCIDENTS', 129, 295, C.blue);
    [
      ['Instructions only', 'explanation: ""', 1],
      ['Add a boundary example', 'explanation: ""', opened],
      ['Add an explanation to instructions only', 'explanation: one evidence sentence', last],
    ].forEach(([s, value, show], j) => {
      if (!show) return;
      rect(c, 130, 340 + j * 110, 856, 92, C.white, 5);
      txt(c, s, 168, 382 + j * 110, 40, C.ink, 'Serif');
      txt(c, value, 168, 417 + j * 110, 27, C.blue, 'Mono');
    });
    if (cue(k, 1, 'Check the outer object')) {
      label(c, 'ALL THREE REPLIES', 134, 741, C.blue);
      txt(c, 'Check decision + explanation.', 133, 800, 43, C.ink, 'Serif');
      txt(c, 'Score decision with the four-field validator.', 133, 860, 40, C.ink, 'Serif');
    }
    line(c, 1063, 304, 1063, 836, C.hair, 2);
    rect(c, 1191, 390, 543, 300, C.mint, 8, C.green);
    poly(
      c,
      [
        [1193, 391],
        [1460, 556],
        [1732, 391],
      ],
      '#d9ecd7',
    );
    line(c, 1193, 391, 1460, 556, C.green, 3);
    line(c, 1460, 556, 1732, 391, C.green, 3);
    txt(c, 'FINAL INCIDENTS', 1460, 637, 35, C.green, 'Mono', 'center');
    if (cue(k, 1, 'Keep related tickets'))
      result(c, 'Split by incident family.', 1193, 806, C.green, 47);
    txt(c, 'Fix the model, settings, tools and runbook across runs.', 129, 696, 36, C.ink, 'Serif');
  }
}
