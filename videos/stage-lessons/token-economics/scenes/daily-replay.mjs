// Scene 12: daily-replay - Where does a day's spend go?
// 4 support cohorts on a unified dollar waterfall.
// Beat 0 prediction withheld -> Beat 1 `price-cohorts` reveals Live orders $11.025/day (46.1%).
// Beat 2 `change-exception` shortens exception output 220->130 saving $0.675/day ($23.906/day total).
// Beat 3 `avoided-cost` & `avoided-total` reveal $13.824 avoided spend outside the bill.
import { group } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  cinemaHeader,
  clampDur,
  conciseMicro,
  dailySlices,
  dailyTotalMicro,
  driftValue,
  evaluationMicro,
  fmtInt,
  glowBar,
  guardedDynamic,
  optimizedDailyMicro,
  prefixMicro,
  semanticHits,
  txt,
  usd,
  verboseMicro,
} from '../parts.mjs';

export default function dailyReplay(s, c) {
  const pulseT = s.value(0);
  const priceProg = s.value(0); // `price-cohorts`
  const shortExc = s.value(0); // `change-exception`
  const avoidedProg = s.value(0); // `avoided-cost`
  const avoidedTot = s.value(0); // `avoided-total`

  const maxSpend = dailySlices[1].requests * dailySlices[1].cost; // 11,025,000 ($11.025)
  const avoidedDaily = semanticHits * prefixMicro; // 13,824,000 ($13.824)

  const header = cinemaHeader('8,500 DAILY SUPPORT CALLS', 'Where does a day', 'of spend go?', {
    x: -860,
    y: -415,
    accent: ROLE.input,
    size: 52,
  });

  const sceneAura = aura(240, 40, 680, '#5ce1e622', '#6ee7b718');

  const stageCanvas = guardedDynamic(
    () => 1,
    () => {
      const pp = priceProg.value;
      const sh = shortExc.value > 0.5;
      const av = avoidedProg.value;
      const avT = avoidedTot.value;

      const rows = [
        {
          name: 'Stored policy reply',
          detail: 'Stored text returned',
          calls: semanticHits,
          unit: 0,
          color: ROLE.stored,
        },
        {
          name: 'Generated policy reply',
          detail: '1,800 in · 1,280 read · 180 out',
          calls: dailySlices[0].requests,
          unit: prefixMicro,
          color: ROLE.batch,
        },
        {
          name: 'Live order',
          detail: '900 in · 0 read · 95 out',
          calls: dailySlices[1].requests,
          unit: dailySlices[1].cost,
          color: ROLE.input,
        },
        {
          name: 'Access exception',
          detail: `2,200 in · 1,280 read · ${sh ? 130 : 220} out`,
          calls: dailySlices[2].requests,
          unit: sh ? conciseMicro : verboseMicro,
          color: ROLE.output,
        },
      ];

      const nodes = [
        txt('COHORT', -860, -210, 26, COSMOS.muted, 'mono', 'left'),
        txt('CALLS / DAY', -155, -210, 26, COSMOS.muted, 'mono', 'right'),
        txt('PER CALL', 105, -210, 26, COSMOS.muted, 'mono', 'right'),
        txt('DAILY GENERATION SPEND', 220, -210, 26, COSMOS.ink, 'mono', 'left'),
      ];

      rows.forEach((r, idx) => {
        const y = -125 + idx * 124;
        const spend = r.calls * r.unit;
        const rowP = Math.max(0, Math.min(1, pp * 4 - idx * 0.65));

        nodes.push(
          txt(r.name, -860, y, 30, r.color, 'sans', 'left'),
          txt(r.detail, -860, y + 40, 26, COSMOS.muted, 'mono', 'left'),
          txt(fmtInt(r.calls), -155, y + 10, 32, COSMOS.ink, 'mono', 'right'),
          txt(usd(r.unit, r.unit ? 6 : 2), 115, y + 10, 28, COSMOS.ink, 'mono', 'right'),
        );

        if (rowP > 0.02) {
          const frac = spend > 0 ? (spend / maxSpend) * rowP : 0;
          nodes.push(
            glowBar(220, y + 28, 430, 24, frac, { fill: r.color, glow: idx === 2 ? 11 : 7 }),
            txt(usd(spend, 3), 855, y + 12, 32, r.color, 'mono', 'right').glow(
              idx === 2 ? 7 : 0,
              r.color,
            ),
          );
        } else {
          nodes.push(
            glowBar(220, y + 28, 430, 24, 0, { fill: r.color, border: '#2a3756', glow: 0 }),
            txt('?', 855, y + 12, 32, COSMOS.muted, 'mono', 'right'),
          );
        }
      });

      // Lower analytical summary
      if (av > 0.05) {
        nodes.push(
          txt(
            `Daily bill: ${usd(optimizedDailyMicro, 3)} support + ${usd(evaluationMicro, 3)} eval = ${usd(dailyTotalMicro, 3)} / day`,
            -860,
            352,
            28,
            COSMOS.ink,
            'mono',
            'left',
          ),
          txt(
            avT > 0.4
              ? `Avoided generation (outside bill): 3,200 x ${usd(prefixMicro, 5)} = ${usd(avoidedDaily, 3)} / day`
              : `Avoided generation: 3,200 x ${usd(prefixMicro, 5)} = ?`,
            -860,
            418,
            30,
            ROLE.stored,
            'mono',
            'left',
          )
            .glow(7, ROLE.stored)
            .opacity(av),
        );
      } else if (sh) {
        nodes.push(
          txt(
            `Exception cut saves $0.675/day  ·  Full day: ${usd(optimizedDailyMicro, 3)} + ${usd(evaluationMicro, 3)} = ${usd(dailyTotalMicro, 3)}`,
            -860,
            365,
            28,
            ROLE.cached,
            'mono',
            'left',
          ).glow(6, ROLE.cached),
          txt(
            'Live orders alone = 46.1% of daily generation spend',
            -860,
            422,
            26,
            ROLE.input,
            'sans',
            'left',
          ),
        );
      } else if (pp > 0.85) {
        nodes.push(
          txt(
            'Live orders lead: 3,000 x $0.003675 = $11.025 / day',
            -860,
            378,
            34,
            ROLE.input,
            'mono',
            'left',
          ).glow(8, ROLE.input),
        );
      } else {
        nodes.push(
          txt(
            'Which group spends the most on generation?',
            -860,
            378,
            36,
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

  c.on('price-cohorts', () => {
    const t = c.cue('price-cohorts').start;
    s.play(priceProg.to(1, { duration: clampDur(c, t, 0.75) }));
  });
  c.on('change-exception', () => {
    const t = c.cue('change-exception').start;
    s.play(shortExc.to(1, { duration: clampDur(c, t, 0.45) }));
  });
  c.on('avoided-cost', () => {
    const t = c.cue('avoided-cost').start;
    s.play(avoidedProg.to(1, { duration: clampDur(c, t, 0.4) }));
  });
  c.on('avoided-total', () => {
    const t = c.cue('avoided-total').start;
    s.play(avoidedTot.to(1, { duration: clampDur(c, t, 0.4) }));
  });
}
