import { canonical, sha } from '../arithmetic.mjs';
import { CANDIDATE, STABLE, liveInventory, registry, report } from '../model.mjs';
import { arrow, chapterText, footer, pill, rectangle } from '../defaults.mjs';
const trace = liveInventory('complete')[271];
const reportPin = sha(canonical(report));
const aliases = registry(STABLE);
const transition = aliases.move('canary', CANDIDATE, aliases.aliases.get('canary'));
export function drawAuditLineage(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    cue = (k) => state.cues?.['mv-audit-lineage-' + k],
    resultComplete = (k) => cue(k)?.phase === 'after',
    B = (k) => !!cue(k) && cue(k).phase !== 'before';
  api.focus.target('audit-lineage-mechanism', () => {
    const missing = currentBeat === 1 && resultComplete('gaps');
    const nodes = [
      ['Request 272', missing ? 'Release ID missing' : trace.release.slice(0, 12)],
      ['Release manifest', CANDIDATE.slice(0, 12)],
      [report.suite + ' report', reportPin.slice(0, 12)],
      ['Canary decision', 'revision ' + transition.revision],
    ];
    chapterText(ctx, api, 'R52   ·   serving trace ' + trace.id, 960, 300, 36, themeColors.yellow);
    nodes.forEach(([a, v], i) => {
      const x = 340 + i * 420;
      rectangle(
        ctx,
        api,
        x - 175,
        450,
        350,
        210,
        themeColors.panel,
        i === 0 ? themeColors.blue : themeColors.cyan,
      );
      chapterText(ctx, api, a, x, 520, 29, i === 0 ? themeColors.blue : themeColors.cyan);
      chapterText(ctx, api, v, x, 610, 25, themeColors.muted);
      if (
        i < 3 &&
        !(missing && i === 0) &&
        (currentBeat > 0 || B(i === 0 ? 'trace' : i === 1 ? 'report' : 'event'))
      )
        arrow(ctx, api, x + 190, 555, x + 225, 555, themeColors.cyan);
    });
    if (currentBeat === 0) {
      if (B('event'))
        pill(
          ctx,
          api,
          '12:00 UTC   ·   rollout controller   ·   canary r1 STABLE → r2 CANDIDATE',
          960,
          850,
          1500,
          themeColors.blue,
        );
      footer(ctx, api, 'The links require retained artifacts and a protected audit store');
    } else if (currentBeat === 1) {
      if (!missing && B('hypothetical'))
        chapterText(
          ctx,
          api,
          'Article hand-written list = hypothetical narrative',
          960,
          810,
          33,
          themeColors.yellow,
        );
      if (!missing && B('observed'))
        chapterText(
          ctx,
          api,
          'Serving trace records the actual resolved release',
          960,
          900,
          32,
          themeColors.blue,
        );
      if (missing) {
        chapterText(
          ctx,
          api,
          api.focus.cue('cached-target')?.phase === 'after'
            ? 'The router could have served a cached target'
            : 'Can today’s alias fill the gap?',
          960,
          825,
          42,
          themeColors.pink,
        );
      }
      if (!missing) footer(ctx, api, 'The worker records the release it served');
    } else {
      const rows = [
        ['parse failure', 'schema / compatibility', B('parse')],
        ['unsupported answer', 'pinned-evidence replay', B('unsupported')],
        ['safe but slow', 'runtime / decoding', B('slow')],
        ['missing telemetry', 'HOLD + evidence repair', B('missing')],
      ];
      rows.forEach(([a, v, on], i) => {
        const y = 745 + i * 65;
        chapterText(ctx, api, a, 540, y, 27, on ? themeColors.yellow : themeColors.muted);
        if (on) chapterText(ctx, api, v, 1360, y, 27, themeColors.cyan);
      });
      footer(ctx, api, 'Classify the signal before moving an alias');
    }
  });
}
export default {
  id: 'audit-lineage',
  draw: drawAuditLineage,
  cues: [
    'mv-audit-lineage-trace',
    'mv-audit-lineage-report',
    'mv-audit-lineage-event',
    'mv-audit-lineage-hypothetical',
    'mv-audit-lineage-observed',
    'mv-audit-lineage-gaps',
    'cached-target',
    'mv-audit-lineage-parse',
    'mv-audit-lineage-unsupported',
    'mv-audit-lineage-slow',
    'mv-audit-lineage-missing',
  ],
};
