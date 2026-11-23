import { prEvent } from '../construction.mjs';
import { serialRequestTrace } from '../model.mjs';
import { centeredText, extensionFooter, extensionText } from '../defaults.mjs';
export function drawSerialLatency(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    ev = (name, beat) => prEvent(state, name, beat),
    done = (name, beat) => ev(name, beat) === 1;
  api.focus.target('serial-latency-mechanism', () => {
    const f = serialRequestTrace();
    if (currentBeat < 2) {
      const clock =
        currentBeat > 0
          ? 751 + 3 * ev('trace', 1)
          : ev('complete', 0) > 0
            ? 341 + 410 * ev('complete', 0)
            : 341 * ev('startup', 0);
      centeredText(
        ctx,
        api,
        'One serial request clock · milliseconds',
        960,
        285,
        35,
        themeColors.yellow,
      );
      const xs = (v) => 160 + v * 2;
      f.stages.forEach((s, i) => {
        const length = Math.max(0, Math.min(clock, s.end) - s.start);
        api.rect(
          ctx,
          xs(s.start),
          470,
          2 * length,
          80,
          [
            themeColors.blue,
            themeColors.cyan,
            themeColors.yellow,
            themeColors.pink,
            themeColors.green,
          ][i],
          undefined,
          0,
        );
        extensionText(
          ctx,
          api,
          s.name + ' ' + s.duration,
          180 + (i % 3) * 560,
          660 + Math.floor(i / 3) * 100,
          29,
          [
            themeColors.blue,
            themeColors.cyan,
            themeColors.yellow,
            themeColors.pink,
            themeColors.green,
          ][i],
        );
      });
      centeredText(
        ctx,
        api,
        (currentBeat === 0 ? 'Live clock ' : 'Completion / trace clock ') + Math.round(clock),
        960,
        400,
        37,
        themeColors.ink,
      );
      if (done('first', 0) || currentBeat > 0)
        centeredText(
          ctx,
          api,
          'Caller first token 341 · model TTFT 320',
          960,
          870,
          33,
          themeColors.cyan,
        );
      if (done('complete', 0) || currentBeat > 0)
        centeredText(ctx, api, 'Answer complete 751', 960, 940, 33, themeColors.green);
      if (currentBeat === 1) {
        centeredText(
          ctx,
          api,
          done('trace', 1) ? 'Nonblocking trace complete 754' : 'Trace is off the response path',
          960,
          335,
          31,
          themeColors.muted,
        );
        if (ev('buffer', 1) > 0)
          centeredText(
            ctx,
            api,
            'Buffered release waits for full generation + validation',
            960,
            985,
            28,
            themeColors.yellow,
          );
      }
    } else {
      centeredText(
        ctx,
        api,
        'Local stages pass · one shared deadline still fails',
        960,
        290,
        34,
        themeColors.yellow,
      );
      let x = 170;
      f.localPassingStages.forEach((value, i) => {
        const w = value * 1.48;
        api.rect(
          ctx,
          x,
          540,
          w,
          100,
          [
            themeColors.blue,
            themeColors.cyan,
            themeColors.yellow,
            themeColors.pink,
            themeColors.green,
          ][i],
          undefined,
          0,
        );
        x += w;
        centeredText(
          ctx,
          api,
          value,
          260 + i * 345,
          760,
          32,
          [
            themeColors.blue,
            themeColors.cyan,
            themeColors.yellow,
            themeColors.pink,
            themeColors.green,
          ][i],
        );
      });
      api.line(ctx, 1650, 440, 1650, 680, themeColors.pink, 5);
      centeredText(ctx, api, '1,000 ms deadline', 1570, 370, 30, themeColors.pink);
      if (done('deadline', 2))
        centeredText(ctx, api, 'Total 1,050 ms → missed by 50 ms', 960, 900, 38, themeColors.pink);
    }
    extensionFooter(
      ctx,
      api,
      'Supplied timings only; runtime cancellation needs propagated remaining time and tested behavior',
    );
  });
}
export default {
  id: 'serial-latency',
  draw: drawSerialLatency,
  cues: ['pr-startup', 'pr-first', 'pr-complete', 'pr-trace', 'pr-buffer', 'pr-deadline'],
};
