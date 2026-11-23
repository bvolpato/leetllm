// Scene `wasm-boundary`: what a Wasm guest gets.
//
// The picture: the guest is a box at the left, with one export, two import doors and its memory.
// At the right is the fuel of the run as a grid: one cell for each unit, and behind the budget the
// steps that the program still needs. The cells burn in order, the trap lands before step 101, and
// the last 32 steps never run. A second page of memory is refused. Then three host costs appear
// outside the grid: fuel does not count them.
import {
  assertEqual,
  boxOf,
  column,
  dynamic,
  grid,
  indicate,
  line,
  linear,
  pictogram,
  place,
  rect,
  row,
  stateGrid,
  text,
} from 'vizmatic/stage';
import { wasmFixture } from '../../../films/sandbox-execution/model.mjs';
import { area, chip, heading, label, mono, note } from '../../kit-narrated.mjs';
import { COLOR, wall } from '../parts.mjs';

/** The cells of one row of the fuel grid: the budget of 100 is five full rows. */
const COLUMNS = 20;
const CELL = 44;
const CELL_GAP = 8;

export default function wasmBoundary(s, c) {
  const guest = wasmFixture();
  assertEqual(
    guest.trapBeforeStep,
    guest.fuelLimit + 1,
    'the trap comes before the first step with no fuel',
  );
  assertEqual(
    guest.remainingSteps,
    guest.workloadSteps - guest.fuelLimit,
    'the steps that never run',
  );
  assertEqual(guest.memoryGrowth, -1, 'a refused growth returns -1');

  // The frame: the guest at the left, and its fuel at the right.
  const [guestSide, fuelSide] = area.columns([2, 3], 'wide');
  const [guestBox, memoryBand] = guestSide.inset('none', 'tight').rows([5, 3], 'wide');
  const paint = (name, color, options = {}) => chip(name, { color, stroke: color, ...options });

  // The guest: one export, and one door for each import that a module can ask for.
  const guestWall = wall(guestBox, 'Wasm guest');
  const exported = paint('export: run', COLOR.candidate, { font: 'mono' });
  const shape = row(
    [
      pictogram('check', { size: 40, accent: COLOR.pass }),
      note('shape checked', { color: COLOR.pass }),
    ],
    {
      gap: 'tight',
      align: 'center',
    },
  );
  const linked = guest.allowedImports.map((name) =>
    paint(`import: ${name}`, COLOR.host, { font: 'mono' }),
  );
  const absent = paint('import: read_secret', COLOR.quiet, { font: 'mono', dash: [8, 6] });
  const linkedNote = note('linked', { color: COLOR.host });
  const absentNote = note('not linked');
  place(
    column(
      [
        row([exported, shape], { gap: 'normal', align: 'center' }),
        grid([linked[0], linkedNote, absent, absentNote], { columns: 2, gap: ['normal', 'tight'] }),
      ],
      {
        gap: 'normal',
      },
    ),
    guestBox.inset('normal', 36),
    'left',
  );

  // The memory of the guest: one page that it has, and one page that it asks for.
  const memoryName = label('linear memory', { size: 36 });
  const page = (name, color, dash) => {
    const box = rect(150, 84, { radius: 10, stroke: color, fill: 'surface', width: 4, dash });
    return { box, name: note(name, { color }) };
  };
  const pages = [page('page 1', COLOR.candidate), page('page 2', COLOR.quiet, [10, 8])];
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
    memoryBand,
    'left',
  );
  pages.forEach((made) => place(made.name, boxOf(made.box)));

  // The fuel: 100 units, and the 32 steps of the program that are behind them.
  const [fuelHead, fuelBody, fuelFoot] = fuelSide.rows([1, 3.4, 2.4], 'normal');
  const cells = stateGrid({
    columns: COLUMNS,
    rows: Math.ceil(guest.workloadSteps / COLUMNS),
    cell: CELL,
    gap: CELL_GAP,
    states: {
      fuel: { color: COLOR.host, fill: 0.3 },
      burned: { color: COLOR.candidate, fill: 0.8 },
      never: { color: COLOR.quiet, fill: 0, dash: true },
    },
    initial: (index) => (index < guest.fuelLimit ? 'fuel' : 'never'),
  });
  place(cells, fuelBody, 'top');
  // The grid has full rows. The cells after the last step of the program do not show.
  cells.cells.slice(guest.workloadSteps).forEach((cell) => cell.hide());
  const burned = s.value(0);
  const fuelName = label('fuel left', { size: 36, color: COLOR.host });
  const needs = note(`Model: ${guest.workloadSteps} steps · 1 fuel unit per step`);
  place(
    row([fuelName, mono(String(guest.fuelLimit), { size: 40 }).hide(), needs], { gap: 'wide' }),
    fuelHead,
    'left',
  );
  const fuelLeft = dynamic(() =>
    text(String(Math.round(guest.fuelLimit - burned.value)), {
      font: 'mono',
      size: 40,
      color: burned.value >= guest.fuelLimit ? COLOR.fail : COLOR.host,
    }).moveTo([boxOf(fuelName).right + 48 + 36, boxOf(fuelName).cy]),
  );
  // The trap: a mark before the first cell that has no fuel.
  const [trapX, trapY] = cells.toWorld(...cells.p(guest.fuelLimit));
  const reach = (CELL + CELL_GAP) / 2;
  const trap = line([trapX - reach, trapY - reach + 2], [trapX - reach, trapY + reach - 2], {
    stroke: COLOR.fail,
    width: 8,
  });
  const trapName = label(`trap before step ${guest.trapBeforeStep}`, {
    size: 36,
    color: COLOR.fail,
  });
  const never = label(`${guest.remainingSteps} steps never run`, { size: 36 });
  const outside = ['compilation', 'host imports', 'host allocations'].map((name) =>
    paint(name, COLOR.host),
  );
  const ownLimit = note('not counted by fuel: each needs its own limit');
  place(
    column([row([trapName, never], { gap: 'wide' }), row(outside, { gap: 'normal' }), ownLimit], {
      gap: 'normal',
    }),
    fuelFoot,
    'top left',
  );

  s.add(
    heading(c.title),
    guestWall,
    exported,
    memoryName,
    pages[0].box,
    pages[0].name,
    cells,
    fuelName,
    fuelLeft,
    needs,
  );

  // Beat 0: the host checks the shape, and links one import.
  c.on('wb-interface', () => s.play(indicate(exported, { color: COLOR.mark, duration: 1.2 })));
  c.show('wb-shape', shape);
  c.show('wb-imports', [linked[0], linkedNote, absent, absentNote], { stagger: true });

  // Beat 1: the fuel burns, the trap lands, and the growth of memory is refused.
  c.on('wb-consume', () =>
    s.play(
      cells.change((index) => index < guest.fuelLimit, 'burned', {
        duration: 2.4,
        lag: 1,
        ease: linear,
      }),
      burned.to(guest.fuelLimit, { duration: 2.4, ease: linear }),
    ),
  );
  c.show('wb-trap', [trap, trapName, never], { after: true });
  c.show('wb-grow', [pages[1].box, pages[1].name]);
  c.show('wb-fail', grown, { after: true });

  // Beat 2: what the fuel does not count.
  c.on('wb-bounds', () => s.play(indicate(fuelName, { color: COLOR.mark, duration: 1.2 })));
  c.show('wb-outside', outside, { stagger: true });
  c.show('wb-separate', ownLimit);
}
