import { overlapTime } from '../arithmetic.mjs';
import { cueProgress, heard, sampleModel } from '../construction.mjs';

export function drawReceipt(ctx, scene, state, api) {
  const { C, focus } = api;
  const m = sampleModel('receipt', state);
  const alg = heard(state, 0, 'receipt-algorithm');
  const bus = heard(state, 1, 'receipt-bus');
  const comm = m.seconds * 1000;
  const compute = 8;
  const hidden = 4;
  const serial = overlapTime(compute, comm, 0);
  const overlap = overlapTime(compute, comm, hidden);
  focus.target('receipt-row', () => {
    api.text(ctx, 'Illustrative four-rank sum all-reduce', 155, 263, 37, C.ink);
    api.text(ctx, '256 MiB   /   6 ms', 155, 384, 42, C.ink, 'left', 'mono');
    api.text(
      ctx,
      'Algorithmic: ' + (alg ? m.algbw.toFixed(2) + ' GB/s' : '?'),
      727,
      384,
      38,
      C.cyan,
    );
    api.text(
      ctx,
      'Bus score: ' + (bus ? m.busbw.toFixed(2) + ' GB/s' : '?'),
      1334,
      384,
      38,
      C.yellow,
    );
    api.line(ctx, 150, 316, 1770, 316, C.muted, 2);
    api.line(ctx, 150, 434, 1770, 434, C.muted, 2);
  });
  if (state.beat < 2) {
    const factor = heard(state, 1, 'receipt-factor');
    const x = 960;
    api.text(
      ctx,
      state.beat === 0
        ? 'How fast did the logical buffer finish?'
        : 'How does the test count traffic?',
      x,
      579,
      43,
      C.ink,
      'center',
    );
    const formula =
      state.beat === 0
        ? m.bytes.toLocaleString('en-US') + ' bytes / 0.006 s'
        : '6 sends × ¼ buffer' + (factor ? ' = 1.5 buffers sent per rank' : '');
    api.text(ctx, formula, x, 713, 53, C.ink, 'center');
    const result =
      state.beat === 0 && alg
        ? '≈ ' + m.algbw.toFixed(2) + ' billion bytes per second'
        : bus
          ? m.algbw.toFixed(2) + ' × 1.5 ≈ ' + m.busbw.toFixed(2) + ' GB/s'
          : '';
    if (result) api.text(ctx, result, x, 847, 48, state.beat === 0 ? C.cyan : C.yellow, 'center');
    return;
  }
  const shift = cueProgress(state, 2, 'receipt-shift');
  const exposed = heard(state, 2, 'nc-receipt-b2-s1');
  const earlier = compute - hidden * (exposed ? 1 : shift);
  const step = heard(state, 3, 'receipt-step');
  focus.target('receipt-schedules', () => {
    const intervals = [
      { id: 'compute-first', lane: 'compute', start: 0, end: compute - hidden, color: C.blue },
      {
        id: 'compute-last',
        lane: 'compute',
        start: compute - hidden,
        end: compute,
        label: 'independent',
        color: C.blue,
      },
      {
        id: 'serial-comm',
        lane: 'serial',
        start: compute,
        end: serial.total,
        label: '6 ms',
        color: C.cyan,
      },
    ];
    if (shift > 0 || exposed) {
      intervals.push({
        id: 'early-comm',
        lane: 'early',
        start: earlier,
        end: exposed ? compute : earlier + comm,
        label: exposed ? '4 ms hidden' : '6 ms',
        color: C.cyan,
      });
    }
    if (exposed)
      intervals.push({
        id: 'exposed',
        lane: 'early',
        start: compute,
        end: overlap.total,
        label: 'exposed 2 ms',
        color: C.pink,
      });
    api.teaching.timeline({
      x: 150,
      y: 490,
      width: 1620,
      height: 345,
      domain: [0, 14],
      time: 14,
      lanes: [
        { id: 'compute', label: 'Compute in both' },
        { id: 'serial', label: 'Late bucket' },
        { id: 'early', label: 'Earlier bucket' },
      ],
      intervals,
      ticks: [0, 2, 4, 6, 8, 10, 12, 14],
      cursorColor: 'transparent',
      labelWidth: 320,
      fontSize: 27,
      color: C.ink,
      trackColor: C.panel,
    });
    api.text(ctx, 'Step time (ms)', 1115, 905, 30, C.muted, 'center');
    const status = step
      ? 'Late bucket: ' + serial.total + ' ms     Earlier bucket: 8 + 2 = ' + overlap.total + ' ms'
      : exposed
        ? '6 ms of communication − 4 ms hidden = 2 ms exposed'
        : 'Ideal schedules with the same compute and transfer durations';
    api.text(ctx, status, 960, 1001, 40, step || exposed ? C.ink : C.muted, 'center');
  });
}
export default {
  id: 'receipt',
  draw: drawReceipt,
  cues: [
    'receipt-algorithm',
    'receipt-factor',
    'receipt-bus',
    'receipt-serial',
    'receipt-shift',
    'nc-receipt-b2-s1',
    'receipt-step',
    'receipt-fixed',
  ],
};
