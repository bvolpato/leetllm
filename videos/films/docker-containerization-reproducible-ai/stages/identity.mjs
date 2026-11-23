import { CHANGED_FIXTURE, FIXTURE, OBSERVED_IMAGE_ID } from '../fixtures.mjs';
import { drawReadPaths, reportNote } from '../read-paths.mjs';

export function drawIdentity(ctx, scene, state, api) {
  const after = (id) => state.cues?.[id]?.phase === 'after';
  const restoring = after('identity-host-restore') || after('identity-restore');
  const changed = (after('identity-host-write') || after('identity-edit')) && !restoring;
  const ran = after('identity-reports') || state.beat > 0;
  const mountedRan = restoring ? after('identity-restore') : !changed || after('identity-edit');
  drawReadPaths(ctx, api, {
    imageName: 'I1 · ' + OBSERVED_IMAGE_ID.slice(7, 19),
    bakedRows: FIXTURE,
    hostRows: changed ? CHANGED_FIXTURE : FIXTURE,
    ran: [ran, ran && mountedRan],
    compared: [ran, ran && mountedRan && (!changed || after('identity-exact'))],
    editing: changed,
  });
  if (state.beat === 3)
    reportNote(
      ctx,
      api,
      after('identity-promotion')
        ? 'Release handoff: verified repository digest + platform'
        : 'Tested locally on linux/amd64',
      'promotion-reference',
      api.C.cyan,
    );
  else
    reportNote(
      ctx,
      api,
      after('identity-diff')
        ? 'Request 102   ·   Git: ' +
            FIXTURE[1].prediction +
            '   →   host: ' +
            CHANGED_FIXTURE[1].prediction
        : after('identity-exact')
          ? 'A higher score can still be a changed fixture'
          : 'Expected report: 0.667 (2/3)',
      'exact-check',
      after('identity-diff') ? api.C.yellow : after('identity-exact') ? api.C.pink : api.C.muted,
    );
}

export default {
  id: 'identity',
  draw: drawIdentity,
  cues: [
    'identity-image',
    'identity-reports',
    'identity-host-write',
    'identity-edit',
    'identity-exact',
    'identity-diff',
    'identity-host-restore',
    'identity-promotion',
    'identity-restore',
  ],
};
