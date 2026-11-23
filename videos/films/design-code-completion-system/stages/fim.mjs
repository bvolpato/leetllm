import { fimTrace, sampleModel } from '../construction.mjs';
import { code, text } from '../defaults.mjs';
export function drawFim(ctx, scene, state, api) {
  const { C: themeColors, components: components } = api,
    modelState = sampleModel(state);
  {
    const trace = fimTrace(state.beat, state.beatP ?? 0),
      r = trace.reorder;
    text(
      ctx,
      api,
      modelState.b
        ? 'Preserve the same prefix and suffix while changing their prompt order'
        : 'File order around the cursor',
      960,
      275,
      34,
      themeColors.ink,
      'center',
    );
    const spans = [
      {
        id: 'PREFIX',
        x: 190,
        y: 500,
        text: 'is_allowed =',
        color: themeColors.blue,
      },
      {
        id: 'SUFFIX',
        x: 1310 - 560 * r,
        y: 500 - 180 * Math.sin(Math.PI * r),
        text: 'return is_allowed',
        color: themeColors.cyan,
      },
      {
        id: r === 1 ? 'MIDDLE' : 'HOLE',
        x: 750 + 560 * r,
        y: 500 + 180 * Math.sin(Math.PI * r),
        text: trace.generated
          ? 'graph.allows(request)'.slice(0, Math.floor(21 * trace.generated))
          : '<insertion>',
        color: trace.generated ? themeColors.green : themeColors.yellow,
      },
    ];
    for (const span of spans) {
      if (span.id === 'MIDDLE' && trace.returnProgress > 0) continue;
      api.focus.target('fim-panel-fim', () =>
        components.panel({
          x: span.x,
          y: span.y,
          width: 440,
          height: 110,
          fill: themeColors.panel,
          stroke: span.color,
        }),
      );
      text(ctx, api, span.id, span.x + 220, span.y + 33, 27, span.color, 'center');
      code(ctx, api, span.text, span.x + 20, span.y + 82, 24, span.color);
    }
    if (r === 1 && trace.returnProgress === 0)
      text(
        ctx,
        api,
        'Causal generation now sees both preserved boundaries',
        960,
        765,
        32,
        themeColors.green,
        'center',
      );
    if (trace.inserted) {
      ctx.save();
      ctx.font = '500 33px "Lesson Mono"';
      const caret = 320 + ctx.measureText('is_allowed = ').width;
      ctx.restore();
      const u = trace.returnProgress;
      code(ctx, api, 'is_allowed = ', 320, 865, 33, themeColors.blue);
      code(ctx, api, 'return is_allowed', 320, 925, 33, themeColors.cyan);
      code(
        ctx,
        api,
        'graph.allows(request)',
        1330 + (caret - 1330) * u,
        582 + (865 - 582) * u,
        24 + 9 * u,
        themeColors.green,
      );
      if (u === 1)
        text(
          ctx,
          api,
          'Returned middle · suffix intact',
          1510,
          910,
          28,
          themeColors.green,
          'center',
        );
    }
  }
}
export default {
  id: 'fim',
  draw: drawFim,
  cues: ['fim-beat-1-focus-1', 'fim-beat-2-focus-1'],
};
