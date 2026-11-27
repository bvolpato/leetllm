// Scene 20: required-fan-in - Which release can the engineer select?
// Parallel Fan-Out / Fan-In Conduits with TWO fixed required release slots + 20/1000 budget ruler.
// Strict prediction withholding on ALL THREE questions:
//   1. Partial timeout (v17=9/1000, v16=timeout) -> withheld until AFTER `join-wait`
//   2. Complete pair (v16=81/1000 failed, v17=9/1000 clean) -> withheld until AFTER `join-select`
//   3. Duplicate call-1 copy replacing call-2 -> withheld until AFTER `join-duplicate-verdict`
import { group, line } from 'vizmatic/stage';
import {
  COSMOS,
  FANIN_V16,
  FANIN_V17,
  ROLE,
  aura,
  beamWithPhotons,
  cinemaHeader,
  clampDur,
  energyRail,
  gateNode,
  glowMeter,
  guardedDynamic,
  hexGate,
  quadArcPts,
  txt,
} from '../parts.mjs';

export default function requiredFanIn(s, c) {
  const pulse = s.value(0);
  const launchOn = s.value(0);
  const v17On = s.value(0);
  const timeoutOn = s.value(0);
  const askPartialOn = s.value(0);
  const waitReveal = s.value(0);
  const completeRunOn = s.value(0);
  const v16RateOn = s.value(0);
  const compareOn = s.value(0);
  const selectReveal = s.value(0);
  const dupModeOn = s.value(0);
  const askDupOn = s.value(0);
  const dupVerdictReveal = s.value(0);

  const header = cinemaHeader(
    'REQUIRED PARALLEL FAN-IN',
    'Which release can the',
    'engineer select?',
    { accent: ROLE.runtime, size: 48 },
  );

  const stageAura = aura(100, 40, 620, '#5ce1e620', '#6ee7b71a');

  const view = guardedDynamic(
    () => 1,
    () => {
      const p = 0;
      const ln = launchOn.value;
      const v17 = v17On.value;
      const to = timeoutOn.value;
      const ap = askPartialOn.value;
      const wt = waitReveal.value;
      const cr = completeRunOn.value;
      const v16 = v16RateOn.value;
      const cmp = compareOn.value;
      const sl = selectReveal.value;
      const dm = dupModeOn.value;
      const ad = askDupOn.value;
      const dv = dupVerdictReveal.value;
      const nodes = [];

      // Left: Fan-out Host Launcher
      const hostPt = [-740, -10];
      const slot1Y = -135;
      const slot2Y = 125;
      const slotX = -465;
      const joinPt = [495, -10];

      nodes.push(
        gateNode(hostPt[0], hostPt[1], 'HOST', ROLE.runtime, {
          radius: 56,
          sub: '2 reads',
          glow: ln > 0.3 ? 12 : 6,
        }),
        beamWithPhotons(
          quadArcPts([hostPt[0] + 52, hostPt[1] - 12], [slotX - 24, slot1Y], -32),
          ROLE.proposal,
          p * 1.1,
          {
            alpha: 0.45 + ln * 0.55,
            width: 3.4,
          },
        ),
        beamWithPhotons(
          quadArcPts([hostPt[0] + 52, hostPt[1] + 12], [slotX - 24, slot2Y], -22),
          ROLE.proposal,
          p * 1.1 + 0.5,
          {
            alpha: 0.45 + ln * 0.55,
            width: 3.4,
          },
        ),
      );

      // SLOT 1 (call-1 / reranker-v16)
      let s1Col = ROLE.proposal;
      let s1Status = 'IN FLIGHT...';
      let s1Frac = 0.05;
      if (cr > 0.35) {
        s1Col = ROLE.fail;
        s1Status =
          v16 > 0.35 ? `CANARY FAILED · ${FANIN_V16.perThousand}/1000 (> 20)` : 'RETURNED v16';
        s1Frac = v16 > 0.35 ? 0.81 : 0.4;
      } else if (to > 0.35) {
        s1Col = ROLE.caution;
        s1Status = 'TIMEOUT · MISSING RESULT';
        s1Frac = 0;
      }

      nodes.push(
        energyRail(slotX, slot1Y - 56, slot1Y + 62, s1Col),
        txt('SLOT 1 · call-1 (reranker-v16)', slotX + 26, slot1Y - 38, 26, s1Col, 'mono', 'left'),
        txt(s1Status, slotX + 26, slot1Y + 8, 26, COSMOS.ink, 'mono', 'left'),
        glowMeter(slotX + 26, slot1Y + 46, 540, 22, s1Frac, { fill: s1Col }),
        // 20/1000 budget tick mark on meter 1
        line([slotX + 26 + 540 * 0.2, slot1Y + 30], [slotX + 26 + 540 * 0.2, slot1Y + 64], {
          stroke: ROLE.budget,
          width: 3,
        }),
      );

      // SLOT 2 (call-2 / reranker-v17) - switches to DUPLICATE call-1 copy in Beat 3!
      let s2Col = v17 > 0.35 ? ROLE.ok : ROLE.proposal;
      let s2Title = 'SLOT 2 · call-2 (reranker-v17)';
      let s2Status =
        v17 > 0.35 ? `CANARY CLEAN · ${FANIN_V17.perThousand}/1000 (<= 20)` : 'IN FLIGHT...';
      let s2Frac = v17 > 0.35 ? 0.09 : 0.05;
      if (dm > 0.35) {
        s2Col = dv > 0.5 ? ROLE.denied : ROLE.caution;
        s2Title = 'SLOT 2 · call-2 (EXPECTED)';
        s2Status =
          dv > 0.5 ? 'EMPTY! (2nd reply carried call-1!)' : 'RECEIVED: duplicate copy of call-1';
        s2Frac = 0;
      }

      nodes.push(
        energyRail(slotX, slot2Y - 56, slot2Y + 62, s2Col),
        txt(s2Title, slotX + 26, slot2Y - 38, 26, s2Col, 'mono', 'left'),
        txt(s2Status, slotX + 26, slot2Y + 8, 26, COSMOS.ink, 'mono', 'left'),
        glowMeter(slotX + 26, slot2Y + 46, 540, 22, s2Frac, { fill: s2Col }),
        line([slotX + 26 + 540 * 0.2, slot2Y + 30], [slotX + 26 + 540 * 0.2, slot2Y + 64], {
          stroke: ROLE.budget,
          width: 3,
        }),
        txt('GOLD TICK = 20/1000 BUDGET', slotX + 26, slot2Y + 95, 26, ROLE.budget, 'mono', 'left'),
      );

      // Fan-In Beams into Decision Join Gate
      const bothReady = cr > 0.35 && dm < 0.35;
      nodes.push(
        beamWithPhotons(
          quadArcPts([230, slot1Y + 18], [joinPt[0] - 102, joinPt[1] - 20], -18),
          s1Col,
          p * 1.1,
          {
            alpha: bothReady ? 0.95 : 0.45,
            width: 3.4,
          },
        ),
        beamWithPhotons(
          quadArcPts([230, slot2Y + 18], [joinPt[0] - 102, joinPt[1] + 20], 18),
          s2Col,
          p * 1.1 + 0.5,
          {
            alpha: dm > 0.35 ? 0.5 : 0.95,
            width: 3.4,
          },
        ),
        hexGate(joinPt[0], joinPt[1], 84, sl > 0.5 && dm < 0.35 ? ROLE.ok : ROLE.focus, {
          label: 'FAN-IN',
          sub: 'exact 2/2',
          glow: 12,
        }),
      );

      // Decision Readout on Right + Bottom Bar (Strict prediction withholding!)
      let decTitle = 'AWAITING BOTH READS';
      let decSub = 'Require call-1 AND call-2 before choosing';
      let decCol = ROLE.runtime;

      if (dv > 0.5) {
        decTitle = 'BLOCKED · SLOT 2 EMPTY';
        decSub = 'Two copies of call-1 != two distinct required calls';
        decCol = ROLE.denied;
      } else if (ad > 0.35 || dm > 0.35) {
        decTitle = '2 REPLIES · CAN THEY FILL 2 SLOTS?  ?';
        decSub = 'Second reply is a duplicate of call-1';
        decCol = ROLE.focus;
      } else if (sl > 0.5) {
        decTitle = 'CANDIDATE: reranker-v17';
        decSub = 'Clean & lowest error rate (9/1000 <= 20) · promotion still gated';
        decCol = ROLE.ok;
      } else if (cmp > 0.35) {
        decTitle = 'WHICH VERSION QUALIFIES?  ?';
        decSub = 'v16: 81/1000 failed  vs  v17: 9/1000 clean (budget 20)';
        decCol = ROLE.focus;
      } else if (wt > 0.5) {
        decTitle = 'BLOCKED · COMPARISON MUST WAIT';
        decSub = 'v17 clean tells nothing about missing v16';
        decCol = ROLE.caution;
      } else if (ap > 0.35) {
        decTitle = 'CAN ENGINEER PICK NOW?  ?';
        decSub = 'v17 returned clean (9/1000), v16 timed out';
        decCol = ROLE.focus;
      }

      nodes.push(
        line([-855, 290], [840, 290], { stroke: '#25355a', width: 2 }),
        txt(decTitle, 0, 345, 34, decCol, 'mono', 'center').glow(8, decCol),
        txt(decSub, 0, 405, 26, COSMOS.ink, 'sans', 'center'),
      );

      return group(...nodes);
    },
  );

  s.add(stageAura, header, view);

  c.on('join-launch', () => {
    s.play(launchOn.to(1, { duration: clampDur(c, c.cue('join-launch').start, 0.3) }));
  });
  c.on('join-seventeen', () => {
    s.play(v17On.to(1, { duration: clampDur(c, c.cue('join-seventeen').start, 0.3) }));
  });
  c.on('join-first-timeout', () => {
    s.play(timeoutOn.to(1, { duration: clampDur(c, c.cue('join-first-timeout').start, 0.3) }));
  });
  c.on('join-partial-question', () => {
    s.play(
      askPartialOn.to(1, { duration: clampDur(c, c.cue('join-partial-question').start, 0.3) }),
    );
  });
  // Strict prediction withholding #1
  c.after('join-wait', () => {
    s.play(waitReveal.to(1, { duration: clampDur(c, c.cue('join-wait').end, 0.3) }));
  });
  c.on('join-complete', () => {
    s.play(completeRunOn.to(1, { duration: clampDur(c, c.cue('join-complete').start, 0.3) }));
  });
  c.on('join-sixteen', () => {
    s.play(v16RateOn.to(1, { duration: clampDur(c, c.cue('join-sixteen').start, 0.3) }));
  });
  c.on('join-compare', () => {
    s.play(compareOn.to(1, { duration: clampDur(c, c.cue('join-compare').start, 0.3) }));
  });
  // Strict prediction withholding #2
  c.after('join-select', () => {
    s.play(selectReveal.to(1, { duration: clampDur(c, c.cue('join-select').end, 0.3) }));
  });
  c.on('join-duplicate', () => {
    s.play(dupModeOn.to(1, { duration: clampDur(c, c.cue('join-duplicate').start, 0.3) }));
  });
  c.on('join-duplicate-question', () => {
    s.play(askDupOn.to(1, { duration: clampDur(c, c.cue('join-duplicate-question').start, 0.3) }));
  });
  // Strict prediction withholding #3
  c.after('join-duplicate-verdict', () => {
    s.play(
      dupVerdictReveal.to(1, {
        duration: clampDur(c, c.cue('join-duplicate-verdict').end, 0.3),
      }),
    );
  });
}
