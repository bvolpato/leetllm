import { assertEqual, fitted, lanes, place, segmentedBar } from 'vizmatic/stage';
import { heading, label } from '../../kit-narrated.mjs';
import { carryIdentity, evidenceFrame } from '../parts.mjs';
import { serialRequestTrace } from '../../../films/production-retrieval/model.mjs';
export default function serialLatency(s, c) {
  const f = evidenceFrame(c);
  const [clockRoom, budgetRoom] = f.work.rows([4.8, 3.2], 'normal');
  const trace = serialRequestTrace();
  assertEqual(
    trace.stages.slice(0, 4).reduce((sum, r) => sum + r.duration, 0),
    trace.callerTTFT,
    'caller first token includes upstream work',
  );
  const names = trace.stages.map((r) => r.name + ' · ' + r.duration + ' ms').concat('Trace write');
  const events = trace.stages
    .map((r, i) => ({
      id: r.name,
      lane: names[i],
      start: r.start,
      end: r.end,
      color: i === 4 ? 'cyan' : 'blue',
    }))
    .concat({
      id: 'trace',
      lane: 'Trace write',
      start: trace.completion,
      end: trace.traceComplete,
      color: 'dim',
    });
  const clock = place(
    fitted(clockRoom, (width) =>
      lanes(names, events, {
        width,
        size: 29,
        pitch: 38,
        barHeight: 22,
        domain: [0, trace.localTotal],
        ticks: [0, 1000],
        format: (n) => n + ' ms',
        deadline: { at: 1000, label: 'deadline', drain: true },
      }),
    ),
    clockRoom,
  );
  const [legendRoom, barRoom] = budgetRoom.rows([1, 2], 'tight');
  const stageNames = ['Authorization', 'Retrieval', 'Packing', 'Model startup', 'Generation'];
  const legendSlots = legendRoom.columns(5, 'tight');
  const durationLabels = trace.localPassingStages.map((value, i) =>
    place(
      label(stageNames[i] + '\n' + value + ' ms', { size: 29, color: i === 4 ? 'cyan' : 'blue' }),
      legendSlots[i],
    ),
  );
  const caps = place(
    segmentedBar(
      trace.localPassingStages.map((value, i) => ({
        name: trace.stages[i].name,
        value: 0,
        color: i === 4 ? 'cyan' : 'blue',
      })),
      {
        width: f.work.inset('normal').width,
        capacity: 1000,
        max: 1100,
        size: 34,
        labels: false,
        title: 'Stage durations versus request deadline',
        readout: false,
      },
    ),
    barRoom,
  );
  const first = place(
    label('Caller token one: ' + trace.callerTTFT + ' ms', { color: 'yellow' }),
    f.foot,
  );
  const complete = place(
    label('Answer complete: ' + trace.completion + ' ms', { color: 'yellow' }),
    f.foot,
  );
  const logged = place(
    label('Nonblocking trace complete: ' + trace.traceComplete + ' ms', { color: 'dim' }),
    f.foot,
  );
  const buffered = place(
    label('Buffered delivery waits for generation + validation', { color: 'yellow' }),
    f.foot,
  );
  const overrun = place(
    label(trace.localTotal + ' ms > 1,000 ms · 50 ms over deadline', { color: 'red' }),
    f.foot,
  );
  assertEqual(
    trace.localPassingStages.reduce((a, b) => a + b, 0),
    trace.localTotal,
    'later stage durations sum to total',
  );
  s.add(heading(c.title, { size: 44 }), f.nodes, clock, caps);
  carryIdentity(c, f);
  c.on('pr-startup', () => s.play(clock.advance(trace.stages[3].start, { duration: 1.1 })));
  c.on('pr-first', () =>
    s.play(
      clock.advance(trace.callerTTFT, {
        duration: c.cue('pr-first').end - c.cue('pr-first').start,
      }),
    ),
  );
  c.show('pr-first', first, { after: true, lead: -0.1 });
  c.on('pr-complete', () =>
    s.play(
      clock.advance(trace.completion, {
        duration: c.cue('pr-complete').end - c.cue('pr-complete').start,
      }),
    ),
  );
  c.swap('pr-complete', first, complete, { after: true });
  c.on('pr-trace', () =>
    s.play(
      clock.advance(trace.traceComplete, {
        duration: c.cue('pr-trace').end - c.cue('pr-trace').start,
      }),
    ),
  );
  c.swap('pr-trace', complete, logged, { after: true });
  c.swap('pr-buffer', logged, buffered, { after: true });
  ['cap-auth', 'cap-retrieval', 'cap-packing', 'cap-startup', 'cap-generation'].forEach(
    (cue, i) => {
      c.show(cue, durationLabels[i]);
      if (i < 4)
        c.on(cue, () =>
          s.play(caps.resize(trace.stages[i].name, trace.localPassingStages[i], { duration: 0.3 })),
        );
    },
  );
  c.after('pr-deadline', () =>
    s.play(caps.resize(trace.stages[4].name, trace.localPassingStages[4], { duration: 0.6 })),
  );
  c.swap('pr-deadline', buffered, overrun, { after: true, lead: -0.7 });
}
