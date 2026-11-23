// Scene `wasm-failure-matrix`: each failure of the guest has its own result.
//
// The picture: a matrix stays at the left. Its rows are the probes, and its columns are the four
// results. Each probe puts its mark in one column when the voice gives its result. At the right is
// the part of the guest that the probe is about: the end of the one memory page with a window of
// four bytes that slides over it, then a host reader checking a file grant, then three runs
// of the fuel probe that stop at one place.
import {
  assertEqual,
  boxOf,
  column,
  dot,
  dynamic,
  indicate,
  line,
  pictogram,
  place,
  recolor,
  rect,
  row,
  seq,
  text,
} from 'vizmatic/stage';
import { memoryAccess } from '../../../films/sandbox-execution/arithmetic.mjs';
import { runtimeAccess, wasmFixture } from '../../../films/sandbox-execution/model.mjs';
import { area, chip, heading, label, mono, note } from '../../kit-narrated.mjs';
import { COLOR, gauge } from '../parts.mjs';

const RESULTS = ['trap', 'returns -1', 'start fails', 'rejected'];
/** The probes: the name of the row, the column of its result, and the cue at whose end the mark lands. */
const PROBES = [
  { name: 'infinite loop', result: 0, cue: 'fm-loop', lands: 'fm-trap' },
  { name: 'loop in the start function', result: 0, cue: 'fm-start', lands: 'fm-start-trap' },
  { name: 'memory.grow with no room', result: 1, cue: 'fm-page', lands: 'fm-grow' },
  { name: 'four-byte load', result: 0, cue: 'fm-load', lands: 'fm-beyond' },
  { name: 'first memory over the limit', result: 2, cue: 'fm-initial', lands: 'fm-initial-fails' },
  { name: 'a declared import', result: 3, cue: 'fm-import', lands: 'fm-import' },
  { name: 'no run export', result: 3, cue: 'fm-export', lands: 'fm-export' },
  { name: 'wrong function type', result: 3, cue: 'fm-type', lands: 'fm-type' },
];
/** The page of the guest: its size, and the cells of its end that the picture shows. */
const PAGE = 65536;
const INSIDE = 8;
const BEYOND = 4;
const LOAD = 4;

export default function wasmFailureMatrix(s, c) {
  const guest = wasmFixture();
  const lastGood = PAGE - LOAD; // 65532
  assertEqual(memoryAccess(lastGood), 'read permitted', 'the last four bytes of the page');
  assertEqual(memoryAccess(lastGood + 2), 'MEMORY_OUT_OF_BOUNDS', 'two bytes past the end');
  assertEqual(guest.memoryGrowth, -1, 'a refused growth returns -1');

  // The frame: the matrix at the left, and the part of the guest at the right.
  const [matrixBox, detail] = area.columns([11, 8], 'wide');
  const paint = (name, color, options = {}) => chip(name, { color, stroke: color, ...options });

  // The matrix: a header, and one row for each probe. A column is one kind of result.
  const bands = matrixBox.rows([1, ...PROBES.map(() => 1.15)], 'none');
  const cut = (band) => band.columns([4.4, 1.4, 1.5, 1.5, 1.4], 'none');
  const heads = cut(bands[0])
    .slice(1)
    .map((cell, i) => place(note(RESULTS[i]), cell));
  const rule = (band) =>
    line([band.left, band.top], [band.right, band.top], { stroke: 'grid', width: 2 });
  const rows = PROBES.map((probe, i) => {
    const cells = cut(bands[i + 1]);
    const color = probe.result === 0 || probe.result === 2 ? COLOR.fail : COLOR.host;
    return {
      ...probe,
      name: place(label(probe.name, { size: 30, color: COLOR.quiet }), cells[0], 'left'),
      mark: dot(15, color).moveTo(cells[probe.result + 1].point()),
      cells,
      rule: rule(bands[i + 1]),
    };
  });
  // The growth of memory does not trap: its place in the first column stays empty.
  const noTrap = pictogram('cross', { size: 34, accent: COLOR.quiet }).moveTo(
    rows[2].cells[1].point(),
  );

  s.add(heading(c.title), ...heads, ...rows.flatMap((made) => [made.rule, made.name]));

  const light = (made) => recolor(made.name, 'ink', { duration: 0.3 });
  for (const made of rows) {
    c.on(made.cue, () => s.play(light(made)));
    c.show(made.lands, made.mark, { after: true });
  }
  c.show('fm-notrap', noTrap);

  // Beat 0, at the right: the memory of the guest. One page, and the end of it.
  const [fuelBand, pagesBand, endBand, answerBand] = detail.rows([1.3, 3, 4, 1.5], 'normal');
  // The fuel of the run: a loop burns all of it, and the trap is at the limit.
  const [fuelNameBand, fuelTrack] = fuelBand.columns([1, 4], 'normal');
  const fuelName = place(label('fuel', { size: 36 }), fuelNameBand, 'left');
  const fuel = gauge(s, fuelTrack.inset('none', (fuelTrack.height - 44) / 2), {
    cap: 0.7,
    color: COLOR.candidate,
  });
  const memoryName = label('linear memory', { size: 36 });
  const pageOf = (name, color, dash) => {
    const box = rect(240, 84, { radius: 10, stroke: color, fill: 'surface', width: 4, dash });
    return { box, name: note(name, { color }) };
  };
  const pages = [
    pageOf('1 page, 64 KiB', COLOR.candidate),
    pageOf('no room', COLOR.quiet, [10, 8]),
  ];
  const grown = mono(`memory.grow(1) = ${guest.memoryGrowth}`, { size: 30, color: COLOR.host });
  place(
    column(
      [
        memoryName,
        row(
          pages.map((made) => made.box),
          { gap: 'normal' },
        ),
        grown,
      ],
      { gap: 'normal' },
    ),
    pagesBand,
    'left',
  );
  pages.forEach((made) => place(made.name, boxOf(made.box)));
  // The last bytes of the page, the bytes after it, and a load of four bytes that slides over them.
  const [overBand, cellBand, underBand] = endBand.rows([2, 3, 2], 'tight');
  const slots = cellBand.columns(INSIDE + BEYOND, 'none');
  const bytes = slots.map((slot, i) =>
    rect(slot.width - 8, slot.height, {
      radius: 6,
      stroke: i < INSIDE ? COLOR.candidate : COLOR.quiet,
      fill: 'surface',
      width: 3,
      dash: i < INSIDE ? undefined : [8, 6],
    }).at(slot.cx, slot.cy),
  );
  const endName = note(`Last byte  ${PAGE - 1}`).moveTo([
    slots[INSIDE - 1].right - 100,
    overBand.cy,
  ]);
  const slide = s.value(0);
  const first = () => INSIDE - LOAD + Math.round(slide.value);
  const edge = (index) => slots[0].left + index * slots[0].width;
  const load = dynamic(() => {
    const [from, to] = [edge(first()), edge(first() + LOAD)];
    return rect(to - from, cellBand.height + 20, {
      radius: 8,
      stroke: COLOR.mark,
      fill: null,
      width: 5,
    }).at((from + to) / 2, cellBand.cy);
  });
  const address = dynamic(() =>
    text(
      `4 bytes   ${lastGood + Math.round(slide.value)} … ${lastGood + Math.round(slide.value) + LOAD - 1}`,
      {
        font: 'mono',
        size: 28,
        color: COLOR.mark,
      },
    ).moveTo([cellBand.cx, underBand.cy]),
  );
  const permitted = place(
    mono(memoryAccess(lastGood), { size: 34, color: COLOR.pass }),
    answerBand,
    'left',
  );
  const outOfBounds = place(
    mono(memoryAccess(lastGood + 2), { size: 34, color: COLOR.fail }),
    answerBand,
    'left',
  );
  // The fuel, the page and the end of the page are the guest when the scene opens.
  s.add(
    fuelName,
    fuel.track,
    fuel.fill,
    fuel.limit,
    memoryName,
    pages[0].box,
    pages[0].name,
    ...bytes,
    endName,
  );
  c.on('fm-loop', () => s.play(fuel.level.to(0.7, { duration: 1.6 })));
  c.on('fm-start', () =>
    s.play(seq(fuel.level.to(0, { duration: 0.4 }), fuel.level.to(0.7, { duration: 1.4 }))),
  );
  c.show('fm-grow', [pages[1].box, pages[1].name]);
  c.show('fm-grow', grown, { after: true });
  c.show('fm-load', [load, address]);
  c.show('fm-inside', permitted, { after: true });
  c.hide('fm-slide', permitted);
  c.on('fm-slide', () => s.play(slide.to(2, { duration: 0.85 })));
  const predict = place(label('Does this read fit?', { color: COLOR.mark }), answerBand, 'left');
  c.show('fm-predict', predict);
  c.swap('fm-beyond', predict, outOfBounds, { after: true });

  // The host compares the resolved file with the file it granted.
  const memory = [
    fuelName,
    fuel.track,
    fuel.fill,
    fuel.limit,
    memoryName,
    ...pages.flatMap((made) => [made.box, made.name]),
    grown,
    ...bytes,
    endName,
    load,
    address,
    outOfBounds,
  ];
  const grantedFile = '/work/report.xml';
  const resolvedFile = '/work/notes.txt';
  assertEqual(runtimeAccess('wasm', grantedFile).allowed, true, 'the report is in the grant');
  assertEqual(
    runtimeAccess('wasm', resolvedFile).allowed,
    false,
    'the notes are outside the grant',
  );
  const reader = label('Host file reader', { size: 50, color: COLOR.host });
  const grant = note('Granted file');
  const report = mono(grantedFile, { size: 44, color: COLOR.evidence });
  const requested = note('Resolved request');
  const notes = mono(resolvedFile, { size: 44, color: COLOR.candidate });
  const denied = label('Read denied   /   0 bytes', { size: 43, color: COLOR.fail });
  const hostImport = [reader, grant, report, requested, notes, denied];
  place(column(hostImport, { gap: 'wide', align: 'left' }), detail, 'left');
  c.swap('fm-reader', memory, reader);
  c.show('fm-grant', [grant, report]);
  c.show('fm-resolved', [requested, notes]);
  c.show('fm-denied', denied, { after: true });

  const [runsBand, sourcesBand, endsBand] = detail.rows([4, 3, 2], 'normal');
  const runBands = runsBand.rows(3, 'normal');
  const runs = runBands.map((band, i) => {
    const [nameBand, trackBand] = band.columns([1, 4], 'normal');
    return {
      name: place(label(`run ${i + 1}`, { size: 34 }), nameBand, 'left'),
      gauge: gauge(s, trackBand.inset('none', (trackBand.height - 44) / 2), {
        cap: 0.7,
        color: COLOR.candidate,
      }),
    };
  });
  const sources = ['imports', 'memory growth', 'NaN bits', 'relaxed SIMD'].map((name) =>
    paint(name, COLOR.mark),
  );
  const differ = note('what can still differ');
  place(
    column(
      [differ, row(sources.slice(0, 2), { gap: 'tight' }), row(sources.slice(2), { gap: 'tight' })],
      { gap: 'tight' },
    ),
    sourcesBand,
    'left',
  );
  const receipt = place(label('Boundary probe results', { size: 38 }), endsBand, 'left');
  c.swap(
    4,
    hostImport,
    runs.flatMap((made) => [made.name, made.gauge.track, made.gauge.fill, made.gauge.limit]),
  );
  c.on('fm-repeat', () =>
    s.play(
      seq(...runs.map((made) => made.gauge.level.to(0.7, { duration: 0.7 }))),
      indicate(rows[0].mark, { color: COLOR.mark, duration: 2 }),
    ),
  );
  c.show('fm-sources', [differ, ...sources], { stagger: true });
  c.show('fm-real', receipt);
  c.on('fm-grow-result', () => s.play(indicate(rows[2].mark, { color: COLOR.mark, duration: 1 })));
  c.on('fm-load-result', () => s.play(indicate(rows[3].mark, { color: COLOR.mark, duration: 1 })));
}
