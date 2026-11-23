import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { correlate } from '../../../films/convolution/arithmetic.mjs';
import { IMAGE, KERNEL, PADDED_ORDER } from '../../../films/convolution/fixtures.mjs';
import {
  arrow, box, clay, cue, fmt, gold, grid, heading, index, matrix, mono, mounted, muted,
  outline, pale, rule, rust, said, sea, signed, steel, teal, white, windowOn,
} from './bench.mjs';

const scans = JSON.parse(readFileSync(new URL('./scans.json', import.meta.url), 'utf8'));
const paddedImage = matrix(IMAGE.length + 2, IMAGE[0].length + 2,
  (r, c) => IMAGE[r - 1]?.[c - 1] ?? 0);
const top = PADDED_ORDER[0];
const corner = scans.same1.flat().length - 1;
const paddedOrder = [top, corner, ...PADDED_ORDER.filter(i => i !== top && i !== corner)];

function scanState(clock) {
  const beat = clock.beat.beatIndex;
  const stride = beat === 0 ? 2 : 1;
  const pad = cue(clock, 1, 'ring of zeros') > 0;
  const scan = pad ? scans.same1 : stride === 2 ? scans.valid2 : scans.valid1;
  const width = scan[0].length;
  const order = pad ? paddedOrder : scan.flat().map((_, i) => i);

  let count = 1;
  let light = 1;
  let showSum = true;
  if (stride === 2) {
    count += index(cue(clock, 0, 'Move two cells', 3), order.length);
  } else if (pad && beat <= 2) {
    light = cue(clock, 1, 'two bright pixels', 0.9);
    showSum = said(clock, 2, 'plus two');
  } else if (pad) {
    count = 2 + index(cue(clock, 5, 'Fill in the other responses', 5), order.length - 1);
    light = cue(clock, 4, 'two pixels on the left', 0.9);
    showSum = said(clock, 4, 'minus two');
  }

  const visited = order.slice(0, count);
  const stop = visited.at(-1);
  const trace = scan[Math.floor(stop / width)][stop % width];
  const contributions = trace.terms.flat().filter(term => term.product !== 0);
  const lit = contributions.slice(0, Math.ceil(light * contributions.length));
  const printed = showSum ? visited : visited.slice(0, -1);
  return { stride, pad, scan, trace, lit, printed, showSum };
}

export function starts(g, clock) {
  const { stride, pad, scan, trace, lit, printed, showSum } = scanState(clock);
  const { terms, outputRow, outputColumn, sum } = trace;
  const pitch = 41, border = Number(pad);
  const x = 152 - border * pitch, y = 233 - border * pitch;
  heading(g, pad ? 'Camera with zero border' : 'Unpadded camera', 253, 150);
  mounted(g, pad ? paddedImage : IMAGE, x, y, pitch, {
    font: 18,
    mark: (r, c) => {
      const tap = lit.find(term => term.inputRow + border === r && term.inputColumn + border === c);
      return tap && (tap.product > 0 ? teal : rust);
    },
  });
  if (pad) outline(g, 152, 233, IMAGE[0].length * pitch, IMAGE.length * pitch, steel, 3);
  const origin = terms[0][0];
  windowOn(g, x, y, pitch, origin.inputRow + border, origin.inputColumn + border,
    terms.length, terms[0].length, gold);

  heading(g, 'Pixel × weight', 578, 150);
  terms.forEach((row, r) => row.forEach((term, c) => {
    const left = 442 + c * 91, top = 219 + r * 65;
    const active = lit.includes(term);
    const positive = term.product > 0;
    const fill = active ? (positive ? sea : clay) : term.padded ? pale : white;
    box(g, left, top, 89, 63, fill);
    outline(g, left, top, 89, 63, steel, 1);
    const pixel = term.padded ? 'pad' : fmt(term.inputValue);
    mono(g, pixel + ' × ' + fmt(term.weight), left + 44.5, top + 18, 16, muted);
    const value = active || term.product === 0 ? signed(term.product) : '·';
    mono(g, value, left + 44.5, top + 46, active ? 24 : 19, active ? (positive ? teal : rust) : muted);
  }));
  if (pad) mono(g, 'pad = 0', 578, 447, 19, muted);
  arrow(g, 731, 322, 780, 322);

  const cell = 54, width = scan[0].length;
  const mapX = 947 - cell * width / 2, mapY = 329 - cell * scan.length / 2;
  heading(g, 'Response at each start', 947, 150);
  grid(g, scan.map(row => row.map(stop => stop.sum)), mapX, mapY, cell, {
    show: (r, c) => printed.includes(r * width + c), print: signed, font: 24,
  });
  windowOn(g, mapX, mapY, cell, outputRow, outputColumn, 1, 1);
  mono(g, 'Output [' + outputRow + ', ' + outputColumn + '] = ' + (showSum ? signed(sum) : '?'), 947, 494, 22);

  const beat = clock.beat.beatIndex;
  if (beat === 6) {
    mono(g, 'Starts = floor((padded width − kernel width) / stride) + 1', 600, 526, 22);
  } else if (pad && cue(clock, 5, 'Five across') === 0) {
    rule(g, 'Stride   1 pixel       •       Padded width   ' + paddedImage[0].length + '       •       Window width   ' + KERNEL[0].length, { y: 526 });
  } else {
    rule(g, 'Stride   ' + stride + (stride === 1 ? ' pixel' : ' pixels') + '       •       ' + width + ' starts on each axis', { y: 526 });
  }
}

export function checkScans() {
  for (const [scan, stride, pad] of [[scans.valid1, 1, 0], [scans.valid2, 2, 0], [scans.same1, 1, 1]]) {
    assert.deepEqual(scan.map(row => row.map(trace => trace.sum)), correlate(IMAGE, KERNEL, stride, pad));
    scan.forEach((row, r) => row.forEach(({ terms, outputRow, outputColumn, sum }, c) => {
      assert.deepEqual([outputRow, outputColumn], [r, c]);
      assert.deepEqual(terms.map(line => line.map(term => term.weight)), KERNEL);
      terms.forEach((line, dy) => line.forEach((term, dx) => {
        const rr = r * stride + dy - pad, cc = c * stride + dx - pad;
        const pixel = IMAGE[rr]?.[cc];
        assert.deepEqual([term.inputRow, term.inputColumn, term.padded, term.inputValue],
          [rr, cc, pixel === undefined, pixel ?? 0]);
        assert.ok(term.product === term.inputValue * term.weight);
      }));
      assert.equal(terms.flat().reduce((total, term) => total + term.product, 0), sum);
    }));
  }
  // The prediction clocks expose the operands before the narrator gives the total.
  for (const [beat, productsCue, answerCue, position, taps, sum] of [
    [2, '', 'plus two', [0, 2], [[0, 3, 1], [1, 3, 1]], 2],
    [4, 'two pixels on the left', 'minus two', [4, 4], [[3, 3, -1], [4, 3, -1]], -2],
  ]) {
    for (const [answerStarted, elapsed] of [[false, 8], [true, 9.9], [true, 10]]) {
      const answered = elapsed >= 10;
      const state = scanState({
        beat: { beatIndex: beat },
        elapsed,
        speechDuration: 10,
        reveal: phrase => Number(phrase === productsCue || (answerStarted && phrase === answerCue)),
      });
      assert.deepEqual([state.trace.outputRow, state.trace.outputColumn], position);
      assert.deepEqual(state.lit.map(t => [t.inputRow, t.inputColumn, t.product]), taps);
      assert.equal(state.trace.sum, sum);
      assert.equal(state.showSum, answered);
      const printed = beat === 2 ? [top] : [top, corner];
      assert.deepEqual(state.printed, answered ? printed : printed.slice(0, -1));
    }
  }
  assert.equal(new Set(paddedOrder).size, scans.same1.flat().length);
}
