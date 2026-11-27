// Scene 22: cold-reservation - Can this generation start?
// Mode 0 (beat 0 `cold-receipts`): Warm vs cold calls crossing the $0.005 lab ceiling.
// Mode 1 (beats 1-3): Worst-case cold reservation bar against $0.010 gateway ceiling:
//   `reserve-limit`: 2,200 cold + 300 cap = $0.01000 <= $0.010 -> START.
//   `longer-input`: +100 input tokens (2,300) -> verdict strictly withheld during beat 2 question!
//   `refuse-call`: reveals REFUSE ($0.01025 > $0.010).
// Mode 2 (beat 4 `reasoning-cap`): All 300 billed output tokens spent on reasoning -> 0 visible text (incomplete).
import { group, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  cinemaHeader,
  clampDur,
  coldMicro,
  dashedRule,
  fadeInHalf,
  fadeOutHalf,
  fmtInt,
  glowBar,
  guardedDynamic,
  prefixMicro,
  priceMicroDollars,
  standard,
  txt,
  usd,
} from '../parts.mjs';

export default function coldReservation(s, c) {
  const pulseT = s.value(0);
  const mode = s.value(0); // 0 = $0.005 observed, 1 = $0.010 reservation gate, 2 = 300 reasoning cap
  const coldObs = s.value(0); // `cold-receipts`
  const resStart = s.value(0); // `reserve-limit`
  const longerIn = s.value(0); // `longer-input`
  const refuseVerdict = s.value(0); // `refuse-call`
  const reasonFill = s.value(0); // `reasoning-cap`

  const coldExcMicro = priceMicroDollars(2200, 0, 130); // 7450 = $0.00745

  const header = cinemaHeader('PRE-CALL RESERVATION GATE', 'Price the cold', 'worst case first', {
    x: -860,
    y: -415,
    accent: ROLE.cached,
    size: 52,
  });

  const sceneAura = aura(100, 40, 720, '#ffd16620', '#ff6b8b1e');

  // Mode 0: Observed warm vs cold calls crossing $0.005 ceiling
  const mode0 = guardedDynamic(
    () => fadeOutHalf(mode.value),
    (a) => {
      const p = coldObs.value;
      const barX = -320;
      const barW = 940;
      const maxM = 8000;
      const ceilX = barX + (5000 / maxM) * barW;

      const rows = [
        { label: 'Policy · warm prefix', cost: prefixMicro, color: ROLE.ok, prog: 1 },
        {
          label: 'Policy · cold prefix',
          cost: coldMicro,
          color: ROLE.fail,
          prog: Math.min(1, p * 2),
        },
        {
          label: 'Concise exception · cold',
          cost: coldExcMicro,
          color: ROLE.fail,
          prog: Math.max(0, Math.min(1, p * 2 - 0.6)),
        },
      ];

      const nodes = [
        txt(
          'OBSERVED CALLS VS. LAB HALF-CENT CEILING',
          -860,
          -205,
          28,
          COSMOS.muted,
          'mono',
          'left',
        ).opacity(a),
        dashedRule(ceilX, -155, ceilX, 245, ROLE.breach, { width: 3.0, opacity: a }),
        txt('$0.005 CEILING', ceilX, 282, 28, ROLE.breach, 'mono').glow(6, ROLE.breach).opacity(a),
      ];

      rows.forEach((r, idx) => {
        const y = -95 + idx * 145;
        nodes.push(
          txt(r.label, -860, y, 30, r.color, 'sans', 'left').opacity(a),
          glowBar(barX, y, barW, 42, (r.cost / maxM) * r.prog, {
            fill: r.color,
            glow: 9,
            opacity: a,
          }),
        );
        if (r.prog > 0.7) {
          nodes.push(txt(usd(r.cost, 5), 840, y, 34, r.color, 'mono', 'right').opacity(r.prog * a));
        }
      });

      nodes.push(
        txt(
          'Gateway ceiling allows $0.010 per generation  ·  reserve cold worst case before starting',
          -860,
          375,
          28,
          ROLE.cached,
          'sans',
          'left',
        ).opacity(a),
      );

      return group(...nodes);
    },
  );

  // Mode 1: Worst-case cold reservation bar against $0.010 ceiling (beats 1-3)
  const mode1 = guardedDynamic(
    () => Math.min(fadeInHalf(mode.value), fadeOutHalf(Math.max(0, mode.value - 1))),
    (a) => {
      const rs = resStart.value;
      const li = longerIn.value;
      const rv = refuseVerdict.value;
      const isLonger = li > 0.5;
      const inputTok = isLonger ? 2300 : 2200;
      const inMicro = inputTok * standard.input; // 5500 or 5750
      const outMicro = 300 * standard.output; // 4500
      const totMicro = inMicro + outMicro; // 10000 or 10250

      const barX = -840;
      const scale = 1520 / 11500; // $0.0115 full width
      const inW = inMicro * scale;
      const outW = outMicro * scale;
      const ceilX = barX + 10000 * scale;

      const nodes = [
        txt(
          `COLD INPUT: ${fmtInt(inputTok)} tokens`,
          -840,
          -195,
          34,
          ROLE.input,
          'mono',
          'left',
        ).opacity(a),
        txt(`OUTPUT CAP: 300 tokens`, 840, -195, 34, ROLE.output, 'mono', 'right').opacity(a),

        txt(`${usd(inMicro, 5)} cold input`, -840, -135, 32, ROLE.input, 'mono', 'left').opacity(a),
        txt(`${usd(outMicro, 5)} max output`, 840, -135, 32, ROLE.output, 'mono', 'right').opacity(
          a,
        ),

        // Stacked worst-case reservation bar (y = -20)
        rect(inW - 4, 86, { fill: '#0f2b3d', stroke: ROLE.input, width: 2.6, radius: 10 })
          .at(barX + inW * 0.5, -20)
          .glow(8, ROLE.input)
          .opacity(a),
        txt(usd(inMicro, 5), barX + inW * 0.5, -20, 30, ROLE.input, 'mono').opacity(a),

        rect(outW - 4, 86, { fill: '#351324', stroke: ROLE.output, width: 2.6, radius: 10 })
          .at(barX + inW + outW * 0.5, -20)
          .glow(8, ROLE.output)
          .opacity(a),
        txt(usd(outMicro, 5), barX + inW + outW * 0.5, -20, 30, ROLE.output, 'mono').opacity(a),

        // $0.010 gateway ceiling wall
        dashedRule(ceilX, -95, ceilX, 75, ROLE.cached, { width: 3.4, opacity: a }),
        txt('$0.01000 CEILING', ceilX, 118, 28, ROLE.cached, 'mono')
          .glow(7, ROLE.cached)
          .opacity(a),
        txt('Rule: worst_case <= $0.01000', -840, 118, 28, COSMOS.muted, 'mono', 'left').opacity(a),
      ];

      // Verdict area: strictly withheld on beat 2 (`isLonger && rv < 0.5`)!
      if (isLonger && rv < 0.5) {
        nodes.push(
          txt(
            '2,300 input + 300 cap  ·  May this call start under the same rule?',
            0,
            290,
            36,
            ROLE.cached,
            'serif',
          )
            .glow(7, ROLE.cached)
            .opacity(a),
        );
      } else if (isLonger && rv >= 0.5) {
        nodes.push(
          rect(980, 82, { fill: '#351324', stroke: ROLE.fail, width: 2.8, radius: 14 })
            .at(0, 275)
            .glow(11, ROLE.fail)
            .opacity(rv * a),
          txt(`REFUSE  ·  ${usd(totMicro, 5)} > $0.01000`, 0, 275, 36, ROLE.fail, 'mono').opacity(
            rv * a,
          ),
          txt(
            'Include separate cache-write fees in worst-case reservations too',
            0,
            378,
            26,
            COSMOS.muted,
            'sans',
          ).opacity(rv * a),
        );
      } else if (rs > 0.4) {
        nodes.push(
          txt(
            `START  ·  ${usd(totMicro, 5)} <= $0.01000 (equality allowed)`,
            0,
            275,
            36,
            ROLE.ok,
            'mono',
          )
            .glow(10, ROLE.ok)
            .opacity(rs * a),
        );
      } else {
        nodes.push(
          txt(
            'Reserve cold input + full output cap before dialing provider',
            0,
            285,
            30,
            COSMOS.muted,
            'sans',
          ).opacity(a),
        );
      }

      return group(...nodes);
    },
  );

  // Mode 2: 300-Token Output Cap Consumed Completely by Reasoning
  const mode2 = guardedDynamic(
    () => fadeInHalf(Math.max(0, mode.value - 1)),
    (a) => {
      const rf = reasonFill.value;
      const used = Math.round(300 * rf);
      const nodes = [
        txt(
          'OUTPUT ALLOWANCE FOR THIS CALL: 300 TOKENS',
          -840,
          -185,
          30,
          COSMOS.ink,
          'mono',
          'left',
        ).opacity(a),
        glowBar(-840, -65, 1680, 86, Math.max(0.05, rf), {
          fill: ROLE.reasoning,
          border: ROLE.output,
          glow: 11,
          opacity: a,
        }),
        txt(
          `${used} / 300 billed output tokens spent on reasoning`,
          -840,
          52,
          36,
          ROLE.reasoning,
          'mono',
          'left',
        )
          .glow(7, ROLE.reasoning)
          .opacity(a),
        txt('Visible answer tokens: 0', -840, 145, 38, COSMOS.ink, 'mono', 'left').opacity(a),
        txt(
          used >= 295
            ? 'OUTPUT CAP REACHED  ·  INCOMPLETE ANSWER'
            : 'Cap limits billed output, including hidden reasoning',
          -840,
          255,
          36,
          used >= 295 ? ROLE.fail : COSMOS.muted,
          'mono',
          'left',
        )
          .glow(used >= 295 ? 9 : 0, ROLE.fail)
          .opacity(a),
        txt(
          'Test tight lanes with low/no reasoning, or raise cap & reservation together',
          -840,
          355,
          28,
          COSMOS.muted,
          'sans',
          'left',
        ).opacity(a),
      ];
      return group(...nodes);
    },
  );

  s.add(sceneAura, header, mode0, mode1, mode2);

  c.on('cold-receipts', () => {
    const t = c.cue('cold-receipts').start;
    s.play(coldObs.to(1, { duration: clampDur(c, t, 0.8) }));
  });
  c.onBeat(1, () => {
    const t = c.beats[1].start;
    s.play(mode.to(1, { duration: clampDur(c, t, 0.35) }));
  });
  c.on('reserve-limit', () => {
    const t = c.cue('reserve-limit').start;
    s.play(resStart.to(1, { duration: clampDur(c, t, 0.5) }));
  });
  c.on('longer-input', () => {
    const t = c.cue('longer-input').start;
    s.play(longerIn.to(1, { duration: clampDur(c, t, 0.45) }));
  });
  c.on('refuse-call', () => {
    const t = c.cue('refuse-call').start;
    s.play(refuseVerdict.to(1, { duration: clampDur(c, t, 0.4) }));
  });
  c.onBeat(4, () => {
    const t = c.beats[4].start;
    s.play(mode.to(2, { duration: clampDur(c, t, 0.35) }));
  });
  c.on('reasoning-cap', () => {
    const t = c.cue('reasoning-cap').start;
    s.play(reasonFill.to(1, { duration: clampDur(c, t, 0.85) }));
  });
}
