// Scene 23: uct-construction - Which branch gets the next simulation?
// Live stacked-bar UCT construction computed directly from uctRows():
//   Blue measured means (rollback 0.30, diff 0.90, retry 0.10) -> gold exploration bonuses
//   c * sqrt(ln(10) / N) extend each bar on one common scale (prediction pause!) ->
//   Retry surges to 2.246 and wins the next simulation! Plus unvisited N=0 -> Infinity.
import { group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  UCT_DATA,
  aura,
  cinemaHeader,
  clampDur,
  driftValue,
  glowTex,
  guardedDynamic,
  txt,
} from '../parts.mjs';

export default function uctConstruction(s, c) {
  const pulse = s.value(0);
  const bestMeanHi = s.value(0);
  const bonusGrow = s.value(0);
  const scoreNumsOn = s.value(0);
  const winnerReveal = s.value(0);
  const unvisitedOn = s.value(0);

  const header = cinemaHeader(
    'UCT SELECTION FORMULA',
    'Which branch gets',
    'the next simulation?',
    { accent: ROLE.focus, size: 50 },
  );

  const stageAura = aura(220, 40, 620, '#ffd1661c', '#60a5fa1a');

  const uctEq = glowTex(
    String.raw`\text{UCT} = \frac{W}{N} + \sqrt{2}\,\sqrt{\frac{\ln N_{\text{parent}}}{N}}`,
    { x: 350, y: -330, size: 36, color: ROLE.focus, glow: 8 },
  );

  const view = guardedDynamic(
    () => 1,
    () => {
      const bm = bestMeanHi.value;
      const bg = bonusGrow.value;
      const sn = scoreNumsOn.value;
      const wn = winnerReveal.value;
      const uv = unvisitedOn.value;
      const nodes = [];

      // Shared score axis: 0.0 to 2.5 mapped to x in [-430..+640]
      const x0 = -430;
      const x1 = 640;
      const scale = (x1 - x0) / 2.5;
      const rowYs = [-115, 25, 165];

      nodes.push(
        txt(
          'PARENT VISITS N = 10   ·   BLUE = MEAN (W/N)   ·   GOLD = EXPLORATION BONUS',
          -840,
          -210,
          26,
          COSMOS.muted,
          'mono',
          'left',
        ),
        line([x0, -170], [x0, 245], { stroke: '#344770', width: 2.4 }),
      );
      for (const tick of [0, 0.5, 1.0, 1.5, 2.0, 2.5]) {
        const tx = x0 + tick * scale;
        nodes.push(
          line([tx, -170], [tx, 235], { stroke: '#1c2644', width: 1.4, dash: [4, 6] }),
          txt(tick.toFixed(1), tx, 268, 26, COSMOS.dim, 'mono', 'center'),
        );
      }

      UCT_DATA.forEach((row, i) => {
        const y = rowYs[i];
        const isDiff = row.id === 'diff';
        const isRetry = row.id === 'retry';
        const meanW = row.mean * scale;
        const bonW = row.bonus * scale * bg;

        const labelCol =
          isRetry && wn > 0.35
            ? ROLE.focus
            : isDiff && bm > 0.35 && bg < 0.3
              ? ROLE.ok
              : COSMOS.ink;
        nodes.push(
          txt(`${row.id.toUpperCase()}`, -840, y - 14, 28, labelCol, 'mono', 'left').glow(
            isRetry && wn > 0.35 ? 8 : 0,
            ROLE.focus,
          ),
          txt(`N=${row.N} · W=${row.W.toFixed(1)}`, -840, y + 24, 26, COSMOS.muted, 'mono', 'left'),
        );

        // Blue mean bar
        const mBar = rect(Math.max(8, meanW), 54, {
          fill: ROLE.host,
          stroke: '#93c5fd',
          width: 1.5,
          radius: 7,
        })
          .at(x0 + meanW * 0.5, y)
          .opacity(0.9);
        if (isDiff && bm > 0.35 && bg < 0.3) mBar.glow(9, ROLE.ok);
        nodes.push(mBar);

        // Gold exploration bonus stacked directly onto mean!
        if (bonW > 4) {
          const bBar = rect(bonW, 54, {
            fill: isRetry && wn > 0.35 ? ROLE.focus : ROLE.caution,
            stroke: '#ffffff',
            width: 1.5,
            radius: 7,
          })
            .at(x0 + meanW + bonW * 0.5, y)
            .opacity(0.9);
          if (isRetry && wn > 0.35) bBar.glow(12, ROLE.focus);
          nodes.push(bBar);
        }

        // Score readout on right of bar (withhold winner highlight until `uct-winner`!)
        const endX = x0 + meanW + bonW + 18;
        const textVal = sn > 0.35 ? row.score.toFixed(3) : row.mean.toFixed(2);
        nodes.push(
          txt(
            textVal,
            endX,
            y,
            28,
            isRetry && wn > 0.35 ? ROLE.focus : sn > 0.35 ? COSMOS.ink : ROLE.host,
            'mono',
            'left',
          ),
        );
      });

      // Unvisited N=0 priority note OR prediction prompt OR winner banner
      if (uv > 0.05) {
        nodes.push(
          txt(
            'UNVISITED BRANCH (N = 0)  ->  SCORE = ∞  (EXPANDED FIRST)',
            0,
            355,
            28,
            ROLE.action,
            'mono',
            'center',
          )
            .glow(8, ROLE.action)
            .opacity(uv),
        );
      } else if (wn > 0.05) {
        nodes.push(
          txt(
            'SIMULATE RETRY (2.246): EXPLORATION BONUS ALONE > 2.0!',
            0,
            355,
            30,
            ROLE.focus,
            'mono',
            'center',
          )
            .glow(9, ROLE.focus)
            .opacity(wn),
        );
      } else if (bg > 0.35) {
        nodes.push(
          txt(
            'Which branch earns the next simulation?',
            0,
            355,
            34,
            ROLE.focus,
            'serif',
            'center',
          ).glow(6, ROLE.focus),
        );
      } else if (bm > 0.35) {
        nodes.push(
          txt(
            'DIFF LEADS ON MEAN (0.90) · RETRY TRIED ONLY ONCE (N = 1)',
            0,
            355,
            28,
            ROLE.ok,
            'mono',
            'center',
          ).opacity(bm),
        );
      } else {
        nodes.push(
          txt(
            'Which branch leads on measured average return (W / N)?',
            0,
            355,
            32,
            ROLE.host,
            'serif',
            'center',
          ),
        );
      }

      return group(...nodes);
    },
  );

  s.add(stageAura, header, view);
  driftValue(s, c, pulse, 5.2, { startOffset: 0.1, endMargin: 0.5 });

  c.on('uct-means', () => {
    s.play(pulse.to(0.3, { duration: clampDur(c, c.cue('uct-means').start, 0.25) }));
  });
  c.on('uct-first-question', () => {
    s.play(pulse.to(0.5, { duration: 0.15 }));
  });
  c.after('uct-best-mean', () => {
    s.play(bestMeanHi.to(1, { duration: clampDur(c, c.cue('uct-best-mean').end, 0.35) }));
  });
  c.show('uct-rule', uctEq);
  c.on('uct-rule', () => {
    s.play(pulse.to(1.2, { duration: 0.2 }));
  });
  c.on('uct-weight', () => {
    s.play(pulse.to(1.6, { duration: 0.2 }));
  });
  c.on('uct-bonus', () => {
    s.play(bonusGrow.to(1, { duration: clampDur(c, c.cue('uct-bonus').start, 0.65) }));
  });
  c.on('uct-scores', () => {
    s.play(scoreNumsOn.to(1, { duration: clampDur(c, c.cue('uct-scores').start, 0.35) }));
  });
  c.on('uct-choice', () => {
    s.play(scoreNumsOn.to(1, { duration: 0.12 }));
  });
  // Strict prediction withholding!
  c.after('uct-winner', () => {
    s.play(winnerReveal.to(1, { duration: clampDur(c, c.cue('uct-winner').end, 0.35) }));
  });
  c.on('uct-unvisited', () => {
    s.play(unvisitedOn.to(1, { duration: clampDur(c, c.cue('uct-unvisited').start, 0.35) }));
  });
}
