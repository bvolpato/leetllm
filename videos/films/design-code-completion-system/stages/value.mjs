import { sampleModel } from '../construction.mjs';
import { code, text } from '../defaults.mjs';
export function drawValue(ctx, scene, state, api) {
  const { C: themeColors, components: components } = api,
    modelState = sampleModel(state);
  {
    const playback = modelState.suggestions;
    const examples = [
      'graph.allows(user)',
      'True',
      'graph.allows(request, policy.scopes, user)',
      'False',
    ];
    text(ctx, api, 'The same suggestion through the editing window', 170, 290, 34);
    text(ctx, api, 'inserted', 1430, 290, 29, themeColors.blue, 'center');
    text(ctx, api, 'still present', 1660, 290, 29, themeColors.green, 'center');
    playback.rows.forEach((row, index) => {
      const y = 345 + index * 135,
        current = index === playback.active;
      api.focus.target('value-panel-value', () =>
        components.panel({
          x: 160,
          y,
          width: 1110,
          height: 118,
          fill: themeColors.panel,
          stroke: current ? themeColors.yellow : themeColors.muted,
        }),
      );
      text(ctx, api, row.id, 205, y + 47, 34, current ? themeColors.yellow : themeColors.blue);
      const status = !row.visible
        ? 'ghost text pending'
        : !row.inserted
          ? 'ghost text · declined'
          : row.present === 0
            ? 'accepted → deleted'
            : row.present < row.inserted
              ? 'accepted → edited'
              : row.complete
                ? 'accepted → kept'
                : 'accepted';
      text(ctx, api, status, 280, y + 35, 25, row.complete ? themeColors.green : themeColors.muted);
      const value = row.visible ? examples[index] : '…';
      if (row.inserted && row.present < row.inserted) {
        ctx.save();
        ctx.font = `500 ${index === 2 ? 25 : 31}px "Lesson Mono"`;
        const x = 280 + ctx.measureText(value.slice(0, row.present)).width,
          end = 280 + ctx.measureText(value).width;
        ctx.restore();
        code(
          ctx,
          api,
          value.slice(0, row.present),
          280,
          y + 85,
          index === 2 ? 25 : 31,
          themeColors.green,
        );
        if (!row.complete) {
          code(
            ctx,
            api,
            value.slice(row.present),
            x,
            y + 85,
            index === 2 ? 25 : 31,
            themeColors.pink,
          );
          api.line(ctx, x, y + 99, end, y + 99, themeColors.pink, 3);
        } else if (index === 2) code(ctx, api, ')', x, y + 85, 25, themeColors.yellow);
      } else
        code(
          ctx,
          api,
          value,
          280,
          y + 85,
          index === 2 ? 25 : 31,
          !row.inserted ? themeColors.muted : themeColors.green,
        );
      text(
        ctx,
        api,
        row.visible ? row.inserted : '—',
        1430,
        y + 75,
        42,
        themeColors.blue,
        'center',
      );
      text(
        ctx,
        api,
        row.visible ? row.present : '—',
        1660,
        y + 75,
        42,
        themeColors.green,
        'center',
      );
    });
    text(
      ctx,
      api,
      playback.complete === 4
        ? `${playback.accepted}/${playback.shown} suggestions accepted · ${playback.present}/${playback.inserted} inserted characters retained`
        : playback.shown
          ? `Observed ${playback.shown}/4 · ${playback.accepted} accepted · ${playback.inserted} inserted · ${playback.present} still present`
          : 'Observe acceptance, then the editing window',
      960,
      955,
      playback.complete === 4 ? 34 : 29,
      themeColors.yellow,
      'center',
    );
    text(
      ctx,
      api,
      playback.complete === 4
        ? 'Green: retained original characters · yellow: replacement text · one observation window'
        : `Completed observation windows: ${playback.complete}/4 · final retention is pending`,
      960,
      1005,
      28,
      themeColors.muted,
      'center',
    );
  }
}
export default {
  id: 'value',
  draw: drawValue,
  cues: ['value-beat-1-focus-1', 'value-beat-2-focus-1'],
};
