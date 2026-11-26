// Scene 20: uncertainty-and-quality - Give percentiles and quality a population
// Luminous 200-outcome constellation (190 emerald + 10 rose = 95.0% observed) hovering above
// a 0..1 probability axis showing the one-sided 95% Wilson lower bound (91.8%) falling short of 95%.
import { group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  cinemaHeader,
  clampDur,
  dashedRule,
  driftValue,
  glowDot,
  glowingTrail,
  guardedDynamic,
  radialGauge,
  timeAxisNodes,
  txt,
  wilsonLower,
} from '../parts.mjs';

export default function uncertaintyAndQuality(s, c) {
  const phase = s.value(0);
  const obsLit = s.value(0.35);
  const wilsonProg = s.value(0);
  const floorAlert = s.value(0);
  const popNote = s.value(0);
  const qualNote = s.value(0);

  const lower = wilsonLower(190, 200); // ~0.9181
  const floor = 0.95;

  const header = cinemaHeader(
    'SAMPLING UNCERTAINTY',
    'Give percentiles & quality',
    'a population',
    {
      x: -860,
      y: -435,
      accent: ROLE.qualified,
      size: 50,
    },
  );

  const stageAura = aura(100, 10, 680, '#6ee7b71a', '#5ce1e61a');

  const stageView = guardedDynamic(
    () => 1,
    () => {
      const ob = obsLit.value;
      const wp = wilsonProg.value;
      const fa = floorAlert.value;
      const pn = popNote.value;
      const qn = qualNote.value;

      const nodes = [];

      // Top-right radial observed attainment dial (95.0%)
      nodes.push(
        radialGauge(700, -325, 92, 0.95, ROLE.qualified, {
          width: 10,
          glow: 10,
          markerFrac: 0.95,
        }),
        txt('95.0%', 700, -335, 38, ROLE.qualified, 'mono').glow(7, ROLE.qualified),
        txt('190 / 200', 700, -290, 26, COSMOS.muted, 'mono'),
      );

      // 200-outcome glowing constellation: 40 columns x 5 rows
      const gridLeft = -702;
      const gridTop = -175;
      const stepX = 36;
      const stepY = 44;
      for (let i = 0; i < 200; i++) {
        const cx = gridLeft + (i % 40) * stepX;
        const cy = gridTop + Math.floor(i / 40) * stepY;
        const pass = i < 190;
        nodes.push(
          rect(22, 28, {
            fill: pass ? ROLE.qualified : ROLE.fail,
            stroke: null,
            radius: 4,
          })
            .at(cx, cy)
            .opacity(pass ? 0.72 + 0.22 * ob : 0.95),
        );
      }

      nodes.push(
        txt(
          '190 QUALIFIED  ·  10 FAILED  ·  95.0% OBSERVED ATTAINMENT',
          0,
          82,
          28,
          ROLE.qualified,
          'mono',
        ).glow(6, ROLE.qualified),
      );

      // Probability axis [0, 1] at y = 215
      const xLeft = -700;
      const xRight = 740;
      const axisY = 215;
      const xOf = (v) => xLeft + v * (xRight - xLeft);
      const xFloor = xOf(floor);
      const xLower = xOf(lower);

      nodes.push(
        ...timeAxisNodes(xLeft, xRight, axisY, 0, 1, [0, 0.25, 0.5, 0.75, 1], {
          format: (v) => `${Math.round(v * 100)}%`,
        }),
      );

      // Required 95% floor laser (label cleanly BELOW axis so it never overlaps Wilson label above!)
      nodes.push(
        dashedRule(xFloor, axisY - 40, xFloor, axisY + 62, ROLE.slo, 0.95, 3.6),
        txt('95% floor', xFloor, axisY + 96, 26, ROLE.slo, 'mono').glow(fa > 0.2 ? 8 : 4, ROLE.slo),
      );

      // One-sided 95% Wilson confidence interval beam [91.8%, 100%]
      if (wp > 0.02) {
        const curLeft = 1 - (1 - lower) * wp;
        const xCur = xOf(curLeft);
        const ciCol = fa > 0.2 ? ROLE.fail : ROLE.open;
        nodes.push(
          glowingTrail(
            [
              [xCur, axisY],
              [xOf(1), axisY],
            ],
            { color: ciCol, width: 9.0, glow: 12, opacity: wp },
          ),
          glowDot(xCur, axisY, { radius: 11, color: ciCol, glow: 12, opacity: wp }),
          txt(
            `Wilson lower = ${(lower * 100).toFixed(1)}%`,
            xLower - 24,
            axisY - 56,
            28,
            ciCol,
            'mono',
            'right',
          )
            .glow(7, ciCol)
            .opacity(wp),
        );
      }

      // Bottom contextual summary
      if (qn > 0.2) {
        nodes.push(
          txt(
            'KEEP SUCCESSFUL LATENCY BESIDE FAILURES, LENGTHS & QUALITY JUDGMENTS',
            0,
            378,
            26,
            ROLE.focus,
            'mono',
          )
            .glow(6, ROLE.focus)
            .opacity(qn),
        );
      } else if (pn > 0.2) {
        nodes.push(
          txt(
            'PERCENTILES ALSO REQUIRE RAW OBSERVATIONS & A DECLARED POPULATION',
            0,
            378,
            26,
            ROLE.open,
            'mono',
          )
            .glow(6, ROLE.open)
            .opacity(pn),
        );
      } else if (fa > 0.2) {
        nodes.push(
          txt(
            '91.8% LOWER BOUND FALLS BELOW 95.0% FLOOR -> FAILS LOWER-BOUND RULE',
            0,
            378,
            28,
            ROLE.fail,
            'mono',
          )
            .glow(7, ROLE.fail)
            .opacity(fa),
        );
      } else {
        nodes.push(
          txt(
            'One-sided 95% Wilson bound assumes independent constant-probability trials',
            0,
            378,
            26,
            COSMOS.muted,
            'sans',
          ),
        );
      }

      return group(...nodes);
    },
  );

  s.add(stageAura, header, stageView);
  driftValue(s, c, phase, 7, { startOffset: 0.1, endMargin: 0.5 });

  c.on('quality-observed-attainment', () => {
    const t = c.cue('quality-observed-attainment').start;
    s.play(obsLit.to(1, { duration: clampDur(c, t, 0.45) }));
  });
  c.on('quality-wilson-bound', () => {
    const t = c.cue('quality-wilson-bound').start;
    s.play(wilsonProg.to(1, { duration: clampDur(c, t, 0.85) }));
  });
  c.on('quality-fails-floor', () => {
    const t = c.cue('quality-fails-floor').start;
    s.play(floorAlert.to(1, { duration: clampDur(c, t, 0.4) }));
  });
  c.on('quality-population', () => {
    const t = c.cue('quality-population').start;
    s.play(popNote.to(1, { duration: clampDur(c, t, 0.35) }));
  });
  c.on('quality-qualification', () => {
    const t = c.cue('quality-qualification').start;
    s.play(qualNote.to(1, { duration: clampDur(c, t, 0.35) }));
  });
}
