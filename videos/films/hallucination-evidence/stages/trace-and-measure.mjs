import { EVIDENCE, draftClaims, cases } from '../fixtures.mjs';
import { renderIncident, semanticSampleStats } from '../arithmetic.mjs';
import { incidentSheet, phraseProgress } from '../incident-sheet.mjs';

export function drawTraceAndMeasure(ctx, scene, state, api) {
  const { C, left, right, text, heading, pair, footer } = incidentSheet(ctx, api);
  const cue = (id, beat) => phraseProgress(state, api, id, beat);
  const sample = ['investigating', 'resolved', 'investigating', 'mitigated'];
  const eta = draftClaims[3];
  const id = state.beat === 0 ? 'req-missing' : state.beat === 1 ? 'req-eta' : 'req-vary';
  const proposed = id === 'req-eta' ? draftClaims : cases[0].claims;
  const response = renderIncident(proposed);
  if (state.beat < 3) {
    heading(left, 'Request trace', id, C.blue);
    heading(right, 'Investigation', 'Start at the first failed check', C.ink);
    pair(405, 'Admitted snapshot', id === 'req-missing' ? 'None' : 'INC-48291   /   version 1');
    pair(
      581,
      'Selected draft',
      id === 'req-missing'
        ? 'Cites a runbook'
        : id === 'req-eta'
          ? 'Recovery by ' + eta.value
          : 'Three supported claims',
    );
    if (id === 'req-eta')
      text(
        'Estimate verdict: ' + response.verdicts[3].replaceAll('_', ' '),
        left,
        765,
        32,
        C.yellow,
      );
    if (id === 'req-vary')
      text(
        'Sample disagreement: ' + semanticSampleStats(sample).disagreement.toFixed(2),
        left,
        765,
        34,
      );
    const result = [
      [
        'missing-trace',
        'Evidence admission',
        'Inspect the feed response, permissions',
        'and the origin of the citation.',
      ],
      [
        'eta-trace',
        'Claim generation',
        'Compare the proposed estimate with',
        'the retained runbook and returned text.',
      ],
      [
        'vary-trace',
        'Generation stability',
        'Replay the sampled answers using',
        'the saved model and sampling settings.',
      ],
    ][state.beat];
    if (cue(result[0], state.beat) === 1) {
      text(result[1], right, 464, 47, C.yellow);
      text(result[2], right, 572, 36);
      text(result[3], right, 630, 36);
    }
    footer('Where did this request first lose support or stability?');
  } else {
    heading(left, 'Admitted record', 'INC-48291   /   version 1', C.blue);
    heading(right, 'What the gate did', 'Two reviewed errors', C.ink);
    pair(424, 'Recovery estimate', 'No field');
    text('Sent “Recovery by 14:30 UTC.”', right, 479, 41);
    if (cue('review-errors', 3) === 1) text('False accept', right, 545, 31, C.pink);
    pair(649, 'Last event', EVIDENCE.facts.last_event);
    text('Rejected “database failover finished.”', right, 704, 36);
    if (cue('review-errors', 3) === 1) text('False reject', right, 770, 31, C.yellow);
    footer('Keep the source, verdict and returned text together for review.');
  }
}

export default {
  id: 'trace-and-measure',
  draw: drawTraceAndMeasure,
  cues: ['missing-trace', 'eta-trace', 'vary-trace', 'review-errors'],
};
