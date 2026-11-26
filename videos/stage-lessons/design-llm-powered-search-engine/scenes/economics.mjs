// Scene 24: economics - What does a cache miss cost?
// Prediction beat: 100 requests (60 full synthesis, 30 valid cache, 10 live lookup -> mean 0.601c).
// 10 cached answers expire -> strictly withholds new mean (0.695c) until `c.after('cost-new-mean')`!
import { group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ECON_BASE_MEAN,
  ECON_DELTA,
  ECON_ROUTES,
  ROLE,
  aura,
  cinemaHeader,
  clampDur,
  driftValue,
  guardedDynamic,
  txt,
} from '../parts.mjs';

export default function economics(s, c) {
  const pulse = s.value(0);
  const cohortOn = s.value(0);
  const baseMeanOn = s.value(0);
  const staleOn = s.value(0);
  const askOn = s.value(0);
  const rerouteProg = s.value(0);
  const newMeanOn = s.value(0);

  const header = cinemaHeader('SEARCH UNIT ECONOMICS', 'What does a cache', 'invalidation cost?', {
    accent: ROLE.focus,
    size: 46,
  });

  const stageAura = aura(0, 40, 720, '#60a5fa1a', '#ffd16618');

  const routeColors = [ROLE.policy, ROLE.ok, ROLE.focus];
  const routeNames = ['Full synthesis', 'Valid cache', 'Live lookup'];

  const view = guardedDynamic(
    () => 1,
    () => {
      const bm = baseMeanOn.value > 0.5;
      const st = staleOn.value > 0.5;
      const ask = askOn.value > 0.5;
      const rr = rerouteProg.value;
      const nm = newMeanOn.value > 0.5;

      const moved = Math.round(10 * rr);
      const counts = [60 + moved, 30 - moved, 10];
      const meanDollars =
        (counts[0] * ECON_ROUTES[0].cost +
          counts[1] * ECON_ROUTES[1].cost +
          counts[2] * ECON_ROUTES[2].cost) /
        100;

      const nodes = [
        txt(
          '100 SEARCH REQUESTS (10 × 10 COHORT)',
          -845,
          -238,
          26,
          ROLE.query,
          'mono',
          'left',
        ).opacity(0.65 + 0.35 * cohortOn.value),
      ];

      // 10x10 glowing traffic matrix on left
      for (let i = 0; i < 100; i++) {
        const colIdx = i % 10;
        const rowIdx = Math.floor(i / 10);
        const routeIdx = i < counts[0] ? 0 : i < counts[0] + counts[1] ? 1 : 2;
        const isInvalidRow = i >= 60 && i < 70 && st;
        const x = -815 + colIdx * 70;
        const y = -165 + rowIdx * 48;
        const tileCol = routeColors[routeIdx];
        nodes.push(
          rect(54, 34, {
            fill: tileCol,
            stroke: isInvalidRow ? '#ffffff' : null,
            width: isInvalidRow ? 2.4 : 0,
            radius: 6,
          })
            .at(x, y)
            .opacity(isInvalidRow && routeIdx === 1 ? 0.55 : 0.9),
        );
        if (isInvalidRow && routeIdx === 1) {
          nodes.push(line([x - 18, y + 10], [x + 18, y - 10], { stroke: ROLE.deny, width: 3.5 }));
        }
      }

      nodes.push(
        txt(
          moved === 10
            ? 'Row 7 rerouted -> 10 fresh full-synthesis searches'
            : st
              ? 'Row 7 highlighted -> 10 cached answers invalidated'
              : 'One luminous tile per search request',
          -845,
          318,
          26,
          st && moved < 10 ? ROLE.deny : COSMOS.muted,
          'mono',
          'left',
        ),
      );

      // Right side: Route price ledger + mean readout
      nodes.push(
        txt('ROUTE', -40, -238, 26, COSMOS.muted, 'mono', 'left'),
        txt('COUNT × ALL-IN PRICE', 840, -238, 26, COSMOS.muted, 'mono', 'right'),
      );

      ECON_ROUTES.forEach((route, i) => {
        const y = -125 + i * 114;
        nodes.push(
          txt(routeNames[i], -40, y, 34, routeColors[i], 'serif', 'left'),
          txt(
            `${counts[i]} × ${(route.cost * 100).toFixed(2)}¢`,
            840,
            y,
            34,
            routeColors[i],
            'mono',
            'right',
          ),
        );
      });

      nodes.push(
        line([-40, 175], [840, 175], { stroke: '#364a75', width: 2.5 }),
        txt('MEAN PER REQUEST', -40, 250, 32, COSMOS.ink, 'mono', 'left'),
      );

      // Strictly withhold new mean (0.695c) until `c.after('cost-new-mean')`!
      const showValue = bm && (moved === 0 || nm);
      const meanText = showValue ? `${(meanDollars * 100).toFixed(3)}¢` : '...';
      const meanCol = nm ? ROLE.ok : ROLE.focus;
      nodes.push(
        txt(meanText, 840, 250, 48, meanCol, 'mono', 'right').glow(showValue ? 9 : 0, meanCol),
      );

      // Bottom prompt / answer line
      if (nm) {
        nodes.push(
          txt(
            `Each miss adds +${(ECON_DELTA * 100).toFixed(2)}¢ -> mean rises from ${(ECON_BASE_MEAN * 100).toFixed(3)}¢ to ${(meanDollars * 100).toFixed(3)}¢.`,
            -845,
            392,
            32,
            ROLE.ok,
            'serif',
            'left',
          ).glow(7, ROLE.ok),
        );
      } else if (ask) {
        nodes.push(
          txt(
            'Same 100 searches, 10 cache misses. What happens to the mean cost?',
            -845,
            392,
            34,
            ROLE.focus,
            'serif',
            'left',
          ).glow(7, ROLE.focus),
        );
      } else {
        nodes.push(
          txt(
            'Multiply each route count by its all-in price and divide by 100.',
            -845,
            392,
            30,
            COSMOS.muted,
            'sans',
            'left',
          ),
        );
      }

      return group(...nodes);
    },
  );

  s.add(stageAura, header, view);
  driftValue(s, c, pulse, 4.5, { startOffset: 0.1, endMargin: 0.5 });

  c.on('cost-requests', () => {
    s.play(cohortOn.to(1, { duration: clampDur(c, c.cue('cost-requests').start, 0.35) }));
  });
  c.after('cost-base', () => {
    s.play(baseMeanOn.to(1, { duration: clampDur(c, c.cue('cost-base').end, 0.25) }));
  });
  c.on('cost-stale', () => {
    s.play(staleOn.to(1, { duration: clampDur(c, c.cue('cost-stale').start, 0.35) }));
  });
  c.on('cost-question', () => {
    s.play(askOn.to(1, { duration: clampDur(c, c.cue('cost-question').start, 0.25) }));
  });
  c.on('cost-reroute', () => {
    s.play(rerouteProg.to(1, { duration: clampDur(c, c.cue('cost-reroute').start, 0.75) }));
  });
  // Strict prediction withholding: reveal 0.695c ONLY after "the mean rises to just under seven tenths of a cent"
  c.after('cost-new-mean', () => {
    s.play(newMeanOn.to(1, { duration: clampDur(c, c.cue('cost-new-mean').end, 0.25) }));
  });
}
