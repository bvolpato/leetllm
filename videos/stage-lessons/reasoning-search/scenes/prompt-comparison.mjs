// Scene 3: prompt-comparison - What does a worked example teach?
// Three non-overlapping stages using fadeOutHalf / fadeInHalf:
//   1. Controlled A/B split: fixed target facts feeding Schema Template vs Worked Example.
//   2. Historical PaLM 540B GSM8K bars (17.9% direct -> 56.9% 8-shot CoT) + zero-shot note.
//   3. Task-dependence split: GPQA (modest gains / latency cost) vs 9 pattern datasets / 16 models.
import { group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  beamWithPhotons,
  cinemaHeader,
  clampDur,
  driftValue,
  fadeInHalf,
  fadeOutHalf,
  guardedDynamic,
  orbNode,
  orbRadius,
  quadArcPts,
  txt,
} from '../parts.mjs';

export default function promptComparison(s, c) {
  const pulse = s.value(0);
  const stage2 = s.value(0);
  const stage3 = s.value(0);

  const header = cinemaHeader('PROMPT COMPARISON', 'What does a worked', 'example teach?', {
    accent: ROLE.path,
    size: 48,
  });

  const stageAura = aura(120, 40, 660, '#5ce1e61c', '#ffd16614');

  const view = guardedDynamic(
    () => 1,
    () => {
      const p = pulse.value;
      const s2 = stage2.value;
      const s3 = stage3.value;
      const a1 = fadeOutHalf(s2);
      const a2 = fadeInHalf(s2) * fadeOutHalf(s3);
      const a3 = fadeInHalf(s3);
      const nodes = [];

      // Stage 1: Controlled prompt comparison (fixed facts -> 2 prompt arms)
      if (a1 > 0.02) {
        const rootPt = [0, -140];
        const leftPt = [-460, 110];
        const rightPt = [460, 110];
        const rRoot = orbRadius('FIXED FACTS', 58);
        const rL = orbRadius('TEMPLATE', 54);
        const rR = orbRadius('WORKED EX', 54);

        nodes.push(
          orbNode(rootPt[0], rootPt[1], 'FIXED FACTS', ROLE.service, {
            radius: 58,
            sub: 'Same release · policy · output fields',
            opacity: a1,
          }),
          beamWithPhotons(
            quadArcPts([rootPt[0] - rRoot, rootPt[1] + 20], [leftPt[0], leftPt[1] - rL - 10], -40),
            ROLE.service,
            p * 0.9,
            { alpha: a1, width: 3.2 },
          ),
          beamWithPhotons(
            quadArcPts(
              [rootPt[0] + rRoot, rootPt[1] + 20],
              [rightPt[0], rightPt[1] - rR - 10],
              -40,
            ),
            ROLE.path,
            p * 0.9 + 0.4,
            { alpha: a1, width: 3.6 },
          ),
          orbNode(leftPt[0], leftPt[1], 'TEMPLATE', ROLE.service, {
            radius: 54,
            sub: 'Lists fields only (zero-shot)',
            opacity: a1,
          }),
          orbNode(rightPt[0], rightPt[1], 'WORKED EX', ROLE.path, {
            radius: 54,
            sub: 'Scan failed -> manual review (few-shot)',
            opacity: a1,
          }),
          txt(
            'Hold facts, policy, and schema constant to isolate what the example buys',
            0,
            340,
            28,
            ROLE.focus,
            'mono',
            'center',
          ).opacity(a1),
        );
      }

      // Stage 2: Historical PaLM 540B GSM8K bars (17.9% vs 56.9%)
      if (a2 > 0.02) {
        const baseY = 235;
        const maxH = 340;
        const hDirect = (17.9 / 60) * maxH;
        const hCot = (56.9 / 60) * maxH;
        const xL = -310;
        const xR = 230;

        nodes.push(
          txt(
            'HISTORICAL BENCHMARK: PaLM 540B · GSM8K (WEI ET AL.)',
            0,
            -210,
            28,
            COSMOS.muted,
            'mono',
            'center',
          ).opacity(a2),
          line([-640, baseY], [640, baseY], { stroke: '#344770', width: 2.6 }).opacity(a2),
          rect(210, hDirect, { fill: ROLE.service, stroke: '#93c5fd', width: 2, radius: 8 })
            .at(xL, baseY - hDirect * 0.5)
            .opacity(0.9 * a2),
          txt('17.9%', xL, baseY - hDirect - 34, 42, ROLE.service, 'mono', 'center').opacity(a2),
          txt('DIRECT PROMPTING', xL, baseY + 46, 26, COSMOS.ink, 'mono', 'center').opacity(a2),

          rect(210, hCot, { fill: ROLE.path, stroke: '#ffffff', width: 2, radius: 8 })
            .at(xR, baseY - hCot * 0.5)
            .glow(10, ROLE.path)
            .opacity(0.92 * a2),
          txt('56.9%', xR, baseY - hCot - 34, 42, ROLE.path, 'mono', 'center')
            .glow(8, ROLE.path)
            .opacity(a2),
          txt('8 WORKED CoT EXAMPLES', xR, baseY + 46, 26, ROLE.path, 'mono', 'center').opacity(a2),

          txt(
            'Kojima et al.: zero-shot "think step by step" also elicits intermediate steps',
            0,
            355,
            26,
            ROLE.focus,
            'mono',
            'center',
          ).opacity(a2),
        );
      }

      // Stage 3: Task dependence (GPQA vs Pattern ICL 9 datasets / 16 models)
      if (a3 > 0.02) {
        const xL = -440;
        const xR = 440;
        const midY = 20;
        nodes.push(
          txt('TASK DEPENDENCE ACROSS STUDIES', 0, -210, 28, ROLE.focus, 'mono', 'center').opacity(
            a3,
          ),
          orbNode(xL, midY - 60, 'GPQA 2025', ROLE.service, {
            radius: 64,
            opacity: a3,
          }),
          txt(
            'Modest gains for non-reasoners',
            xL,
            midY + 95,
            28,
            COSMOS.ink,
            'sans',
            'center',
          ).opacity(a3),
          txt(
            'Reasoners: little gain + more latency',
            xL,
            midY + 140,
            26,
            ROLE.caution,
            'mono',
            'center',
          ).opacity(a3),

          orbNode(xR, midY - 60, '9 DATASETS', ROLE.fail, {
            radius: 64,
            opacity: a3,
          }),
          txt(
            'Pattern-based ICL (16 models)',
            xR,
            midY + 95,
            28,
            COSMOS.ink,
            'sans',
            'center',
          ).opacity(a3),
          txt(
            'Asking for steps hurt accuracy',
            xR,
            midY + 140,
            26,
            ROLE.fail,
            'mono',
            'center',
          ).opacity(a3),

          line([-820, 265], [820, 265], { stroke: '#25355a', width: 2 }).opacity(0.6 * a3),
          txt(
            'Separate parse failures, missing checks, final actions, tokens, and latency',
            0,
            335,
            26,
            ROLE.ok,
            'mono',
            'center',
          ).opacity(a3),
        );
      }

      return group(...nodes);
    },
  );

  s.add(stageAura, header, view);
  driftValue(s, c, pulse, 4.8, { startOffset: 0.1, endMargin: 0.5 });

  c.on('prompt-comparison-b1', () => {
    s.play(pulse.to(0.4, { duration: clampDur(c, c.cue('prompt-comparison-b1').start, 0.25) }));
  });
  c.on('prompt-comparison-b2', () => {
    s.play(stage2.to(1, { duration: clampDur(c, c.cue('prompt-comparison-b2').start, 0.55) }));
  });
  c.on('prompt-comparison-b3', () => {
    s.play(stage3.to(1, { duration: clampDur(c, c.cue('prompt-comparison-b3').start, 0.55) }));
  });
}
