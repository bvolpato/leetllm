import { complete, sentence } from '../construction.mjs';
import { drawChapterFooter, drawChapterGrid, drawChapterText } from '../defaults.mjs';
export function drawManagedUnmanaged(ctx, scene, state, api) {
  const { C: themeColors, components, teaching } = api,
    currentBeat = state.beat;
  const sentenceProgress = (beat, index) => sentence(state, 'managed-unmanaged', beat, index),
    resultComplete = (beat, index) => complete(state, 'managed-unmanaged', beat, index);
  api.focus.target('managed-unmanaged-construction', () => {
    drawChapterText(
      ctx,
      api,
      'One supplied window · accumulation count = 8',
      960,
      285,
      35,
      themeColors.yellow,
      'center',
    );
    const count = currentBeat === 0 ? Math.floor(sentenceProgress(0, 0) * 8) : 8;
    drawChapterGrid(
      ctx,
      api,
      [
        Array.from(
          {
            length: 8,
          },
          (_, i) => (i < count ? 'backward ' + (i + 1) : 'pending'),
        ),
      ],
      170,
      360,
      1580,
      100,
      themeColors.blue,
      27,
    );
    if (currentBeat === 0) {
      const steps = resultComplete(0, 0) ? 8 : count;
      drawChapterGrid(
        ctx,
        api,
        [
          Array.from(
            {
              length: 8,
            },
            (_, i) => (i < steps ? 'step ' + (i + 1) : ''),
          ),
        ],
        170,
        510,
        1580,
        95,
        themeColors.cyan,
        27,
      );
      if (resultComplete(0, 1)) {
        drawChapterText(
          ctx,
          api,
          'Managed: 8 microsteps → 1 optimizer update',
          960,
          735,
          39,
          themeColors.green,
          'center',
        );
      }
      if (resultComplete(0, 2)) {
        drawChapterText(
          ctx,
          api,
          '8 backward calls + only 1 step call → microstep 1; update still waiting',
          960,
          835,
          32,
          themeColors.pink,
          'center',
        );
      }
      if (resultComplete(0, 3))
        drawChapterFooter(
          ctx,
          api,
          'Configured averaging already applied · an extra ÷8 changes the objective',
          955,
          themeColors.yellow,
        );
    } else if (currentBeat === 1) {
      const step = sentenceProgress(1, 0);
      drawChapterGrid(
        ctx,
        api,
        [
          Array.from(
            {
              length: 8,
            },
            (_, i) => (i === 7 && step === 1 ? 'step → update' : 'caller waits'),
          ),
        ],
        170,
        510,
        1580,
        95,
        themeColors.cyan,
        26,
      );
      if (resultComplete(1, 1)) {
        drawChapterText(
          ctx,
          api,
          'Caller supplies the actual accumulation weights',
          960,
          760,
          38,
          themeColors.yellow,
          'center',
        );
        drawChapterText(
          ctx,
          api,
          'Equal counts: 1/8 each · unequal counts: valid-token fractions',
          960,
          865,
          32,
          themeColors.cyan,
          'center',
        );
      }
    } else {
      drawChapterText(
        ctx,
        api,
        'Same request: unmanaged accumulation + optimizer offload',
        960,
        520,
        33,
        themeColors.yellow,
        'center',
      );
      const checked = resultComplete(2, 2);
      drawChapterGrid(
        ctx,
        api,
        [
          ['Version evidence', 'Eligibility'],
          ['August pin c455031', checked ? 'reject' : 'check installed source'],
          [
            'Guide inspected 2026-11-06',
            checked ? 'supported guide path' : 'check dated documentation',
          ],
        ],
        290,
        590,
        1340,
        240,
        themeColors.blue,
        29,
      );
      drawChapterFooter(ctx, api, 'Documentation cannot change the already installed engine');
    }
  });
}
export default {
  id: 'managed-unmanaged',
  draw: drawManagedUnmanaged,
  cues: [
    'ds-managed-unmanaged-b0-s0',
    'ds-managed-unmanaged-b0-s1',
    'ds-managed-unmanaged-b0-s2',
    'ds-managed-unmanaged-b0-s3',
    'ds-managed-unmanaged-b1-s0',
    'ds-managed-unmanaged-b1-s1',
    'ds-managed-unmanaged-b1-s2',
    'ds-managed-unmanaged-b2-s0',
    'ds-managed-unmanaged-b2-s1',
    'ds-managed-unmanaged-b2-s2',
    'ds-managed-unmanaged-b2-s3',
    'ds-managed-unmanaged-b2-s4',
  ],
};
