// Scene 02 (randomize): "Where does the follow-up go?"
// Locked hash split (inc-14 -> bucket 58 -> Control; inc-1 -> bucket 27 -> Treatment) + follow-up prediction hold + stored arm pinning + spillover warning.
import {
  BAD_COLOR,
  COSMOS,
  CTRL_COLOR,
  GOOD_COLOR,
  TRT_COLOR,
  WARN_COLOR,
  aura,
  glowArrow,
  glowDot,
  glowRing,
  guardedDynamic,
  heroTitle,
  lumBar,
  rule,
  runAmbientPhase,
  tweenCue,
  txt,
} from '../parts.mjs';

export default function randomize(s, c) {
  const phase = s.value(0);
  const showFirst = s.value(0);
  const showSecond = s.value(0);
  const showFollow = s.value(0);
  const showStored = s.value(0);
  const showMix = s.value(0);
  const showSpill = s.value(0);

  const bgAura = aura(0, 20, 620, '#133a4a32', '#261b4f20');
  const title = heroTitle(['Sticky Incident Hash:', 'Where Does the Follow-Up Go?'], {
    x: -855,
    y: -430,
    size: 52,
    lineHeight: 60,
    accent: CTRL_COLOR,
    eyebrow: 'RANDOMIZATION & THREAD PINNING',
  });

  const live = guardedDynamic(s.value(1), () => {
    const bLeft = -780;
    const bRight = 780;
    const bY = -125;
    const xB = (b) => bLeft + (b / 99) * (bRight - bLeft);
    const midX = xB(49.5);

    const nodes = [
      txt(
        'LOCKED HASH BUCKETS  0 .. 99   (SHA-256 of version | incident_id)',
        -855,
        -245,
        26,
        COSMOS.cyan,
        'mono',
        'left',
      ),
      // Treatment half [0..49] & Control half [50..99]
      lumBar((bLeft + midX) / 2, bY, midX - bLeft - 6, 56, {
        color: TRT_COLOR,
        fillOpacity: 0.22,
        glow: 6,
      }),
      lumBar((midX + bRight) / 2, bY, bRight - midX - 6, 56, {
        color: CTRL_COLOR,
        fillOpacity: 0.22,
        glow: 6,
      }),
      txt('0 .. 49  →  TREATMENT (REWRITE)', (bLeft + midX) / 2, bY, 26, TRT_COLOR, 'mono'),
      txt('50 .. 99  →  CONTROL (RAW)', (midX + bRight) / 2, bY, 26, CTRL_COLOR, 'mono'),
      rule(midX, bY - 46, midX, bY + 46, WARN_COLOR, 3.5),

      // Stored assignment ledger (left & right lanes)
      txt('INCIDENT LEDGER (STORED ARM + VERSION)', -855, 25, 26, COSMOS.muted, 'mono', 'left'),
      lumBar(-430, 125, 810, 96, {
        color: CTRL_COLOR,
        fillOpacity: 0.14,
        glow: 7,
        opacity: 0.45 + 0.55 * showFirst.value,
      }),
      txt(
        'inc-14  →  bucket 58  →  CONTROL (stored)',
        -805,
        125,
        28,
        CTRL_COLOR,
        'mono',
        'left',
      ).opacity(0.45 + 0.55 * showFirst.value),

      lumBar(445, 125, 800, 96, {
        color: TRT_COLOR,
        fillOpacity: 0.14,
        glow: 7,
        opacity: 0.45 + 0.55 * showSecond.value,
      }),
      txt(
        'inc-01  →  bucket 27  →  TREATMENT (stored)',
        75,
        125,
        28,
        TRT_COLOR,
        'mono',
        'left',
      ).opacity(0.45 + 0.55 * showSecond.value),
    ];

    if (showFirst.value > 0.02) {
      const x14 = xB(58);
      nodes.push(
        glowDot(x14, bY - 62, { radius: 9, color: CTRL_COLOR, glow: 12, opacity: showFirst.value }),
        txt('inc-14 (58)', x14, bY - 96, 26, CTRL_COLOR, 'mono').opacity(showFirst.value),
      );
    }
    if (showSecond.value > 0.02) {
      const x1 = xB(27);
      nodes.push(
        glowDot(x1, bY - 62, { radius: 9, color: TRT_COLOR, glow: 12, opacity: showSecond.value }),
        txt('inc-01 (27)', x1, bY - 96, 26, TRT_COLOR, 'mono').opacity(showSecond.value),
      );
    }

    // Incoming follow-up from inc-14
    if (showFollow.value > 0.02) {
      nodes.push(
        lumBar(-430, 265, 810, 74, {
          color: WARN_COLOR,
          fillOpacity: 0.16,
          glow: 8,
          opacity: showFollow.value,
        }),
        txt(
          'FOLLOW-UP:  inc-14 (after seeing Control)',
          -805,
          265,
          26,
          WARN_COLOR,
          'mono',
          'left',
        ).opacity(showFollow.value),
      );
    }

    // Strict prediction withholding: question fades out before stored-arm answer appears!
    const qOp = showFollow.value * Math.max(0, 1 - showStored.value * 2.6);
    if (qOp > 0.02) {
      nodes.push(
        txt('Where does inc-14’s follow-up go?', 75, 265, 32, WARN_COLOR, 'serif', 'left')
          .glow(7, WARN_COLOR)
          .opacity(qOp),
      );
    }

    const ansOp = Math.max(0, (showStored.value - 0.45) / 0.55);
    if (ansOp > 0.02) {
      nodes.push(
        glowArrow([-430, 224], [-430, 178], GOOD_COLOR, { width: 4, opacity: ansOp }),
        txt('→ Back to stored CONTROL arm!', 75, 265, 30, GOOD_COLOR, 'mono', 'left')
          .glow(7, GOOD_COLOR)
          .opacity(ansOp),
      );
    }

    // Bottom: Mix warning -> Spillover check (non-overlapping)
    const mixOp = showMix.value * Math.max(0, 1 - showSpill.value * 2.6);
    if (mixOp > 0.02) {
      nodes.push(
        txt(
          'Flipping arms mid-thread mixes both policies (engineer reacted to Control first)',
          -855,
          375,
          28,
          BAD_COLOR,
          'sans',
          'left',
        ).opacity(mixOp),
      );
    }
    const spillOp = Math.max(0, (showSpill.value - 0.45) / 0.55);
    if (spillOp > 0.02) {
      nodes.push(
        txt(
          'Watch spillovers: two separate incident IDs can still share an engineer or GPU worker',
          -855,
          375,
          28,
          COSMOS.cyan,
          'sans',
          'left',
        ).opacity(spillOp),
      );
    }

    return nodes;
  });

  s.add(bgAura, title, live);
  runAmbientPhase(s, c, phase, 2.2);

  tweenCue(s, c, 'first', showFirst, 1, { duration: 0.45 });
  tweenCue(s, c, 'second', showSecond, 1, { duration: 0.45 });
  tweenCue(s, c, 'follow', showFollow, 1, { duration: 0.45 });
  tweenCue(s, c, 'stored', showStored, 1, { duration: 0.45, after: true });
  tweenCue(s, c, 'mix', showMix, 1, { duration: 0.45 });
  tweenCue(s, c, 'spill', showSpill, 1, { duration: 0.45 });
}
