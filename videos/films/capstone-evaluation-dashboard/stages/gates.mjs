import { dashboardDecision, dashboardRows, dashboardStarted } from '../arithmetic.mjs';
import { runSheet } from '../run-sheet.mjs';

export function drawGates(ctx, scene, state, api) {
  const repair = state.beat > 0 || dashboardStarted(state, 'new-output', state.beatP > 0.5);
  const checked = state.beat > 0 && dashboardStarted(state, 'regrade-four', state.beatP > 0.15);
  const run = repair ? 'hybrid-v2' : 'hybrid-v1';
  const footer =
    repair && !checked
      ? ['Grade the new output', 'Check its status, citations and complete answer.']
      : [
          dashboardDecision(dashboardRows(run)),
          repair
            ? 'Four curated fixtures. Regional policy has no tested case.'
            : 'The rewording passes. The private-note request requires abstention.',
          repair ? api.C.green : api.C.pink,
        ];
  runSheet(ctx, api, { run, checked: !repair || checked, inspect: !repair, footer });
}

export default { id: 'gates', draw: drawGates, cues: ['new-output', 'regrade-four'] };
