// Pure-cinema grounding non-inferiority ruler shared by guardrails & fresh-grounding scenes.
import { line } from 'vizmatic/stage';
import {
  BAD_COLOR,
  BUDGET,
  COSMOS,
  CTRL_COLOR,
  GOOD_COLOR,
  TRT_COLOR,
  WARN_COLOR,
  glowDot,
  groundingPacket,
  report,
  rule,
  txt,
} from './parts.mjs';

export const signedPp = (v) => (v < 0 ? '−' : '+') + Math.abs(v).toFixed(2);

// Builds pure-cinema ruler frame + row elements inside a guardedDynamic callback.
export function buildAuditRulerNodes({
  left = -350,
  right = 820,
  axisY = 175,
  topY = -225,
  rows = [],
}) {
  const x = (pp) => left + ((pp + 1.0) / 2.0) * (right - left);
  const cutX = x(BUDGET.grounding);

  const nodes = [
    txt(
      'GROUNDING FAILURE DELTA (REWRITE − CONTROL, PERCENTAGE POINTS)',
      left,
      topY - 62,
      26,
      COSMOS.cyan,
      'mono',
      'left',
    ),
    // Fixed non-inferiority cutoff (+0.50 pp)
    line([cutX, topY], [cutX, axisY], { stroke: WARN_COLOR, width: 4.5, dash: [10, 7] }).glow(
      8,
      WARN_COLOR,
    ),
    txt('BUDGET +0.50 pp', cutX, topY - 26, 26, WARN_COLOR, 'mono').glow(6, WARN_COLOR),
    // Zero reference line
    line([x(0), topY + 25], [x(0), axisY], { stroke: COSMOS.rule, width: 2.2 }),
    // Horizontal percentage-point axis
    rule(left, axisY, right, axisY, COSMOS.muted, 3),
  ];

  [-1.0, -0.5, 0, 0.5, 1.0].forEach((v) => {
    const tx = x(v);
    nodes.push(
      rule(tx, axisY, tx, axisY + 12, COSMOS.muted, 2.5),
      txt(
        v === 0 ? '0' : signedPp(v),
        tx,
        axisY + 42,
        26,
        v === BUDGET.grounding ? WARN_COLOR : COSMOS.muted,
        'mono',
      ),
    );
  });

  rows.forEach((cfg) => {
    const {
      y,
      failures,
      label,
      color = CTRL_COLOR,
      spread = 0,
      showPoint = 1,
      showUpper = 0,
      showBadge = 0,
      opacity = 1,
    } = cfg;
    const pkt = groundingPacket(failures);
    const est = pkt.delta * 100;
    const margin = 100 * 1.96 * pkt.se * spread;
    const loX = x(est - margin);
    const hiX = x(est + margin);
    const estX = x(est);

    nodes.push(
      txt(label, -855, y - 26, 30, color, 'sans', 'left').opacity(opacity),
      txt(
        `Ctrl ${report.control.groundingFailures}/2000 · Trt ${failures}/2000`,
        -855,
        y + 18,
        26,
        COSMOS.muted,
        'mono',
        'left',
      ).opacity(opacity),
      rule(left, y, right, y, COSMOS.rule, 2).opacity(opacity * 0.7),
    );

    if (showPoint > 0.02) {
      if (spread > 0.02) {
        const bandCol = showBadge > 0.5 ? (pkt.passes ? GOOD_COLOR : BAD_COLOR) : color;
        nodes.push(
          line([loX, y], [hiX, y], { stroke: bandCol, width: 8 }).glow(8, bandCol).opacity(opacity),
          line([loX, y - 16], [loX, y + 16], { stroke: bandCol, width: 4.5 }).opacity(opacity),
          line([hiX, y - 16], [hiX, y + 16], { stroke: bandCol, width: 4.5 }).opacity(opacity),
        );
      }
      nodes.push(
        glowDot(estX, y, {
          radius: 11,
          color: color === TRT_COLOR ? COSMOS.blue : color,
          glow: 12,
          opacity: showPoint * opacity,
        }),
      );
      if (showUpper > 0.02) {
        const tipCol = pkt.passes ? GOOD_COLOR : BAD_COLOR;
        const tipText = `${signedPp(pkt.upper * 100)} pp`;
        nodes.push(
          txt(
            tipText,
            pkt.passes ? hiX - 58 : hiX + 18,
            y - 44,
            28,
            tipCol,
            'mono',
            pkt.passes ? 'center' : 'left',
          )
            .glow(6, tipCol)
            .opacity(showUpper * opacity),
        );
      }
    }
  });

  return nodes;
}
