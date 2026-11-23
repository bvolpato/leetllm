import { BILLING, INVOICES, cue, promptSheet, replaySlip } from '../case-file.mjs';
import { sourceProjectionState } from '../model.mjs';

export function drawReturnSession(ctx, scene, state, api) {
  const { C } = api;
  const changed = cue(api, 'fresh-source-three') >= 1;
  const sourceVersion = changed ? 3 : 2;
  const current = changed ? INVOICES : BILLING;
  const projectionVersion = 2;
  const { readable } = sourceProjectionState({
    sourceVersion,
    projectionVersion,
    grant: true,
    tombstone: false,
  });
  const omitted = cue(api, 'fresh-stale-answer') >= 1 && !readable;
  const pinned = omitted && cue(api, 'fresh-profile-pin') >= 1;
  api.focus.target('profiles', () => {
    if (state.beat === 3) {
      replaySlip(ctx, api, 105, 345);
      api.text(ctx, 'Saved replay  /  billing log R8', 460, 853, 32, C.muted, 'center');
      return;
    }
    if (state.beat === 2) {
      const wait = cue(api, 'background-refresh');
      api.text(ctx, 'Two reads for this reply', 110, 319, 46, C.ink, 'left', 'serif');
      api.text(ctx, 'Project profile', 116, 447, 36, C.ink);
      api.line(ctx, 117, 498, 362, 498, C.green, 8);
      api.circle(ctx, 362, 498, 11, C.green);
      api.text(ctx, 'Invoices test ready', 116, 559, 37, C.green);
      api.text(ctx, 'Related replays', 116, 690, 36, C.ink);
      api.line(ctx, 117, 744, api.lerp(420, 713, wait), 744, C.yellow, 8);
      api.line(ctx, 713, 405, 713, 767, C.muted, 2);
      api.text(ctx, 'Deadline', 713, 837, 35, C.muted, 'center');
      api.text(ctx, wait >= 1 ? 'Fetch on a later call' : 'Searching…', 116, 837, 37, C.yellow);
      return;
    }
    api.text(ctx, 'Billing project  /  test preference', 106, 294, 37, C.ink, 'left', 'serif');
    for (const [i, [label, version, value, color]] of [
      ['Direct profile', sourceVersion, current, C.blue],
      ['Search copy', projectionVersion, BILLING, omitted ? C.muted : C.cyan],
    ].entries()) {
      const y = 405 + i * 185;
      api.text(ctx, label, 116, y, 34, color);
      api.text(ctx, 'v' + version, 795, y, 39, color, 'right', 'mono');
      api.text(ctx, value, 116, y + 67, 39, i === 1 && omitted ? C.muted : C.ink, 'left', 'mono');
      api.line(ctx, 116, y + 102, 798, y + 102, C.muted, 2);
    }
    if (omitted) {
      api.text(ctx, 'REJECT stale projection; read current scoped profile', 116, 760, 29, C.yellow);
      api.text(ctx, 'Index refresh queued', 116, 818, 34, C.muted);
    }
  });
  api.focus.target('request', () => {
    promptSheet(ctx, api, {
      heading: pinned ? 'Next prompt · pinned v' + sourceVersion + ' verifier' : undefined,
      replayCopy: 1,
      showInvoiceCount: true,
      branch: true,
      showVerifier: true,
      verifier: pinned ? current : undefined,
      pending: cue(api, 'final-checkpoint') >= 1,
    });
    if (state.beat === 0 && cue(api, 'fresh-choice') > 0)
      api.text(ctx, 'Which command belongs on this line?', 1353, 985, 36, C.yellow, 'center');
  });
}

export default {
  id: 'return-session',
  draw: drawReturnSession,
  cues: [
    'fresh-source-three',
    'fresh-choice',
    'fresh-stale-answer',
    'fresh-profile-pin',
    'background-refresh',
    'final-checkpoint',
  ],
};
