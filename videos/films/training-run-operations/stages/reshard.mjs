import { reshardConstruction } from '../construction.mjs';
import { sampleModel } from '../model.mjs';
import { drawLegacyCard, drawLegacyText } from '../defaults.mjs';
export function drawReshard(ctx, scene, state, api) {
  const { C: themeColors, components: components } = api,
    modelState = sampleModel('reshard', state);
  {
    const trace = reshardConstruction(state),
      colors = [themeColors.blue, themeColors.cyan, themeColors.yellow, themeColors.pink];
    drawLegacyText(
      ctx,
      api,
      'Four saved owners → eight destination owners · coordinates stay fixed',
      170,
      300,
      35,
      themeColors.ink,
    );
    modelState.savedSlices.forEach((slice, owner) => {
      const x = 150 + owner * 420;
      components.panel({
        x,
        y: 355,
        width: 380,
        height: 140,
        fill: themeColors.panel,
        stroke: colors[owner],
        radius: 10,
      });
      drawLegacyText(ctx, api, 'Saved rank ' + owner, x + 190, 395, 28, colors[owner], 'center');
      slice.forEach((coordinate, i) => {
        const isProbe = Math.floor(coordinate / 2) === trace.probeDestinationOwner;
        const label = () =>
          drawLegacyText(
            ctx,
            api,
            coordinate,
            x + 55 + i * 90,
            465,
            isProbe ? 39 : 31,
            isProbe ? themeColors.ink : colors[owner],
            'center',
          );
        if (isProbe) api.focus.target('saved-pair', label);
        else label();
      });
    });
    trace.slices.forEach((slice) => {
      const startX = 150 + slice.savedOwner * 420 + (slice.rank % 2) * 180 + 15,
        endX = 140 + slice.rank * 210,
        y = 515 + (745 - 515) * slice.progress,
        x = startX + (endX - startX) * slice.progress;
      if (slice.progress === 1)
        components.panel({
          x: endX,
          y: 720,
          width: 190,
          height: 125,
          fill: themeColors.panel,
          stroke: colors[slice.savedOwner],
          radius: 9,
        });
      drawLegacyText(
        ctx,
        api,
        'Rank ' + slice.rank,
        endX + 95,
        885,
        26,
        slice.progress === 1 ? colors[slice.savedOwner] : themeColors.muted,
        'center',
      );
      if (slice.progress > 0) {
        const isProbe = slice.rank === trace.probeDestinationOwner;
        const card = () =>
          drawLegacyCard(
            ctx,
            api,
            slice.coordinates.join(' · '),
            x,
            y,
            170,
            isProbe ? themeColors.ink : colors[slice.savedOwner],
            74,
            32,
          );
        if (isProbe) api.focus.target('pair-six-seven', card);
        else if (slice.rank === Math.min(2, trace.arrived)) api.focus.target('first-slices', card);
        else card();
      }
    });
    drawLegacyText(
      ctx,
      api,
      `Destination slices loaded: ${trace.arrived} / 8`,
      960,
      950,
      31,
      themeColors.green,
      'center',
    );
    if (trace.probeReady)
      api.focus.target('ownership-probe', () =>
        drawLegacyText(
          ctx,
          api,
          'Coordinate 6: saved rank 1 [4…7] → destination rank 3 [6, 7]',
          960,
          1015,
          29,
          themeColors.yellow,
          'center',
        ),
      );
  }
}
export default {
  id: 'reshard',
  draw: drawReshard,
  cues: ['reshard-b1-1', 'reshard-pair', 'reshard-b1-2', 'reshard-b2-1'],
};
