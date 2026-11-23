import { sampleModel } from '../construction.mjs';
import { drawCard, drawFooter, drawGrid, drawPathParticle, drawText } from '../defaults.mjs';
export function drawElasticIdentity(ctx, scene, state, api) {
  return api.focus.target('pt-elastic-identity-mechanism', () => {
    const { C: themeColors } = api,
      modelState = sampleModel('elastic-identity', state),
      { b: currentBeat, p: progress } = modelState;
    {
      if (currentBeat === 0) {
        drawText(
          ctx,
          api,
          'Restarted endpoints read their current group identity',
          960,
          285,
          35,
          themeColors.yellow,
          'center',
        );
        for (let i = 0; i < 4; i++) {
          drawCard(ctx, api, 'Old rank ' + i, 190 + i * 430, 390, 370, themeColors.muted, 95);
          drawCard(
            ctx,
            api,
            'New endpoint ' + ((i + 2) % 4),
            190 + i * 430,
            730,
            370,
            themeColors.cyan,
            95,
          );
          drawPathParticle(
            ctx,
            api,
            [
              {
                x: 375 + i * 430,
                y: 505,
              },
              {
                x: 375 + i * 430,
                y: 620,
              },
              {
                x: 375 + i * 430,
                y: 710,
              },
            ],
            progress,
            themeColors.yellow,
          );
        }
        drawFooter(ctx, api, 'An old rank filename does not define current tensor ownership');
      } else if (currentBeat === 1) {
        drawGrid(
          ctx,
          api,
          [
            ['Model', 'Optimizer', 'Scheduler', 'Scaler'],
            ['RNG', 'Data cursor', 'Global step', 'Code / config'],
          ],
          210,
          400,
          1500,
          260,
          themeColors.cyan,
        );
        const n = Math.min(8, Math.floor(progress * 8 + 1e-8));
        drawText(
          ctx,
          api,
          'Restored trajectory fields: ' + n + ' / 8',
          960,
          850,
          37,
          themeColors.green,
          'center',
        );
      } else {
        drawText(
          ctx,
          api,
          'Supplied complete checkpoint at step 80 · failure after 87',
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
            Array.from(
              {
                length: 8,
              },
              (_, i) => (i === 0 ? '80 saved' : 81 + i - 1),
            ),
          ],
          180,
          470,
          1560,
          130,
          themeColors.blue,
          26,
        );
        drawText(
          ctx,
          api,
          'Replay debt: seven updates and their exact data identities',
          960,
          810,
          34,
          themeColors.pink,
          'center',
        );
        drawFooter(
          ctx,
          api,
          'Launcher retries rebuild workers; the application must restore durable progress',
        );
      }
    }
  });
}
export default {
  id: 'elastic-identity',
  draw: drawElasticIdentity,
  cues: ['pt-elastic-identity-0', 'pt-elastic-identity-1', 'pt-elastic-identity-2'],
};
