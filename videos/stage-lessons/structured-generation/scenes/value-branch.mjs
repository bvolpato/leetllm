// Scene 6: value-branch - A legal choice can still be the wrong choice
// Continuous glowing probability-split optical ribbon between passed (weight 2) and fa (weight 3 -> 6).
// Smoothly glides the boundary from 40/60 to 25/75 while feeding photon beams into both valid
// branches, then brings back the CI runner log to prove legal != truthful.
import { group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  RUN_LOG,
  VALUE_PREFIX,
  aura,
  beamWithPhotons,
  cinemaHeader,
  clampDur,
  driftValue,
  fsmNode,
  glowDot,
  guardedDynamic,
  normalizedWeights,
  opticalRail,
  quadArcPts,
  txt,
} from '../parts.mjs';

export default function valueBranch(s, c) {
  const pulse = s.value(0);
  const weightsHi = s.value(0);
  const doubleProg = s.value(0);
  const sourceShow = s.value(0);

  const header = cinemaHeader(
    'LEGALITY VS TRUTH',
    'A legal choice can still',
    'be the wrong choice',
    { accent: ROLE.fsm, size: 50 },
  );

  const stageAura = aura(160, 40, 640, '#5ce1e620', '#ffd16618');

  const stageView = guardedDynamic(
    () => 1,
    () => {
      const p = pulse.value;
      const wh = weightsHi.value;
      const dp = doubleProg.value;
      const ss = sourceShow.value;
      const nodes = [];

      const wPass = 2;
      const wFail = 3 + 3 * dp;
      const [pPass, pFail] = normalizedWeights([wPass, wFail], [0, 1]);

      const xLeft = -820;
      const totalW = 1640;
      const stripY = -10;
      const stripH = 104;
      const passW = totalW * pPass;
      const failW = totalW * pFail;
      const seamX = xLeft + passW;

      nodes.push(
        txt(`PREFIX: ${VALUE_PREFIX}`, -820, -210, 32, ROLE.prefix, 'mono', 'left').glow(
          6,
          ROLE.prefix,
        ),
        txt(
          'NEXT-TOKEN PROBABILITY STRIP (BOTH BRANCHES LEGAL)',
          -820,
          -110,
          26,
          COSMOS.muted,
          'mono',
          'left',
        ),
      );

      // Two glowing optical probability segments meeting at a live moving boundary seam
      const leftBar = rect(passW - 4, stripH, {
        fill: '#18305a',
        stroke: ROLE.schema,
        width: 3,
        radius: 10,
      }).at(xLeft + passW * 0.5, stripY);
      const rightBar = rect(failW - 4, stripH, {
        fill: '#0e3642',
        stroke: ROLE.fsm,
        width: 3,
        radius: 10,
      }).at(seamX + failW * 0.5, stripY);
      if (wh > 0.2) {
        leftBar.glow(8, ROLE.schema);
        rightBar.glow(10, ROLE.fsm);
      }

      nodes.push(
        leftBar,
        rightBar,
        // Glowing seam beacon
        line([seamX, stripY - 72], [seamX, stripY + 72], { stroke: ROLE.prefix, width: 4.5 }).glow(
          12,
          ROLE.prefix,
        ),
        glowDot(seamX, stripY - 72, { radius: 6.5, color: ROLE.prefix, glow: 14 }),
        // Percentages inside bars
        txt(
          `${Math.round(pPass * 100)}%`,
          xLeft + passW * 0.5,
          stripY,
          44,
          ROLE.schema,
          'mono',
          'center',
        ).glow(6, ROLE.schema),
        txt(
          `${Math.round(pFail * 100)}%`,
          seamX + failW * 0.5,
          stripY,
          44,
          ROLE.fsm,
          'mono',
          'center',
        ).glow(8, ROLE.fsm),
        // Token labels & live weights below strip
        txt('passed', xLeft, stripY + 100, 40, ROLE.schema, 'mono', 'left'),
        txt(`weight: ${wPass}`, xLeft, stripY + 150, 28, COSMOS.muted, 'mono', 'left'),
        txt('fa -> failed', xLeft + totalW, stripY + 100, 40, ROLE.fsm, 'mono', 'right'),
        txt(
          `weight: ${Number(wFail.toFixed(1))}  (${Number((wPass + wFail).toFixed(1))} total)`,
          xLeft + totalW,
          stripY + 150,
          28,
          dp > 0.5 ? ROLE.legal : COSMOS.muted,
          'mono',
          'right',
        ),
      );

      // Right-top grammar branch indicator (both terminals legal!)
      const b1 = [470, -340];
      const b2 = [730, -395];
      const b3 = [730, -285];
      nodes.push(
        beamWithPhotons(quadArcPts([b1[0] + 28, b1[1]], [b2[0] - 28, b2[1]], -10), ROLE.schema, p, {
          width: 2.8,
          photonCount: 1,
        }),
        beamWithPhotons(
          quadArcPts([b1[0] + 28, b1[1]], [b3[0] - 28, b3[1]], 10),
          ROLE.fsm,
          p + 0.5,
          { width: 3.2, photonCount: 1 },
        ),
        fsmNode(b1[0], b1[1], 30, 'V', { color: ROLE.prefix, size: 26 }),
        fsmNode(b2[0], b2[1], 32, 'P', { color: ROLE.schema, accepting: true, size: 26 }),
        fsmNode(b3[0], b3[1], 32, 'F', { color: ROLE.fsm, accepting: true, size: 26 }),
      );

      // Bottom ground-truth evidence rail
      if (ss > 0.05) {
        nodes.push(
          opticalRail(-820, 240, 355, ROLE.prefix, { opacity: ss }),
          txt('RUNNER LOG (SOURCE OF TRUTH)', -785, 260, 26, ROLE.prefix, 'mono', 'left').opacity(
            ss,
          ),
          txt(RUN_LOG, -785, 315, 32, COSMOS.ink, 'sans', 'left').opacity(ss),
          txt(
            'GRAMMAR ALLOWS BOTH  ·  HOST MUST CHECK THE LOG',
            -785,
            370,
            26,
            ROLE.review,
            'mono',
            'left',
          )
            .glow(6, ROLE.review)
            .opacity(ss),
        );
      } else {
        nodes.push(
          txt(
            dp > 0.4
              ? 'Doubling fa from 3 to 6 moves the share to 6 / 8 = 75%, yet passed still keeps 25%'
              : 'Every surviving branch remains open to sampling',
            -820,
            290,
            30,
            COSMOS.muted,
            'serif',
            'left',
          ),
        );
      }

      return group(...nodes);
    },
  );

  s.add(stageAura, header, stageView);
  driftValue(s, c, pulse, 4.2, { startOffset: 0.1, endMargin: 0.5 });

  c.on('branch-weights', () => {
    s.play(weightsHi.to(1, { duration: clampDur(c, c.cue('branch-weights').start, 0.4) }));
  });
  c.on('branch-double', () => {
    s.play(doubleProg.to(1, { duration: clampDur(c, c.cue('branch-double').start, 0.85) }));
  });
  c.on('branch-source', () => {
    s.play(sourceShow.to(1, { duration: clampDur(c, c.cue('branch-source').start, 0.45) }));
  });
}
