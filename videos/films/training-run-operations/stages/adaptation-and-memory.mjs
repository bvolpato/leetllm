import { clamp, motion, trainingMemory } from '../arithmetic.mjs';
import { trainingCompleted, trainingCue, trainingStarted } from '../construction.mjs';
import { drawBox, drawCell, drawFooter, drawLine, drawText } from '../defaults.mjs';
export function drawAdaptationAndMemory(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    beat = state.beat ?? 0,
    progress = clamp(state.beatP ?? 0),
    q = motion(progress);
  api.focus.target('adaptation-and-memory-mechanism', () => {
    if (beat === 0) {
      drawText(
        ctx,
        api,
        'An adapter run on labeled responses',
        960,
        285,
        40,
        themeColors.blue,
        'center',
      );
      const rows = [
        ['Learning signal', ['SFT labels', 'domain text', 'teacher targets'], themeColors.blue],
        ['Trainable parameters', ['full model', 'LoRA adapters'], themeColors.cyan],
        ['Base representation', ['BF16', 'FP8', 'NF4'], themeColors.yellow],
      ];
      rows.forEach(([name, values, color], i) => {
        const y = 375 + i * 210;
        drawText(ctx, api, name, 190, y + 45, 31, color);
        const cue = ['adaptation-objective', 'adaptation-parameters', 'adaptation-format'][i];
        const chosen = trainingStarted(state, cue, progress > 0.12 + i * 0.23);
        values.forEach((v, k) => {
          drawCell(
            ctx,
            api,
            v,
            680 + k * 360,
            y,
            325,
            100,
            chosen && k === i ? color : themeColors.muted,
            28,
          );
          if (chosen && k === i)
            drawLine(ctx, api, 688 + k * 360, y + 118, 997 + k * 360, y + 118, color, 6);
        });
      });
      drawFooter(
        ctx,
        api,
        'A parameter-efficient method does not define the learning objective or guarantee compatible quantized execution.',
      );
    } else if (beat === 1) {
      const heavy = trainingMemory(70e9, 4, 24),
        small = trainingMemory(8e9, 16, 24);
      const converted = trainingStarted(state, 'memory-gib', progress > 0.4);
      if (!converted) {
        drawText(
          ctx,
          api,
          'Ideal storage · four bits per weight',
          960,
          285,
          40,
          themeColors.blue,
          'center',
        );
        drawText(
          ctx,
          api,
          'One illustrative byte holds two four-bit weights',
          960,
          400,
          34,
          themeColors.muted,
          'center',
        );
        for (let bit = 0; bit < 8; bit++)
          drawCell(
            ctx,
            api,
            'bit',
            240 + bit * 180,
            500,
            155,
            125,
            bit < 4 ? themeColors.blue : themeColors.cyan,
            30,
          );
        drawText(ctx, api, '4 bits', 600, 710, 41, themeColors.blue, 'center');
        drawText(ctx, api, '4 bits', 1320, 710, 41, themeColors.cyan, 'center');
        const bytes = trainingStarted(state, 'memory-bytes', progress > 0.27);
        drawText(
          ctx,
          api,
          bytes
            ? '70 billion × 4 / 8 = 35 billion bytes'
            : '70 billion weights × 4 bits per weight',
          960,
          850,
          44,
          themeColors.yellow,
          'center',
        );
        drawFooter(
          ctx,
          api,
          'Storage conversion only · quantization metadata and training allocations are still omitted.',
        );
        return;
      }
      const plot = teaching.axes({
        x: 300,
        y: 370,
        width: 1250,
        height: 450,
        xDomain: [0, 48],
        yDomain: [0, 2],
        xTicks: [0, 12, 24, 36, 48],
        yTicks: [],
        xLabel: 'GiB · ideal base-weight floor',
        yLabel: '',
        fontSize: 26,
      });
      const scale = 1250 / 48;
      drawText(
        ctx,
        api,
        'Supplied resident capacity: 24 GiB',
        960,
        285,
        38,
        themeColors.yellow,
        'center',
      );
      const capX = 300 + 24 * scale;
      drawLine(ctx, api, capX, 340, capX, 845, themeColors.pink, 4);
      const fill = 1;
      drawBox(ctx, api, 300, 445, Math.max(2, heavy.baseGiB * scale * fill), 100, themeColors.pink);
      drawText(ctx, api, '70B · ideal 4-bit', 320, 410, 29, themeColors.pink);
      if (trainingStarted(state, 'adaptation-floor', progress > 0.25))
        drawText(
          ctx,
          api,
          'Floor: ' + heavy.baseGiB.toFixed(1) + ' GiB',
          1590,
          510,
          32,
          themeColors.pink,
          'center',
        );
      drawBox(
        ctx,
        api,
        300,
        665,
        Math.max(2, small.baseGiB * scale * trainingCue(state, 'adaptation-smaller', q)),
        100,
        themeColors.cyan,
      );
      drawText(ctx, api, '8B · BF16', 320, 630, 29, themeColors.cyan);
      if (trainingStarted(state, 'adaptation-smaller', progress > 0.6))
        drawText(
          ctx,
          api,
          trainingCompleted(state, 'adaptation-smaller', progress >= 1)
            ? 'Floor: ' + small.baseGiB.toFixed(1) + ' GiB'
            : 'Constructing floor',
          1590,
          730,
          32,
          themeColors.cyan,
          'center',
        );
      drawFooter(
        ctx,
        api,
        'Base bytes = parameters × bits / 8. This is a lower bound, not complete training memory.',
      );
    } else {
      const m = trainingMemory(70e9, 4, 48),
        x = 220,
        w = 1480,
        baseW = (w * m.baseGiB) / 48;
      drawText(
        ctx,
        api,
        'Supplied 48 GiB capacity · ideal 70B four-bit base',
        960,
        285,
        37,
        themeColors.blue,
        'center',
      );
      drawBox(ctx, api, x, 390, baseW, 210, themeColors.blue);
      drawBox(ctx, api, x + baseW, 390, w - baseW, 210, themeColors.yellow);
      drawText(
        ctx,
        api,
        m.baseGiB.toFixed(1) + ' GiB base',
        x + baseW / 2,
        515,
        46,
        themeColors.blue,
        'center',
      );
      drawText(
        ctx,
        api,
        m.remainderGiB.toFixed(1) + ' GiB left',
        x + baseW + (w - baseW) / 2,
        515,
        38,
        themeColors.yellow,
        'center',
      );
      drawText(
        ctx,
        api,
        'Remainder must fit every omitted cost',
        960,
        690,
        35,
        themeColors.yellow,
        'center',
      );
      ['metadata', 'adapters', 'activations', 'gradients', 'moments', 'temporaries'].forEach(
        (v, i) =>
          drawCell(
            ctx,
            api,
            v,
            190 + (i % 3) * 560,
            750 + Math.floor(i / 3) * 120,
            510,
            85,
            themeColors.muted,
            29,
          ),
      );
      drawFooter(
        ctx,
        api,
        'Unknown total peak. Original QLoRA demonstrated 65B on one 48GB GPU, not this 70B / 24GiB plan.',
      );
    }
  });
}
export default {
  id: 'adaptation-and-memory',
  draw: drawAdaptationAndMemory,
  cues: [
    'adaptation-and-memory-step-1',
    'adaptation-objective',
    'adaptation-parameters',
    'adaptation-format',
    'adaptation-and-memory-step-2',
    'adaptation-floor',
    'adaptation-smaller',
    'memory-bits',
    'memory-bytes',
    'memory-gib',
    'adaptation-and-memory-step-3',
    'adaptation-remainder',
  ],
};
