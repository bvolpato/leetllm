// Scene 20 (takeaway): "Could someone reproduce this decision?"
// Reproducible decision audit trail: inc-14 first question + follow-up -> 1 matured incident -> full receipt filed alongside original audit interval & HOLD!
import {
  BAD_COLOR,
  COSMOS,
  CTRL_COLOR,
  GOOD_COLOR,
  WARN_COLOR,
  aura,
  glowArrow,
  guardedDynamic,
  heroTitle,
  lumBar,
  tweenCue,
  txt,
} from '../parts.mjs';

export default function takeawayScene(s, c) {
  const showFollow = s.value(0);
  const showWindow = s.value(0);
  const showReceipt = s.value(0);
  const showOrig = s.value(0);
  const showInspect = s.value(0);

  const bgAura = aura(0, 20, 620, '#133a4a32', '#3a183b1e');
  const title = heroTitle(['Reproducible Evidence:', 'File the Full Decision Trail'], {
    x: -855,
    y: -430,
    size: 52,
    lineHeight: 60,
    accent: CTRL_COLOR,
    eyebrow: 'AUDITABILITY & LINEAGE',
  });

  const live = guardedDynamic(s.value(1), () => {
    const nodes = [
      txt(
        'LINEAGE OF INCIDENT #14 (TWO MESSAGES → ONE UNIT)',
        -855,
        -245,
        26,
        CTRL_COLOR,
        'mono',
        'left',
      ),

      // Left pipeline: Turn 1 + Follow-up -> Matured Outcome
      lumBar(-555, -135, 580, 92, { color: CTRL_COLOR, fillOpacity: 0.16, glow: 7 }),
      txt('Turn 1: inc-14 · v7 · CONTROL', -820, -135, 26, CTRL_COLOR, 'mono', 'left'),

      lumBar(-555, -10, 580, 92, {
        color: CTRL_COLOR,
        fillOpacity: 0.14,
        glow: 6,
        opacity: 0.45 + 0.55 * showFollow.value,
      }),
      txt('Follow-up: inc-14 · same CONTROL', -820, -10, 26, CTRL_COLOR, 'mono', 'left').opacity(
        0.45 + 0.55 * showFollow.value,
      ),

      glowArrow([-245, -72], [-80, -72], GOOD_COLOR, {
        width: 4,
        opacity: 0.45 + 0.55 * showWindow.value,
      }),

      // Center: One matured denominator unit
      lumBar(205, -72, 520, 140, {
        color: GOOD_COLOR,
        fillOpacity: 0.16,
        glow: 8,
        opacity: 0.45 + 0.55 * showWindow.value,
      }),
      txt('10-MIN MATURED UNIT', 205, -102, 26, GOOD_COLOR, 'mono').opacity(
        0.45 + 0.55 * showWindow.value,
      ),
      txt('Contributes 1 row to denominator', 205, -52, 26, COSMOS.ink, 'sans').opacity(
        0.45 + 0.55 * showWindow.value,
      ),

      // Lower ledger: Filed decision bundle
      lumBar(-430, 155, 810, 140, {
        color: WARN_COLOR,
        fillOpacity: 0.14,
        glow: 7,
        opacity: 0.45 + 0.55 * showReceipt.value,
      }),
      txt('REPRODUCIBILITY RECEIPT', -805, 118, 26, WARN_COLOR, 'mono', 'left').opacity(
        0.45 + 0.55 * showReceipt.value,
      ),
      txt(
        'Hash rule · Policy versions · Planned N · Outcome query',
        -805,
        175,
        26,
        COSMOS.ink,
        'sans',
        'left',
      ).opacity(0.45 + 0.55 * showReceipt.value),

      lumBar(445, 155, 800, 140, {
        color: BAD_COLOR,
        fillOpacity: 0.16,
        glow: 8,
        opacity: 0.4 + 0.6 * showOrig.value,
      }),
      txt('FILED ORIGINAL DECISION: HOLD', 75, 118, 26, BAD_COLOR, 'mono', 'left').opacity(
        0.4 + 0.6 * showOrig.value,
      ),
      txt(
        '22 vs 23 audits · Upper +0.70 > +0.50 pp',
        75,
        175,
        26,
        COSMOS.ink,
        'sans',
        'left',
      ).opacity(0.4 + 0.6 * showOrig.value),
    ];

    if (showInspect.value > 0.02) {
      nodes.push(
        txt(
          'Inspect failed passages against the runbook (“requirement” → “permission”); new frequency claims need a fresh test.',
          -855,
          325,
          26,
          COSMOS.cyan,
          'sans',
          'left',
        ).opacity(showInspect.value),
      );
    }

    return nodes;
  });

  s.add(bgAura, title, live);

  tweenCue(s, c, 'follow', showFollow, 1, { duration: 0.45 });
  tweenCue(s, c, 'window', showWindow, 1, { duration: 0.45 });
  tweenCue(s, c, 'receipt', showReceipt, 1, { duration: 0.45 });
  tweenCue(s, c, 'original', showOrig, 1, { duration: 0.45 });
  tweenCue(s, c, 'inspect', showInspect, 1, { duration: 0.45 });
}
