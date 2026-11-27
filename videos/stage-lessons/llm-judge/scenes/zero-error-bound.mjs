// Scene 16: zero-error-bound - How much error could a clean sample hide?
// Signature Glowing Probability-Bound Decay Curve: live p_upper(N) = 1 - 0.05^(1/N)
// computed directly from upperAfterZero(N)! Sweeps from N=50 (5.82% rose beacon) right
// along the hyperbolic cliff to N=299 (0.997% emerald crossing under the 1% horizon,
// N=298 just above), then demonstrates why 50 x 6 = 300 repeats stay stuck at N=50
// and shows the 200 x 2 x 3 = 1,200 call budget.
import { circle, group, line } from 'vizmatic/stage';
import {
  BUDGET,
  COSMOS,
  ROLE,
  aura,
  belowOnePercent,
  cinemaHeader,
  clampDur,
  fadeInHalf,
  fadeOutHalf,
  glowDot,
  glowTex,
  glowingTrail,
  guardedDynamic,
  txt,
  upperAfterZero,
} from '../parts.mjs';

export default function zeroErrorBound(s, c) {
  const pulse = s.value(0);
  const obs50On = s.value(0);
  const probOn = s.value(0);
  const formula50On = s.value(0);
  const up50Reveal = s.value(0);
  const curveSweep = s.value(0); // 0 -> 1 sweeping N from 50 to 299
  const res299On = s.value(0);
  const confNoteOn = s.value(0);
  const repStackOn = s.value(0);
  const stopWarnOn = s.value(0);
  const budgetOn = s.value(0);
  const scopeOn = s.value(0);

  const header = cinemaHeader(
    'SMALL-SAMPLE UNCERTAINTY',
    'How much error can',
    'a clean run hide?',
    { accent: ROLE.conflict, size: 50 },
  );

  const stageAura = aura(280, 30, 650, '#ff6b8b1c', '#6ee7b71a');

  const eq50 = glowTex(String.raw`(1 - p)^{50} = 0.05 \;\Rightarrow\; p_{\text{upper}} = 5.82\%`, {
    x: -445,
    y: -95,
    size: 32,
    color: ROLE.verdict,
    glow: 7,
  });

  const eq299 = glowTex(
    String.raw`N \ge \left\lceil\frac{\ln 0.05}{\ln 0.99}\right\rceil = 299 \;\;(0.997\%)`,
    { x: -455, y: 20, size: 32, color: ROLE.ok, glow: 8 },
  );

  // Plot geometry on right: N in [30..330], p in [0..10%]
  const px0 = 85;
  const px1 = 830;
  const py0 = 260; // p = 0%
  const py1 = -260; // p = 10%
  const mapX = (n) => px0 + ((n - 30) / 300) * (px1 - px0);
  const mapY = (pct) => py0 - (Math.min(10, pct) / 10) * (py0 - py1);

  // Precompute exact upperAfterZero(N) curve
  const fullCurve = [];
  for (let n = 35; n <= 325; n += 3) {
    fullCurve.push([mapX(n), mapY(upperAfterZero(n) * 100)]);
  }

  const view = guardedDynamic(
    () => 1,
    () => {
      const p = 0;
      const o50 = obs50On.value;
      const pr = probOn.value;
      const u50 = up50Reveal.value;
      const sw = curveSweep.value;
      const r299 = res299On.value;
      const cn = confNoteOn.value;
      const rp = repStackOn.value;
      const st = stopWarnOn.value;
      const bg = budgetOn.value;
      const sc = scopeOn.value;
      const nodes = [];

      // Plot axes & 1% target horizon
      const y1Pct = mapY(1.0);
      const x50 = mapX(50);
      const y50 = mapY(BUDGET.upper50 * 100);
      const x299 = mapX(belowOnePercent);
      const y299 = mapY(BUDGET.upper299 * 100);

      nodes.push(
        txt(
          'ONE-SIDED 95% UPPER BOUND  (0 FALSE ACCEPTS)',
          (px0 + px1) * 0.5,
          py1 - 54,
          26,
          COSMOS.muted,
          'mono',
          'center',
        ),
        line([px0, py0], [px1, py0], { stroke: '#344770', width: 2.4 }),
        line([px0, py0], [px0, py1], { stroke: '#344770', width: 2.4 }),
        line([px0, y1Pct], [px1, y1Pct], { stroke: ROLE.ok, width: 2.4, dash: [8, 8] }).opacity(
          0.85,
        ),
        txt('1%', px0 - 18, y1Pct, 26, ROLE.ok, 'mono', 'right'),
        txt('5%', px0 - 18, mapY(5), 26, COSMOS.dim, 'mono', 'right'),
        txt('0%', px0 - 18, py0, 26, COSMOS.dim, 'mono', 'right'),
        txt('N = 50', x50, py0 + 38, 26, ROLE.conflict, 'mono', 'center'),
        txt('N = 299', x299, py0 + 38, 26, ROLE.ok, 'mono', 'center'),
        txt(
          'INDEPENDENT KNOWN-BAD CASES (N)',
          (px0 + px1) * 0.5,
          py0 + 88,
          26,
          COSMOS.muted,
          'mono',
          'center',
        ),
      );

      // Glowing hyperbolic curve (always visible softly, intensifies as sweep grows)
      nodes.push(
        glowingTrail(fullCurve, {
          color: ROLE.stepwise,
          width: 4.0,
          opacity: 0.45 + sw * 0.5,
        }),
      );

      // N = 50 beacon (5.82%)
      nodes.push(
        line([x50, py0], [x50, y50], { stroke: ROLE.conflict, width: 2.2, dash: [5, 5] }).opacity(
          0.5 + u50 * 0.5,
        ),
        glowDot(x50, y50, { radius: 8.5, color: ROLE.conflict, glow: 14 }),
      );
      if (u50 > 0.05) {
        nodes.push(
          txt('5.82%', x50 + 18, y50 - 24, 30, ROLE.conflict, 'mono', 'left')
            .glow(8, ROLE.conflict)
            .opacity(u50),
        );
      }

      // Live sweeping tracer dot along curve from N=50 -> N=299
      if (sw > 0.02) {
        const curN = 50 + sw * (belowOnePercent - 50);
        const curP = upperAfterZero(curN) * 100;
        nodes.push(
          glowDot(mapX(curN), mapY(curP), {
            radius: 7.5,
            color: curN >= belowOnePercent - 0.5 ? ROLE.ok : ROLE.verdict,
            glow: 14,
          }),
        );
      }

      // N = 299 crossing point (0.997%)
      if (r299 > 0.05) {
        nodes.push(
          line([x299, py0], [x299, y299], { stroke: ROLE.ok, width: 2.6, dash: [5, 5] }).opacity(
            r299,
          ),
          glowDot(x299, y299, { radius: 9, color: ROLE.ok, glow: 16, opacity: r299 }),
          txt('0.997%', x299 - 14, y299 - 46, 30, ROLE.ok, 'mono', 'center')
            .glow(8, ROLE.ok)
            .opacity(r299),
        );
      }

      // 6x vertical repeat stack stuck at N = 50 when `repeat-distinction` fires!
      if (rp > 0.05) {
        for (let k = 0; k < 6; k++) {
          const ry = y50 - 22 - k * 24;
          nodes.push(
            circle(8, { fill: ROLE.conflict, stroke: '#ffffff', width: 1.2 })
              .at(x50, ry)
              .glow(8, ROLE.conflict)
              .opacity(rp * 0.9),
          );
        }
        nodes.push(
          txt(
            '50 × 6 = 300 calls (STILL N=50!)',
            x50 + 26,
            y50 - 110,
            26,
            ROLE.conflict,
            'mono',
            'left',
          )
            .glow(6, ROLE.conflict)
            .opacity(rp),
        );
      }

      // Left diagnostic column (zero boxes)
      nodes.push(
        txt(
          o50 > 0.4 ? '50 KNOWN-BAD CASES · 0 FALSE ACCEPTS' : '50 PREPLANNED KNOWN-BAD CASES',
          -840,
          -185,
          26,
          o50 > 0.4 ? ROLE.ok : ROLE.stepwise,
          'mono',
          'left',
        ),
      );
      if (pr > 0.05 && formula50On.value < 0.05) {
        nodes.push(
          txt('One rejection prob: (1 - p)', -840, -135, 28, ROLE.stepwise, 'mono', 'left').opacity(
            pr,
          ),
        );
      }
      const confAlpha = cn * fadeOutHalf(rp);
      if (confAlpha > 0.05) {
        nodes.push(
          txt('Rule of three: ≈ 3 / N', -840, 118, 28, ROLE.verdict, 'mono', 'left').opacity(
            confAlpha,
          ),
          txt(
            '95% = coverage over repeated samples',
            -840,
            168,
            26,
            COSMOS.muted,
            'sans',
            'left',
          ).opacity(confAlpha),
        );
      }
      const repAlpha = fadeInHalf(rp);
      if (repAlpha > 0.05) {
        nodes.push(
          txt('REPEATS MEASURE VARIANCE, NOT N', -840, 118, 28, ROLE.conflict, 'mono', 'left')
            .glow(6, ROLE.conflict)
            .opacity(repAlpha),
        );
      }
      if (st > 0.05) {
        nodes.push(
          txt(
            'Lock N before testing · No stopping on streaks',
            -840,
            174,
            26,
            ROLE.conflict,
            'sans',
            'left',
          ).opacity(st),
        );
      }
      if (bg > 0.05) {
        nodes.push(
          txt(
            `BUDGET: ${BUDGET.cases} cases × ${BUDGET.orders} orders × ${BUDGET.repeats} repeats = ${BUDGET.totalCalls.toLocaleString()} calls`,
            -840,
            246,
            26,
            ROLE.verdict,
            'mono',
            'left',
          )
            .glow(6, ROLE.verdict)
            .opacity(bg),
        );
      }
      if (sc > 0.05) {
        nodes.push(
          txt(
            'Bound applies to known-bad rate; check live base rate too',
            -840,
            314,
            26,
            ROLE.stepwise,
            'sans',
            'left',
          ).opacity(sc),
        );
      }

      return group(...nodes);
    },
  );

  s.add(stageAura, header, view);

  c.on('zero-inputs', () => {
    s.play(pulse.to(0.3, { duration: clampDur(c, c.cue('zero-inputs').start, 0.25) }));
  });
  c.on('zero-observed', () => {
    s.play(obs50On.to(1, { duration: clampDur(c, c.cue('zero-observed').start, 0.35) }));
  });
  c.on('zero-probability', () => {
    s.play(probOn.to(1, { duration: clampDur(c, c.cue('zero-probability').start, 0.35) }));
  });
  c.show('upper-formula', eq50);
  c.on('upper-formula', () => {
    s.play(formula50On.to(1, { duration: 0.08 }));
  });
  c.after('upper-fifty', () => {
    s.play(up50Reveal.to(1, { duration: clampDur(c, c.cue('upper-fifty').end, 0.35) }));
  });
  c.on('required-count', () => {
    s.play(curveSweep.to(1, { duration: clampDur(c, c.cue('required-count').start, 1.4) }));
  });
  c.show('required-result', eq299, { after: true });
  c.after('required-result', () => {
    s.play(res299On.to(1, { duration: clampDur(c, c.cue('required-result').end, 0.35) }));
  });
  c.after('required-limit', () => {
    s.play(res299On.to(1, { duration: 0.12 }));
  });
  c.on('confidence-meaning', () => {
    s.play(confNoteOn.to(1, { duration: clampDur(c, c.cue('confidence-meaning').start, 0.35) }));
  });
  c.on('repeat-distinction', () => {
    s.play(repStackOn.to(1, { duration: clampDur(c, c.cue('repeat-distinction').start, 0.4) }));
  });
  c.on('stopping-rule', () => {
    s.play(stopWarnOn.to(1, { duration: clampDur(c, c.cue('stopping-rule').start, 0.35) }));
  });
  c.on('larger-plan', () => {
    s.play(budgetOn.to(0.5, { duration: clampDur(c, c.cue('larger-plan').start, 0.3) }));
  });
  c.after('call-budget', () => {
    s.play(budgetOn.to(1, { duration: clampDur(c, c.cue('call-budget').end, 0.35) }));
  });
  c.on('bound-scope', () => {
    s.play(scopeOn.to(1, { duration: clampDur(c, c.cue('bound-scope').start, 0.35) }));
  });
}
