import { EVAL_DATE, ROTATION_RULE } from '../fixtures.mjs';
import { versionFilterFrame } from '../construction.mjs';
import { versionedBundle } from '../model.mjs';
import { drawText, paragraph, recordCard } from '../defaults.mjs';
export function drawVersionedEvidence(ctx, scene, state, api) {
  const { C: themeColors, components: components, phase, teaching: teaching } = api;
  const beat = state.beat ?? 0,
    progress2 = state.beatP ?? 0,
    q = phase(progress2, 0.04, 0.92);
  const route = (from, to, color = themeColors.cyan, progress = q, opacity = 1) =>
    teaching.transfer({
      source: {
        shape: from,
        opacity,
      },
      target: {
        shape: to,
        opacity,
      },
      color,
      progress,
      width: 3,
      gap: 16,
      margin: 3,
      particle: {
        radius: 6,
        fill: color,
      },
    });
  {
    const bundle = versionedBundle(),
      frame = versionFilterFrame(beat, progress2);
    frame.currentProgress = api.focus.progress('filter-current', frame.currentProgress);
    frame.historicalProgress = api.focus.progress('exclude-expired', frame.historicalProgress);
    if (beat === 0) {
      const source = api.focus.target('source-page', () => {
        const shape = components.panel({
          x: 100,
          y: 320,
          width: 500,
          height: 300,
          fill: themeColors.panel,
          stroke: themeColors.blue,
        });
        drawText(ctx, api, 'EU Access Policy · page 7', 125, 365, 26, themeColors.blue);
        paragraph(ctx, api, ROTATION_RULE, 125, 425, 450, 23);
        return shape;
      });
      const parsed = api.focus.progress('parse-spans', progress2),
        lineage = api.focus.progress('preserve-lineage', progress2);
      const child = api.focus.reveal('parse-spans', () =>
        api.focus.target('search-child', () =>
          recordCard(
            ctx,
            api,
            'eu-key-v2 · searchable span\nAutomated rotation within 14 days',
            735,
            350,
            500,
            themeColors.cyan,
            210,
            26,
          ),
        ),
      );
      const parent = api.focus.reveal('preserve-lineage', () =>
        api.focus.target('parent-section', () =>
          recordCard(
            ctx,
            api,
            'eu-access-v2 · full section\n14 days AND signal ≤ 48 hours',
            1320,
            350,
            500,
            themeColors.green,
            210,
            26,
          ),
        ),
      );
      api.focus.reveal('parse-spans', () => route(source, child, themeColors.cyan, parsed));
      api.focus.reveal('preserve-lineage', () => route(child, parent, themeColors.green, lineage));
      const fields = [
        ['Document', 'eu-access'],
        ['Parent', 'eu-access-v2'],
        ['Locator', 'page 7'],
        ['Version', '2026-04-01'],
        ['Region + access', 'EU · support:eu'],
        ['Effective dates', 'Apr 1 → current'],
      ];
      fields.forEach(([label, value], i) => {
        if (lineage < i / fields.length) return;
        api.focus.reveal('preserve-lineage', () =>
          api.focus.target('lineage-fields', () =>
            recordCard(
              ctx,
              api,
              label + '\n' + value,
              120 + (i % 3) * 570,
              650 + Math.floor(i / 3) * 155,
              520,
              themeColors.cyan,
              130,
              26,
            ),
          ),
        );
      });
    } else {
      api.focus.target('request-date', () =>
        drawText(
          ctx,
          api,
          beat === 2
            ? 'Request date · ' + EVAL_DATE
            : 'Two retained source versions · selection waits for request date',
          960,
          280,
          31,
          beat === 2 ? themeColors.yellow : themeColors.muted,
          'center',
        ),
      );
      drawText(ctx, api, 'Current request lane', 1475, 320, 27, themeColors.green, 'center');
      drawText(ctx, api, 'Historical audit lane', 1475, 620, 27, themeColors.yellow, 'center');
      components.panel({
        x: 1110,
        y: 335,
        width: 730,
        height: 230,
        fill: themeColors.panel,
        stroke: themeColors.green,
      });
      components.panel({
        x: 1110,
        y: 635,
        width: 730,
        height: 230,
        fill: themeColors.panel,
        stroke: themeColors.yellow,
      });
      frame.rows.forEach((row, i) => {
        const progress = i ? frame.historicalProgress : frame.currentProgress,
          x = api.lerp(120, 1160, progress),
          y = 350 + i * 300,
          color = i ? themeColors.yellow : themeColors.green;
        api.focus.target(i ? 'historical-record' : 'current-record', () =>
          components.panel({
            x,
            y,
            width: 650,
            height: 200,
            fill: themeColors.panel,
            stroke: color,
          }),
        );
        drawText(
          ctx,
          api,
          row.id + ' · ' + row.version.split('/')[1],
          x + 325,
          y + 39,
          29,
          color,
          'center',
        );
        drawText(
          ctx,
          api,
          row.from + ' → ' + (row.to ?? 'current'),
          x + 325,
          y + 83,
          27,
          themeColors.ink,
          'center',
        );
        drawText(
          ctx,
          api,
          i ? '30-day wording · retained for audit' : '14 days · risk signal ≤ 48 hours',
          x + 325,
          y + 127,
          27,
          themeColors.ink,
          'center',
        );
        if (beat === 2 && progress > 0)
          drawText(
            ctx,
            api,
            row.current
              ? 'Effective on request date → admit'
              : 'Expired on request date → historical only',
            x + 325,
            y + 171,
            25,
            color,
            'center',
          );
      });
      if (frame.currentProgress === 1) {
        drawText(ctx, api, '2026-04-01 ≤ ' + EVAL_DATE, 445, 430, 29, themeColors.green, 'center');
        drawText(
          ctx,
          api,
          'Open-ended interval → admit v2',
          445,
          495,
          28,
          themeColors.green,
          'center',
        );
      }
      if (frame.historicalProgress === 1) {
        drawText(ctx, api, EVAL_DATE + ' > 2026-03-31', 445, 730, 29, themeColors.pink, 'center');
        drawText(ctx, api, 'Request is after v1 ended', 445, 795, 28, themeColors.pink, 'center');
      }
    }
    api.focus.target('source-digest', () =>
      drawText(
        ctx,
        api,
        'Exact rule SHA-256 prefix ' +
          bundle.sourceHash.slice(0, 12) +
          ' · source authority comes from trusted ingestion',
        960,
        1040,
        25,
        themeColors.muted,
        'center',
      ),
    );
  }
}
export default {
  id: 'versioned-evidence',
  draw: drawVersionedEvidence,
  cues: [
    'parse-spans',
    'preserve-lineage',
    'current-rule',
    'historical-rule',
    'filter-current',
    'exclude-expired',
    'verify-bytes',
  ],
};
