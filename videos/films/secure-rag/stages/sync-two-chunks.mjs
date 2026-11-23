import { reconcileChunks } from '../arithmetic.mjs';
import { drawFooter, drawHeading, drawRectangle, drawText } from '../defaults.mjs';
export function drawSyncTwoChunks(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = Math.max(0, Math.min(1, state.beatP ?? 0)),
    clamp = (x) => Math.max(0, Math.min(1, x));
  const cue = (name, beat = 0) => {
      const id = 'sr-sync-two-chunks-' + name,
        v = state.cues?.[id];
      if (state.cues && !v) throw Error('Missing secure RAG cue ' + id);
      return v
        ? {
            q: v.phase === 'before' ? 0 : v.phase === 'after' ? 1 : v.progress,
            done: v.phase === 'after',
          }
        : {
            q: currentBeat < beat ? 0 : currentBeat > beat ? 1 : clamp((progress - 0.08) / 0.75),
            done: currentBeat > beat || (currentBeat === beat && progress > 0.86),
          };
    },
    Q = (n, i) => cue(n, i).q,
    resultComplete = (n, i) => cue(n, i).done;
  api.focus.target('sr-sync-two-chunks-mechanism', () => {
    let rows = ['A', 'A', 'B', 'B'].map((tenant, i) => ({
      id: 'c' + (i % 2),
      tenant,
      revision: 1,
      groups: [tenant === 'A' ? 'security' : 'operations'],
      deleted: false,
    }));
    if (currentBeat > 0) rows = reconcileChunks(rows, 'A', 2, []).rows;
    else {
      const updated = Math.floor(Q('reconcile', 0) * 2 + 1e-9);
      rows = rows.map((r, i) =>
        i < updated
          ? {
              ...r,
              revision: 2,
              groups: [],
            }
          : r,
      );
    }
    if ((currentBeat > 0 && resultComplete('delete', 1)) || currentBeat === 2)
      rows = reconcileChunks(rows, 'A', 3, [], true).rows;
    if (currentBeat === 2 && resultComplete('restore', 2))
      rows = reconcileChunks(rows, 'A', 4, ['security'], false).rows;
    const eventMissed = resultComplete('stale', 0);
    const source =
      currentBeat === 2 && resultComplete('restore', 2)
        ? { revision: 4, grant: 'security' }
        : currentBeat === 2 || resultComplete('delete', 1)
          ? { revision: 3, grant: 'deleted' }
          : currentBeat > 0 || eventMissed
            ? { revision: 2, grant: 'no groups' }
            : { revision: 1, grant: 'security' };
    drawHeading(
      ctx,
      api,
      'Tenant A source   /   signing-key runbook   /   revision ' +
        source.revision +
        '   /   ' +
        source.grant,
    );
    rows.forEach((r, i) => {
      const x = 180 + (i % 2) * 850,
        y = 365 + Math.floor(i / 2) * 250;
      drawRectangle(
        ctx,
        api,
        x,
        y,
        740,
        195,
        r.tenant === 'A' ? themeColors.blue : themeColors.cyan,
      );
      drawText(
        ctx,
        api,
        r.tenant + ':' + r.id,
        x + 25,
        y + 43,
        28,
        themeColors.ink,
        'left',
        'mono',
      );
      drawText(ctx, api, 'revision ' + r.revision, x + 25, y + 92, 30, themeColors.yellow);
      drawText(
        ctx,
        api,
        r.deleted ? 'DELETED' : r.groups.length ? r.groups.join(', ') : 'no groups',
        x + 25,
        y + 148,
        29,
        r.deleted || !r.groups.length ? themeColors.pink : themeColors.green,
      );
    });
    if (currentBeat === 0)
      drawText(
        ctx,
        api,
        resultComplete('reconcile', 0)
          ? 'Revision 2 reconciled to both A chunks'
          : Q('reconcile', 0) > 0
            ? 'Reconciled ' +
              rows.filter((r) => r.tenant === 'A' && r.revision === 2).length +
              '/2 A chunks; serving reads held'
            : eventMissed
              ? 'Missed event leaves both A chunks stale'
              : 'Both A chunks match the source',
        960,
        930,
        29,
        resultComplete('reconcile', 0)
          ? themeColors.green
          : eventMissed
            ? themeColors.pink
            : themeColors.blue,
        'center',
      );
    if (currentBeat === 1)
      drawText(
        ctx,
        api,
        resultComplete('delete', 1)
          ? 'Revision 3 tombstones A; B remains revision 1'
          : resultComplete('old', 1)
            ? 'Old revision 1 → zero updates; repeat 2 → zero'
            : 'Monotonic revision comparison',
        960,
        930,
        29,
        themeColors.yellow,
        'center',
      );
    if (currentBeat === 2)
      drawText(
        ctx,
        api,
        resultComplete('restore', 2)
          ? 'Trusted revision 4 restores this toy record'
          : 'Tombstones deny reads; retention is separate',
        960,
        930,
        29,
        resultComplete('restore', 2) ? themeColors.green : themeColors.yellow,
        'center',
      );
    drawFooter(
      ctx,
      api,
      'Local sequential dictionary loop; serving publication still requires atomicity or a trusted version gate.',
    );
  });
}
export default {
  id: 'sync-two-chunks',
  draw: drawSyncTwoChunks,
  cues: [
    'sr-sync-two-chunks-0',
    'sr-sync-two-chunks-stale',
    'sr-sync-two-chunks-reconcile',
    'sr-sync-two-chunks-1',
    'sr-sync-two-chunks-old',
    'sr-sync-two-chunks-delete',
    'sr-sync-two-chunks-other',
    'sr-sync-two-chunks-2',
    'sr-sync-two-chunks-restore',
  ],
};
