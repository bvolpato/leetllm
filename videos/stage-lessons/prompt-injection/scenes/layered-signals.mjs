// Scene 18: layered-signals - What did the detector flag?
// 3-row Signal vs Policy Gate Matrix backed directly by `DETECTOR_EXAMPLES`:
//   Row 1: "Recommended for release."  -> Detector FLAG (TP) | Release Gate DENY
//   Row 2: "Candidate ready to ship."  -> Detector MISS (FN) | Release Gate STILL DENY
//   Row 3: Manual quoting the phrase   -> Detector FLAG (FP) | Read Policy ALLOW SUMMARY
import { group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  DETECTOR_EXAMPLES,
  ROLE,
  aura,
  beamWithPhotons,
  cinemaHeader,
  clampDur,
  energyRail,
  guardedDynamic,
  quadArcPts,
  txt,
} from '../parts.mjs';

export default function layeredSignals(s, c) {
  const pulse = s.value(0);
  const row0Hi = s.value(0);
  const row1Hi = s.value(0);
  const row2Hi = s.value(0);
  const writesGate = s.value(0);
  const readGate = s.value(0);

  const header = cinemaHeader('LAYERED SIGNALS vs POLICY', 'What did the', 'detector flag?', {
    accent: ROLE.untrusted,
    size: 50,
  });

  const stageAura = aura(120, 30, 620, '#fb923c1a', '#5ce1e61a');

  const view = guardedDynamic(
    () => 1,
    () => {
      const p = 0;
      const r0 = row0Hi.value;
      const r1 = row1Hi.value;
      const r2 = row2Hi.value;
      const wg = writesGate.value;
      const rg = readGate.value;
      const nodes = [];

      // Column headers
      nodes.push(
        txt('INPUT PASSAGE', -825, -210, 26, COSMOS.muted, 'mono', 'left'),
        txt('DETECTOR SIGNAL', 130, -210, 26, ROLE.untrusted, 'mono', 'center'),
        txt('INDEPENDENT POLICY GATE', 625, -210, 26, ROLE.host, 'mono', 'center'),
        line([-855, -176], [845, -176], { stroke: '#28385f', width: 2 }),
      );

      const rows = [
        {
          y: -85,
          ex: DETECTOR_EXAMPLES[0],
          tag: 'ORIGINAL ATTACK',
          detLabel: 'FLAGGED (TP)',
          detCol: ROLE.host,
          gateLabel: 'RELEASE: DENIED',
          gateSub: 'no approval',
          gateCol: ROLE.denied,
          hi: r0,
          gateHi: wg,
        },
        {
          y: 75,
          ex: DETECTOR_EXAMPLES[1],
          tag: 'PARAPHRASE ATTACK',
          detLabel: 'NO ALERT (MISS)',
          detCol: ROLE.untrusted,
          gateLabel: 'RELEASE: DENIED',
          gateSub: 'no approval',
          gateCol: ROLE.denied,
          hi: r1,
          gateHi: wg,
        },
        {
          y: 235,
          ex: DETECTOR_EXAMPLES[2],
          tag: 'BENIGN MANUAL',
          detLabel: 'FLAGGED (FALSE POS)',
          detCol: ROLE.attack,
          gateLabel: 'READ: ALLOWED',
          gateSub: 'authorized summary',
          gateCol: ROLE.ok,
          hi: r2,
          gateHi: rg,
        },
      ];

      for (const row of rows) {
        const y = row.y;
        const leftCol = row.ex.kind === 'benign' ? ROLE.source : ROLE.attack;

        nodes.push(
          energyRail(-855, y - 48, y + 48, leftCol, { width: 6, glow: 6 + row.hi * 6 }),
          txt(row.tag, -825, y - 24, 26, leftCol, 'mono', 'left'),
          txt(`“${row.ex.text}”`, -825, y + 24, 26, COSMOS.ink, 'sans', 'left'),
        );

        // Beam -> Generously wide Detector Signal badge (370px)
        const b1 = quadArcPts([-225, y], [-62, y], 0, 14);
        nodes.push(
          beamWithPhotons(b1, row.detCol, p * 0.9, { width: 3.0, alpha: 0.45 + row.hi * 0.55 }),
          rect(370, 74, {
            fill: '#0e1529',
            stroke: row.detCol,
            width: row.hi > 0.3 ? 3 : 2,
            radius: 8,
          })
            .at(130, y)
            .glow(row.hi > 0.3 ? 8 : 2, row.detCol),
          txt(row.detLabel, 130, y, 26, row.detCol, 'mono', 'center'),
        );

        // Beam -> Independent Policy Gate badge
        const b2 = quadArcPts([322, y], [435, y], 0, 14);
        const gAlpha = 0.45 + row.gateHi * 0.55;
        nodes.push(
          beamWithPhotons(b2, row.gateCol, p * 0.9 + 0.5, { width: 3.2, alpha: gAlpha }),
          rect(365, 86, {
            fill: '#0e1529',
            stroke: row.gateCol,
            width: row.gateHi > 0.3 ? 3.2 : 2,
            radius: 10,
          })
            .at(625, y)
            .glow(row.gateHi > 0.3 ? 9 : 2, row.gateCol)
            .opacity(gAlpha),
          txt(row.gateLabel, 625, y - 16, 26, row.gateCol, 'mono', 'center').opacity(gAlpha),
          txt(row.gateSub, 625, y + 22, 26, COSMOS.muted, 'sans', 'center').opacity(gAlpha),
        );
      }

      nodes.push(
        line([-855, 330], [845, 330], { stroke: '#25355a', width: 2 }),
        txt(
          'DETECTORS ROUTE REVIEW · MESSAGE STRUCTURE, TYPED FIELDS & PERMISSIONS DECIDE EFFECTS',
          0,
          380,
          26,
          wg > 0.3 || rg > 0.3 ? ROLE.host : COSMOS.muted,
          'mono',
          'center',
        ),
      );

      return group(...nodes);
    },
  );

  s.add(stageAura, header, view);

  c.on('layered-signals-beat-1-focus-1', () => {
    s.play(
      row0Hi.to(1, { duration: clampDur(c, c.cue('layered-signals-beat-1-focus-1').start, 0.35) }),
    );
  });
  c.on('signals-paraphrase', () => {
    s.play(row1Hi.to(1, { duration: clampDur(c, c.cue('signals-paraphrase').start, 0.35) }));
  });
  c.on('signals-benign-manual', () => {
    s.play(row2Hi.to(1, { duration: clampDur(c, c.cue('signals-benign-manual').start, 0.35) }));
  });
  c.on('signals-writes', () => {
    s.play(writesGate.to(1, { duration: clampDur(c, c.cue('signals-writes').start, 0.4) }));
  });
  c.on('layered-signals-beat-2-focus-1', () => {
    s.play(
      readGate.to(1, { duration: clampDur(c, c.cue('layered-signals-beat-2-focus-1').start, 0.4) }),
    );
  });
}
