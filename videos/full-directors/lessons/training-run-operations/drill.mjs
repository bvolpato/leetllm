import { C, fmt, text, mono, fill, line, strip, heading, cue, afterCue, pointer, ticks } from './recorder.mjs';
import { drill, drillUpdate, deadline, sliceResult, range, owner } from './run.mjs';
import { drillRun } from '../../../films/training-run-operations/boundaries.mjs';
import { timingBench, tensor } from './measurements.mjs';
import { specimen } from '../../../director-cuts/lessons/training-run-operations/samples.mjs';

function firstRead(g, ids, y, name, color) {
  text(g, name, 125, y + 71, 43, color, 'left', 'Serif');
  ids.forEach((id, i) => {
    const x = 438 + i * 225;
    g.drawImage(specimen(id), x, y, 116, 116);
    mono(g, id, x + 135, y + 71, 43, C.ink);
  });
}

function compareFirstReads(g, k) {
  const hasCrashCount = afterCue(k, 5, 'To test the drill, give the restored worker the count from the crash');
  const rewind = afterCue(k, 7, 'Rewind the restored cursor by twelve examples', 1.4);
  const readMatched = afterCue(k, 7, 'Both replicas now get the same IDs as the reference');
  const settled = rewind === 1 && readMatched;
  const out = sliceResult(settled ? drill.saved : drill.live);

  heading(g, 'DATA REHEARSAL   /   same sampler order', 'Compare the first six IDs after update ' + drillUpdate);

  const left = 470, right = 1630, rail = 344;
  text(g, 'Examples consumed', 125, 355, 32, C.dim);
  ticks(g, left, rail, right - left, drill.pending, 12, C.dim);
  pointer(g, left, rail, C.blue);
  mono(g, fmt(drill.saved) + ' at checkpoint', left, 294, 37, C.blue, 'center');

  if (hasCrashCount) {
    mono(g, fmt(drill.live) + ' at crash', right, 294, 37, C.red, 'center');
    const travel = rewind * rewind * (3 - 2 * rewind);
    const x = right - travel * (right - left);
    const color = rewind === 1 ? C.teal : rewind ? C.gold : C.red;
    g.save();
    g.translate(x, rail + 15);
    g.scale(1, -1);
    pointer(g, 0, 0, color);
    g.restore();
    mono(g, 'Restart cursor', x, 430, 36, color, 'center');
    if (rewind)
      mono(g, '←  ' + fmt(drill.pending) + ' examples', (left + right) / 2, 294, 37, C.teal, 'center');
  }

  line(g, 1098, 477, 1098, 809, C.edge, 3);
  text(g, 'Replica 0', 755, 505, 36, C.dim, 'center');
  text(g, 'Replica 1', 1430, 505, 36, C.dim, 'center');
  firstRead(g, out.reference, 527, 'Uninterrupted', C.blue);
  if ((hasCrashCount && !rewind) || settled) {
    const color = settled ? C.teal : C.red;
    firstRead(g, out.read, 677, 'Restart', color);
    text(g, out.matches + ' / ' + out.reference.length + ' IDs match', 124, 884, 48, color, 'left', 'Serif');
  } else {
    const status = !hasCrashCount
      ? 'Load the same weights'
      : rewind < 1
        ? 'Rewinding the cursor'
        : 'Reading the first batch again';
    text(g, status, 125, 748, 43, C.dim, 'left', 'Serif');
  }
  if (cue(k, 8, 'Reopen it and test'))
    text(g, 'After an interrupted save, test the first batch and next update.', 1796, 881, 38, C.dim, 'right');
  else if (cue(k, 7, 'Compare the learning rate'))
    text(g, 'Next check: learning rate, Adam moments and next weight update.', 1796, 881, 38, C.dim, 'right');
  else if (!rewind && cue(k, 6, 'Which cursor would you move'))
    text(g, 'Which cursor moves, and by how much?', 1796, 881, 40, C.ink, 'right');
}

export function rehearsal(g, k) {
  const b = k.beat.beatIndex;
  if (b === 0) {
    heading(g, 'FRESH DRILL   /   2 replicas × 3 examples', 'Four rounds make one complete update');
    text(g, 'Published update', 125, 345, 42, C.dim);
    mono(g, drillUpdate, 122, 490, 109, C.teal);
    strip(g, 632, 329, 1160, 283);
    const done = cue(k, 0, 'Two rounds') ? 2 : 0;
    for (let j = 0; j < 4; j++) {
      const x = 675 + j * 278;
      text(g, 'Round ' + (j + 1), x, 408, 34, C.dim);
      for (let i = 0; i < 6; i++)
        dotSample(g, x + 29 + (i % 3) * 51, 472 + Math.floor(i / 3) * 45, j < done);
    }
    if (done) text(g, '12 examples in the unfinished window', 638, 701, 41, C.gold);
    if (cue(k, 0, 'fifty-nine seconds')) mono(g, 'Warning   59 s', 124, 875, 65, C.red);
    return;
  }
  if (b === 1 || b === 2) {
    const reopen = cue(k, 2, 'With twenty-four examples');
    if (!reopen) {
      const pathKnown = cue(k, 2, 'After the estimated save');
      heading(
        g,
        'CANDIDATE UPDATE ' + (drillUpdate + 1) + '   /   59-second warning',
        pathKnown ? 'The full path needs sixty seconds' : 'Which checkpoint and consumed count do you load?',
      );
      const phase = cue(k, 1, 'margin is eight')
        ? 4
        : cue(k, 1, 'publication takes forty')
          ? 2
          : cue(k, 1, 'takes twelve')
            ? 1
            : 0;
      timingBench(
        g,
        deadline(59, 12, 40, 8),
        phase,
        pathKnown,
        cue(k, 1, 'This job requires that margin', 2.1),
        cue(k, 2, 'The policy requires eight'),
      );
      text(
        g,
        `Published update ${drillUpdate}   ·   ${drillRun.rounds} rounds × ${drillRun.replicas} replicas × ${drillRun.sequences} examples`,
        119, 717, 37, C.ink,
      );
      return;
    }
    heading(
      g,
      'RECOVERY   /   only complete updates are published',
      'Reopen the packet for update 73',
    );
    strip(g, 119, 358, 1675, 306);
    text(g, 'Published weights', 150, 455, 39, C.dim);
    mono(g, drillUpdate, 151, 585, 101, C.teal);
    text(g, 'Already consumed', 813, 455, 39, C.dim);
    if (cue(k, 2, 'examples have already been consumed'))
      mono(g, fmt(drill.saved), 813, 585, 92, C.teal);
    mono(g, drillUpdate + ' updates × ' + drill.perUpdate + ' examples', 126, 799, 47, C.ink);
    text(g, 'The next ' + drill.pending + ' were read in memory before the interruption.', 128, 899, 36, C.dim);
    return;
  }
  if (b === 3 || b === 4) {
    heading(
      g,
      'RESHARD DRILL   /   global coordinate 19',
      'Three saved ranks, six replacement ranks',
    );
    const show = cue(k, 4, 'Cut the ruler', 0.65),
      named = cue(k, 4, 'lands on rank four'),
      r = range(19, 4);
    tensor(g, {
      n: 24,
      oldWidth: 8,
      newWidth: 4,
      probe: 19,
      showNew: show,
      mark: named,
      caption: 'Coordinate 19   →   rank ' + owner(19, 4) + '   [' + r[0] + ', ' + r[1] + ')',
    });
    return;
  }
  compareFirstReads(g, k);
}
function dotSample(g, x, y, used) {
  fill(g, x - 15, y - 13, 32, 29, used ? C.gold : C.pale);
  if (used) line(g, x - 5, y, x + 7, y, C.sheet, 3);
}
