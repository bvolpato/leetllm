import { apiChapterState } from '../construction.mjs';
import { footer, heading, panel, travel } from '../defaults.mjs';
export function drawFormatContract(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat,
    modelState = apiChapterState('format-contract', state),
    u = modelState.p,
    done = modelState.settled;
  {
    if (currentBeat === 0) {
      heading(ctx, api, 'Syntax, schema and trusted policy are separate gates');
      ['JSON syntax', 'supported schema', 'trusted policy'].forEach((v, i) =>
        panel(
          ctx,
          api,
          v,
          220 + i * 550,
          430,
          450,
          130,
          [themeColors.blue, themeColors.cyan, themeColors.green][i],
          31,
        ),
      );
      travel(
        ctx,
        api,
        'candidate',
        {
          x: 310,
          y: 760,
        },
        {
          x: 1410,
          y: 760,
        },
        u,
        themeColors.yellow,
        220,
      );
      footer(
        ctx,
        api,
        'Both decision values fit the schema. Check the account to choose one.',
      );
    } else if (currentBeat === 1) {
      heading(ctx, api, 'The actual schema belongs in Responses text.format');
      panel(
        ctx,
        api,
        'Responses request\ntext.format\nstrict: true',
        220,
        405,
        620,
        180,
        themeColors.blue,
        31,
      );
      const fields = [
        'required: decision',
        'required: minimum age',
        'required: source IDs',
        'additionalProperties: false',
      ];
      fields.forEach((v, i) => {
        if (u > i * 0.18) panel(ctx, api, v, 1030, 390 + i * 130, 680, 90, themeColors.cyan, 28);
      });
      footer(
        ctx,
        api,
        'Look up each source ID and compare its threshold with the proposed minimum age',
      );
    } else {
      heading(ctx, api, 'Admit one completed decision, preserving other terminal states');
      ['refusal', 'incomplete / empty', 'completed text'].forEach((v, i) =>
        panel(
          ctx,
          api,
          v,
          230 + i * 540,
          410,
          460,
          130,
          i === 2 ? themeColors.green : themeColors.pink,
          30,
        ),
      );
      if (done)
        panel(
          ctx,
          api,
          'Only completed text enters the parser',
          400,
          770,
          1120,
          110,
          themeColors.green,
          32,
        );
      footer(ctx, api, 'Check schema support on the model and endpoint that serve the request');
    }
  }
}
export default {
  id: 'format-contract',
  draw: drawFormatContract,
  cues: ['ap-format-contract-0', 'ap-format-contract-1', 'ap-format-contract-2'],
};
