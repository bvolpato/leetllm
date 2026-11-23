import { assertEqual, beside, boxOf, dynamic, place, rect, stateGrid } from 'vizmatic/stage';
import { label, mono, note } from '../../kit-narrated.mjs';
import { FOOT, VIEW, PAGE_LOOKS, host, sandboxCapacity } from '../parts.mjs';

export default function scene(s, c) {
  host(s, c, 'capacity-arithmetic');
  const model = sandboxCapacity();
  assertEqual(model.poolMiB, 229376, 'available MiB');
  assertEqual(model.privateSlots, 4587, 'memory-only slots');
  assertEqual(model.queued, 3712, 'burst queue');
  const [top, mid, bottom] = VIEW.rows([1, 1, 1.5], 'normal');
  const inputs = place(mono('256 GiB total · 32 GiB reserved', { size: 48 }), top);
  const pool = place(mono('256 GiB − 32 GiB = 224 GiB', { size: 48 }), top);
  const inMiB = model.poolMiB.toLocaleString('en-US');
  const converted = place(mono(`224 GiB × 1,024 MiB/GiB = ${inMiB} MiB`, { size: 41 }), top);
  const fullQuestion = place(mono('224 GiB ÷ (2 GiB/job) = ?', { size: 48 }), mid);
  const full = place(
    mono(`224 GiB ÷ (2 GiB/job) = ${model.fullSlots} slots`, { color: 'green' }),
    mid,
  );
  const privateQuestion = place(mono(`${inMiB} MiB ÷ (50 MiB/job) = ?`, { size: 45 }), mid);
  const privateSlots = place(
    mono(
      `floor(${inMiB} MiB ÷ (50 MiB/job)) = ${model.privateSlots.toLocaleString('en-US')} memory-only slots`,
      { color: 'cyan', size: 34 },
    ),
    mid,
  );
  const poolBox = place(
    rect(bottom.width * 0.86, bottom.height * 0.7, { stroke: 'green', fill: 'surface' }),
    bottom,
  );
  const bounds = boxOf(poolBox);
  const axisMax = 5000;
  const slotsShown = s.value(model.fullSlots);
  const slotBar = dynamic(() => {
    const width = (bounds.width * slotsShown.value) / axisMax;
    const color = slotsShown.value === model.fullSlots ? 'green' : 'cyan';
    return rect(width, bounds.height, { fill: color, stroke: color }).moveTo([
      bounds.left + width / 2,
      bounds.point('center')[1],
    ]);
  });
  const availableNote = place(note('Memory available for jobs'), FOOT);
  const memoryNote = place(note('Memory-only slots · fixed scale from 0 to 5,000'), FOOT);
  const comparison = place(
    note(`2 GiB per job: ${model.fullSlots} slots   ·   scale from 0 to 5,000`),
    FOOT,
  );
  const cpuCols = VIEW.columns(3, 'loose');
  const population = place(
    stateGrid({ states: PAGE_LOOKS, columns: 10, rows: 3, cell: 32, initial: 'shared' }),
    cpuCols[0],
  );
  const cores = place(
    stateGrid({ states: PAGE_LOOKS, columns: 16, rows: 8, cell: 25, initial: 'absent' }),
    cpuCols[1],
  );
  const waiting = place(
    stateGrid({ states: PAGE_LOOKS, columns: 10, rows: 3, cell: 32, initial: 'absent' }),
    cpuCols[2],
  );
  const heads = [population, cores, waiting].map((node, i) =>
    beside(
      label(['sessions', '128 core slots', 'waiting queue'][i], { size: 34 }),
      node,
      'above',
      'wide',
    ),
  );
  const count = beside(
    mono(model.sessions.toLocaleString('en-US'), { color: 'cyan' }),
    population,
    'under',
    'normal',
  );
  const batches = beside(note('one tile = 128 sessions'), count, 'under', 'normal');
  const admitted = beside(
    mono(`${model.admitted} running`, { color: 'cyan', size: 34 }),
    cores,
    'under',
    'normal',
  );
  const queued = beside(
    mono(`${model.queued.toLocaleString('en-US')} waiting`, { color: 'yellow', size: 34 }),
    waiting,
    'under',
    'normal',
  );
  const mean = place(
    mono(
      `${model.sessions.toLocaleString('en-US')} × 0.03 = ${model.mean.toFixed(1)} core-equivalents`,
      { color: 'yellow' },
    ),
    FOOT,
  );
  const burst = place(note('All 3,840 sessions wake together'), FOOT);
  const queue = place(
    mono(
      `${model.sessions.toLocaleString('en-US')} − ${model.admitted} = ${model.queued.toLocaleString('en-US')} queued`,
      { color: 'yellow' },
    ),
    FOOT,
  );
  const cpuNote = place(note('128 cores × 30 sessions per core'), FOOT);
  s.add(inputs, poolBox, availableNote);
  c.swap('pool', [inputs, availableNote], [pool, memoryNote], { after: true });
  c.show('footprint', fullQuestion, { after: true, lead: 0 });
  c.swap('full', fullQuestion, [full, slotBar], { after: true, lead: 0 });
  c.swap('fifty', [pool, full, memoryNote], [converted, privateQuestion, comparison], {
    after: true,
    lead: 0,
  });
  c.hide('private', privateQuestion, { after: true, lead: 0 });
  c.show('private', privateSlots, { after: true, lead: -1.9 });
  c.after('private', () => s.play(slotsShown.to(model.privateSlots, { duration: 1.5 })), 0.3);
  c.swap(
    'sessions',
    [converted, privateSlots, poolBox, slotBar, comparison],
    [population, cores, waiting, heads, count, batches, cpuNote],
    { after: true },
  );
  c.swap('mean', cpuNote, mean, { after: true, lead: 0 });
  c.swap('wake', mean, burst, { after: true, lead: -1.0 });
  c.on('wake', () => s.play(population.change(() => true, 'dirty', { duration: 0.7 })));
  c.after('admit', () =>
    s.play(
      population.change([0], 'absent', { duration: 0.4 }),
      cores.change(() => true, 'copied', { duration: 0.7 }),
    ),
  );
  c.show('admit', admitted, { after: true, lead: -0.7 });
  c.after('queue', () =>
    s.play(
      population.change(() => true, 'absent', { duration: 0.4 }),
      waiting.change(
        Array.from({ length: model.queued / model.admitted }, (_, i) => i),
        'dirty',
        { duration: 0.7 },
      ),
    ),
  );
  c.show('queue', queued, { after: true, lead: -0.7 });
  c.swap('queue', burst, queue, { after: true, lead: -0.7 });
}
