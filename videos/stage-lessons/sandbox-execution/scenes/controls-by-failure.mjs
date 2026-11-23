// Scene `controls-by-failure`: each control has one job.
//
// The picture: the cell is at the upper left, with a closed network door and an open output pipe
// to the supervisor. Under them is the instrument panel of the cell: scratch, memory, tasks, CPU
// and the wall clock. A token leaves through the output pipe. Then each gauge fills to its limit
// and gives its own answer. The back half puts the numbers of the recipe on the same gauges.
import {
  arrow,
  assertEqual,
  beside,
  boxOf,
  dot,
  dynamic,
  fadeIn,
  grid,
  indicate,
  line,
  linear,
  moveTo,
  place,
  rect,
  row,
  seq,
} from 'vizmatic/stage';
import { resourceFixture, runtimeProbe } from '../../../films/sandbox-execution/model.mjs';
import { area, chip, heading, label, mono, note } from '../../kit-narrated.mjs';
import { COLOR, WORKER, gauge, wall } from '../parts.mjs';

/** The periods of the CPU strip, and the part of the track at which a gauge has its limit. */
const PERIODS = 6;
const CAP = 0.8;
/** The height of a gauge, with room for a note inside its track. */
const GAUGE = 52;

export default function controlsByFailure(s, c) {
  const limits = resourceFixture();
  const probes = runtimeProbe();
  assertEqual(
    limits.cpuQuota / limits.cpuPeriod,
    limits.cpuEquivalent,
    'the CPU equivalents of the quota',
  );

  // The frame: the cell and the supervisor at the top, and the instrument panel under them.
  const [top, panel] = area.rows([316, 560], 'normal');
  const [cellBox, channel, supervisorBox] = top.inset('none', 'tight').columns([9, 3, 9], 'none');
  const inner = (box) => box.inset('normal', 36);
  const paint = (name, color, options = {}) => chip(name, { color, stroke: color, ...options });
  const cellWall = wall(cellBox, WORKER);
  const supervisorWall = wall(supervisorBox, 'supervisor', { color: COLOR.host });

  // The cell: the process, its state, and a token that must not be here.
  const candidate = paint('parse.py', COLOR.candidate);
  const running = paint('running', COLOR.pass);
  const ended = paint('stop requested', COLOR.host);
  const token = paint('DEMO_TOKEN', COLOR.fail, { font: 'mono' });
  place(row([candidate, running, token]), inner(cellBox), 'top left');
  ended.moveTo([boxOf(running).left + boxOf(ended).width / 2, boxOf(running).cy]);

  // Two ways out of the cell: the network, which is closed, and the output, which is open.
  const [networkY, outputY] = [
    channel.top + channel.height / 3,
    channel.top + (2 * channel.height) / 3,
  ];
  const network = line([channel.left + 8, networkY], [channel.right - 8, networkY], {
    stroke: COLOR.quiet,
    width: 4,
    dash: [10, 8],
  });
  const closed = line([channel.cx, networkY - 20], [channel.cx, networkY + 20], {
    stroke: COLOR.host,
    width: 8,
  });
  const networkName = beside(
    note('network: closed', { color: COLOR.host }),
    closed,
    'above',
    'tight',
  );
  const output = arrow([channel.left, outputY], [channel.right, outputY], {
    stroke: COLOR.evidence,
    width: 5,
    pad: 10,
  });
  const outputName = beside(note('output', { color: COLOR.evidence }), output, 'under', 'tight');
  const leak = dot(11, COLOR.fail).moveTo(boxOf(token).point('right'));
  const leaked = place(paint('DEMO_TOKEN in output', COLOR.fail), inner(supervisorBox), 'top left');

  // The panel: one row for each control. The fill is what the candidate uses, and the line is the limit.
  const rowsOf = panel.rows([92, 92, 84, 160, 84], 'tight');
  const names = ['scratch', 'memory', 'tasks', 'CPU', 'wall clock'];
  const cells = rowsOf.map((band) => band.columns([2, 7, 5], 'normal'));
  const nameOf = names.map((name, i) => place(label(name, { size: 36 }), cells[i][0], 'left'));
  const trackOf = (i) => cells[i][1].inset('none', (cells[i][1].height - GAUGE) / 2);
  const gauges = [0, 1, 2, 4].map((i) =>
    gauge(s, trackOf(i), { cap: CAP, start: i === 1 ? 0.3 : 0, color: COLOR.candidate }),
  );
  const [scratch, memory, tasks, clock] = gauges;
  const result = (words, i, color = COLOR.host) =>
    place(mono(words, { size: 26, color }), cells[i][2], 'left');
  const beyond = (i) => trackOf(i).columns([4, 1], 'none')[1];

  // The CPU strip: six periods, and two lanes for two threads. A block is CPU time that a thread got.
  const [overStrip, stripBox, underStrip] = cells[3][1].rows([52, 56, 52], 'none');
  const time = s.value(0),
    share = s.value(0);
  const px = (period) => stripBox.left + (period / PERIODS) * stripBox.width;
  const strip = rect(stripBox.width, stripBox.height, {
    radius: 8,
    stroke: COLOR.quiet,
    fill: 'surface',
    width: 2,
  }).at(stripBox.cx, stripBox.cy);
  const ticks = Array.from({ length: PERIODS - 1 }, (_, k) =>
    line([px(k + 1), stripBox.top], [px(k + 1), stripBox.bottom], {
      stroke: COLOR.quiet,
      width: 2,
    }),
  );
  const blocks = dynamic(() => {
    const lanes = [0.5 - 0.25 * share.value, 0.25 * share.value];
    const made = [];
    for (let period = 0; period < PERIODS; period++)
      lanes.forEach((width, lane) => {
        const end = Math.min(period + width, time.value);
        if (end - period < 0.02) return;
        const [from, to] = [px(period) + 4, px(end) - 2];
        const y = stripBox.top + (lane + 0.5) * (stripBox.height / 2);
        made.push(
          rect(to - from, stripBox.height / 2 - 10, {
            fill: COLOR.candidate,
            stroke: null,
            radius: 4,
            opacity: 0.85,
          }).at((from + to) / 2, y),
        );
      });
    return made;
  });

  s.add(
    heading(c.title),
    cellWall,
    supervisorWall,
    candidate,
    running,
    token,
    network,
    closed,
    networkName,
    output,
    outputName,
    ...nameOf,
    ...gauges.flatMap((made) => [made.track, made.fill, made.limit]),
    strip,
    ...ticks,
    blocks,
  );

  // Beat 0: the network door is closed, and the token leaves through the output.
  c.on('cf-credentials', () => s.play(indicate(token, { color: COLOR.mark, duration: 1 })));
  c.on('cf-network', () => s.play(indicate(networkName, { color: COLOR.mark, duration: 1 })));
  c.on('cf-print', () =>
    s.play(
      seq(
        fadeIn(leak, { duration: 0.2 }),
        moveTo(leak, [cellBox.right - 22, outputY - 22], { duration: 0.8 }),
        moveTo(leak, [supervisorBox.left + 22, outputY - 22], { duration: 1.1 }),
      ),
    ),
  );
  c.show('cf-returns', leaked);

  // Beat 1: two limits that answer with an error, and leave the process alive.
  c.hide(1, [token, leak, leaked]);
  c.on('cf-scratch', () => s.play(indicate(scratch.limit, { color: COLOR.mark, duration: 0.9 })));
  c.show('cf-write-fails', result(probes[2].outcome, 0), { after: true });
  c.on('cf-tasks', () =>
    s.play(
      seq(
        ...Array.from({ length: 8 }, (_, i) =>
          tasks.level.to(((i + 1) * CAP) / 8, { duration: 0.14 }),
        ),
      ),
    ),
  );
  c.show('cf-reject', result(probes[3].outcome, 2), { after: true });
  c.on('cf-distinct', () => s.play(indicate(running, { color: COLOR.mark, duration: 1.2 })));

  // Beat 2: the CPU quota slows the process, and only the deadline ends it.
  const throttled = place(note('the rest of each period: no CPU'), cells[3][2], 'left');
  c.on('cf-cpu', () => s.play(time.to(PERIODS, { duration: 3, ease: linear })));
  c.show('cf-cpu', throttled, { after: true });
  c.on('cf-deadline', () => s.play(clock.level.to(CAP, { duration: 2.4, ease: linear })));
  c.show('cf-stop', result(`${limits.wallSeconds} s · watchdog requests stop`, 4), { after: true });
  c.swap('cf-stop', running, ended, { after: true });
  const bounds = ['output', 'logs', 'memory', 'concurrent jobs'].map((name) =>
    paint(name, COLOR.host),
  );
  place(grid(bounds, { columns: 2, gap: 'tight' }), inner(supervisorBox), 'top left');
  c.show('cf-bounds', bounds, { stagger: true });

  // Beat 3: the numbers of the recipe, on the same gauges.
  const period = note(`one period: ${limits.cpuPeriod} ms`);
  period.moveTo([px(0) + boxOf(period).width / 2, overStrip.cy]);
  const quota = note(`quota: ${limits.cpuQuota} ms of CPU time`, { color: COLOR.candidate });
  quota.moveTo([px(0) + boxOf(quota).width / 2, underStrip.cy]);
  const together = beside(
    note('for all threads together', { color: COLOR.candidate }),
    quota,
    'right',
    'normal',
  );
  const equation = place(
    mono(`${limits.cpuQuota} ms / ${limits.cpuPeriod} ms = ${limits.cpuEquivalent} CPU`, {
      size: 30,
      color: COLOR.mark,
    }),
    cells[3][2],
    'left',
  );
  const stillRuns = beside(
    note('a loop still runs, at this pace'),
    equation,
    'under',
    'tight',
    'left',
  );
  c.show('cf-period', period);
  c.show('cf-quota', quota);
  c.on('cf-aggregate', () => s.play(share.to(1, { duration: 1.2 })));
  c.show('cf-aggregate', together);
  c.swap('cf-equation', throttled, equation);
  c.show('cf-loop', stillRuns);
  c.on('cf-loop', () => s.play(indicate(nameOf[4], { color: COLOR.mark, duration: 1.2 })));
  // Scratch is memory: the two gauges fill together.
  const scratchSize = place(note(`${limits.scratchMiB} MiB`), beyond(0));
  const memorySize = place(note(`${limits.memoryMiB} MiB`), beyond(1));
  c.show('cf-sixtyfour', scratchSize);
  c.show('cf-fivetwelve', memorySize);
  c.on('cf-consumes', () =>
    s.play(
      scratch.level.to(CAP, { duration: 1.8 }),
      memory.level.to(0.3 + (CAP * limits.scratchMiB) / limits.memoryMiB, { duration: 1.8 }),
    ),
  );
  const noSwap = paint('no swap', COLOR.host);
  const outcomes = ['reclaim', 'fail', 'kill'].map((name) => paint(name, COLOR.host));
  place(row([noSwap, ...outcomes], { gap: 'tight' }), cells[1][2], 'left');
  c.show('cf-swap', noSwap);
  c.show('cf-pressure', outcomes, { stagger: true });
  const threads = place(label('tasks, threads', { size: 36 }), cells[2][0], 'left');
  c.swap('cf-threads', nameOf[2], threads);
  c.on('cf-threads', () => s.play(indicate(tasks.limit, { color: COLOR.mark, duration: 1.2 })));
}
