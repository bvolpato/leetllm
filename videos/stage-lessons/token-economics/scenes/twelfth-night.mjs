// Scene 25: twelfth-night - Back to the evaluation calendar (Finale)
// Luminous 30-night evaluation calendar paired with a live $750 monthly forecast gauge.
// Beat 0 `eleven-nights`: lights 11 cold nights -> $748.86 ($1.14 left).
// Beat 1: outlines Night 12 and withholds the verdict (`$1.14 left. Can it cover $2.88?`).
// Beat 2 `post-twelfth`: ignites Night 12 in rose -> $751.74 ($1.74 over budget · HOLD).
import { group, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  budgetMicro,
  buildNightCalendar,
  cinemaHeader,
  clampDur,
  coldNightExtraMicro,
  dashedRule,
  forecastWithColdNights,
  glowBar,
  guardedDynamic,
  monthlyMicro,
  txt,
  usd,
} from '../parts.mjs';

export default function twelfthNight(s, c) {
  const pulseT = s.value(0);
  const elevenProg = s.value(0); // `eleven-nights`: 0 -> 11 cold nights
  const markTwelfth = s.value(0); // beat 1 outlines Night 12 (prediction hold)
  const postTwelfth = s.value(0); // `post-twelfth`: ignites Night 12 -> $751.74 breach!

  const header = cinemaHeader(
    'THE EVALUATION CALENDAR',
    'How many cold nights',
    'fit in the cushion?',
    {
      x: -860,
      y: -415,
      accent: ROLE.cached,
      size: 52,
    },
  );

  const sceneAura = aura(180, 40, 740, '#ffd16622', '#ff6b8b20');

  const stageCanvas = guardedDynamic(
    () => 1,
    () => {
      const ep = elevenProg.value;
      const mt = markTwelfth.value > 0.3;
      const pt = postTwelfth.value > 0.5;

      const coldCount = Math.min(11, Math.floor(ep * 11 + 0.05)) + (pt ? 1 : 0);
      const markedCount = mt || pt ? 12 : coldCount;
      const forecast = forecastWithColdNights(coldCount);
      const room = budgetMicro - forecast;
      const over = room < 0;

      const nodes = [
        txt(
          '30-NIGHT EVALUATION CALENDAR  ·  +$2.88 PER COLD NIGHT',
          -840,
          -190,
          26,
          ROLE.cached,
          'mono',
          'left',
        ),
        buildNightCalendar({
          xLeft: -840,
          yTop: -135,
          colStep: 94,
          rowStep: 102,
          coldCount,
          markedCount,
          breachNight: pt ? 12 : 0,
          alpha: 1,
        }),

        // Legend directly beneath calendar
        txt('Blue: warm read', -840, 205, 26, ROLE.batch, 'mono', 'left'),
        txt(
          pt
            ? '12 cold nights (Night 12 breaches cap)'
            : mt
              ? '11 cold · Night 12 outlined'
              : `${coldCount} cold night(s)`,
          -530,
          205,
          26,
          pt ? ROLE.breach : ROLE.cached,
          'mono',
          'left',
        ),

        // Right column: Live $750 forecast gauge & delta readouts
        txt('GENERATION BUDGET', 210, -165, 26, COSMOS.muted, 'mono', 'left'),
        txt(usd(budgetMicro), 210, -104, 54, COSMOS.ink, 'mono', 'left'),

        txt('30-DAY FORECAST', 210, -10, 26, over ? ROLE.breach : ROLE.input, 'mono', 'left'),
        txt(usd(forecast), 210, 56, 62, over ? ROLE.breach : ROLE.input, 'mono', 'left').glow(
          10,
          over ? ROLE.breach : ROLE.input,
        ),

        // Compact horizontal budget progress bar with $750 tick
        glowBar(210, 128, 620, 26, Math.min(1, (forecast - 700_000_000) / 60_000_000), {
          fill: over ? ROLE.breach : ROLE.cached,
          glow: 10,
        }),
        dashedRule(210 + (50 / 60) * 620, 106, 210 + (50 / 60) * 620, 150, COSMOS.ink, {
          width: 2.6,
        }),

        txt(
          over ? `${usd(Math.abs(room))} OVER BUDGET` : `${usd(room)} left`,
          210,
          196,
          40,
          over ? ROLE.breach : ROLE.cached,
          'mono',
          'left',
        ).glow(9, over ? ROLE.breach : ROLE.cached),
      ];

      if (pt) {
        nodes.push(
          rect(620, 68, { fill: '#351324', stroke: ROLE.breach, width: 2.8, radius: 12 })
            .at(520, 280)
            .glow(11, ROLE.breach),
          txt('HOLD THIS PLAN  ·  VERIFY PREFIX READS', 520, 280, 26, ROLE.breach, 'mono'),
          txt(
            `${usd(monthlyMicro)} + 12 x ${usd(coldNightExtraMicro)} = ${usd(forecast)}`,
            -840,
            345,
            36,
            ROLE.breach,
            'mono',
            'left',
          ).glow(8, ROLE.breach),
          txt(
            'Check reported prefix reads before promising the next evaluation run',
            -840,
            410,
            28,
            COSMOS.muted,
            'sans',
            'left',
          ),
        );
      } else if (mt) {
        // Beat 1 prediction hold!
        nodes.push(
          txt(
            '$1.14 left  ·  Night 12 adds $2.88  ·  Can the remaining budget cover it?',
            -840,
            355,
            34,
            ROLE.cached,
            'serif',
            'left',
          ).glow(7, ROLE.cached),
        );
      } else {
        nodes.push(
          txt(
            `${usd(monthlyMicro)} + ${coldCount} x ${usd(coldNightExtraMicro)} = ${usd(forecast)}`,
            -840,
            355,
            36,
            COSMOS.ink,
            'mono',
            'left',
          ),
          txt(
            'Support and evaluation volume stay fixed  ·  only nightly input price changes',
            -840,
            415,
            26,
            COSMOS.muted,
            'sans',
            'left',
          ),
        );
      }

      return group(...nodes);
    },
  );

  s.add(sceneAura, header, stageCanvas);

  c.on('eleven-nights', () => {
    const t = c.cue('eleven-nights').start;
    s.play(elevenProg.to(1, { duration: clampDur(c, t, 0.9) }));
  });
  c.onBeat(1, () => {
    const t = c.beats[1].start;
    s.play(markTwelfth.to(1, { duration: clampDur(c, t, 0.35) }));
  });
  c.on('post-twelfth', () => {
    const t = c.cue('post-twelfth').start;
    s.play(postTwelfth.to(1, { duration: clampDur(c, t, 0.5) }));
  });
}
