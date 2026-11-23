import { cueAmount, cueDone } from '../defaults.mjs';
import { visitMap } from '../visit-map.mjs';

export function drawSubjectIntro(ctx, scene, state, api) {
  const consideringHistory = cueAmount(state, 'intro-history') > 0;
  const next = cueDone(state, 'intro-next');
  visitMap(ctx, api, {
    artTrain: cueAmount(state, 'intro-art'),
    artQuiet: consideringHistory,
    showTask: cueAmount(state, 'intro-task') > 0,
    historyNote: next ? 'Look up today’s hours' : consideringHistory ? 'Hours unknown' : '',
    question: next
      ? 'Next lookup   /   History Museum hours'
      : cueAmount(state, 'intro-question') > 0
        ? 'Which lookup first?     Opening hours   /   Train to History'
        : '',
  });
}
export default {
  id: 'subject-intro',
  draw: drawSubjectIntro,
  cues: [
    'intro-task',
    'intro-art',
    'intro-closure',
    'intro-history',
    'intro-question',
    'intro-next',
  ],
};
