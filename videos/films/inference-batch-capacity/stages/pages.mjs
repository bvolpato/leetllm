import { reservation } from '../arithmetic.mjs';
import { sceneClock } from '../clock.mjs';
import { hardware } from '../fixtures.mjs';

const requests = [4090, 4096, 4100].map((prompt) => reservation(prompt, 512));
const names = ['A', 'B', 'C'];
const number = (n) => n.toLocaleString('en-US');

export function drawPages(ctx, scene, state, api) {
  const { C, focus } = api;
  const clock = sceneClock(scene, state);
  const label = (s, x, y, size, color = C.ink) => api.text(ctx, s, x, y, size, color);
  const starts = [clock.progress('a'), clock.progress('b'), clock.progress('cross')];
  const reveal = [clock.after('a'), clock.after('b'), clock.after('round')];
  label('One block = 16 positions', 140, 262, 39);
  label('Final blocks of each private reservation', 840, 262, 31, C.muted);
  requests.forEach((request, i) => {
    if (i > 0 && starts[i] === 0 && !(i === 2 && clock.progress('predict') > 0)) return;
    focus.target('page-' + names[i].toLowerCase(), () => {
      const x = 630,
        y = 350 + i * 182,
        cell = 24;
      label('Patch ' + names[i], 140, y + 44, 39, C.ink);
      label(number(request.prompt) + ' prompt  +  512 output', 140, y + 99, 28, C.muted);
      const common = requests[1].logical;
      // All lanes use the same absolute positions. C crosses B's last boundary.
      const firstSlot = common - 32;
      const ready = [firstSlot, requests[0].logical, common][i];
      const shown = Math.floor(starts[i] * (request.logical - ready));
      const through = ready + shown;
      const slots = i === 2 ? 48 : 32;
      for (let s = 0; s < slots; s++) {
        const start = firstSlot + s;
        const block = Math.floor(s / hardware.pageTokens);
        const cx = x + s * cell + block * 14;
        // C's final four positions use an entire new page as soon as the first arrives.
        if (i === 2 && block === 2 && shown === 0) break;
        const assigned = start < through;
        const color = i === 2 && block === 2 ? C.yellow : C.cyan;
        api.rect(ctx, cx, y, cell - 3, 48, assigned ? color : C.panel, C.muted, 0);
      }
      if (reveal[i]) {
        label(
          number(request.slots) + ' slots  ·  ' + (request.slots - request.logical) + ' unused',
          x,
          y + 103,
          30,
          C.ink,
        );
      } else if (i === 2) {
        label('Four positions beyond B', x, y + 103, 32, C.yellow);
      }
    });
  });
  focus.target('page-total', () => {
    if (clock.after('sum')) {
      const slots = requests.reduce((n, r) => n + r.slots, 0);
      const used = requests.reduce((n, r) => n + r.logical, 0);
      label(
        number(slots) +
          ' slots allocated   −   ' +
          number(used) +
          ' positions promised   =   ' +
          (slots - used) +
          ' unused slots',
        140,
        997,
        39,
        C.yellow,
      );
    } else {
      label('Round each request to whole blocks', 140, 997, 33, C.muted);
    }
  });
}
export default { id: 'pages', draw: drawPages };
