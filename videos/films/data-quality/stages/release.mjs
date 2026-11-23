import {
  changedDigest,
  deduplicatedIds,
  excludedReleaseIds,
  fingerprint,
  quarantineIds,
  records,
  releasedArtifact,
  releasedDigest,
  valid,
} from '../fixtures.mjs';
import { releaseTrace } from '../model.mjs';
import { drawOriginalCard, drawOriginalText, drawOriginalVisualFocus } from '../defaults.mjs';
export function drawRelease(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0);
  const phaseForBeat = (i, a = 0.08, z = 0.88) =>
    currentBeat < i ? 0 : currentBeat > i ? 1 : api.phase(progress, a, z);
  {
    if (currentBeat === 0) {
      const q = phaseForBeat(0),
        trace = releaseTrace(q),
        headings = ['8 source rows', '7 schema-valid', '4 conflict-free', '3 representatives'],
        xs = [210, 650, 1090, 1530];
      headings.forEach((v, i) =>
        drawOriginalText(
          ctx,
          api,
          v,
          xs[i],
          285,
          30,
          i <= trace.stage ? themeColors.cyan : themeColors.muted,
        ),
      );
      drawOriginalVisualFocus(ctx, api, 'release-simulation-70', () =>
        records.forEach((row, i) => {
          const stop = !valid(row)
            ? 0
            : quarantineIds.has(row.id)
              ? 1
              : deduplicatedIds.has(row.id)
                ? 2
                : 3;
          const travel = Math.min(stop, q * 4),
            left = Math.floor(travel),
            x = left === 3 ? xs[3] : api.lerp(xs[left], xs[left + 1], travel - left),
            y = 355 + i * 70;
          const removed = trace.stage > stop,
            color = removed ? themeColors.red : themeColors.cyan;
          drawOriginalCard(
            ctx,
            api,
            String(row.id) + ' · ' + row.conversation,
            x - 165,
            y,
            color,
            330,
            58,
            1,
            27,
          );
        }),
      );
      const count = trace.retained.length;
      drawOriginalText(
        ctx,
        api,
        'Current retained IDs: ' + trace.retained.map((row) => row.id).join(', '),
        960,
        965,
        30,
        themeColors.ink,
      );
      drawOriginalText(
        ctx,
        api,
        count + ' retained · ' + trace.excluded.length + ' excluded',
        960,
        1030,
        28,
        themeColors.yellow,
      );
    } else {
      drawOriginalText(
        ctx,
        api,
        'support-ticket-demo-v1 · exact candidate records',
        960,
        285,
        36,
        themeColors.cyan,
      );
      releasedArtifact.rows.forEach((row, i) => {
        const y = 330 + i * 120,
          color = {
            train: themeColors.cyan,
            validation: themeColors.yellow,
            test: themeColors.pink,
          }[row.split];
        api.components.panel(
          {
            focusTarget: 'release-artifact-rows',
            x: 135,
            y,
            width: 1650,
            height: 100,
            padding: 12,
            fill: themeColors.panel,
            stroke: color,
          },
          () => {
            drawOriginalVisualFocus(ctx, api, 'release-object-row-id-row-conversation-75', () =>
              drawOriginalText(ctx, api, row.id + ' · ' + row.conversation, 335, y + 35, 30, color),
            );
            drawOriginalText(ctx, api, row.text, 960, y + 35, 30, themeColors.ink);
            drawOriginalVisualFocus(ctx, api, 'release-object-row-label-row-split-77', () =>
              drawOriginalText(ctx, api, row.label + ' → ' + row.split, 1515, y + 35, 28, color),
            );
            drawOriginalText(
              ctx,
              api,
              'normalized key ' + fingerprint(row.text).slice(0, 12) + '…',
              960,
              y + 80,
              24,
              themeColors.muted,
            );
          },
        );
      });
      if (currentBeat === 1)
        drawOriginalVisualFocus(ctx, api, 'release-coverage-review', () =>
          drawOriginalText(
            ctx,
            api,
            'Coverage review OPEN · train: standard only; escalation in validation',
            960,
            850,
            31,
            themeColors.yellow,
          ),
        );
      else {
        drawOriginalVisualFocus(ctx, api, 'release-digest-change', () => {
          drawOriginalText(
            ctx,
            api,
            'Record 103: policy? → policy! · one changed byte',
            520,
            745,
            27,
            themeColors.yellow,
          );
          drawOriginalText(ctx, api, 'SHA-256 prefixes', 520, 800, 26, themeColors.muted);
          drawOriginalText(
            ctx,
            api,
            releasedDigest.slice(0, 24) + '…',
            520,
            855,
            29,
            themeColors.blue,
          );
          drawOriginalText(
            ctx,
            api,
            changedDigest.slice(0, 24) + '…',
            520,
            910,
            29,
            themeColors.pink,
          );
        });
        drawOriginalVisualFocus(ctx, api, 'release-supplier-receipt', () => {
          drawOriginalCard(
            ctx,
            api,
            'Illustrative trust premise · review-17',
            1030,
            700,
            themeColors.green,
            720,
            70,
            1,
            27,
          );
          drawOriginalText(ctx, api, 'Supplier: fixture curator', 1390, 820, 29, themeColors.green);
          drawOriginalText(
            ctx,
            api,
            'Supplied record binds this artifact digest',
            1390,
            875,
            26,
            themeColors.muted,
          );
        });
        drawOriginalVisualFocus(ctx, api, 'release-coverage-review', () => {
          drawOriginalText(
            ctx,
            api,
            'Excluded IDs: ' + excludedReleaseIds.join(', '),
            960,
            980,
            28,
            themeColors.yellow,
          );
          drawOriginalText(
            ctx,
            api,
            'Coverage review OPEN · training split has only standard',
            960,
            1030,
            27,
            themeColors.pink,
          );
        });
      }
      {
      }
    }
  }
}

// The executable Python article is authoritative. This illustrated subset covers its
// ASCII ticket fixture plus the explicitly demonstrated compatibility/sharp-s forms.
export default {
  id: 'release',
  draw: drawRelease,
  cues: [
    'release-beat-1-focus-1',
    'release-beat-2-focus-1',
    'release-beat-3-focus-1',
    'release-byte-digest',
    'release-trusted-supplier',
    'release-review-evidence',
  ],
};
