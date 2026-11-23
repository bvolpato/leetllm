import { fields, inventory } from '../fixtures.mjs';
import { exportSelection, sampleModel } from '../construction.mjs';
import { drawText } from '../defaults.mjs';
export function drawPrivacy(ctx, scene, state, api) {
  const { C: themeColors, components: components, teaching: teaching } = api,
    modelState = sampleModel('privacy', state),
    currentBeat = modelState.beat;
  const grid = (labels, x, y, width, height, z = 30) =>
    teaching.grid({
      x,
      y,
      width,
      height,
      rows: labels.length,
      columns: labels[0].length,
      labels,
      fontSize: z,
      fill: themeColors.panel,
      stroke: themeColors.blue,
      textColor: themeColors.ink,
      cellFocusTarget: (row, col) => {
        if (!row) return undefined;
        return col === (currentBeat ? 0 : 1)
          ? 'exported-' + (currentBeat ? 'prompt' : fields[row - 1])
          : undefined;
      },
    });
  {
    if (currentBeat) {
      grid([['Supplied prompt ID'], [modelState.record.prompt]], 280, 330, 1360, 260, 35);
      api.focus.target('export-verdict', () =>
        drawText(ctx, api, 'REJECT: ' + modelState.error, 960, 965, 33, themeColors.pink, 'center'),
      );
    } else {
      const fieldCard = (label, x, y, width, color, height = 54, fontSize = 25) =>
        components.card({
          label,
          x,
          y,
          width,
          height,
          fontSize,
          textColor: color,
          fill: themeColors.panel,
          stroke: color,
          padding: 8,
        });
      const exclusion = api.focus.progress('exclude-content', modelState.q),
        checks = api.focus.progress('check-export-identifiers', modelState.q);
      const selection = exportSelection(
        modelState.record,
        api.focus.progress('field-allowlist', modelState.q),
        checks,
      );
      drawText(ctx, api, 'Supplied input record', 425, 285, 32, themeColors.ink, 'center');
      drawText(
        ctx,
        api,
        selection.registryReady ? 'Exported metadata' : 'Selected metadata',
        1510,
        285,
        32,
        selection.registryReady ? themeColors.green : themeColors.cyan,
        'center',
      );
      api.focus.target('export-allowlist', () => {
        drawText(ctx, api, 'Allowlist', 990, 285, 30, themeColors.cyan, 'center');
        drawText(ctx, api, '6 allowed keys', 990, 320, 22, themeColors.cyan, 'center');
        api.line(ctx, 990, 342, 990, 945, themeColors.cyan, 2);
      });
      selection.rows.forEach((row, index) => {
        const y = 355 + index * 64,
          label = row.key + ': ' + row.value;
        const source = api.focus.target('input-approved-fields', () =>
          fieldCard(label, 100, y, 650, themeColors.blue),
        );
        const target = api.focus.target('selected-export-fields', () => {
          if (row.progress === 1)
            return api.focus.target('exported-' + row.key, () =>
              fieldCard(
                label,
                1200,
                y,
                620,
                selection.registryReady ? themeColors.green : themeColors.cyan,
              ),
            );
          return components.panel({
            x: 1200,
            y,
            width: 620,
            height: 54,
            fill: themeColors.panel,
            stroke: themeColors.muted,
          });
        });
        api.connect(ctx, source, target, {
          color:
            row.progress === 1
              ? selection.registryReady
                ? themeColors.green
                : themeColors.cyan
              : themeColors.muted,
          gap: 15,
        });
        if (row.progress > 0 && row.progress < 1) {
          const x = api.lerp(765, 1035, row.progress);
          api.focus.target('selected-export-fields', () =>
            fieldCard(row.key, x, y + 8, 150, themeColors.cyan, 38, 21),
          );
        }
      });
      selection.blockedEntries.forEach(([key, value], index) => {
        const y = 795 + index * 68,
          color = exclusion > 0 ? themeColors.pink : themeColors.muted;
        api.focus.target('raw-input-fields', () => {
          const source = fieldCard(key + ': ' + value, 100, y, 650, color);
          const stop = fieldCard(
            exclusion > 0 ? 'EXCLUDED' : 'local only',
            800,
            y,
            150,
            color,
            54,
            21,
          );
          api.connect(ctx, source, stop, {
            color,
            gap: 12,
          });
        });
      });
      api.focus.target('export-registry', () => {
        components.panel({
          x: 1200,
          y: 795,
          width: 620,
          height: 136,
          fill: themeColors.panel,
          stroke: checks > 0 ? themeColors.green : themeColors.muted,
        });
        drawText(ctx, api, 'Host registry', 1230, 825, 25, themeColors.cyan);
        Object.entries(inventory).forEach(([key, allowed], index) => {
          const verified = checks * 3 >= index + 1 && allowed.has(modelState.record[key]);
          drawText(
            ctx,
            api,
            (verified ? '✓ ' : '· ') + key + ': ' + [...allowed][0],
            1230,
            855 + index * 28,
            22,
            verified ? themeColors.green : themeColors.muted,
          );
        });
      });
      drawText(
        ctx,
        api,
        selection.registryReady
          ? selection.exportedEntries.length + ' / 6 exported · registry checks passed'
          : selection.selectedEntries.length + ' / 6 selected · registry checks pending',
        1510,
        765,
        25,
        selection.registryReady ? themeColors.green : themeColors.cyan,
        'center',
      );
    }
  }
}
export default {
  id: 'privacy',
  draw: drawPrivacy,
  cues: ['field-allowlist', 'check-export-identifiers', 'exclude-content', 'reject-private-id'],
};
