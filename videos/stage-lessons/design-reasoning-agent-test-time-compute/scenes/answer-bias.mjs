import { group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  cinemaHeader,
  clampDur,
  glowMeter,
  guardedDynamic,
  metricReadout,
  txt,
} from '../parts.mjs';

export function buildAnswerBias(s, c) {
  s.add(aura(-460, -40, 560, ROLE.fail, COSMOS.bg));
  s.add(aura(460, 120, 560, ROLE.focus, COSMOS.bg));

  s.add(
    cinemaHeader('ENDPOINT BIAS IN GRADERS', 'Lock the step verdict', 'before seeing the answer', {
      x: -860,
      y: -445,
      accent: ROLE.fail,
      size: 46,
    }),
  );

  const invRev = s.value(0);
  const corOn = s.value(0);
  const wrgOn = s.value(0);
  const cntOn = s.value(0);
  const rateRev = s.value(0);
  const solvRev = s.value(0);

  // Strict prediction withholding for BOTH beats!
  c.after('bias-invalid', () =>
    s.play(invRev.to(1, { duration: clampDur(c, c.cue('bias-invalid').end, 0.45) })),
  );
  c.on('bias-correct', () =>
    s.play(corOn.to(1, { duration: clampDur(c, c.cue('bias-correct').start, 0.45) })),
  );
  c.on('bias-wrong', () =>
    s.play(wrgOn.to(1, { duration: clampDur(c, c.cue('bias-wrong').start, 0.45) })),
  );
  c.on('bias-eval-count', () =>
    s.play(cntOn.to(1, { duration: clampDur(c, c.cue('bias-eval-count').start, 0.5) })),
  );
  c.after('bias-eval-rate', () =>
    s.play(rateRev.to(1, { duration: clampDur(c, c.cue('bias-eval-rate').end, 0.45) })),
  );
  c.after('bias-solver-rate', () =>
    s.play(solvRev.to(1, { duration: clampDur(c, c.cue('bias-solver-rate').end, 0.45) })),
  );

  s.add(
    guardedDynamic(
      () => 1,
      () => {
        const iv = invRev.value;
        const co = corOn.value;
        const wg = wrgOn.value;
        const cn = cntOn.value;
        const rr = rateRev.value;
        const sr = solvRev.value;
        const nodes = [];

        // Top: Math derivation box + locked step verdict + swapped endpoint
        const yBox = -125;
        nodes.push(
          rect(820, 168, {
            fill: '#0b1224',
            stroke: iv > 0.5 ? ROLE.fail : ROLE.focus,
            width: 2.8,
            radius: 10,
          }).at(-430, yBox),
          txt('SOLVE:  x * (x - 3) = 0', -800, yBox - 46, 28, ROLE.agent, 'mono', 'left'),
          txt(
            'STEP 1: Divide both sides by x -> x - 3 = 0',
            -800,
            yBox + 2,
            26,
            COSMOS.ink,
            'mono',
            'left',
          ),
          txt(
            iv > 0.5 ? 'VERDICT: INVALID (DROPS x = 0!)' : 'STEP VERDICT: [ LOCK BEFORE ANSWER ]',
            -800,
            yBox + 48,
            26,
            iv > 0.5 ? ROLE.fail : ROLE.focus,
            'mono',
            'left',
          ),
        );

        // Endpoint panel on right
        let endLabel = 'FINAL ANSWER: [ HIDDEN ]';
        let endCol = COSMOS.muted;
        if (wg > 0.5) {
          endLabel = 'ENDPOINT: x = 4 (WRONG)';
          endCol = ROLE.fail;
        } else if (co > 0.5) {
          endLabel = 'ENDPOINT: x in {0, 3} (CORRECT)';
          endCol = ROLE.ok;
        }
        nodes.push(
          rect(760, 168, { fill: '#0b1224', stroke: endCol, width: 2.6, radius: 10 }).at(460, yBox),
          txt(endLabel, 460, yBox - 26, 28, endCol, 'mono', 'center'),
          txt(
            co > 0.5
              ? 'SAME DIVISION STEP IS STILL INVALID!'
              : 'DO NOT LET ENDPOINT FLIP STEP JUDGMENT',
            460,
            yBox + 28,
            26,
            COSMOS.muted,
            'mono',
            'center',
          ),
        );

        // Bottom: Separate Grader False-Accept vs Ordinary Solver Accuracy
        nodes.push(line([-860, 20], [840, 20], { stroke: '#233152', width: 2 }));
        const cAlpha = 0.25 + 0.75 * cn;

        nodes.push(
          txt(
            'VAIR MATH STUDY: GPT-5.4 GRADED FLAWED + CORRECT-ENDPOINT SOLUTIONS RIGHT ONLY 47.9%',
            0,
            78,
            26,
            ROLE.warn,
            'mono',
            'center',
          ).opacity(cAlpha),
        );

        // Grader meter (6 / 8 -> 75% withheld until bias-eval-rate!)
        nodes.push(
          txt(
            'FLAWED-SET GRADER (6 ACCEPTED / 8 FLAWED)',
            -840,
            162,
            26,
            ROLE.fail,
            'mono',
            'left',
          ).opacity(cAlpha),
          glowMeter(-840, 224, 720, 44, rr > 0.5 ? 0.75 : 0.25, {
            fill: ROLE.fail,
            opacity: cAlpha,
          }),
          metricReadout('FALSE ACCEPTANCE RATE', rr > 0.5 ? '75%  (6 / 8)' : '? %', -480, 344, {
            color: rr > 0.5 ? ROLE.fail : ROLE.focus,
            size: 42,
          }).opacity(cAlpha),
        );

        // Solver meter (9 / 10 -> 90% withheld until bias-solver-rate!)
        nodes.push(
          txt('ORDINARY-SET SOLVER (9 RIGHT / 10)', 80, 162, 26, ROLE.ok, 'mono', 'left').opacity(
            cAlpha,
          ),
          glowMeter(80, 224, 720, 44, sr > 0.5 ? 0.9 : 0.25, {
            fill: ROLE.ok,
            opacity: cAlpha,
          }),
          metricReadout('SEPARATE SOLVER RATE', sr > 0.5 ? '90%  (9 / 10)' : '---', 440, 344, {
            color: sr > 0.5 ? ROLE.ok : COSMOS.muted,
            size: 42,
          }).opacity(cAlpha),
        );

        return group(...nodes);
      },
    ),
  );
}
