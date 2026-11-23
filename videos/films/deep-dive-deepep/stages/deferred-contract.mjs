import { deferredWaitTrace } from '../arithmetic.mjs';
import { text } from '../defaults.mjs';

export function drawDeferredContract(ctx, scene, state, api) {
  const { C } = api;
  const done = (id) => state.cues?.[id]?.phase === 'after';
  const calls =
    state.beat === 1 ? 1 + Number(done('de-second-none')) : Number(done('de-first-four'));
  const trace = deferredWaitTrace(calls);
  text(
    ctx,
    api,
    'V2.5 deferred dispatch   ·   CPU model of the wait contract',
    960,
    278,
    37,
    C.muted,
    'center',
  );
  api.focus.target('de-deferred-contract-mechanism', () => {
    for (let i = 0; i < 2; i++) {
      const y = 452 + i * 165;
      const called = i < trace.dependencyCalls;
      const color = called ? C.cyan : C.muted;
      text(ctx, api, 'Consumer ' + (i ? 'B' : 'A'), 150, y, 40, color);
      text(ctx, api, 'event.wait()', 680, y, 42, color, 'center');
      api.line(ctx, 875, y - 13, 1085, y - 13, color, 4);
      const result = trace.results[i];
      const output = called ? (result ? result.join(', ') : 'None') : '?';
      text(ctx, api, output, 1430, y, 38, color, 'center');
    }
    text(
      ctx,
      api,
      trace.dependencyCalls +
        ' stream dependencies     ·     ' +
        trace.hookCalls +
        ' epilogue calls',
      960,
      748,
      34,
      C.ink,
      'center',
    );
  });
  api.focus.target('de-deferred-results', () => {
    const first = trace.results[0];
    if (first) {
      text(ctx, api, 'Saved by the caller', 340, 907, 34, C.ink, 'center');
      first.forEach((name, i) => {
        const x = 580 + 305 * i;
        api.rect(ctx, x, 831, 265, 116, C.panel, C.green, 10);
        text(ctx, api, name, x + 132, 905, 40, C.green, 'center');
      });
    } else {
      const failed = done('dep-result-deferred-typeerror');
      text(
        ctx,
        api,
        failed
          ? 'Five-value unpack of one event object   →   TypeError'
          : 'Deferred dispatch returns one event object',
        960,
        904,
        38,
        failed ? C.pink : C.yellow,
        'center',
      );
    }
  });
}
export default {
  id: 'deferred-contract',
  draw: drawDeferredContract,
  cues: [
    'dep-result-deferred-typeerror',
    'de-first-four',
    'de-deferred-contract-b1',
    'de-second-none',
  ],
};
