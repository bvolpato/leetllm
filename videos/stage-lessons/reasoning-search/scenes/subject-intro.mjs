// Scene 8: subject-intro - Four numbers leave room for different plans
// Luminous 24-game puzzle tray [4, 5, 6, 7]: on subject-pair-motion, orbs 6 and 4 arc down
// and fuse into glowing 24 while 5 and 7 remain visibly unspent on the tray, exposing why
// reaching 24 early still fails operand conservation.
import { group, line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  cinemaHeader,
  clampDur,
  fadeInHalf,
  fadeOutHalf,
  guardedDynamic,
  introductoryMove,
  orbNode,
  txt,
} from '../parts.mjs';

export default function subjectIntro(s, c) {
  const pulse = s.value(0);
  const rulesOn = s.value(0);
  const pairSel = s.value(0);
  const moveT = s.value(0);
  const prodOn = s.value(0);
  const checkOn = s.value(0);

  const header = cinemaHeader('THE 24 PUZZLE', 'Four numbers leave room', 'for different plans', {
    accent: ROLE.focus,
    size: 48,
  });

  const stageAura = aura(0, 40, 660, '#ffd1661c', '#5ce1e618');

  const checkData = introductoryMove(2, 0).check;

  const view = guardedDynamic(
    () => 1,
    () => {
      const p = 0;
      const rl = rulesOn.value;
      const ps = pairSel.value;
      const mv = moveT.value;
      const pr = prodOn.value;
      const ck = checkOn.value;
      const nodes = [];

      const trayXs = [-540, -180, 180, 540];
      const vals = [4, 5, 6, 7];
      const topY = -120;
      const fuseY = 125;

      nodes.push(
        txt(
          'TARGET: 24   ·   USE EACH INPUT EXACTLY ONCE (+, -, *, /)',
          0,
          -240,
          28,
          rl > 0.35 ? ROLE.focus : COSMOS.muted,
          'mono',
          'center',
        ).glow(rl > 0.35 ? 6 : 0, ROLE.focus),
      );

      // Render 4 input orbs; 4 and 6 converge into 24 on moveT
      const pairOut = fadeOutHalf(pr);
      const prodIn = fadeInHalf(pr);

      vals.forEach((v, i) => {
        const isPair = v === 4 || v === 6;
        const baseX = trayXs[i];
        if (isPair && pairOut < 0.02) return;
        const targetX = v === 4 ? -140 : 140;
        const curX = isPair ? baseX + (targetX - baseX) * mv : baseX;
        const curY = isPair ? topY + (fuseY - topY) * mv : topY;
        const col = isPair && ps > 0.35 ? ROLE.focus : ROLE.service;
        const sub = !isPair && prodIn > 0.35 ? 'UNSPENT!' : null;

        nodes.push(
          orbNode(curX, curY, String(v), !isPair && prodIn > 0.35 ? ROLE.caution : col, {
            radius: 54,
            size: 38,
            glow: isPair && ps > 0.35 ? 12 : 8,
            sub,
            opacity: isPair ? pairOut : 1,
          }),
        );
      });

      if (mv > 0.25 && pairOut > 0.02) {
        nodes.push(
          txt('6 * 4', 0, fuseY + 94, 34, ROLE.focus, 'mono', 'center').opacity(
            Math.min(1, mv) * pairOut,
          ),
        );
      }

      // Fused 24 orb + glowing warning beams from unspent 5 and 7
      if (prodIn > 0.02) {
        nodes.push(
          orbNode(0, fuseY, '24', ROLE.focus, {
            radius: 64,
            size: 44,
            glow: 14,
            sub: '6 * 4 = 24 (EARLY TARGET)',
            opacity: prodIn,
          }),
        );
      }

      // Bottom check summary strip
      nodes.push(line([-820, 275], [820, 275], { stroke: '#25355a', width: 2 }).opacity(0.65));

      if (ck > 0.05) {
        const items = [
          [-520, 'REACHES 24', checkData.reachesGoal ? 'YES' : 'NO', ROLE.ok],
          [0, 'ALL 4 INPUTS USED', checkData.allInputsUsed ? 'YES' : 'NO (5 & 7 LEFT)', ROLE.fail],
          [540, 'CONTROLLER NEED', 'KEEP BRANCHES + CHECK + BUDGET', ROLE.path],
        ];
        for (const [cx, cap, val, col] of items) {
          nodes.push(
            txt(cap, cx, 322, 26, COSMOS.muted, 'mono', 'center').opacity(ck),
            txt(val, cx, 376, 28, col, 'mono', 'center').opacity(ck),
          );
        }
      } else {
        nodes.push(
          txt(
            pr > 0.5
              ? 'Target 24 appeared, yet 5 and 7 are still sitting on the tray'
              : 'Starting tray: [4, 5, 6, 7]  ->  build 24 using every tile once',
            0,
            352,
            30,
            pr > 0.5 ? ROLE.caution : COSMOS.muted,
            'mono',
            'center',
          ),
        );
      }

      return group(...nodes);
    },
  );

  s.add(stageAura, header, view);

  c.on('subject-intro-beat-1-focus-1', () => {
    s.play(
      pulse.to(0.3, { duration: clampDur(c, c.cue('subject-intro-beat-1-focus-1').start, 0.25) }),
    );
  });
  c.on('subject-intro-beat-1-focus-2', () => {
    s.play(
      rulesOn.to(1, { duration: clampDur(c, c.cue('subject-intro-beat-1-focus-2').start, 0.35) }),
    );
  });
  c.on('subject-intro-beat-2-focus-1', () => {
    s.play(
      pairSel.to(1, { duration: clampDur(c, c.cue('subject-intro-beat-2-focus-1').start, 0.35) }),
    );
  });
  c.on('subject-pair-motion', () => {
    s.play(moveT.to(1, { duration: clampDur(c, c.cue('subject-pair-motion').start, 0.65) }));
  });
  c.on('subject-product', () => {
    s.play(prodOn.to(1, { duration: clampDur(c, c.cue('subject-product').start, 0.35) }));
  });
  c.on('subject-intro-beat-3-focus-1', () => {
    s.play(
      pulse.to(3.0, { duration: clampDur(c, c.cue('subject-intro-beat-3-focus-1').start, 0.3) }),
    );
  });
  c.on('subject-intro-beat-3-focus-2', () => {
    s.play(
      checkOn.to(1, { duration: clampDur(c, c.cue('subject-intro-beat-3-focus-2').start, 0.35) }),
    );
  });
}
