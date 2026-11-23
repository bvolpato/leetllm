import assert from 'node:assert/strict';
import { fork, counts, layout, returns, backward, practice, checkRouting } from './routing.mjs';
import { rounding, topology, meters, wire, checkMeasurements } from './measurements.mjs';
import { lifetime, setup, planning, timing, ownership, checkSystems } from './systems.mjs';

import {
  backend,
  historic,
  loaded,
  shared,
  sms,
  training,
  checkDeployment,
} from './deployment.mjs';

const painters = {
  c01: fork,
  c02: counts,
  c03: layout,
  c04: returns,
  'c04-grad': backward,
  c05: rounding,
  c06: topology,
  'c06-bytes': meters,
  c07: wire,
  c08: lifetime,
  'c08-setup': setup,
  'c08-shared': shared,
  c09: planning,
  'c09-time': timing,
  'c09-home': practice,
};

const detailPainters = {
  'c06-backend': backend,
  'c06-bytes-bench': historic,
  'c08-setup-loaded': loaded,
  'c09-sms': sms,
  'c09-time-rl': training,
};

// A measured caption starts with the spoken answer. The diagram can settle after the clause.
const answerPhrases = {
  'c01-jobs': ['That gives three', 'Seven tenths of three'],
  'c03-align': ['The first valid interval'],
  'c04-weight': ['Expert zero contributes'],
  'c04-second': ['One point two plus', 'Applying the gates twice'],
  'c04-reattach': ['Row a is back'],
  'c04-grad-chain': ['The gate gradients', 'Sum the two paths'],
  'c05-staged': ['The staged result'],
  'c05-wide': ['One survives'],
  'c06-bytes-rates': ['The logical rate', 'The NIC payload rate'],
  'c06-bytes-bench': ['six hundred forty-three', 'seven hundred twenty-six'],
  'c07-groups': ['That makes fifty-six'],
  'c07-size': ['Together they take'],
  'c07-decode': ['so ten decodes to five'],
  'c08-none': ['The wrapper returns None'],
  'c09-time-finish': ['Both finish at six milliseconds'],
  'c08-shared-grad': ['The two coordinates become'],
  'c09-mean': ['The mean is five thirds'],
  'c09-home-home': ['The cached route'],
};
function draw(ctx, clock) {
  for (const phrase of answerPhrases[clock.beat.id] ?? []) clock.reveal(phrase, 0);
  const paint = detailPainters[clock.beat.id] ?? painters[clock.beat.chapterId];
  paint(ctx, clock);
}

function check() {
  checkRouting();
  checkMeasurements();
  checkSystems();
  checkDeployment();
  const clock = (beatIndex, progress) => ({ beat: { beatIndex }, reveal: () => progress });
  const before = ownership(clock(0, 1));
  const middle = ownership(clock(1, 1));
  const wrapperOnly = ownership(clock(2, 1));
  const returnedNone = ownership({
    beat: { beatIndex: 3 },
    reveal: (phrase) => Number(phrase === 'because A already ran'),
  });
  const readyWait = ownership({
    beat: { beatIndex: 3 },
    reveal: (phrase) => Number(phrase !== 'Now B can read' && phrase !== 'After A finishes'),
  });
  const again = ownership(clock(3, 1));
  const last = ownership(clock(4, 0));
  const finished = ownership(clock(4, 1));
  assert.equal(before.retained, false);
  assert(middle.waitA && middle.copy && middle.ready && middle.retained && !middle.waitB);
  assert(wrapperOnly.waitB && !wrapperOnly.waitReady && !wrapperOnly.readB);
  assert(
    returnedNone.none && returnedNone.retained && !returnedNone.waitReady && !returnedNone.readB,
  );
  assert(readyWait.waitReady && !readyWait.readB);
  assert(
    again.waitA &&
      again.waitB &&
      again.none &&
      again.waitReady &&
      again.readB &&
      again.retained &&
      again.finishA,
  );
  assert(last.retained && last.finishB < 1);
  assert.equal(finished.retained, false);
}

export default { title: 'DeepEP and the Round Trip Through Expert Parallelism', draw, check };
