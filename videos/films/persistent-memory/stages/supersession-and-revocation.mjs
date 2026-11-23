import { BILLING, cue } from '../case-file.mjs';
import { sourceProjectionState } from '../model.mjs';

export function drawSupersessionAndRevocation(ctx, scene, state, api) {
  const { C } = api;
  const done = (id) => cue(api, id) >= 1;
  const restored = done('grant-reset');
  const deleted = done('source-tombstone') && !restored;
  const grant = !done('revoke-grant');
  const revised = done('source-update');
  const refreshed = done('projection-refresh');
  const sourceVersion = restored ? 4 : deleted ? 3 : revised ? 2 : 1;
  const projectionVersion = restored ? 4 : refreshed ? 2 : 1;
  const checkingExpiry = state.beat === 3;
  const atExpiry = checkingExpiry && done('at-expiry');
  let now = deleted || restored ? 103 : revised ? 102 : 101;
  if (checkingExpiry && done('before-expiry')) now = atExpiry ? 200 : 199;
  const sourceValue = revised ? BILLING : 'pnpm test';
  const late = deleted && done('late-refresh');
  const updatedGrantRead = !grant && done('denied-read');
  const status = sourceProjectionState({
    sourceVersion,
    projectionVersion,
    grant,
    tombstone: deleted,
    expired: now >= 200,
    queuedRefresh: late || updatedGrantRead,
  });
  const read = atExpiry
    ? done('expired-read')
    : restored
      ? grant || updatedGrantRead
      : deleted
        ? late
        : refreshed
          ? done('refreshed-read')
          : revised
            ? done('empty-read')
            : done('read-reopened');

  api.text(
    ctx,
    'SQLite exercise   /   acme  ·  billing  ·  Ada',
    115,
    257,
    32,
    C.muted,
    'left',
    'mono',
  );
  api.text(ctx, 'Record · version', 115, 348, 30, C.muted);
  api.text(ctx, 'Source ID', 825, 348, 30, C.muted);
  api.text(ctx, 'Value or pointer', 1250, 348, 30, C.muted);
  const register = (id, y, label, version, detail, color) =>
    api.focus.target(id, () => {
      api.line(ctx, 115, y - 69, 1800, y - 69, C.muted, 2);
      api.text(ctx, label + ' · v' + version, 115, y, 43, color, 'left', 'serif');
      api.text(ctx, 't3', 825, y, 42, C.ink, 'left', 'mono');
      api.text(ctx, detail, 1250, y, 33, color, 'left', 'mono');
    });
  register(
    'source-row',
    459,
    'Project profile',
    sourceVersion,
    deleted ? 'Deleted' : sourceValue,
    deleted ? C.pink : C.blue,
  );
  register('index-row', 586, 'Search projection', projectionVersion, '→ source t3', C.cyan);

  api.focus.target('read-result', () => {
    api.rect(ctx, 110, 666, 1700, 171, C.panel, null, 6);
    api.text(ctx, 'memory.recall(now=' + now + ')', 143, 722, 36, C.ink, 'left', 'mono');
    api.text(
      ctx,
      grant ? 'Ada’s grant active' : 'Ada’s grant removed',
      1754,
      721,
      30,
      grant ? C.muted : C.pink,
      'right',
    );
    const rows = status.readable ? "['" + sourceValue + "']" : '[]';
    const result = read ? rows : 'Return value?';
    api.text(
      ctx,
      result,
      143,
      801,
      49,
      read ? (status.readable ? C.green : C.ink) : C.yellow,
      'left',
      'mono',
    );
    if (state.beat === 2 && done('empty-read')) {
      api.text(
        ctx,
        status.readable ? 'Version + grant match: readable' : 'Version mismatch: omit stale copy',
        1754,
        796,
        33,
        status.readable ? C.green : C.yellow,
        'right',
      );
    }
    if (late || updatedGrantRead)
      api.text(
        ctx,
        'Refresh admitted?  ' + (status.refreshAdmitted ? 'True' : 'False'),
        1754,
        796,
        32,
        C.pink,
        'right',
      );
  });
  if (checkingExpiry) {
    api.text(ctx, 'Source expires at 200', 115, 939, 40, C.yellow);
    api.text(ctx, 'Read requires now < 200', 890, 939, 40, C.ink, 'left', 'mono');
  } else if (state.beat === 4) {
    api.focus.target('saved-packet', () => {
      api.text(ctx, 'Saved prompt  /  before deletion', 117, 919, 30, C.muted);
      if (done('keep-packet'))
        api.text(ctx, "['" + BILLING + "']", 117, 987, 42, C.ink, 'left', 'mono');
    });
  } else if (state.beat === 5) {
    api.text(
      ctx,
      restored
        ? 'Separate grant check   /   matching versions'
        : 'Separate grant check   /   restore the test record',
      115,
      952,
      36,
      C.muted,
    );
  } else if (state.beat === 1 && revised) {
    api.text(ctx, 'What will this index read return?', 115, 952, 39, C.yellow);
  }
}
export default {
  id: 'supersession-and-revocation',
  draw: drawSupersessionAndRevocation,
  cues: [
    'read-reopened',
    'source-update',
    'empty-read',
    'projection-refresh',
    'refreshed-read',
    'before-expiry',
    'at-expiry',
    'expired-read',
    'keep-packet',
    'source-tombstone',
    'late-refresh',
    'grant-reset',
    'revoke-grant',
    'denied-read',
  ],
};
