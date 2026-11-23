import { EVIDENCE, draftClaims } from '../fixtures.mjs';
import { renderIncident, semanticSampleStats } from '../arithmetic.mjs';
import { incidentSheet, phraseProgress } from '../incident-sheet.mjs';

export function drawConsistencySignal(ctx, scene, state, api) {
  const { C, left, right, text, heading, footer } = incidentSheet(ctx, api);
  const cue = (id, beat) => phraseProgress(state, api, id, beat);
  const repeat = cue('four-estimates', 4) > 0;
  const changed = cue('third-vote', 2) > 0;
  const tally =
    (repeat
      ? cue('repeat-tally', 5)
      : changed
        ? cue('boundary-tally', 3)
        : cue('first-tally', 1)) === 1;
  const status = EVIDENCE.facts.status;
  const eta = draftClaims[3].value;
  const samples = repeat
    ? Array(4).fill(eta)
    : [status, status, changed ? status : 'mitigated', 'resolved'];
  const { disagreement, counts } = semanticSampleStats(samples);
  const evidence = renderIncident(
    repeat
      ? draftClaims
      : [
          {
            id: 'selected',
            field: 'status',
            value: status,
            sourceId: EVIDENCE.sourceId,
            version: EVIDENCE.version,
          },
        ],
  );
  const labels = repeat ? [eta] : [status, 'mitigated', 'resolved'];
  heading(left, 'Four sampled answers', 'One model   /   supplied examples', C.ink);
  heading(
    right,
    'Count by meaning',
    repeat ? 'Proposed recovery estimate' : 'Proposed incident status',
    C.blue,
  );
  samples.forEach((s, i) => {
    const y = 432 + i * 96;
    text(String(i + 1), left, y, 32, C.muted);
    text(s, left + 88, y, 46, changed && !repeat && i === 2 ? C.cyan : C.ink);
  });
  labels.forEach((label, i) => {
    const y = 420 + i * 107;
    text(label, right, y, 35);
    const count = samples.filter((s) => s === label).length;
    for (let n = 0; n < 4; n++)
      api.circle(ctx, right + 350 + n * 65, y - 12, 20, n < count ? C.blue : C.panel, C.muted, 2);
  });
  if (tally)
    text(
      'Disagreement   1 − ' + Math.max(...counts) + '/4 = ' + disagreement.toFixed(2),
      right,
      773,
      40,
    );
  const outcome =
    evidence.route === 'shorten'
      ? 'Shorten the draft. Four matching guesses still have no runbook field.'
      : disagreement > 0.25
        ? 'Review the supported draft. Disagreement exceeds 0.25.'
        : 'Serve the supported draft. Disagreement equals the cutoff.';
  if (tally)
    footer(outcome, evidence.route === 'shorten' || disagreement > 0.25 ? C.yellow : C.green);
  else if (repeat) footer('The draft adds this estimate. The runbook has no estimate field.');
  else
    footer(
      changed
        ? 'Review above 0.25. Does this supported draft go to review?'
        : 'The selected status matches the record. Review above 0.25.',
    );
}

export default {
  id: 'consistency-signal',
  draw: drawConsistencySignal,
  cues: [
    'first-votes',
    'first-tally',
    'third-vote',
    'boundary-tally',
    'four-estimates',
    'repeat-tally',
  ],
};
