import { C, beat, cue, mix } from './studio.mjs';
import { fits, names, labelRoute } from './gate.mjs';
import { GATE_CASES } from '../../../films/capstone-fine-tuned-classifier/fixtures.mjs';

export function releaseRecord(p, k) {
  p.surface();
  p.title('File the calls that held each model');
  fits.forEach((model, which) => {
    const x = 113 + which * 869,
      y = 281,
      ink = which ? C.blue : C.teal;
    p.box(x, y, 411, 87, ink, 18);
    p.box(x, y + 44, 824, 500, ink, 16);
    p.paper(x + 25, y + 95, 774, 402);
    p.txt(which ? 'Tiny encoder' : 'TF-IDF baseline', x + 25, y + 44, 47, C.page);
    p.cap(which ? 'Required misses' : 'Extra reviews', x + 56, y + 149);
    const failures = model.scores
      .map((v, i) => ({ i, v, failed: v >= model.cut !== !!GATE_CASES[i].gold }))
      .filter((r) => r.failed);
    failures.forEach(({ i, v }, j) => {
      p.txt(names[i], x + 57, y + 230 + j * 88, 50);
      p.num(v.toFixed(3), x + 514, y + 230 + j * 88, 48, C.rust);
    });
  });
  if (beat(k) === 1 && cue(k, 1, 'Save the exact gate tickets'))
    p.txt('Keep each gate text and ID with its scoring run, frozen cutoff and report.', 126, 927, 44);
  else if (beat(k) === 2 && cue(k, 2, 'verify the producer')) {
    p.lock(131, 870, 0.65);
    p.txt('Verified producer    ·    current ticket    ·    approved bundle', 246, 917, 45);
  }
}
export const finalCall = Object.freeze({
  id: 'S501',
  score: 0.34,
  tokens: 32,
  cut: 0.35,
  required: 1,
  approved: 0,
});
export function finalDecision(cut) {
  const human = finalCall.score >= cut,
    missed = !!finalCall.required && !human;
  return { cut, route: labelRoute(finalCall.score, cut), human, missed };
}

function after(k, b, phrase) {
  if (beat(k) !== b) return beat(k) > b;
  k.reveal(phrase, 0, { captionStart: phrase });
  return k.elapsed >= k.wordCue(phrase).end;
}

function scoreRuler(p, y, title, cutoff, moving = false) {
  const low = 0.30,
    high = 0.40,
    x = (score) => mix(180, 1090, (score - low) / (high - low)),
    axis = y + 135;
  p.paper(111, y, 1698, 245);
  p.cap(title, 150, y + 38, 34);
  p.line(1165, y + 24, 1165, y + 221, C.rule, 3);
  p.line(x(low), axis, x(high), axis, C.ink, 5);
  for (let i = 0; i <= 10; i++) {
    const tick = x(low + i / 100);
    p.line(tick, axis - 8, tick, axis + 12, C.ink, 3);
  }
  for (const endpoint of [low, high])
    p.mid(endpoint.toFixed(2), x(endpoint), y + 184, 36, C.muted, { face: 'Mono' });
  p.line(x(cutoff), axis - 34, x(cutoff), axis + 34, C.rust, 7);
  p.mid(moving ? 'Cutoff' : 'Cutoff ' + cutoff.toFixed(2), x(cutoff), y + 193, 41, C.rust);
  p.dot(x(finalCall.score), axis, 16, C.teal);
  p.mid(finalCall.score.toFixed(2), x(finalCall.score), y + 75, 55, C.teal, { face: 'Mono' });
}

export function lastCall(p, k) {
  const b = beat(k);
  p.surface('desk');
  const f = finalCall,
    original = finalDecision(f.cut);
  const routed = after(k, 2, 'The guarded agent gets the call'),
    gold = after(k, 2, 'Human review'),
    hold = after(k, 3, 'Hold the candidate'),
    access = after(k, 3, 'This route approved zero');
  p.paper(111, 79, 1004, 226);
  p.cap('Verified intake  /  ' + f.id, 150, 124, 34);
  p.txt('“Someone changed my recovery email.”', 148, 190, 58, C.ink, { face: 'Serif', max: 925 });
  p.txt(f.tokens + ' full tokens     ·     active bundle', 152, 260, 39, C.muted);
  p.cap('Gate limit', 1210, 128, 34);
  p.txt('0 required misses allowed', 1210, 192, 48, C.ink, { max: 580 });
  if (access) {
    p.lock(1210, 224, 0.44);
    p.txt('Access changes approved   ' + f.approved, 1270, 258, 38);
  }

  scoreRuler(p, 347, 'Frozen gate  /  review score', original.cut);
  p.cap('Human desk', 1210, 385, 34);
  if (routed) {
    p.lampAt(1686, 393, original.human, 0.92);
    p.txt(original.route, 1210, 439, 50);
  }
  if (gold)
    p.txt('Required route   ' + (f.required ? 'Human review' : 'Guarded agent'), 1210, 496, 38);
  if (hold) p.txt('Hold   /   ' + Number(original.missed) + ' required miss', 1210, 547, 41, C.rust);

  if (b < 4) return;
  const again = finalDecision(f.score);
  // The replay changes only the cutoff. It reaches equality after the new value is spoken.
  let progress = 1;
  if (b === 4) {
    const { start, end } = k.wordCue('with a cutoff of point three four');
    progress = k.elapsed >= end ? 1 : Math.max(0, (k.elapsed - start) / (end - start));
  }
  const replayRouted = after(k, 4, 'Equality sends it to human review'),
    development = after(k, 5, 'now belongs to development'),
    newGate = after(k, 5, 'open a new independent gate');
  scoreRuler(
    p,
    620,
    'Replay  /  same ' + f.id,
    mix(original.cut, again.cut, progress),
    progress > 0 && progress < 1,
  );
  p.cap('Human desk', 1210, 658, 34);
  if (replayRouted) {
    p.lampAt(1686, 666, again.human, 0.92);
    p.txt(again.route, 1210, 712, 50, C.teal);
  }
  if (development) p.txt(f.id + ' is now development data', 1210, 769, 38);
  if (newGate) p.txt('Run a new independent gate', 1210, 820, 41, C.ink);
}
