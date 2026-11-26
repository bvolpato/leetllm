// Scene 18: teacher-margin - "What did the student copy?"
// Pure Cinema: View 1 animates student score orbs gliding into the teacher's exact reversed scores
// (MSE = 0 while non-match still ranks first). View 2 maps the raw cosine margin bound [-2, +2]
// against an unbounded +3.5 teacher margin, exposing the unclosable residual floor (1.5)^2 = 2.25.
import { line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  cinemaAtmosphere,
  glowRuler,
  glowTex,
  guardedDynamic,
  heroTitle,
  playAfter,
  playOn,
  rule,
  swapVis,
  txt,
  verifyApprox,
} from '../parts.mjs';

export default function teacherMargin(s, c) {
  const tPos = 0.2;
  const tNeg = 0.8;
  const margin = tPos - tNeg; // -0.6
  const limit = 2.0;
  const requested = 3.5;
  const residual = requested - limit;
  verifyApprox(residual ** 2, 2.25, 1e-12, 'minimum squared error for raw cosine student');

  const vCopy = s.value(1);
  const vRange = s.value(0);
  const hiTeacher = s.value(0);
  const copyT = s.value(0); // student glides from (0.4, 0.6) -> (0.2, 0.8)
  const showSigned = s.value(0);
  const showWrong = s.value(0);
  const showTarget = s.value(0);
  const showFloor = s.value(0);

  const title = heroTitle(['MarginMSE distillation:', 'what did the student copy?'], {
    x: -860,
    y: -450,
    size: 46,
    lineHeight: 54,
    accent: ROLE.competitor,
  });

  const eqFloor = glowTex('\\text{MSE}_{\\min} = (3.5 - 2.0)^2 = 2.25', {
    x: 0,
    y: 265,
    size: 44,
    color: ROLE.focus,
    glow: 8,
  });

  // View 1: Teacher vs Student Score Rulers
  const copyLayer = guardedDynamic(vCopy, (alpha) => {
    const ct = copyT.value;
    const sPos = 0.4 + (tPos - 0.4) * ct;
    const sNeg = 0.6 + (tNeg - 0.6) * ct;
    const sMargin = sPos - sNeg;
    const sw = showWrong.value;
    const ss = showSigned.value;
    const nodes = [];

    nodes.push(
      txt(
        ss > 0.3
          ? `Δ teacher = ${margin.toFixed(1)}     ·     Δ student = ${sMargin.toFixed(2)}`
          : 'TEACHER -> STUDENT SCORE MARGINS   (approved − non-match)',
        0,
        -290,
        32,
        ss > 0.3 ? ROLE.focus : ROLE.anchor,
        'mono',
        'center',
      )
        .glow(ss > 0.3 ? 6 : 3, ss > 0.3 ? ROLE.focus : ROLE.anchor)
        .opacity(alpha),
    );

    const rT = glowRuler({
      x: -740,
      y: -115,
      width: 1480,
      min: 0,
      max: 1,
      ticks: [0, 0.2, 0.4, 0.6, 0.8, 1.0],
      title: `TEACHER SCORES   (Δ = ${margin.toFixed(1)})`,
      titleColor: hiTeacher.value > 0.3 ? ROLE.focus : ROLE.anchor,
      band: {
        from: tPos,
        to: tNeg,
        color: ROLE.competitor,
        label: 'Δ = −0.6 (reversed!)',
        fillAlpha: 0.24,
      },
      points: [
        { value: tPos, color: ROLE.positive, label: 'approved (0.2)', below: true },
        { value: tNeg, color: ROLE.competitor, label: 'non-match (0.8)', below: true },
      ],
      opacity: alpha,
    });

    const rS = glowRuler({
      x: -740,
      y: 135,
      width: 1480,
      min: 0,
      max: 1,
      ticks: [0, 0.2, 0.4, 0.6, 0.8, 1.0],
      title: `STUDENT SCORES   (Δ = ${sMargin.toFixed(2)})`,
      titleColor: ROLE.anchor,
      band: {
        from: Math.min(sPos, sNeg),
        to: Math.max(sPos, sNeg),
        color: ROLE.anchor,
        fillAlpha: 0.2,
      },
      points: [
        { value: sPos, color: ROLE.positive, label: `approved (${sPos.toFixed(2)})`, below: true },
        {
          value: sNeg,
          color: ROLE.competitor,
          label: `non-match (${sNeg.toFixed(2)})`,
          below: true,
        },
      ],
      opacity: alpha,
    });

    nodes.push(rT.node, rS.node);

    nodes.push(rule(-850, 295, 850, 295, COSMOS.rule, 1.6).opacity(0.55 * alpha));
    if (sw > 0.05) {
      nodes.push(
        txt(
          'MSE = 0.00 · non-match still ranks first!',
          0,
          365,
          36,
          ROLE.competitor,
          'mono',
          'center',
        )
          .glow(8, ROLE.competitor)
          .opacity(sw * alpha),
      );
    } else {
      nodes.push(
        txt(
          'MarginMSE matches the teacher’s margin, including teacher ranking errors',
          0,
          365,
          30,
          COSMOS.muted,
          'sans',
          'center',
        ).opacity(alpha),
      );
    }

    return nodes;
  });

  // View 2: Cosine Student Reachable Margin Bound [-2, +2] vs Teacher Target +3.5
  const rangeLayer = guardedDynamic(vRange, (alpha) => {
    const st = showTarget.value;
    const sf = showFloor.value;
    const nodes = [
      txt(
        'RAW COSINE ∈ [−1, +1]   =>   STUDENT MARGIN ∈ [−2, +2]',
        0,
        -275,
        34,
        ROLE.anchor,
        'mono',
        'center',
      )
        .glow(6, ROLE.anchor)
        .opacity(alpha),
    ];

    const pts = [{ value: limit, color: ROLE.anchor, label: 'max student (+2.0)', below: false }];
    if (st > 0.2) {
      pts.push({
        value: requested,
        color: ROLE.competitor,
        label: 'teacher target (+3.5)',
        below: false,
      });
    }

    const rBound = glowRuler({
      x: -740,
      y: -45,
      width: 1480,
      min: -2,
      max: 4,
      ticks: [-2, -1, 0, 1, 2, 3, 4],
      formatTick: (v) => (v > 0 ? `+${v}` : String(v)),
      band: {
        from: -2,
        to: 2,
        color: ROLE.anchor,
        label: 'reachable cosine margins',
        height: 32,
        fillAlpha: 0.26,
      },
      points: pts,
      opacity: alpha,
    });
    nodes.push(rBound.node);

    // Unclosable 1.5 gap highlight
    if (st > 0.2) {
      const xLim = rBound.mapX(limit);
      const xReq = rBound.mapX(requested);
      nodes.push(
        line([xLim, 42], [xReq, 42], { stroke: ROLE.competitor, width: 5 })
          .glow(9, ROLE.competitor)
          .opacity(st * alpha),
        txt(
          'unclosable gap ≥ 1.5',
          (xLim + xReq) / 2,
          86,
          30,
          ROLE.competitor,
          'mono',
          'center',
        ).opacity(st * alpha),
      );
    }

    // Extreme-case cosine bound readout cleanly filling the lower canvas before eqFloor appears
    nodes.push(
      rule(-850, 130, 850, 130, COSMOS.rule, 1.5).opacity(0.55 * alpha),
      txt(
        'Extreme case:  cos(q, p⁺) = +1.0   and   cos(q, n⁻) = −1.0   =>   max margin = (+1) − (−1) = +2.0',
        0,
        175,
        28,
        COSMOS.muted,
        'mono',
        'center',
      ).opacity(alpha),
    );

    if (sf > 0.05) {
      nodes.push(
        txt(
          'Lowering temperature leaves raw cosine bounds unchanged · align target scales first',
          0,
          365,
          28,
          ROLE.positive,
          'sans',
          'center',
        ).opacity(sf * alpha),
      );
    } else {
      nodes.push(
        txt(
          'Unbounded teacher logits need a compatible mapping before computing MarginMSE',
          0,
          365,
          28,
          COSMOS.dim,
          'sans',
          'center',
        ).opacity(alpha),
      );
    }
    return nodes;
  });

  s.add(cinemaAtmosphere(ROLE.anchor, ROLE.competitor), title, copyLayer, rangeLayer);

  playOn(s, c, 'cl-teacher-margin-difference', (d) => hiTeacher.to(1, { duration: d }), 0.45);
  playOn(s, c, 'cl-teacher-margin-result', (d) => copyT.to(1, { duration: d }), 1.5);
  playAfter(s, c, 'cl-teacher-margin-result', (d) => showSigned.to(1, { duration: d }), 0.4);
  playAfter(s, c, 'cl-teacher-margin-wrong', (d) => showWrong.to(1, { duration: d }), 0.45);

  playOn(s, c, 'cl-teacher-margin-range', (d) => swapVis(vCopy, vRange, d), 0.65);
  playOn(s, c, 'teacher-target', (d) => showTarget.to(1, { duration: d }), 0.55);
  c.show('cl-teacher-margin-scale', eqFloor, { after: true });
  playAfter(s, c, 'cl-teacher-margin-scale', (d) => showFloor.to(1, { duration: d }), 0.5);
}
