import { clock } from '../arithmetic.mjs';
import { completed, noonOrder } from '../shipment.mjs';

function eveningTime(hours) {
  return clock(hours - 12).replace(/^0/, '') + ' PM';
}

function trackingClock(ctx, api, hours) {
  const { C } = api;
  const cx = 585,
    cy = 492,
    radius = 122;
  const point = (turns, length) => ({
    x: cx + length * Math.sin(2 * Math.PI * turns),
    y: cy - length * Math.cos(2 * Math.PI * turns),
  });
  api.circle(ctx, cx, cy, radius, C.bg, C.blue, 4);
  for (let i = 0; i < 12; i++) {
    const start = point(i / 12, radius - (i % 3 === 0 ? 20 : 11));
    const end = point(i / 12, radius - 4);
    api.line(ctx, start.x, start.y, end.x, end.y, C.muted, 4);
  }
  for (const [turns, length, width, color] of [
    [hours / 12, 66, 13, C.blue],
    [hours % 1, 90, 7, C.ink],
  ]) {
    const end = point(turns, length);
    api.line(ctx, cx, cy, end.x, end.y, color, width);
  }
  api.circle(ctx, cx, cy, 10, C.blue);
}

function orderReceipt(ctx, api, promise) {
  const { C } = api;
  const left = 1030,
    right = 1624,
    top = 278,
    bottom = 796;
  const paper = [
    { x: left, y: top },
    { x: right, y: top },
  ];
  for (let i = 0; i <= 22; i++)
    paper.push({ x: right - (i / 22) * (right - left), y: bottom + (i % 2) * 14 });
  api.path(ctx, paper, { closed: true, fill: C.ink, width: 0 });
  const center = (left + right) / 2;
  api.text(ctx, 'Order receipt', center, 383, 59, C.bg, 'center', 'serif');
  api.text(ctx, 'O-201', center, 444, 31, C.panel, 'center', 'mono');
  for (let x = left + 44; x < right - 50; x += 27) api.line(ctx, x, 484, x + 14, 484, C.muted, 3);
  api.text(ctx, 'Promised by', center, 554, 39, C.panel, 'center');
  api.text(ctx, eveningTime(promise), center, 655, 79, C.bg, 'center');
  const bars = [6, 14, 5, 8, 13, 4, 5, 12, 7, 5, 14, 7, 4, 14, 6, 9, 12, 5];
  let x = center - bars.reduce((total, width) => total + width + 5, -5) / 2;
  for (const width of bars) {
    api.rect(ctx, x, 703, width, 46, C.panel, undefined, 0);
    x += width + 5;
  }
}

export function drawIntro(ctx, scene, state, api) {
  const { C } = api;
  const { pickup, snapshot, promise, revised, doorstep } = noonOrder;
  const tx = (s, x, y, n, col = C.ink, a = 'left') => api.text(ctx, s, x, y, n, col, a);
  if (state.t < 0.35) ctx.globalAlpha = 1;
  api.focus.target('receipt', () => {
    if (completed(api, 'intro-rewind')) {
      tx('O-201    /    May 1    /    UTC', 150, 265, 33, C.muted);
      const x = (h) => 300 + (h - pickup) * 121;
      api.line(ctx, x(pickup), 575, x(promise), 575, C.muted, 4);
      api.line(ctx, x(pickup), 575, x(snapshot), 575, C.blue, 9);
      for (const [h, name, color] of [
        [pickup, 'Pickup', C.blue],
        [snapshot, 'Snapshot', C.cyan],
        [promise, 'Original promise', C.yellow],
      ]) {
        api.circle(ctx, x(h), 575, 13, color);
        tx(name, x(h), 490, 33, color, 'center');
        tx(clock(h), x(h), 673, 43, color, 'center');
      }
      tx('What could tracking show at noon?', 960, 895, 48, C.ink, 'center');
      return;
    }
    const cue = api.focus.cue('intro-revision');
    const shift =
      cue?.end > 0
        ? api.clamp(state.t / cue.end)
        : api.focus.progress('intro-revision', api.clamp(state.t / 3));
    const estimate = promise + (revised - promise) * shift;
    const delivered = completed(api, 'intro-door');
    const late = completed(api, 'intro-late');
    api.rect(ctx, 310, 192, 550, 673, C.panel, C.blue, 53);
    api.rect(ctx, 518, 214, 134, 15, C.bg, undefined, 8);
    tx('Parcel tracking', 585, 293, 48, C.ink, 'center');
    tx('Estimated arrival', 585, 345, 32, C.muted, 'center');
    trackingClock(ctx, api, estimate);
    tx(
      shift >= 1 ? eveningTime(revised) : 'Was ' + eveningTime(promise),
      585,
      694,
      66,
      C.blue,
      'center',
    );
    api.line(ctx, 359, 730, 811, 730, C.muted, 2);
    tx(
      delivered ? 'Delivered   ' + eveningTime(doorstep) : 'Out for delivery',
      585,
      795,
      38,
      delivered ? C.cyan : C.ink,
      'center',
    );
    api.rect(ctx, 516, 832, 138, 7, C.muted, undefined, 4);
    orderReceipt(ctx, api, promise);
    if (late)
      tx(
        eveningTime(doorstep) +
          ' − ' +
          eveningTime(promise) +
          '  =  ' +
          Math.round((doorstep - promise) * 60) +
          ' min late',
        960,
        976,
        52,
        C.pink,
        'center',
      );
  });
}
export default {
  id: 'intro',
  draw: drawIntro,
  cues: ['intro-revision', 'intro-door', 'intro-late', 'intro-rewind'],
};
