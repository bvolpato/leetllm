import { opening, feedback, authority, checkParser } from './parser.mjs';
import { access, controls, checkControls } from './boundaries.mjs';
import { cleanup, checkCleanup } from './cleanup.mjs';
import { guest, checkGuest } from './guest.mjs';
import { evaluation, checkEvaluation } from './evaluation.mjs';

const painters = [opening, feedback, authority, access, controls, cleanup, guest, evaluation];

export default {
  title: 'Giving Generated Code a Safe Place to Run',
  draw(ctx, clock) {
    painters[clock.beat.chapterIndex](ctx, clock);
  },
  check() {
    checkParser();
    checkControls();
    checkCleanup();
    checkGuest();
    checkEvaluation();
  },
};
