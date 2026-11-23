import { rayChapterState } from '../construction.mjs';
import { chapterGrid, heading } from '../defaults.mjs';
export function drawFailureEvidence(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = rayChapterState('failure-evidence', state),
    { b: currentBeat, p: progress } = modelState;
  api.focus.target('ray-failure-evidence-mechanism', () => {
    heading(
      ctx,
      api,
      currentBeat === 0
        ? 'On one machine'
        : currentBeat === 1
          ? 'What to look for on two nodes'
          : 'What to record through a restart',
    );
    const rows =
      currentBeat === 0
        ? [
            ['Placement', '2 reserved bundles', 'a task ran in each'],
            ['Ledger call', '3 results counted', 'nested list kept its handles'],
            ['Actor restart', 'new process ID', 'count returned to 0'],
            ['Worker retry', 'marker on local disk', 'second attempt finished'],
          ]
        : currentBeat === 1
          ? [
              ['Transfer', 'producer on A, consumer on B', 'bytes arrive on B'],
              ['Every copy lost', 'owner stays alive', 'task runs again'],
              ['Owner dies', 'copy stays on B', 'read the old handle'],
            ]
          : [
              ['GCS reload', 'storage and reconnect deadline', 'which calls go through?'],
              ['Lost reply', 'one batch ID across restarts', 'writes committed and reply'],
            ];
    const n = Math.min(rows.length, 1 + Math.floor(progress * rows.length));
    chapterGrid(
      ctx,
      api,
      [
        currentBeat === 0
          ? ['Check', 'Observation', 'Outcome']
          : ['Experiment', 'Follow', 'Look for'],
        ...rows.slice(0, n),
      ],
      150,
      380,
      1600,
      115 * (n + 1),
      themeColors.blue,
      27,
    );
  });
}
export default {
  id: 'failure-evidence',
  draw: drawFailureEvidence,
  cues: ['ray-failure-evidence-op-0', 'ray-failure-evidence-op-1', 'ray-failure-evidence-op-2'],
};
