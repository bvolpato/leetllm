// Scene 13: prevalence-trap - Count known-bad misses beside headline agreement
// Live 10x10 = 100-dot prevalence grid (90 emerald acceptable, 10 rose known-bad) swept
// by an always-approve judge beam: 90% raw agreement looks high while 10/10 known-bad
// bleed through -> marginal product p_e = 0.90 drives kappa = 0 -> flipping the last 10
// reviewer dots to acceptable drives 1 - p_e -> 0 (kappa = 0/0 undefined).
import { circle, group, line } from 'vizmatic/stage';
import {
  COSMOS,
  PREVALENCE,
  ROLE,
  aura,
  cinemaHeader,
  clampDur,
  driftValue,
  glowDot,
  glowMeter,
  glowTex,
  guardedDynamic,
  txt,
} from '../parts.mjs';

export default function prevalenceTrap(s, c) {
  const pulse = s.value(0);
  const missOn = s.value(0);
  const denomOn = s.value(0);
  const margOn = s.value(0);
  const kZeroOn = s.value(0);
  const allAccept = s.value(0);
  const kUndefOn = s.value(0);

  const header = cinemaHeader(
    'PREVALENCE PARADOX',
    'Count known-bad misses',
    'beside headline agreement',
    { accent: ROLE.conflict, size: 48 },
  );

  const stageAura = aura(300, 30, 620, '#ff6b8b1c', '#ffd16618');

  const kZeroEq = glowTex(String.raw`\kappa = \frac{0.90 - 0.90}{1 - 0.90} = 0`, {
    x: -515,
    y: 235,
    size: 38,
    color: ROLE.verdict,
    glow: 7,
  });

  const kUndefEq = glowTex(
    String.raw`\kappa = \frac{1 - 1}{1 - 1} = \frac{0}{0}\;\text{(undefined)}`,
    {
      x: -495,
      y: 235,
      size: 36,
      color: ROLE.conflict,
      glow: 8,
    },
  );

  const view = guardedDynamic(
    () => 1,
    () => {
      const p = pulse.value;
      const ms = missOn.value;
      const dn = denomOn.value;
      const mg = margOn.value;
      const aa = allAccept.value;
      const nodes = [];

      // Right: 10x10 prevalence dot field (x in [140..790], y in [-300..350])
      const gx0 = 155;
      const gy0 = -285;
      const step = 68;

      nodes.push(
        txt(
          aa > 0.5 ? '100 ANSWERS: 100 ACCEPTABLE' : '100 ANSWERS: 90 ACCEPTABLE · 10 KNOWN-BAD',
          gx0 + 4.5 * step,
          gy0 - 65,
          26,
          aa > 0.5 ? ROLE.verdict : COSMOS.muted,
          'mono',
          'center',
        ),
      );

      // Sweeping always-approve beam across grid
      const sweepY = gy0 + ((p * 0.55) % 1) * (9 * step);
      nodes.push(
        line([gx0 - 30, sweepY], [gx0 + 9 * step + 30, sweepY], {
          stroke: ROLE.stepwise,
          width: 3,
          dash: [8, 8],
        })
          .glow(8, ROLE.stepwise)
          .opacity(0.65),
      );

      for (let i = 0; i < PREVALENCE.total; i++) {
        const r = Math.floor(i / 10);
        const col = i % 10;
        const x = gx0 + col * step;
        const y = gy0 + r * step;
        const isBad = i >= PREVALENCE.acceptable && aa < 0.5;
        if (isBad) {
          nodes.push(
            glowDot(x, y, {
              radius: ms > 0.3 ? 13 : 10,
              color: ROLE.conflict,
              glow: ms > 0.3 ? 14 : 6,
            }),
          );
        } else {
          nodes.push(
            circle(9.5, { fill: ROLE.ok, stroke: '#ffffff', width: 1 }).at(x, y).opacity(0.84),
          );
        }
      }

      nodes.push(
        txt(
          'ALWAYS-APPROVE JUDGE: APPROVES 100 / 100',
          gx0 + 4.5 * step,
          gy0 + 9.8 * step,
          26,
          ROLE.stepwise,
          'mono',
          'center',
        ),
      );

      // Left readouts (zero boxes)
      nodes.push(
        txt(
          aa > 0.5 ? 'RAW AGREEMENT: 100 / 100 = 100%' : 'RAW AGREEMENT: 90 / 100 = 90%',
          -840,
          -175,
          30,
          ROLE.ok,
          'mono',
          'left',
        ),
        glowMeter(-840, -125, 620, 26, aa > 0.5 ? 1 : PREVALENCE.observed, { fill: ROLE.ok }),
      );

      if (ms > 0.05) {
        nodes.push(
          txt(
            aa > 0.5
              ? 'BOTH RATERS ACCEPT 100 / 100'
              : 'KNOWN-BAD CAUGHT: 0 / 10  (100% FALSE ACCEPT)',
            -840,
            -45,
            28,
            ROLE.conflict,
            'mono',
            'left',
          )
            .glow(7, ROLE.conflict)
            .opacity(ms),
        );
      }

      if (dn > 0.05) {
        nodes.push(
          txt(
            'False accept rate -> denominator = known-bad',
            -840,
            18,
            26,
            ROLE.verdict,
            'sans',
            'left',
          ).opacity(dn),
          txt(
            'False reject rate -> denominator = known-good',
            -840,
            62,
            26,
            COSMOS.muted,
            'sans',
            'left',
          ).opacity(dn),
        );
      }

      if (mg > 0.05) {
        nodes.push(
          txt(
            aa > 0.5
              ? 'EXPECTED AGREEMENT p_e = 1.0 × 1.0 = 1.00'
              : 'EXPECTED AGREEMENT p_e = 1.0 × 0.90 = 90%',
            -840,
            135,
            28,
            ROLE.stepwise,
            'mono',
            'left',
          ).opacity(mg),
        );
      }

      nodes.push(
        txt(
          'Report label counts, error rates & coverage beside κ',
          -840,
          365,
          26,
          COSMOS.muted,
          'mono',
          'left',
        ),
      );

      return group(...nodes);
    },
  );

  s.add(stageAura, header, view);
  driftValue(s, c, pulse, 4.0, { startOffset: 0.1, endMargin: 0.5 });

  c.on('majority-inputs', () => {
    s.play(pulse.to(0.4, { duration: clampDur(c, c.cue('majority-inputs').start, 0.25) }));
  });
  c.on('majority-failure', () => {
    s.play(missOn.to(1, { duration: clampDur(c, c.cue('majority-failure').start, 0.35) }));
  });
  c.on('error-denominators', () => {
    s.play(denomOn.to(1, { duration: clampDur(c, c.cue('error-denominators').start, 0.35) }));
  });
  c.on('marginal-baseline', () => {
    s.play(margOn.to(1, { duration: clampDur(c, c.cue('marginal-baseline').start, 0.35) }));
  });
  c.show('kappa-zero', kZeroEq, { after: true });
  c.after('kappa-zero', () => {
    s.play(kZeroOn.to(1, { duration: clampDur(c, c.cue('kappa-zero').end, 0.3) }));
  });
  c.on('undefined-kappa', () => {
    s.play(allAccept.to(1, { duration: clampDur(c, c.cue('undefined-kappa').start, 0.4) }));
  });
  c.swap('undefined-kappa', kZeroEq, kUndefEq);
  c.on('kappa-undefined', () => {
    s.play(kUndefOn.to(1, { duration: clampDur(c, c.cue('kappa-undefined').start, 0.25) }));
  });
}
