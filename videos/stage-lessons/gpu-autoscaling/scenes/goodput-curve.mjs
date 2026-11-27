// Scene 13: goodput-curve - Which load can this service promise?
// Glowing Goodput / SLO attainment frontier: 10 RPS (92/100 = 92%) vs 12 RPS (105/120 = 87.5%)
// against a glowing 90% attainment threshold. Strict prediction withholding until AFTER tested-capacity.
import { group } from 'vizmatic/stage';
import {
  COSMOS,
  DATA,
  ROLE,
  aura,
  cinemaHeader,
  dashedRule,
  glowBar,
  guardedDynamic,
  tweenOn,
  txt,
} from '../parts.mjs';

export default function goodputCurve(s, c) {
  const step = s.value(0); // 1=trial1(92/100), 2=trial2(105/120 + question), 3=answer 10 RPS (AFTER!)

  const header = cinemaHeader(
    'GOODPUT & SLO ATTAINMENT',
    'Which load can this',
    'service promise?',
    {
      x: -860,
      y: -420,
      accent: ROLE.warm,
      size: 52,
    },
  );

  const bgAura = aura(180, 40, 640, '#6ee7b720', '#ffd16618');

  const dyn = guardedDynamic(
    () => 1,
    () => {
      const st = step.value;

      const barLeft = -420;
      const barW = 1040;
      // Map attainment in [0.75, 1.00] to bar fraction [0, 1] for crisp visual separation around 90%!
      const fracOf = (att) => Math.max(0.05, Math.min(1, (att - 0.75) / 0.25));
      const sloX = barLeft + barW * fracOf(0.9);

      const nodes = [
        txt(
          'SLO RULE:  >= 90% OF ALL OFFERED REQUESTS',
          860,
          -355,
          26,
          ROLE.deadline,
          'mono',
          'right',
        ).glow(5, ROLE.deadline),
        // Vertical 90% attainment threshold line
        dashedRule(sloX, -210, sloX, 220, ROLE.deadline, 0.92, 3.2),
        txt('90% SLO GATE', sloX, -238, 26, ROLE.deadline, 'mono').glow(7, ROLE.deadline),
        // Axis ticks 75%, 85%, 90%, 95%, 100%
        txt('75%', barLeft, 255, 26, COSMOS.dim, 'mono'),
        txt('85%', barLeft + barW * fracOf(0.85), 255, 26, COSMOS.dim, 'mono'),
        txt('90%', sloX, 255, 26, ROLE.deadline, 'mono'),
        txt('95%', barLeft + barW * fracOf(0.95), 255, 26, COSMOS.dim, 'mono'),
        txt('100%', barLeft + barW, 255, 26, COSMOS.dim, 'mono'),
      ];

      // Trial 1: 10 RPS (92 / 100 = 92%, 9.2 qualified/s)
      const t1 = DATA.trial10;
      nodes.push(
        txt('TRIAL 1:  10 RPS', -860, -108, 30, ROLE.warm, 'mono', 'left'),
        txt('92 / 100 qualified', -860, -60, 26, COSMOS.muted, 'mono', 'left'),
        glowBar(barLeft, -84, barW, 66, fracOf(t1.attainment), {
          fill: ROLE.warm,
          glow: 9,
        }),
        txt(
          `${(t1.attainment * 100).toFixed(0)}%  (${t1.qualifiedRPS.toFixed(1)}/s)`,
          650,
          -84,
          28,
          ROLE.warm,
          'mono',
          'left',
        ),
      );

      // Trial 2: 12 RPS (105 / 120 = 87.5%, 10.5 qualified/s)
      if (st >= 1.5) {
        const t2 = DATA.trial12;
        const t2Col = st >= 2.5 ? ROLE.expired : ROLE.active;
        nodes.push(
          txt('TRIAL 2:  12 RPS', -860, 74, 30, t2Col, 'mono', 'left'),
          txt('105 / 120 qualified', -860, 122, 26, COSMOS.muted, 'mono', 'left'),
          glowBar(barLeft, 98, barW, 66, fracOf(t2.attainment), {
            fill: t2Col,
            glow: 9,
          }),
          txt(
            st >= 2.5 ? `${(t2.attainment * 100).toFixed(1)}% FAIL` : `10.5 qual/s`,
            650,
            98,
            28,
            t2Col,
            'mono',
            'left',
          ),
        );
      }

      // Prediction prompt during beat 1 hold (before reveal)
      if (st >= 1.5 && st < 2.5) {
        nodes.push(
          txt(
            'PREDICT: Which offered rate should you plan around?',
            0,
            355,
            32,
            ROLE.predict,
            'sans',
          )
            .glow(8, ROLE.predict)
            .opacity(1),
        );
      }

      // Reveal strictly AFTER tested-capacity
      if (st >= 2.5) {
        nodes.push(
          txt(
            'PLAN AT 10 RPS  ·  12 RPS qualifies only 87.5% (< 90%)',
            0,
            345,
            32,
            ROLE.warm,
            'mono',
          ).glow(8, ROLE.warm),
          txt(
            'Keep failed, rejected & late requests in the denominator  ·  track tail gaps & $/success',
            0,
            408,
            26,
            COSMOS.muted,
            'sans',
          ),
        );
      } else if (st < 1.5) {
        nodes.push(
          txt(
            'Both TTFT and decode targets must pass to qualify',
            0,
            355,
            28,
            COSMOS.muted,
            'sans',
          ),
        );
      }

      return group(...nodes);
    },
  );

  s.add(bgAura, header, dyn);

  tweenOn(s, c, 'first-trial', step, 1, 0.35);
  tweenOn(s, c, 'higher-load', step, 2, 0.35);
  tweenOn(s, c, 'tested-capacity', step, 3, 0.3, { after: true });
}
