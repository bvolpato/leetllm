import { scopedReleaseRead } from '../model.mjs';
import { box, chapterText, footer, heading, table } from '../defaults.mjs';
export function drawScopedRead(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = Math.max(0, Math.min(1, state.beatP ?? 0)),
    resultComplete = (id, beat = currentBeat) =>
      currentBeat > beat ||
      (currentBeat === beat &&
        (state.cues ? state.cues['tu-' + id]?.phase === 'after' : progress >= 0.9));
  api.focus.target('tu-scoped-read-mechanism', () => {
    heading(ctx, api, 'Resolve the row, compare current project, then disclose');
    const current = currentBeat === 2 && resultComplete('read-current-owner', 2) ? 'ads' : 'search',
      rows = {
        R16: {
          project_id: current,
          status: 'canary_failed',
        },
      },
      session = {
        project_id: currentBeat === 0 ? 'ads' : 'search',
      },
      allowed = scopedReleaseRead(session, 'R16', rows);
    box(
      ctx,
      api,
      'Trusted session',
      'project: ' + session.project_id,
      150,
      385,
      720,
      themeColors.yellow,
      110,
    );
    box(
      ctx,
      api,
      'Resolved R16',
      'project: ' + current,
      1050,
      385,
      680,
      current === 'search' ? themeColors.blue : themeColors.pink,
      110,
    );
    if (currentBeat === 0) {
      const checked = resultComplete('read-resolved-scope', 0);
      box(
        ctx,
        api,
        'Read observation',
        checked
          ? allowed.ok
            ? 'permitted release payload'
            : allowed.error
          : 'permission check pending',
        150,
        650,
        1580,
        checked ? (allowed.ok ? themeColors.green : themeColors.pink) : themeColors.yellow,
        130,
      );
    }
    if (currentBeat === 1) {
      table(
        ctx,
        api,
        ['selector', 'resolved host reason', 'model-visible result'],
        [
          ['R-missing', 'no row', 'not_found_or_not_authorized'],
          ['foreign release', 'other project', 'not_found_or_not_authorized'],
        ],
        150,
        600,
        [400, 430, 800],
        145,
      );
      if (resultComplete('read-uniform-denial', 1))
        chapterText(
          ctx,
          api,
          'No status, owner or release payload leaves this boundary',
          150,
          970,
          29,
          themeColors.pink,
        );
    }
    if (currentBeat === 2) {
      box(
        ctx,
        api,
        'Earlier read',
        'R16 was inside search scope',
        150,
        620,
        720,
        themeColors.muted,
        120,
      );
      box(
        ctx,
        api,
        'Current read',
        allowed.ok ? 'allowed row' : 'not_found_or_not_authorized',
        1050,
        620,
        680,
        allowed.ok ? themeColors.green : themeColors.pink,
        120,
      );
      chapterText(
        ctx,
        api,
        'Reauthorization uses the current owner on every request',
        150,
        925,
        31,
        themeColors.cyan,
      );
    }
    if (currentBeat === 1) footer(ctx, api, 'The operator can see the reason in the private audit log.');
  });
}
export default {
  id: 'scoped-read',
  draw: drawScopedRead,
  cues: [
    'tu-scoped-read-1',
    'tu-read-resolved-scope',
    'tu-scoped-read-2',
    'tu-read-uniform-denial',
    'tu-scoped-read-3',
    'tu-read-current-owner',
  ],
};
