// Scene 19: choose-the-controller - Match the reasoning method to the shape of the task
// Luminous four-lane optical routing matrix mapping task geometry -> controller architecture:
//   1. Structured policy facts -> Deterministic code
//   2. Dependent subquestions  -> Sequential linear chain
//   3. Short canonical answers -> Sample + canonical vote
//   4. Verifiable branches     -> Bounded search
// Anchored by a single trusted held-out evaluator measuring accuracy, abstention, cost & latency.
import { group, line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  beamWithPhotons,
  cinemaHeader,
  clampDur,
  driftValue,
  guardedDynamic,
  orbNode,
  orbRadius,
  trimSeg,
  txt,
} from '../parts.mjs';

const ROUTES = [
  ['FACTS', 'CODE', 'Structured policy -> deterministic code', ROLE.service],
  ['STEPS', 'CHAIN', 'Dependent subquestions -> linear steps', ROLE.path],
  ['SHORT', 'VOTE', 'Canonical answers -> sample + vote', ROLE.vote],
  ['TREE', 'SEARCH', 'Verifiable branches -> bounded search', ROLE.ok],
];

export default function chooseTheController(s, c) {
  const pulse = s.value(0);
  const group1 = s.value(0);
  const group2 = s.value(0);
  const evalOn = s.value(0);

  const header = cinemaHeader(
    'CONTROLLER SELECTION',
    'Match the reasoning method',
    'to the shape of the task',
    { accent: ROLE.ok, size: 46 },
  );

  const stageAura = aura(0, 40, 680, '#6ee7b71a', '#a78bfa18');

  const view = guardedDynamic(
    () => 1,
    () => {
      const p = pulse.value;
      const g1 = group1.value;
      const g2 = group2.value;
      const ev = evalOn.value;
      const nodes = [];

      // Spacious 2x2 optical constellation: zero crowding or vertical collision!
      const slots = [
        [-640, -100, -240, -100],
        [240, -100, 640, -100],
        [-640, 150, -240, 150],
        [240, 150, 640, 150],
      ];

      ROUTES.forEach(([task, method, why, col], i) => {
        const [xL, yL, xR, yR] = slots[i];
        const active = i < 2 ? 0.55 + 0.45 * g1 : 0.45 + 0.55 * g2;
        const rL = orbRadius(task, 50);
        const rR = orbRadius(method, 50);
        const [aPt, bPt] = trimSeg([xL, yL], [xR, yR], rL + 10, rR + 10);

        nodes.push(
          orbNode(xL, yL, task, col, { radius: 50, size: 26, opacity: active }),
          beamWithPhotons([aPt, bPt], col, p * 1.0 + i * 0.25, {
            alpha: active,
            width: 3.4,
            photonCount: 2,
          }),
          orbNode(xR, yR, method, col, { radius: 50, size: 26, opacity: active }),
          txt(why, (xL + xR) * 0.5, yL + 108, 26, COSMOS.ink, 'sans', 'center').opacity(active),
        );
      });

      nodes.push(line([-820, 322], [820, 322], { stroke: '#25355a', width: 2 }).opacity(0.65));
      nodes.push(
        txt(
          ev > 0.35
            ? 'EVALUATE ALL ON HELD-OUT TASKS: CORRECTNESS · ABSTENTION · COST · LATENCY'
            : 'Extra tokens or deeper search trees earn their place only when measured data demands it',
          0,
          388,
          26,
          ev > 0.35 ? ROLE.focus : COSMOS.muted,
          'mono',
          'center',
        ).glow(ev > 0.35 ? 6 : 0, ROLE.focus),
      );

      return group(...nodes);
    },
  );

  s.add(stageAura, header, view);
  driftValue(s, c, pulse, 5.2, { startOffset: 0.1, endMargin: 0.5 });

  c.on('choose-the-controller-beat-1-focus-1', () => {
    s.play(
      group1.to(1, {
        duration: clampDur(c, c.cue('choose-the-controller-beat-1-focus-1').start, 0.35),
      }),
    );
  });
  c.on('choose-the-controller-beat-2-focus-1', () => {
    s.play(
      group2.to(1, {
        duration: clampDur(c, c.cue('choose-the-controller-beat-2-focus-1').start, 0.35),
      }),
    );
  });
  c.on('choose-the-controller-beat-3-focus-1', () => {
    s.play(
      evalOn.to(1, {
        duration: clampDur(c, c.cue('choose-the-controller-beat-3-focus-1').start, 0.35),
      }),
    );
  });
}
