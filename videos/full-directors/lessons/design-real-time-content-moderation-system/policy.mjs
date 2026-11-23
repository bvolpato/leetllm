import {
  C,
  box,
  clockCue,
  dot,
  egret,
  kingfisher,
  label,
  line,
  page,
  portrait,
  ruledPage,
  stamp,
  text,
} from './art.mjs';
import { failedRelease, fusionExamples, migration, missingCaption, releaseCases } from './decisions.mjs';

export function fusionWorksheet(c, k) {
  const b = k.beat.beatIndex;
  if (b === 2) {
    const verified = Boolean(clockCue(k, 2, 'confirms a known prohibited match'));
    const outcome = missingCaption(verified);
    page(
      c,
      'Profile claim  /  required score missing',
      'Which evidence can still govern the action?',
    );
    ruledPage(c, 106, 312, 1712, 522);
    label(c, 'Caption', 173, 403);
    text(c, 'Unavailable', 172, 485, 57, C.brass, 'serif');
    label(c, 'Image', 989, 403);
    text(c, '0.68', 986, 485, 53, C.ink, 'mono');
    line(c, 172, 548, 1738, 548);
    label(c, 'Approved signature lookup', 173, 641);
    text(
      c,
      verified ? 'Verified match' : 'No match',
      171,
      744,
      57,
      verified ? C.red : C.ink,
      'serif',
    );
    if (verified || clockCue(k, 2, 'Hold for review'))
      stamp(c, outcome.action, 990, 664, verified ? C.red : C.brass);
    return;
  }
  page(c, 'Caption and image  /  complete evidence', 'Where do the two pieces of evidence land?');
  const join = clockCue(k, 1, 'Join the pieces', 1.0);
  label(c, 'No approved signature match', 106, 313);
  const rx = 931,
    w = 862,
    threshold = rx + 0.65 * w;
  text(c, 'Review ≥ 0.65', threshold, 337, 32, C.brass, 'sans', 600, 'center');
  line(c, threshold, 357, threshold, 833, C.brass, 4);
  fusionExamples.forEach((row, i) => {
    const y = 452 + i * 260;
    const a = row.caption * 0.45,
      d = row.image * 0.55;
    text(c, row.name, 106, y, 50, C.ink, 'serif');
    text(c, 'Caption  ' + row.caption.toFixed(2) + ' × 0.45', 109, y + 65, 35, C.sea, 'mono');
    text(c, 'Image    ' + row.image.toFixed(2) + ' × 0.55', 109, y + 118, 35, C.pine, 'mono');
    line(c, rx, y + 13, rx + w, y + 13, C.line, 3);
    box(c, rx, y - 9, w * a, 44, C.sea);
    box(c, rx + w * a * join, y - 9 + 61 * (1 - join), w * d, 44, C.pine);
    const reveal = i
      ? clockCue(k, 1, 'lands above the line')
      : clockCue(k, 1, 'lands at point one zero two');
    if (reveal)
      text(
        c,
        +row.result.score.toFixed(4) + '   /   ' + row.result.action,
        rx,
        y + 122,
        39,
        C.ink,
        'mono',
      );
  });
}

export function release(c, k) {
  const b = k.beat.beatIndex;
  if (b === 2) {
    const canary = clockCue(k, 2, 'canary on a limited slice');
    const drain = clockCue(k, 2, 'During drain');
    const retired = clockCue(k, 2, 'At retirement');
    const stage = retired ? migration.retired : drain ? migration.drain : canary ? migration.canary : migration.shadow;
    page(c, 'Separate replacement-model trial', 'Which version serves the member?');
    label(c, 'Ten new requests', 107, 344);
    label(c, 'Serving route', 881, 344);
    for (let i = 0; i < 10; i++) {
      const x = 116 + i * 59;
      dot(c, x, 449, 20, i >= 10 - stage.liveOnReplacement ? C.sea : C.pine);
      if (!canary) dot(c, x, 590, 20, C.blue);
    }
    text(
      c,
      drain
        ? 'New traffic on replacement'
        : canary
          ? 'Limited live canary'
          : 'Active model serves all ten',
      878,
      468,
      53,
      C.ink,
      'serif',
    );
    line(c, 110, 518, 1792, 518, C.line, 2);
    if (canary) {
      dot(c, 135, 590, 16, C.pine);
      text(c, 'Old', 168, 605, 34, C.ink);
      dot(c, 354, 590, 16, C.sea);
      text(c, 'Replacement', 387, 605, 34, C.ink);
    }
    text(
      c,
      stage.oldCalls === 'blocked'
        ? 'Old calls blocked'
        : drain
          ? 'Old work finishes'
          : canary
            ? 'Monitor before expanding'
            : 'Shadow scores copied inputs',
      878,
      608,
      46,
      C.sea,
      'serif',
    );
    if (retired) text(c, 'Retired  /  credentials removed', 878, 693, 37, C.muted);
    text(c, stage.recovery, 107, 817, 45, C.muted);
    return;
  }
  const run = clockCue(k, 1, 'Run the proposed rule');
  page(c, 'Policy release  /  word-only candidate', 'Would this policy pass the classroom test?');
  releaseCases.forEach((row, i) => {
    const x = 107 + i * 583;
    ruledPage(c, x, 308, 533, 488);
    text(c, row.name, x + 43, 385, 44, C.ink, 'serif');
    if (i < 2) portrait(c, i ? kingfisher : egret, x + 79, 454, 40);
    const excerpts = [
      ['Our class uses the official', 'guide to identify egrets.'],
      ['I am the official club', 'representative.'],
      ['Bring your notes', 'to class.'],
    ];
    excerpts[i].forEach((part, j) => text(c, part, x + 43, 539 + 46 * j, 33, C.ink, 'serif'));
    text(c, 'Expected   ' + row.expected, x + 43, 668, 33, C.muted);
    if (run) {
      if (row.actual === 'Block') {
        box(c, x + 40, 409, 455, 205, '#425457', 8);
        text(c, 'Hidden', x + 267, 533, 53, C.white, 'serif', 400, 'center');
      }
      text(
        c,
        'Candidate   ' + row.actual,
        x + 43,
        734,
        36,
        row.expected === row.actual ? C.pine : C.red,
        'sans',
        600,
      );
    }
  });
  if (clockCue(k, 1, 'Hold the candidate') && failedRelease)
    stamp(c, 'Hold release  /  classroom case failed', 108, 862, C.red);
}
