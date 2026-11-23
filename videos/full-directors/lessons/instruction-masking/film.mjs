import assert from 'node:assert/strict';
import { press, checkPress } from './press.mjs';
import { inspection, checkInspection } from './inspection.mjs';
import { targets, checkTargets } from './targets.mjs';
import { packingScenes, checkPacking } from './packing.mjs';
import { serving, checkServing } from './serving.mjs';

const painters = [...press, ...inspection, ...targets, ...packingScenes, ...serving];
export default {
  title: 'Align Chat Turns with Training Targets',
  draw(g, clock) {
    painters[clock.beat.chapterIndex](g, clock);
  },
  check() {
    assert.equal(painters.length, 27);
    checkPress();
    checkInspection();
    checkTargets();
    checkPacking();
    checkServing();
  },
};
