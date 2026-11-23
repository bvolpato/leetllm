import {
  C,
  stage,
  heading,
  txt,
  serif,
  mono,
  center,
  box,
  line,
  dot,
  chip,
  plate,
  slot,
  chassis,
  arrow,
  file,
  mix,
  smooth,
  cue,
  windowText,
  dial,
  poly,
} from './bench.mjs';
import {
  CASES,
  caseNames,
  accepted,
  canaryWindows,
  canonicalFresh,
  fresh,
  reports,
  refusalCount,
  runs,
  prefix,
  suiteSha,
  sha,
} from './experiment.mjs';

export function splits(c, k) {
  stage(c);
  heading(c, 'Evaluation access  /  case provenance', 'Where did the tuning signal come from?');
  const t = cue(k, 1, 'Follow those two inspected cases', 2.4);
  const moves = [smooth(Math.min(1, t * 2)), smooth(Math.max(0, t * 2 - 1))];
  const moved = moves.filter((v) => mix(361, 62, v) + 232 <= 310).length;
  for (let i = 0; i < 3; i++) {
    const x = 47 + i * 300;
    plate(c, x, 143, 263, 306, i === 2 ? '#e0e4d2' : C.paper);
    txt(c, ['Development', 'Reserved cases', 'Fresh final set'][i], x + 15, 175, 23, C.ink, {
      bold: true,
    });
    line(c, x + 13, 203, x + 248, 203, C.line);
  }
  CASES.forEach((row, i) => {
    const isHold = i > 1,
      p = isHold ? moves[i - 2] : 1;
    const x = isHold ? mix(361, 62, p) : 62;
    const y = isHold ? mix(222 + (i - 2) * 53, 222 + i * 53, p) : 222 + i * 53;
    chip(c, x, y, 232, 43, caseNames[i], isHold ? C.amber : C.ice);
  });
  if (k.beat.beatIndex === 1) {
    const newCases = [
      'New support shape',
      'New rollback shape',
      'Missing approval',
      'Conflicting record',
    ];
    newCases.forEach((name, i) => {
      box(c, 660, 222 + i * 48, 234, 37, C.light, 4, C.line);
      txt(c, name, 672, 242 + i * 48, 17, C.mid);
    });
    mono(c, '0 / 4 scored', 660, 429, 16, C.green);
  } else {
    slot(c, 678, 261, 200, 91);
    center(c, 'Sealed', 778, 301, 24, C.metal);
  }
  mono(c, 2 + moved + ' development cases', 51, 480, 18, C.green);
}
export function canary(c, k) {
  const b = k.beat.beatIndex + 1;
  stage(c);
  if (b < 3) {
    heading(c, 'Development contract', 'Nominate one artifact for review');
    reports.forEach((r, i) => {
      const x = 50 + i * 296;
      chip(c, x, 159, 267, 74, 'Run ' + (i + 1), C.ice, candidateLabel(i));
      windowText(
        c,
        x,
        257,
        267,
        63,
        r.unsafe
          ? r.unsafe + ' unsafe serves'
          : r.unnecessary
            ? refusalCount(r)
            : 'Checks pass',
        r.unsafe || r.unnecessary ? C.pink : C.mint,
        21,
      );
    });
    if (cue(k, 1, 'Its nomination records')) {
      mono(c, 'Source  ' + accepted[0].id + '    Suite  ' + prefix(suiteSha), 54, 371, 19, C.green);
      mono(c, 'Fallback  ' + accepted[0].knownGood, 54, 407, 19, C.ink);
    }
    if (b === 2)
      txt(c, 'Known-good release serves production traffic.', 53, 468, 23, C.ink, { bold: true });
  } else {
    heading(
      c,
      'Approved canary  /  independent review windows',
      'What happens to canary traffic?',
    );
    const windows = canaryWindows(k);
    const active = windows.at(-1);
    mono(c, 'Window', 67, 157);
    mono(c, 'Unsafe claims', 190, 157);
    mono(c, 'Reviews', 396, 157);
    mono(c, 'Canary action', 603, 157);
    windows.forEach((window, i) => {
      const { unsafe, complete, action } = window;
      const y = 188 + i * 67;
      plate(c, 50, y, 860, 53, window === active ? C.light : C.deck);
      mono(c, String(i + 1), 67, y + 26, 21, C.mid);
      mono(c, String(unsafe), 192, y + 26, 23, unsafe ? C.red : C.ink);
      txt(c, complete ? 'Complete' : 'Incomplete', 396, y + 26, 20);
      mono(
        c,
        action,
        603,
        y + 26,
        17,
        action === 'Pending' ? C.mid : unsafe ? C.red : complete ? C.green : C.brass,
      );
    });
    mono(c, 'Traffic', 54, 443, 16);
    line(c, 139, 443, 536, 443, C.green, 7);
    dot(c, 177, 443, 5, C.mint);
    txt(c, 'Production · known-good release', 552, 443, 19, C.green);
    line(c, 208, 443, 255, 484, C.green, 3);
    line(c, 255, 484, 355, 484, C.green, 3);
    const { serving, action } = active;
    const state = serving ? 'serving' : action === 'ABORT CANARY' ? 'stopped' : 'paused';
    line(c, 408, 484, 537, 484, serving ? C.green : C.line, 3);
    line(c, 355, 484, 408, serving ? 484 : 464, serving ? C.green : C.brass, 5);
    dot(c, 355, 484, 4, C.ink);
    dot(c, 408, 484, 4, C.ink);
    txt(c, 'Window ' + windows.length + ' · canary ' + state, 552, 484, 19, serving ? C.green : C.brass);
  }
}
function candidateLabel(i) {
  return ['Always serve', 'Release only', 'Release or runbook'][i];
}
const program = {
  signature: 'evidence → route',
  instruction: 'Use documented support.',
  demonstrations: ['freeze', 'rollback'],
};
const compiledBytes = JSON.stringify(program),
  compiledSha = prefix(sha(compiledBytes));
export function optimizer(c, k) {
  const b = k.beat.beatIndex + 1;
  stage(c);
  heading(
    c,
    'Compiled prompt program  /  illustrative candidate',
    b === 2
      ? 'Which cases shaped the program?'
      : b === 3
        ? 'Freeze the selected bytes'
        : 'What did the optimizer select?',
  );
  if (b === 2) {
    const t = smooth(cue(k, 2, 'while choosing', 1.2));
    file(
      c,
      57,
      175,
      292,
      184,
      'Final cases',
      ['Intended for final test', t === 1 ? 'Results seen in tuning' : 'Candidate selection'],
      C.paper,
    );
    line(c, 371, 256, 371 + 137 * t, 256, C.red, 4);
    if (t === 1) arrow(c, 494, 256, 516, 256, C.red, 4);
    chassis(c, 544, 173, 366, 191);
    txt(c, 'Demo selection', 568, 211, 25, C.light);
    slot(c, 570, 248, 314, 74);
    if (t === 1) {
      chip(c, 570, 248, 314, 74, 'Selected examples', C.amber, 'influenced by final cases');
      txt(c, 'Use a fresh independent set for the final estimate.', 57, 442, 22, C.red);
    }
  } else {
    file(c, 55, 153, 390, 236, 'compiled-program.json', [
      program.signature,
      program.instruction,
      'demos: freeze, rollback',
      'SHA  ' + compiledSha,
    ]);
    if (b === 1) {
      chassis(c, 486, 151, 421, 239);
      txt(c, 'Source run', 510, 190, 26, C.light, { bold: true });
      [
        'Optimizer + model revision',
        'Train / development / final IDs',
        'Metric version + case reports',
      ].forEach((v, i) => txt(c, v, 511, 251 + i * 44, 19, C.mint));
      txt(c, 'Keep each rejected candidate with its report.', 55, 454, 21, C.ink);
    } else {
      arrow(c, 466, 254, 555, 254, C.green);
      plate(c, 583, 163, 325, 215);
      txt(c, 'Independent final test', 599, 202, 23, C.ink, { bold: true });
      [
        'Factual support and safety',
        'Matched latency and cost',
        'Loaded artifact and settings',
      ].forEach((v, i) => txt(c, v, 600, 247 + i * 39, 18, C.mid));
      mono(c, 'Frozen program SHA  ' + compiledSha, 54, 454, 20, C.green);
    }
  }
}
export function selection(c, k) {
  stage(c);
  const b = k.beat.beatIndex + 1;
  heading(
    c,
    'Release review  /  development evidence',
    b === 3 ? 'Open the nomination' : 'Which candidate handles both kinds of request?',
  );
  if (b < 3) {
    const selected = !!cue(k, 2, 'Nominate run three');
    const cols = [365, 557, 749];
    mono(c, 'Frozen case · expected route', 50, 155, 16);
    reports.forEach((r, i) => {
      chip(c, cols[i], 126, 156, 54, 'Run ' + (i + 1), selected && i === 2 ? C.mint : C.deck);
    });
    CASES.forEach((row, j) => {
      const y = 218 + j * 50;
      txt(c, caseNames[j], 50, y, 19, C.ink);
      mono(c, row.expected, 233, y, 16, C.mid);
      reports.forEach((r, i) => {
        const got = r.rows[j].predicted;
        box(c, cols[i], y - 19, 156, 37, C.light, 4, C.line, 1);
        center(c, got, cols[i] + 78, y, 17, selected && got !== row.expected ? C.red : C.ink, {
          face: 'Mono',
        });
      });
    });
    if (selected)
      windowText(c, 50, 428, 855, 59, 'Run 3 nominated for fresh evaluation', C.mint, 25);
  } else {
    const chosen = accepted[0];
    file(c, 52, 149, 409, 246, 'Nomination · run 3', [
      chosen.candidate,
      'suite  ' + prefix(chosen.context.suite),
      'fallback  ' + chosen.knownGood,
      'status  awaiting release review',
    ]);
    file(c, 508, 149, 399, 246, 'Saved evidence', [
      'hold_001   SERVE',
      'report  ' + prefix(chosen.artifacts.report.digest),
      'manifest  ' + prefix(chosen.artifacts.manifest.digest),
    ]);
    txt(c, 'Next checks', 54, 445, 22, C.green, { bold: true });
    txt(
      c,
      'Fresh factual answers · workload latency and cost · release approval',
      207,
      445,
      19,
      C.ink,
      { max: 700 },
    );
  }
}
const caseX = (i) => 145 + 127 * i;
export function finalPractice(c, k) {
  const b = k.beat.beatIndex + 1,
    s = fresh(k);
  stage(c);
  if (b === 6) {
    heading(c, 'Optimizer review', 'Open the program behind the score');
    const follow = cue(k, 6, 'back to the run'),
      open = cue(k, 6, 'open the program');
    chassis(c, 54, 166, 219, 173);
    txt(c, 'Winning score', 73, 204, 23, C.light, { bold: true });
    txt(c, 'Selected by the', 74, 261, 18, C.mint);
    txt(c, 'declared rule', 74, 286, 18, C.mint);
    if (follow) {
      arrow(c, 290, 252, 359, 252);
      chip(c, 378, 207, 192, 92, 'Source run', C.ice, 'artifact digest');
    }
    if (open) {
      arrow(c, 589, 252, 650, 252);
      file(c, 670, 159, 239, 202, 'Compiled program', [
        program.instruction,
        'Demos: ' + program.demonstrations.join(', '),
        'SHA ' + compiledSha,
      ]);
    }
    return;
  }
  heading(
    c,
    'Fresh records  /  two six-case reports',
    b >= 5 ? 'Two verified records still tie' : 'What can each run recover?',
  );
  const x0 = caseX(0),
    w = 100,
    h = 48;
  for (let i = 0; i < 6; i++) {
    const x = caseX(i);
    center(c, canonicalFresh[i].id, x + w / 2, 143, 20, C.ink, { face: 'Mono', bold: true });
    slot(c, x, 176, w, h);
    slot(c, x, 295, w, h);
  }
  mono(c, 'CASE ID', 38, 143, 15, C.mid);
  mono(c, 'R8', 48, 198, 24, C.ink);
  mono(c, 'R9', 48, 319, 24, C.ink);
  s.r8.rows.forEach((row, i) => {
    const dup = i === 5 && row.id === 'A';
    const cross = Math.min(1, Math.max(0, (s.aligned - 0.2) / 0.65));
    const x = dup ? mix(caseX(5), x0, cross) : caseX(i);
    // Offset the top copy so both identical identities can be read at the A socket.
    const y =
      176 +
      (dup ? 58 * Math.min(1, s.aligned / 0.2) - 13 * Math.max(0, (s.aligned - 0.85) / 0.15) : 0);
    chip(c, x, y, w, h, row.id, dup ? C.amber : C.ice, row.predicted);
  });
  if (s.removed && cue(k, 3, 'Read F’s original result') && s.insert < 1) {
    chip(c, caseX(5), mix(238, 176, s.insert), w, h, 'F', C.mint, freshOriginalF().predicted);
    if (!s.insert) mono(c, 'original', caseX(5) - 12, 260, 14, C.green, { align: 'right' });
  }
  const hasNine = !!cue(k, 1, 'R nine kept');
  if (hasNine)
    s.r9.rows.forEach((row, i) => chip(c, caseX(i), 295, w, h, row.id, C.ice, row.predicted));
  if (hasNine) {
    mono(c, 'R9 temperature', 52, 408, 17, C.ink);
    dial(c, 309, 412, 35, 0, 'Evaluated');
    dial(c, 447, 412, 35, s.r9.temp, 'Loaded');
    if (b >= 5) {
      windowText(c, 562, 386, 330, 60, s.qualified + ' eligible · apply tie rule', C.amber, 18);
    } else if (b >= 3) {
      mono(
        c,
        'R8   ' + (s.r8.canonical ? '6 distinct IDs' : 'Recovery in progress'),
        560,
        404,
        16,
        s.r8.canonical ? C.green : C.brass,
      );
      mono(
        c,
        'R9   ' + (s.readback ? 'readback matches' : 'check loaded setting'),
        560,
        440,
        16,
        s.readback ? C.green : C.brass,
      );
    } else {
      mono(c, 'Reported score', 568, 396, 17, C.mid);
      txt(c, '6 / 6 in both runs', 568, 432, 24, C.ink, { bold: true });
    }
  } else {
    mono(
      c,
      'R8   ' + s.r8.exact + ' / 6 saved matches   ·   worker matches evaluated settings',
      53,
      426,
      17,
      C.mid,
    );
  }
}
function freshOriginalF() {
  return canonicalFresh[canonicalFresh.length - 1];
}
