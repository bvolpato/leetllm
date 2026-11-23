import {
  C,
  arrow,
  band,
  bird,
  cue,
  disc,
  lines,
  mix,
  mono,
  paper,
  path,
  serif,
  stage,
  title,
  traffic,
} from './drawing.mjs';
import { clockTime } from '../../../films/tool-protocol/fixtures.mjs';
import { evaluateShift, shiftReads, shiftRuns } from '../../../films/tool-protocol/model.mjs';

export function reportState(t) {
  const second = !!cue(t, 3, 'Request seventy-two');
  const read = shiftReads[Number(second)];
  const arrived = second
    ? !!cue(t, 4, 'Reply seventy-two carries')
    : !!cue(t, 1, 'reply echoes seventy-one');
  const inspected =
    arrived &&
    (second ? !!cue(t, 4, 'Both release IDs match') : !!cue(t, 2, 'Read the release field'));
  const retained = !!cue(t, 3, 'Reject the reading');
  const accepted = inspected && read.accepted && !!cue(t, 4, 'lead can report');
  const policyMissing = !!cue(t, 4, 'policy lookup has timed out');
  return { read, second, arrived, inspected, retained, accepted, policyMissing };
}
function pair(c, t) {
  const s = reportState(t),
    r = s.read;
  stage(c, true);
  mono(c, 'INCIDENT REPORT   /   02:12', 99, 65, 31, C.mint);
  const x = 91,
    w = 1415;
  paper(c, x, 128, w, 516);
  mono(c, 'RELEASE STATUS REQUEST', 148, 193, 29, C.secondary);
  mono(c, 'DEPLOYMENTS RECEIPT', 851, 193, 29, C.secondary);
  path(
    c,
    [
      [788, 163],
      [788, 610],
    ],
    C.rule,
    3,
    [9, 11],
  );
  mono(c, 'Exchange', 150, 275, 29, C.secondary);
  mono(c, r.id, 473, 274, 76);
  if (s.arrived) {
    mono(c, r.id, 857, 275, 76);
    path(
      c,
      [
        [600, 273],
        [798, 273],
      ],
      C.teal,
      5,
    );
    mono(c, 'complete   ·   isError false', 1003, 277, 27, C.secondary, 'left', 430);
  }
  path(
    c,
    [
      [150, 350],
      [1440, 350],
    ],
    C.rule,
    2,
  );
  mono(c, 'Requested release', 148, 404, 29, C.secondary);
  serif(c, r.requested, 147, 502, 76, C.ink, 'left', 598);
  if (s.arrived && (s.second || t.beat.beatIndex > 0)) {
    mono(c, 'Returned release_id', 849, 404, 29, C.secondary);
    serif(c, r.payload.release_id, 847, 502, 76, C.ink, 'left', 600);
    if (s.inspected) {
      const keyColor = s.retained && !s.second ? C.red : s.accepted ? C.teal : C.secondary;
      path(
        c,
        [
          [152, 555],
          [617, 555],
        ],
        keyColor,
        4,
      );
      path(
        c,
        [
          [850, 555],
          [1314, 555],
        ],
        keyColor,
        4,
      );
    }
    mono(
      c,
      r.payload.status + '   /   ' + r.payload.health,
      850,
      602,
      27,
      C.secondary,
      'left',
      589,
    );
  } else
    mono(
      c,
      'Awaiting ' + (s.arrived ? 'payload inspection' : 'receipt'),
      850,
      502,
      34,
      C.secondary,
    );
  if (s.retained) mono(c, 'Trace   #71   v17   /   wrong target', 102, 713, 32, C.coral);
  if (s.accepted) {
    band(c, 850, 710, 'File #72   /   clean v18', true);
    mono(c, r.source + '   /   ' + clockTime(r.observedAt), 854, 783, 31, C.white);
  } else if (!s.second && t.beat.beatIndex === 1)
    serif(c, 'File this under v18?', 105, 755, 51, C.gold);
  if (s.policyMissing) mono(c, 'Policy receipt missing   /   shift held', 104, 828, 30, C.gold);
}
function lostReceipt(c, t) {
  stage(c, false);
  title(c, 'SEPARATE TEST   /   APPROVED WRITE', 'How many traffic changes occurred?');
  mono(c, 'Host', 125, 304, 38);
  mono(c, 'Backend', 1296, 304, 38);
  if (cue(t, 5, 'approved write left the host')) {
    arrow(c, 140, 394, 1420, 394, C.teal, 7);
    mono(c, 'Approved write sent', 507, 349, 34, C.teal);
  }
  if (cue(t, 5, 'reply went missing')) {
    path(c, [[1422, 499], [903, 499]], C.red, 5, [12, 12]);
    disc(c, 900, 499, 13, C.red);
    mono(c, 'No reply', 1102, 555, 32, C.red);
  }
  traffic(c, 120, 668, 733, 135, null, {
    showResult: cue(t, 6, 'That count is unknown'),
    caption: 'Applied traffic changes',
  });
  if (cue(t, 6, 'Check the backend'))
    lines(
      c,
      975,
      680,
      ['Reconcile the backend', 'Retry with the bound key', 'if the backend supports it.'],
      { gap: 54, size: 32 },
    );
}
function matrix(c, t) {
  stage(c, false);
  title(c, 'TRAJECTORY EVALUATION', 'Which boundary does a test exercise?');
  const cases = [
    ['Catalog change', 'Model exposure'],
    ['Different caller', 'Access decision'],
    ['Wrong release or schema', 'Grounding'],
    ['Deadline or byte limit', 'Bounded completion'],
  ];
  cases.forEach(([a, b], i) => {
    const y = 299 + i * 118;
    mono(c, a, 121, y, 38);
    arrow(c, 715, y, 866, y, C.rule, 4);
    mono(c, b, 950, y, 38, C.teal);
  });
  if (cue(t, 6, 'latency and token use'))
    mono(c, 'Also measure latency, token use and appropriate refusals.', 117, 812, 29, C.secondary);
}
function trajectories(c, t) {
  stage(c, true);
  title(
    c,
    'SAME CATALOG   /   SAME MISSING POLICY',
    'Where did each proposed write stop?',
    true,
  );
  const b = t.beat.beatIndex + 1;
  mono(c, 'HOST', 255, 281, 28, C.light);
  mono(c, 'DISPATCH', 705, 281, 28, C.gold);
  mono(c, 'SERVER', 1238, 281, 28, C.light);
  path(
    c,
    [
      [778, 317],
      [778, 667],
    ],
    C.gold,
    3,
    [9, 11],
  );
  shiftRuns.forEach((run, i) => {
    const a = evaluateShift(run),
      y = 400 + i * 210,
      show = i ? cue(t, 7, 'In run B') : cue(t, 7, 'in run A');
    mono(c, run.name, 109, y, 69, C.white);
    path(
      c,
      [
        [245, y],
        [1405, y],
      ],
      C.grid,
      7,
    );
    const stop = a.sent ? 1297 : 709;
    if (show) {
      const graded = cue(t, 10, i ? 'Run B fails' : 'Run A passes');
      const color = graded ? (a.passes ? C.mint : C.coral) : C.white;
      const track = i
        ? cue(t, 7, 'host sends it', 0.55)
        : cue(t, 7, 'holds it before dispatch', 0.55);
      path(
        c,
        [
          [245, y],
          [mix(245, stop, track), y],
        ],
        color,
        8,
      );
      if (track === 1) {
        path(
          c,
          [
            [stop, y - 17],
            [stop, y + 17],
          ],
          color,
          6,
        );
        if (!i || cue(t, 7, 'server denies it'))
          mono(
            c,
            i ? 'Denied at server' : 'Held at host',
            stop,
            y + 52,
            29,
            color,
            'right',
          );
      }
      if (cue(t, 8, 'Both see traffic unchanged'))
        mono(c, 'changes   ' + a.effects, 1430, y - 43, 29, C.light, 'right');
      if (graded)
        band(
          c,
          263,
          y + 115,
          (a.passes ? 'PASS' : 'FAIL') +
            '   /   ' +
            a.forbidden +
            ' forbidden ' +
            (a.forbidden === 1 ? 'attempt' : 'attempts'),
          a.passes,
        );
    }
  });
  if (cue(t, 8, 'accurate explanation'))
    mono(c, 'Each explanation matches its trace', 100, 218, 27, C.light);
  if (b === 9)
    serif(c, 'Every forbidden attempt fails the test. Which run passes?', 105, 794, 45, C.gold);
}
function filed(c) {
  stage(c, false);
  const r = shiftReads.find((v) => v.accepted);
  paper(c, 98, 105, 1398, 652);
  mono(c, 'INCIDENT REPORT', 163, 172, 35, C.secondary);
  mono(c, clockTime(r.observedAt), 1419, 171, 42, C.ink, 'right');
  path(
    c,
    [
      [164, 232],
      [1424, 232],
    ],
    C.rule,
    3,
  );
  bird(c, 295, 371, 1.4);
  serif(c, r.requested, 477, 322, 89);
  mono(c, r.payload.status, 478, 414, 48, C.teal);
  mono(
    c,
    r.source + '   /   receipt ' + r.id + '   /   observed ' + clockTime(r.observedAt),
    165,
    507,
    34,
  );
  traffic(c, 164, 624, 690, 89, 0, { caption: 'Traffic changes' });
  mono(c, 'Policy lookup timed out', 919, 619, 33, C.red);
  mono(c, 'shift_traffic held', 920, 687, 36);
  mono(c, 'Trace retains #71 for reranker-v17.', 114, 56, 31, C.secondary);
}
export function report(c, t) {
  const b = t.beat.beatIndex + 1;
  if (b <= 4) pair(c, t);
  else if (b === 5 || (b === 6 && !cue(t, 6, 'Across these tests'))) lostReceipt(c, t);
  else if (b === 6) matrix(c, t);
  else if (b < 11) trajectories(c, t);
  else filed(c);
}
