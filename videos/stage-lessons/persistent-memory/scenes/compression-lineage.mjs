// Scene 08: compression-lineage
// Pyramid compression loss ("8 -> 2x4 -> 2 items"), source-link recovery ("canary only"),
// and unsupported extraction rejection ("merge after CI" vs "merge now").
import { circle, group, line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  beamWithPhotons,
  cinemaHeader,
  clampDur,
  driftValue,
  fadeInHalf,
  glowDot,
  guardedDynamic,
  memNode,
  quadArcPts,
  trimSeg,
  txt,
} from '../parts.mjs';

export default function compressionLineage(s, c) {
  const phase = s.value(0);
  const grpStage = s.value(0);
  const apexStage = s.value(0);
  const lostCond = s.value(0);
  const reopenCond = s.value(0);
  const badExtract = s.value(0);
  const rejectExt = s.value(0);

  const header = cinemaHeader('COMPRESSION LINEAGE', 'What Did the Summary', 'Leave Out?', {
    x: -860,
    y: -445,
    accent: ROLE.score,
    size: 46,
  });

  const bgAuras = aura(0, 40, 680, '#60a5fa1a', '#ffd16618');

  const leftX = -460;
  const msgXs = [-805, -706, -607, -508, -412, -313, -214, -115];
  const msgY = 260;
  const g1Pos = [-656, 40];
  const g2Pos = [-264, 40];
  const apexPos = [-460, -155];

  const visual = guardedDynamic(
    () => 1,
    () => {
      const p = phase.value;
      const gSt = grpStage.value;
      const aSt = apexStage.value;
      const lost = lostCond.value;
      const reop = reopenCond.value;
      const bad = badExtract.value;
      const rej = rejectExt.value;

      const nodes = [];

      nodes.push(
        txt('HIERARCHICAL SUMMARY PYRAMID', leftX, -278, 26, ROLE.archive, 'mono', 'center'),
      );

      const msgR = 36;
      for (let i = 0; i < 8; i++) {
        const mx = msgXs[i];
        const highlightSrc = i === 2 && reop > 0.5;
        const col = highlightSrc ? ROLE.ok : ROLE.archive;
        nodes.push(
          circle(msgR, { fill: '#0b1326', stroke: col, width: highlightSrc ? 4 : 2.8 })
            .at(mx, msgY)
            .glow(highlightSrc ? 12 : 6, col),
          txt(`T${i + 1}`, mx, msgY, 26, col, 'mono', 'center'),
        );
        if (gSt > 0.05) {
          const target = i < 4 ? g1Pos : g2Pos;
          const [a, b] = trimSeg([mx, msgY], target, msgR + 8, 88);
          nodes.push(
            line(a, b, {
              stroke: highlightSrc ? ROLE.ok : ROLE.prompt,
              width: highlightSrc ? 3.8 : 2.2,
            }).opacity(0.85 * gSt),
          );
        }
      }
      nodes.push(
        txt('8 ORIGINAL TURNS (T1..T8)', leftX, msgY + 74, 26, COSMOS.muted, 'mono', 'center'),
      );

      if (gSt > 0.02) {
        const n1 = memNode(g1Pos[0], g1Pos[1], '4 items', ROLE.prompt, {
          radius: 62,
          opacity: gSt,
        });
        const n2 = memNode(g2Pos[0], g2Pos[1], '4 items', ROLE.prompt, {
          radius: 62,
          opacity: gSt,
        });
        nodes.push(n1.node, n2.node);
      }

      if (aSt > 0.02) {
        const [e1a, e1b] = trimSeg(g1Pos, apexPos, 90, 90);
        const [e2a, e2b] = trimSeg(g2Pos, apexPos, 90, 90);
        nodes.push(
          beamWithPhotons([e1a, e1b], ROLE.score, p, { width: 3.2, photonCount: 1, alpha: aSt }),
          beamWithPhotons([e2a, e2b], ROLE.score, p + 0.5, {
            width: 3.2,
            photonCount: 1,
            alpha: aSt,
          }),
        );
        const apex = memNode(apexPos[0], apexPos[1], '2 items', ROLE.score, {
          radius: 66,
          opacity: aSt,
        });
        nodes.push(apex.node);
      }

      // Right half: Lineage & Claim Audit (pure floating cinema rails, zero boxes)
      const rx = 425;
      nodes.push(
        txt('PROVENANCE & CONDITION AUDIT', rx, -430, 26, ROLE.score, 'mono', 'center'),
        txt('keep turn IDs at every level', rx, -384, 26, COSMOS.muted, 'mono', 'center'),
      );

      const topY = -165;
      const sumColor = reop > 0.5 ? ROLE.ok : lost > 0.5 ? ROLE.pending : ROLE.prompt;
      nodes.push(
        line([90, topY - 64], [760, topY - 64], { stroke: sumColor, width: 2.5 }).opacity(0.65),
        txt('SUMMARY CLAIM', rx, topY - 26, 26, sumColor, 'mono', 'center'),
        txt(
          lost > 0.5 ? '"rollout approved"' : 'count alone hides words',
          rx,
          topY + 24,
          30,
          COSMOS.ink,
          'mono',
          'center',
        ),
      );

      // STRICT PREDICTION WITHHOLDING: show "?" until reopen-condition!
      if (reop > 0.05) {
        const revAlpha = fadeInHalf(reop);
        const linkPts = quadArcPts([msgXs[2], msgY - msgR - 12], [90, topY + 78], 135, 28);
        nodes.push(
          beamWithPhotons(linkPts, ROLE.ok, p, { width: 3.6, photonCount: 2, alpha: reop }),
          txt('SOURCE T3: "canary only"', rx, topY + 80, 30, ROLE.ok, 'mono', 'center').opacity(
            revAlpha,
          ),
        );
      } else if (lost > 0.5) {
        nodes.push(txt('SOURCE SCOPE:  [ ? ]', rx, topY + 80, 28, ROLE.score, 'mono', 'center'));
      } else {
        nodes.push(
          txt('link back -> turn IDs T1..T8', rx, topY + 80, 26, COSMOS.muted, 'mono', 'center'),
        );
      }

      const botY = 175;
      const extColor = rej > 0.5 ? ROLE.fail : bad > 0.5 ? ROLE.pending : ROLE.policy;
      nodes.push(
        line([90, botY - 108], [760, botY - 108], { stroke: extColor, width: 2.5 }).opacity(0.65),
        txt('FIELD EXTRACTION CHECK', rx, botY - 68, 26, extColor, 'mono', 'center'),
        txt('SOURCE:    "merge after CI"', rx, botY - 14, 26, ROLE.ok, 'mono', 'center'),
        txt(
          bad > 0.5 ? 'EXTRACTED: "merge now" (conf 0.90)' : 'REQUIRE: field + source + support',
          rx,
          botY + 38,
          26,
          bad > 0.5 ? ROLE.pending : COSMOS.muted,
          'mono',
          'center',
        ),
        txt(
          rej > 0.5
            ? 'REJECTED: missing "after CI" condition'
            : bad > 0.5
              ? 'confidence 0.90 is uncalibrated'
              : 'cap tokens per summary tier',
          rx,
          botY + 90,
          26,
          rej > 0.5 ? ROLE.fail : COSMOS.muted,
          'mono',
          'center',
        ),
      );

      const dotX = -760 + ((p * 110) % 240);
      nodes.push(glowDot(dotX, 425, { radius: 4.5, color: ROLE.score, glow: 8, opacity: 0.7 }));

      return group(...nodes);
    },
  );

  s.add(bgAuras, header, visual);
  driftValue(s, c, phase, 3.8);

  c.on('compress-groups', () => {
    s.play(grpStage.to(1, { duration: clampDur(c, c.cue('compress-groups').start, 0.5) }));
  });
  c.on('compress-again', () => {
    s.play(apexStage.to(1, { duration: clampDur(c, c.cue('compress-again').start, 0.5) }));
  });
  c.on('summary-lost-condition', () => {
    s.play(lostCond.to(1, { duration: clampDur(c, c.cue('summary-lost-condition').start, 0.4) }));
  });
  c.after('reopen-condition', () => {
    s.play(reopenCond.to(1, { duration: clampDur(c, c.cue('reopen-condition').end, 0.5) }));
  });
  c.after('unsupported-extraction', () => {
    s.play(badExtract.to(1, { duration: clampDur(c, c.cue('unsupported-extraction').end, 0.45) }));
  });
  c.after('reject-extraction', () => {
    s.play(rejectExt.to(1, { duration: clampDur(c, c.cue('reject-extraction').end, 0.4) }));
  });
}
