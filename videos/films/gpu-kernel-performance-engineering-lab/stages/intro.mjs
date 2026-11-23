import { copyPass, drawCopyPass } from '../copy-check.mjs';

export function drawIntro(ctx, scene, state, api) {
  const p = (key) => api.focus.progress(key, 0);
  const first = state.beat === 0;
  const travel = first ? p('copy-six') : 0;
  const stores = first ? 15 + Math.floor(travel) : Math.floor(15 * p('skip-store'));
  const snapshot = copyPass(first ? 'empty' : 'previous', first ? 'repaired' : 'skipped', stores);
  const compared = api.focus.cue('stale-match')?.phase === 'after';
  const retest = p('stale-retest') > 0;
  drawCopyPass(ctx, api, snapshot, {
    origin: first ? 'First launch  ·  final write' : 'Second launch  ·  reuse the previous output',
    step: `${stores} / 16 destinations written${first ? '' : ' by this launch'}${retest ? '   ·   ' + snapshot.mismatches + ' bit mismatches' : ''}`,
    readout: first
      ? 'Cyan squares have a fresh write'
      : retest
        ? 'What starting value would expose the missed store?'
        : compared
          ? `${snapshot.mismatches} bit mismatches     ·     B[2, 1] still holds the old six`
          : stores === 15
            ? 'How many bit mismatches will the checker find?'
            : 'Cyan squares have a fresh write',
    inspection: !first,
    rowCloseup: true,
    travel: first ? travel : undefined,
  });
}
export default {
  id: 'intro',
  draw: drawIntro,
  cues: ['copy-six', 'skip-store', 'stale-match', 'stale-retest'],
};
