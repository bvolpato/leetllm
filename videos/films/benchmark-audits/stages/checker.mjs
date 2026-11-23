import { clip, smooth } from '../arithmetic.mjs';
import { auditStarted } from '../construction.mjs';
import { checkProbe } from '../model.mjs';
import {
  auditFocusApi,
  drawAuditExpansionCell,
  drawAuditExpansionNote,
  drawAuditExpansionText,
} from '../defaults.mjs';
export function drawChecker(ctx, scene, state, api) {
  api = auditFocusApi(api, scene);
  {
    const inherited = [
      ...new Set(
        scene.beats
          .flatMap((beat) => beat.visual_cues ?? [])
          .filter((cue) => !cue.id.startsWith('ba-'))
          .flatMap((cue) => cue.targets),
      ),
    ];
    inherited.reduceRight(
      (paint, id) => () => api.focus.target(id, paint),
      () => {
        const currentBeat = state.beat ?? 0,
          progress = clip(state.beatP ?? 0),
          q = smooth(progress);
        const { C: themeColors } = api;
        const shown = (name, fallback = true) =>
          auditStarted(state, 'ba-checker-' + name, fallback);
        {
          const probe = checkProbe(currentBeat),
            active =
              currentBeat === 0
                ? shown('on', progress > 0.2)
                : currentBeat === 1
                  ? shown('after', progress > 0.2)
                  : shown('abbrev', progress > 0.3);
          drawAuditExpansionText(
            ctx,
            api,
            'Same rule · books are due on Friday',
            960,
            285,
            36,
            themeColors.blue,
            'center',
          );
          drawAuditExpansionCell(ctx, api, 'books', 330, 430, 360, 120, themeColors.cyan, 40);
          drawAuditExpansionCell(
            ctx,
            api,
            currentBeat === 2 ? 'by' : currentBeat === 1 && active ? 'after' : 'on',
            800,
            430,
            320,
            120,
            currentBeat === 1 && active ? themeColors.pink : themeColors.yellow,
            43,
          );
          drawAuditExpansionCell(
            ctx,
            api,
            currentBeat === 2 && active ? 'Fri' : 'Friday',
            1230,
            430,
            360,
            120,
            currentBeat === 2 && active ? themeColors.pink : themeColors.cyan,
            43,
          );
          if (active) {
            drawAuditExpansionCell(
              ctx,
              api,
              'Exact words: ' + (probe.literal ? 'PASS' : 'FAIL'),
              230,
              730,
              650,
              120,
              probe.literal ? themeColors.green : themeColors.pink,
              35,
            );
            drawAuditExpansionCell(
              ctx,
              api,
              'Reviewed meaning: ' + (probe.reviewed ? 'PASS' : 'FAIL'),
              1040,
              730,
              650,
              120,
              probe.reviewed ? themeColors.green : themeColors.pink,
              32,
            );
            drawAuditExpansionText(
              ctx,
              api,
              probe.reason,
              960,
              955,
              31,
              probe.reviewed ? themeColors.green : themeColors.pink,
              'center',
            );
          }
          drawAuditExpansionNote(
            ctx,
            api,
            'Controlled checker probes · the exact matching spans stay or disappear while the deadline meaning is reviewed.',
          );
        }
        return true;
      },
    )();
    return;
  }
}
export default {
  id: 'checker',
  draw: drawChecker,
  cues: [
    'checker-beat-1-focus-1',
    'checker-beat-1-focus-2',
    'ba-checker-on',
    'checker-beat-2-focus-1',
    'ba-checker-after',
    'checker-beat-3-focus-1',
    'checker-beat-3-focus-2',
    'ba-checker-abbrev',
  ],
};
