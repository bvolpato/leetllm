import { cueProgress, heard } from '../construction.mjs';
import { dependencyTrace } from '../arithmetic.mjs';
import { reduced } from '../fixtures.mjs';

const producer = 4;
const original = { start: 3, finish: 7, read: 5 };
const replay = { start: 4, finish: 8, read: 8 };

export function drawFreshFirstEvent(ctx, scene, state, api) {
  const { C } = api;
  const readSeen = cueProgress(state, 0, 'fresh-read') > 0;
  const replaySeen = cueProgress(state, 0, 'fresh-replay') > 0;
  const diagnosed = heard(state, 1, 'fresh-first');
  const released = heard(state, 1, 'fresh-release');

  api.focus.target('fresh-trace', () => {
    function drawRun(repaired) {
      const data = repaired ? replay : original;
      const readiness = dependencyTrace(producer, data.start, data.finish, data.read);
      const y = repaired ? 665 : 296;
      const haveComm = repaired ? replaySeen : cueProgress(state, 0, 'fresh-comm') > 0;
      const lanes = repaired ? [] : [{ id: 'producer', label: 'R3 writes input' }];
      lanes.push(
        { id: 'comm', label: 'Reduce-scatter' },
        { id: 'consumer', label: 'R2 reads output' },
      );
      const bars = [];
      if (!repaired) {
        if (diagnosed) {
          bars.push(
            { id: 'produce', lane: 'producer', start: 0, end: original.start, color: C.blue },
            {
              id: 'still-writing',
              lane: 'producer',
              start: original.start,
              end: producer,
              label: '1 ms',
              color: C.pink,
            },
          );
        } else {
          bars.push({
            id: 'producer',
            lane: 'producer',
            start: 0,
            end: producer,
            label: 'ready at 4 ms',
            color: C.blue,
          });
        }
      }
      if (haveComm)
        bars.push({
          id: 'comm',
          lane: 'comm',
          start: data.start,
          end: data.finish,
          label: repaired
            ? released
              ? 'repaired replay 4→8 ms'
              : 'read 4 → writes 8 ms'
            : 'read 3 → writes 7 ms',
          color: !readiness.inputReady && diagnosed ? C.pink : C.cyan,
        });
      const trace = api.teaching.timeline({
        x: 150,
        y,
        width: 1580,
        height: repaired ? 224 : 292,
        domain: [0, 10],
        time: 10,
        lanes,
        intervals: bars,
        ticks: [0, 2, 4, 6, 8, 10],
        formatTime: (t) => t === 10 ? '10 ms' : String(t),
        cursorColor: 'transparent',
        labelWidth: 325,
        fontSize: 27,
        laneGap: 9,
        color: C.ink,
        trackColor: C.panel,
      });
      if (repaired ? released : readSeen) {
        const x = trace.point(data.read);
        const track = trace.lanes.consumer.bounds;
        const color = repaired && readiness.outputReady ? C.green : C.yellow;
        api.line(ctx, x, track.y + 2, x, track.y + track.height - 2, color, 6);
        api.text(ctx, 'read ' + data.read + ' ms', x, track.y - 8, 28, color, 'center');
      }
      const group = repaired
        ? released
          ? 'Replay   ·   stream waits in place'
          : 'Replay   ·   place the reader'
        : 'First run   ·   compare the reads';
      api.text(ctx, group, 150, y - 37, 37, C.ink);
    }
    // Paint the trace under discussion first. Both keep their positions on the clock.
    if (released) {
      drawRun(true);
      drawRun(false);
    } else {
      drawRun(false);
      if (replaySeen) drawRun(true);
    }
    const explanation = released
      ? 'R2 reads slot 2   =   ' + reduced[2]
      : diagnosed
        ? 'First unsafe read: R3 input at 3 ms, before the producer finishes at 4 ms'
        : replaySeen
          ? 'Predict the first repair and earliest legal consumer time'
          : 'Gradient slot 2   ·   rank 2 owns the result';
    api.text(ctx, explanation, 960, 988, released ? 50 : 36, released ? C.green : C.ink, 'center');
  });
}
export default {
  id: 'fresh-first-event',
  draw: drawFreshFirstEvent,
  cues: [
    'fresh-input',
    'fresh-comm',
    'fresh-read',
    'fresh-replay',
    'fresh-predict',
    'fresh-first',
    'fresh-depend',
    'fresh-finish',
    'fresh-release',
  ],
};
