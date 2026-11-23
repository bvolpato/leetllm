import { sampleModel } from '../construction.mjs';
import { drawCard, drawFooter, drawGrid, drawRows, drawText } from '../defaults.mjs';
export function drawMeshShapes(ctx, scene, state, api) {
  return api.focus.target('pt-mesh-shapes-mechanism', () => {
    const { C: themeColors } = api,
      modelState = sampleModel('mesh-shapes', state),
      { b: currentBeat, p: progress } = modelState;
    {
      if (currentBeat === 0) {
        drawText(
          ctx,
          api,
          'Placements are attached to named mesh axes',
          960,
          285,
          35,
          themeColors.yellow,
          'center',
        );
        drawGrid(
          ctx,
          api,
          [
            ['dp0/tp0', 'dp0/tp1', 'dp0/tp2', 'dp0/tp3'],
            ['dp1/tp0', 'dp1/tp1', 'dp1/tp2', 'dp1/tp3'],
          ],
          240,
          400,
          1440,
          250,
          themeColors.blue,
          29,
        );
        drawText(
          ctx,
          api,
          'tp: shard the chosen tensor dimension',
          960,
          790,
          33,
          themeColors.cyan,
          'center',
        );
        drawText(
          ctx,
          api,
          'dp: retain corresponding replicated slices',
          960,
          920,
          33,
          themeColors.pink,
          'center',
        );
      } else if (currentBeat === 1) {
        drawText(
          ctx,
          api,
          'Global stored weight [4096,16384] · shard dimension 1 over tp4',
          960,
          285,
          32,
          themeColors.yellow,
          'center',
        );
        for (let r = 0; r < 2; r++)
          for (let k = 0; k < 4; k++) {
            const painted = k < Math.floor(progress * 4 + 1e-8) || modelState.showLocal;
            drawCard(
              ctx,
              api,
              '',
              200 + k * 410,
              410 + r * 190,
              360,
              r ? themeColors.pink : themeColors.blue,
              140,
            );
            if (painted)
              drawText(
                ctx,
                api,
                'TP slice ' + k,
                380 + k * 410,
                460 + r * 190,
                27,
                r ? themeColors.pink : themeColors.blue,
                'center',
              );
            if (painted && modelState.showLocal)
              drawText(
                ctx,
                api,
                '4096 × 4096',
                380 + k * 410,
                520 + r * 190,
                27,
                themeColors.cyan,
                'center',
              );
          }
        drawFooter(ctx, api, 'The two dp copies retain the same corresponding tp shard');
      } else {
        drawRows(
          ctx,
          api,
          [
            ['Shard → Replicate', 'all-gather on selected mesh axis'],
            ['Partial(sum) → Replicate', 'all-reduce on selected mesh axis'],
            ['Partial(sum) → Shard', 'reduce-scatter on selected mesh axis'],
          ],
          380,
          180,
        );
        drawFooter(ctx, api, 'The other mesh axis retains its placement');
      }
    }
  });
}
export default {
  id: 'mesh-shapes',
  draw: drawMeshShapes,
  cues: ['pt-mesh-shapes-0', 'pt-mesh-shapes-1', 'pt-mesh-local', 'pt-mesh-shapes-2'],
};
