import { liveQuestion, paraphrase, policyDesk } from '../policy-desk.mjs';
import { cueProgress } from '../arithmetic.mjs';

export function drawIntro(ctx, scene, state, api) {
  const time = state.t ?? 1;
  if (time < 0.35) ctx.globalAlpha = 1;
  const progress = (beat, id, start, end) => cueProgress(state, beat, id, start, end);
  const live = state.beat === 3;
  const compare = state.beat === 2;
  const needsRule = state.beat === 1 && progress(1, 'restoration-rule', 0.3, 0.65) > 0;
  const lookupPolicy = needsRule && progress(1, 'read-policy', 0.66, 0.9) > 0;
  const sameFact = compare && progress(2, 'name-duration', 0.53, 0.67) > 0;
  const lookupIncident = live && progress(3, 'bypass-live', 0.52, 0.78) > 0;
  policyDesk(ctx, api, {
    arrival: 1 - Math.max(0, 1 - time / 0.96) ** 2,
    message: live
      ? liveQuestion.replace("'s current", '’s\ncurrent')
      : compare
        ? paraphrase.replace(' stay in', '\nstay in')
        : 'Can I restore a revoked\nAPI key?',
    compare,
    showKeys: compare && progress(2, 'different-key', 0.2, 0.37) > 0,
    field: needsRule
      ? 'Needed: restoration rule'
      : sameFact
        ? 'Needed: audit retention period'
        : '',
    transfer: compare ? progress(2, 'retention-answer', 0.83, 0.94) : 0,
    route: lookupPolicy
      ? 'Read restoration policy'
      : lookupIncident
        ? 'Read live incident record'
        : '',
  });
}

export default {
  id: 'intro',
  draw: drawIntro,
  cues: [
    'second-reader',
    'restoration-rule',
    'read-policy',
    'paraphrase',
    'different-key',
    'name-duration',
    'retention-answer',
    'live-question',
    'bypass-live',
  ],
};
