// Scene 17: nightly-receipt - Price the same evaluation twice
// Mode 0 (beats 0-2): Batch receipt repricing 1,280 policy tokens ($0.125/M -> $1.25/M) & scaling 1 -> 2,000 calls ($2.82 vs $5.70, delta $2.88).
// Mode 1 (beats 3-4): Signature 30-night evaluation calendar marking 12 cold nights.
// Prediction strictly withheld on beat 0 AND beat 3 (`$32.82 / 12 = ?`) until `reprice-prefix` and `divide-cushion`.
import { group, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  batch,
  budgetMicro,
  buildNightCalendar,
  cinemaHeader,
  clampDur,
  coldEvaluationMicro,
  coldNightExtraMicro,
  evaluationMicro,
  fadeInHalf,
  fadeOutHalf,
  fmtInt,
  guardedDynamic,
  headroomMicro,
  monthlyMicro,
  nightlyCalls,
  priceMicroDollars,
  txt,
  usd,
} from '../parts.mjs';

export default function nightlyReceipt(s, c) {
  const pulseT = s.value(0);
  const mode = s.value(0); // 0 = batch receipt & 2000-call scale, 1 = 30-night calendar
  const repriceProg = s.value(0); // `reprice-prefix`
  const scaleProg = s.value(0); // `price-night`
  const markProg = s.value(0); // `mark-nights`
  const divideProg = s.value(0); // `divide-cushion`

  const warmOne = priceMicroDollars(1800, 1280, 80, batch); // 1410 -> $0.001410
  const coldOne = priceMicroDollars(1800, 0, 80, batch); // 2850 -> $0.002850
  const allowanceMicro = headroomMicro / 12; // 2,735,000 -> $2.735

  const header = cinemaHeader('BATCH EVALUATION RECEIPT', 'Price the same', 'evaluation twice', {
    x: -860,
    y: -415,
    accent: ROLE.cached,
    size: 52,
  });

  const sceneAura = aura(0, 50, 720, '#ffd16622', '#60a5fa1c');

  // Mode 0: Batch receipt (1,280 policy + 520 new + 80 output) -> scale to 2,000 checks
  const mode0 = guardedDynamic(
    () => fadeOutHalf(mode.value),
    (a) => {
      const rp = repriceProg.value;
      const sc = scaleProg.value;
      const repriced = rp > 0.5;
      const calls = sc > 0.02 ? 1 + Math.round((nightlyCalls - 1) * sc) : 1;
      const digits = calls === nightlyCalls ? 2 : 6;

      const nodes = [
        txt(
          'ESTIMATED GPT-5.4 BATCH RATES  (50% OF STANDARD)',
          -860,
          -205,
          26,
          COSMOS.muted,
          'mono',
          'left',
        ).opacity(a),

        // 1,280 policy prefix block
        rect(780, 92, {
          fill: repriced ? '#0f2b3d' : '#3a2d0f',
          stroke: repriced ? ROLE.input : ROLE.cached,
          width: 2.6,
          radius: 12,
        })
          .at(-470, -105)
          .glow(10, repriced ? ROLE.input : ROLE.cached)
          .opacity(a),
        txt(
          '1,280 policy tokens',
          -470,
          -105,
          32,
          repriced ? ROLE.input : ROLE.cached,
          'mono',
        ).opacity(a),
        txt(
          repriced ? 'Ordinary Batch x $1.25/M' : 'Cache read x $0.125/M',
          -470,
          -20,
          28,
          repriced ? ROLE.input : ROLE.cached,
          'mono',
        ).opacity(a),
        txt(
          usd(1280 * (repriced ? batch.input : batch.cached), 6),
          -470,
          30,
          32,
          COSMOS.ink,
          'mono',
        ).opacity(a),

        // 520 new input block
        rect(400, 92, { fill: '#0f2b3d', stroke: ROLE.input, width: 2.2, radius: 12 })
          .at(140, -105)
          .glow(7, ROLE.input)
          .opacity(a),
        txt('520 new', 140, -105, 32, ROLE.input, 'mono').opacity(a),
        txt('Input x $1.25/M', 140, -20, 28, ROLE.input, 'mono').opacity(a),
        txt(usd(520 * batch.input, 6), 140, 30, 32, COSMOS.ink, 'mono').opacity(a),

        // 80 output block
        rect(440, 92, { fill: '#351324', stroke: ROLE.output, width: 2.4, radius: 12 })
          .at(590, -105)
          .glow(8, ROLE.output)
          .opacity(a),
        txt('80 output', 590, -105, 32, ROLE.output, 'mono').opacity(a),
        txt('Output x $7.50/M', 590, -20, 28, ROLE.output, 'mono').opacity(a),
        txt(usd(80 * batch.output, 6), 590, 30, 32, COSMOS.ink, 'mono').opacity(a),

        // Scaling readout
        txt(
          calls === 1 ? 'ONE EVALUATION CALL' : `${fmtInt(calls)} EVALUATION CALLS (ONE NIGHT)`,
          -860,
          145,
          28,
          COSMOS.muted,
          'mono',
          'left',
        ).opacity(a),
        txt(
          `With prefix reads:  ${usd(calls * warmOne, digits)}`,
          -860,
          218,
          40,
          ROLE.cached,
          'mono',
          'left',
        )
          .glow(7, ROLE.cached)
          .opacity(a),
      ];

      if (repriced) {
        nodes.push(
          txt(
            `Without reads:  ${usd(calls * coldOne, digits)}`,
            840,
            218,
            40,
            ROLE.input,
            'mono',
            'right',
          )
            .glow(7, ROLE.input)
            .opacity(rp * a),
        );
      }

      if (sc > 0.85) {
        nodes.push(
          txt(
            `${usd(coldEvaluationMicro)} - ${usd(evaluationMicro)} = ${usd(coldNightExtraMicro)} extra per cold night`,
            0,
            355,
            38,
            ROLE.cached,
            'mono',
          )
            .glow(8, ROLE.cached)
            .opacity(sc * a),
        );
      } else if (!repriced) {
        nodes.push(
          txt(
            'If the prefix read misses, which part of the bill changes?',
            0,
            355,
            36,
            ROLE.cached,
            'serif',
          )
            .glow(6, ROLE.cached)
            .opacity(a),
        );
      } else {
        nodes.push(
          txt(
            'Only the 1,280 policy tokens reprice  ·  520 new & 80 output stay fixed',
            0,
            355,
            30,
            COSMOS.ink,
            'sans',
          ).opacity(a),
        );
      }

      return group(...nodes);
    },
  );

  // Mode 1: 30-Night Forecast Calendar + 12-night cushion division
  const mode1 = guardedDynamic(
    () => fadeInHalf(mode.value),
    (a) => {
      const mp = markProg.value;
      const dp = divideProg.value;
      const marked = Math.round(12 * mp);
      const divided = dp > 0.5;

      const nodes = [
        txt(
          '30-NIGHT EVALUATION CALENDAR  ·  2,000 CALLS / NIGHT',
          -840,
          -190,
          26,
          ROLE.batch,
          'mono',
          'left',
        ).opacity(a),
        buildNightCalendar({
          xLeft: -840,
          yTop: -135,
          colStep: 94,
          rowStep: 102,
          coldCount: 0,
          markedCount: marked,
          alpha: a,
        }),

        // Right-side forecast column
        txt('MONTHLY BUDGET', 210, -165, 26, COSMOS.muted, 'mono', 'left').opacity(a),
        txt(usd(budgetMicro), 210, -100, 56, COSMOS.ink, 'mono', 'left').opacity(a),

        txt('MONTHLY CUSHION', 210, -10, 26, ROLE.ok, 'mono', 'left').opacity(a),
        txt(`${usd(headroomMicro)} left`, 210, 52, 46, ROLE.ok, 'mono', 'left')
          .glow(7, ROLE.ok)
          .opacity(a),

        txt('ALLOWANCE FOR 12 COLD NIGHTS', 210, 148, 26, ROLE.cached, 'mono', 'left').opacity(a),
        txt(
          divided ? `${usd(allowanceMicro, 3)} / night` : '?  / night',
          210,
          218,
          48,
          divided ? ROLE.fail : ROLE.cached,
          'mono',
          'left',
        )
          .glow(9, divided ? ROLE.fail : ROLE.cached)
          .opacity(a),

        // Bottom equation / prompt
        txt(
          divided
            ? `${usd(headroomMicro)} / 12 = ${usd(allowanceMicro, 3)}  <  ${usd(coldNightExtraMicro)} per cold night`
            : marked > 0
              ? `${usd(headroomMicro)} cushion across 12 cold nights  ·  How much extra per night?`
              : `${usd(budgetMicro)} budget - ${usd(monthlyMicro)} base = ${usd(headroomMicro)} cushion`,
          0,
          365,
          34,
          divided ? ROLE.fail : ROLE.cached,
          divided ? 'mono' : 'serif',
        )
          .glow(7, divided ? ROLE.fail : ROLE.cached)
          .opacity(a),
      ];
      return group(...nodes);
    },
  );

  s.add(sceneAura, header, mode0, mode1);

  c.on('reprice-prefix', () => {
    const t = c.cue('reprice-prefix').start;
    s.play(repriceProg.to(1, { duration: clampDur(c, t, 0.55) }));
  });
  c.on('price-night', () => {
    const t = c.cue('price-night').start;
    s.play(scaleProg.to(1, { duration: clampDur(c, t, 0.85) }));
  });
  c.onBeat(3, () => {
    const t = c.beats[3].start;
    s.play(mode.to(1, { duration: clampDur(c, t, 0.35) }));
  });
  c.on('mark-nights', () => {
    const t = c.cue('mark-nights').start;
    s.play(markProg.to(1, { duration: clampDur(c, t, 0.7) }));
  });
  c.on('divide-cushion', () => {
    const t = c.cue('divide-cushion').start;
    s.play(divideProg.to(1, { duration: clampDur(c, t, 0.45) }));
  });
}
