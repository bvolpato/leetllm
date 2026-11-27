// Scene 29: Compute qualified throughput separately from offered-load capacity (10s trials: 10/s -> 92/100 = 9.2/s, 92% PASS vs 12/s -> 105/120 = 10.5/s, 87.5% FAIL).
import {
  COSMOS,
  GOODPUT_10,
  GOODPUT_12,
  ROLE,
  aura,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  rect,
  txt,
  wireStepCues,
} from '../parts.mjs';

export default function goodputGate(s, c) {
  // step:
  // 0 = define qualified goodput vs offered-load capacity (all offered in denominator)
  // 1 = 10s trial setup: 10 req/s (92/100) vs 12 req/s (105/120)
  // 2 = Trial A: 9.2 qualified/s · 92.0%
  // 3 = Trial B: 10.5 qualified/s · 87.5%
  // 4 = 90% gate -> 10 req/s is highest passing tested offered rate
  // 5 = higher goodput != passing service point; test 11 req/s separately
  const step = s.value(0);

  const bgAura = aura(0, 20, 640, '#6ee7b71a', '#ff6b8b16');
  const title = heroTitle(['Qualified Goodput vs', 'Offered-Load Capacity'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: ROLE.decode,
    eyebrow: 'SLO SERVING GATE · 90% QUALIFYING FRACTION RULE',
  });

  const live = guardedDynamic(1, () => {
    const st = Math.round(step.value);
    const showA = st >= 2;
    const showB = st >= 3;
    const showWinner = st >= 4;
    const nodes = [];

    // Gate rule banner
    nodes.push(
      glassCell(0, -195, 1520, 76, showWinner ? ROLE.decode : ROLE.prefill, {
        fill: showWinner ? '#0d2922' : '#10213d',
        glow: 9,
      }),
      txt(
        showWinner
          ? '90% SLO GATE RESULT: HIGHEST PASSING TESTED OFFERED RATE = 10 req/s'
          : 'SLO GATE: >= 90% of ALL offered attempts (incl. failed/late/cancelled) must qualify',
        0,
        -195,
        26,
        showWinner ? ROLE.decode : COSMOS.ink,
        'mono',
      ),
    );

    // Helper for Trial A (10/s) and Trial B (12/s)
    const renderTrial = (cx, data, showStats, pass) => {
      const col = showStats ? (pass ? ROLE.decode : ROLE.fail) : ROLE.prefill;
      nodes.push(
        glassCell(cx, 55, 720, 385, col, {
          fill: showStats ? (pass ? '#0d2620' : '#2a1220') : '#0f1b32',
          glow: showStats ? 10 : 5,
        }),
        txt(`TRIAL: ${data.offeredRate} OFFERED req/s (10 s)`, cx, -95, 28, col, 'mono'),
        txt(
          `${data.qualified} qualified  /  ${data.attempts} offered`,
          cx,
          -32,
          30,
          COSMOS.ink,
          'mono',
        ),
      );

      // Visual fraction bar with 90% threshold marker
      const barW = 580;
      const fillW = barW * data.fraction;
      const threshX = cx - barW / 2 + barW * 0.9;
      nodes.push(
        rect(barW, 38, { fill: '#0b1220', stroke: '#334155', width: 2, radius: 6 }).at(cx, 38),
        rect(fillW, 34, { fill: col, stroke: null, radius: 5 }).at(cx - barW / 2 + fillW / 2, 38),
        rect(4, 56, { fill: COSMOS.gold, stroke: null }).at(threshX, 38),
        txt('90%', threshX, 88, 26, COSMOS.gold, 'mono'),
      );

      nodes.push(
        txt(
          showStats ? `Goodput: ${data.goodput.toFixed(1)} qual/s` : 'Goodput: ?',
          cx,
          145,
          30,
          showStats ? COSMOS.ink : COSMOS.muted,
          'mono',
        ),
        txt(
          showStats
            ? `Fraction: ${(data.fraction * 100).toFixed(1)}%  (${pass ? 'PASS >= 90%' : 'FAIL < 90%'})`
            : 'Qualifying fraction: ?',
          cx,
          202,
          28,
          col,
          'mono',
        ),
      );
    };

    renderTrial(-410, GOODPUT_10, showA, true);
    renderTrial(410, GOODPUT_12, showB, false);

    nodes.push(
      txt(
        showWinner
          ? '10 req/s passes (92%); 12 req/s fails (87.5%) despite 10.5/s goodput; test 11/s.'
          : 'Keep rejected, failed, cancelled, and late attempts in the offered-request denominator.',
        0,
        355,
        28,
        COSMOS.ink,
        'sans',
      ),
    );
    return group(...nodes);
  });

  s.add(bgAura, title, live);
  wireStepCues(s, c, step, [
    ['sg-goodput-gate-beat-0', 0],
    ['sg-goodput-gate-beat-1', 1],
    ['sg-goodput-a', 2, true],
    ['sg-goodput-b', 3, true],
    ['sg-goodput-select', 4, true],
    ['sg-goodput-gate-beat-2', 5],
  ]);
}
