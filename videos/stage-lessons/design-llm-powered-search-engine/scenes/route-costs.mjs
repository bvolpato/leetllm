// Scene 25: route-costs - Weight every paid route in one consistent cohort
// Beat 0: 15 blue prompt blocks (1,500 in) + 4 emerald answer blocks (400 out) at $3/1M = $0.0057.
// Beat 1: Full route breakdown ($0.0057 + $0.002 + $0.001 + $0.001 = $0.0097) vs cache & structured.
// Beat 2: 60%/30%/10% weighted mean = $0.00601/req and $360.60/min at 1,000 req/s.
import { group, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ECON_BASE_MEAN,
  ECON_ROUTES,
  MINUTE_COST,
  ROLE,
  ROUTE_FULL_COST,
  ROUTE_MODEL_COST,
  aura,
  cinemaHeader,
  clampDur,
  glowMeter,
  guardedDynamic,
  txt,
} from '../parts.mjs';

export default function routeCosts(s, c) {
  const blocksProg = s.value(0);
  const modelDone = s.value(0);
  const beat1On = s.value(0);
  const fullDone = s.value(0);
  const cheapDone = s.value(0);
  const beat2On = s.value(0);
  const meanDone = s.value(0);
  const minDone = s.value(0);

  const header = cinemaHeader(
    'COST BREAKDOWN',
    'Weight every paid route',
    'in one traffic cohort',
    {
      accent: ROLE.ok,
      size: 46,
    },
  );

  const stageAura = aura(0, 50, 700, '#60a5fa1a', '#6ee7b71a');

  const view = guardedDynamic(
    () => 1,
    () => {
      const bp = blocksProg.value;
      const md = modelDone.value > 0.5;
      const b1 = beat1On.value > 0.5;
      const fd = fullDone.value > 0.5;
      const cd = cheapDone.value > 0.5;
      const b2 = beat2On.value > 0.5;
      const mn = meanDone.value > 0.5;
      const mt = minDone.value > 0.5;
      const nodes = [];

      if (b2) {
        // Beat 2: Traffic-weighted contributions + $360.60/min scale
        const cols = [ROLE.policy, ROLE.ok, ROLE.focus];
        nodes.push(
          txt(
            'TRAFFIC-WEIGHTED CONTRIBUTIONS (ONE CONSISTENT COHORT)',
            -855,
            -225,
            26,
            ROLE.query,
            'mono',
            'left',
          ),
        );
        ECON_ROUTES.forEach((r, i) => {
          const y = -110 + i * 130;
          const contrib = r.share * r.cost;
          nodes.push(
            txt(
              `${r.name}:  ${Math.round(r.share * 100)}% × $${r.cost.toFixed(4)}`,
              -855,
              y,
              28,
              cols[i],
              'mono',
              'left',
            ),
            glowMeter(-120, y, 660, 44, contrib / 0.0062, { fill: cols[i] }),
            txt(mn ? `$${contrib.toFixed(5)}` : '...', 845, y, 30, cols[i], 'mono', 'right'),
          );
        });

        nodes.push(
          txt(
            mn
              ? `MEAN COST = $${ECON_BASE_MEAN.toFixed(5)} / request`
              : 'Summing weighted route shares...',
            -855,
            278,
            34,
            ROLE.ok,
            'mono',
            'left',
          ).glow(mn ? 7 : 0, ROLE.ok),
          txt(
            mt
              ? `1,000 req/s (60,000/min) = $${MINUTE_COST.toFixed(2)} / minute`
              : 'Measure prices, token lengths & route shares on the same fleet traffic.',
            -855,
            368,
            32,
            mt ? ROLE.focus : COSMOS.muted,
            'mono',
            'left',
          ).glow(mt ? 8 : 0, ROLE.focus),
        );
      } else if (b1) {
        // Beat 1: Full synthesis stack ($0.0057 + $0.002 + $0.001 + $0.001 = $0.0097) vs cheap routes
        const parts = [
          { name: 'Model $0.0057', val: ROUTE_MODEL_COST, col: ROLE.policy },
          { name: 'Retr. $0.002', val: 0.002, col: ROLE.query },
          { name: 'Rerank', val: 0.001, col: ROLE.rewrite },
          { name: 'Verify', val: 0.001, col: ROLE.ok },
        ];
        nodes.push(
          txt('ALL-IN FULL SYNTHESIS ROUTE PRICE', -840, -215, 28, ROLE.policy, 'mono', 'left'),
        );
        let cx = -840;
        const totalW = 1660;
        parts.forEach((pt) => {
          const w = (pt.val / ROUTE_FULL_COST) * totalW;
          nodes.push(
            rect(w - 8, 108, { fill: '#0d1527', stroke: pt.col, width: 2.8, radius: 10 })
              .at(cx + w * 0.5, -105)
              .glow(6, pt.col),
            txt(pt.name, cx + w * 0.5, -105, 26, pt.col, 'mono', 'center'),
          );
          cx += w;
        });

        nodes.push(
          txt(
            fd
              ? `FULL SYNTHESIS = $${ROUTE_FULL_COST.toFixed(4)}  (0.97¢)`
              : 'Summing model + retrieval + rerank + verify...',
            -840,
            25,
            36,
            ROLE.policy,
            'mono',
            'left',
          ).glow(fd ? 7 : 0, ROLE.policy),

          // Show the two cheaper routes right away (dimmed until highlighted on cheapDone -> balanced frame)
          rect(780, 140, {
            fill: '#0d1a24',
            stroke: cd ? ROLE.ok : '#344c73',
            width: cd ? 2.8 : 2,
            radius: 14,
          })
            .at(-450, 215)
            .glow(cd ? 8 : 0, ROLE.ok),
          txt('VALID CACHE HIT', -805, 182, 26, cd ? ROLE.ok : COSMOS.muted, 'mono', 'left'),
          txt(
            cd ? '$0.0003  (0.03¢)' : 'Auth + storage + network',
            -805,
            240,
            cd ? 38 : 28,
            cd ? ROLE.ok : COSMOS.dim,
            'mono',
            'left',
          ),

          rect(780, 140, {
            fill: '#121526',
            stroke: cd ? ROLE.focus : '#344c73',
            width: cd ? 2.8 : 2,
            radius: 14,
          })
            .at(450, 215)
            .glow(cd ? 8 : 0, ROLE.focus),
          txt('STRUCTURED LOOKUP', 95, 182, 26, cd ? ROLE.focus : COSMOS.muted, 'mono', 'left'),
          txt(
            cd ? '$0.0010  (0.10¢)' : 'Auth + API + network',
            95,
            240,
            cd ? 38 : 28,
            cd ? ROLE.focus : COSMOS.dim,
            'mono',
            'left',
          ),

          txt(
            'Even cache and structured routes still authenticate the reader & pay storage/network.',
            -840,
            368,
            28,
            COSMOS.muted,
            'sans',
            'left',
          ),
        );
      } else {
        // Beat 0: 15 blue prompt blocks (100 in) + 4 green answer blocks (100 out)
        const nShow = Math.max(1, Math.min(19, Math.ceil(Math.max(0.1, bp) * 19)));
        nodes.push(
          txt(
            'COST WORKLOAD: 1,500 INPUT + 400 OUTPUT TOKENS (vs 120 out in capacity)',
            -840,
            -228,
            26,
            ROLE.focus,
            'mono',
            'left',
          ),
        );
        for (let i = 0; i < nShow; i++) {
          const colIdx = i % 10;
          const rowIdx = Math.floor(i / 10);
          const isIn = i < 15;
          const x = -765 + colIdx * 168;
          const y = -105 + rowIdx * 135;
          const col = isIn ? ROLE.policy : ROLE.ok;
          nodes.push(
            rect(142, 92, { fill: '#0d1527', stroke: col, width: 2.6, radius: 10 })
              .at(x, y)
              .glow(5, col),
            txt(isIn ? '100 in' : '100 out', x, y, 26, col, 'mono', 'center'),
          );
        }

        nodes.push(
          txt('1,900 total tokens  ×  $3 / million', -840, 210, 32, COSMOS.ink, 'mono', 'left'),
          txt(
            md
              ? `MODEL WORK = $${ROUTE_MODEL_COST.toFixed(4)}  (0.57¢)`
              : 'computing model token charge...',
            -840,
            302,
            40,
            md ? ROLE.ok : COSMOS.dim,
            'mono',
            'left',
          ).glow(md ? 8 : 0, ROLE.ok),
        );
      }

      return group(...nodes);
    },
  );

  s.add(stageAura, header, view);
  c.on('se-route-costs-0', () => {
    s.play(blocksProg.to(1, { duration: clampDur(c, c.cue('se-route-costs-0').start, 1.1) }));
  });
  c.on('se-route-costs-tokens', () => {
    s.play(modelDone.to(1, { duration: clampDur(c, c.cue('se-route-costs-tokens').start, 0.35) }));
  });
  c.on('se-route-costs-1', () => {
    s.play(beat1On.to(1, { duration: clampDur(c, c.cue('se-route-costs-1').start, 0.25) }));
  });
  c.on('se-route-costs-full', () => {
    s.play(fullDone.to(1, { duration: clampDur(c, c.cue('se-route-costs-full').start, 0.35) }));
  });
  c.on('se-route-costs-cheap', () => {
    s.play(cheapDone.to(1, { duration: clampDur(c, c.cue('se-route-costs-cheap').start, 0.35) }));
  });
  c.on('se-route-costs-2', () => {
    s.play(beat2On.to(1, { duration: clampDur(c, c.cue('se-route-costs-2').start, 0.25) }));
  });
  c.on('se-route-costs-mean', () => {
    s.play(meanDone.to(1, { duration: clampDur(c, c.cue('se-route-costs-mean').start, 0.45) }));
  });
  c.on('se-route-costs-minute', () => {
    s.play(minDone.to(1, { duration: clampDur(c, c.cue('se-route-costs-minute').start, 0.35) }));
  });
}
