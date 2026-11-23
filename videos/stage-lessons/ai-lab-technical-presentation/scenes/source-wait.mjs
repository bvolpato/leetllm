import { draw, line, place, rect, to } from 'vizmatic/stage';
import { label, namedBox } from '../../kit-narrated.mjs';
import { sourceWaitBudget } from '../../../films/ai-lab-technical-presentation/arithmetic.mjs';
import { addTitle, caption, work } from '../parts.mjs';

export default function sourceWait(s, c) {
  addTitle(s, c);
  const d = sourceWaitBudget();
  const [intro, first, second, detail, answer] = work.rows([0.55, 1, 1, 1.45, 0.9], 'normal');
  const slots = (r) => r.columns([1.3, 4.2, 1], 'normal');
  const lanes = [first, second].map((row, i) => {
    const [name, plot, total] = slots(row);
    const [numbers, bar] = plot.rows([1, 1], 'tight');
    const y = bar.point('center')[1];
    const x = (t) => bar.left + (bar.width * t) / d.after;
    const segment = (a, b, stroke) => line([x(a), y], [x(b), y], { stroke, width: 29 });
    const tag = (t, words, color) =>
      label(words, { size: 32, color }).moveTo([x(t), numbers.point('center')[1]]);
    return {
      shell: [
        caption(name, i ? 'Service split' : 'In process', 'ink', 41),
        segment(0, d.after, 'grid'),
      ],
      wait: segment(0, d.wait, 'blue'),
      waitText: tag(d.wait / 2, d.wait + ' ms at source', 'blue'),
      work: segment(d.wait, d.before, 'cyan'),
      workText: tag((d.wait + d.before) / 2, d.other + ' ms work', 'cyan'),
      hop: segment(d.before, d.after, 'yellow'),
      total: caption(total, (i ? d.after : d.before) + ' ms', i ? 'yellow' : 'ink', 50),
    };
  });
  const [geometry, note] = detail.columns([1.25, 1], 'loose');
  const [name, ruler] = geometry.rows([1, 1], 'tight');
  const zoomTitle = caption(name, 'Last 40 milliseconds, enlarged', 'dim', 35);
  const inset = ruler.inset('wide');
  const at = (ms) => [
    inset.left + ((ms - (d.before - d.hop)) * inset.width) / (2 * d.hop),
    inset.point('center')[1],
  ];
  const zoom = [
    line(at(d.before - d.hop), at(d.before), { stroke: 'cyan', width: 16 }),
    line(at(d.before), at(d.after), { stroke: 'yellow', width: 16 }),
    caption(note, '+ ' + d.hop + ' ms remote call', 'yellow', 48),
    zoomTitle,
  ];
  const ask = caption(
    answer,
    'What is the new total, with the source quota unchanged?',
    'yellow',
    43,
  );
  const decision = caption(answer, 'Investigate the source quota and backoff.', 'blue', 44);
  const traceTitle = place(
    label('One serial lookup  ·  invented trace timings', { color: 'dim', size: 35 }),
    intro,
    'left',
  );
  s.add(traceTitle, lanes[0].shell);
  c.on('wait', () => s.play(draw(lanes[0].wait), { duration: 0.7 }));
  c.show('wait', lanes[0].waitText, { after: true });
  c.on('work', () => s.play(draw(lanes[0].work), { duration: 0.5 }));
  c.show('work', lanes[0].workText, { after: true });
  c.show('before', lanes[0].total, { after: true });
  c.show('copy', [
    lanes[1].shell,
    lanes[1].wait,
    lanes[1].waitText,
    lanes[1].work,
    lanes[1].workText,
  ]);
  c.show('hop', [lanes[1].hop, zoom], { after: true });
  c.show('ask', ask);
  c.show('total', lanes[1].total, { after: true });
  c.hide('total', ask, { after: true });
  c.show('quota', decision);
  const [poolTitle, pool, queue, choice] = work.rows([0.65, 2, 1.5, 0.75], 'normal');
  const workers = pool.columns(4, 'normal').map((region, i) => {
    const [number, job] = region.rows([1, 1.2], 'tight');
    const shell = place(
      rect(region.width, region.height, { stroke: 'dim', fill: 'surface', radius: 17 }),
      region,
    );
    const title = caption(number, 'Worker ' + (i + 1), 'ink', 40);
    const token = place(
      namedBox('A · lookup ' + (i + 1), { width: job.width * 0.75, height: 76, color: 'blue' }),
      job,
    );
    return { nodes: [shell, title], token, job };
  });
  const poolName = caption(
    poolTitle,
    'Shared gateway process  ·  illustrative worker snapshot',
    'dim',
    39,
  );
  const [queueName, waiting, queueStatus] = queue.columns([1.3, 1, 1.6], 'normal');
  const q = caption(queueName, 'Ready to run', 'dim', 39);
  const waitingJob = place(
    namedBox('B · lookup', { width: 270, height: 76, color: 'cyan' }),
    waiting,
  );
  const queued = caption(queueStatus, 'Waiting for a worker', 'yellow', 39);
  const cap = caption(
    choice,
    'Next scheduling window   ·   Adapter A may use three workers',
    'ink',
    41,
  );
  const reason = caption(
    choice,
    'Test a resource limit before paying for a remote call.',
    'cyan',
    43,
  );
  const times = lanes.flatMap((lane) => [
    lane.shell,
    lane.wait,
    lane.waitText,
    lane.work,
    lane.workText,
    lane.total,
  ]);
  c.swap(
    'other-case',
    [traceTitle, times, lanes[1].hop, zoom, decision],
    [poolName, workers.map((worker) => worker.nodes)],
  );
  c.show(
    'occupied',
    workers.map((worker) => worker.token),
    { after: true },
  );
  c.show('queue', [q, waitingJob, queued]);
  c.hide('reset', [queued, workers.map((worker) => worker.token)]);
  c.show('cap', [cap, workers.slice(0, 3).map((worker) => worker.token)], { after: true });
  c.on('admit', () =>
    s.play(
      to(waitingJob, (n) => place(n, workers[3].job)),
      { duration: 0.8 },
    ),
  );
  c.hide('admit', q);
  c.swap('compare', cap, reason);
}
