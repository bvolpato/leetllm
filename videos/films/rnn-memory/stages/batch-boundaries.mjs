import { eventNames, padded, states } from '../fixtures.mjs';
import { incidentFrame } from '../construction.mjs';
import { incidentModel } from '../model.mjs';
import {
  formatNumber,
  formatVector,
  incidentAxis,
  incidentNote,
  incidentRoute,
  incidentText,
  strokeArrow,
  strokeLine,
} from '../defaults.mjs';
export function drawBatchBoundaries(ctx, scene, state, api) {
  const { C: themeColors } = api,
    m = incidentModel(),
    f = incidentFrame('batch-boundaries', state),
    { b: currentBeat, p: progress, cue, started } = f;
  const colors = [themeColors.blue, themeColors.pink, themeColors.green];
  api.focus.target('batch-boundaries-operation', () => {
    if (currentBeat === 0) {
      incidentText(
        ctx,
        api,
        'Same two-event vector state',
        960,
        290,
        32,
        themeColors.green,
        'center',
      );
      incidentText(
        ctx,
        api,
        formatVector(ctx, api, states[2]),
        960,
        360,
        48,
        themeColors.green,
        'center',
      );
      const branches = [
        {
          name: 'true ending',
          input: 'skip update',
          result: states[2],
          color: themeColors.green,
          id: 'padding-valid',
        },
        {
          name: 'zero filler',
          input: 'x = [0, 0, 0]',
          result: padded,
          color: themeColors.pink,
          id: 'padding-zero',
        },
        {
          name: 'junk filler',
          input: 'x = [9, −9, 9]',
          result: m.junk,
          color: themeColors.blue,
          id: 'padding-junk',
        },
      ];
      branches.forEach((branch, j) => {
        const x = 385 + j * 575;
        incidentRoute(
          ctx,
          api,
          {
            x: 960,
            y: 400,
          },
          {
            x,
            y: 555,
          },
          cue(branch.id, progress),
          branch.color,
        );
        incidentText(ctx, api, branch.name, x, 605, 30, branch.color, 'center');
        incidentText(ctx, api, branch.input, x, 674, 27, themeColors.muted, 'center');
        if (started(branch.id, progress > 0.2 + j * 0.2))
          incidentText(
            ctx,
            api,
            formatVector(ctx, api, branch.result),
            x,
            790,
            40,
            branch.color,
            'center',
          );
      });
      incidentNote(
        ctx,
        api,
        'A zero vector is a numerical input. It does not declare a sequence boundary.',
      );
    } else if (currentBeat === 1) {
      const packed = started('packing-prefixes', progress > 0.3);
      ['incident A · length 3', 'incident B · length 2'].forEach((label, row) => {
        const y = 415 + row * 220;
        incidentText(ctx, api, label, 140, y + 30, 29, colors[row]);
        for (let column = 0; column < 3; column++) {
          const valid = column < (row === 0 ? 3 : 2),
            x = 700 + column * 380;
          api.rect(ctx, x, y, 210, 75, valid ? colors[column] : themeColors.panel, undefined, 5);
          incidentText(
            ctx,
            api,
            valid ? eventNames[column] : 'filler',
            x + 105,
            y + 48,
            27,
            valid ? themeColors.bg : themeColors.muted,
            'center',
          );
          if (!valid) {
            strokeLine(ctx, api, x, y + 83, x + 210, y + 83, themeColors.pink, 4);
            if (packed)
              incidentText(
                ctx,
                api,
                'not executed',
                x + 105,
                y + 138,
                26,
                themeColors.pink,
                'center',
              );
          }
          if (packed && valid)
            incidentRoute(
              ctx,
              api,
              {
                x: x + 105,
                y: y + 95,
              },
              {
                x: x + 105,
                y: y + 153,
              },
              cue('packing-prefixes', progress),
              colors[column],
            );
        }
      });
      if (packed)
        incidentText(
          ctx,
          api,
          'active batch sizes: 2 → 2 → 1',
          960,
          925,
          39,
          themeColors.green,
          'center',
        );
      incidentNote(
        ctx,
        api,
        'Positive CPU lengths describe right-padded valid prefixes. Compare with individual prefix runs.',
      );
    } else {
      incidentText(
        ctx,
        api,
        'Next independent scalar incident: x = 0.4',
        960,
        300,
        35,
        themeColors.ink,
        'center',
      );
      const rows = [
        {
          label: 'reset: h₀ = 0',
          value: m.resetNext,
          color: themeColors.green,
        },
        {
          label: 'carry old h₃, even detached',
          value: m.leakedNext,
          color: themeColors.pink,
        },
      ];
      rows.forEach((row, j) => {
        const y = 490 + j * 280;
        incidentText(ctx, api, row.label, 220, y, 31, row.color);
        const x0 = incidentAxis(ctx, api, 880, y + 30, 730, 0, 1);
        if (started('boundary-reset', progress > 0.25)) {
          strokeArrow(ctx, api, x0(0), y - 10, x0(row.value), y - 10, row.color, 4);
          incidentText(
            ctx,
            api,
            formatNumber(ctx, api, row.value, 6),
            1650,
            y - 2,
            33,
            row.color,
            'right',
          );
        }
      });
      incidentNote(
        ctx,
        api,
        'Detach cuts history for differentiation. Reset changes numerical state and sequence identity.',
      );
    }
  });
}
export default {
  id: 'batch-boundaries',
  draw: drawBatchBoundaries,
  cues: [
    'batch-boundaries-0',
    'padding-valid',
    'padding-zero',
    'padding-junk',
    'batch-boundaries-1',
    'packing-prefixes',
    'batch-boundaries-2',
    'boundary-reset',
  ],
};
