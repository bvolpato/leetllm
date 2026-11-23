import { chapterModel } from '../construction.mjs';
import { text } from '../defaults.mjs';

export function drawScaleContract(ctx, scene, state, api) {
  const { C } = api;
  const m = chapterModel('scale-contract', state);
  const done = (id) => state.cues?.[id]?.phase === 'after';
  const progress = (id) => state.cues?.[id]?.progress ?? 0;
  if (m.b === 0) {
    api.focus.target('de-scale-contract-mechanism', () => {
      text(ctx, api, 'One row   ·   7,168 FP8 values', 960, 282, 45, C.ink, 'center');
      const count = Math.round(progress('de-scale-groups') * m.groups);
      for (let i = 0; i < m.groups; i++) {
        const x = 210 + (i % 8) * 190;
        const y = 350 + Math.floor(i / 8) * 58;
        api.rect(ctx, x, y, 172, 35, C.blue, undefined, 0);
        api.rect(ctx, x + 172, y, (172 * 4) / 128, 35, i < count ? C.pink : C.panel, undefined, 0);
      }
      text(ctx, api, 'Each blue strip holds 128 values', 960, 802, 31, C.blue, 'center');
    });
    api.focus.target('de-scale-bytes', () =>
      text(
        ctx,
        api,
        done('de-scale-count')
          ? '56 scales × 4 bytes = ' + m.scaleBytes + ' bytes'
          : '4 bytes per scale',
        515,
        917,
        36,
        C.pink,
        'center',
      ),
    );
    api.focus.target('de-scale-total-result', () =>
      text(
        ctx,
        api,
        'Values + scales   ' +
          (done('de-scale-total') ? m.fp8.toLocaleString('en-US') + ' bytes' : '?'),
        1400,
        917,
        36,
        C.cyan,
        'center',
      ),
    );
    api.focus.target('de-scale-bf16-result', () =>
      text(
        ctx,
        api,
        done('de-scale-bf16')
          ? 'BF16 values alone   ' + m.bf16.toLocaleString('en-US') + ' bytes'
          : 'BF16 values use two bytes each',
        960,
        1010,
        32,
        C.muted,
        'center',
      ),
    );
    return;
  }

  const repair = m.b === 2 ? progress('de-scale-move') : 0;
  const wrong = m.b > 1 || done('de-scale-wrong');
  const correct = done('de-scale-right');
  const installed = repair === 1;
  const scaleX = 1370 - repair * 820;
  api.focus.target('de-scale-pair', () => {
    text(ctx, api, 'One received FP8 value   ·   coordinate 42', 960, 288, 42, C.ink, 'center');
    for (const [i, scale] of [0.5, 2].entries()) {
      const cx = 550 + 820 * i;
      api.rect(ctx, cx - 340, 369, 680, 190, C.panel, C.blue, 12);
      text(
        ctx,
        api,
        'Group ' + i + '    ·    coordinates ' + i * 128 + '–' + (i * 128 + 127),
        cx,
        432,
        32,
        C.blue,
        'center',
      );
      text(ctx, api, 'scale   ' + scale, cx, 520, 49, C.ink, 'center');
    }
    api.arrow(ctx, scaleX, 693, scaleX, 576, installed ? C.cyan : C.yellow, 5);
    text(ctx, api, 'Receiver reads here', scaleX, 755, 33, installed ? C.cyan : C.yellow, 'center');
  });
  api.focus.target('de-scale-decoded', () => {
    const equation = installed
      ? '10 × 0.5 = ' + (correct ? m.correctDecoded : '?')
      : repair > 0
        ? '10 × ?'
        : '10 × 2 = ' + (wrong ? m.wrongDecoded : '?');
    text(ctx, api, equation, 960, 890, 62, installed ? C.cyan : C.yellow, 'center');
    const prompt =
      m.b === 1 && done('de-scale-wrong')
        ? 'Which scale belongs to coordinate 42?'
        : correct
          ? 'Same FP8 value and payload size'
          : 'Decoded activation';
    text(ctx, api, prompt, 960, 997, 35, C.ink, 'center');
  });
}
export default {
  id: 'scale-contract',
  draw: drawScaleContract,
  cues: [
    'de-scale-groups',
    'de-scale-count',
    'de-scale-total',
    'de-scale-bf16',
    'de-scale-wrong',
    'de-scale-ask',
    'de-scale-move',
    'de-scale-right',
  ],
};
