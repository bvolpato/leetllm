import {
  bias,
  centeredWhitePixel,
  featureBiasContract,
  imageChannelMeans,
  sequence0,
  shape,
} from '../fixtures.mjs';
import { complete, count, event } from '../construction.mjs';
import { caption, equation, numberGrid, target, text } from '../defaults.mjs';
export function drawContracts(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  {
    if (currentBeat === 0) {
      const remove = event(state, 0, 'image-subtract');
      const moved = complete(event(state, 0, 'move-color-axis'));
      const colors = [themeColors.red, themeColors.green, themeColors.blue];
      text(ctx, api, 'One white pixel', 960, 276, 43, themeColors.ink, 'center');
      target(ctx, api, 'image-result', () => {
        ['Red', 'Green', 'Blue'].forEach((name, d) => {
          const x = 390 + d * 460,
            bottom = 710,
            height = 275;
          const color = colors[d];
          const remaining = height * (1 - remove * imageChannelMeans[d]);
          text(ctx, api, name, x + 110, 365, 34, color, 'center');
          api.rect(ctx, x, bottom - height, 220, height, themeColors.panel, color, 0);
          api.rect(ctx, x + 2, bottom - remaining + 2, 216, remaining - 2, color, undefined, 0);
          text(
            ctx,
            api,
            '1 − ' + imageChannelMeans[d].toFixed(2),
            x + 110,
            777,
            34,
            themeColors.ink,
            'center',
          );
          if (complete(remove))
            text(ctx, api, centeredWhitePixel[d].toFixed(2), x + 110, 844, 43, color, 'center');
        });
      });
      target(ctx, api, 'image-channels', () =>
        equation(
          ctx,
          api,
          moved
            ? String.raw`(32,3,224,224)-(1,3,1,1)\to(32,3,224,224)`
            : String.raw`(32,224,224,3)-(3,)\to(32,224,224,3)`,
          960,
          940,
          38,
          themeColors.cyan,
        ),
      );
      caption(
        ctx,
        api,
        moved
          ? 'Channels first  ·  one mean per channel across height and width'
          : 'Channels last  ·  example training means shared across all pixels',
      );
    } else {
      const repair = currentBeat === 2 ? event(state, 2, 'contract-repair') : 0,
        offsets = repair > 0 ? bias : [10, 20, 30],
        check = featureBiasContract(shape, offsets),
        rejected = complete(event(state, 2, 'reject-short-bias')),
        biasColor = repair > 0 ? themeColors.green : rejected ? themeColors.pink : themeColors.blue,
        visible = count(4, repair);
      target(ctx, api, 'boundary-guard', () => {
        text(
          ctx,
          api,
          'migrate · four named feature positions',
          560,
          295,
          33,
          themeColors.blue,
          'center',
        );
        numberGrid(ctx, api, [sequence0[1]], 270, 380, 580, 120, themeColors.blue, 'guard-input');
        text(ctx, api, 'incoming bias', 1395, 295, 33, biasColor, 'center');
        numberGrid(
          ctx,
          api,
          [offsets],
          1110,
          380,
          offsets.length * 145,
          120,
          biasColor,
          'guard-offsets',
        );
        if (!check.bias) {
          ctx.save();
          ctx.setLineDash([8, 8]);
          api.rect(ctx, 1110 + offsets.length * 145, 380, 145, 120, 'transparent', biasColor, 0);
          ctx.restore();
        }
        for (let d = 0; d < 4; d++) {
          const left = 270 + (d + 0.5) * 145,
            right = 1110 + (d + 0.5) * 145;
          text(ctx, api, 'd' + d, left, 540, 29, themeColors.blue, 'center');
          if (d < offsets.length) text(ctx, api, 'd' + d, right, 540, 29, biasColor, 'center');
        }
        text(ctx, api, 'rank = 3', 560, 675, 39, themeColors.green, 'center');
        text(
          ctx,
          api,
          'bias.shape = (' + offsets.length + ',)',
          1395,
          675,
          39,
          biasColor,
          'center',
        );
        if (!check.accepted && rejected)
          text(
            ctx,
            api,
            'ValueError · stop before addition',
            960,
            830,
            42,
            themeColors.pink,
            'center',
          );
      });
      target(ctx, api, 'guard-repair', () => {
        if (check.accepted) {
          numberGrid(
            ctx,
            api,
            [sequence0[1].map((value, d) => (d < visible ? value + offsets[d] : ''))],
            670,
            790,
            580,
            110,
            themeColors.green,
            'guard-output',
          );
          if (visible === 4)
            equation(
              ctx,
              api,
              String.raw`\operatorname{shape}(\mathrm{out})=\operatorname{shape}(x)`,
              960,
              945,
              37,
              themeColors.green,
            );
        }
      });
      caption(
        ctx,
        api,
        'External boundary: explicit exceptions for rank, bias and dtype · internal invariant: output shape',
      );
    }
  }
}
export default {
  id: 'contracts',
  draw: drawContracts,
  cues: [
    'image-transfer',
    'image-subtract',
    'move-color-axis',
    'boundary-contract',
    'reject-short-bias',
    'contract-repair',
  ],
};
