import { sampleModel } from '../construction.mjs';
import { drawCard, drawFooter, drawGrid, drawRows, drawText } from '../defaults.mjs';
export function drawFsdpHooks(ctx, scene, state, api) {
  return api.focus.target('pt-fsdp-hooks-mechanism', () => {
    const { C: themeColors, components: components } = api,
      modelState = sampleModel('fsdp-hooks', state),
      { b: currentBeat, p: progress } = modelState;
    {
      if (currentBeat === 0) {
        drawText(
          ctx,
          api,
          'Bottom-up block groups bound gather granularity',
          960,
          285,
          35,
          themeColors.yellow,
          'center',
        );
        components.panel({
          x: 170,
          y: 380,
          width: 1580,
          height: 500,
          fill: themeColors.panel,
          stroke: themeColors.blue,
        });
        drawText(ctx, api, 'Root', 210, 430, 30, themeColors.blue);
        for (let i = 0; i < 3; i++) {
          drawCard(
            ctx,
            api,
            'Managed block ' + i,
            260 + i * 500,
            540,
            420,
            i < Math.floor(progress * 3 + 1e-8) ? themeColors.cyan : themeColors.muted,
            190,
          );
          drawText(
            ctx,
            api,
            'parameter group',
            470 + i * 500,
            700,
            26,
            themeColors.muted,
            'center',
          );
        }
        drawFooter(
          ctx,
          api,
          'Default shard placement can be customized; actual live groups still need accounting',
        );
      } else if (currentBeat === 1) {
        drawRows(
          ctx,
          api,
          [
            ['model(input)', 'module call → gather hooks → ready compute', themeColors.green],
            [
              'model.forward(input)',
              'bypasses call hooks → parameter unavailable',
              themeColors.pink,
            ],
            ['encode(input)', 'register forward method → intended hooks', themeColors.cyan],
          ],
          380,
          180,
        );
      } else {
        drawText(
          ctx,
          api,
          'Reshard policy changes the compute allocation lifetime',
          960,
          285,
          35,
          themeColors.yellow,
          'center',
        );
        const rows = [
          ['True', 'gather', 'F', 'release', 'gather B'],
          ['False', 'gather', 'F', 'retain', 'B'],
          ['None', 'non-root True', 'root False', '', ''],
          ['integer', 'smaller shard group', 'constraints apply', '', ''],
        ];
        drawGrid(
          ctx,
          api,
          [['Policy', 'Entry', 'Forward', 'After', 'Backward'], ...rows],
          170,
          390,
          1580,
          420,
          themeColors.cyan,
          26,
        );
        drawFooter(
          ctx,
          api,
          'Deliberate unshard is nonrecursive and does not recreate every hook lifecycle',
        );
      }
    }
  });
}
export default {
  id: 'fsdp-hooks',
  draw: drawFsdpHooks,
  cues: ['pt-fsdp-hooks-0', 'pt-fsdp-hooks-1', 'pt-fsdp-hooks-2'],
};
