// Scene 9: context-triangle - How often do you send the same observation?
// Signature Glowing Quadratic Token Staircase (10 calls, P=2,000 blue base + 0..9 delta=1,500
// stacked blocks = 15,500 on Call 10, 87,500 total across 10 calls), highlighting Observation 1's
// 9 repeated copies across calls 2..10 and glowing MathJax KP + K(K-1)/2 * Delta!
import { group, rect } from 'vizmatic/stage';
import {
  COSMOS,
  FULL_LEDGER,
  ROLE,
  aura,
  cinemaHeader,
  clampDur,
  driftValue,
  glowTex,
  guardedDynamic,
  txt,
} from '../parts.mjs';

export default function contextTriangle(s, c) {
  const pulse = s.value(0);
  const finalOn = s.value(0);
  const totalOn = s.value(0);
  const nineOn = s.value(0);
  const formulaOn = s.value(0);

  const header = cinemaHeader(
    'QUADRATIC CONTEXT ACCUMULATION',
    'How often do you resend',
    'the same observation?',
    { accent: ROLE.action, size: 48 },
  );

  const stageAura = aura(220, 40, 640, '#5ce1e61e', '#ffd16618');

  const triEq = glowTex(
    String.raw`I_{\text{total}} = KP + \frac{K(K-1)}{2}\Delta = 20{,}000 + 45 \times 1{,}500 = 87{,}500`,
    { x: 0, y: 370, size: 32, color: ROLE.focus, glow: 7 },
  );

  const view = guardedDynamic(
    () => 1,
    () => {
      const fn = finalOn.value;
      const tt = totalOn.value;
      const n9 = nineOn.value;
      const fm = formulaOn.value;
      const nodes = [];

      // 10 columns across x in [-560..+680], base at y = 260
      const colW = 88;
      const gap = 36;
      const xStart = -560;
      const baseY = 260;
      const baseH = 54;
      const blkH = 34;
      const blkGap = 4;

      for (let k = 0; k < 10; k++) {
        const cx = xStart + k * (colW + gap);
        // Blue P=2,000 base block
        nodes.push(
          rect(colW, baseH, { fill: ROLE.host, stroke: '#93c5fd', width: 1.8, radius: 6 })
            .at(cx, baseY - baseH * 0.5)
            .opacity(0.88),
          txt(`C${k + 1}`, cx, baseY + 34, 26, COSMOS.muted, 'mono', 'center'),
        );
        // k stacked delta=1,500 observation blocks
        for (let b = 0; b < k; b++) {
          const isObs1 = b === 0;
          const isCol10 = k === 9;
          const col =
            isObs1 && n9 > 0.35 ? ROLE.focus : isCol10 && fn > 0.35 ? ROLE.ok : ROLE.action;
          const cy = baseY - baseH - 6 - b * (blkH + blkGap) - blkH * 0.5;
          const blk = rect(colW, blkH, { fill: col, stroke: '#ffffff', width: 1.0, radius: 5 })
            .at(cx, cy)
            .opacity(isObs1 && n9 > 0.35 ? 0.96 : 0.72);
          if ((isObs1 && n9 > 0.35) || (isCol10 && fn > 0.35)) blk.glow(8, col);
          nodes.push(blk);
        }
      }

      // Top-left & top-right readouts
      nodes.push(
        txt('BASE P = 2,000 · EACH STEP Δ = 1,500', -840, -185, 26, ROLE.host, 'mono', 'left'),
      );
      if (fn > 0.05) {
        nodes.push(
          txt(
            `CALL 10: ${FULL_LEDGER.written.toLocaleString()} TOKENS`,
            -840,
            -120,
            30,
            ROLE.ok,
            'mono',
            'left',
          )
            .glow(6, ROLE.ok)
            .opacity(fn),
        );
      }
      if (tt > 0.05) {
        nodes.push(
          txt(
            `10-CALL TOTAL: ${FULL_LEDGER.total.toLocaleString()} TOKENS`,
            -840,
            -60,
            32,
            ROLE.focus,
            'mono',
            'left',
          )
            .glow(8, ROLE.focus)
            .opacity(tt),
        );
      }
      if (n9 > 0.05) {
        nodes.push(
          txt('OBS #1 RESENT 9 TIMES (CALLS 2..10)', -840, 2, 26, ROLE.focus, 'mono', 'left')
            .glow(6, ROLE.focus)
            .opacity(n9),
        );
      }
      if (fm > 0.05) {
        nodes.push(
          txt(
            'Block added after call j enters (K - j) more calls',
            -840,
            62,
            26,
            COSMOS.muted,
            'sans',
            'left',
          ).opacity(fm),
        );
      }

      return group(...nodes);
    },
  );

  s.add(stageAura, header, view);
  driftValue(s, c, pulse, 4.8, { startOffset: 0.1, endMargin: 0.5 });

  c.on('aa-context-triangle-0', () => {
    s.play(pulse.to(0.3, { duration: clampDur(c, c.cue('aa-context-triangle-0').start, 0.25) }));
  });
  c.on('context-final', () => {
    s.play(finalOn.to(1, { duration: clampDur(c, c.cue('context-final').start, 0.35) }));
  });
  c.on('aa-context-triangle-1', () => {
    s.play(totalOn.to(0.4, { duration: clampDur(c, c.cue('aa-context-triangle-1').start, 0.25) }));
  });
  c.on('context-total', () => {
    s.play(totalOn.to(1, { duration: clampDur(c, c.cue('context-total').start, 0.35) }));
  });
  c.on('context-nine', () => {
    s.play(nineOn.to(1, { duration: clampDur(c, c.cue('context-nine').start, 0.35) }));
  });
  c.show('aa-context-triangle-2', triEq);
  c.on('aa-context-triangle-2', () => {
    s.play(formulaOn.to(1, { duration: clampDur(c, c.cue('aa-context-triangle-2').start, 0.35) }));
  });
}
