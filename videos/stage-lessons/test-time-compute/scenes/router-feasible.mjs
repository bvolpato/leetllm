// Scene 22: router-feasible: Policy routing (quality >= 0.84, latency <= 1000 ms, cheapest): single (0.78 fail), guided (2600ms fail) -> bounded (0.86, 780ms, $0.010 WINS!).
import {
  COSMOS,
  ROLE,
  ROUTER_FRAME,
  aura,
  chipPill,
  group,
  guardedDynamic,
  heroTitle,
  lumBar,
  playCue,
  txt,
} from '../parts.mjs';

export default function routerFeasible(s, c) {
  const showBounded = s.value(0);
  const showChoice = s.value(0);

  const bgAura = aura(0, 0, 740, '#14335c28', '#14383222');
  const title = heroTitle(
    ['Feasible Policy Routing:', 'Quality Floor, Latency Cap & Minimum Cost'],
    {
      x: -855,
      y: -430,
      size: 46,
      lineHeight: 54,
      accent: ROLE.ok,
    },
  );

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const bd = showBounded.value;
    const ch = showChoice.value;

    const barX = -460;
    const maxW = 720;

    const nodes = [
      txt(
        'ROUTING RULE:  QUALITY >= 0.84   AND   LATENCY <= 1000 ms   ->   CHEAPEST',
        -855,
        -220,
        26,
        ROLE.search,
        'mono',
        'left',
      ).opacity(alpha),
    ];

    ROUTER_FRAME.rows.forEach((r, idx) => {
      const y = -110 + idx * 105;
      const isWinner = r.id === ROUTER_FRAME.chosen.id;
      const op = idx === 0 ? alpha : alpha * (0.48 + 0.52 * bd);
      const col = isWinner && ch > 0.35 ? ROLE.ok : idx === 0 || idx === 2 ? ROLE.err : ROLE.gold;
      const status =
        idx === 0
          ? '0.78 (<0.84 FAIL!)'
          : idx === 2
            ? '2600ms (>1000 FAIL!)'
            : ch > 0.35
              ? '0.86 | 780ms | $0.010 WIN!'
              : '0.86 | 780ms | $0.010';
      nodes.push(
        txt(r.id.toUpperCase(), -855, y, 28, col, 'mono', 'left').opacity(op),
        lumBar(barX, y, r.quality * maxW, 42, col, { opacity: op, maxTrackW: maxW }),
        txt(status, barX + maxW + 24, y, 26, col, 'mono', 'left').opacity(op),
      );
    });

    nodes.push(
      chipPill(
        ch > 0.35
          ? 'Bounded reasoning wins ($0.010); keep easy lookups on single-pass & use fallback if none fits!'
          : 'Check both quality floor AND tail latency on target workload before selecting cheapest route',
        0,
        245,
        {
          w: 1620,
          h: 76,
          color: ch > 0.35 ? ROLE.ok : ROLE.gold,
          fill: ch > 0.35 ? '#0f2d24' : '#10182d',
          size: 26,
          glow: 10,
          opacity: alpha,
        },
      ),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, layer);
  playCue(s, c, 'tt-router-feasible-0', (d) => s.play(showBounded.to(0, { duration: d })));
  playCue(s, c, 'tt-router-single', (d) => s.play(showBounded.to(0.2, { duration: d })));
  playCue(s, c, 'tt-router-feasible-1', (d) => s.play(showBounded.to(0.6, { duration: d })));
  playCue(s, c, 'tt-router-bounded', (d) => s.play(showBounded.to(0.85, { duration: d })));
  playCue(s, c, 'tt-router-guided', (d) => s.play(showBounded.to(1, { duration: d })));
  playCue(s, c, 'tt-router-choice', (d) => s.play(showChoice.to(1, { duration: d })));
  playCue(s, c, 'tt-router-feasible-2', (d) => s.play(showChoice.to(1, { duration: d })));
}
