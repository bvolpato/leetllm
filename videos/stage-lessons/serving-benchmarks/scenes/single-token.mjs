// Scene 9: single-token - One token has no pacing interval
// Precision r02 oscilloscope (send 125, single token 295, terminal 310) with MathJax TPOT
// formula revealing 0 / 0 -> null (not zero!) and endpoint eligibility contract.
import { group, line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  SERVING_COHORT,
  aura,
  cinemaHeader,
  clampDur,
  driftValue,
  glowDot,
  glowTex,
  glowingTrail,
  guardedDynamic,
  spanBracket,
  timeAxisNodes,
  txt,
} from '../parts.mjs';

export default function singleToken(s, c) {
  const phase = s.value(0);
  const formulaLit = s.value(0.4);
  const r02Lit = s.value(0);
  const nullLit = s.value(0);
  const contractLit = s.value(0);

  const r02 = SERVING_COHORT[1]; // send 125, token 295, terminal 310

  const header = cinemaHeader('SINGLE-TOKEN EDGE CASE', 'One token has no', 'pacing interval', {
    x: -860,
    y: -435,
    accent: ROLE.focus,
    size: 50,
  });

  const stageAura = aura(110, 10, 680, '#ffd1661c', '#6ee7b718');

  const tpotEq = glowTex(String.raw`\mathrm{TPOT} = \frac{t_n - t_1}{n - 1} \quad (n > 1)`, {
    x: 340,
    y: -340,
    size: 38,
    color: ROLE.send,
    glow: 7,
  });

  const oscView = guardedDynamic(
    () => 1,
    () => {
      const rLit = r02Lit.value;
      const nLit = nullLit.value;
      const cLit = contractLit.value;

      const xLeft = -680;
      const xRight = 720;
      const minMs = 100;
      const maxMs = 350;
      const xOf = (ms) => xLeft + ((ms - minMs) / (maxMs - minMs)) * (xRight - xLeft);
      const railY = 25;

      const xSend = xOf(r02.sent); // 125
      const xTok = xOf(r02.tokens[0]); // 295
      const xTerm = xOf(r02.terminal); // 310

      const nodes = [
        line([xLeft, railY], [xRight, railY], { stroke: '#253559', width: 3.0 }),
        ...timeAxisNodes(xLeft, xRight, railY + 148, minMs, maxMs, [100, 150, 200, 250, 300, 350], {
          format: (v) => `${v}ms`,
        }),
      ];

      // Active TTFT beam 125 -> 295 and terminal tail 295 -> 310
      nodes.push(
        glowingTrail(
          [
            [xSend, railY],
            [xTok, railY],
          ],
          { color: ROLE.qualified, width: 6.5, glow: 9, opacity: 0.45 + 0.55 * rLit },
        ),
        glowingTrail(
          [
            [xTok, railY],
            [xTerm, railY],
          ],
          { color: ROLE.terminal, width: 6.5, glow: 9, opacity: 0.45 + 0.55 * rLit },
        ),
      );

      // Widely spaced leader callouts so 295 and 310 NEVER collide, with 22+ px gap under labels!
      const callouts = [
        { label: 'SEND', ms: r02.sent, lx: -560, col: ROLE.send },
        { label: 'ONLY TOKEN (T1)', ms: r02.tokens[0], lx: 60, col: ROLE.qualified },
        { label: 'TERMINAL', ms: r02.terminal, lx: 620, col: ROLE.terminal },
      ];
      callouts.forEach(({ label, ms, lx, col }) => {
        const px = xOf(ms);
        nodes.push(
          glowingTrail(
            [
              [lx, railY - 100],
              [px, railY],
            ],
            { color: col, width: 3.0, glow: 6, opacity: 0.85 },
          ),
          glowDot(px, railY, { radius: 9.5, color: col, glow: 11 }),
          txt(label, lx, railY - 196, 26, col, 'mono'),
          txt(`${ms} ms`, lx, railY - 144, 34, COSMOS.ink, 'mono').glow(5, col),
        );
      });

      // Floating readout strip at bottom
      if (rLit > 0.1) {
        nodes.push(
          ...spanBracket(xSend, xTok, railY + 54, 'TTFT = 170 ms', ROLE.qualified, {
            labelSize: 26,
            opacity: rLit,
          }),
          txt('TTFT = 295 - 125', -540, 286, 26, COSMOS.muted, 'mono').opacity(rLit),
          txt('170 ms', -540, 344, 48, ROLE.qualified, 'mono')
            .glow(8, ROLE.qualified)
            .opacity(rLit),
        );
      }

      if (nLit > 0.1) {
        nodes.push(
          txt('n = 1  ->  0 INTERVALS', 220, 286, 26, ROLE.focus, 'mono').opacity(nLit),
          txt('TPOT = null  (n/a)', 220, 344, 46, ROLE.focus, 'mono')
            .glow(9, ROLE.focus)
            .opacity(nLit),
        );
      } else if (rLit < 0.1) {
        nodes.push(
          txt(
            'E2E = terminal - send   ·   ITL retains every consecutive gap',
            0,
            312,
            28,
            COSMOS.muted,
            'mono',
          ).opacity(0.6 + 0.4 * formulaLit.value),
        );
      }

      if (cLit > 0.2) {
        nodes.push(
          txt(
            'Empty successful stream = invalid under text contract  ·  Equal timestamps allowed',
            0,
            428,
            26,
            ROLE.open,
            'sans',
          )
            .glow(4, ROLE.open)
            .opacity(cLit),
        );
      } else {
        nodes.push(
          txt(
            'r02 still counts for success, TTFT (<= 300 ms), and task quality',
            0,
            428,
            26,
            COSMOS.muted,
            'sans',
          ),
        );
      }

      return group(...nodes);
    },
  );

  s.add(stageAura, header, tpotEq, oscView);
  driftValue(s, c, phase, 6, { startOffset: 0.1, endMargin: 0.5 });

  c.on('single-token-beat-0', () => {
    const t = c.cue('single-token-beat-0').start;
    s.play(formulaLit.to(1, { duration: clampDur(c, t, 0.4) }));
  });
  c.on('single-token-beat-1', () => {
    const t = c.cue('single-token-beat-1').start;
    s.play(r02Lit.to(1, { duration: clampDur(c, t, 0.45) }));
  });
  c.on('single-null', () => {
    const t = c.cue('single-null').start;
    s.play(nullLit.to(1, { duration: clampDur(c, t, 0.4) }));
  });
  c.on('single-token-beat-2', () => {
    const t = c.cue('single-token-beat-2').start;
    s.play(contractLit.to(1, { duration: clampDur(c, t, 0.4) }));
  });
}
