import { C, beat, cue, mix } from './studio.mjs';

export const calls = [
  {
    name: 'Guide request',
    words: ['“I’m asking again.', 'Where’s the key rotation guide?”'],
    gold: 0,
    marks: [1, 0],
  },
  {
    name: 'Freeze exception',
    words: ['“Could you restore my key', 'during the freeze?”'],
    gold: 1,
    marks: [1, 1],
  },
];
function callSlip(p, x, y, call, index, width = 720) {
  p.paper(x, y, width, 188);
  p.box(x, y, 14, 188, index ? C.blue : C.teal, 4);
  p.cap(index ? 'Line B' : 'Line A', x + 42, y + 38);
  call.words.forEach((s, j) =>
    p.txt(s, x + 42, y + 92 + j * 53, 47, C.ink, { face: 'Serif', max: width - 80 }),
  );
}
export function opening(p, k) {
  p.surface('desk');
  const entry = beat(k) === 1 ? Math.min(1, 0.4 + k.elapsed * 1.5) : 1;
  const second = cue(k, 1, 'The next caller', 0.6);
  const human = cue(k, 2, 'A specialist', 0.75),
    guide = cue(k, 2, 'where the key rotation guide', 0.75);
  p.phone(
    935,
    390,
    0.5,
    'Human desk',
    human === 1,
    human === 1 ? 'Line B  /  Freeze' : 'Awaiting a call',
  );
  p.paper(285, 605, 590, 262);
  p.cap('Guarded agent', 322, 652);
  p.txt(guide === 1 ? 'Line A  /  Guide' : 'Documentation line', 322, 718, 44);
  callSlip(p, 125, 82 + 26 * (1 - entry), calls[0], 0);
  if (second > 0) callSlip(p, 1004, 82 + 26 * (1 - second), calls[1], 1);
  if (human > 0) {
    p.line(1400, 272, 1400, 272 + 158 * human, C.blue, 9);
    p.dot(1400, 272 + 158 * human, 12, C.blue);
  }
  if (guide > 0) {
    p.line(468, 272, 468, 272 + 283 * guide, C.teal, 9);
    p.book(mix(84, 331, guide), mix(383, 440, guide), 0.72);
  }
  if (!guide) p.book(84, 383, 0.72);
  p.lock(92, 908, 0.73);
  p.cap('Key access', 192, 932);
  p.txt('Disabled', 192, 979, 43);
  if (beat(k) === 1 && cue(k, 1, 'Which caller needs'))
    p.mid('Which call needs a person?', 964, 951, 52, C.ink, { face: 'Serif' });
  if (beat(k) === 3) p.txt('Access changes approved    0', 1080, 952, 47);
}
export function labeling(p, k) {
  p.surface();
  p.title('Two independent readings');
  const full = cue(k, 2, 'The other marked zero'),
    agree = cue(k, 3, 'Keep both original marks'),
    resolved = cue(k, 3, 'Save the reason');
  calls.forEach((call, i) => {
    const x = 114 + i * 866;
    callSlip(p, x, 217, call, i, 808);
    for (let j = 0; j < 2; j++) {
      const y = 485 + j * 125;
      p.cap('Reviewer ' + (j + 1), x + 20, y);
      if ((i && cue(k, 1, 'the reviewers agree')) || full || (j === 0 && cue(k, 2, 'and marked one'))) {
        const mark = call.marks[j];
        p.num(mark, x + 250, y, 69, mark ? C.blue : C.teal);
        p.txt(mark ? 'Human review' : 'Guarded agent', x + 335, y, 46);
      }
      p.line(x, y + 54, x + 788, y + 54, C.rule, 2);
    }
  });
  if (agree) p.stamp('Agreement   1 / 2', 1018, 726, C.teal);
  if (resolved) {
    p.stamp('Reviewed label   0', 148, 726, C.teal);
    p.txt('Document request   ·   escalation-policy-v1', 148, 872, 43);
  }
  if (beat(k) === 4)
    p.txt('Keep both marks, the adjudicated label and the guide version.', 148, 963, 39);
}
export const manifest = [
  ['t01', 'Acme', 1],
  ['t02', 'Acme', 2],
  ['t03', 'North', 2],
  ['t04', 'North', 2],
  ['v01', 'Summit', 3],
  ['v02', 'Summit', 3],
  ['x01', 'Harbor', 4],
  ['x02', 'Harbor', 4],
];
export function split(p, k) {
  p.surface();
  p.title('Whose history is in April?');
  const delta = cue(k, 3, 'account Delta'),
    excluded = cue(k, 3, 'exclude its earlier ticket', 0.75);
  const lanes = ['Training', 'Training', 'Development', 'Test'],
    months = ['January', 'February', 'March', 'April'];
  months.forEach((m, i) => {
    const x = 94 + i * 435;
    p.paper(x, 245, 410, 540);
    p.box(x, 245, 410, 89, i < 2 ? C.teal : i === 2 ? C.blue : C.ink, 8);
    p.mid(m, x + 205, 288, 43, C.page);
    p.cap(lanes[i], x + 28, 382);
    manifest
      .filter((row) => row[2] === i + 1)
      .forEach(([id, name], j) => {
        p.txt(name, x + 32, 451 + 75 * j, 42);
        p.num(id, x + 270, 451 + 75 * j, 33, C.muted);
      });
  });
  if (delta) {
    p.txt('Delta', 124, mix(710, 844, excluded), 49, C.rust);
    p.txt('Delta', 1430, 710, 49, C.rust);
    if (excluded === 1) p.txt('January history excluded from training', 322, 844, 43, C.rust);
    else if (!excluded) p.line(278, 709, 1390, 709, C.rust, 4);
  }
  if (beat(k) >= 5)
    p.txt(
      beat(k) === 5
        ? 'Freeze account IDs, normalized text, dates and label version.'
        : 'Check label availability and the population of future accounts.',
      118,
      946,
      40,
    );
}
export const phrases = ['key disabled', "can't sign in", 'admin override'];
export const wording = [
  ['Explicit freeze', 'Production API key disabled and the incident freeze blocks restore.', 1],
  ['Indirect freeze', 'The production API key was disabled during the incident freeze.', 1],
  ['Rotation guide', 'Where is the key rotation guide?', 0],
  ['Policy question', 'Where can I read the access policy?', 0],
];
export const rule = (text) => Number(phrases.some((phrase) => text.toLowerCase().includes(phrase)));
export const fitted = [1, 1, 0, 0];
export function baseline(p, k) {
  p.surface();
  p.cap('Exact phrase', 112, 111);
  p.txt('“key disabled”', 107, 204, 95, C.ink, { face: 'Serif' });
  const inserted = cue(k, 1, 'one extra word', 0.6);
  p.txt('key', 132, 373, 68);
  p.txt('disabled', 280, 373, 68);
  p.line(132, 422, 559, 422, C.teal, 8);
  p.txt('key', 132, 525, 68);
  if (inserted) p.txt('was', 279, 525 - 18 * (1 - inserted), 68, C.rust);
  if (inserted) p.txt('disabled', 445, 525, 68);
  else p.txt('…', 279, 525, 68, C.muted);
  const shown = cue(k, 2, 'The word was'),
    fittedShown = cue(k, 3, 'Both routine requests go');
  p.grid(
    876,
    212,
    956,
    ['Held-out text', 'Phrase', 'TF-IDF'],
    wording.map(([name, text, gold], i) => [
      name,
      shown ? [rule(text) ? 'Review' : 'Agent', rule(text) === gold ? C.ink : C.rust] : '·',
      fittedShown ? (fitted[i] ? 'Review' : 'Agent') : '·',
    ]),
    [0.45, 0.27, 0.28],
    { step: 108, size: 41 },
  );
  if (shown) p.txt('“was” breaks the match.', 132, 666, 43, C.rust);
  if (fittedShown) p.txt('6 training tickets   /   word and two-word TF-IDF', 132, 814, 44);
  if (beat(k) === 4)
    p.txt('Next comparison   ·   negations, later accounts, latency and review load', 156, 911, 39);
  if (beat(k) === 5) p.stamp('Review all four   →   2 extra reviews', 154, 876, C.rust, 1180);
}
