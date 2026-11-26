// Scene 21: quality-evidence - What can 1,200 reviews tell us?
// Mode 0 (beats 0-1): Quality gate meters (1,994/2,000 = 99.7% cited, 1,200 >= 1,000 reviewed, 0 unsafe -> 1 unsafe = HOLD).
// Mode 1 (beat 2): Luminous decaying Rule-of-Three confidence curve `1 - 0.05^(1/n)` from n=100 to n=1,200
// with traveling gold photon settling at 0.249% (3/1,200 ≈ 0.25% -> ~8 expected in 3,200 hits).
import { group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  cinemaHeader,
  clampDur,
  driftValue,
  fadeInHalf,
  fadeOutHalf,
  fmtInt,
  glowBar,
  glowDot,
  glowTex,
  glowingTrail,
  guardedDynamic,
  qualityRate,
  reviewedAnswers,
  reviewedHits,
  txt,
} from '../parts.mjs';

export default function qualityEvidence(s, c) {
  const pulseT = s.value(0);
  const mode = s.value(0); // 0 = quality gate meters (beats 0-1), 1 = Rule of Three curve (beat 2)
  const p0 = s.value(0);
  const unsafeFlip = s.value(0); // `te-quality-evidence-1` flips 0 -> 1 unsafe
  const curveProg = s.value(0); // `te-quality-evidence-2` sweeps n=100 -> 1,200

  const header = cinemaHeader(
    'STATISTICAL QUALITY GATE',
    'What can 1,200',
    'zero-defect reviews prove?',
    {
      x: -860,
      y: -415,
      accent: ROLE.ok,
      size: 52,
    },
  );

  const sceneAura = aura(160, 40, 720, '#6ee7b722', '#5ce1e61a');

  // Exact confidence formula shown in mode 1
  const formulaEq = glowTex(String.raw`p_{\max}(n) = 1 - 0.05^{1/n} \approx \frac{3}{n}`, {
    x: 340,
    y: -175,
    size: 40,
    color: ROLE.cached,
    glow: 8,
  });

  // Mode 0: Quality Thresholds & Single-Unsafe Veto
  const mode0 = guardedDynamic(
    () => fadeOutHalf(mode.value),
    (a) => {
      const u = p0.value;
      const unsafe = unsafeFlip.value > 0.5 ? 1 : 0;
      const nodes = [
        txt(
          'RELEASE QUALITY REQUIREMENTS  (AGE <= 1 HOUR)',
          -860,
          -205,
          26,
          COSMOS.muted,
          'mono',
          'left',
        ).opacity(a),

        // Row 1: Cited answers
        txt('CITED ANSWERS PASSED', -860, -110, 28, ROLE.ok, 'mono', 'left').opacity(a),
        txt(
          `1,994 / ${fmtInt(reviewedAnswers)}  (${(100 * qualityRate).toFixed(1)}% >= 99.5%)`,
          840,
          -110,
          30,
          ROLE.ok,
          'mono',
          'right',
        ).opacity(a),
        glowBar(-860, -56, 1700, 26, qualityRate * (0.4 + 0.6 * u), {
          fill: ROLE.ok,
          glow: 9,
          opacity: a,
        }),

        // Row 2: Reviewed cache hits
        txt('REVIEWED STORED-ANSWER HITS', -860, 25, 28, ROLE.input, 'mono', 'left').opacity(a),
        txt(
          `${fmtInt(reviewedHits)} reviewed  (>= 1,000 min)`,
          840,
          25,
          30,
          ROLE.input,
          'mono',
          'right',
        ).opacity(a),
        glowBar(-860, 79, 1700, 26, (reviewedHits / 1500) * (0.4 + 0.6 * u), {
          fill: ROLE.input,
          glow: 8,
          opacity: a,
        }),

        // Row 3: Observed unsafe hits (flips 0 -> 1 on cue 1!)
        txt(
          'OBSERVED UNSAFE HITS',
          -860,
          160,
          28,
          unsafe ? ROLE.fail : ROLE.ok,
          'mono',
          'left',
        ).opacity(a),
        txt(
          `${unsafe} / ${fmtInt(reviewedHits)}  (MUST BE 0)`,
          840,
          160,
          32,
          unsafe ? ROLE.fail : ROLE.ok,
          'mono',
          'right',
        )
          .glow(8, unsafe ? ROLE.fail : ROLE.ok)
          .opacity(a),
        glowBar(-860, 214, 1700, 26, unsafe ? 0.14 : 0, {
          fill: ROLE.fail,
          border: unsafe ? ROLE.fail : ROLE.ok,
          glow: 10,
          opacity: a,
        }),

        // Bottom verdict banner (floating)
        rect(1120, 74, {
          fill: unsafe ? '#351324' : '#0e2820',
          stroke: unsafe ? ROLE.fail : ROLE.ok,
          width: 2.6,
          radius: 12,
        })
          .at(0, 345)
          .glow(10, unsafe ? ROLE.fail : ROLE.ok)
          .opacity(a),
        txt(
          unsafe
            ? '1 UNSAFE HIT  ->  HOLD RELEASE DESPITE 99.7% MEAN'
            : 'CURRENT RELEASE + SCHEMA + COMPLETE EVIDENCE  ->  PASS',
          0,
          345,
          30,
          unsafe ? ROLE.fail : ROLE.ok,
          'mono',
        ).opacity(a),
      ];
      return group(...nodes);
    },
  );

  // Mode 1: Exact 95% One-Sided Upper Failure Rate Curve (n = 100 -> 1,200)
  const mode1 = guardedDynamic(
    () => fadeInHalf(mode.value),
    (a) => {
      const cp = curveProg.value;
      const n = Math.round(100 + 1100 * cp);
      const upper = 1 - Math.pow(0.05, 1 / n);

      const x0 = -760;
      const y0 = 245;
      const w = 1520;
      const h = 390;

      // Sample smooth hyperbola curve
      const pts = [];
      for (let i = 0; i <= 60; i++) {
        const sz = 100 + (i / 60) * 1100;
        const val = 1 - Math.pow(0.05, 1 / sz);
        pts.push([x0 + ((sz - 100) / 1100) * w, y0 - (val / 0.032) * h]);
      }

      const cx = x0 + ((n - 100) / 1100) * w;
      const cy = y0 - (upper / 0.032) * h;

      const nodes = [
        // Axes
        line([x0, y0], [x0 + w, y0], { stroke: '#3a4d78', width: 2.4 }).opacity(a),
        line([x0, y0], [x0, y0 - h], { stroke: '#3a4d78', width: 2.4 }).opacity(a),

        // Y-axis labels
        txt('3.0%', x0 - 24, y0 - (0.03 / 0.032) * h, 26, COSMOS.muted, 'mono', 'right').opacity(a),
        txt('1.5%', x0 - 24, y0 - (0.015 / 0.032) * h, 26, COSMOS.muted, 'mono', 'right').opacity(
          a,
        ),
        txt('0.25%', x0 - 24, y0 - (0.0025 / 0.032) * h, 26, ROLE.cached, 'mono', 'right').opacity(
          a,
        ),

        // X-axis labels
        txt('n = 100', x0, y0 + 44, 26, COSMOS.muted, 'mono', 'left').opacity(a),
        txt('n = 600', x0 + (500 / 1100) * w, y0 + 44, 26, COSMOS.muted, 'mono').opacity(a),
        txt('n = 1,200 independent reviews', x0 + w, y0 + 44, 26, ROLE.ok, 'mono', 'right').opacity(
          a,
        ),

        // Glowing curve + traveling gold photon
        glowingTrail(pts, { color: ROLE.input, width: 4.6, glow: 11, opacity: a }),
        glowDot(cx, cy, { radius: 9.5, color: ROLE.cached, glow: 16, opacity: a }),

        // Live readout
        txt(
          `n = ${fmtInt(n)}  ->  95% upper bound: ${(upper * 100).toFixed(3)}%`,
          -760,
          -195,
          34,
          ROLE.cached,
          'mono',
          'left',
        )
          .glow(7, ROLE.cached)
          .opacity(a),
        txt(
          cp > 0.85
            ? '3 / 1,200 ≈ 0.25%  ->  ~8 expected unsafe in 3,200 daily hits'
            : 'Upper failure limit falls as n grows',
          0,
          355,
          32,
          cp > 0.85 ? ROLE.cached : COSMOS.ink,
          'sans',
        )
          .glow(cp > 0.85 ? 6 : 0, ROLE.cached)
          .opacity(a),
        txt(
          'Assumes independent, representative sampling',
          0,
          415,
          26,
          COSMOS.muted,
          'sans',
        ).opacity(a),
      ];
      return group(...nodes);
    },
  );

  s.add(sceneAura, header, mode0, mode1);
  driftValue(s, c, pulseT, 4.0, { startOffset: 0.1, endMargin: 0.5 });

  c.on('te-quality-evidence-0', () => {
    const t = c.cue('te-quality-evidence-0').start;
    s.play(p0.to(1, { duration: clampDur(c, t, 0.7) }));
  });
  c.on('te-quality-evidence-1', () => {
    const t = c.cue('te-quality-evidence-1').start;
    s.play(unsafeFlip.to(1, { duration: clampDur(c, t, 0.4) }));
  });
  c.onBeat(2, () => {
    const t = c.beats[2].start;
    s.play(mode.to(1, { duration: clampDur(c, t, 0.35) }));
  });
  c.show('te-quality-evidence-2', formulaEq);
  c.on('te-quality-evidence-2', () => {
    const t = c.cue('te-quality-evidence-2').start;
    s.play(curveProg.to(1, { duration: clampDur(c, t, 1.2) }));
  });
}
