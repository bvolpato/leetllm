import { eventOverlap } from '../arithmetic.mjs';
import { cueClock } from '../clock.mjs';
import { runtimeText } from '../defaults.mjs';

export function drawEvents(ctx, scene, state, api) {
  const { C } = api;
  const p = cueClock(scene, state);
  const txt = (...args) => runtimeText(ctx, api, ...args);
  if (state.beat === 3) {
    const readyChain = p('event-good-chain');
    const independent = p('event-independent');
    api.focus.target('event-lanes', () => {
      const left = 535,
        unit = 116;
      txt('Logical tick', 145, 332, 34, C.muted);
      for (let i = 0; i <= 10; i++) txt(i, left + i * unit, 332, 32, C.muted, 'center');
      txt('Ordered chain', 145, 507, 40, C.cyan);
      txt('Other request', 145, 715, 40, C.green);
      eventOverlap(1).operations.forEach((row) => {
        const other = row.id === 'independent';
        const y = other ? 645 : 437;
        const w = (row.end - row.start) * unit - 5;
        const x = left + row.start * unit;
        const color = other ? C.green : C.cyan;
        const progress = other
          ? independent
          : Math.min(1, Math.max(0, (10 * readyChain - row.start) / (row.end - row.start)));
        api.rect(ctx, x, y, w, 102, C.panel, color, 10);
        if (progress > 0)
          api.line(ctx, x + 5, y + 94, x + 5 + (w - 10) * progress, y + 94, color, 7);
        txt(
          other ? 'independent work' : ({ affine: '2x + 1', reduce: 'sum' }[row.id] ?? row.id),
          x + w / 2,
          y + 64,
          34,
          color,
          'center',
        );
      });
      txt(
        'Permitted by the dependencies   ·   verify actual overlap in a device trace',
        960,
        941,
        37,
        C.ink,
        'center',
      );
    });
    return;
  }
  const reversed = state.beat > 0;
  const record = p(reversed ? 'event-late-record' : 'event-record');
  const wait = p(reversed ? 'event-empty-wait' : 'event-wait');
  const reveal = p(reversed ? 'event-empty' : 'event-bound') >= 1;
  txt('Host call order', 150, 302, 36, C.muted);
  txt('1', 722, 302, 38, C.ink, 'center');
  txt('2', 1443, 302, 38, C.ink, 'center');
  const call = (id, first, verb, subject, shown, color) =>
    api.focus.target(id, () => {
      const x = first ? 439 : 1160;
      api.rect(ctx, x, 349, 566, 189, C.panel, shown ? color : C.muted, 12);
      txt(shown ? verb : '·', x + 283, 435, 45, shown ? color : C.muted, 'center');
      if (shown) txt(subject, x + 283, 503, 31, C.ink, 'center');
    });
  call('event-record', !reversed, 'record E', 'after copy on producer stream', record > 0, C.cyan);
  call('event-wait', reversed, 'wait on E', 'before affine on reader stream', wait > 0, C.yellow);
  api.arrow(ctx, 1022, 440, 1140, 440, C.muted, 3);
  txt('Event handle E', 145, 686, 37, C.cyan);
  txt(record >= 1 ? 'copy completion   ·   tick 3' : 'empty', 590, 686, 46, C.cyan);
  api.focus.target('event-bound', () => {
    txt('This wait observes', 145, 825, 37, C.yellow);
    txt(
      reveal
        ? reversed
          ? 'empty work'
          : 'copy completion   ·   tick 3'
        : wait > 0
          ? '?'
          : 'awaiting call',
      590,
      825,
      46,
      reveal && reversed ? C.pink : C.yellow,
    );
    txt(
      reversed && !reveal
        ? 'Which producer work did the first wait pick up?'
        : reversed
          ? 'A later record leaves the earlier wait unchanged'
          : 'The consumer can start after the recorded copy finishes',
      960,
      966,
      37,
      C.ink,
      'center',
    );
  });
}
export default {
  id: 'events',
  draw: drawEvents,
  cues: [
    'event-record',
    'event-wait',
    'event-bound',
    'event-empty-wait',
    'event-late-record',
    'event-question',
    'event-empty',
    'event-no-retarget',
    'event-good-chain',
    'event-independent',
  ],
};
