import assert from 'node:assert/strict';
import { release, checkRelease } from './release.mjs';
import {
  scratch,
  prompts,
  artifacts,
  ballots,
  sampleCosts,
  dependencies,
  checkPrompts,
} from './prompts.mjs';
import {
  firstDeal,
  linear,
  splitDeal,
  replay,
  frontier,
  beam,
  agreements,
  budget,
  fresh,
  checkTable,
} from './table.mjs';
import { training, verifier, gate, choosing, checkEvaluation } from './evaluation.mjs';

const chapters = [
  release,
  scratch,
  prompts,
  artifacts,
  ballots,
  sampleCosts,
  dependencies,
  firstDeal,
  linear,
  splitDeal,
  replay,
  frontier,
  beam,
  agreements,
  budget,
  training,
  verifier,
  gate,
  choosing,
  fresh,
  (g, c) => release(g, c, true),
];
function draw(g, clock) {
  g.save();
  g.scale(1.5, 1.5);
  chapters[clock.beat.chapterIndex](g, clock);
  g.restore();
}
function check() {
  assert.equal(chapters.length, 21);
  checkRelease();
  checkPrompts();
  checkTable();
  checkEvaluation();
  return true;
}
export default { title: 'Exploring Several Paths to an Answer', draw, check };
