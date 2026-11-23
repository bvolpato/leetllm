import assert from 'node:assert/strict';
import { addI32, memoryAccess } from '../../../films/sandbox-execution/arithmetic.mjs';
import { C, rect, line, label, mono, cap, panel, frame, tag, result, cue, spokenProgress } from './art.mjs';

const limit = 65536,
  initialPages = 1,
  width = 4,
  work = 132,
  fuel = 100;
const firstAddress = limit - width;
const displacement = 2;
const formatAddress = (address) => address.toLocaleString('en-US');
function bytesAt(address) {
  return Array.from({ length: width }, (_, i) => ({ address: address + i, valid: address + i < limit }));
}
function grow(current, delta, max) {
  return current + delta > max ? { result: -1, pages: current } : { result: current, pages: current + delta };
}
const allowed = new Set(['report.xml']);
const handles = new Map([
  ['report', 'report.xml'],
  ['notes alias', 'notes.txt'],
]);
function canOpen(alias) {
  return allowed.has(handles.get(alias));
}
export function guestState(clock) {
  const b = clock.beat.beatIndex;
  if (b === 1) {
    const done = cue(clock, 1, 'budget runs out'),
      p = cue(clock, 1, 'It needs', 2.1);
    const used = done ? fuel : Math.floor(99 * p);
    return { used, left: fuel - used, stepsLeft: work - used, trap: !!cue(clock, 1, 'next step traps') };
  }
  const shift = spokenProgress(clock, 3, 'Slide the start two bytes to the right');
  const address = shift === 0 ? firstAddress : shift === 1 ? firstAddress + displacement : null;
  return {
    address,
    bytes: address === null ? [] : bytesAt(address),
    shift,
    fits: shift === 0 && spokenProgress(clock, 3, 'thirty-two fits') === 1,
    trapped: spokenProgress(clock, 4, 'The load traps') === 1,
    growth: spokenProgress(clock, 4, 'Growth returns minus one to the guest') === 1
      ? grow(initialPages, 1, 1)
      : null,
  };
}
export function guest(c, clock) {
  const b = clock.beat.beatIndex;
  if (b === 0) {
    frame(c, 'WebAssembly   /   import-free embedding', 'What can the module receive?');
    const x = 75,
      y = 299;
    panel(c, x, y, 1769, 434, C.navy, C.navy);
    cap(c, 'HOST CHECKS THE EXPORT', x + 42, y + 68, { color: '#b1d5c6' });
    mono(c, 'run(i32) → i32', x + 42, y + 187, 81, { color: C.white });
    mono(c, 'imports  [ ]', x + 44, y + 299, 44, { color: '#a8cebe' });
    line(c, 1038, y + 52, 1038, y + 376, '#71858a');
    cap(c, 'ADD ONE', 1120, y + 68, { color: '#b1d5c6' });
    const entered = cue(clock, 0, 'forty-one'),
      done = cue(clock, 0, 'returns forty-two');
    const maxArg = cue(clock, 0, 'largest signed integer'),
      wrapped = cue(clock, 0, 'wraps to the smallest');
    const arg = maxArg ? 2147483647 : 41;
    if (entered) mono(c, arg + ' + 1', 1120, y + 184, 64, { color: C.white, max: 670 });
    if (done && (!maxArg || wrapped))
      mono(c, '= ' + addI32(arg), 1120, y + 313, 86, { color: '#a4eac1', max: 662 });
    if (maxArg) mono(c, 'Previous run: 41 → 42', x + 44, y + 376, 35, { color: '#a8cebe' });
    result(c, 'Check the module and its function signature.', 'host policy   /   no imports');
    return;
  }
  if (b === 1) {
    const st = guestState(clock);
    frame(c, 'Metered guest   /   one unit per toy step', 'How much work fits in the fuel budget?');
    cap(c, 'REQUESTED TRACE   /   132 STEPS', 77, 305);
    for (let i = 0; i < work; i++) {
      const x = 77 + (i % 33) * 52,
        y = 352 + Math.floor(i / 33) * 78;
      panel(
        c,
        x,
        y,
        45,
        60,
        i < st.used ? C.teal : i < fuel ? C.paper : '#e4dfd5',
        i === fuel ? C.red : C.line,
      );
    }
    const x = 77 + (fuel % 33) * 52,
      y = 352 + Math.floor(fuel / 33) * 78;
    if (st.trap) {
      line(c, x + 8, y + 13, x + 37, y + 48, C.red, 5);
      line(c, x + 37, y + 13, x + 8, y + 48, C.red, 5);
    }
    mono(c, st.used + ' executed', 77, 733, 49);
    mono(c, st.left + ' fuel left', 680, 733, 49);
    result(
      c,
      st.trap ? 'Out of fuel before step 101.' : 'Fuel is set before instantiation.',
      st.stepsLeft + ' steps left in the trace',
    );
    return;
  }
  if (b < 5) {
    const st = guestState(clock);
    if (b === 4 && cue(clock, 4, 'Separately')) {
      frame(c, 'Linear memory   /   independent probes', 'What happens when this guest asks to grow?');
      panel(c, 75, 280, 826, 490);
      cap(c, 'OBSERVED LOAD   /   4 BYTES', 113, 348);
      label(c, 'Last load trapped', 113, 451, 59, { face: 'Serif', color: C.red });
      st.bytes.forEach(({ address, valid }, i) => {
        const x = 111 + i * 188;
        panel(c, x, 506, 181, 99, valid ? C.pale : C.blush);
        mono(c, address, x + 91, 569, 36, { align: 'center', color: valid ? C.teal : C.red });
      });
      mono(c, 'Last valid byte: ' + formatAddress(limit - 1), 113, 690, 37);
      panel(c, 954, 280, 889, 490);
      cap(c, 'GROWTH REQUEST   /   LIMIT 1 PAGE', 994, 348);
      [
        [994, 'Page 1', 'Allocated', C.pale],
        [1402, 'Page 2', st.growth ? 'Refused' : 'Requested', st.growth ? C.blush : C.wall],
      ].forEach(([x, n, status, bg]) => {
        panel(c, x, 420, 388, 225, bg);
        label(c, n, x + 29, 508, 53, { face: 'Serif' });
        mono(c, status, x + 29, 590, 36);
      });
      if (st.growth) mono(c, 'memory.grow  →  ' + st.growth.result, 994, 714, 38, { color: C.red });
      result(
        c,
        st.growth ? 'Growth returns a value to the guest.' : 'Request one additional page.',
        'Guest linear memory   /   ' + (st.growth?.pages ?? initialPages) + ' page',
      );
      return;
    }
    frame(c, 'Linear memory   /   one allocated page', 'Does the four-byte load fit?');
    const visibleStart = firstAddress - displacement;
    const visibleEnd = limit + displacement;
    const x0 = 77;
    const dx = 194;
    const addressX = (address) => x0 + (address - visibleStart) * dx;
    const edgeX = addressX(limit) - 3;
    cap(c, 'END OF PAGE 1', x0, 306);
    cap(c, 'OUTSIDE LINEAR MEMORY', addressX(limit), 306);
    for (let address = visibleStart; address <= visibleEnd; address++) {
      const x = addressX(address);
      const inPage = address < limit;
      panel(c, x, 392, dx - 6, 151, inPage ? C.paper : '#e1dfd7');
      mono(c, formatAddress(address), x + (dx - 6) / 2, 483, 39, { align: 'center' });
    }
    cap(c, 'PAGE EDGE', edgeX - 16, 370, { align: 'right' });
    if (b >= 3) {
      const firstX = addressX(firstAddress);
      const requestX = firstX + st.shift * displacement * dx;
      const requestWidth = width * dx - 6;
      if (st.shift > 0) {
        line(c, firstX, 645, firstX + requestWidth, 645, C.muted, 3);
        line(c, firstX, 634, firstX, 645, C.muted, 3);
        line(c, firstX + requestWidth, 634, firstX + requestWidth, 645, C.muted, 3);
        cap(c, 'FIRST REQUEST', firstX, 686);
      }
      for (let i = 0; i < width; i++) {
        const color = st.trapped && !st.bytes[i].valid ? C.red : st.fits ? C.teal : C.blue;
        rect(c, requestX + i * dx, 563, dx - 6, 58, color);
      }
      const request = st.address === null ? width + '-byte request' : width + ' bytes from ' + formatAddress(st.address);
      mono(c, request, requestX + requestWidth / 2, 755, 43, { align: 'center' });
    } else label(c, 'A 65,536-byte page begins at address zero.', x0, 682, 48, { face: 'Serif' });
    line(c, edgeX, 345, edgeX, 630, C.ink, 5);
    if (st.trapped)
      result(
        c,
        'Load traps. ' + st.bytes.filter((byte) => !byte.valid).length + ' bytes lie beyond the edge.',
        'No value returned',
        C.red,
      );
    else if (st.fits) result(c, 'All four bytes fit inside the page.', 'Highest valid byte: ' + formatAddress(limit - 1));
    else result(c, 'Highest valid byte: ' + formatAddress(limit - 1) + '.', '1 page   /   ' + formatAddress(limit) + ' bytes');
    return;
  }
  frame(c, 'Host file reader   /   scoped import', 'Which resource does the host open?');
  const resolved = cue(clock, 5, 'actual resource'),
    checked = cue(clock, 5, 'notes file stays');
  cap(c, 'REQUEST', 115, 326);
  cap(c, 'RESOLVED RESOURCE', 740, 326);
  cap(c, 'HOST GRANT', 1410, 326);
  [...handles].forEach(([alias, target], i) => {
    const y = 369 + i * 178;
    panel(c, 75, y, 1770, 145);
    mono(c, alias, 114, y + 91, 46);
    if (resolved) {
      label(c, '→', 610, y + 92, 52);
      mono(c, target, 741, y + 91, 46);
    }
    if (checked) {
      const ok = canOpen(alias);
      tag(c, ok ? 'Allowed' : 'Denied', 1410, y + 45, 342, ok ? C.teal : C.red, ok ? C.pale : C.blush);
    }
  });
  result(c, 'Enforce the grant on the resource at open time.', 'authorized handle   /   report.xml');
}
export function checkGuest() {
  assert.equal(addI32(41), 42);
  assert.equal(addI32(2147483647), -2147483648);
  assert.equal(work - fuel, 32);
  assert.deepEqual(bytesAt(firstAddress).map((byte) => byte.address), [65532, 65533, 65534, 65535]);
  assert(bytesAt(firstAddress).every((byte) => byte.valid));
  const movedAddress = firstAddress + displacement;
  assert.deepEqual(bytesAt(movedAddress).filter((byte) => !byte.valid).map((byte) => byte.address), [65536, 65537]);
  assert.equal(memoryAccess(firstAddress), 'read permitted');
  assert.equal(memoryAccess(movedAddress), 'MEMORY_OUT_OF_BOUNDS');
  assert.deepEqual(grow(1, 1, 1), { result: -1, pages: 1 });
  assert.deepEqual(grow(1, 1, 2), { result: 1, pages: 2 });
  assert(canOpen('report'));
  assert(!canOpen('notes alias'));
}
