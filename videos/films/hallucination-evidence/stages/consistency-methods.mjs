import { EVIDENCE, draftClaims, resolvedClaim } from '../fixtures.mjs';
import { verifyClaim } from '../arithmetic.mjs';
import { incidentSheet, phraseProgress } from '../incident-sheet.mjs';

const service = draftClaims.find((claim) => claim.field === 'service');
const estimate = draftClaims.find((claim) => claim.field === 'recovery_eta');

function drawExtraction(ctx, state, api, cue) {
  const { C, left, text } = incidentSheet(ctx, api);
  const serviceProgress = cue('extract-service', 0);
  const estimateProgress = cue('extract-estimate', 1, 0.08, 0.2);
  const scoredService = cue('score-service', 0, 0.55, 0.7) === 1;
  const scoredBoth = cue('score-both', 1, 0.25, 0.4) === 1;
  const claims = [service, estimate];
  text('Draft status update', left, 292, 48, C.ink, 'left', 'serif');
  text('Checked against the runbook', 875, 292, 43, C.blue, 'left', 'serif');
  api.line(ctx, left, 328, 1785, 328, C.muted, 2);
  claims.forEach((claim, i) => {
    const y = 455 + i * 175;
    const progress = i === 0 ? serviceProgress : estimateProgress;
    text(i === 0 ? 'Service' : 'Full recovery expected by', left, y - 56, 32, C.muted);
    text(claim.value, left, y + 13, 56);
    if (progress > 0) {
      const x = api.lerp(553, 842, progress);
      api.line(ctx, 553, y, x, y, C.blue, 4);
      api.circle(ctx, x, y, 8, C.blue);
    }
    if (progress === 1) text(claim.value, 875, y + 13, 49);
    if (i === 0 ? scoredService : scoredBoth) {
      const supported = verifyClaim(claim).verdict === 'supported';
      text(
        supported ? 'Service matches' : 'No recovery estimate',
        875,
        y + 69,
        33,
        supported ? C.green : C.yellow,
      );
    }
  });

  if (scoredService && (estimateProgress === 0 || scoredBoth)) {
    const checked = scoredBoth ? claims : [service];
    const supported = checked.filter((claim) => verifyClaim(claim).verdict === 'supported');
    text('Supported / checked', 1595, 405, 32, C.muted, 'center');
    text(supported.length + '/' + checked.length, 1595, 552, 107, C.ink, 'center', 'mono');
  }
  api.line(ctx, left, 768, 1785, 768, C.muted, 2);
  if (cue('knowledge-source', 1, 0.4, 0.55) > 0) {
    text('FActScore', left, 850, 42, C.blue);
    text('Check atomic facts against a knowledge source.', 459, 850, 38);
    if (cue('retrieved-context', 1, 0.67, 0.8) > 0) {
      text('Ragas', left, 945, 42, C.blue);
      text('Check each statement against retrieved context.', 459, 945, 38);
    }
  } else if (state.beat === 0 && scoredService) {
    text('What did the checker miss?', left, 870, 48, C.ink, 'left', 'serif');
  }
}

function drawSamples(ctx, api, cue) {
  const { C, left, text } = incidentSheet(ctx, api);
  const rows = [
    [0.4, 0.1, 0.5],
    [0.6, 0.2, 0.2],
  ];
  const scores = rows.map(([entail, contradict]) => contradict / (entail + contradict));
  const colors = [C.blue, C.pink, C.muted];
  text('SelfCheckGPT', left, 270, 52, C.ink, 'left', 'serif');
  text('Compare one sentence with two passages from the same model.', left, 337, 38);
  ['Entailment', 'Contradiction', 'Neutral'].forEach((name, i) => {
    const x = 485 + 415 * i;
    api.circle(ctx, x, 411, 10, colors[i]);
    text(name, x + 25, 422, 31);
  });
  rows.forEach((row, i) => {
    const y = 482 + i * 185;
    text('Passage ' + (i + 1), left, y + 58, 40);
    let x = 475;
    row.forEach((probability, j) => {
      const width = probability * 1250;
      api.rect(ctx, x, y, width - 3, 83, colors[j], undefined, 1);
      text(probability.toFixed(1), x + width / 2, y + 56, 34, C.bg, 'center');
      x += width;
    });
    if (cue('selfcheck-normalize', 2, 0.5, 0.6) === 1) {
      const [entail, contradict] = row;
      text(
        contradict + ' / (' + entail + ' + ' + contradict + ') = ' + scores[i].toFixed(2),
        475,
        y + 139,
        36,
      );
    }
  });
  api.line(ctx, left, 857, 1785, 857, C.muted, 2);
  if (cue('selfcheck-mean', 2, 0.66, 0.76) === 1) {
    const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    text('Mean contradiction score', left, 946, 43, C.ink, 'left', 'serif');
    text(
      '(' + scores.map((s) => s.toFixed(2)).join(' + ') + ') / 2 = ' + mean.toFixed(3),
      849,
      946,
      43,
      C.yellow,
    );
  } else {
    text('Score each passage using contradiction / (entailment + contradiction).', left, 946, 39);
  }
}

function drawRunbook(ctx, api, cue) {
  const { C, left, text } = incidentSheet(ctx, api);
  text('Runbook premise', left, 309, 47, C.blue, 'left', 'serif');
  text('Proposed claim', 790, 309, 47, C.ink, 'left', 'serif');
  text('Expected label', 1410, 309, 42, C.ink, 'left', 'serif');
  api.line(ctx, left, 346, 1785, 346, C.muted, 2);
  text('Status', left, 456, 33, C.muted);
  text(EVIDENCE.facts.status, left, 529, 55);
  text('Recovery estimate', left, 703, 33, C.muted);
  text('No field', left, 776, 55);
  text('Status is ' + resolvedClaim.value, 790, 498, 43);
  if (cue('consistency-methods-b3', 3, 0.2, 0.32) === 1) {
    text('Contradiction', 1410, 498, 43, C.pink);
  }
  const match = cue('match-status', 3, 0.34, 0.44);
  if (match > 0) text('Status is ' + EVIDENCE.facts.status, 790, 645, 43);
  if (match === 1) text('Entailment', 1410, 645, 43, C.green);
  const neutral = cue('neutral-estimate', 3, 0.46, 0.59);
  if (neutral > 0) text('Recovery by ' + estimate.value, 790, 792, 43);
  if (neutral === 1) text('Neutral', 1410, 792, 43, C.yellow);
}

export function drawConsistencyMethods(ctx, scene, state, api) {
  const cue = (id, beat, from, to) => phraseProgress(state, api, id, beat, from, to);
  if (state.beat < 2) drawExtraction(ctx, state, api, cue);
  else if (state.beat === 2) drawSamples(ctx, api, cue);
  else drawRunbook(ctx, api, cue);
}

export default {
  id: 'consistency-methods',
  draw: drawConsistencyMethods,
  cues: [
    'extract-service',
    'score-service',
    'extract-estimate',
    'score-both',
    'knowledge-source',
    'retrieved-context',
    'consistency-methods-b2',
    'selfcheck-normalize',
    'selfcheck-mean',
    'consistency-methods-b3',
    'match-status',
    'neutral-estimate',
  ],
};
