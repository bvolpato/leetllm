// Scene 02: token-clocks - What an admitted caller waits for
// Full-bleed luminous millisecond timeline: 0..180ms queue + 120ms prefill = 300ms TTFT,
// then tokens at 340, 380, 500ms exposing a 120ms tail stall hidden behind 66.7ms mean TPOT.
import { group, rect } from 'vizmatic/stage';
import {
  COSMOS,
  DATA,
  ROLE,
  aura,
  beamWithPhotons,
  cinemaHeader,
  dashedRule,
  glowDot,
  glowTex,
  guardedDynamic,
  tweenOn,
  txt,
} from '../parts.mjs';

export default function tokenClocks(s, c) {
  const stageStep = s.value(0); // 1=first-delivery, 2=later-deliveries, 3=mean-gap

  const header = cinemaHeader('SERVER-SIDE LATENCY SLIs', 'What an admitted', 'caller waits for', {
    x: -860,
    y: -420,
    accent: ROLE.active,
    size: 52,
  });

  const bgAura = aura(160, 40, 640, '#5ce1e622', '#fb923c16');

  const tpotFormula = glowTex(String.raw`\text{TPOT} = \frac{500 - 300}{4 - 1} = 66.7\;\text{ms}`, {
    x: 420,
    y: -315,
    size: 40,
    color: ROLE.focus,
    glow: 7,
  });

  // Map ms in [0, 520] to x in [-780, 820]
  const msX = (ms) => -780 + (ms / 520) * 1600;
  const lineY = 70;

  const dyn = guardedDynamic(
    () => 1,
    () => {
      const st = stageStep.value;
      const nodes = [];

      // Millisecond axis & tick marks
      nodes.push(
        beamWithPhotons(
          [
            [msX(0), lineY],
            [msX(520), lineY],
          ],
          '#3a5382',
          0,
          { width: 3.0, glow: 5, photonCount: 2 },
        ),
      );
      for (const ms of [0, 100, 180, 300, 340, 380, 500]) {
        const x = msX(ms);
        nodes.push(
          dashedRule(x, lineY - 125, x, lineY + 125, '#263659', 0.55, 1.5),
          txt(`${ms}`, x, lineY + 158, 26, COSMOS.muted, 'mono'),
        );
      }
      nodes.push(txt('SERVER CLOCK (ms)', 0, lineY + 215, 26, COSMOS.dim, 'mono'));

      // Queue interval: 0..180ms
      if (st >= 0.4) {
        const qA = Math.min(1, st * 1.5);
        const qW = msX(180) - msX(0);
        const pW = msX(300) - msX(180);
        nodes.push(
          rect(qW - 8, 56, { fill: '#2c1f12', stroke: ROLE.warmup, width: 2.6, radius: 10 })
            .at(msX(90), lineY)
            .glow(7, ROLE.warmup)
            .opacity(qA),
          txt('Queue  180 ms', msX(90), lineY - 64, 28, ROLE.warmup, 'mono').opacity(qA),
          rect(pW - 8, 56, { fill: '#10243d', stroke: ROLE.cold, width: 2.6, radius: 10 })
            .at(msX(240), lineY)
            .glow(7, ROLE.cold)
            .opacity(qA),
          txt('Prefill  120 ms', msX(240), lineY - 64, 28, ROLE.cold, 'mono').opacity(qA),
          // TTFT bracket & token 1
          beamWithPhotons(
            [
              [msX(0), lineY - 135],
              [msX(300), lineY - 135],
            ],
            ROLE.active,
            0,
            { width: 4.0, glow: 10, photonCount: 2, alpha: qA },
          ),
          txt(`TTFT = ${DATA.tokenTrace.ttft} ms`, msX(150), lineY - 178, 30, ROLE.active, 'mono')
            .glow(8, ROLE.active)
            .opacity(qA),
          glowDot(msX(300), lineY, { radius: 11, color: ROLE.active, glow: 14, opacity: qA }),
          txt('T1', msX(300), lineY + 62, 26, ROLE.active, 'mono').opacity(qA),
        );
      }

      // Decode tokens: T2 @ 340, T3 @ 380, T4 @ 500 (gaps 40, 40, 120)
      if (st >= 1.4) {
        const dA = Math.min(1, (st - 1.4) * 2.5);
        const toks = [
          { ms: 340, label: 'T2', prev: 300, gap: 40, col: ROLE.warm },
          { ms: 380, label: 'T3', prev: 340, gap: 40, col: ROLE.warm },
          { ms: 500, label: 'T4', prev: 380, gap: 120, col: ROLE.expired },
        ];
        for (const tk of toks) {
          const x1 = msX(tk.prev);
          const x2 = msX(tk.ms);
          const xm = (x1 + x2) * 0.5;
          nodes.push(
            beamWithPhotons(
              [
                [x1, lineY],
                [x2, lineY],
              ],
              tk.col,
              0,
              { width: tk.gap === 120 ? 5.2 : 3.8, glow: 10, photonCount: 1, alpha: dA },
            ),
            glowDot(x2, lineY, { radius: 11, color: tk.col, glow: 14, opacity: dA }),
            txt(tk.label, x2, lineY + 62, 26, tk.col, 'mono').opacity(dA),
          );
          if (tk.gap === 120) {
            nodes.push(
              txt('STALL: 120 ms', xm, lineY - 68, 30, ROLE.expired, 'mono')
                .glow(9, ROLE.expired)
                .opacity(dA),
            );
          } else {
            nodes.push(txt(`${tk.gap}ms`, xm, lineY - 56, 26, ROLE.warm, 'mono').opacity(dA));
          }
        }
      }

      // Mean TPOT vs Tail Stall callout
      if (st >= 2.4) {
        const mA = Math.min(1, (st - 2.4) * 2.5);
        nodes.push(
          txt(
            'Mean TPOT (66.7 ms) hides the 120 ms tail stall',
            -860,
            378,
            30,
            ROLE.focus,
            'sans',
            'left',
          )
            .glow(7, ROLE.focus)
            .opacity(mA),
          txt(
            'Single-token reply -> no decode gap',
            860,
            378,
            26,
            COSMOS.muted,
            'mono',
            'right',
          ).opacity(mA),
        );
      } else {
        nodes.push(
          txt(
            'Server timestamps record each token emission',
            -860,
            378,
            28,
            COSMOS.muted,
            'sans',
            'left',
          ),
        );
      }

      return group(...nodes);
    },
  );

  s.add(bgAura, header, dyn);

  tweenOn(s, c, 'first-delivery', stageStep, 1, 0.35);
  tweenOn(s, c, 'later-deliveries', stageStep, 2, 0.35);
  c.show('mean-gap', tpotFormula);
  tweenOn(s, c, 'mean-gap', stageStep, 3, 0.35);
}
