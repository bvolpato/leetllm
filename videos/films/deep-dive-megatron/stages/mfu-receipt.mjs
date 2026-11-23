import { newChapterModel } from '../model.mjs';
import { chapterFooter, chapterGrid, chapterText, chapterTitle } from '../defaults.mjs';
export function drawMfuReceipt(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = newChapterModel('mfu-receipt', state),
    { b: currentBeat } = modelState;
  const cueProgress = () => api.focus.progress('mg-mfu-receipt-b' + currentBeat, modelState.p),
    R = (id) => api.focus.progress('mg-' + id, state.cues ? 0 : modelState.p),
    done = (id) => R(id) >= 1;
  api.focus.target('mg-mfu-receipt-mechanism', () => {
    chapterTitle(
      ctx,
      api,
      currentBeat ? 'Megatron H100 strong-scaling study' : 'One interval, two work numerators',
    );
    if (!currentBeat) {
      const n = Math.floor(cueProgress() * 100);
      for (let i = 0; i < 100; i++)
        api.rect(
          ctx,
          220 + (i % 20) * 75,
          400 + Math.floor(i / 20) * 75,
          60,
          60,
          i < n
            ? i < 40
              ? themeColors.blue
              : i < 50
                ? themeColors.pink
                : themeColors.panel
            : themeColors.panel,
          themeColors.muted,
          1,
        );
      if (done('mfu-forty-fifty')) {
        chapterText(
          ctx,
          api,
          'MFU: useful 40 / capacity 100 = 40%',
          960,
          875,
          35,
          themeColors.blue,
          'center',
        );
        chapterText(
          ctx,
          api,
          'Hardware-work: (40 + 10) / 100 = 50%',
          960,
          950,
          35,
          themeColors.pink,
          'center',
        );
      }
      chapterFooter(ctx, api, 'Extra activation recomputation is excluded from useful model FLOPs');
    } else {
      chapterGrid(
        ctx,
        api,
        [
          ['GPU count', '96', '4,608'],
          ['global sequences', '1,152', '1,152'],
          ['reported MFU', done('baseline-mfu') ? '47%' : '?', done('reported-mfu') ? '42%' : '?'],
        ],
        260,
        420,
        1400,
        330,
        themeColors.blue,
        33,
      );
      chapterFooter(
        ctx,
        api,
        'Same vocabulary, sequence length and overlap settings across both runs',
      );
    }
  });
  return true;
}
export default {
  id: 'mfu-receipt',
  draw: drawMfuReceipt,
  cues: [
    'mg-mfu-receipt-b0',
    'mg-mfu-forty-fifty',
    'mg-mfu-receipt-b1',
    'mg-baseline-mfu',
    'mg-reported-mfu',
  ],
};
