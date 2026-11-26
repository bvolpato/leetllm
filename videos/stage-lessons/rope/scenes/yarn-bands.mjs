// Scene 25: yarn-bands: SIGNATURE SHOWPIECE: 4 clocks + turn counts across 4096, YaRN [1,32] ramp blend on pair 2 (0.0038 rad/pos).
import { dynamic, group, line, rect } from 'vizmatic/stage';
import {
  CLOCK_FREQUENCIES,
  COSMOS,
  ROLE,
  cinemaAura,
  cinemaStars,
  clockDial,
  frequencySchedules,
  glowTex,
  heroTitle,
  playAfter,
  playOn,
  txt,
} from '../parts.mjs';

const SCHED = frequencySchedules(4, 8, 10000, 4096);

export default function yarnBands(s, c) {
  const revealBlend = s.value(0);
  const focusBand2 = s.value(0);
  const showIdxRamp = s.value(0);

  const stars = cinemaStars(135, 25, ROLE.score);
  const stageAura = cinemaAura(0, -10, 720, '#6ee7b722', '#ffd16614');

  const title = heroTitle(['Which frequency', 'needs a blend?'], {
    x: -860,
    y: -435,
    size: 56,
    lineHeight: 64,
    accent: ROLE.score,
    eyebrow: 'YaRN ROTATION-BAND BLENDING (L₀ = 4,096, s = 4)',
  });

  const eq = glowTex(
    String.raw`r_i = \frac{L_0\,\theta_i}{2\pi},\quad \gamma_i = \mathrm{clip}\!\left(\frac{r_i - 1}{31}\right)`,
    {
      x: 345,
      y: -380,
      size: 34,
      color: COSMOS.gold,
      glow: 5,
    },
  );

  const live = dynamic(() => {
    const blendRev = revealBlend.value;
    const foc = focusBand2.value;
    const idxRamp = showIdxRamp.value;

    const dialXs = [-630, -210, 210, 630];
    const dialY = -125;
    const nodes = [];

    CLOCK_FREQUENCIES.forEach((origF, i) => {
      const turns = SCHED.turns[i];
      const gamma = SCHED.gamma[i];
      const yarnF = SCHED.yarn[i];
      const effF = origF + blendRev * (yarnF - origF);
      const isBlend = i === 2;
      const col = isBlend && blendRev > 0.2 ? COSMOS.gold : ROLE.bands[i];

      nodes.push(
        clockDial({
          cx: dialXs[i],
          cy: dialY,
          radius: 104,
          queryAngle: 0,
          keyAngle: -2.0 * (effF / origF),
          showAxes: true,
          showAngleArc: true,
          queryColor: COSMOS.ink,
          keyColor: col,
          projColor: isBlend ? COSMOS.gold : ROLE.score,
          title: `θ${i} = ${origF}`,
          subtitle: `${turns.toFixed(turns >= 10 ? 1 : 2)} turns`,
          titleColor: col,
          subColor: isBlend && foc > 0.2 ? COSMOS.gold : COSMOS.ink,
        }),
      );

      // Preserved original share bar (gamma in [0, 1]) below each clock
      const barTop = 145;
      const barW = 290;
      const fillW = Math.max(8, (blendRev > 0.1 ? gamma : 0) * barW);
      const zoneLabel =
        blendRev < 0.1
          ? 'turns vs [1, 32]'
          : i < 2
            ? 'keep 100%'
            : i === 2
              ? `blend ${(gamma * 100).toFixed(0)}%`
              : 'quarter (0% orig)';
      nodes.push(
        rect(barW, 34, {
          fill: '#101729',
          stroke: isBlend && foc > 0.2 ? COSMOS.gold : '#2c3b5e',
          width: isBlend && foc > 0.2 ? 3.2 : 1.8,
          radius: 8,
        }).at(dialXs[i], barTop),
        rect(fillW, 26, { fill: col, stroke: null, radius: 6 })
          .at(dialXs[i] - barW * 0.5 + fillW * 0.5, barTop)
          .opacity(blendRev > 0.1 ? 0.88 : 0.15)
          .glow(isBlend && foc > 0.2 ? 10 : 5, col)
          .set('blend', 'screen'),
        txt(zoneLabel, dialXs[i], barTop + 48, 26, col, 'mono'),
        txt(
          blendRev > 0.2 ? `new: ${yarnF.toFixed(4)}` : 'new: ?',
          dialXs[i],
          barTop + 88,
          26,
          isBlend && blendRev > 0.2 ? COSMOS.gold : COSMOS.muted,
          'mono',
        ),
      );
    });

    // Bottom threshold callout + Transformers 5.17 index-ramp comparison
    nodes.push(
      line([-855, 295], [855, 295], { stroke: '#29375a', width: 1.6 }),
      txt(
        blendRev < 0.1
          ? 'Thresholds: > 32 turns keep rate   |   < 1 turn use 1/4   |   Which pair falls between?'
          : idxRamp > 0.2
            ? 'Transformers 5.17 uses pair-index ramp → different rate on pair 2; match checkpoint schema!'
            : 'Pair 2 (6.5 turns): γ = (6.5 − 1)/31 ≈ 18% original + 82% quarter → 0.0038 rad/pos',
        -855,
        355,
        27,
        idxRamp > 0.2 ? ROLE.shift : blendRev > 0.2 ? COSMOS.gold : COSMOS.muted,
        'sans',
        'left',
      ),
    );

    return group(...nodes);
  });

  s.add(stars, stageAura, title, eq, live);

  // Beat 0: withhold blend answer during 2.1s prediction hold!
  playOn(s, c, 'count-turns', (d) => revealBlend.to(0, { duration: d }), 0.25);
  // Beat 1: fill bars with gamma & spotlight pair 2 yellow bar
  playOn(s, c, 'blend-bands', (d) => revealBlend.to(1, { duration: d }), 1.2);
  playOn(s, c, 'inspect-blend', (d) => focusBand2.to(1, { duration: d }), 0.6);
  // Beat 2: index-ramp vs turn-count ramp
  playAfter(s, c, 'index-ramp', (d) => showIdxRamp.to(1, { duration: d }), 0.5);
}
