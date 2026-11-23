import { energyCandidate, integrateEnergy } from '../arithmetic.mjs';
import { cueProgress, fieldDrawing } from '../field-drawing.mjs';
import { batteryScale, phaseTable, shiftHeader } from '../shift.mjs';

const shiftA = energyCandidate('A'),
  shiftB = energyCandidate('B');
const hours = 8;
const total = (c) => integrateEnergy(c, hours * 3600);
const phaseEnergy = (c) => c.phases.map(({ watts, seconds }) => (watts * seconds) / 3600);

export function drawEnergy(ctx, scene, state, api) {
  const p = fieldDrawing(ctx, api);
  const cue = (id, beat, from, to) => cueProgress(state, id, beat, from, to);
  const second = cue('b-spec', 2, 0.13, 0.33) > 0;
  const candidate = second ? shiftB : shiftA;
  const aTime = cue('a-time', 0, 0.25, 0.44) === 1,
    aDecode = cue('a-decode', 0, 0.8, 0.96);
  const prefill = cue('a-prefill', 1, 0.07, 0.26),
    idle = cue('a-idle', 1, 0.35, 0.49);
  const aBill = cue('a-bill', 1, 0.49, 0.61),
    aTotal = cue('a-total', 1, 0.63, 0.7) === 1;
  const reserve = cue('reserve', 1, 0.78, 0.89) > 0;
  const bTime = cue('b-time', 2, 0.35, 0.45) === 1,
    bIdle = cue('b-idle', 2, 0.48, 0.61) === 1;
  const bBill = cue('b-bill', 3, 0.02, 0.22),
    verdict = cue('b-verdict', 3, 0.4, 0.54) === 1;
  shiftHeader(p, 'Work order   /   30,000 tokens in 8 hours', 'Illustrative power budget');
  phaseTable(p, candidate.phases, [
    { visible: prefill > 0, wh: prefill === 1 },
    {
      visible: true,
      time: second
        ? bTime
          ? null
          : '30,000 / 10 tokens/s'
        : aTime
          ? '≈ 1,667 s'
          : '30,000 / 18 tokens/s',
      wh: second ? bTime : aDecode === 1,
    },
    {
      visible: idle > 0,
      time:
        second && !bIdle
          ? '28,800 − active seconds'
          : !second && idle === 1
            ? '≈ 26,533 s'
            : idle < 1
              ? '28,800 − active seconds'
              : null,
      wh: second ? bIdle : idle === 1,
    },
  ]);
  const a = phaseEnergy(shiftA);
  const strips = [
    {
      name: 'Candidate A',
      amounts: [a[0] * prefill, a[1] * aDecode, a[2] * aBill],
      total: aTotal ? total(shiftA).toFixed(2) + ' Wh' : null,
    },
  ];
  if (second) {
    const b = phaseEnergy(shiftB);
    strips.push({
      name: 'Candidate B',
      amounts: b.map((v) => v * bBill),
      total: bBill === 1 ? total(shiftB).toFixed(2) + ' Wh' : null,
    });
  }
  batteryScale(p, { max: 15, nominal: 15, usable: 12, showLimit: reserve, strips });
  const line = verdict
    ? 'Reserve spent   /   ' + (total(shiftB) - 12).toFixed(2) + ' Wh beyond the usable charge'
    : second
      ? 'Can B finish the shift and keep the reserve?'
      : aTotal && reserve
        ? 'Reserve kept   /   ' + (12 - total(shiftA)).toFixed(2) + ' Wh to spare'
        : 'Phase energy   =   watts × seconds / 3,600';
  p.text(line, 960, 998, 40, verdict ? p.C.pink : p.C.ink, 'center');
}
export default {
  id: 'energy',
  draw: drawEnergy,
  cues: [
    'a-time',
    'a-decode',
    'a-prefill',
    'a-idle',
    'a-bill',
    'a-total',
    'reserve',
    'b-spec',
    'b-time',
    'b-idle',
    'b-bill',
    'b-verdict',
  ],
};
