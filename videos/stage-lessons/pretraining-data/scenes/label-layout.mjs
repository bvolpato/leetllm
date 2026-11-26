// Scene 21: Shift each target exactly once: 5-token packed block [11, 12, 99, 21, 99], 5x5 mask, pre-shifted vs internal-shift labels (both supervise 3 predictions).
import { delay, par } from 'vizmatic/stage';
import {
  COSMOS,
  LABEL_DOCS,
  LABEL_IDS,
  LABEL_OBJ,
  aura,
  glassCell,
  glowDot,
  glowingTrail,
  group,
  guardedDynamic,
  heroTitle,
  rect,
  remainAfterDuration,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function labelLayout(s, c) {
  const phase = s.value(0);
  const idsLit = s.value(0);
  const showPart1 = s.value(1);
  const blockedOn = s.value(0);

  const showPart2 = s.value(0);
  const shiftedOn = s.value(0);
  const threeOn = s.value(0);

  const showPart3 = s.value(0);
  const unshiftedOn = s.value(0);
  const intShiftOn = s.value(0);
  const onceOn = s.value(0);

  const bgAura = aura(0, 0, 640, '#16274e2a', '#5ce1e614');
  const title = heroTitle(['Shift Each Target', 'Exactly Once'], {
    x: -855,
    y: -435,
    size: 54,
    lineHeight: 64,
    accent: COSMOS.cyan,
    eyebrow: 'PACKED LOSS ALIGNMENT · DOC IDs [0, 0, 0, 1, 1]',
  });

  // Persistent top strip: Input IDs + Document IDs
  const topStrip = guardedDynamic(s.value(1), () => {
    const il = idsLit.value;
    const leftX = -460;
    const pitch = 245;
    const nodes = [
      txt('INPUT IDs', -680, -210, 28, COSMOS.blue, 'mono', 'right'),
      txt('DOC IDs', -680, -112, 28, COSMOS.cyan, 'mono', 'right'),
    ];
    LABEL_IDS.forEach((id, i) => {
      const cx = leftX + i * pitch;
      const isDoc1 = LABEL_DOCS[i] === 1;
      const col = isDoc1 ? COSMOS.cyan : COSMOS.blue;
      nodes.push(
        txt(`pos ${i}`, cx, -278, 26, COSMOS.dim, 'mono'),
        glassCell(cx, -210, 210, 72, col, { fill: '#0f182c', glow: 4 + il * 5 }),
        txt(String(id), cx, -208, 34, COSMOS.ink, 'mono'),
        glassCell(cx, -112, 210, 66, col, { fill: '#0c1526', glow: 3 }),
        txt(`doc ${LABEL_DOCS[i]}`, cx, -110, 28, col, 'mono'),
      );
    });
    // Vertical glowing seam between pos 2 (doc 0) and pos 3 (doc 1)
    nodes.push(
      glowingTrail(
        [
          [leftX + 2.5 * pitch, -258],
          [leftX + 2.5 * pitch, -68],
        ],
        { color: COSMOS.rose, width: 4, glow: 10 },
      ),
    );
    return group(...nodes);
  });

  // Part 1: 5x5 block-diagonal mask highlighting query 3 -> key 2 blocked
  const part1Live = guardedDynamic(showPart1, (a) => {
    const bl = blockedOn.value;
    const cell = 64;
    const gap = 8;
    const gx0 = -580;
    const gy0 = 20;
    const nodes = [
      txt('5x5 INDEPENDENT-DOC MASK', gx0 + 175, gy0 - 30, 26, COSMOS.cyan, 'mono').opacity(a),
    ];

    for (let r = 0; r < 5; r++) {
      for (let k = 0; k < 5; k++) {
        const cx = gx0 + k * (cell + gap) + cell * 0.5;
        const cy = gy0 + r * (cell + gap) + cell * 0.5;
        const ok = LABEL_OBJ.mask[r][k] === 1;
        const isTarget = r === 3 && k === 2;
        const fill = isTarget && bl > 0.4 ? '#361322' : ok ? '#10283c' : '#0b0e18';
        const stroke = isTarget && bl > 0.4 ? COSMOS.rose : ok ? COSMOS.cyan : '#25314d';
        nodes.push(
          rect(cell, cell, { fill, stroke, width: isTarget ? 3.2 : 1.6, radius: 6 })
            .at(cx, cy)
            .opacity((ok || isTarget ? 0.96 : 0.45) * a),
        );
        if (ok) {
          nodes.push(glowDot(cx, cy, { radius: 6, color: COSMOS.cyan, glow: 8, opacity: a }));
        } else if (isTarget && bl > 0.4) {
          nodes.push(txt('X', cx, cy + 2, 30, COSMOS.rose, 'mono').opacity(bl * a));
        }
      }
    }

    nodes.push(
      glassCell(355, 165, 860, 210, bl > 0.4 ? COSMOS.rose : COSMOS.gold, {
        fill: bl > 0.4 ? '#22101c' : '#12182b',
        glow: 9,
        opacity: a,
      }),
      txt('Query pos 3 (doc 1) -> Key pos 2 (doc 0)', 355, 112, 30, COSMOS.gold, 'mono').opacity(a),
      txt(
        bl > 0.4 ? 'BLOCKED · -inf additive / False boolean' : 'Check same-document causal rule',
        355,
        175,
        32,
        bl > 0.4 ? COSMOS.rose : COSMOS.ink,
        'mono',
      ).opacity(a),
      txt(
        'Multiplying a logit by 0 does not mask it in softmax',
        355,
        235,
        26,
        COSMOS.muted,
        'sans',
      ).opacity(a),
    );
    return group(...nodes);
  });

  // Part 2: Loader pre-shifted targets [12, 99, -100, 99, -100] -> 3 supervised predictions
  const part2Live = guardedDynamic(showPart2, (a) => {
    const sh = shiftedOn.value;
    const th = threeOn.value;
    const leftX = -460;
    const pitch = 245;

    const nodes = [
      txt('PRE-SHIFTED', -680, 95, 28, COSMOS.emerald, 'mono', 'right').opacity(a),
      txt('TARGETS', -680, 132, 26, COSMOS.muted, 'mono', 'right').opacity(a),
    ];

    LABEL_OBJ.targets.forEach((t, i) => {
      const cx = leftX + i * pitch;
      const isIgn = t === -100;
      const col = sh > 0.4 ? (isIgn ? COSMOS.rose : COSMOS.emerald) : COSMOS.dim;
      nodes.push(
        glassCell(cx, 110, 210, 90, col, {
          fill: sh > 0.4 && isIgn ? '#24101c' : '#0f2026',
          glow: sh > 0.4 ? 8 : 2,
          opacity: a,
          dash: isIgn ? [8, 6] : undefined,
        }),
        txt(sh > 0.4 ? (isIgn ? '-100' : String(t)) : '...', cx, 112, 34, col, 'mono').opacity(a),
      );
    });

    if (th > 0.02) {
      nodes.push(
        txt('3 supervised targets: 12, 99, 99', 0, 268, 38, COSMOS.emerald, 'mono')
          .glow(8, COSMOS.emerald)
          .opacity(th * a),
        txt('-100 masks loss only, not attention', 0, 375, 32, COSMOS.gold, 'sans').opacity(th * a),
      );
    }

    return group(...nodes);
  });

  // Part 3: Unshifted labels [11, 12, 99, -100, 99] -> model shifts once -> [12, 99, -100, 99]
  const part3Live = guardedDynamic(showPart3, (a) => {
    const un = unshiftedOn.value;
    const is = intShiftOn.value;
    const oc = onceOn.value;
    const leftX = -460;
    const pitch = 245;

    const nodes = [
      txt('UNSHIFTED', -680, 72, 28, COSMOS.cyan, 'mono', 'right').opacity(a),
      txt('LABELS', -680, 108, 26, COSMOS.muted, 'mono', 'right').opacity(a),
    ];

    LABEL_OBJ.labels.forEach((lbl, i) => {
      const cx = leftX + i * pitch;
      const isIgn = lbl === -100;
      const col = un > 0.4 ? (isIgn ? COSMOS.rose : COSMOS.cyan) : COSMOS.dim;
      nodes.push(
        glassCell(cx, 88, 210, 78, col, {
          fill: un > 0.4 && isIgn ? '#24101c' : '#0e1d2e',
          glow: un > 0.4 ? 7 : 2,
          opacity: a,
          dash: isIgn ? [8, 6] : undefined,
        }),
        txt(un > 0.4 ? (isIgn ? '-100' : String(lbl)) : '...', cx, 90, 32, col, 'mono').opacity(a),
      );
    });

    if (is > 0.02) {
      const shiftedOnce = LABEL_OBJ.labels.slice(1);
      nodes.push(
        txt('INTERNAL SHIFT', -680, 232, 26, COSMOS.emerald, 'mono', 'right').opacity(is * a),
      );
      shiftedOnce.forEach((lbl, i) => {
        const cx = leftX + i * pitch;
        const isIgn = lbl === -100;
        const col = isIgn ? COSMOS.rose : COSMOS.emerald;
        nodes.push(
          glassCell(cx, 230, 210, 78, col, {
            fill: isIgn ? '#24101c' : '#0e2522',
            glow: 8,
            opacity: is * a,
            dash: isIgn ? [8, 6] : undefined,
          }),
          txt(isIgn ? '-100' : String(lbl), cx, 232, 32, col, 'mono').opacity(is * a),
        );
      });
      nodes.push(
        txt('Same 3 targets', leftX + 4 * pitch, 232, 28, COSMOS.emerald, 'mono').opacity(is * a),
      );
    }

    if (oc > 0.02) {
      nodes.push(
        txt(
          'Never feed already-shifted targets into an internally shifting model!',
          0,
          388,
          34,
          COSMOS.rose,
          'sans',
        )
          .glow(8, COSMOS.rose)
          .opacity(oc * a),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, title, topStrip, part1Live, part2Live, part3Live);
  runPhase(s, c, phase, 14);

  c.on('pt-label-layout-ids', () =>
    s.play(idsLit.to(1, { duration: remainDuration(c, 'pt-label-layout-ids', 0.6) })),
  );
  c.on('pt-label-layout-blocked', () =>
    s.play(blockedOn.to(1, { duration: remainDuration(c, 'pt-label-layout-blocked', 0.6) })),
  );

  c.onBeat(1, () => {
    s.play(
      par(showPart1.to(0, { duration: 0.2 }), delay(showPart2.to(1, { duration: 0.25 }), 0.22)),
    );
  });
  c.on('pt-label-layout-shifted', () =>
    s.play(shiftedOn.to(1, { duration: remainDuration(c, 'pt-label-layout-shifted', 0.6) })),
  );
  c.on('pt-label-layout-three', () =>
    s.play(threeOn.to(1, { duration: remainDuration(c, 'pt-label-layout-three', 0.45) })),
  );

  c.onBeat(2, () => {
    s.play(
      par(showPart2.to(0, { duration: 0.2 }), delay(showPart3.to(1, { duration: 0.25 }), 0.22)),
    );
  });
  c.on('pt-label-layout-unshifted', () =>
    s.play(unshiftedOn.to(1, { duration: remainDuration(c, 'pt-label-layout-unshifted', 0.6) })),
  );
  c.on('pt-label-layout-internal-shift', () =>
    s.play(
      intShiftOn.to(1, { duration: remainDuration(c, 'pt-label-layout-internal-shift', 0.6) }),
    ),
  );
  c.on('pt-label-layout-once', () =>
    s.play(onceOn.to(1, { duration: remainDuration(c, 'pt-label-layout-once', 0.5) })),
  );
}
