// Scene 30: spot-deadline - Respect the earliest shutdown budget and streamed-state boundary
// Glowing provider preemption ruler: 120s notice - 20s cleanup = 100s usable budget
// classifying 12s / 84s / 170s (unstreamed vs streamed), provider notices (AWS/Azure/GCP),
// and shrinking to 30s - 20s = 10s where even the 12s estimate no longer fits.
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

export default function spotDeadline(s, c) {
  const step = s.value(0); // 1=120-20=100s, 2=highlight 100s boundary, 3=provider notices, 4=30-20=10s short warning, 5=12s no longer fits

  const header = cinemaHeader(
    'SPOT PREEMPTION & DRAIN BUDGET',
    'Earliest deadline &',
    'streamed-state rule',
    {
      x: -860,
      y: -420,
      accent: ROLE.expired,
      size: 52,
    },
  );

  const bgAura = aura(180, 40, 640, '#ff6b8b1e', '#fb923c1a');

  const dyn = guardedDynamic(
    () => 1,
    () => {
      const st = step.value;
      const shortWarn = st >= 3.5;
      const budget = shortWarn ? DATA.spot30.usable : DATA.spot120.usable;
      const notice = shortWarn ? DATA.spot30.notice : DATA.spot120.notice;

      const barLeft = -360;
      const barW = 860;
      const maxS = 180;
      const bx = (sec) => barLeft + (sec / maxS) * barW;

      const nodes = [
        txt(
          `${notice}s NOTICE - 20s CLEANUP = ${budget}s USABLE`,
          860,
          -355,
          28,
          shortWarn ? ROLE.expired : ROLE.warm,
          'mono',
          'right',
        ).glow(7, shortWarn ? ROLE.expired : ROLE.warm),

        // Vertical usable budget gate
        dashedRule(
          bx(budget),
          -210,
          bx(budget),
          235,
          shortWarn ? ROLE.expired : ROLE.deadline,
          0.94,
          3.2,
        ),
        txt(
          `${budget}s GATE`,
          bx(budget) + 12,
          -238,
          26,
          shortWarn ? ROLE.expired : ROLE.deadline,
          'mono',
          'left',
        ).glow(7, shortWarn ? ROLE.expired : ROLE.deadline),
      ];

      // Four workload rows evaluated against live `budget`
      const items = [
        { label: 'Short stream (12s)', rem: 12, streamed: true },
        { label: 'Medium stream (84s)', rem: 84, streamed: true },
        { label: 'Unstreamed (170s)', rem: 170, streamed: false },
        { label: 'Active stream (170s)', rem: 170, streamed: true },
      ];

      items.forEach((it, i) => {
        const y = -135 + i * 96;
        const fits = it.rem <= budget;
        const action = fits
          ? 'FINISH LOCALLY'
          : it.streamed
            ? 'EXPLICIT INTERRUPT'
            : 'RETRY (ORIG BUDGET)';
        const col = fits ? ROLE.warm : it.streamed ? ROLE.expired : ROLE.focus;
        nodes.push(
          txt(it.label, -860, y, 28, COSMOS.ink, 'mono', 'left'),
          glowBar(barLeft, y, barW, 44, it.rem / maxS, { fill: col, glow: 8 }),
          txt(action, 530, y, 26, col, 'mono', 'left').glow(6, col),
        );
      });

      // Provider notice strip (beat 1+)
      const provOp = st >= 2.5 ? 1 : 0.4;
      nodes.push(
        txt('AWS EC2: ~120s (best effort)', -860, 295, 26, ROLE.active, 'mono', 'left').opacity(
          provOp,
        ),
        txt('Azure: up to 30s', -180, 295, 26, ROLE.focus, 'mono', 'left').opacity(provOp),
        txt('GCP: 0s default (opt 120s)', 260, 295, 26, ROLE.decode, 'mono', 'left').opacity(
          provOp,
        ),
      );

      // Bottom safety rule
      const foot = shortWarn
        ? 'At 30s notice (10s usable), even the 12s stream fails  ·  Never splice fresh text onto a partial stream'
        : '100s fits; 101s does not  ·  K8s terminationGracePeriod can arrive earlier than cloud notice';
      nodes.push(txt(foot, 0, 392, 26, shortWarn ? ROLE.expired : COSMOS.muted, 'sans'));

      return group(...nodes);
    },
  );

  s.add(bgAura, header, dyn);

  tweenOn(s, c, 'ga-spot-deadline-b0', step, 1, 0.35);
  tweenOn(s, c, 'ga-drain-budget', step, 2, 0.3);
  tweenOn(s, c, 'ga-spot-deadline-b1', step, 3, 0.35);
  tweenOn(s, c, 'ga-spot-deadline-b2', step, 4, 0.3);
  tweenOn(s, c, 'ga-short-warning', step, 5, 0.3);
}
