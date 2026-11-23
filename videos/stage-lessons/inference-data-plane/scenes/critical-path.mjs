// Scene `critical-path`: measure the path that users wait on.
//
// The picture: the spans of R4219 on one clock, and the moment of its first token. Prefill and
// setup overlap, and the transfer starts before prefill ends. A queue of 25 ms grows and pushes
// the transfer and the first token, and no span changes its length. Then the same rows take the
// second schedule of the lesson: in series, with overlap, and behind a queue. Last, two counters
// of bytes and a row of requests show what a latency number can hide.
import {
  boxOf,
  clamp,
  column,
  dynamic,
  indicate,
  line,
  linear,
  place,
  rect,
  row,
  text,
} from 'vizmatic/stage';
import { traceWithQueue } from '../../../films/inference-data-plane/arithmetic.mjs';
import { productionPayload } from '../../../films/inference-data-plane/fixtures.mjs';
import { area, chip, chipRow, heading, label, note } from '../../kit-narrated.mjs';
import { COLOR, spans } from '../parts.mjs';

const ROW = { prefill: 0, setup: 1, queue: 2, transfer: 3, decode: 4, whole: 5 };
const QUEUE_MS = 25;
/** The second schedule of the lesson, on one clock: the transfer of the 2.5 GiB payload at 25 GB/s. */
const CLOCK = {
  prefill: 310,
  transfer: (productionPayload.bytes / 25e9) * 1000,
  commit: 28,
  early: 240,
};
const said = (value, words) => {
  if (value.toFixed(1) !== words)
    throw new Error(
      `critical-path: the schedule gives ${value.toFixed(1)} and the voice says ${words}`,
    );
};
said(CLOCK.prefill + CLOCK.transfer + CLOCK.commit, '445.4');
said(CLOCK.early + CLOCK.transfer + CLOCK.commit, '375.4');
said(QUEUE_MS + CLOCK.early + CLOCK.transfer + CLOCK.commit, '400.4');

export default function criticalPath(s, c) {
  const [head, plotBand, foot] = area.rows([0.7, 5.6, 3], 'normal');
  const first = traceWithQueue(0);

  // Each row has a start and an end on the clock, and shows or not.
  const rows = [
    { name: 'prefill', color: COLOR.state },
    { name: 'transfer setup', color: COLOR.control },
    { name: 'handoff queue', color: COLOR.other },
    { name: 'KV transfer', color: COLOR.state },
    { name: 'decode, first token', color: COLOR.valid },
    { name: 'end to end', color: COLOR.mark },
  ].map((entry) => ({
    ...entry,
    a: s.value(0),
    b: s.value(0),
    on: s.value(0),
    measured: s.value(-1),
  }));
  const ms = (value) =>
    `${Math.abs(value - Math.round(value)) < 0.05 ? Math.round(value) : value.toFixed(1)} ms`;
  const chart = spans(
    plotBand,
    rows.map((entry) => ({
      name: entry.name,
      color: entry.color,
      start: () => entry.a.value,
      end: () => entry.b.value,
      shown: () => entry.on.value,
      // The length of the span: it does not change when the span moves.
      readout: () => {
        const duration =
          entry.measured.value < 0 ? entry.b.value - entry.a.value : entry.measured.value;
        return duration > 0.5 ? ms(duration) : null;
      },
    })),
    {
      domain: [0, 460],
      ticks: [0, 100, 200, 300, 400],
      format: (value) => `${value} ms`,
      nameWidth: 560,
      readoutWidth: 190,
      barHeight: 46,
    },
  );
  const union = place(
    text('active spans', { size: 34, anchor: 'right' }),
    boxOf(chart.names[ROW.setup]),
    'right',
  );
  const span = (index, a, b, duration = 1.2, ease) => [
    rows[index].a.to(a, { duration, ...(ease ? { ease } : {}) }),
    rows[index].b.to(b, { duration, ...(ease ? { ease } : {}) }),
  ];
  const show = (index, shown = 1) => rows[index].on.to(shown, { duration: 0.3 });

  // The first token: a line at the end of the decode span, with its time.
  const token = s.value(0), // 0 to 1: the line of the first token shows
    timeOn = s.value(0), // 0 to 1: the time of the first token shows
    ghost = s.value(0), // 0 to 1: where the transfer starts on a backend that waits for prefill
    band = s.value(0); // 0 to 1: the time in which prefill and the transfer overlap
  const marker = dynamic(() => {
    const nodes = [];
    const y = (index) => chart.y(index);
    if (band.value > 0) {
      const from = chart.x(rows[ROW.transfer].a.value),
        to = chart.x(rows[ROW.prefill].b.value);
      if (to > from)
        nodes.push(
          rect(to - from, chart.plot.bottom - chart.plot.top, {
            fill: COLOR.mark,
            stroke: null,
            opacity: 0.12 * band.value,
          }).at((from + to) / 2, (chart.plot.top + chart.plot.bottom) / 2),
        );
    }
    if (ghost.value > 0) {
      const from = chart.x(rows[ROW.prefill].b.value),
        width = chart.x(first[3].end - first[3].start) - chart.x(0);
      nodes.push(
        rect(width, 46, {
          fill: null,
          stroke: 'dim',
          width: 2,
          radius: 6,
          dash: [8, 6],
          opacity: ghost.value,
        }).at(from + width / 2, y(ROW.transfer) + 0),
      );
    }
    if (token.value > 0) {
      const at = chart.x(rows[ROW.decode].b.value);
      nodes.push(
        line([at, chart.plot.top - 6], [at, chart.plot.bottom], {
          stroke: COLOR.mark,
          width: 3,
          opacity: token.value,
        }),
      );
      if (timeOn.value > 0)
        nodes.push(
          text(`first token: ${ms(rows[ROW.decode].b.value)}`, {
            font: 'mono',
            size: 36,
            color: COLOR.mark,
            anchor: 'right',
          })
            .at(at + 12, head.cy)
            .opacity(token.value * timeOn.value),
        );
    }
    return nodes;
  });

  // The band under the chart: what to record, then a warning about percentiles, then the counters.
  const record = place(
    chipRow(
      [
        'queue spans',
        'bytes',
        'worker identities',
        'transport completion',
        'decode start',
        'cancellation',
      ],
      { maxWidth: foot.width },
    ),
    foot,
    'top left',
  );
  // Keep the three outcomes together while the next schedule moves on the same clock.
  const serial = CLOCK.prefill + CLOCK.transfer;
  const overlap = CLOCK.early + CLOCK.transfer;
  const outcomes = [
    ['Serial', serial + CLOCK.commit],
    ['Overlap', overlap + CLOCK.commit],
    ['With queue', QUEUE_MS + overlap + CLOCK.commit],
  ].map(([name, total]) => chip(`${name}  ${ms(total)}`, { color: COLOR.mark }));
  place(row(outcomes, { gap: 'normal' }), foot, 'top left');
  const p99 = place(
    row(
      [
        chipRow(['p99 prefill', 'p99 transfer', 'p99 decode']),
        label('do not add to', { color: COLOR.fail }),
        chip('p99 end to end', { color: COLOR.mark, stroke: COLOR.mark }),
      ],
      {
        gap: 'normal',
        align: 'center',
      },
    ),
    foot,
    'top left',
  );
  const [byteSide, requestSide] = foot.columns([6, 5], 'wide');
  const unique = s.value(0),
    wire = s.value(0);
  const bytes = spans(
    byteSide,
    [
      {
        name: 'unique payload',
        color: COLOR.state,
        start: () => 0,
        end: () => unique.value,
        readout: () => null,
      },
      {
        name: 'wire bytes',
        color: COLOR.other,
        start: () => 0,
        end: () => wire.value,
        readout: () => null,
      },
    ],
    {
      domain: [0, 2],
      ticks: [0, 1, 2],
      format: (value) => `${value}×`,
      nameWidth: 260,
      barHeight: 40,
    },
  );
  // The requests that were offered: one mark for each. A mark is green when the request met its target.
  const OFFERED = 20,
    KEPT = 3;
  const offered = s.value(0), // the requests that show
    met = s.value(OFFERED), // the requests that the system took and that met the target
    turned = s.value(0); // 0 to 1: the requests that the system turned away go dim
  const requestBed = rect(OFFERED * 34 - 8, 30, { fill: null, stroke: null });
  const requestName = note('offered requests, and those that met the target');
  const tracked = chipRow(['quarantined bytes', 'wasted prefill tokens']);
  const ids = chip('ids in traces', { color: COLOR.control, stroke: COLOR.control });
  const same = chip('same workload and budget', { color: COLOR.mark, stroke: COLOR.mark });
  place(
    column([requestName, requestBed, tracked, row([ids, same], { gap: 'tight' })], {
      gap: 'tight',
    }),
    requestSide,
    'top left',
  );
  const requests = dynamic(() => {
    const box = boxOf(requestBed);
    return Array.from({ length: OFFERED }, (_, index) => {
      const here = clamp(offered.value - index, 0, 1);
      if (here <= 0) return null;
      const good = index < met.value;
      return rect(26, 26, {
        fill: good ? COLOR.valid : 'faint',
        stroke: null,
        radius: 13,
        opacity: here * (good ? 1 : 1 - 0.6 * turned.value),
      }).at(box.left + 13 + index * 34, box.cy);
    }).filter(Boolean);
  });

  s.add(
    heading(c.title),
    chart.axis,
    chart.names.filter((_, index) => index !== ROW.whole),
    chart.marks,
    marker,
  );

  // Beat 0: prefill and setup overlap, and the transfer starts before prefill ends.
  c.on('overlap-setup', () =>
    s.play(
      show(ROW.prefill),
      show(ROW.setup),
      ...span(ROW.prefill, first[0].start, first[0].end, 2.4, linear),
      ...span(ROW.setup, first[1].start, first[1].end, 2, linear),
    ),
  );
  c.on('early-kv', () => {
    rows[ROW.transfer].a.set(first[3].start);
    rows[ROW.transfer].b.set(first[3].start);
    s.play(
      show(ROW.transfer),
      rows[ROW.transfer].b.to(first[3].end, { duration: 2.4, ease: linear }),
      band.to(1, { duration: 0.6 }),
    );
  });
  c.on('path-other', () => s.play(ghost.to(1, { duration: 0.4 })));
  c.on('path-deps', () => {
    rows[ROW.decode].a.set(first[4].start);
    rows[ROW.decode].b.set(first[4].start);
    s.play(
      ghost.to(0, { duration: 0.4 }),
      show(ROW.decode),
      rows[ROW.decode].b.to(first[4].start + (first[4].end - first[4].start) * 0.6, {
        duration: c.cue('path-deps').end - c.cue('path-deps').start,
        ease: linear,
      }),
    );
  });
  c.after(
    'path-deps',
    () =>
      s.play(
        rows[ROW.decode].b.to(first[4].end, { duration: 0.3, ease: linear }),
        token.to(1, { duration: 0.3 }),
      ),
    0.04,
  );
  c.after('path-deps', () => timeOn.set(1), 0.34);

  // Beat 1: a queue of 25 ms. The transfer and the first token move, and no span is longer.
  const pushed = traceWithQueue(QUEUE_MS);
  c.on('handoff-queue', () => {
    const shiftDuration = 2.4;
    const transfer = pushed[ROW.transfer];
    const decodeStart = pushed[ROW.decode].start;
    token.set(0);
    timeOn.set(0);
    rows[ROW.decode].measured.set(first[4].end - first[4].start);
    rows[ROW.decode].b.set(rows[ROW.decode].a.value);
    rows[ROW.queue].a.set(first[ROW.queue].start);
    rows[ROW.queue].b.set(first[ROW.queue].start);
    // Move both transfer edges with the queue end. Keep decode empty until its result cue.
    s.play(
      band.to(0, { duration: 0.4 }),
      show(ROW.queue),
      rows[ROW.queue].b.to(pushed[ROW.queue].end, { duration: shiftDuration }),
      ...span(ROW.transfer, transfer.start, transfer.end, shiftDuration),
      ...span(ROW.decode, decodeStart, decodeStart, shiftDuration),
    );
  });
  c.on('shift-first-token', () => s.play(indicate(chart.names[ROW.queue], { color: COLOR.other })));
  c.after(
    'shift-first-token',
    () =>
      s.play(
        rows[ROW.decode].b.to(pushed[ROW.decode].end, { duration: 0.3, ease: linear }),
        token.to(1, { duration: 0.3 }),
      ),
    0.04,
  );
  c.after('shift-first-token', () => timeOn.set(1), 0.34);
  c.on('path-unchanged', () =>
    s.play(
      indicate(chart.names[ROW.transfer], { color: COLOR.mark }),
      indicate(chart.names[ROW.decode], { color: COLOR.mark }),
    ),
  );

  // Beat 2: one request, from admission to its first token.
  c.show('end-to-end-request', chart.names[ROW.whole]);
  c.on('end-to-end-request', () =>
    s.play(show(ROW.whole), rows[ROW.whole].b.to(pushed[4].end, { duration: 2.4, ease: linear })),
  );
  c.show('path-record', record);
  c.on('same-event', () => s.play(indicate(chart.names[ROW.whole], { color: COLOR.mark })));

  // Beat 3: the second schedule, on the same rows. In series, then with overlap, then behind a queue.
  c.hide('clock-prefill', record);
  c.swap('clock-prefill', chart.names[ROW.setup], union);
  c.on('clock-prefill', () => {
    for (const entry of rows) entry.measured.set(0);
    s.play(
      token.to(0, { duration: 0.3 }),
      timeOn.to(0, { duration: 0.3 }),
      show(ROW.setup, 0),
      show(ROW.queue, 0),
      show(ROW.whole, 0),
    );
    // Keep the outgoing schedule in place until its queue and first-token marker disappear.
    s.play(
      ...span(ROW.prefill, 0, CLOCK.prefill),
      ...span(ROW.transfer, CLOCK.prefill, CLOCK.prefill),
      ...span(ROW.decode, CLOCK.prefill, CLOCK.prefill),
    );
  });
  // Leave the encoder's shutter interval after each completed result clause.
  c.after('clock-prefill', () => rows[ROW.prefill].measured.set(CLOCK.prefill), 0.04);
  c.on('clock-transfer', () =>
    s.play(
      rows[ROW.transfer].b.to(serial, { duration: 2.4, ease: linear }),
      ...span(ROW.decode, serial, serial, 2.4, linear),
    ),
  );
  c.after('clock-transfer', () => rows[ROW.transfer].measured.set(CLOCK.transfer), 0.04);
  c.on('clock-commit', () => s.play(indicate(chart.names[ROW.decode], { color: COLOR.valid })));
  c.after('clock-commit', () => rows[ROW.decode].measured.set(CLOCK.commit), 0.04);
  const finishClock = (end) =>
    s.play(
      rows[ROW.decode].b.to(end, { duration: 0.3, ease: linear }),
      token.to(1, { duration: 0.3 }),
    );
  c.after('clock-serial', () => finishClock(serial + CLOCK.commit), 0.04);
  c.show('clock-serial', outcomes[0], { after: true, lead: -0.04 });
  c.after(
    'clock-overlap',
    () => {
      token.set(0);
      rows[ROW.decode].b.set(rows[ROW.decode].a.value);
      s.play(
        timeOn.to(0, { duration: 0.3 }),
        band.to(1, { duration: 0.6 }),
        ...span(ROW.transfer, CLOCK.early, overlap, 2),
        ...span(ROW.decode, overlap, overlap, 2),
      );
    },
    0.04,
  );
  c.after('clock-overlap-total', () => finishClock(overlap + CLOCK.commit), 0.04);
  c.show('clock-overlap-total', outcomes[1], { after: true, lead: -0.04 });
  c.after(
    'clock-queue',
    () => {
      token.set(0);
      rows[ROW.decode].b.set(rows[ROW.decode].a.value);
      rows[ROW.queue].a.set(0);
      rows[ROW.queue].b.set(0);
      s.play(
        timeOn.to(0, { duration: 0.3 }),
        show(ROW.queue),
        rows[ROW.queue].b.to(QUEUE_MS, { duration: 2 }),
        ...span(ROW.prefill, QUEUE_MS, QUEUE_MS + CLOCK.prefill, 2),
        ...span(ROW.transfer, QUEUE_MS + CLOCK.early, QUEUE_MS + overlap, 2),
        ...span(ROW.decode, QUEUE_MS + overlap, QUEUE_MS + overlap, 2),
      );
    },
    0.04,
  );
  // Show the current length of the wait as it pushes prefill along the second clock.
  c.after('clock-queue', () => rows[ROW.queue].measured.set(-1), 0.04);
  c.after('clock-queue-total', () => finishClock(QUEUE_MS + overlap + CLOCK.commit), 0.04);
  c.show('clock-queue-total', outcomes[2], { after: true, lead: -0.04 });
  c.after(
    'clock-queue-total',
    () => rows[ROW.whole].measured.set(QUEUE_MS + overlap + CLOCK.commit),
    0.04,
  );
  // The union of the active spans starts after the queue. The request starts before it.
  c.on('clock-union', () => {
    rows[ROW.setup].a.set(QUEUE_MS);
    rows[ROW.setup].b.set(QUEUE_MS);
    rows[ROW.whole].a.set(0);
    rows[ROW.whole].b.set(0);
    s.play(
      band.to(0, { duration: 0.4 }),
      show(ROW.setup),
      show(ROW.whole),
      rows[ROW.setup].b.to(QUEUE_MS + (overlap + CLOCK.commit) * 0.85, { duration: 2 }),
      rows[ROW.whole].b.to(QUEUE_MS + overlap + CLOCK.commit, { duration: 2 }),
    );
  });
  c.after(
    'clock-union',
    () =>
      s.play(
        rows[ROW.setup].b.to(QUEUE_MS + overlap + CLOCK.commit, { duration: 0.3, ease: linear }),
      ),
    0.04,
  );
  c.after('clock-union', () => rows[ROW.setup].measured.set(overlap + CLOCK.commit), 0.34);
  c.on('clock-endpoints', () => s.play(indicate(chart.names[ROW.whole], { color: COLOR.mark })));
  c.swap('clock-p99', outcomes, p99);

  // Beat 4: what a number of latency can hide.
  c.swap('bytes-unique', p99, [bytes.axis, bytes.names, bytes.marks]);
  c.on(
    'bytes-unique',
    () => s.play(unique.to(1, { duration: 1.6 }), wire.to(1, { duration: 1.6 })),
    0.4,
  );
  c.on('bytes-retries', () => s.play(wire.to(1.5, { duration: 1.6 })));
  c.show('bytes-track', tracked);
  c.show('goodput', [requestName, requests]);
  c.on('goodput', () => s.play(offered.to(OFFERED, { duration: 1.6, ease: linear })));
  c.show('trace-ids', ids);
  c.show('compare-pools', same);
  c.on('reject-most', () =>
    s.play(met.to(KEPT, { duration: 1.2, ease: linear }), turned.to(1, { duration: 1.2 })),
  );
}
