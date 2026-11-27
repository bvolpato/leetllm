// Scene 4: reasoning-artifacts - What can an operator inspect?
// Three non-overlapping stages:
//   1. Four distinct reasoning artifacts on luminous parallel tracks (CoT, Internal Tokens,
//      Provider Summary, Decision Record).
//   2. Live 800-token output budget gauge consumed by internal tokens while the required
//      decision record stays EMPTY -> marked INCOMPLETE at 800/800.
//   3. Turpin et al. unfaithful explanation intervention: option order shifts answer while
//      explanation omits the cause -> audit inputs, validated fields, tools, and outcome.
import { group, line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  beamWithPhotons,
  cinemaHeader,
  clampDur,
  fadeInHalf,
  fadeOutHalf,
  glowMeter,
  guardedDynamic,
  orbNode,
  orbRadius,
  trimSeg,
  txt,
} from '../parts.mjs';

export default function reasoningArtifacts(s, c) {
  const pulse = s.value(0);
  const stage2 = s.value(0);
  const budgetFill = s.value(0);
  const incompleteOn = s.value(0);
  const stage3 = s.value(0);

  const header = cinemaHeader('REASONING ARTIFACTS', 'What can an operator', 'inspect?', {
    accent: ROLE.model,
    size: 48,
  });

  const stageAura = aura(150, 30, 660, '#a78bfa1e', '#ff6b8b14');

  const view = guardedDynamic(
    () => 1,
    () => {
      const p = 0;
      const s2 = stage2.value;
      const bf = budgetFill.value;
      const inc = incompleteOn.value;
      const s3 = stage3.value;

      const a1 = fadeOutHalf(s2);
      const a2 = fadeInHalf(s2) * fadeOutHalf(s3);
      const a3 = fadeInHalf(s3);
      const nodes = [];

      // Stage 1: Four artifacts aligned horizontally on luminous rails
      if (a1 > 0.02) {
        const rows = [
          ['CoT', 'Prompt-elicited text (not causal proof)', ROLE.path],
          ['TOKENS', 'Hidden native reasoning spend (private)', ROLE.model],
          ['SUMMARY', 'Provider synopsis of internal work', ROLE.service],
          ['RECORD', 'Structured fields scored against source', ROLE.ok],
        ];
        rows.forEach(([tag, desc, col], i) => {
          const y = -165 + i * 138;
          const xL = -640;
          const rL = orbRadius(tag, 44);
          const [ptA, ptB] = trimSeg([xL, y], [-265, y], rL + 10, 14);
          nodes.push(
            orbNode(xL, y, tag, col, { radius: 44, size: 26, opacity: a1 }),
            beamWithPhotons([ptA, ptB], col, p * 0.9 + i * 0.25, { alpha: a1, width: 3.0 }),
            txt(desc, -235, y, 28, i === 3 ? ROLE.ok : COSMOS.ink, 'sans', 'left').opacity(a1),
          );
        });
        nodes.push(
          txt(
            'Neither a summary nor prose proves which internal steps caused the answer',
            0,
            402,
            26,
            ROLE.focus,
            'mono',
            'center',
          ).opacity(a1),
        );
      }

      // Stage 2: 800-token output budget exhaustion
      if (a2 > 0.02) {
        const used = inc > 0.5 ? 800 : Math.round(bf * 799);
        const frac = used / 800;
        const done = used >= 800;

        nodes.push(
          txt('OUTPUT BUDGET: 800 TOKENS', 0, -195, 32, COSMOS.ink, 'mono', 'center').opacity(a2),
          glowMeter(-640, -65, 1280, 68, frac, {
            fill: done ? ROLE.fail : ROLE.model,
            glow: done ? 12 : 9,
            opacity: a2,
          }),
          txt(
            `${used} / 800 INTERNAL REASONING TOKENS`,
            0,
            30,
            34,
            done ? ROLE.fail : ROLE.model,
            'mono',
            'center',
          )
            .glow(done ? 10 : 6, done ? ROLE.fail : ROLE.model)
            .opacity(a2),
          line([-640, 115], [640, 115], { stroke: '#25355a', width: 2 }).opacity(0.7 * a2),
          txt('PUBLIC DECISION RECORD: EMPTY', 0, 190, 34, ROLE.fail, 'mono', 'center').opacity(a2),
          txt(
            done
              ? 'STATUS: INCOMPLETE RESPONSE (BUDGET EXHAUSTED BEFORE OUTPUT)'
              : 'Internal tokens consume the shared output allowance...',
            0,
            285,
            28,
            done ? ROLE.focus : COSMOS.muted,
            'mono',
            'center',
          ).opacity(a2),
          txt(
            'Raw reasoning tokens stay private; check each endpoint contract',
            0,
            360,
            26,
            COSMOS.muted,
            'sans',
            'center',
          ).opacity(a2),
        );
      }

      // Stage 3: Turpin et al. unfaithful explanation intervention
      if (a3 > 0.02) {
        const leftPt = [-460, -10];
        const rightPt = [380, -10];
        const rL = orbRadius('ORDER BIAS', 68);
        const rR = orbRadius('EXPLANATION', 68);
        const [aPt, bPt] = trimSeg(leftPt, rightPt, rL + 12, rR + 12);

        nodes.push(
          txt(
            'TURPIN ET AL. · PROMPTED EXPLANATION INTERVENTION',
            0,
            -210,
            28,
            ROLE.focus,
            'mono',
            'center',
          ).opacity(a3),
          orbNode(leftPt[0], leftPt[1], 'ORDER BIAS', ROLE.focus, {
            radius: 68,
            sub: 'Changed answer-option order',
            opacity: a3,
          }),
          beamWithPhotons([aPt, bPt], ROLE.fail, p * 1.1, { alpha: a3, width: 3.8 }),
          txt('OMITS CAUSE', -40, -65, 26, ROLE.fail, 'mono', 'center').opacity(a3),
          orbNode(rightPt[0], rightPt[1], 'EXPLANATION', ROLE.fail, {
            radius: 68,
            sub: 'Rationalizes choice without mentioning order',
            opacity: a3,
          }),
          line([-820, 235], [820, 235], { stroke: '#25355a', width: 2 }).opacity(0.65 * a3),
          txt(
            'AUDIT TRAIL: INPUTS · VALIDATED FIELDS · TOOL OBSERVATIONS · OUTCOME',
            0,
            305,
            26,
            ROLE.ok,
            'mono',
            'center',
          ).opacity(a3),
          txt(
            'Restrict access and retention on sensitive intermediate text',
            0,
            360,
            26,
            COSMOS.muted,
            'sans',
            'center',
          ).opacity(a3),
        );
      }

      return group(...nodes);
    },
  );

  s.add(stageAura, header, view);

  c.on('reasoning-artifacts-b1', () => {
    s.play(pulse.to(0.35, { duration: clampDur(c, c.cue('reasoning-artifacts-b1').start, 0.25) }));
  });
  c.on('reasoning-artifacts-b2', () => {
    s.play(stage2.to(1, { duration: clampDur(c, c.cue('reasoning-artifacts-b2').start, 0.5) }));
  });
  c.on('reasoning-limit', () => {
    s.play(budgetFill.to(1, { duration: clampDur(c, c.cue('reasoning-limit').start, 1.4) }));
  });
  c.on('artifact-incomplete', () => {
    s.play(incompleteOn.to(1, { duration: clampDur(c, c.cue('artifact-incomplete').start, 0.3) }));
  });
  c.on('reasoning-artifacts-b3', () => {
    s.play(stage3.to(1, { duration: clampDur(c, c.cue('reasoning-artifacts-b3').start, 0.55) }));
  });
}
