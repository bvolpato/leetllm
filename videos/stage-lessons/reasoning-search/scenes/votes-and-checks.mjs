// Scene 14: votes-and-checks - Agreement and verification answer different questions
// Luminous constellation showing 3 independent samples voting 24 via the SAME broken shortcut
// (6 * 4 only, leaving 5 & 7 unspent): Vote tallies 3/3 = 100% agreement -> separate host
// operand-conservation verifier REJECTS 6 * 4 and ACCEPTS (6 - 4) * (5 + 7)!
import { group, line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  VOTE_PUZZLE_FIXTURE,
  aura,
  beamWithPhotons,
  cinemaHeader,
  clampDur,
  guardedDynamic,
  orbNode,
  orbRadius,
  quadArcPts,
  trimSeg,
  txt,
} from '../parts.mjs';

export default function votesAndChecks(s, c) {
  const pulse = s.value(0);
  const sharedHi = s.value(0);
  const checkOn = s.value(0);
  const verifiedOn = s.value(0);

  const header = cinemaHeader(
    'AGREEMENT VS VERIFICATION',
    'Agreement and verification',
    'answer different questions',
    { accent: ROLE.vote, size: 46 },
  );

  const stageAura = aura(0, 40, 680, '#ffd1661c', '#ff6b8b16');

  const validCount = VOTE_PUZZLE_FIXTURE.checked.filter((r) => r.valid).length;

  const view = guardedDynamic(
    () => 1,
    () => {
      const p = 0;
      const sh = sharedHi.value;
      const ck = checkOn.value;
      const vf = verifiedOn.value;
      const nodes = [];

      // Left column: 3 sampled reasoning paths all saying "24" via 6 * 4
      const sampleYs = [-150, 0, 150];
      const sampleX = -480;
      const votePt = [-105, 0];
      const checkPt = [305, 0];
      const validPt = [690, 145];
      const rejectPt = [690, -145];

      const rSample = orbRadius('S1: 24', 44);
      const rVote = orbRadius('VOTE: 24', 58);
      const rCheck = orbRadius('VERIFIER', 58);

      sampleYs.forEach((sy, i) => {
        const col = sh > 0.35 ? ROLE.fail : ROLE.service;
        nodes.push(
          txt(sh > 0.35 ? '6 * 4 only' : 'Sampled path', -830, sy, 26, col, 'mono', 'left'),
          orbNode(sampleX, sy, `S${i + 1}: 24`, col, {
            radius: 44,
          }),
          beamWithPhotons(
            quadArcPts(
              [sampleX + rSample + 10, sy],
              [votePt[0] - rVote - 10, votePt[1]],
              (i - 1) * 18,
            ),
            sh > 0.35 ? ROLE.vote : ROLE.path,
            p * 1.1 + i * 0.3,
            { width: 3.2 },
          ),
        );
      });

      // Majority vote tally orb
      nodes.push(
        orbNode(votePt[0], votePt[1], 'VOTE: 24', ROLE.vote, {
          radius: 60,
          glow: 11,
          sub: `${VOTE_PUZZLE_FIXTURE.votes}/${VOTE_PUZZLE_FIXTURE.samples.length} AGREE`,
        }),
      );

      // Beam from Vote -> Verifier
      const [v2cA, v2cB] = trimSeg(votePt, checkPt, rVote + 10, rCheck + 10);
      nodes.push(
        beamWithPhotons([v2cA, v2cB], ck > 0.35 ? ROLE.path : '#344770', p * 1.1 + 0.2, {
          width: 3.4,
          alpha: 0.4 + 0.6 * ck,
        }),
        orbNode(checkPt[0], checkPt[1], 'VERIFIER', ck > 0.35 ? ROLE.path : ROLE.service, {
          radius: 60,
          sub: vf > 0.45 ? `${validCount}/3 VALID` : 'Checks 4 inputs',
          opacity: 0.55 + 0.45 * ck,
        }),
      );

      // Verifier splits: REJECT 6 * 4 (top right) vs ACCEPT (6-4)*(5+7) (bottom right)
      if (vf > 0.05) {
        const rRej = orbRadius('REJECT', 52);
        const rAcc = orbRadius('ACCEPT', 52);
        nodes.push(
          beamWithPhotons(
            quadArcPts(
              [checkPt[0] + rCheck + 10, -18],
              [rejectPt[0] - rRej - 10, rejectPt[1]],
              -20,
            ),
            ROLE.fail,
            p * 1.1,
            { alpha: vf, width: 3.6 },
          ),
          orbNode(rejectPt[0], rejectPt[1], 'REJECT', ROLE.fail, {
            radius: 52,
            sub: '6*4 misses 5 & 7',
            opacity: vf,
          }),
          beamWithPhotons(
            quadArcPts([checkPt[0] + rCheck + 10, 18], [validPt[0] - rAcc - 10, validPt[1]], 20),
            ROLE.ok,
            p * 1.1 + 0.5,
            { alpha: vf, width: 3.6 },
          ),
          orbNode(validPt[0], validPt[1], 'ACCEPT', ROLE.ok, {
            radius: 52,
            sub: '(6-4)*(5+7) = 24',
            opacity: vf,
          }),
        );
      }

      // Bottom summary
      nodes.push(line([-820, 290], [820, 290], { stroke: '#25355a', width: 2 }).opacity(0.65));
      nodes.push(
        txt(
          vf > 0.45
            ? 'AGREEMENT COUNTS REPEATED ANSWERS (3/3)  ·  VERIFIER TESTS CONSTRAINTS (0/3)'
            : sh > 0.35
              ? 'High agreement (3/3 for 24) while 5 and 7 remain unused'
              : 'Self-consistency helps when errors scatter across different wrong answers',
          0,
          360,
          26,
          vf > 0.45 ? ROLE.focus : sh > 0.35 ? ROLE.fail : COSMOS.muted,
          'mono',
          'center',
        ),
      );

      return group(...nodes);
    },
  );

  s.add(stageAura, header, view);

  c.on('votes-and-checks-beat-1-focus-1', () => {
    s.play(
      pulse.to(0.35, {
        duration: clampDur(c, c.cue('votes-and-checks-beat-1-focus-1').start, 0.25),
      }),
    );
  });
  c.on('votes-and-checks-beat-2-focus-1', () => {
    s.play(
      sharedHi.to(1, {
        duration: clampDur(c, c.cue('votes-and-checks-beat-2-focus-1').start, 0.35),
      }),
    );
  });
  c.on('votes-and-checks-beat-3-focus-1', () => {
    s.play(
      checkOn.to(1, {
        duration: clampDur(c, c.cue('votes-and-checks-beat-3-focus-1').start, 0.35),
      }),
    );
  });
  c.on('votes-and-checks-beat-3-focus-2', () => {
    s.play(checkOn.to(1, { duration: 0.15 }));
  });
  c.on('reason-result-checked-votes', () => {
    s.play(
      verifiedOn.to(1, { duration: clampDur(c, c.cue('reason-result-checked-votes').start, 0.4) }),
    );
  });
}
