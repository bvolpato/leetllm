// Scene 20: budget-quality-gate - When support traffic grows
// Live 30-day stacked forecast gauge racing against the $750 monthly ceiling ($717.18 base, $32.82 cushion).
// Beat 0 predicts which daily term changes (+10% support) -> Beat 1 `grow-support` scales support only ($780.44).
// Beat 2 `review-sample` brings in separate quality verdict (1,994/2,000 = 99.7%, 0/1,200 unsafe -> PASS, budget HOLD).
// Beat 3 `cold-month` resets support and loses nightly reads all 30 nights (+$86.40 -> $803.58).
import { group, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  budgetMicro,
  cinemaHeader,
  clampDur,
  coldNightExtraMicro,
  dashedRule,
  driftValue,
  evaluationMicro,
  guardedDynamic,
  monthlyMicro,
  optimizedDailyMicro,
  qualityRate,
  txt,
  usd,
} from '../parts.mjs';

export default function budgetQualityGate(s, c) {
  const pulseT = s.value(0);
  const stageBeat = s.value(0); // 0 = question, 1 = +10% support, 2 = quality report, 3 = 30 cold nights
  const supportBoost = s.value(0); // 0 -> 1 on `grow-support`, resets 1 -> 0 on `cold-month`
  const qualityVis = s.value(0); // 0 -> 1 on `review-sample`, fades out on `cold-month`
  const coldMonth = s.value(0); // 0 -> 1 on `cold-month`

  const header = cinemaHeader(
    'MONTHLY BUDGET & QUALITY GATE',
    'Forecast spend,',
    'check quality separately',
    {
      x: -860,
      y: -415,
      accent: ROLE.input,
      size: 52,
    },
  );

  const sceneAura = aura(120, 40, 720, '#5ce1e622', '#ff6b8b1c');

  const stageCanvas = guardedDynamic(
    () => 1,
    () => {
      const sb = supportBoost.value;
      const qv = qualityVis.value;
      const cm = coldMonth.value;
      const ph = stageBeat.value;

      const supportDaily = optimizedDailyMicro + Math.round(optimizedDailyMicro * 0.1 * sb);
      const evalDaily = evaluationMicro + Math.round(coldNightExtraMicro * cm);
      const monthly = 30 * (supportDaily + evalDaily);
      const over = ph >= 0.5 || monthly > budgetMicro;

      const barX = -860;
      const barW = 1700;
      const maxScale = 860_000_000; // $860
      const supW = ((30 * supportDaily) / maxScale) * barW;
      const evalW = ((30 * evalDaily) / maxScale) * barW;
      const budgetX = barX + (budgetMicro / maxScale) * barW;

      const nodes = [
        // Two daily terms above the 30-day bar
        txt(
          `SUPPORT:  ${usd(supportDaily, 3)} / day`,
          -860,
          -185,
          34,
          ROLE.input,
          'mono',
          'left',
        ).glow(sb > 0.2 ? 8 : 0, ROLE.input),
        txt(
          `NIGHTLY EVAL:  ${usd(evalDaily, 2)} / day`,
          840,
          -185,
          34,
          ROLE.cached,
          'mono',
          'right',
        ).glow(cm > 0.2 ? 8 : 0, ROLE.cached),

        // 30-day stacked forecast bar (y = -45)
        rect(barW, 92, { fill: '#0e1528', stroke: '#2c3d66', width: 2.0, radius: 12 }).at(
          barX + barW * 0.5,
          -45,
        ),
        rect(supW - 3, 84, { fill: '#103045', stroke: ROLE.input, width: 2.6, radius: 10 })
          .at(barX + supW * 0.5, -45)
          .glow(8, ROLE.input),
        txt('30d Support', barX + supW * 0.5, -45, 28, ROLE.input, 'mono'),

        rect(evalW - 3, 84, { fill: '#3c2e10', stroke: ROLE.cached, width: 2.6, radius: 10 })
          .at(barX + supW + evalW * 0.5, -45)
          .glow(9, ROLE.cached),

        // Glowing $750 vertical ceiling line
        dashedRule(budgetX, -118, budgetX, 42, ROLE.breach, { width: 3.2, opacity: 0.95 }),
        txt('$750 BUDGET', budgetX, -138, 26, ROLE.breach, 'mono').glow(6, ROLE.breach),

        // Live 30-day total readout
        txt(
          `${usd(monthly)} / 30 days`,
          -860,
          102,
          56,
          over ? ROLE.breach : COSMOS.ink,
          'mono',
          'left',
        ).glow(over ? 10 : 0, ROLE.breach),

        txt(
          ph >= 2.5
            ? '+$53.58 OVER BUDGET'
            : ph >= 0.5
              ? '+$30.44 OVER BUDGET'
              : `${usd(budgetMicro - monthlyMicro)} left  (base ${usd(monthlyMicro)})`,
          840,
          102,
          36,
          ph >= 0.5 ? ROLE.breach : ROLE.ok,
          'mono',
          'right',
        ).glow(7, ph >= 0.5 ? ROLE.breach : ROLE.ok),
      ];

      // Lower section driven cleanly by `stageBeat` so beat-0 question never flashes on beat 3
      if (ph >= 2.5) {
        nodes.push(
          txt(
            `30 cold nights x $2.88 = +$86.40  ->  $803.58  (base support restored)`,
            -860,
            270,
            32,
            ROLE.cached,
            'mono',
            'left',
          )
            .glow(7, ROLE.cached)
            .opacity(Math.max(0.3, cm)),
          txt(
            'Losing nightly prefix reads breaches the monthly budget on its own',
            -860,
            345,
            28,
            COSMOS.muted,
            'sans',
            'left',
          ).opacity(Math.max(0.3, cm)),
        );
      } else if (ph >= 1.5) {
        nodes.push(
          txt('SEPARATE QUALITY REPORT', -860, 215, 26, ROLE.ok, 'mono', 'left').opacity(qv),
          txt(
            `Cited answers: 1,994 / 2,000 (${(100 * qualityRate).toFixed(1)}%)  ·  PASS`,
            -860,
            278,
            30,
            ROLE.ok,
            'mono',
            'left',
          ).opacity(qv),
          txt(
            'Unsafe stored replies: 0 / 1,200 reviewed  ·  PASS',
            -860,
            340,
            30,
            ROLE.ok,
            'mono',
            'left',
          ).opacity(qv),
          rect(420, 76, { fill: '#351324', stroke: ROLE.breach, width: 2.6, radius: 12 })
            .at(630, 305)
            .glow(10, ROLE.breach)
            .opacity(qv),
          txt('BUDGET GATE: HOLD', 630, 305, 30, ROLE.breach, 'mono').opacity(qv),
        );
      } else if (ph >= 0.5) {
        nodes.push(
          txt(
            '+10% support grows only the support term  ·  nightly eval stays $2.82/day',
            -860,
            275,
            30,
            ROLE.input,
            'sans',
            'left',
          ).opacity(Math.max(0.3, sb)),
          txt(
            'Over budget even with warm prefix reads',
            -860,
            345,
            28,
            ROLE.breach,
            'sans',
            'left',
          ).opacity(Math.max(0.3, sb)),
        );
      } else {
        nodes.push(
          txt(
            'Support volume rises 10% while nightly checks stay at 2,000  ·  Which daily term changes?',
            -860,
            290,
            32,
            ROLE.cached,
            'serif',
            'left',
          ).glow(6, ROLE.cached),
        );
      }

      return group(...nodes);
    },
  );

  s.add(sceneAura, header, stageCanvas);
  driftValue(s, c, pulseT, 4.0, { startOffset: 0.1, endMargin: 0.5 });

  c.on('grow-support', () => {
    const t = c.cue('grow-support').start;
    s.play(
      stageBeat.to(1, { duration: 0.1 }),
      supportBoost.to(1, { duration: clampDur(c, t, 0.7) }),
    );
  });
  c.on('review-sample', () => {
    const t = c.cue('review-sample').start;
    s.play(
      stageBeat.to(2, { duration: 0.1 }),
      qualityVis.to(1, { duration: clampDur(c, t, 0.45) }),
    );
  });
  c.on('cold-month', () => {
    const t = c.cue('cold-month').start;
    const d = clampDur(c, t, 0.7);
    s.play(
      stageBeat.to(3, { duration: 0.1 }),
      supportBoost.to(0, { duration: clampDur(c, t, 0.3) }),
      qualityVis.to(0, { duration: clampDur(c, t, 0.25) }),
      coldMonth.to(1, { duration: d }),
    );
  });
}
