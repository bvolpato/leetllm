import { requiredPhrasesPresent, cueProgress } from '../arithmetic.mjs';
import { answerabilityFixture } from '../model.mjs';

export function drawAnswerableUnits(ctx, scene, state, api) {
  const { C, text, line, rect } = api;
  const beat = state.beat ?? 0;
  const p = state.beatP ?? 0;
  const at = (id, a, b) => cueProgress(state, id, api.phase(p, a, b));
  const candidates = answerabilityFixture();
  const source = candidates[2].text;
  const reversed = source.replace('page on-call', 'do not page on-call');
  const insert = beat > 3 || (beat === 3 && at('edit-instruction', 0.03, 0.30) === 1);
  const candidate = insert ? reversed : candidates[Math.min(beat, 2)].text;
  const matches = requiredPhrasesPresent(candidate);
  const checkingEvent = beat === 1 && at('missing-trigger', 0.86, 0.96) < 1;
  const awaiting = checkingEvent || beat === 3 || (beat === 4 && at('same-result', 0.03, 0.29) < 1);
  api.focus.target('phrase-comparison', () => {
    text(ctx, 'Source   /   page 7', 140, 261, 31, C.muted);
    text(ctx, source, 140, 345, 47, C.ink);
    line(ctx, 140, 397, 1780, 397, C.muted, 2);
    text(ctx, 'Candidate passage', 140, 477, 31, C.blue);
    if (beat < 3) {
      const [paging, archive] = candidate.split(' Routine');
      text(ctx, paging, 140, 578, 48, C.ink);
      if (archive) text(ctx, 'Routine' + archive, 140, 646, 41, C.muted);
    } else {
      text(ctx, 'Rollback failure:', 140, 572, 49, C.ink);
      if (insert) text(ctx, 'do not', 540, 572, 49, C.yellow);
      text(ctx, 'page on-call within', insert ? 720 : 540, 572, 49, C.ink);
      text(ctx, '15 minutes with deploy ID.', 140, 648, 49, C.ink);
    }
    const required = ['rollback failure', '15 minutes', 'deploy ID'];
    required.forEach((phrase, i) => {
      const present = candidate.toLowerCase().includes(phrase.toLowerCase());
      const color = awaiting ? C.muted : present ? C.cyan : C.pink;
      const x = 140 + i * 563;
      rect(ctx, x, 734, 510, 95, C.panel, color, 4);
      text(ctx, phrase, x + 24, 795, 38, C.ink);
      text(ctx, awaiting ? '?' : present ? 'found' : 'missing', x + 480, 794, 29, color, 'right');
    });
    const verdict = checkingEvent ? 'Which event does the candidate name for the 15-minute deadline?'
      : awaiting ? 'Will the three-phrase check change?' : matches
      ? insert ? 'Phrase check passes. The instruction has reversed.' : 'Phrase check passes.'
      : 'Phrase check fails.';
    text(ctx, verdict, 960, 948, 43, awaiting ? C.yellow : insert ? C.pink : C.ink, 'center');
  });
}

export default {
  id: 'answerable-units', draw: drawAnswerableUnits, cues: ['missing-trigger', 'edit-instruction', 'same-result'],
};
