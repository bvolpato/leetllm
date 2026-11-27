// Scene 9: linear-state - A written step gives the next step something to use
// Flowing 4-stage horizontal luminous state chain from LINEAR_STATES:
//   [4, 5, 6, 7] --(6 - 4 = 2)--> [2, 5, 7] --(5 + 7 = 12)--> [2, 12] --(2 * 12)--> [24]
// Paired with a live operand-lineage MathJax equation (6 - 4) * (5 + 7) = 24.
import { group, line } from 'vizmatic/stage';
import {
  COSMOS,
  LINEAR_STATES,
  ROLE,
  aura,
  beamWithPhotons,
  cinemaHeader,
  clampDur,
  glowTex,
  guardedDynamic,
  orbNode,
  orbRadius,
  trimSeg,
  txt,
} from '../parts.mjs';

export default function linearState(s, c) {
  const pulse = s.value(0);
  const step1 = s.value(0);
  const step2 = s.value(0);
  const step3 = s.value(0);

  const header = cinemaHeader(
    'LINEAR REASONING PATH',
    'A written step gives the next',
    'step something to use',
    { accent: ROLE.path, size: 46 },
  );

  const stageAura = aura(0, 30, 680, '#5ce1e61c', '#6ee7b718');

  const finalEq = glowTex(String.raw`(6 - 4) \times (5 + 7) = 2 \times 12 = 24`, {
    x: 0,
    y: 295,
    size: 42,
    color: ROLE.ok,
    glow: 9,
  });

  const view = guardedDynamic(
    () => 1,
    () => {
      const p = 0;
      const s1 = step1.value;
      const s2 = step2.value;
      const s3 = step3.value;
      const nodes = [];

      const centers = [
        [-680, -35],
        [-230, -35],
        [220, -35],
        [670, -35],
      ];
      const stages = [
        { label: '4, 5, 6, 7', op: '6 - 4 = 2', col: ROLE.service, vis: 1 },
        { label: '2, 5, 7', op: '5 + 7 = 12', col: ROLE.path, vis: 0.25 + 0.75 * s1 },
        {
          label: '2, 12',
          op: '2 * 12 = 24',
          col: ROLE.focus,
          vis: 0.25 + 0.75 * s2,
        },
        { label: LINEAR_STATES[3].label, op: 'VALID', col: ROLE.ok, vis: 0.25 + 0.75 * s3 },
      ];
      const subs = ['4 tiles left', '3 tiles left', '2 subtotals', 'Goal reached'];

      nodes.push(
        txt(
          'ONE CONTINUATION PER STEP  ·  CONSUMED OPERANDS BECOME NEW SUBTOTALS',
          0,
          -225,
          26,
          COSMOS.muted,
          'mono',
          'center',
        ),
      );

      // Connecting photon rails between consecutive state orbs
      const edgeVis = [s1, s2, s3];
      for (let i = 0; i < 3; i++) {
        const rA = orbRadius(stages[i].label, 60);
        const rB = orbRadius(stages[i + 1].label, 60);
        const [aPt, bPt] = trimSeg(centers[i], centers[i + 1], rA + 10, rB + 10);
        const ev = edgeVis[i];
        const col = stages[i + 1].col;
        nodes.push(
          beamWithPhotons([aPt, bPt], ev > 0.2 ? col : '#2c3d66', p * 1.1 + i * 0.3, {
            alpha: 0.3 + 0.7 * ev,
            width: ev > 0.2 ? 3.8 : 2.2,
            photonCount: ev > 0.2 ? 2 : 0,
          }),
          txt(
            stages[i].op,
            (centers[i][0] + centers[i + 1][0]) * 0.5,
            -105,
            26,
            ev > 0.2 ? col : COSMOS.dim,
            'mono',
            'center',
          ).opacity(0.35 + 0.65 * ev),
        );
      }

      // Render 4 state orbs
      stages.forEach((st, i) => {
        const [cx, cy] = centers[i];
        nodes.push(
          orbNode(cx, cy, st.label, st.col, {
            radius: 60,
            size: i === 3 ? 40 : 28,
            sub: subs[i],
            glow: st.vis > 0.7 ? 11 : 4,
            opacity: st.vis,
          }),
        );
      });

      // Bottom host verification strip
      nodes.push(line([-820, 220], [820, 220], { stroke: '#25355a', width: 2 }).opacity(0.65));

      const statusText =
        s3 > 0.5
          ? 'Host checks exact arithmetic & all 4 inputs (4, 5, 6, 7) used once'
          : s2 > 0.5
            ? 'Subtotal 2 came from (6 - 4); subtotal 12 came from (5 + 7)'
            : s1 > 0.5
              ? 'First move 6 - 4 = 2 leaves [2, 5, 7] for the next step'
              : 'State = remaining numbers + operation history';
      nodes.push(txt(statusText, 0, 385, 28, s3 > 0.5 ? ROLE.ok : COSMOS.muted, 'mono', 'center'));

      return group(...nodes);
    },
  );

  s.add(stageAura, header, view);

  c.on('linear-state-beat-1-focus-1', () => {
    s.play(
      pulse.to(0.35, { duration: clampDur(c, c.cue('linear-state-beat-1-focus-1').start, 0.25) }),
    );
  });
  c.on('linear-first-subtraction', () => {
    s.play(step1.to(0.65, { duration: clampDur(c, c.cue('linear-first-subtraction').start, 0.3) }));
  });
  c.on('reason-result-linear-subtract', () => {
    s.play(
      step1.to(1, { duration: clampDur(c, c.cue('reason-result-linear-subtract').start, 0.35) }),
    );
  });
  c.on('linear-state-beat-2-focus-1', () => {
    s.play(
      step2.to(0.65, { duration: clampDur(c, c.cue('linear-state-beat-2-focus-1').start, 0.3) }),
    );
  });
  c.on('reason-result-linear-add', () => {
    s.play(step2.to(1, { duration: clampDur(c, c.cue('reason-result-linear-add').start, 0.35) }));
  });
  c.on('linear-state-beat-3-focus-1', () => {
    s.play(
      step3.to(0.65, { duration: clampDur(c, c.cue('linear-state-beat-3-focus-1').start, 0.3) }),
    );
  });
  c.show('reason-result-linear-final', finalEq);
  c.on('reason-result-linear-final', () => {
    s.play(step3.to(1, { duration: clampDur(c, c.cue('reason-result-linear-final').start, 0.35) }));
  });
}
