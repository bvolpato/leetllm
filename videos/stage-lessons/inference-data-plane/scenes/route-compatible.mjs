// Scene `route-compatible`: choose a compatible destination.
//
// The picture: the pool of the prefill worker at the left, with the receipt of its 48 blocks, and
// three candidate pools at the right: workers A, B and C, with their free slots. The fields of
// each worker go green or red against the receipt, and B goes dim. Then 36 blocks light in C,
// and the two valid workers race on one clock: 48 blocks go to A, and 12 go to C.
import {
  assertEqual,
  boxOf,
  clamp,
  column,
  dynamic,
  grid,
  group,
  indicate,
  line,
  linear,
  place,
  rect,
  row,
  to,
} from 'vizmatic/stage';
import { localityRouteSnapshot } from '../../../films/inference-data-plane/model.mjs';
import { area, chip, chipRow, heading, label, mono, note } from '../../kit-narrated.mjs';
import { COLOR, FIXTURE, block, pool, slot } from '../parts.mjs';

const ROUTE = localityRouteSnapshot(1);
const FIELDS = (worker) => [
  `${worker.model} r${worker.revision}`,
  worker.layout,
  worker.dtype,
  worker.blocks,
];

export default function routeCompatible(s, c) {
  const { blocks } = FIXTURE;
  const [sourceSide, linkSide, poolSide, metaSide] = area.columns([36, 16, 49, 60], 'normal');

  // Required domains filter eligibility. Preferred domains only bias selection.
  const requiredDomain = note('required domain\nmismatch: ineligible', { color: COLOR.control });
  const preferredDomain = note('preferred domain\ncost bias, may cross domain', { color: 'ink' });
  place(column([requiredDomain, preferredDomain], { gap: 'tight' }), sourceSide, 'top left');

  // The prefill worker: its 48 blocks, and the receipt that says how to read them.
  const source = pool(blocks, { pitch: 44 });
  const sourceName = label('prefill worker');
  const receiptName = note(`receipt of ${FIXTURE.request}`);
  // Each field of the receipt is a chip of its own, because each one arrives on its word.
  const receipt = FIELDS(ROUTE.rows[0].worker).map((field) => chip(field));
  place(
    column([sourceName, source.panel, receiptName, grid(receipt, { columns: 2, gap: 'tight' })], {
      gap: 'tight',
    }),
    sourceSide,
    'left',
  );
  const sourceBlocks = dynamic(() =>
    Array.from({ length: blocks }, (_, index) =>
      block(source.p(index), COLOR.state, { size: source.cell }),
    ),
  );

  // The cells show how much of this request each worker already has. Free capacity is separate.
  const bands = poolSide.rows(3, 'normal');
  const metaBands = metaSide.rows(3, 'normal');
  const workers = ROUTE.rows.map((entry, index) => {
    const cells = pool(blocks, { columns: 12, pitch: 40 });
    place(cells.panel, bands[index], 'left');
    const name = label(`worker ${entry.id}`);
    const free = mono(`${entry.worker.freeBlocks} free`, { size: 34, color: 'dim' });
    const where = note(`${entry.locality}, rate ${entry.rate}`);
    const fields = chipRow(FIELDS(entry.worker));
    const rejection = entry.eligible ? null : note('incompatible layout', { color: COLOR.fail });
    place(
      column(
        [row([name, free, where], { gap: 'normal' }), fields, ...(rejection ? [rejection] : [])],
        { gap: 'tight' },
      ),
      metaBands[index],
      'left',
    );
    return { ...entry, cells, name, free, where, fields, rejection };
  });
  const [A, B, C] = workers;

  // The link: one trunk between the prefill worker and the candidates, with a branch to each.
  const trunkX = linkSide.cx;
  const branchY = (worker) => boxOf(worker.cells.panel).cy;
  const sourceBox = boxOf(source.panel);
  const link = group(
    line([sourceBox.right, sourceBox.cy], [trunkX, sourceBox.cy], { stroke: 'grid', width: 3 }),
    line([trunkX, branchY(A)], [trunkX, branchY(C)], { stroke: 'grid', width: 3 }),
    ...workers.map((worker) =>
      line([trunkX, branchY(worker)], [boxOf(worker.cells.panel).left, branchY(worker)], {
        stroke: 'grid',
        width: 3,
      }),
    ),
  );

  const overlap = s.value(0);
  const out = s.value(0);

  const pools = dynamic(() => {
    const nodes = [];
    for (const worker of workers) {
      const lit = worker === B ? 1 - 0.7 * out.value : 1;
      const cached = worker.cached * overlap.value;
      for (let index = 0; index < blocks; index++) {
        const at = worker.cells.p(index);
        const here = clamp(cached - index, 0, 1);
        // A block that the worker has already: valid, so it need not move.
        if (here > 0)
          nodes.push(
            block(at, worker.eligible ? COLOR.valid : 'dim', {
              size: worker.cells.cell,
              opacity: here * lit * (worker === B ? 0.5 : 1),
            }),
          );
        else nodes.push(slot(at, 'gridStrong', { size: worker.cells.cell, opacity: lit }));
      }
    }
    return nodes;
  });
  const title = heading(c.title);
  s.add(
    title,
    sourceName,
    source.panel,
    sourceBlocks,
    receiptName,
    link,
    workers.map((worker) => worker.cells.panel),
    pools,
    workers.map((worker) => worker.name),
  );

  // Beat 0: a free address is not enough. The receipt names what the destination must read.
  c.show(
    'route-address',
    workers.map((worker) => worker.free),
  );
  const fieldCues = ['route-model', 'route-layout', 'route-dtype', 'route-blocks'];
  fieldCues.forEach((cue, index) => c.show(cue, receipt[index]));
  c.on('route-partition', () => s.play(indicate(receipt[1], { color: COLOR.mark })));

  // Beat 1: each worker publishes the same fields. A matches, and B does not.
  const paint = (chip, color) => [
    to(chip.text, (n) => n.color(color), { duration: 0.3 }),
    to(chip.frame, (n) => n.stroke(color), { duration: 0.3 }),
  ];
  c.show(
    'route-compare',
    workers.map((worker) => worker.fields),
    { stagger: true },
  );
  c.after(
    'compatible-worker-a',
    () =>
      s.play(
        ...A.fields.chips.flatMap((chip) => paint(chip, COLOR.valid)),
        to(A.free, (n) => n.color(COLOR.valid), { duration: 0.3 }),
      ),
    0.04,
  );
  c.after('incompatible-worker-b', () => s.play(...paint(B.fields.chips[1], COLOR.fail)), 0.04);
  c.on('route-out', () =>
    s.play(
      out.to(1, { duration: 0.6 }),
      to(B.name, (n) => n.color('dim'), { duration: 0.6 }),
    ),
  );
  c.show('route-out', B.rejection, { after: true });

  // Beat 2: cache reuse affects cost. Topology can filter eligibility or bias selection.
  c.on('route-overlap', () => s.play(overlap.to(1, { duration: 1.4 })));
  c.show('route-topology', [requiredDomain, workers.map((worker) => worker.where)]);
  c.show('route-hints', preferredDomain);
  c.on('route-hints', () =>
    s.play(...[A, C].map((worker) => indicate(worker.where, { color: COLOR.mark }))),
  );
  c.on('route-valid', () => s.play(indicate(C.free, { color: COLOR.mark })));
  // Compare two hypothetical transfers on the same clock. Each cell is one required block.
  const clock = s.value(0);
  const [timeBand, laneA, laneC, decision] = area.rows([0.9, 2.7, 2.7, 1], 'normal');
  const timeName = place(
    note('Scheduling time  ·  synthetic units', { size: 34 }),
    timeBand,
    'left',
  );
  const timeShown = () => Math.floor(clock.value * 10 + 1e-8) / 10;
  const time = dynamic(() =>
    place(mono(timeShown().toFixed(1), { size: 63, color: COLOR.mark }), timeBand, 'right'),
  );
  const amountAt = (worker, t) =>
    Math.min(
      blocks,
      worker.reused + Math.max(0, Math.floor((t - worker.setup) * worker.rate + 1e-8)),
    );
  assertEqual(amountAt(A, C.cost), 31, 'completed A blocks when C finishes');
  assertEqual(amountAt(C, C.cost), blocks, 'completed C blocks on its deadline');

  const lane = (worker, region) => {
    const [header, strip, terms] = region.rows([1, 1.25, 0.9], 'tight');
    const name = place(label(`Worker ${worker.id}   ·   ${worker.locality}`), header, 'left');
    const count = dynamic(() =>
      place(
        mono(`${amountAt(worker, timeShown())} / ${blocks} present`, {
          color: amountAt(worker, timeShown()) === blocks ? COLOR.valid : 'ink',
          size: 41,
        }),
        header,
        'right',
      ),
    );
    const cells = strip.columns(blocks, 'none');
    const marks = dynamic(() =>
      cells.map((cell, i) => {
        const full = i < amountAt(worker, timeShown());
        return rect(cell.width - 5, strip.height * 0.88, {
          radius: 4,
          stroke: full ? null : 'gridStrong',
          width: 2,
          fill: i < worker.reused ? COLOR.valid : full ? COLOR.state : null,
        }).at(cell.cx, cell.cy);
      }),
    );
    const cost = place(
      mono(`${worker.setup} setup  +  ${worker.missing} blocks ÷ (${worker.rate} blocks/unit)`, {
        size: 36,
      }),
      terms,
      'left',
    );
    const held = place(note(`${worker.reused} cached`, { size: 34, color: 'dim' }), terms, 'right');
    return { base: [name, count, marks, held], cost };
  };
  const upper = lane(A, laneA),
    lower = lane(C, laneC);
  c.swapAll('route-fixture', [timeName, time, upper.base, lower.base], { keep: title });
  c.show('route-a-cost', upper.cost);
  c.show('route-c-cost', lower.cost);
  const ask = place(
    label('Which worker gets all 48 blocks first?', { color: COLOR.mark }),
    decision,
    'left',
  );
  const answer = place(
    label('C has all 48 blocks. A still needs 17.', { color: COLOR.mark }),
    decision,
    'left',
  );
  const done = place(
    label('A finishes at 4.2. C finished at 2.8.', { color: COLOR.valid }),
    decision,
    'left',
  );
  c.show('route-ask', ask);
  c.hide('route-run', ask);
  const firstTime = c.cue('route-c-time');
  c.on('route-run', () =>
    s.play(
      clock.to(C.cost, {
        duration: firstTime.end - c.cue('route-run').start,
        ease: linear,
      }),
    ),
  );
  c.show('route-count', answer, { after: true });
  c.hide('route-resume', answer);
  c.on('route-resume', () =>
    s.play(
      clock.to(A.cost, {
        duration: c.cue('route-a-time').end - c.cue('route-resume').start,
        ease: linear,
      }),
    ),
  );
  c.show('route-a-time', done, { after: true });
}
