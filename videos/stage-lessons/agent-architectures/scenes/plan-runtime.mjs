// Scene 16: plan-runtime - A valid graph exposes readiness without executing it
// Living 5-node DAG circuit (CI, Diff, Health -> Decision -> Effect): Wave 1 lights all 3
// ready reads -> Wave 2 unlocks Decision -> Diff failure blocks the join -> invalid graph
// audit highlights duplicate IDs, missing dependencies, and a glowing rose Decision -> CI cycle!
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
  quadArcPts,
  trimSeg,
  txt,
} from '../parts.mjs';

export default function planRuntime(s, c) {
  const pulse = s.value(0);
  const ready3On = s.value(0);
  const decReadyOn = s.value(0);
  const diffFailOn = s.value(0);
  const dupOn = s.value(0);
  const missOn = s.value(0);
  const cycleOn = s.value(0);

  const header = cinemaHeader(
    'PLAN-AND-EXECUTE DAG RUNTIME',
    'A valid graph exposes',
    'readiness safely',
    { accent: ROLE.plan, size: 48 },
  );

  const stageAura = aura(160, 40, 640, '#60a5fa1e', '#ff6b8b1a');

  const view = guardedDynamic(
    () => 1,
    () => {
      const p = pulse.value;
      const r3 = ready3On.value;
      const dr = decReadyOn.value;
      const df = diffFailOn.value;
      const du = dupOn.value;
      const ms = missOn.value;
      const cy = cycleOn.value;
      const nodes = [];

      const ciPt = [-460, -170];
      const diffPt = [-460, 20];
      const hlthPt = [-460, 210];
      const decPt = [120, 20];
      const effPt = [620, 20];

      const isFailed = df > 0.35 && cy < 0.35;
      const isCycle = cy > 0.35;

      const inputs = [
        { pt: ciPt, id: 'CI', col: r3 > 0.3 ? ROLE.ok : ROLE.action },
        { pt: diffPt, id: 'DIFF', col: isFailed ? ROLE.fail : r3 > 0.3 ? ROLE.ok : ROLE.action },
        { pt: hlthPt, id: 'HEALTH', col: r3 > 0.3 ? ROLE.ok : ROLE.action },
      ];

      inputs.forEach((inp, i) => {
        const [e0, e1] = trimSeg(inp.pt, decPt, 58, 72);
        nodes.push(
          beamWithPhotons([e0, e1], inp.col, p * 1.1 + i * 0.28, {
            alpha: inp.col === ROLE.fail ? 0.95 : 0.45 + r3 * 0.55,
            width: 3.4,
          }),
          orbNode(inp.pt[0], inp.pt[1], inp.id, inp.col, { radius: 52 }),
        );
      });

      const decCol = isCycle || isFailed ? ROLE.fail : dr > 0.35 ? ROLE.ok : ROLE.plan;
      const [de0, de1] = trimSeg(decPt, effPt, 72, 62);
      nodes.push(
        beamWithPhotons(
          [de0, de1],
          isCycle || isFailed ? '#2e3f68' : dr > 0.35 ? ROLE.plan : '#2e3f68',
          p * 1.1 + 0.5,
          {
            alpha: dr > 0.35 && !isFailed && !isCycle ? 0.95 : 0.35,
            width: 3.4,
          },
        ),
        orbNode(decPt[0], decPt[1], 'DECIDE', decCol, {
          radius: 64,
          sub: isCycle
            ? 'DEADLOCK CYCLE!'
            : isFailed
              ? 'BLOCKED (diff failed)'
              : dr > 0.35
                ? 'READY!'
                : 'Waits on 3 reads',
        }),
        orbNode(effPt[0], effPt[1], 'EFFECT', ROLE.host, {
          radius: 56,
          sub: 'Host checks auth',
          opacity: 0.6,
        }),
      );

      // Rose cycle arc from DECISION back to CI!
      if (isCycle) {
        const cycArc = quadArcPts(
          [decPt[0] - 20, decPt[1] - 70],
          [ciPt[0] + 20, ciPt[1] - 58],
          -120,
        );
        nodes.push(
          beamWithPhotons(cycArc, ROLE.fail, p * 1.4, { alpha: cy, width: 4.4 }),
          txt('CYCLE: DECISION -> CI (WAITS FOREVER)', -170, -280, 26, ROLE.fail, 'mono', 'center')
            .glow(8, ROLE.fail)
            .opacity(cy),
        );
      }

      // Bottom validation rule strip
      nodes.push(
        line([-840, 320], [840, 320], { stroke: '#25355a', width: 2 }).opacity(0.65),
        txt(
          isCycle || du > 0.3 || ms > 0.3
            ? 'REJECT: DUPLICATE / EMPTY IDs  ·  MISSING DEPS  ·  CYCLES'
            : 'Plan-and-Solve · HuggingGPT · Planner proposes graph, runtime schedules & authorizes',
          0,
          372,
          26,
          isCycle || du > 0.3 || ms > 0.3 ? ROLE.fail : COSMOS.muted,
          'mono',
          'center',
        ),
      );

      return group(...nodes);
    },
  );

  s.add(stageAura, header, view);
  driftValue(s, c, pulse, 4.8, { startOffset: 0.1, endMargin: 0.5 });

  c.on('aa-plan-runtime-0', () => {
    s.play(pulse.to(0.3, { duration: clampDur(c, c.cue('aa-plan-runtime-0').start, 0.25) }));
  });
  c.on('aa-plan-runtime-1', () => {
    s.play(ready3On.to(0.4, { duration: clampDur(c, c.cue('aa-plan-runtime-1').start, 0.25) }));
  });
  c.on('plan-three-ready', () => {
    s.play(ready3On.to(1, { duration: clampDur(c, c.cue('plan-three-ready').start, 0.35) }));
  });
  c.on('plan-decision-ready', () => {
    s.play(decReadyOn.to(1, { duration: clampDur(c, c.cue('plan-decision-ready').start, 0.35) }));
  });
  c.on('plan-failure', () => {
    s.play(diffFailOn.to(1, { duration: clampDur(c, c.cue('plan-failure').start, 0.35) }));
  });
  c.on('aa-plan-runtime-2', () => {
    s.play(dupOn.to(0.5, { duration: clampDur(c, c.cue('aa-plan-runtime-2').start, 0.25) }));
  });
  c.on('plan-duplicate', () => {
    s.play(dupOn.to(1, { duration: clampDur(c, c.cue('plan-duplicate').start, 0.35) }));
  });
  c.on('plan-missing', () => {
    s.play(missOn.to(1, { duration: clampDur(c, c.cue('plan-missing').start, 0.35) }));
  });
  c.on('plan-cycle', () => {
    s.play(cycleOn.to(1, { duration: clampDur(c, c.cue('plan-cycle').start, 0.4) }));
  });
}
