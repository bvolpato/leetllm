import { group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  cinemaHeader,
  clampDur,
  dotItem,
  glowMeter,
  guardedDynamic,
  txt,
} from '../parts.mjs';

export function buildEvaluationRelease(s, c) {
  s.add(aura(-460, -40, 560, ROLE.focus, COSMOS.bg));
  s.add(aura(460, 120, 560, ROLE.fail, COSMOS.bg));

  s.add(
    cinemaHeader(
      'WHOLE-CONTROLLER EVAL',
      'Measure total cost & proxy drift',
      'before adding compute',
      {
        x: -860,
        y: -445,
        accent: ROLE.focus,
        size: 46,
      },
    ),
  );

  const divOn = s.value(0);
  const splitOn = s.value(0);

  c.on('eval-independent', () =>
    s.play(divOn.to(1, { duration: clampDur(c, c.cue('eval-independent').start, 0.55) })),
  );
  c.on('ra-evaluation-release-2-0', () =>
    s.play(
      splitOn.to(1, { duration: clampDur(c, c.cue('ra-evaluation-release-2-0').start, 0.55) }),
    ),
  );

  s.add(
    guardedDynamic(
      () => 1,
      () => {
        const dv = divOn.value;
        const sp = splitOn.value;
        const nodes = [];

        // Left: Snell et al. compute-matched regime
        nodes.push(
          txt(
            'COMPUTE-MATCHED TRADE-OFF (SNELL ET AL.)',
            -840,
            -210,
            26,
            ROLE.agent,
            'mono',
            'left',
          ),
          rect(760, 168, { fill: '#0b1224', stroke: ROLE.agent, width: 2.5, radius: 10 }).at(
            -460,
            -90,
          ),
          txt('SMALLER MODEL + TRAINED REVISION/VERIFIER', -810, -134, 26, ROLE.ok, 'mono', 'left'),
          txt('BEAT 14x LARGER MODEL ON SOME MATH', -810, -88, 26, COSMOS.ink, 'mono', 'left'),
          txt(
            'HARDER PROMPTS / HEAVY LOAD -> FAVOR LARGE',
            -810,
            -42,
            26,
            ROLE.warn,
            'mono',
            'left',
          ),
        );

        // Right: Gao et al. Proxy Overoptimization (0.65 -> 0.80 while independent 0.76 -> 0.60!)
        const dAlpha = 0.35 + 0.65 * dv;
        nodes.push(
          txt(
            'PROXY OVEROPTIMIZATION (GAO ET AL.)',
            60,
            -210,
            26,
            ROLE.fail,
            'mono',
            'left',
          ).opacity(dAlpha),
          txt('PROXY REWARD:  0.65 -> 0.80  (UP)', 60, -142, 26, ROLE.ok, 'mono', 'left').opacity(
            dAlpha,
          ),
          glowMeter(60, -96, 760, 34, 0.65 + 0.15 * dv, { fill: ROLE.ok, opacity: dAlpha }),
          txt(
            'INDEPENDENT SCORE:  0.76 -> 0.60  (DOWN!)',
            60,
            -34,
            26,
            ROLE.fail,
            'mono',
            'left',
          ).opacity(dAlpha),
          glowMeter(60, 12, 760, 34, 0.76 - 0.16 * dv, { fill: ROLE.fail, opacity: dAlpha }),
        );

        // Bottom: Release evaluation discipline
        nodes.push(line([-860, 96], [840, 96], { stroke: '#233152', width: 2 }));
        const sAlpha = 0.3 + 0.7 * sp;

        nodes.push(
          txt(
            'HELD-OUT RELEASE PROTOCOL (FROZEN SNAPSHOTS & POLICY)',
            -840,
            158,
            26,
            ROLE.focus,
            'mono',
            'left',
          ).opacity(sAlpha),
          dotItem(
            -825,
            224,
            'SPLIT BY INCIDENT (NEVER PARAPHRASES) · COMPARE AT TOTAL GEN + VERIFIER COST',
            ROLE.agent,
            { opacity: sAlpha },
          ),
          dotItem(
            -825,
            286,
            'REPORT ELIGIBLE CORRECT, FALSE ACCEPT, UNSAFE ADVICE, ABSTENTIONS, LATENCY & COST',
            ROLE.ok,
            { opacity: sAlpha },
          ),
          dotItem(
            -825,
            348,
            'ACCEPT EXTRA COMPUTE ONLY FOR COHORTS WHOSE OBSERVED GAIN EARNS IT (GHOSAL OVER-THINKING)',
            ROLE.warn,
            { opacity: sAlpha },
          ),
        );

        return group(...nodes);
      },
    ),
  );
}
