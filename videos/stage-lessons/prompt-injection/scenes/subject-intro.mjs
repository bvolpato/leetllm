// Scene 1: subject-intro - Will C17 get live traffic?
// Optical report conduit on the left emits a sliding golden promotion slip toward the
// right-hand 100-square live traffic matrix and approval lookup gate. Holds prediction
// strictly until after `intro-answer`, then slams the gate to DENIED (0% traffic) while
// returning an emerald summary beam to the user.
import { circle, group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  PROPOSAL,
  REPORT,
  ROLE,
  aura,
  beamWithPhotons,
  cinemaHeader,
  clampDur,
  energyRail,
  fadeInHalf,
  fadeOutHalf,
  guardedDynamic,
  hexGate,
  quadArcPts,
  trafficMatrix,
  txt,
} from '../parts.mjs';

export default function subjectIntro(s, c) {
  const pulse = s.value(0);
  const sourceHi = s.value(0);
  const resultHi = s.value(0);
  const attackHi = s.value(0);
  const slipMove = s.value(0);
  const lookupEmpty = s.value(0);
  const questionOn = s.value(0);
  const answerReveal = s.value(0);
  const summaryBeam = s.value(0);

  const header = cinemaHeader('PROMPT INJECTION · RELEASE GATE', 'Will C17 get', 'live traffic?', {
    accent: ROLE.attack,
    size: 50,
  });

  const stageAura = aura(240, 20, 640, '#ff6b8b1e', '#5ce1e618');

  const view = guardedDynamic(
    () => 1,
    () => {
      const p = 0;
      const sh = sourceHi.value;
      const rh = resultHi.value;
      const ah = attackHi.value;
      const sm = slipMove.value;
      const le = lookupEmpty.value;
      const qn = questionOn.value;
      const ar = answerReveal.value;
      const sb = summaryBeam.value;
      const nodes = [];

      // Left: External evaluation report provenance rail (always visible from t=0)
      nodes.push(
        energyRail(-850, -185, 225, ROLE.source, { width: 6, glow: 8 + sh * 6 }),
        txt('RETRIEVED REPORT', -822, -165, 26, ROLE.source, 'mono', 'left'),
        txt(REPORT.source, -822, -118, 26, COSMOS.muted, 'mono', 'left'),
        txt(
          'TASK: Summarize evaluation',
          -822,
          -62,
          28,
          sh > 0.3 ? ROLE.host : COSMOS.ink,
          'sans',
          'left',
        ),
        line([-822, -26], [-300, -26], { stroke: '#263459', width: 2 }),
        txt(REPORT.result, -822, 24, 30, rh > 0.3 ? ROLE.ok : COSMOS.ink, 'sans', 'left').glow(
          rh > 0.3 ? 6 : 0,
          ROLE.ok,
        ),
        txt(
          `“${REPORT.attack}”`,
          -822,
          96,
          30,
          ah > 0.2 ? ROLE.proposal : COSMOS.muted,
          'serif',
          'left',
        ).glow(ah > 0.2 ? 8 : 0, ROLE.proposal),
        txt('External author text · No authority', -822, 162, 26, ROLE.untrusted, 'mono', 'left'),
      );

      // Center: Vertical dashed trust boundary + sliding golden proposal slip
      const wallX = -155;
      nodes.push(
        line([wallX, -230], [wallX, 240], { stroke: '#334673', width: 2.5, dash: [10, 10] }),
        txt('TRUST BOUNDARY', wallX, -262, 26, COSMOS.dim, 'mono', 'center'),
      );

      const slipX = -195 + sm * 230;
      const slipY = 48;
      const slipColor = ar > 0.5 ? ROLE.denied : ROLE.proposal;
      nodes.push(
        rect(290, 134, {
          fill: '#13182a',
          stroke: slipColor,
          width: 3,
          radius: 10,
        })
          .at(slipX, slipY)
          .glow(8, slipColor),
        txt('PROPOSED WRITE', slipX, slipY - 36, 26, slipColor, 'mono', 'center'),
        txt(
          `${PROPOSAL.candidate} -> prod ${PROPOSAL.traffic}%`,
          slipX,
          slipY + 8,
          28,
          COSMOS.ink,
          'mono',
          'center',
        ),
        txt(`rev ${PROPOSAL.revision}`, slipX, slipY + 46, 26, COSMOS.muted, 'mono', 'center'),
      );

      // Beam connecting report attack line -> proposal slip
      if (sm > 0.05) {
        const pts = quadArcPts([-340, 96], [slipX - 150, slipY], -45, 22);
        nodes.push(
          beamWithPhotons(pts, ROLE.proposal, p * 1.1, {
            width: 3.2,
            alpha: sm,
            photonCount: 2,
          }),
        );
      }

      // Right: Release Service 100-square live traffic grid (0% lit) + Approval Gate
      const gridX = 230;
      const gridY = -245;
      nodes.push(
        txt('RELEASE SERVICE · C17 TRAFFIC', gridX, -295, 26, ROLE.host, 'mono', 'left'),
        trafficMatrix(gridX, gridY, 31, 0, ROLE.ok),
        txt(
          'CURRENT LIVE TRAFFIC: 0%  (shadow · rev 3)',
          gridX,
          -62,
          26,
          COSMOS.muted,
          'mono',
          'left',
        ),
      );

      // Approval lookup gate below grid
      const gateX = 530;
      const gateY = 98;
      const gateCol = ar > 0.5 ? ROLE.denied : le > 0.3 ? ROLE.untrusted : ROLE.host;
      nodes.push(
        hexGate(gateX, gateY, 72, gateCol, {
          label: ar > 0.5 ? 'DENIED' : le > 0.3 ? 'EMPTY' : 'APPROVAL',
          sub:
            ar > 0.5
              ? 'NO MATCHING APPROVAL'
              : le > 0.3
                ? 'APPROVAL LOOKUP: EMPTY'
                : 'CHECK APPROVAL STORE',
          glow: 10,
        }),
      );

      // Beam from proposal slip to approval gate
      const toGate = quadArcPts([slipX + 150, slipY], [gateX - 108, gateY], -24, 20);
      nodes.push(
        beamWithPhotons(toGate, gateCol, p * 0.9, {
          width: 3,
          alpha: 0.45 + le * 0.5,
          photonCount: 2,
        }),
      );

      // Bottom band: Strict non-overlapping crossfade from prediction question -> verified answer
      const preAlpha = fadeOutHalf(ar);
      const postAlpha = fadeInHalf(ar);

      if (preAlpha > 0.02) {
        nodes.push(
          txt(
            qn > 0.3
              ? 'Should the release service apply the proposed 25%?'
              : 'Trace the 25% proposal back to its source and approval lookup...',
            0,
            345,
            34,
            ROLE.question,
            'serif',
            'center',
          )
            .glow(qn > 0.3 ? 8 : 4, ROLE.question)
            .opacity(preAlpha),
        );
      }

      if (postAlpha > 0.02) {
        nodes.push(
          txt('DENIED · C17 STAYS AT 0% LIVE TRAFFIC', 0, 325, 38, ROLE.denied, 'mono', 'center')
            .glow(10, ROLE.denied)
            .opacity(postAlpha),
        );
        if (sb > 0.05) {
          nodes.push(
            txt(
              'Summary still allowed: “C17 passed its tests.”  ·  Text steered the assistant = prompt injection',
              0,
              388,
              28,
              ROLE.ok,
              'sans',
              'center',
            )
              .glow(6, ROLE.ok)
              .opacity(postAlpha * sb),
          );
        }
      }

      return group(...nodes);
    },
  );

  s.add(stageAura, header, view);

  c.on('intro-proposal-moves', () => {
    s.play(slipMove.to(1, { duration: clampDur(c, c.cue('intro-proposal-moves').start, 0.7) }));
  });
  c.on('intro-source', () => {
    s.play(sourceHi.to(1, { duration: clampDur(c, c.cue('intro-source').start, 0.35) }));
  });
  c.on('intro-result', () => {
    s.play(resultHi.to(1, { duration: clampDur(c, c.cue('intro-result').start, 0.35) }));
  });
  c.on('intro-request', () => {
    s.play(attackHi.to(1, { duration: clampDur(c, c.cue('intro-request').start, 0.35) }));
  });
  c.on('intro-lookup', () => {
    s.play(lookupEmpty.to(1, { duration: clampDur(c, c.cue('intro-lookup').start, 0.35) }));
  });
  // Prediction boundary cue: hold question without revealing answer
  c.after('intro-question', () => {
    s.play(questionOn.to(1, { duration: clampDur(c, c.cue('intro-question').end, 0.25) }));
  });
  // Strict prediction withholding: reveal DENIED / 0% ONLY AFTER spoken answer clause
  c.after('intro-answer', () => {
    s.play(answerReveal.to(1, { duration: clampDur(c, c.cue('intro-answer').end, 0.35) }));
  });
  c.on('intro-summary', () => {
    s.play(summaryBeam.to(1, { duration: clampDur(c, c.cue('intro-summary').start, 0.4) }));
  });
}
