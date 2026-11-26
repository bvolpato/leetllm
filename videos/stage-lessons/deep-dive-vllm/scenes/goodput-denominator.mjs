// Scene 21: Calculate the actual passing-completion rate (Common 1000-request scale: A 550 pass + 50 late + 400 failed; B 752 pass + 28 late + 20 failed; TTFT < 300 ms, p99 ITL < 50 ms; algebraic denominator proof).
import {
  COSMOS,
  GOODPUT_ROWS,
  ROLE,
  aura,
  glassCell,
  glowDot,
  glowTex,
  group,
  guardedDynamic,
  heroTitle,
  runPhase,
  txt,
  wireStepCues,
} from '../parts.mjs';

export default function goodputDenominator(s, c) {
  const phase = s.value(0);
  // step:
  // 0 = op-0 / counts-a (A segmented bar: 550 pass + 50 late + 400 failed)
  // 1 = counts-b (B segmented bar: 752 pass + 28 late + 20 failed)
  // 2 = op-1 / rates (A=5.50/s, B=7.52/s)
  // 3 = inflated (A wrong 550/600 * 10 = 9.17/s!)
  // 4 = op-2 (equivalent population-preserving identity: (pass/offers)*(offers/window) = pass/window)
  const step = s.value(0);

  const bgAura = aura(0, 20, 620, '#6ee7b71a', '#ff6b8b16');
  const title = heroTitle(['Calculate the Actual', 'Passing-Completion Rate'], {
    x: -855,
    y: -435,
    size: 54,
    lineHeight: 62,
    accent: ROLE.good,
    eyebrow: 'COMMON SCALE · TTFT < 300 MS & P99 ITL < 50 MS · 100 S',
  });

  const live = guardedDynamic(1, () => {
    const st = Math.round(step.value);
    const p = phase.value;
    const scale = 1.22; // 1000 req -> 1220 px
    const barLeft = -620;
    const nodes = [
      txt(
        'GREEN = PASSED SLOs   |   GOLD = LATE   |   ROSE = FAILED / UNFINISHED',
        0,
        -255,
        26,
        COSMOS.muted,
        'mono',
      ),
    ];

    GOODPUT_ROWS.forEach((row, idx) => {
      const cy = idx === 0 ? -135 : 55;
      const showDetail = idx === 0 ? true : st >= 1;
      const wPass = row.passed * scale;
      const wLate = row.outsideLimits * scale;
      const wFail = row.unfinishedOrFailed * scale;

      nodes.push(
        txt(`CANDIDATE ${row.id}`, -855, cy, 26, idx === 0 ? ROLE.r0 : ROLE.good, 'mono', 'left'),
      );
      if (showDetail) {
        nodes.push(
          glassCell(barLeft + wPass * 0.5, cy, wPass, 82, ROLE.good, {
            fill: '#0e362c',
            glow: 8,
            radius: 8,
          }),
          txt(`${row.passed} pass`, barLeft + wPass * 0.5, cy, 28, ROLE.good, 'mono'),

          glassCell(barLeft + wPass + wLate * 0.5, cy, Math.max(24, wLate), 82, COSMOS.gold, {
            fill: '#332810',
            glow: 5,
            radius: 4,
          }),

          glassCell(barLeft + wPass + wLate + wFail * 0.5, cy, Math.max(24, wFail), 82, ROLE.bad, {
            fill: '#361425',
            glow: 6,
            radius: 8,
          }),
          txt(
            `${row.passed} passed  |  ${row.outsideLimits} late  |  ${row.unfinishedOrFailed} failed/unfinished  (of ${row.offered})`,
            barLeft,
            cy + 72,
            26,
            COSMOS.ink,
            'mono',
            'left',
          ),
        );
      } else {
        const wAll = row.offered * scale;
        nodes.push(
          glassCell(barLeft + wAll * 0.5, cy, wAll, 82, COSMOS.dim, {
            fill: '#111827',
            glow: 3,
            radius: 8,
          }),
          txt(`${row.offered} offered`, barLeft + wAll * 0.5, cy, 28, COSMOS.muted, 'mono'),
        );
      }

      if (st >= 2) {
        nodes.push(
          txt(
            `${row.goodput.toFixed(2)} / s`,
            835,
            cy,
            34,
            idx === 1 ? ROLE.good : COSMOS.gold,
            'mono',
            'right',
          ),
        );
      }
    });

    // Bottom algebraic callout
    if (st >= 4) {
      nodes.push(
        glassCell(0, 240, 1680, 118, ROLE.kv, { fill: '#0e222e', glow: 9 }),
        glowTex(
          String.raw`\frac{\text{passed}}{\text{all offers}} \cdot \frac{\text{all offers}}{\text{window}} = \frac{\text{passed}}{\text{window}}`,
          { x: 0, y: 240, size: 38, color: ROLE.kv, glow: 6 },
        ),
      );
    } else if (st === 3) {
      nodes.push(
        glassCell(0, 240, 1680, 118, ROLE.bad, { fill: '#2c1320', glow: 10 }),
        txt('BROKEN DENOMINATOR FOR A (DROPS 400 FAILED OFFERS):', 0, 212, 26, ROLE.bad, 'mono'),
        txt(
          '(550 / 600)  x  10 offers/s  =  9.17 req/s   (vs true 5.50 req/s!)',
          0,
          266,
          30,
          COSMOS.ink,
          'mono',
        ),
      );
    } else {
      nodes.push(
        glassCell(0, 240, 1680, 108, COSMOS.gold, { fill: '#1f1a0f', glow: 7 }),
        txt(
          st === 2
            ? 'True goodput: A = 550 / 100 s = 5.50 req/s   |   B = 752 / 100 s = 7.52 req/s'
            : 'Keep failed & unfinished offers in the denominator when comparing serving engines',
          0,
          240,
          28,
          COSMOS.gold,
          'mono',
        ),
      );
    }

    const u = (p * 0.65) % 1;
    nodes.push(
      glowDot(-780 + u * 1560, 330, { radius: 6, color: st === 3 ? ROLE.bad : ROLE.good }),
      txt(
        'Match loads, warmup, steady-state window & explicit rules for single-token requests',
        0,
        385,
        26,
        COSMOS.muted,
        'sans',
      ),
    );
    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);
  wireStepCues(s, c, step, [
    ['vv-goodput-denominator-op-0', 0],
    ['vv-goodput-denominator-counts-a', 0],
    ['vv-goodput-denominator-counts-b', 1, true],
    ['vv-goodput-denominator-op-1', 2],
    ['vv-goodput-denominator-rates', 2, true],
    ['vv-goodput-denominator-inflated', 3, true],
    ['vv-goodput-denominator-op-2', 4],
  ]);
}
