import { paint } from './press.mjs';
import { check } from './edition-data.mjs';
import {
  opening,
  atomic,
  verdicts,
  timeScope,
  incentives,
  binding,
  strict,
  routing,
} from './record-room.mjs';
import { token, meaning, agreement, methods, decoding } from './signals.mjs';
import {
  abstention,
  count,
  releaseGate,
  verificationPlan,
  replay,
  nextEdition,
} from './dispatch.mjs';

const chapters = [
  opening,
  atomic,
  verdicts,
  timeScope,
  incentives,
  binding,
  strict,
  routing,
  token,
  meaning,
  agreement,
  methods,
  decoding,
  abstention,
  count,
  releaseGate,
  verificationPlan,
  replay,
  nextEdition,
];
function draw(ctx, clock) {
  chapters[clock.beat.chapterIndex](paint(ctx, clock));
}
export default { title: 'How to Check an Answer Against Evidence', draw, check };
