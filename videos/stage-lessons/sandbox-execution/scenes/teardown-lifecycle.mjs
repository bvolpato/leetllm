// The slot holds generation seven until termination and reset finish. The generation check keeps a late cleanup acknowledgement from changing the state of generation eight.
import {
  arrow,
  assertEqual,
  boxOf,
  column,
  connector,
  dot,
  draw,
  fade,
  grid,
  grow,
  indicate,
  line,
  moveTo,
  pictogram,
  place,
  row,
} from 'vizmatic/stage';
import { cleanupFixture } from '../../../films/sandbox-execution/model.mjs';
import { area, chip, heading, label, mono, note } from '../../kit-narrated.mjs';
import { COLOR, slotLane, wall } from '../parts.mjs';

/** The spans of the two generations on the lane, as parts of its length. */
const OLD = [0.02, 0.5];
const NEW = [0.6, 0.98];

export default function teardownLifecycle(s, c) {
  const cleanup = cleanupFixture();
  // A late request for generation 7 leaves generation 8 as it is.
  assertEqual(
    cleanup.lateOld.status,
    'running',
    'a late request for generation 7 does not stop generation 8',
  );
  assertEqual(cleanup.reusable.status, 'reusable', 'the slot is free after termination and reset');

  // The frame: the lane, the requests under it, the lease and the state, and the job with its status.
  const [laneBand, requestBand, leaseBand, jobBand] = area.rows([130, 84, 130, 400], 'normal');
  const [slotName, laneBox] = laneBand.columns([1.2, 10], 'normal');
  const track = laneBox.inset('none', 30);
  const paint = (name, color, options = {}) => chip(name, { color, stroke: color, ...options });

  // The lane of slot A, and the two generations that hold it.
  const slot = place(label('slot A'), slotName, 'left');
  const { x, rail, old, next } = slotLane(track, { old: OLD, next: NEW });
  const gapChecks = [0.535, 0.57].map((part) =>
    pictogram('check', { size: 36, accent: COLOR.pass }).moveTo([x(part), track.cy]),
  );
  const lifetime = line([x(OLD[1]), track.top - 12], [x(OLD[1]), track.bottom + 12], {
    stroke: COLOR.host,
    width: 5,
  });
  const lifetimeName = note('maximum lifetime', { color: COLOR.host }).moveTo([
    x(OLD[1]),
    requestBand.cy,
  ]);

  // The lease, outside the worker, and the state of the slot by the model.
  const leaseName = note('lease, outside the worker');
  const lease = [
    paint(cleanup.old.runtimeId, COLOR.host, { font: 'mono' }),
    paint(`generation ${cleanup.old.generation}`, COLOR.host),
  ];
  const stateName = note('slot state');
  const states = [
    cleanup.old.status,
    cleanup.requested.status,
    cleanup.terminated.status,
    cleanup.reusable.status,
  ].map((words, i) => paint(words, i === 3 ? COLOR.pass : COLOR.host, { font: 'mono' }));
  const supervisor = paint('supervisor', COLOR.host);
  const reaper = paint('reaper', COLOR.host);
  place(
    row([leaseName, ...lease, stateName, states[1]], { gap: 'normal', align: 'center' }),
    leaseBand,
    'left',
  );
  states.forEach((made) => place(made, boxOf(states[1]), 'left'));

  // The job: a box that the kernel counts, and the processes inside it.
  const [jobBox, statusBox] = jobBand.columns([9, 8], 'wide');
  const job = wall(jobBox, 'job of worker-A · g7');
  const [groupBox, freeBox] = jobBox.inset('normal', 36).columns([3, 2], 'normal');
  const group = wall(groupBox, 'process group', { dash: true });
  const at = (box, px, py) => [box.left + px * box.width, box.top + py * box.height];
  const parent = dot(22, COLOR.candidate).moveTo(at(groupBox, 0.2, 0.5));
  const parentName = note('parse.py', { color: COLOR.candidate }).moveTo(at(groupBox, 0.2, 0.78));
  const children = [0.25, 0.5, 0.78].map((py) =>
    dot(16, COLOR.candidate).moveTo(at(groupBox, 0.72, py)),
  );
  const links = children.map((child) => connector(parent, child, { color: COLOR.quiet, width: 3 }));
  const mount = place(paint('mounted state', COLOR.candidate), freeBox, 'bottom');
  const escaped = at(freeBox, 0.5, 0.3);

  // The status of the cleanup, one row for each check.
  const leftName = label('processes left in the job', { size: 34 });
  const counts = [children.length + 1, children.length, 0]
    .map(String)
    .map((count) => mono(count, { size: 40, color: count === '0' ? COLOR.pass : COLOR.fail }));
  const checks = ['termination verified', 'baseline reset verified'].map((words) => ({
    mark: pictogram('check', { size: 40, accent: COLOR.pass }),
    name: label(words, { size: 34 }),
  }));
  const unknown = {
    mark: pictogram('question', { size: 40, color: COLOR.mark, accent: COLOR.mark }),
    name: label('termination unconfirmed', { size: 34 }),
  };
  place(
    column(
      [
        row([supervisor, reaper], { gap: 'normal' }),
        row([leftName, counts[0]], { gap: 'normal' }),
        grid(
          [...checks, unknown].flatMap((entry) => [entry.mark, entry.name]),
          { columns: 2, gap: ['normal', 'tight'], even: true },
        ),
      ],
      { gap: 'normal' },
    ),
    statusBox,
    'left',
  );
  counts.slice(1).forEach((made) => place(made, boxOf(counts[0]), 'left'));

  s.add(
    heading(c.title),
    slot,
    rail,
    old.bar,
    old.name,
    leaseName,
    stateName,
    states[0],
    supervisor,
    job,
    parent,
    parentName,
    ...links,
    ...children,
    leftName,
    counts[0],
  );

  const stop = (node) => fade(node, 0.2, { duration: 0.5 });
  // Beat 0: the top process stops, and its children stay.
  c.show('td-children', mount);
  c.on('td-children', () =>
    s.play(...children.map((child) => indicate(child, { color: COLOR.mark, duration: 1.2 }))),
  );
  c.on('td-stop', () => s.play(stop(parent), stop(parentName)));
  c.swap('td-cancel', states[0], states[1], { after: true });
  c.swap('td-stop', counts[0], counts[1], { after: true });
  c.on('td-gone', () => s.play(indicate(counts[1], { color: COLOR.mark, duration: 0.6 })));

  // Beat 1: the lease, and a reaper that does not need the supervisor.
  c.show('td-identity', lease[0]);
  c.show('td-generation', lease[1]);
  c.show('td-lifetime', [lifetime, lifetimeName]);
  c.on('td-contact', () => s.play(fade(supervisor, 0.3, { duration: 0.5 })));
  c.show('td-reaper', reaper);
  const quarantine = place(paint(cleanup.lost.status, COLOR.mark), boxOf(states[1]), 'left');
  c.swap('td-quarantine', states[1], quarantine);
  c.show('td-quarantine', [unknown.mark, unknown.name]);
  c.after('td-terminated', () => s.play(...children.map(stop)));
  c.swap('td-terminated', counts[1], counts[2], { after: true });

  // Beat 2: two checks, then generation 8. A late request still names generation 7.
  c.hide('td-terminated', [unknown.mark, unknown.name], { after: true });
  c.show('td-terminated', [checks[0].mark, checks[0].name, gapChecks[0]], { after: true });
  c.swap('td-terminated', quarantine, states[2], { after: true });
  c.show('td-reset', [checks[1].mark, checks[1].name, gapChecks[1]], { after: true });
  c.swap('td-reset', states[2], states[3], { after: true });
  c.on('td-reset', () =>
    s.play(
      stop(mount),
      fade(old.bar, 0.45, { duration: 0.5 }),
      fade(old.name, 0.45, { duration: 0.5 }),
    ),
  );
  c.show('td-eight', grow(next.bar, { from: [x(NEW[0]), track.cy], duration: 0.9 }));
  c.show('td-eight', next.name, { after: true });
  const running = place(paint('g8 running', COLOR.candidate), boxOf(states[1]), 'left');
  c.swap('td-eight', states[3], running, { after: true });
  const late = paint(`cleanup ${cleanup.old.runtimeId}`, COLOR.host, { font: 'mono' });
  late.moveTo([x(0.79), requestBand.cy]);
  const aim = (part, color = COLOR.host) =>
    arrow([x(part), requestBand.top + 4], [x(part), track.bottom], {
      stroke: color,
      width: 4,
      pad: 2,
    });
  const toOld = aim(0.26);
  c.hide('td-old', lifetimeName);
  c.show('td-old', late);
  const ask = place(
    label('Slot A now points to which worker?', { size: 36, color: COLOR.mark }),
    statusBox,
    'left',
  );
  const readout = [
    supervisor,
    reaper,
    leftName,
    counts[2],
    ...checks.flatMap((check) => [check.mark, check.name]),
  ];
  c.swap('td-ask', readout, ask);
  const wrong = place(
    mono(`slot A → ${cleanup.newer.runtimeId}`, { size: 37, color: COLOR.mark }),
    statusBox,
    'left',
  );
  c.swap('td-wrong', ask, wrong, { after: true });
  c.on('td-seven', () => s.play(moveTo(late, [x(0.26), requestBand.cy], { duration: 1.1 })));
  c.show('td-seven', draw(toOld), { after: true });
  const guard = place(
    mono(`recorded ${cleanup.old.generation}   =   current ${cleanup.newer.generation} ?`, {
      size: 37,
      color: COLOR.host,
    }),
    statusBox,
    'left',
  );
  const updated = Number(cleanup.old.generation === cleanup.newer.generation);
  const outcome = place(
    label(`${updated} slot records changed`, { size: 42, color: COLOR.pass }),
    statusBox,
    'left',
  );
  c.swap('td-guard', wrong, guard);
  c.swap('td-noop', guard, outcome, { after: true });
}
