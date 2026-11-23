import { voice } from '../construction.mjs';
import { drawRequestDesk } from '../request-desk.mjs';

export function drawPrinciple(ctx, scene, state, api) {
  const grant = voice(state, 'principle-grant', 1) > 0;
  const advance = voice(state, 'principle-read', 1);
  const claim = voice(state, 'principle-claim', 0) > 0;
  drawRequestDesk(ctx, api, {
    record: grant,
    destination: true,
    scope: true,
    second: true,
    runbook: true,
    publicStep: 1,
    privateStep: grant ? advance : 1,
    resume: grant,
    explain: !grant || advance === 1,
    note:
      voice(state, 'principle-version', 2) > 0
        ? 'Saved with this example     •     Incident access rule, version 3'
        : grant
          ? 'Incident owner approved this read.'
          : claim
            ? 'Engineer adds, “I manage this incident.”'
            : 'The incident owner has not granted access.',
  });
}
export default {
  id: 'principle',
  draw: drawPrinciple,
  cues: [
    'principle-rule',
    'principle-claim',
    'principle-grant',
    'principle-read',
    'principle-version',
  ],
};
