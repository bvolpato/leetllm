import { edgeDevice } from '../arithmetic.mjs';
import { cueProgress, fieldDrawing } from '../field-drawing.mjs';
import { batteryScale, phaseTable, shiftHeader } from '../shift.mjs';

const original = edgeDevice(1),
  revised = edgeDevice(0.9);
const format = (n) => n.toLocaleString('en-US');

export function drawFreshDevice(ctx, scene, state, api) {
  const p = fieldDrawing(ctx, api),
    { C, text, rect, target } = p;
  const b = state.beat ?? 0;
  const cue = (id, beat, from, to) => cueProgress(state, id, beat, from, to);
  const ready = (key, beat, from, to) => cue('edge-fresh-device-' + key, beat, from, to) === 1;
  const order = cue('six-order', 1, 0.44, 0.54) > 0;
  if (!order) {
    shiftHeader(p, 'Underground crew   /   6 hours', 'New handheld · local manual');
    const payload = ready('payload', 1, 0.03, 0.12),
      ceiling = ready('ceiling', 1, 0.13, 0.23);
    target('fresh-bus', () => {
      text('One packed-weight read per token', 160, 366, 34, C.muted);
      text(
        '2.4B weights × 4 bits / 8' + (payload ? '   =   ' + original.payload / 1e9 + ' GB' : ''),
        160,
        443,
        44,
      );
      text(
        '36 GB/s bus' +
          (ceiling ? '   /   1.2 GB   =   ' + original.ceiling + ' steps/s at most' : ''),
        160,
        520,
        42,
        C.blue,
      );
    });
    target('fresh-memory', () => {
      text('Resident memory   /   2,048 MiB available', 160, 648, 35, C.muted);
      let x = 165;
      const width = 1540;
      const colors = [C.blue, C.cyan, C.yellow, C.green];
      rect(x, 686, width, 68, C.panel, C.muted);
      original.memory.forEach((v, i) => {
        const w = (width * v) / 2048;
        rect(x, 691, w, 58, colors[i]);
        x += w;
      });
      ['Weights', 'KV', 'Workspace', 'Runtime'].forEach((name, i) =>
        text(name + '  ' + format(original.memory[i]) + ' MiB', 162 + 410 * i, 837, 33, colors[i]),
      );
      if (ready('memory', 1, 0.25, 0.34)) {
        const margin = ready('margin', 1, 0.34, 0.43);
        text(
          format(original.resident) +
            ' MiB resident' +
            (margin ? '   /   ' + original.margin + ' MiB free' : ''),
          960,
          961,
          43,
          C.ink,
          'center',
        );
      }
    });
    return;
  }

  const repair = ready('repair-input', 3, 0.04, 0.36);
  const shrink = cue('repair-shrink', 4, 0.02, 0.15);
  const dev = repair ? revised : original;
  const decoded = ready('decode', 2, 0.03, 0.15),
    idle = ready('idle', 2, 0.3, 0.46);
  const bill = cue('six-bill', 2, 0.47, 0.62),
    sum = ready('energy', 2, 0.68, 0.77);
  const hold = ready('hold', 2, 0.78, 0.85);
  const newSum = ready('repair-total', 4, 0.27, 0.38),
    pass = ready('repair-pass', 4, 0.39, 0.47);
  const trial = cue('trial', 4, 0.47, 0.55) === 1;
  const next = cue('next-draft', 4, 0.91, 0.95) > 0;
  shiftHeader(
    p,
    next
      ? 'Next lesson   /   Draft and verify tokens'
      : 'Crew shift   /   10,000 tokens in 6 hours',
    'Sensor A · local log',
    'fresh-order',
  );
  const phases = dev.seconds.map((seconds, i) => ({ seconds, watts: dev.watts[i] }));
  if (trial) {
    text('Offline trial', 150, 375, 36, C.muted);
    target('trial-known', () => {
      text('A / E2', 150, 467, 54, C.cyan);
      if (cue('trial-known', 4, 0.58, 0.65) === 1)
        text('Expected log: “battery low”   /   M7', 540, 467, 43);
    });
    if (cue('trial-missing', 4, 0.66, 0.7) > 0)
      target('trial-missing', () => {
        text('A / E9', 150, 557, 54, C.cyan);
        if (cue('trial-review', 4, 0.71, 0.75) === 1)
          text('Expected route: local review', 540, 557, 43);
      });
    if (cue('trial-review', 4, 0.71, 0.75) === 1)
      text(
        'Time the first answer and the ten-minute rate. Measure a shift and rehearse recovery.',
        150,
        639,
        33,
        C.muted,
      );
  } else {
    phaseTable(
      p,
      phases,
      [
        { visible: true, wh: bill === 1 },
        { visible: true, time: decoded ? undefined : '10,000 / 20 tokens/s', wh: bill === 1 },
        {
          visible: true,
          time: idle ? undefined : '21,600 − active seconds',
          wh: repair ? shrink === 1 : bill === 1,
        },
      ],
      3,
    );
  }
  const prior = {
    name: 'Idle  1.0 W',
    amounts: original.wh.map((v) => v * bill),
    total: sum ? original.total.toFixed(2) + ' Wh' : null,
  };
  const strips = [prior];
  if (repair) {
    const amounts = [dev.wh[0], dev.wh[1], original.wh[2] + (dev.wh[2] - original.wh[2]) * shrink];
    strips.push({
      name: 'Idle  0.9 W',
      amounts: shrink > 0 ? amounts : [0, 0, 0],
      total: newSum ? dev.total.toFixed(2) + ' Wh' : null,
    });
  }
  batteryScale(p, { max: 7.5, usable: 6.5, showLimit: true, strips });
  let decision = 'Can the crew finish on 6.5 Wh?';
  if (sum) decision = original.total.toFixed(2) + (hold ? ' Wh > 6.5 Wh' : ' Wh total');
  if (b === 3 || b === 4) decision = 'Can the idle saving bring the shift under budget?';
  if (newSum) decision = revised.total.toFixed(2) + (pass ? ' Wh ≤ 6.5 Wh' : ' Wh total');
  if (trial) decision += '   /   Test on the handheld';
  text(decision, 960, 1000, 43, pass ? C.green : b === 2 && hold ? C.pink : C.ink, 'center');
}
export default {
  id: 'fresh-device',
  draw: drawFreshDevice,
  cues: [
    'six-input',
    'edge-fresh-device-payload',
    'edge-fresh-device-ceiling',
    'edge-fresh-device-memory',
    'edge-fresh-device-margin',
    'six-order',
    'edge-fresh-device-decode',
    'edge-fresh-device-idle',
    'six-bill',
    'edge-fresh-device-energy',
    'edge-fresh-device-hold',
    'edge-fresh-device-repair-input',
    'repair-shrink',
    'edge-fresh-device-repair-total',
    'edge-fresh-device-repair-pass',
    'trial',
    'trial-known',
    'trial-missing',
    'trial-review',
    'next-draft',
  ],
};
