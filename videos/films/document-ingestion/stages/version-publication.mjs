import { NEW_VERSION, OLD_VERSION } from '../fixtures.mjs';
import { versionDiff } from '../model.mjs';
import {
  arrow,
  cueProgress,
  cueStarted,
  detailText,
  focusTarget,
  footer,
  heading,
  recordField,
  rectangle,
  sourcePage,
} from '../defaults.mjs';
export function drawVersionPublication(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = state.beatP ?? 0;
  const complete = (id) => cueProgress(ctx, api, id) === 1;
  {
    if (currentBeat === 0) {
      heading(ctx, api, 'Compare membership first, then shared record content');
      focusTarget(ctx, api, 'version-inputs', () => {
        sourcePage(ctx, api, 165, 345, 690, 445, 'Previous source version', [
          'page 7 · rollback · 30 minutes',
          'page 8 · archive · 14 days',
          'page 9 · include deploy ID',
        ]);
        sourcePage(ctx, api, 1065, 345, 690, 445, 'Current source version', [
          'page 7 · rollback · 15 minutes',
          'page 8 · archive · 14 days',
          'page 10 · commander review',
        ]);
      });
      if (cueStarted(ctx, api, 'version-diff'))
        focusTarget(ctx, api, 'version-diff', () => {
          if (!complete('version-diff')) {
            recordField(
              ctx,
              api,
              'Membership + content diff',
              'comparison pending',
              330,
              840,
              1260,
              themeColors.yellow,
            );
            return;
          }
          arrow(ctx, api, 845, 480, 1050, 480, themeColors.yellow);
          recordField(ctx, api, 'Added', 'page 10', 175, 840, 470, themeColors.green);
          recordField(ctx, api, 'Removed', 'page 9', 725, 840, 470, themeColors.pink);
          recordField(
            ctx,
            api,
            'Changed shared text',
            'page 7',
            1275,
            840,
            470,
            themeColors.yellow,
          );
        });
    } else if (currentBeat === 1) {
      heading(ctx, api, 'Keep stable identity while the page locator moves');
      focusTarget(ctx, api, 'stable-section', () => {
        recordField(ctx, api, 'Stable key', 'rollback', 230, 360, 1460, themeColors.cyan);
        recordField(ctx, api, 'Old locator', 'page=7', 250, 485, 600, themeColors.blue);
        const moved = cueProgress(ctx, api, 'stable-section');
        recordField(
          ctx,
          api,
          'New locator',
          moved === 1 ? 'page=9' : 'relocating…',
          1070,
          485,
          600,
          themeColors.cyan,
        );
        arrow(ctx, api, 875, 517, 1040, 517, themeColors.cyan);
        detailText(
          ctx,
          api,
          'Unchanged evidence text · same section identity',
          960,
          650,
          31,
          themeColors.ink,
          'center',
        );
      });
      if (cueStarted(ctx, api, 'atomic-version'))
        focusTarget(ctx, api, 'atomic-version', () => {
          const q = cueProgress(ctx, api, 'atomic-version');
          rectangle(ctx, api, 340, 740, 1240, 144, themeColors.yellow);
          detailText(ctx, api, 'Published source pointer', 380, 790, 29, themeColors.muted);
          detailText(
            ctx,
            api,
            q < 1 ? 'v3 → candidate v4' : 'v4 · coherent membership + derived records',
            960,
            848,
            29,
            q < 1 ? themeColors.yellow : themeColors.green,
            'center',
          );
          detailText(
            ctx,
            api,
            'Remove deleted records; replace changed records together.',
            960,
            959,
            29,
            themeColors.yellow,
            'center',
          );
        });
    } else {
      heading(ctx, api, 'Unchanged text can carry a changed access decision');
      const d = versionDiff(OLD_VERSION, NEW_VERSION);
      sourcePage(
        ctx,
        api,
        170,
        345,
        760,
        430,
        'Stable-key reader fixture',
        [
          'freeze: added',
          'pager-test: removed',
          'archive: text reworded',
          'rollback: text unchanged',
        ],
        themeColors.blue,
      );
      focusTarget(ctx, api, 'access-only', () => {
        recordField(
          ctx,
          api,
          'rollback text hash',
          '6b63 · supplied short hash',
          1060,
          365,
          690,
          themeColors.cyan,
        );
        recordField(
          ctx,
          api,
          'Previous access',
          'ops + security',
          1060,
          485,
          690,
          themeColors.blue,
        );
        recordField(ctx, api, 'Current access', 'ops', 1060, 605, 690, themeColors.yellow);
      });
      if (cueStarted(ctx, api, 'revoke-reader'))
        focusTarget(ctx, api, 'revoke-reader', () => {
          if (!complete('revoke-reader')) {
            detailText(
              ctx,
              api,
              'Checking security-reader access',
              1405,
              851,
              30,
              themeColors.yellow,
              'center',
            );
            return;
          }
          rectangle(ctx, api, 1060, 780, 690, 118, themeColors.pink);
          detailText(ctx, api, 'security reader → DENY', 1405, 851, 34, themeColors.pink, 'center');
          detailText(
            ctx,
            api,
            'ops reader → current-scope check',
            1405,
            953,
            27,
            themeColors.cyan,
            'center',
          );
        });
      footer(
        ctx,
        api,
        'Separate access diff: ' + d.access.join(', ') + ' · do not wait for a text-hash change.',
      );
    }
    return;
  }
  return;
}
export default {
  id: 'version-publication',
  draw: drawVersionPublication,
  cues: [
    'version-inputs',
    'version-diff',
    'stable-section',
    'atomic-version',
    'access-only',
    'revoke-reader',
  ],
};
