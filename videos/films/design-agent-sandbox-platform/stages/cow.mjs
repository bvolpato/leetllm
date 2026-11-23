import { sampleModel } from '../model.mjs';
import { drawLegacyCard, drawLegacyText } from '../defaults.mjs';
export function drawCow(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    modelState = sampleModel('cow', state);
  const transfer = (source, target, color = themeColors.cyan, p = modelState.q) =>
    teaching.transfer({
      source: {
        shape: source,
        opacity: 1,
      },
      target: {
        shape: target,
        opacity: 1,
      },
      progress: p,
      color,
      particle: {
        radius: 8,
        fill: color,
      },
    });
  {
    drawLegacyText(
      ctx,
      api,
      'One physical backing copy · each page is 4 KiB',
      560,
      285,
      30,
      themeColors.yellow,
      'center',
    );
    const positions = [0, 1, 3, 4, 5, 2],
      painted = new Map();
    positions.forEach((index, i) => {
      const x = 170 + (i % 3) * 280,
        y = 330 + Math.floor(i / 3) * 150;
      painted.set(
        index,
        api.focus.target('cow-base', () =>
          drawLegacyCard(
            ctx,
            api,
            `Base ${index} · ${modelState.base[index]}`,
            x,
            y,
            220,
            index === 2 ? themeColors.yellow : themeColors.muted,
            100,
            27,
          ),
        ),
      );
    });
    const a = api.focus.target('cow-clone-a-page-2', () =>
        drawLegacyCard(
          ctx,
          api,
          `Clone A: page 2 → ${modelState.refsA[2] === 'base-2' ? 'base 2' : 'private 2'}`,
          1070,
          780,
          650,
          themeColors.blue,
          100,
          28,
        ),
      ),
      bb = drawLegacyCard(
        ctx,
        api,
        'Clone B: page 2 → base 2',
        200,
        780,
        650,
        themeColors.pink,
        100,
        28,
      );
    const selected = painted.get(2);
    let privateShape = null;
    if (modelState.allocated) {
      privateShape = api.focus.target('cow-a-private-2', () =>
        drawLegacyCard(
          ctx,
          api,
          `A private 2 · ${modelState.privatePage.value}`,
          1320,
          480,
          400,
          themeColors.green,
          100,
          31,
        ),
      );
      transfer(selected, privateShape, themeColors.green, modelState.copyProgress);
      drawLegacyText(
        ctx,
        api,
        modelState.written ? 'Copy committed; A redirected' : 'Copy old value before writing',
        1520,
        430,
        25,
        themeColors.green,
        'center',
      );
    }
    api.connect(ctx, bb, selected, {
      color: themeColors.pink,
      gap: 16,
    });
    api.connect(ctx, a, modelState.written ? privateShape : selected, {
      color: themeColors.blue,
      gap: 16,
    });
    drawLegacyText(
      ctx,
      api,
      `Clone B reads ${modelState.b[2]} · clone A reads ${modelState.a[2]}`,
      960,
      940,
      32,
      themeColors.ink,
      'center',
    );
    drawLegacyText(
      ctx,
      api,
      `Resident physical pages: ${modelState.residentBytes / 4096} · private pages: ${modelState.privatePages} · ${(modelState.residentBytes / 1024).toFixed(0)} KiB`,
      960,
      1015,
      30,
      themeColors.green,
      'center',
    );
  }
}

// These supplied ownership and byte models are local illustrations, not a VMM or host-security test.
export default {
  id: 'cow',
  draw: drawCow,
  cues: ['cow-beat-1-focus-1', 'cow-beat-1-focus-2', 'cow-beat-2-focus-1', 'cow-beat-2-focus-2'],
};
