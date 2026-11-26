// Scene 22: uncertainty-gate - How much can zero tell us?
// Signature continuous Wilson Upper-Bound Decay Curve u(0, n) = z^2 / (n + z^2) computed
// directly via `wilsonBounds(0, n)[1]`, plotted against a fixed 2% policy limit horizon.
// Shows n = 250 -> 1.51% (PASS), holds prediction on n = 20 during Beat 2, then reveals
// n = 20 -> 16.11% (FAIL) far above the 2% policy line, plus n = 0 fallback & i.i.d. note.
import { group, line } from 'vizmatic/stage';
import {
  COSMOS,
  POLICY_LIMIT,
  ROLE,
  ZERO_BOUND_20,
  ZERO_BOUND_250,
  aura,
  cinemaHeader,
  clampDur,
  driftValue,
  energyRail,
  fadeInHalf,
  fadeOutHalf,
  glowDot,
  glowTex,
  glowingTrail,
  guardedDynamic,
  txt,
  wilsonBounds,
} from '../parts.mjs';

export default function uncertaintyGate(s, c) {
  const pulse = s.value(0);
  const largeReveal = s.value(0);
  const input20On = s.value(0);
  const guessHi = s.value(0);
  const smallReveal = s.value(0);
  const emptyNote = s.value(0);
  const assumeNote = s.value(0);

  const header = cinemaHeader('ZERO-FAILURE UNCERTAINTY GATE', 'How much can', 'zero tell us?', {
    accent: ROLE.host,
    size: 50,
  });

  const stageAura = aura(280, 30, 640, '#5ce1e61c', '#ff6b8b1a');

  const wilsonEq = glowTex(String.raw`u(0, n) = \frac{1.96^2}{n + 1.96^2}`, {
    x: -565,
    y: -155,
    size: 38,
    color: ROLE.focus,
    glow: 7,
  });

  // Plot geometry on right: n in [10..270], upper bound in [0..20%]
  const px0 = 95;
  const px1 = 835;
  const py0 = 245; // 0%
  const py1 = -255; // 20%
  const mapX = (n) => px0 + ((n - 10) / 260) * (px1 - px0);
  const mapY = (pct) => py0 - (Math.min(20, pct) / 20) * (py0 - py1);

  const curvePts = [];
  for (let n = 16; n <= 265; n += 3) {
    curvePts.push([mapX(n), mapY(wilsonBounds(0, n)[1] * 100)]);
  }

  const view = guardedDynamic(
    () => 1,
    () => {
      const p = pulse.value;
      const lr = largeReveal.value;
      const i20 = input20On.value;
      const gh = guessHi.value;
      const sr = smallReveal.value;
      const en = emptyNote.value;
      const an = assumeNote.value;
      const nodes = [];

      const yLimit = mapY(POLICY_LIMIT * 100);
      const x250 = mapX(250);
      const y250 = mapY(ZERO_BOUND_250 * 100);
      const x20 = mapX(20);
      const y20 = mapY(ZERO_BOUND_20 * 100);

      // Right Plot: Fixed Percentage Ruler + 2% Policy Horizon + Continuous Wilson Curve
      nodes.push(
        txt(
          'TWO-SIDED 95% WILSON UPPER BOUND  (k = 0 UNSAFE TRACES)',
          (px0 + px1) * 0.5,
          py1 - 52,
          26,
          COSMOS.muted,
          'mono',
          'center',
        ),
        line([px0, py0], [px1, py0], { stroke: '#344770', width: 2.5 }),
        line([px0, py0], [px0, py1], { stroke: '#344770', width: 2.5 }),
        line([px0, yLimit], [px1, yLimit], { stroke: ROLE.attack, width: 2.8, dash: [8, 8] }).glow(
          6,
          ROLE.attack,
        ),
        txt('2% LIMIT', px0 - 16, yLimit, 26, ROLE.attack, 'mono', 'right'),
        txt('0%', px0 - 16, py0 + 6, 26, COSMOS.dim, 'mono', 'right'),
        txt('10%', px0 - 16, mapY(10), 26, COSMOS.dim, 'mono', 'right'),
        txt('20%', px0 - 16, py1, 26, COSMOS.dim, 'mono', 'right'),
        txt(
          'n = 20',
          x20 + 20,
          py0 + 38,
          26,
          i20 > 0.3 ? ROLE.source : COSMOS.dim,
          'mono',
          'center',
        ),
        txt('n = 250', x250 - 16, py0 + 38, 26, ROLE.ok, 'mono', 'center'),
        txt(
          'ATTACK SAMPLE SIZE (n)',
          (px0 + px1) * 0.5,
          py0 + 88,
          26,
          COSMOS.muted,
          'mono',
          'center',
        ),
        glowingTrail(curvePts, {
          color: ROLE.host,
          width: 4.0,
          opacity: 0.45 + Math.max(lr, sr) * 0.5,
        }),
      );

      // n = 250 point (1.51% PASS inside 2% limit, cleanly separated from 2% LIMIT on left!)
      nodes.push(
        line([x250, py0], [x250, y250], { stroke: ROLE.ok, width: 2.4, dash: [5, 5] }).opacity(
          0.5 + lr * 0.5,
        ),
        glowDot(x250, y250, { radius: 8.5, color: ROLE.ok, glow: 14 }),
      );
      if (lr > 0.05) {
        nodes.push(
          txt(
            `${(ZERO_BOUND_250 * 100).toFixed(2)}% (PASS)`,
            x250 - 16,
            y250 - 52,
            28,
            ROLE.ok,
            'mono',
            'right',
          )
            .glow(7, ROLE.ok)
            .opacity(lr),
        );
      }

      // n = 20 point: ONLY plotted on the curve AFTER `bound-small` reveal!
      if (sr > 0.05) {
        nodes.push(
          line([x20, py0], [x20, y20], { stroke: ROLE.source, width: 2.6, dash: [5, 5] }).opacity(
            sr,
          ),
          glowDot(x20, y20, { radius: 9.5, color: ROLE.source, glow: 16, opacity: sr }),
          txt(
            `${(ZERO_BOUND_20 * 100).toFixed(2)}% (FAIL > 2%)`,
            x20 + 22,
            y20 - 10,
            30,
            ROLE.attack,
            'mono',
            'left',
          )
            .glow(8, ROLE.attack)
            .opacity(sr),
        );
      }

      // Left diagnostic column
      nodes.push(
        energyRail(-855, -80, 42, ROLE.ok, { width: 5 }),
        txt('SAMPLE A: 0 / 250 ATTACK TRACES', -825, -58, 26, ROLE.ok, 'mono', 'left'),
        txt(
          lr > 0.3
            ? `upper = ${(ZERO_BOUND_250 * 100).toFixed(2)}%  <=  2.00%  (CLEARS)`
            : 'Observed rate = 0% · Check Wilson upper bound',
          -825,
          -4,
          26,
          lr > 0.3 ? ROLE.ok : COSMOS.muted,
          'mono',
          'left',
        ),
      );

      // Sample B (n = 20) with strict prediction withholding!
      const bAlpha = 0.35 + i20 * 0.65;
      const preSmall = fadeOutHalf(sr);
      const postSmall = fadeInHalf(sr);
      nodes.push(
        energyRail(-855, 72, 200, postSmall > 0.3 ? ROLE.attack : ROLE.source, {
          width: 5,
          opacity: bAlpha,
        }),
        txt('SAMPLE B: 0 / 20 ATTACK TRACES', -825, 96, 26, ROLE.source, 'mono', 'left').opacity(
          bAlpha,
        ),
      );
      if (preSmall > 0.02) {
        nodes.push(
          txt(
            gh > 0.3
              ? 'Does n = 20 clear the same 2% limit?'
              : 'Only n changes in the denominator...',
            -825,
            152,
            28,
            ROLE.question,
            'serif',
            'left',
          )
            .glow(gh > 0.3 ? 8 : 3, ROLE.question)
            .opacity(bAlpha * preSmall),
        );
      }
      if (postSmall > 0.02) {
        nodes.push(
          txt(
            `upper = ${(ZERO_BOUND_20 * 100).toFixed(2)}%  >>  2.00%  (MISSES!)`,
            -825,
            152,
            28,
            ROLE.attack,
            'mono',
            'left',
          )
            .glow(8, ROLE.attack)
            .opacity(postSmall),
        );
      }

      // Bottom-left edge cases & assumptions (non-overlapping!)
      const preAssume = fadeOutHalf(an);
      const postAssume = fadeInHalf(an);
      if (en > 0.05 && preAssume > 0.02) {
        nodes.push(
          txt(
            'n = 0 -> conservative fallback 1.0',
            -825,
            258,
            26,
            ROLE.focus,
            'mono',
            'left',
          ).opacity(en * preAssume),
          txt(
            'Require integer 0 <= k <= n, no booleans, finite z > 0',
            -825,
            310,
            26,
            COSMOS.muted,
            'sans',
            'left',
          ).opacity(en * preAssume),
        );
      }
      if (postAssume > 0.02) {
        nodes.push(
          txt(
            'Assumes independent trials & fixed rate (variants correlate)',
            -825,
            258,
            26,
            ROLE.source,
            'sans',
            'left',
          ).opacity(postAssume),
          txt(
            'Log model+tools · Keep held-out attack families & benign tasks',
            -825,
            310,
            26,
            ROLE.host,
            'mono',
            'left',
          ).opacity(postAssume),
        );
      }

      nodes.push(
        glowDot(px0 + ((p * 0.25) % 1) * (px1 - px0), py0, {
          radius: 4.5,
          color: ROLE.host,
          glow: 8,
          opacity: 0.7,
        }),
      );

      return group(...nodes);
    },
  );

  s.add(stageAura, header, view);
  driftValue(s, c, pulse, 5.4, { startOffset: 0.1, endMargin: 0.5 });

  c.on('bound-start', () => {
    s.play(pulse.to(0.4, { duration: clampDur(c, c.cue('bound-start').start, 0.25) }));
  });
  c.show('bound-formula', wilsonEq);
  c.on('bound-large', () => {
    s.play(largeReveal.to(1, { duration: clampDur(c, c.cue('bound-large').start, 0.35) }));
  });
  c.on('bound-input', () => {
    s.play(input20On.to(1, { duration: clampDur(c, c.cue('bound-input').start, 0.35) }));
  });
  c.after('bound-guess', () => {
    s.play(guessHi.to(1, { duration: clampDur(c, c.cue('bound-guess').end, 0.25) }));
  });
  c.on('bound-small', () => {
    s.play(smallReveal.to(1, { duration: clampDur(c, c.cue('bound-small').start, 0.35) }));
  });
  c.on('bound-empty', () => {
    s.play(emptyNote.to(1, { duration: clampDur(c, c.cue('bound-empty').start, 0.35) }));
  });
  c.on('bound-assumptions', () => {
    s.play(assumeNote.to(1, { duration: clampDur(c, c.cue('bound-assumptions').start, 0.4) }));
  });
}
