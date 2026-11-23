import {
  C,
  box,
  line,
  dot,
  txt,
  cap,
  wrap,
  sheet,
  rule,
  heading,
  cue,
  beat,
  label,
  clip,
  smooth,
  checkMark,
} from './studio.mjs';
import {
  human,
  judge,
  revise,
  countMatches,
  restoreReplies,
  aggregateSwaps,
  restoreVotes,
  fileCheck,
  fileMatches,
} from './specimens.mjs';
import { restoreBallots } from './ballots.mjs';
import { practiceReport } from './measures.mjs';

export function historyState(k) {
  const receipt = cue(k, 2, 'confirms that this rollback completed');
  const alternate = cue(k, 4, 'from completed to accepted');
  return { receipt, status: alternate ? 'accepted' : receipt ? 'completed' : null, alternate };
}
export function history(g, k) {
  const b = beat(k),
    s = historyState(k);
  heading(
    g,
    'Payment service  /  deployment record',
    'Would another rollback advance the incident?',
  );
  sheet(g, 112, 307, 1666, 181, C.milk);
  cap(g, 'PROPOSED REPLY', 174, 376, C.ink);
  txt(g, '“Run the rollback procedure.”', 580, 416, 58, C.ink, 'Serif');
  cap(g, 'ROLLBACK   rb-8912', 134, 587, C.blue, 29);
  if (b >= 2) cap(g, 'Latency 540 ms   /   threshold 500 ms', 880, 587, C.gold, 31);
  const states = ['planned', 'requested', 'accepted', 'completed', 'verified recovery'];
  const current = states.indexOf(s.status);
  states.forEach((w, i) => {
    const x = 193 + i * 381;
    if (i < 4) line(g, x, 716, x + 381, 716, i < current ? C.mint : C.line, 6);
    dot(g, x, 716, 21, i <= current ? C.mint : C.metal);
    if (i === current) dot(g, x, 716, 9, C.ink);
    txt(g, w, x, 794, i === 4 ? 32 : 37, i === current ? C.mint : C.dim, 'Sans', 'center');
  });
  if (!s.receipt) cap(g, 'Job history unavailable', 140, 909, C.dim, 33);
  else if (b >= 5) label(g, 'Accepted    →    inspect current job status', 132, 864, C.blue);
  else if (s.alternate) cap(g, 'Does the service say it finished?', 135, 911, C.gold, 35);
  else if (b === 3 || (b === 4 && !s.alternate))
    label(g, 'Completed    →    check current latency', 132, 864, C.mint);
  else label(g, 'Deployment receipt   COMPLETED', 132, 864, C.mint);
}
function replay(g, k) {
  const b = beat(k),
    six = cue(k, 2, 'The new one picks stepwise'),
    eight = cue(k, 3, 'new one chooses compact');
  const current = judge.map((v, i) =>
    i === 5 && six ? revise[i] : i === 7 && eight ? revise[i] : null,
  );
  cap(g, 'CASE', 133, 328);
  cap(g, 'HUMAN KEY', 425, 328);
  cap(g, 'OLD JUDGE', 874, 328);
  cap(g, 'NEW JUDGE', 1344, 328);
  human.forEach((h, i) => {
    const y = 401 + i * 62,
      changed = current[i] !== null;
    if (changed) box(g, 105, y - 41, 1644, 56, i === 5 ? '#31584f' : '#654646', 5);
    txt(g, ('0' + (i + 1)).slice(-2), 137, y, 33, C.dim, 'Mono');
    [h, judge[i], current[i] ?? (b >= 4 ? revise[i] : '·')].forEach((v, j) =>
      txt(
        g,
        v,
        [427, 875, 1345][j],
        y,
        38,
        j === 2 && changed ? (h === v ? C.mint : C.coral) : C.white,
        'Serif',
      ),
    );
  });
  if (b >= 4) {
    line(g, 110, 893, 1750, 893);
    cap(g, 'MATCH HUMAN', 135, 952);
    txt(g, countMatches(human, judge) + ' / 8', 875, 954, 45, C.gold);
    txt(g, countMatches(human, revise) + ' / 8', 1345, 954, 45, C.gold);
  }
}
export function transfer(g, k) {
  const b = beat(k);
  if (b === 8) return restoreBallots(g, k, true);
  heading(
    g,
    'Frozen configurations  /  held-out evaluation',
    b === 1
      ? 'Did the instrument improve?'
      : b <= 4
        ? 'Replay both judges against the same key'
        : b === 7
          ? 'Does the changed wording move the decision?'
          : 'Which cases belong in the final comparison?',
  );
  if (b === 1) {
    [
      ['Old judge', '83%', 'case set I   /   rubric v1'],
      ['New judge', '89%', 'case set II   /   rubric v2'],
    ].forEach(([n, p, r], i) => {
      const x = 122 + i * 857;
      sheet(g, x, 348, 793, 433, i ? C.gold : C.milk);
      cap(g, n, x + 63, 428, C.ink);
      txt(g, p, x + 57, 601, 128, C.ink, 'Serif');
      cap(g, r, x + 61, 714, C.ink);
    });
    return;
  }
  if (b <= 4) return replay(g, k);
  if (b === 7) {
    ['Could you check the job status?', 'Can you tell me how the job is going?'].forEach((s, i) => {
      const y = 338 + i * 223;
      sheet(g, 122, y, 1677, 177, i ? C.pulp : C.milk);
      cap(g, 'JOB 41', 188, y + 70, C.ink);
      txt(g, s, 523, y + 107, 48, C.ink, 'Serif');
    });
    cap(g, 'Hold facts fixed. Compare both the score and the review route.', 126, 910, C.blue);
  } else {
    const sets = [
      ['Development', 'Annotate close calls.', 'Refine the rubric.'],
      ['Held-out cases', 'Freeze both configurations.', 'Compare to independent labels.'],
    ];
    sets.forEach(([name, a, z], i) => {
      const x = 122 + 852 * i;
      box(g, x + 25, 333, 324, 86, i ? C.gold : C.blue, 18);
      box(g, x, 385, 791, 430, i ? C.gold : C.blue, 16);
      cap(g, name.toUpperCase(), x + 61, 445, C.ink, 31);
      line(g, x + 58, 481, x + 724, 481, '#00000038');
      wrap(g, a, x + 60, 573, 680, 47, C.ink, 59);
      wrap(g, z, x + 60, 699, 685, 43, C.ink);
    });
    if (b === 6)
      cap(
        g,
        'Revalidate after changes to the judge, rubric, generator or traffic.',
        127,
        930,
        C.mint,
      );
  }
}
export function restoreState(k) {
  const completed = cue(k, 4, 'restore completed');
  const opening = smooth(cue(k, 6, 'Open manifest', 1));
  const read = cue(k, 6, 'The recovered file contains');
  const compared = cue(k, 6, 'They match');
  return { completed, opening, read, compared };
}
function file(g, x, y, w, h, name, contents, color) {
  sheet(g, x, y, w, h, color);
  cap(g, name, x + 55, y + 62, C.ink, 25);
  line(g, x + 50, y + 87, x + w - 25, y + 87, '#00000038');
  if (contents)
    contents.split('\n').forEach((s, i) => txt(g, s, x + 55, y + 153 + i * 54, 40, C.ink, 'Mono'));
}
export function ending(g, k) {
  const b = beat(k);
  if (b === 1) return restoreBallots(g, k, false);
  if (b <= 3) return practiceReport(g, k);
  const s = restoreState(k);
  cap(g, 'BACKUP SERVICE    /    RESTORE 41', 119, 101, C.mint, 30);
  const advice = restoreReplies[aggregateSwaps(...restoreVotes)];
  sheet(g, 114, 152, 1673, 155, C.gold);
  cap(g, 'CLARITY PICK   alpha', 179, 222, C.ink, 30);
  txt(g, '“' + advice + '”', 663, 260, 63, C.ink, 'Serif');
  // The service control is fixed even while the file slides out of the recovered copy.
  box(g, 113, 377, 592, 539, C.deep, 26);
  box(g, 139, 401, 540, 173, C.metal, 12);
  for (let i = 0; i < 9; i++) box(g, 169 + i * 53, 424, 28, 15, C.deep, 5);
  dot(g, 180, 510, 10, s.completed ? C.mint : C.gray);
  txt(
    g,
    s.completed ? 'COMPLETED' : 'Job record closed',
    216,
    526,
    42,
    s.completed ? C.mint : C.white,
    'Mono',
  );
  cap(g, 'Restore job 41', 156, 641, C.dim, 30);
  box(g, 156, 706, 461, 100, C.metal, 14);
  txt(g, 'Run restore again', 386, 769, 35, C.dim, 'Sans', 'center');
  if (s.completed) cap(g, 'No new request', 157, 868, C.dim, 27);
  if (b < 6) {
    if (b === 5)
      wrap(g, 'What would show that the recovered copy is usable?', 830, 561, 900, 69, C.white, 87);
    else if (s.completed) {
      cap(g, 'SERVICE RECORD', 827, 481, C.blue);
      wrap(g, 'Restore 41 finished. No later change.', 826, 584, 899, 67, C.white, 84);
    } else {
      rule(g, 'SERVICE RECORD', 826, 481, 900);
      txt(g, 'Awaiting lookup', 826, 597, 54, C.dim, 'Serif');
    }
    return;
  }
  cap(g, 'KNOWN FILE   /   ' + fileCheck.name, 790, 401, C.blue, 30);
  file(g, 785, 459, 461, 281, 'Expected version', fileCheck.expected, C.milk);
  box(g, 1273, 455, 519, 293, C.deep, 8);
  clip(g, 1277, 459, 515, 291, () => {
    file(
      g,
      1284,
      755 - 296 * s.opening,
      502,
      280,
      'Recovered copy',
      s.read ? fileCheck.restored : '',
      C.pulp,
    );
  });
  if (!s.read) cap(g, 'Awaiting file contents', 802, 849, C.dim, 31);
  if (s.read && !s.compared) cap(g, 'Compare both lines.', 800, 849, C.gold, 31);
  if (s.compared) {
    label(
      g,
      fileMatches(fileCheck) ? 'Known file matches' : 'File differs',
      788,
      804,
      fileMatches(fileCheck) ? C.mint : C.coral,
    );
    txt(g, 'Restore requests   1', 1317, 852, 34, C.dim, 'Mono');
  }
}
