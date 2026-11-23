import { userAggregateFixture } from './model.mjs';

export function customerSums(ctx, api, { arrival = 1, copy, removal, joined, clip, measure, normalize, proposedLimit }) {
  const { C, focus } = api;
  const f = userAggregateFixture();
  const unit = 660;
  const x = value => 445 + unit * value;
  const alice = f.aliceRaw - (f.aliceRaw - f.aliceClipped) * clip;
  const write = (value, px, py, size, color = C.ink, align = 'left') =>
    api.text(ctx, value, px, py, size, color, align);

  function ticket(start, y, value, owner, color, height, dx = 0) {
    const left = x(start) + dx + 3, width = unit * value - 6;
    api.rect(ctx, left, y, width, height, color, undefined, 12);
    for (const edge of [left, left + width]) api.circle(ctx, edge, y + height / 2, 9, C.bg);
    const middle = left + width / 2;
    if (width > 280) {
      const stub = left + width - 50;
      for (let dash = 14; dash < height - 12; dash += 22)
        api.line(ctx, stub, y + dash, stub, y + dash + 8, C.bg, 2);
    }
    const center = middle - (width > 280 ? 22 : 0);
    write(owner, center, y + height * 0.39, 30 + (height - 122) * 0.12, C.bg, 'center');
    write(value.toFixed(2), center, y + height * 0.85, Math.min(width * 0.35, height * 0.4), C.bg, 'center');
  }

  focus.target('customer-sums', () => {
    const heading = proposedLimit === undefined ? 'Training sum before noise' : 'How far does the sum fall if Alice leaves?';
    write(heading, x(0), 275, 39);
    focus.target('ticket-limit', () =>
      write(joined ? 'Limit per customer   1' : 'Limit per ticket   1', 1760, 275, 37, C.yellow, 'right'));

    function row(y, height, label, retained) {
      if (label) write(label, 390, y + height / 2 + 14, 37, C.ink, 'right');
      ticket(0, y, f.bao, 'Bao', C.green, height);
      if (retained > 0) {
        if (joined) {
          ticket(f.bao, y, alice, 'Alice', C.cyan, height);
        } else {
          focus.target('alice-tickets', () => api.components.fade(retained, () => {
            const lift = 85 * (1 - retained);
            ticket(f.bao, y - lift, f.aliceTickets[0], 'Alice · ticket 1', C.cyan, height);
            const travel = 1 - arrival;
            ticket(f.bao + f.aliceTickets[0], y - lift + 118 * travel,
              f.aliceTickets[1], 'Alice · ticket 2', C.blue, height, 108 * travel);
          }));
        }
      }
      if (arrival === 1 && (retained === 0 || retained === 1)) {
        const total = f.bao + retained * alice;
        write('= ' + total.toFixed(2), x(total) + 23, y + height / 2 + 17, 46);
      }
    }
    row(405 - 60 * copy, 210 - 88 * copy, copy === 1 ? 'Original' : '', 1);
    if (copy > 0.55) api.components.fade((copy - 0.55) / 0.45, () =>
      row(560, 122, removal === 1 ? 'Without Alice' : 'Copy', 1 - removal));
    function bracket(value, y, label, color) {
      const start = x(f.bao), end = x(f.bao + value);
      api.line(ctx, start, y, end, y, color, 5);
      for (const px of [start, end]) api.line(ctx, px, y - 14, px, y + 14, color, 4);
      write(label + '   ' + value.toFixed(2), (start + end) / 2, y + 62, 39, color, 'center');
    }
    if (measure) bracket(alice, 745, 'Change in sum', C.yellow);
    if (proposedLimit !== undefined)
      bracket(proposedLimit, 806 + 102 * copy, 'Proposed limit per customer', C.muted);
    if (normalize) {
      const total = f.bao + alice, divisor = f.normalizer;
      write('Original   ' + total.toFixed(2) + ' ÷ ' + divisor + ' = ' + (total / divisor).toFixed(3), 320, 931, 34);
      write('Without Alice   ' + f.bao.toFixed(2) + ' ÷ ' + divisor + ' = ' + (f.bao / divisor).toFixed(3), 1020, 931, 34);
      write('Change after division   ' + (alice / divisor).toFixed(2), 960, 1012, 36, C.yellow, 'center');
    }
  });
}
