import {
  cueProgress,
  cueVisible,
  evidenceBox,
  evidenceFootnote,
  evidenceLane,
  evidenceLine,
  evidenceText,
} from '../defaults.mjs';
export function drawProcessContract(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = state.beatP ?? 0;
  api.focus.target('process-contract-mechanism', () => {
    if (currentBeat === 0) {
      evidenceText(ctx, api, 'Strict happy path', 220, 300, 34, themeColors.ink);
      evidenceLane(
        ctx,
        api,
        ['lookup', 'write', 'verify'],
        365,
        [themeColors.blue, themeColors.yellow, themeColors.green],
        cueProgress(ctx, api, 'strict-once'),
      );
      if (cueVisible(ctx, api, 'strict-reject')) {
        evidenceBox(ctx, api, 'duplicate lookup', 1320, 530, 390, 90, themeColors.pink);
        evidenceText(ctx, api, 'Strict contract rejects', 1060, 587, 28, themeColors.pink, 'right');
      }
      if (cueVisible(ctx, api, 'retry-contract')) {
        evidenceText(ctx, api, 'Status-aware recovery policy', 220, 660, 33, themeColors.ink);
        evidenceLane(
          ctx,
          api,
          ['read · timeout', 'read · success', 'write → verify'],
          720,
          [themeColors.yellow, themeColors.blue, themeColors.green],
          cueProgress(ctx, api, 'retry-contract'),
        );
        evidenceText(
          ctx,
          api,
          '4 dispatches count · different allowed sequence',
          960,
          895,
          30,
          themeColors.cyan,
          'center',
        );
      }
      evidenceFootnote(ctx, api, 'The scorer and recovery policy must agree on the allowed trace');
    } else if (currentBeat === 1) {
      const late = cueVisible(ctx, api, 'permit-late'),
        callChange = !late && cueVisible(ctx, api, 'permit-call'),
        mutate = !late && !callChange && cueVisible(ctx, api, 'permit-mutate');
      evidenceText(ctx, api, 'Permit for a promotion request', 270, 300, 34, themeColors.cyan);
      evidenceText(ctx, api, 'Dispatched promotion request', 1060, 300, 34, themeColors.yellow);
      const a = [
          'candidate: cand-221',
          'call: ' + (callChange ? 'call-previous' : 'call-221'),
          'target: prod-10pct',
          'permit time: ' + (late ? 13 : 11),
        ],
        z = [
          'candidate: ' + (mutate ? 'cand-999' : 'cand-221'),
          'call: call-221',
          'target: prod-10pct',
          'start time: 12',
        ];
      a.forEach((v, i) => {
        evidenceBox(
          ctx,
          api,
          v,
          220,
          355 + i * 118,
          650,
          85,
          (late && i === 3) || (callChange && i === 1) ? themeColors.pink : themeColors.cyan,
        );
        evidenceBox(
          ctx,
          api,
          z[i],
          1040,
          355 + i * 118,
          650,
          85,
          (i === 0 && mutate) || (i === 1 && callChange) || (i === 3 && late)
            ? themeColors.pink
            : themeColors.yellow,
        );
        evidenceLine(
          ctx,
          api,
          890,
          397 + i * 118,
          1020,
          397 + i * 118,
          (i === 0 && mutate) || (i === 1 && callChange) || (i === 3 && late)
            ? themeColors.pink
            : themeColors.green,
        );
      });
      evidenceFootnote(
        ctx,
        api,
        'The host authenticates the actor and checks expiry and revocation.',
      );
    } else {
      const again = cueVisible(ctx, api, 'write-again'),
        resource = cueVisible(ctx, api, 'resource-bind'),
        version = cueVisible(ctx, api, 'version-bind'),
        outcome = cueVisible(ctx, api, 'outcome-bind');
      evidenceText(
        ctx,
        api,
        'Same resource domain · later evidence must cover each effect',
        960,
        280,
        32,
        themeColors.ink,
        'center',
      );
      evidenceLane(ctx, api, ['W1 · v3', 'V1 · B7 / v3', again ? 'W2 · v4' : 'next event'], 350, [
        themeColors.yellow,
        themeColors.green,
        again ? themeColors.yellow : themeColors.muted,
      ]);
      if (again) {
        const answered = state.cues?.['missing-read']?.phase === 'after';
        evidenceLine(ctx, api, 1062, 455, 1062, 540, themeColors.yellow);
        evidenceBox(
          ctx,
          api,
          answered ? 'Needs a later successful read' : 'Which read checks W2?',
          782,
          540,
          560,
          90,
          themeColors.yellow,
        );
      }
      if (resource) {
        const target = outcome
          ? 'B7 · v5 · count 0'
          : version
            ? 'B7 · v2 · count 1'
            : 'B8 · v4 · count 1';
        evidenceBox(ctx, api, 'Returned: ' + target, 260, 730, 1380, 100, themeColors.pink);
        evidenceText(
          ctx,
          api,
          outcome
            ? 'Newer version lost the intended hold'
            : version
              ? 'Right book, stale version'
              : 'Later read, wrong book',
          960,
          890,
          33,
          themeColors.pink,
          'center',
        );
      }
      evidenceFootnote(
        ctx,
        api,
        'Order + status + resource + comparable version + intended outcome are separate checks',
      );
    }
  });
  return;
}
export default {
  id: 'process-contract',
  draw: drawProcessContract,
  cues: [
    'strict-once',
    'strict-reject',
    'retry-contract',
    'permit-bind',
    'permit-mutate',
    'permit-late',
    'permit-call',
    'write-again',
    'missing-read',
    'resource-bind',
    'version-bind',
    'outcome-bind',
  ],
};
