import { cueProgress, fieldDrawing } from '../field-drawing.mjs';
import { drawHandbook, drawTicket } from '../handbook.mjs';
import { manuals } from '../fixtures.mjs';
import { verifyAnswer } from '../model.mjs';

export function drawGrounding(ctx, scene, state, api) {
  const p = fieldDrawing(ctx, api);
  const checkedQuote = cueProgress(state, 'check-quote', 0, 0.43, 0.6) === 1;
  const mismatch = cueProgress(state, 'wrong-sensor', 1, 0.03, 0.16) === 1;
  const correct = cueProgress(state, 'try-seven', 1, 0.28, 0.42);
  const saved = cueProgress(state, 'save-line', 1, 0.6, 0.7) === 1;
  const missing = cueProgress(state, 'new-code', 2, 0.12, 0.22) === 1;
  const checkedIndex = cueProgress(state, 'no-record', 2, 0.34, 0.45) === 1;
  const review = cueProgress(state, 'local-review', 2, 0.52, 0.64) === 1;
  const question = { sensor: 'A', code: missing ? 'E9' : 'E2' };
  const page = correct === 1 ? 'M7' : 'M8';
  const proposed = { ...manuals[page], citation: page };
  const verified = verifyAnswer(question, proposed);
  const hasRecord = Object.values(manuals).some(
    (r) => r.sensor === question.sensor && r.code === question.code,
  );
  drawTicket(p, {
    ...question,
    status: missing ? 'Local definition' : saved ? 'Saved with source' : 'Proposed log entry',
    answer: missing ? undefined : page === 'M8' ? 'The lens is covered.' : 'The battery is low.',
    source: missing ? undefined : page,
    target: 'ground-ticket',
    answerTarget: 'ground-draft',
  });
  drawHandbook(p, {
    visible: true,
    meanings: true,
    selected: missing ? null : page,
    sweep: 1,
    target: 'ground-record',
  });
  if (correct > 0 && correct < 1) {
    const y = 604 - 178 * correct;
    p.dot(941, y, 9, p.C.yellow);
  }
  if (missing) {
    p.target('ground-result', () =>
      p.text(
        review && !hasRecord
          ? 'Leave blank   →   Local review'
          : checkedIndex && !hasRecord
            ? 'E9 has no entry in either manual.'
            : 'Which row matches A / E9?',
        960,
        920,
        45,
        review ? p.C.yellow : p.C.ink,
        'center',
      ),
    );
    return;
  }
  p.target('ground-result', () => {
    p.text(
      checkedQuote && verified.valueMatch ? 'Cited meaning matches' : 'Check the cited meaning',
      170,
      899,
      37,
      checkedQuote ? p.C.cyan : p.C.muted,
    );
    p.text(
      saved && verified.applies
        ? 'A = A   /   Save with M7'
        : mismatch && !verified.applies
          ? 'A ≠ B   /   Wrong sensor'
          : mismatch
            ? 'A = A   /   E2 = E2'
            : 'Does the page apply to sensor A?',
      958,
      899,
      39,
      mismatch && !verified.applies ? p.C.pink : saved ? p.C.green : p.C.ink,
    );
  });
}
export default {
  id: 'grounding',
  draw: drawGrounding,
  cues: [
    'check-quote',
    'wrong-sensor',
    'try-seven',
    'save-line',
    'new-code',
    'no-record',
    'local-review',
  ],
};
