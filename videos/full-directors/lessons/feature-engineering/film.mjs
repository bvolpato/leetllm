import { paper } from './drawing.mjs';
import { checkExamples } from './examples.mjs';
import { checkPictures } from './picture-check.mjs';
import { intake, heartbeats, history, scale, running, rulers, missing } from './measurements.mjs';
import { codes, unknown, crossfit, matured, units, validation } from './encodings.mjs';
import { patchbay, caps, parity, forensic, storehouse, receipt, practice } from './serving.mjs';

const chapters = [
  intake,
  heartbeats,
  history,
  scale,
  running,
  rulers,
  missing,
  codes,
  unknown,
  crossfit,
  matured,
  units,
  validation,
  patchbay,
  caps,
  parity,
  forensic,
  storehouse,
  receipt,
  practice,
];

function draw(g, clock) {
  paper(g);
  chapters[clock.beat.chapterIndex](g, clock);
}

export default {
  title: 'Turning Measurements into Useful Features',
  draw,
  check: () => checkExamples() && checkPictures(draw),
};
