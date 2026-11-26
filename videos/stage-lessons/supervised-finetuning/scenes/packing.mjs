// Scene 12: Two incidents in one block: Packing slide + orbiting 3D block-diagonal mask + cross-boundary -100 cut.
import {
  COSMOS,
  PACKED_TOKENS,
  PACK_SNAP,
  arrow,
  aura,
  buildPackedMask3d,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  line,
  orbitScene,
  remainDuration,
  runPhase,
  tokenPill,
  txt,
} from '../parts.mjs';

export default function packing(s, c) {
  const phase = s.value(0);
  const slideProg = s.value(0);
  const stageIdx = s.value(0); // 0=pack slide, 1=3D block-causal mask, 2=cross-boundary loss label
  const highlightB = s.value(0);
  const twoCells = s.value(0);
  const crossArrow = s.value(0);
  const cutJoin = s.value(0);

  const bgAura = aura(240, 20, 620, '#5ce1e622', '#ffd16614');
  const title = heroTitle(['Packed Sequences &', 'Block-Causal Masks'], {
    x: -855,
    y: -430,
    size: 52,
    lineHeight: 60,
    accent: COSMOS.cyan,
    eyebrow: 'PACKING · TWO INDEPENDENT BOUNDARIES',
  });

  const mask3d = buildPackedMask3d(twoCells, { x: 350, y: 35 });

  const slotX = (i) => -700 + i * 280;

  const live = guardedDynamic(1, () => {
    const p = phase.value;
    const sl = slideProg.value;
    const st = Math.round(stageIdx.value);
    const hb = highlightB.value;
    const tc = twoCells.value;
    const ca = crossArrow.value;
    const cj = cutJoin.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);

    const nodes = [];

    if (st === 0) {
      // Beat 0: Two padded rows slide into one packed 6-token block
      const rowAY = -115;
      const rowBY = 115;
      // Ghost padding slots disappear cleanly before B moves over them
      const padAlpha = sl < 0.08 ? 1 - sl / 0.08 : 0;
      if (padAlpha > 0.02) {
        for (let k = 3; k < 6; k++) {
          nodes.push(
            tokenPill('PAD', slotX(k), rowAY, {
              w: 236,
              h: 88,
              color: COSMOS.dim,
              fill: '#0b0e19',
              textColor: COSMOS.dim,
              dash: [8, 6],
              glow: 0,
              opacity: padAlpha * 0.55,
            }),
            tokenPill('PAD', slotX(k), rowBY, {
              w: 236,
              h: 88,
              color: COSMOS.dim,
              fill: '#0b0e19',
              textColor: COSMOS.dim,
              dash: [8, 6],
              glow: 0,
              opacity: padAlpha * 0.55,
            }),
          );
        }
      }

      PACKED_TOKENS.forEach((word, i) => {
        const isA = i < 3;
        const startX = isA ? slotX(i) : slotX(i - 3);
        const endX = slotX(i);
        const moveX = Math.min(1, sl * 1.4);
        const moveY = Math.max(0, Math.min(1, (sl - 0.55) / 0.45));
        const cx = isA ? startX : startX + (endX - startX) * moveX;
        const cy = isA ? rowAY : rowBY + (rowAY - rowBY) * moveY;
        nodes.push(
          tokenPill(word, cx, cy, {
            w: 236,
            h: 88,
            color: isA ? COSMOS.blue : COSMOS.cyan,
            textColor: COSMOS.ink,
            glow: 8,
            size: 28,
          }),
        );
      });

      if (sl > 0.85) {
        const wallX = (slotX(2) + slotX(3)) * 0.5;
        nodes.push(
          line([wallX, rowAY - 70], [wallX, rowAY + 70], { stroke: COSMOS.gold, width: 4 }).glow(
            10,
            COSMOS.gold,
          ),
        );
      }

      nodes.push(
        glassCell(0, 320, 1520, 102, sl > 0.85 ? COSMOS.cyan : COSMOS.blue, {
          fill: '#101829',
          glow: 8,
        }),
        txt(
          sl > 0.85
            ? 'One packed 6-slot block  ·  Still two completely independent demonstrations'
            : 'Short conversations waste half the row on empty padding slots',
          0,
          320,
          30,
          sl > 0.85 ? COSMOS.cyan : COSMOS.ink,
          'sans',
        ),
      );
    } else if (st === 1) {
      // Beat 1: Left readout + row 4 strip synced to the orbiting 3D block-diagonal mask on right!
      const maskRow4 = PACK_SNAP.mask[4];
      nodes.push(
        txt('3D BLOCK-CAUSAL ATTENTION MASK', 350, -370, 26, COSMOS.cyan, 'mono').glow(
          5,
          COSMOS.cyan,
        ),
        txt('POSITION IDs RESET AT SEGMENT B', -855, -195, 26, COSMOS.gold, 'mono', 'left'),
      );

      // Compact left-side vertical token + reset-position readout for B:answer (pos 4)
      PACKED_TOKENS.forEach((word, i) => {
        const y = -125 + i * 76;
        const allowed = maskRow4[i] === 1;
        const isQuery4 = i === 4;
        const isB = i >= 3;
        const col =
          allowed && tc > 0.4
            ? COSMOS.emerald
            : isQuery4 && hb > 0.3
              ? COSMOS.gold
              : isB
                ? COSMOS.cyan
                : COSMOS.dim;
        nodes.push(
          glassCell(-555, y, 590, 62, col, {
            fill: allowed && tc > 0.4 ? '#0d2b2b' : '#0f1628',
            dash: !allowed ? [6, 5] : undefined,
            glow: allowed && tc > 0.4 ? 10 * pulse : 0,
            opacity: allowed || isQuery4 ? 1 : 0.62,
          }),
          txt(`pos ${i % 3}`, -810, y, 26, COSMOS.muted, 'mono', 'left'),
          txt(word, -660, y, 26, COSMOS.ink, 'mono', 'left'),
          txt(
            allowed ? (tc > 0.4 ? 'CAN READ' : 'ALLOWED') : 'BLOCKED',
            -305,
            y,
            26,
            allowed ? COSMOS.emerald : COSMOS.dim,
            'mono',
            'right',
          ),
        );
        if (i === 2) {
          nodes.push(
            line([-855, y + 38], [-255, y + 38], { stroke: COSMOS.gold, width: 3 }).glow(
              7,
              COSMOS.gold,
            ),
          );
        }
      });

      nodes.push(
        txt(
          'B:answer reads ONLY B:prompt & B:answer (2 bright pillars)',
          350,
          410,
          27,
          COSMOS.emerald,
          'mono',
        ),
      );
    } else {
      // Beat 2: Loss-side cross-boundary join (A:EOS -> B:prompt severed by -100)
      const wallX = (slotX(2) + slotX(3)) * 0.5;
      const topY = -110;
      const botY = 165;

      nodes.push(
        txt('PACKED INPUT STREAM', -820, -238, 26, COSMOS.cyan, 'mono', 'left'),
        line([wallX, -210], [wallX, 212], { stroke: COSMOS.gold, width: 4.5 }).glow(
          10,
          COSMOS.gold,
        ),
        txt('SEGMENT JOIN', wallX, -242, 26, COSMOS.gold, 'mono'),
      );

      PACKED_TOKENS.forEach((word, i) => {
        const isA = i < 3;
        const x = slotX(i);
        nodes.push(
          tokenPill(word, x, topY, {
            w: 236,
            h: 88,
            color: isA ? COSMOS.blue : COSMOS.cyan,
            glow: 6,
            index: i,
            indexOffsetY: -72,
          }),
        );
      });

      // Cross-boundary label under pos 3 (B:prompt -> -100)
      const isCut = cj > 0.5;
      const x2 = slotX(2);
      const x3 = slotX(3);

      if (!isCut && ca > 0.2) {
        nodes.push(
          arrow([x2, topY + 50], [x3, botY - 52], {
            stroke: COSMOS.rose,
            width: 5.5,
            tip: 15,
          }).glow(12 * pulse, COSMOS.rose),
          txt('CROSS-INCIDENT SHIFT!', x3 + 280, 22, 28, COSMOS.rose, 'mono'),
        );
      } else if (isCut) {
        nodes.push(
          glowDot(wallX, 28, { radius: 14, color: COSMOS.emerald }),
          txt('BOUNDARY SEVERED', x3 + 145, 28, 28, COSMOS.emerald, 'mono'),
        );
      }

      nodes.push(
        tokenPill(isCut ? '−100' : 'B:prompt', x3, botY, {
          w: 236,
          h: 90,
          color: isCut ? COSMOS.emerald : COSMOS.rose,
          fill: isCut ? '#0c2624' : '#24101a',
          textColor: isCut ? COSMOS.emerald : COSMOS.rose,
          dash: isCut ? [8, 5] : undefined,
          glow: 11 * pulse,
          size: 32,
        }),
        txt('B START LABEL', x3, botY + 78, 26, COSMOS.muted, 'mono'),
        glassCell(0, 365, 1620, 96, isCut ? COSMOS.emerald : COSMOS.rose, {
          fill: '#101829',
          glow: 8,
        }),
        txt(
          isCut
            ? 'Masking B:prompt to −100 removes the cross-incident loss · Still test attention isolation!'
            : 'Global 1-place shift scores A:EOS against B:prompt from a totally different incident',
          0,
          365,
          27,
          isCut ? COSMOS.emerald : COSMOS.rose,
          'mono',
        ),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('packing-b1-1', () => s.play(slideProg.to(1, { duration: 0.9 })));

  c.onBeat(1, () => s.play(stageIdx.to(1, { duration: 0.01 })));
  c.show(1, [mask3d]);
  orbitScene(
    s,
    c,
    mask3d,
    { theta: -0.22, phi: 0.92 },
    {
      startOffset: Math.max(0.2, c.beats[1].start - c.start + 0.1),
      endMargin: Math.max(0.55, c.end - c.beats[2].start + 0.35),
    },
  );
  c.on('packing-b2-1', () => s.play(highlightB.to(1, { duration: 0.45 })));
  c.on('packing-b2-2', () => s.play(twoCells.to(1, { duration: 0.45 })));

  c.hide(2, [mask3d], { fade: 0.2 });
  c.onBeat(2, () => s.play(stageIdx.to(2, { duration: 0.01 })));
  c.on('packing-b3-1', () => s.play(crossArrow.to(1, { duration: 0.45 })));
  c.on('packing-b3-2', () =>
    s.play(cutJoin.to(1, { duration: remainDuration(c, 'packing-b3-2', 0.45) })),
  );
}
