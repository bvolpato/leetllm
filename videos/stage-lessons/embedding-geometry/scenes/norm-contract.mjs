// Scene 05: norm-contract: "Check the direction before dividing"
// Glowing 4-lane vector normalization conduit (zero boxed tables!) with max-abs rescaling prism,
// crimson rejection gate for zero/nonfinite vectors, and live query-doubling score beams.
import { arrow, dynamic, group, line } from 'vizmatic/stage';
import {
  COSMOS,
  METRICS,
  ROLE,
  cinemaAtmosphere,
  glowDot,
  glowRing,
  guardedDynamic,
  heroTitle,
  lumBar,
  playCue,
  robustUnit,
  rule,
  txt,
} from '../parts.mjs';

export default function normContract(s, c) {
  const unit = robustUnit([1e300, 1e300]);
  const unitStr = `${unit[0].toFixed(3)}, ${unit[1].toFixed(3)}`;

  const showInvalid = s.value(0);
  const showScale = s.value(0);
  const showResult = s.value(0);
  const showQuery = s.value(0);
  const qFactor = s.value(1);
  const litContract = s.value(0);

  const title = heroTitle(['Check the direction', 'before dividing'], {
    x: -855,
    y: -445,
    size: 50,
    lineHeight: 58,
    accent: ROLE.code,
    eyebrow: 'ROBUST NORMALIZATION',
  });

  // Top 4-lane vector pipeline
  const lanes = [
    { label: '10³⁰⁰, 10³⁰⁰', note: 'squaring overflows', valid: true, color: ROLE.A, y: -230 },
    {
      label: '10⁻³⁰⁰, 10⁻³⁰⁰',
      note: 'squaring underflows',
      valid: true,
      color: ROLE.code,
      y: -125,
    },
    { label: '0, 0', note: 'no direction', valid: false, color: ROLE.warn, y: -20 },
    { label: 'empty / nonfinite', note: 'NaN or ∞', valid: false, color: ROLE.danger, y: 85 },
  ];

  const pipelineLayer = dynamic(() => {
    const inv = showInvalid.value;
    const sc = showScale.value;
    const res = showResult.value;

    const nodes = [
      // Column headers (floating mono, no chrome)
      txt('INPUT VECTOR', -760, -296, 26, COSMOS.muted, 'mono', 'left'),
      txt('÷ max |v|', -115, -296, 26, ROLE.gold, 'mono'),
      txt('UNIT DIRECTION / PATH', 505, -296, 26, COSMOS.muted, 'mono'),
      // Subtle rescaling prism chamber framing the ÷ max|v| column (zero stroke crossing text)
      lumBar(-115, -72, 224, 396, {
        color: ROLE.gold,
        fillAlpha: 0.04,
        strokeWidth: 1.8,
        dash: [8, 7],
        glow: 4,
        opacity: 0.45 + 0.45 * sc,
      }),
    ];

    lanes.forEach((lane) => {
      // Input glowing node + conduit rail
      nodes.push(
        glowDot(-805, lane.y, { radius: 7, color: lane.color, glow: 9 }),
        txt(lane.label, -760, lane.y, 32, COSMOS.ink, 'mono', 'left'),
        line([-400, lane.y], [-245, lane.y], { stroke: lane.color, width: 2.6 }).opacity(0.6),
      );

      if (lane.valid) {
        // Scaled intermediate [1, 1]
        if (sc > 0.02) {
          nodes.push(
            lumBar(-115, lane.y, 175, 52, {
              color: ROLE.gold,
              fillAlpha: 0.16,
              strokeWidth: 2.2,
              glow: 7,
              opacity: sc,
            }),
            txt('1, 1', -115, lane.y, 32, ROLE.gold, 'mono').opacity(sc),
            arrow([-18, lane.y], [235, lane.y], { stroke: lane.color, width: 3, tip: 13 }).opacity(
              sc,
            ),
          );
        }
        // Final unit output [0.707, 0.707]
        if (res > 0.02) {
          nodes.push(
            lumBar(505, lane.y, 340, 56, {
              color: lane.color,
              fillAlpha: 0.2,
              strokeWidth: 2.5,
              glow: 9,
              opacity: res,
            }),
            txt(unitStr, 505, lane.y, 32, lane.color, 'mono').glow(5, lane.color).opacity(res),
          );
        }
      } else {
        // Invalid rows stop at rejection gate before scoring
        if (inv > 0.02) {
          nodes.push(
            glowRing(-115, lane.y, 20, lane.color, { width: 3, glow: 8, opacity: inv }),
            txt('×', -115, lane.y, 30, lane.color, 'mono').opacity(inv),
            txt(
              lane.label === '0, 0' ? 'reject zero before scoring' : 'reject invalid input',
              265,
              lane.y,
              30,
              lane.color,
              'mono',
              'left',
            )
              .glow(5, lane.color)
              .opacity(inv),
          );
        }
      }
    });

    return group(...nodes);
  });

  // Lower query-length scaling rig (Beat 2)
  const queryScaleLayer = guardedDynamic(showQuery, (a) => {
    const f = qFactor.value;
    const scoreA = METRICS[0].cosine * f;
    const scoreB = METRICS[1].cosine * f;
    const maxW = 540;
    const barA = (scoreA / 2.2) * maxW;
    const barB = (scoreB / 2.2) * maxW;
    const ct = litContract.value;

    return group(
      rule(-845, 165, 845, 165, COSMOS.rule, 1.8).opacity(0.6 * a),
      txt(`QUERY LENGTH  ×${f.toFixed(1)}`, -845, 212, 26, ROLE.query, 'mono', 'left').opacity(a),
      // Bar A
      txt('A', -845, 278, 32, ROLE.A, 'mono', 'left').opacity(a),
      lumBar(-780 + barA / 2, 278, barA, 34, {
        color: ROLE.A,
        fillAlpha: 0.36,
        glow: 8,
        opacity: a,
      }),
      txt(scoreA.toFixed(3), -760 + barA, 278, 30, ROLE.A, 'mono', 'left').opacity(a),
      // Bar B
      txt('B', -845, 348, 32, ROLE.B, 'mono', 'left').opacity(a),
      lumBar(-780 + barB / 2, 348, barB, 34, {
        color: ROLE.B,
        fillAlpha: 0.36,
        glow: 8,
        opacity: a,
      }),
      txt(scoreB.toFixed(3), -760 + barB, 348, 30, ROLE.B, 'mono', 'left').opacity(a),
      // Right callout: order preserved vs normalize query for true cosine
      txt('Order stays identical', 145, 250, 34, COSMOS.ink, 'serif', 'left').opacity(a),
      txt(
        'Normalize query too for true cosine or thresholds',
        145,
        312,
        28,
        ct > 0.4 ? ROLE.gold : COSMOS.muted,
        'sans',
        'left',
      )
        .glow(ct > 0.4 ? 8 : 0, ROLE.gold)
        .opacity(a),
      txt('Access still requires permission', 145, 366, 26, COSMOS.dim, 'mono', 'left').opacity(a),
    );
  });

  s.add(cinemaAtmosphere(ROLE.code, ROLE.warn), title, pipelineLayer, queryScaleLayer);

  playCue(s, c, 'invalid', (d) => s.play(showInvalid.to(1, { duration: d })), {
    after: true,
    dur: 0.45,
  });
  playCue(s, c, 'scale', (d) => s.play(showScale.to(1, { duration: d })), { dur: 0.65 });
  playCue(s, c, 'result', (d) => s.play(showResult.to(1, { duration: d })), {
    after: true,
    dur: 0.55,
  });
  c.onBeat(2, () => s.play(showQuery.to(1, { duration: 0.55 })));
  playCue(s, c, 'factor', (d) => s.play(qFactor.to(2, { duration: d })), { dur: 2.0 });
  playCue(s, c, 'contract', (d) => s.play(litContract.to(1, { duration: d })), { dur: 0.55 });
}
