import * as E from './evidence.mjs';
import {
  C,
  cue,
  mix,
  ease,
  slide,
  rect,
  mark,
  key,
  line,
  dot,
  txt,
  label,
  heading,
  stamp,
  wrapped,
} from './art.mjs';

const caseX = [549, 827, 1105, 1383];
const runY = [279, 549];

function scoreCounter(c, rows, y) {
  rect(c, 66, y - 83, 309, 183, C.deep, C.line, 16, 3);
  label(c, rows[0].run, 91, y - 49, C.soft);
  line(c, 84, y - 21, 356, y - 21, C.line);
  txt(c, E.passCount(rows) + ' / ' + rows.length, 220, y + 36, 78, C.pale, 'Mono', 600, 'center');
}

function answerDrawer(c, row, index, y, openness, showCitations) {
  if (openness <= 0) return;
  const anchor = caseX[index];
  const top = y + 63;
  line(c, anchor, y + 42, anchor, top, C.amber, 4);
  const widthProgress = Math.min(1, openness / 0.75);
  const left = mix(anchor - 45, 420, widthProgress);
  const right = mix(anchor + 45, 1510, widthProgress);
  slide(c, left, top, right - left, 104);
  if (widthProgress < 1) return;
  c.save();
  c.globalAlpha *= (openness - 0.75) / 0.25;
  const note = row.id === E.note.id;
  label(c, note ? 'SAVED ANSWER' : 'RETURNED STATUS', 450, top + 27, C.muted);
  txt(c, note ? '“' + row.answer + '”' : row.status,
    450, top + 72, note ? 32 : 38, C.ink, note ? 'Serif' : 'Mono', 500, 'left', 612);
  line(c, 1080, top + 17, 1080, top + 88, '#a2b5a8');
  label(c, showCitations ? 'CITATIONS' : 'CITATIONS   ▸', 1108, top + 27, C.muted);
  if (showCitations)
    txt(c, JSON.stringify(row.citations), 1108, top + 73, 26, C.ink, 'Mono', 600, 'left', 375);
  c.restore();
}

export function opening(c, k) {
  const guide = ease(cue(k, 0, 'Read each column', 1));
  const rewording = ease(cue(k, 1, 'Start with the rewording', 0.65)) *
    (1 - ease(cue(k, 2, 'Back to the four marks', 0.55)));
  const note = ease(cue(k, 2, 'Open the private-note case', 0.75)) *
    (1 - ease(cue(k, 3, 'Close the case', 0.65)));
  const listsOpen = Boolean(cue(k, 2, 'Open the citation lists'));
  const gained = Boolean(cue(k, 3, 'The rewording gained'));
  const lost = Boolean(cue(k, 3, 'The private-note request lost'));
  const held = Boolean(cue(k, 3, 'Hold the candidate'));

  txt(c, 'First answers passed', 66, 89, 52, C.pale, 'Serif', 400);
  txt(c, E.base[0].dataset, 1510, 89, 24, C.soft, 'Mono', 500, 'right');
  line(c, 66, 135, 1510, 135);
  E.rowNames.forEach((name, i) => {
    const x = caseX[i];
    txt(c, name, x, 184, 30, C.pale, 'Sans', 600, 'center');
    c.save();
    c.globalAlpha *= 1 - Math.max(note, rewording);
    line(c, x, runY[0] + 44, x, runY[1] - 44, C.line);
    c.restore();
    if (guide > 0 && guide < 1) {
      dot(c, x, mix(runY[0] + 48, runY[1] - 48, guide), 6, C.soft);
    }
  });

  [E.base, E.hybrid].forEach((rows, j) => {
    const y = runY[j];
    scoreCounter(c, rows, y);
    rows.forEach((row, i) => {
      const x = caseX[i];
      slide(c, x - 96, y - 42, 192, 84);
      key(c, x - 46, y, E.keys[i], 45, C.blue);
      mark(c, x + 43, y, row.passed, 25, true);
      const selected = (i === 1 && rewording > 0) || (i === 3 && note > 0);
      if (selected) rect(c, x - 104, y - 50, 208, 100, null, C.amber, 7, 4);
    });
    answerDrawer(c, rows[1], 1, y, rewording, true);
    answerDrawer(c, rows[3], 3, y, note, listsOpen);
  });

  const footerY = 797;
  line(c, 66, 750, 1510, 750);
  if (note > 0) {
    txt(c, 'Required on N', 70, footerY, 28, C.amber, 'Mono', 600);
    txt(c, 'Abstain with an empty citation list.', 348, footerY, 38, C.pale, 'Serif');
  } else if (rewording > 0) {
    txt(c, 'Wording on R', 70, footerY, 28, C.amber, 'Mono', 600);
    txt(c, '“production API key”   →   “live-service credential”', 348, footerY, 38, C.pale, 'Serif');
  } else if (k.beat.beatIndex === 0) {
    txt(c, 'Where did the hybrid gain a pass? Where did it lose one?', 70, footerY, 40, C.pale, 'Serif');
  }
  if (gained || lost) {
    [1, 3].forEach((i) => {
      if (i === 1 ? !gained : !lost) return;
      const delta = Number(E.hybrid[i].passed) - Number(E.base[i].passed);
      const text = delta > 0 ? '+' + delta + ' pass' : '−' + Math.abs(delta) + ' pass';
      txt(c, text, caseX[i], runY[1] + 96, 32, delta > 0 ? C.teal : C.red, 'Mono', 600, 'center');
    });
  }
  if (held) stamp(c, 65, footerY - 34, E.decide(E.hybrid, E.hybrid[0].run), C.red, 460);
}

function comparison(c, r, opened, dy = 0) {
  const cols = [68, 820],
    labels = ['REVIEWED FIXTURE', 'STORED FIRST ANSWER'];
  cols.forEach((x, j) => {
    const text = j ? r.answer : r.expectedAnswer,
      status = j ? r.status : r.expectedStatus;
    const ids = j ? r.citations : r.expectedCitations,
      top = 232 + dy;
    slide(c, x, top, 712, 448, j ? '#f4ebd7' : '#e2eee1');
    label(c, labels[j], x + 44, top + 50, C.muted);
    txt(c, status, x + 44, top + 125, 41, C.ink, 'Mono', 600);
    wrapped(c, '“' + text + '”', x + 44, top + 210, 622, 36, 48);
    line(c, x + 42, top + 312, x + 663, top + 312, '#a0b2a5');
    label(c, opened ? 'CITATIONS' : 'CITATIONS   ▸', x + 46, top + 365, C.muted);
    if (opened)
      txt(c, JSON.stringify(ids), x + 226, top + 365, 28, C.ink, 'Mono', 500, 'left', 445);
  });
}
export function record(c, k) {
  heading(c, E.note.id, 'The saved answer and its expected result');
  comparison(c, E.note, Boolean(cue(k, 0, 'Read its document ID')));
  if (k.beat.beatIndex === 0) {
    txt(c, E.note.question, 77, 779, 35, C.pale, 'Serif');
  } else {
    label(c, 'REASON  ' + E.note.reason, 75, 701, C.amber);
    label(c, 'RUN  ' + E.note.run + '     DATASET  ' + E.note.dataset, 75, 739);
    label(c, 'CORPUS  ' + E.note.corpus + '     GRADER  ' + E.note.grader, 75, 783);
    if (cue(k, 1, 'retrieval trace'))
      label(c, 'Investigate with the source snapshot and retrieval trace.', 75, 832, C.amber);
  }
}
export function grade(c, k) {
  const b = k.beat.beatIndex;
  if (b === 0) {
    heading(c, 'DETERMINISTIC GRADER   /   ' + E.note.run, 'Three checks on one answer');
    label(c, 'FIELD', 84, 237);
    label(c, 'EXPECTED', 441, 237);
    label(c, 'RETURNED', 1003, 237);
    const r = E.note;
    const checks = [
      ['Status', r.expectedStatus, r.status],
      ['Citations', '[]', r.citations[0]],
      ['Answer', r.expectedAnswer, r.answer],
    ];
    const phases = ['Compare the status', 'Compare the citations', 'Compare the whole answer'];
    checks.forEach(([name, a, v], i) => {
      const y = 309 + 147 * i;
      slide(c, 65, y - 32, 1470, 117, i === 2 ? '#f1eadb' : C.paper);
      txt(c, name, 90, y + 23, 30, C.ink, 'Sans', 600);
      wrapped(c, a, 441, y + 13, 485, 28, 34);
      wrapped(c, v, 1003, y + 13, 415, 28, 34);
      if (cue(k, 0, phases[i], 0.38) === 1)
        mark(
          c,
          1478,
          y + 22,
          !r.failures.includes(['status_mismatch', 'unexpected_citation', 'answer_mismatch'][i]),
          20,
          true,
        );
    });
    if (cue(k, 0, 'Count this fixture once'))
      txt(
        c,
        r.failures.length + ' failed checks     /     1 failed fixture',
        78,
        794,
        44,
        C.red,
        'Serif',
      );
  } else if (b < 3) {
    heading(
      c,
      'EXACT ANSWER   /   SHORTENED POLICY EXAMPLE',
      'One extra sentence changes the answer',
    );
    slide(c, 74, 237, 1449, 308);
    label(c, 'RETURNED TEXT', 117, 294, C.muted);
    txt(c, E.extra, 118, 373, 45, C.ink, 'Serif');
    const hit = cue(k, 1, 'A substring search', 0.45);
    if (hit) {
      rect(c, 113, 430, 1190 * hit, 68, '#f2ce85', null, 3);
    }
    txt(c, E.accepted, 118, 465, 45, C.ink, 'Serif');
    if (hit === 1)
      txt(c, 'Contains reviewed sentence     ' + extendedHit(), 100, 632, 33, C.teal, 'Mono');
    if (cue(k, 1, 'Here the label') || b === 2)
      txt(
        c,
        'Whole answer equals fixture     ' + String(E.extended === E.accepted),
        100,
        711,
        33,
        C.red,
        'Mono',
      );
    if (b === 2)
      txt(
        c,
        'Alternative wording needs a reviewed label or a validated semantic grader.',
        100,
        808,
        32,
        C.pale,
        'Serif',
      );
  } else {
    heading(c, 'DECODED LATENCY   /   MILLISECONDS', 'Which values survive validation?');
    const cols = [553, 758, 964, 1168, 1374];
    const levels = [
      cue(k, 3, 'an integer or a float'),
      cue(k, 3, 'it is finite'),
      cue(k, 3, 'zero or greater'),
    ];
    ['int or float', 'finite', 'at least zero'].forEach((s, j) => txt(c, s, 82, 365 + 121 * j, 32));
    E.values.forEach((v, i) => {
      const x = cols[i];
      txt(c, ['0', 'False', '3.5', '−2', '∞'][i], x, 249, 46, C.pale, 'Mono', 600, 'center');
      const tests = E.latencySteps(v);
      tests.forEach((pass, j) => {
        dot(c, x, 365 + 121 * j, 26, null, C.line);
        if (levels[j] && (i < 3 || b === 4)) {
          if (tests.slice(0, j).every(Boolean)) mark(c, x, 365 + j * 121, pass, 24);
          else txt(c, '·', x, 365 + j * 121, 36, C.soft, 'Mono', 500, 'center');
        }
      });
    });
    if (cue(k, 4, 'Validate the IDs'))
      txt(
        c,
        'Also validate IDs, status, reason and the tuple of document IDs.',
        83,
        775,
        36,
        C.pale,
        'Serif',
      );
  }
}
function extendedHit() {
  return String(E.extended.includes(E.accepted));
}

export function inventory(c, k) {
  const removed = ease(cue(k, 0, 'Remove the private-note row', 0.85));
  const added = ease(cue(k, 2, 'Add a second policy row', 0.85));
  const rows = added === 1 ? E.padded : removed === 1 ? E.missing : E.repair;
  const slotY = 403;
  const extraY = 558;
  const tileWidth = 263;
  const columnStep = 314;
  const columnX = (i) => 425 + columnStep * i;
  const counts = E.fixtures.map((f) => rows.filter((r) => r.id === f.id).length);
  const showDecision = Boolean(cue(k, 1, 'Hold the comparison'));
  const outputTile = (x, y, i, extra = false) => {
    rect(c, x - tileWidth / 2, y - 37, tileWidth, 74, C.paper, extra ? C.amber : null, 9, 4);
    key(c, x - 87, y, E.keys[i], 44, C.blue);
    txt(c, 'Saved output', x - 52, y, 28, C.ink, 'Sans', 600);
  };

  heading(c, 'EXACT COVERAGE   /   ' + E.repair[0].run, 'One slot per frozen fixture ID');
  label(c, 'FROZEN ID', 66, 266);
  label(c, 'REQUIRED SLOT', 66, slotY);
  label(c, 'EXTRA OUTPUTS', 66, extraY);
  label(c, 'COUNT PER ID', 66, 662);
  line(c, 290, 482, 1511, 482);
  line(c, 290, 617, 1511, 617);
  E.fixtures.forEach((f, i) => {
    const x = columnX(i);
    const count = counts[i];
    key(c, x - 91, 258, E.keys[i], 45, C.blue);
    txt(c, E.rowNames[i], x - 56, 258, 28, C.pale, 'Sans', 600, 'left', 185);
    txt(c, f.id, x, 310, 22, C.soft, 'Mono', 500, 'center', tileWidth);
    rect(c, x - 140, slotY - 45, 280, 90, C.deep, count === 0 ? C.amber : C.line, 12, 3);
    if (count === 0) {
      txt(c, 'Missing output', x, slotY, 28, C.amber, 'Sans', 600, 'center');
    } else if (f.id === E.note.id && removed > 0) {
      c.save();
      c.globalAlpha *= 1 - removed;
      outputTile(x, slotY + 44 * removed, i);
      c.restore();
    } else {
      outputTile(x, slotY, i);
    }
    txt(c, count, x, 662, 43, count === 1 ? C.pale : C.amber, 'Mono', 600, 'center');
  });

  if (added > 0) {
    const duplicateIndex = E.fixtures.findIndex((f) => f.id === E.padded.at(-1).id);
    const targetX = columnX(duplicateIndex);
    c.save();
    c.globalAlpha *= Math.min(1, added * 5);
    outputTile(mix(targetX + columnStep / 2, targetX, added), extraY, duplicateIndex, true);
    c.restore();
  }

  line(c, 66, 702, 1511, 702);
  txt(c, rows.length + ' outputs received', 67, 744, 37, C.pale, 'Serif');
  if (showDecision) {
    const present = counts.filter((count) => count > 0).length;
    txt(c, `${present} / ${counts.length} IDs present`, 505, 744, 37, C.amber, 'Serif');
    stamp(c, 995, 710, E.decide(rows, rows[0].run), C.amber, 516);
  }
}
export function provenance(c, k) {
  const b = k.beat.beatIndex;
  if (b === 0) {
    heading(c, 'REPLAY   /   ' + E.stale[0].run, 'Will the saved private-note answer pass?');
    txt(c, 'Fixture', 85, 207, 31, C.soft);
    txt(c, 'Stored flag', 382, 207, 31, C.soft);
    txt(c, 'Regraded', 573, 207, 31, C.soft);
    E.stale.forEach((r, i) => {
      const y = 290 + 98 * i;
      key(c, 107, y, E.keys[i], 45, C.blue);
      txt(c, E.rowNames[i], 151, y, 32);
      txt(c, String(r.passed), 382, y, 38, r.passed ? C.teal : C.red, 'Mono');
      if (
        cue(k, 0, i === 3 ? 'Hold the comparison' : 'Grade the saved outputs again', 0.35) === 1
      ) {
        const result = E.repair[i].passed;
        txt(c, String(result), 573, y, 38, result ? C.teal : C.red, 'Mono');
      }
      line(c, 81, y + 48, 721, y + 48);
    });

    const note = E.stale[3];
    const showMatch = cue(k, 0, 'all match the fixture');
    const records = [
      ['Reviewed fixture', note.expectedStatus, note.expectedCitations, note.expectedAnswer],
      ['Saved output', note.status, note.citations, note.answer],
    ];
    records.forEach(([title, status, citations, answer], i) => {
      const y = 187 + i * 244;
      slide(c, 766, y, 760, 224, i ? '#f4ebd7' : C.paper);
      key(c, 817, y + 40, E.keys[3], 42, C.blue);
      txt(c, title, 858, y + 40, 35, C.ink, 'Sans', 600);
      if (i && showMatch)
        txt(c, 'Fields match', 1490, y + 40, 30, C.greenInk, 'Sans', 600, 'right');
      line(c, 802, y + 70, 1490, y + 70, '#a0b2a5');
      txt(c, status, 802, y + 102, 35, C.ink, 'Mono');
      txt(c, 'Citations ' + JSON.stringify(citations), 1126, y + 102, 32, C.ink, 'Mono');
      wrapped(c, '“' + answer + '”', 802, y + 154, 684, 37, 42);
    });
    if (cue(k, 0, 'until the stored row'))
      stamp(c, 81, 660, E.decide(E.stale, 'hybrid-v2'), C.amber, 640);
  } else if (b === 1) {
    const graderOnly = Boolean(cue(k, 1, 'If only the deterministic grader changed'));
    heading(
      c,
      'SOURCE SNAPSHOTS   /   BOTH TAGGED CORPUS V3',
      graderOnly ? 'Change the grader on the same saved inputs' : 'Read the last word in each copy',
    );
    (graderOnly ? [E.rules[0], E.rules[0]] : E.rules).forEach((rule, i) => {
      const y = 236 + 232 * i;
      slide(c, 79, y, 1440, 184);
      label(
        c,
        graderOnly
          ? 'SAME SAVED INPUT   /   ' + (i ? 'revised grader' : 'original grader')
          : 'COPY ' + (i + 1) + '   /   corpus-v3',
        117,
        y + 43,
        C.muted,
      );
      txt(c, rule, 116, y + 114, 45, C.ink, 'Serif');
      if (cue(k, 1, 'changes the bytes', 0.4) === 1) {
        label(c, 'SHA-256 PREFIX', 1030, y + 56, C.muted);
        txt(c, E.dashboardDigest(rule).slice(0, 16), 1030, y + 118, 31, C.ink, 'Mono');
      }
    });
    if (cue(k, 1, 'If only the deterministic grader changed')) {
      txt(
        c,
        'Grader alone changed → regrade saved outputs from the same inputs',
        83,
        777,
        37,
        C.amber,
        'Serif',
      );
    } else if (cue(k, 1, 'rerun both systems'))
      txt(
        c,
        'Corpus changed → rerun both systems on the approved bytes',
        83,
        777,
        37,
        C.amber,
        'Serif',
      );
  } else {
    heading(c, 'PROVENANCE', 'Who supplied these four replies?');
    slide(c, 77, 242, 675, 438);
    label(c, 'AUTHOR-SUPPLIED EXAMPLE', 120, 301, C.muted);
    E.copied.forEach((r, i) => {
      txt(c, E.rowNames[i], 126, 373 + i * 82, 31, C.ink);
      if (cue(k, 2, 'Regrading accepts', 0.4) === 1) mark(c, 674, 373 + i * 82, r.passed, 23, true);
    });
    line(c, 779, 468, 923, 468, C.line, 4);
    rect(c, 947, 242, 576, 438, null, C.soft, 11);
    label(c, 'EVALUATION RUNNER', 988, 301);
    if (cue(k, 2, 'In the run record')) {
      txt(c, 'Retained outputs', 995, 429, 43, C.pale, 'Serif');
      txt(c, '+ source digests', 995, 504, 43, C.pale, 'Serif');
      label(c, 'Evidence to collect', 995, 615, C.amber);
    } else txt(c, 'Run record?', 1237, 481, 50, C.pale, 'Serif', 400, 'center');
    txt(c, 'The local grader checks agreement with the fixture.', 82, 783, 36, C.pale, 'Serif');
  }
}
export function repairScene(c, k) {
  const loaded = Boolean(cue(k, 0, 'Load hybrid two'));
  const rows = loaded ? E.repair : E.hybrid;
  const done = Boolean(cue(k, 1, 'Before sending real traffic'));
  heading(
    c,
    'SAME FOUR QUESTIONS   /   ' + rows[0].run,
    loaded ? 'Inspect the new first answer' : 'Inspect the first hybrid',
  );
  comparison(c, rows[3], true, -21);
  rows.forEach((r, i) => {
    const x = 96 + i * 190;
    key(c, x, 746, E.keys[i], 46, C.blue);
    if (!loaded || done) mark(c, x + 55, 746, r.passed, 21);
    else txt(c, '…', x + 54, 746, 28, C.soft, 'Mono', 500, 'center');
  });
  if (!loaded || done) {
    txt(c, E.passCount(rows) + ' / ' + rows.length, 886, 743, 56, C.pale, 'Serif', 400, 'center');
    stamp(c, 1027, 709, E.decide(rows, rows[0].run), loaded ? C.teal : C.red, 477);
  } else label(c, 'Awaiting regrade', 1042, 748, C.amber);
}
