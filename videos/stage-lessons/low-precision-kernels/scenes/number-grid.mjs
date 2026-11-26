// Scene 04: Which neighbor wins a tie? Live E4M3 round-to-nearest-even probe + binade widening at 2.0.
import { delay, par } from 'vizmatic/stage';
import {
  COSMOS,
  aura,
  bitStrip8,
  encode8,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  hexByte,
  line,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function numberGrid(s, c) {
  const phase = s.value(0);
  const probe1 = s.value(1.0);
  const probe2 = s.value(2.125);
  const showLSB = s.value(0);
  const showBinade1 = s.value(1);
  const showBinade2 = s.value(0);

  const bgAura = aura(120, 30, 580, '#ffd1661f', '#5ce1e61a');
  const title = heroTitle(['Which Neighbor', 'Wins a Tie?'], {
    x: -855,
    y: -415,
    size: 62,
    lineHeight: 72,
    accent: COSMOS.gold,
    eyebrow: 'OCP E4M3 · ROUND-TO-NEAREST-EVEN',
  });

  const rx0 = -780;
  const rx1 = 780;
  const ry = -30;

  const renderBinade = (alpha, { domMin, domMax, ticks, xVal, isWide }) => {
    const lsb = showLSB.value;
    const enc = encode8(xVal, 'ocp');
    const mapX = (v) => rx0 + ((v - domMin) / (domMax - domMin)) * (rx1 - rx0);

    const nodes = [
      txt(
        isWide
          ? 'BINADE CROSSING AT 2.0 · STEP DOUBLES FROM 1/8 TO 1/4'
          : 'MAGNIFIED E4M3 NUMBER LINE · STEP = 1/8 = 0.125',
        0,
        ry - 110,
        26,
        isWide ? COSMOS.rose : COSMOS.cyan,
        'mono',
      ).opacity(alpha),
      line([rx0, ry], [rx1, ry], { stroke: '#465885', width: 3.4 }).opacity(alpha),
    ];

    for (const tv of ticks) {
      const tx = mapX(tv);
      const tEnc = encode8(tv, 'ocp');
      const isChosen = Math.abs(tv - enc.value) < 1e-9;
      const isEven = (tEnc.code & 1) === 0;
      const col = isChosen ? COSMOS.emerald : tv >= 2 ? COSMOS.rose : COSMOS.cyan;
      nodes.push(
        line([tx, ry - 26], [tx, ry + 26], { stroke: col, width: isChosen ? 4.4 : 2.6 }).opacity(
          alpha,
        ),
        glowDot(tx, ry, { radius: isChosen ? 8 : 5, color: col, opacity: alpha }),
        txt(
          tv.toFixed(tv % 0.25 === 0 ? 2 : 3),
          tx,
          ry + 62,
          26,
          isChosen ? COSMOS.emerald : COSMOS.ink,
          'mono',
        ).opacity(alpha),
        txt(
          `${hexByte(tEnc.code)} (${isEven ? 'even' : 'odd'})`,
          tx,
          ry + 98,
          26,
          isChosen ? COSMOS.gold : COSMOS.muted,
          'mono',
        ).opacity(alpha),
      );
    }

    if (!isWide) {
      for (const mp of [1.0625, 1.1875]) {
        const mx = mapX(mp);
        nodes.push(
          line([mx, ry - 48], [mx, ry + 12], {
            stroke: COSMOS.gold,
            width: 2,
            dash: [6, 6],
          }).opacity(0.65 * alpha),
          txt(String(mp), mx, ry - 66, 26, COSMOS.gold, 'mono').opacity(0.85 * alpha),
        );
      }
    } else {
      const bx = mapX(2.0);
      nodes.push(
        line([bx, ry - 48], [bx, ry + 36], { stroke: COSMOS.rose, width: 3, dash: [8, 6] }).opacity(
          alpha,
        ),
        txt('step 1/8 ←  2.0  → step 1/4', bx, ry - 72, 26, COSMOS.rose, 'mono')
          .glow(5, COSMOS.rose)
          .opacity(alpha),
      );
    }

    const px = mapX(xVal);
    nodes.push(
      glowDot(px, ry - 22, { radius: 10, color: COSMOS.gold, opacity: alpha }),
      txt(`x = ${xVal.toFixed(4)}`, px, ry - 152, 30, COSMOS.gold, 'mono')
        .glow(6, COSMOS.gold)
        .opacity(alpha),
      // Bottom left: Stored 8-bit register with LSB highlighted
      txt('STORED E4M3 BYTE (LOW BIT DECIDES TIES)', -440, 178, 26, COSMOS.muted, 'mono').opacity(
        alpha,
      ),
      bitStrip8(enc.code, -440, 268, {
        cellW: 62,
        cellH: 58,
        gap: 7,
        mode: 'e4m3',
        highlightIndices: lsb > 0.3 ? [7] : [],
        opacity: alpha,
      }),
      // Bottom right: Current rounding readout (stable caption, zero flicker!)
      glassCell(440, 272, 740, 174, isWide ? COSMOS.rose : COSMOS.emerald, {
        fill: '#101a2c',
        glow: 9,
        opacity: alpha,
      }),
      txt(
        isWide ? 'NEXT BINADE [2, 4) · 8 SPACES / WIDTH 2' : 'ROUND-TO-NEAREST-EVEN RESULT',
        440,
        214,
        26,
        COSMOS.muted,
        'mono',
      ).opacity(alpha),
      txt(
        `${xVal.toFixed(4)} → ${enc.value} (${hexByte(enc.code)})`,
        440,
        274,
        36,
        isWide ? COSMOS.rose : COSMOS.emerald,
        'mono',
      )
        .glow(7, isWide ? COSMOS.rose : COSMOS.emerald)
        .opacity(alpha),
      txt('Tie rule: even low bit (LSB = 0) wins', 440, 328, 26, COSMOS.gold, 'mono').opacity(
        alpha,
      ),
    );

    return group(...nodes);
  };

  const view1 = guardedDynamic(showBinade1, (a) =>
    renderBinade(a, {
      domMin: 0.96,
      domMax: 1.42,
      ticks: [1.0, 1.125, 1.25, 1.375],
      xVal: probe1.value,
      isWide: false,
    }),
  );

  const view2 = guardedDynamic(showBinade2, (a) =>
    renderBinade(a, {
      domMin: 1.8,
      domMax: 2.58,
      ticks: [1.875, 2.0, 2.25, 2.5],
      xVal: probe2.value,
      isWide: true,
    }),
  );

  s.add(bgAura, title, view1, view2);
  runPhase(s, c, phase, 14);

  c.on('number-grid-beat-1-focus-1', () =>
    s.play(probe1.to(1.045, { duration: remainDuration(c, 'number-grid-beat-1-focus-1', 1.2) })),
  );
  c.on('number-grid-beat-2-focus-1', () => {
    s.play(probe1.to(1.0625, { duration: 0.45 }));
    s.play(showLSB.to(1, { duration: 0.35 }));
  });
  c.on('number-grid-next-midpoint', () =>
    s.play(probe1.to(1.1875, { duration: remainDuration(c, 'number-grid-next-midpoint', 0.65) })),
  );
  c.on('number-grid-exponent-spacing', () => {
    s.play(
      par(
        showBinade1.to(0, { duration: 0.2 }),
        delay(showBinade2.to(1, { duration: 0.25 }), 0.22),
        delay(
          probe2.to(2.375, { duration: remainDuration(c, 'number-grid-exponent-spacing', 1.0) }),
          0.26,
        ),
      ),
    );
  });
}
