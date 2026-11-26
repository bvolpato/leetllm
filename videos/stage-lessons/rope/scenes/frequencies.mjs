// Scene 12: frequencies: SIGNATURE SHOWPIECE: 4 frequency dials + Orbiting 3D Multi-Frequency Helical Ribbons!
import { dynamic, group, linear, par, rect } from 'vizmatic/stage';
import {
  CLOCK_FREQUENCIES,
  COSMOS,
  ROLE,
  buildHelix3d,
  cinemaAura,
  cinemaStars,
  clockDial,
  glowTex,
  guardedDynamic,
  heroTitle,
  orbitScene,
  playAfter,
  playOn,
  txt,
} from '../parts.mjs';

export default function frequencies(s, c) {
  const stepBack = s.value(0); // 0 -> -2 (query at 4, key moves 4 -> 2)
  const revealNeg = s.value(0);
  const revealSum = s.value(0);
  const revealScaled = s.value(0);
  const show3d = s.value(0);
  const raceT = s.value(0.1);

  const stars = cinemaStars(135, 12, ROLE.query);
  const stageAura = cinemaAura(0, -10, 720, '#5ce1e620', '#ffd16614');

  const title = heroTitle(['Four pairs,', 'one offset'], {
    x: -860,
    y: -435,
    size: 56,
    lineHeight: 64,
    accent: ROLE.query,
    eyebrow: 'MULTI-FREQUENCY ROTARY HEAD (d = 8)',
  });

  const eq = glowTex(String.raw`\theta_i = 10000^{-2i/8}`, {
    x: 525,
    y: -380,
    size: 40,
    color: COSMOS.gold,
    glow: 6,
  });

  // 2D four-dial stage (Beats 0-2)
  const dialVis = s.value(1);
  const dialsStage = guardedDynamic(dialVis, (alpha) => {
    const delta = stepBack.value; // 0 -> -2
    const negRev = revealNeg.value;
    const sumRev = revealSum.value;
    const scRev = revealScaled.value;

    const dialXs = [-630, -210, 210, 630];
    const dialY = -100;
    const nodes = [];

    let totalDot = 0;
    CLOCK_FREQUENCIES.forEach((freq, i) => {
      const dAng = delta * freq;
      const contrib = Math.cos(dAng);
      totalDot += contrib;
      const col = ROLE.bands[i];
      const isNeg = contrib < 0 && negRev > 0.2;
      const barCol = isNeg ? ROLE.danger : ROLE.score;

      nodes.push(
        clockDial({
          cx: dialXs[i],
          cy: dialY,
          radius: 120,
          queryAngle: 0,
          keyAngle: dAng,
          showAxes: true,
          showProj: Math.abs(delta) > 0.05,
          showAngleArc: Math.abs(delta) > 0.05,
          queryColor: ROLE.query,
          keyColor: col,
          projColor: barCol,
          title: `θ${i} = ${freq}`,
          subtitle:
            Math.abs(delta) < 0.05
              ? 'Δ = 0  →  +1.000'
              : `cos(${dAng.toFixed(2)}) = ${contrib >= 0 ? '+' : ''}${contrib.toFixed(3)}`,
          titleColor: col,
          subColor: isNeg ? ROLE.danger : COSMOS.ink,
        }),
      );

      // Signed contribution bar underneath each dial
      const barY = 235;
      const barW = Math.abs(contrib) * 140;
      const dir = contrib >= 0 ? 1 : -1;
      nodes.push(
        rect(Math.max(6, barW), 24, { fill: barCol, stroke: null, radius: 5 })
          .at(dialXs[i] + dir * barW * 0.5, barY)
          .opacity(0.86)
          .glow(8, barCol)
          .set('blend', 'screen'),
      );
    });

    // Bottom sum & scaled logit bar (answers withheld until sum-pairs / scale-head!)
    const scaled = totalDot / Math.sqrt(8);
    nodes.push(
      txt(
        Math.abs(delta) < 0.05
          ? 'Query at 4, key moves to 2 (Δ = −2): which pair turns negative?'
          : `Δ = ${delta.toFixed(1)}  ·  Pair 0 turns −2 rad past vertical`,
        -860,
        325,
        28,
        COSMOS.muted,
        'sans',
        'left',
      ),
      txt(
        sumRev > 0.2 ? `Head dot = ${totalDot.toFixed(3)}` : 'Head dot = ?',
        -860,
        395,
        36,
        ROLE.score,
        'mono',
        'left',
      ).glow(sumRev > 0.2 ? 8 : 0, ROLE.score),
      txt(
        scRev > 0.2 ? `÷ √8  →  logit = ${scaled.toFixed(3)}` : '÷ √8  →  logit = ?',
        -240,
        395,
        36,
        COSMOS.gold,
        'mono',
        'left',
      ).glow(scRev > 0.2 ? 8 : 0, COSMOS.gold),
    );

    return group(...nodes).opacity(alpha);
  });

  // Orbiting 3D multi-frequency helical ribbons (revealed cleanly at `base-schedule`!)
  const helixView = buildHelix3d({ x: 265, y: 15, raceT });
  const helixCopy = group(
    txt('3D MULTI-FREQUENCY HELICES', -860, -200, 26, ROLE.query, 'mono', 'left'),
    txt('Base 10,000', -860, -130, 56, COSMOS.gold, 'serif', 'left').glow(6, COSMOS.gold),
    txt('Fast inner helix: local syntax', -860, 20, 28, COSMOS.cyan, 'sans', 'left'),
    txt('Mid ribbons: phrase span', -860, 74, 28, COSMOS.violet, 'sans', 'left'),
    txt('Slow outer sweep: long context', -860, 128, 28, COSMOS.gold, 'sans', 'left'),
    txt('Sum = 2.564   |   Logit = 0.906', -860, 240, 32, ROLE.score, 'mono', 'left').glow(
      6,
      ROLE.score,
    ),
  );

  s.add(stars, stageAura, title, eq, dialsStage);

  // Beat 0: prediction prompt (hold at delta = 0 so answer is withheld!)
  playOn(s, c, 'compare-rates', (d) => revealNeg.to(0, { duration: d }), 0.25);
  // Beat 1: step back 2 positions (delta 0 -> -2), highlight negative pair 0
  playOn(s, c, 'separate-positions', (d) => stepBack.to(-2, { duration: d }), 1.4);
  playAfter(s, c, 'read-projections', (d) => revealNeg.to(1, { duration: d }), 0.45);
  // Beat 2: sum all 4 contributions -> divide by sqrt(8) -> unveil 3D multi-frequency helices!
  playAfter(s, c, 'sum-pairs', (d) => revealSum.to(1, { duration: d }), 0.45);
  playAfter(s, c, 'scale-head', (d) => revealScaled.to(1, { duration: d }), 0.45);

  const baseCue = c.cue('base-schedule');
  const remDur = Math.max(0.8, c.end - baseCue.start - 0.5);
  c.on('base-schedule', () => {
    s.play(
      par(
        dialVis.to(0, { duration: 0.4 }),
        show3d.to(1, { duration: 0.4 }),
        raceT.to(1.35, { duration: remDur, ease: linear }),
      ),
    );
  });
  c.show('base-schedule', [helixView, helixCopy], { lead: -0.25 });
  orbitScene(
    s,
    c,
    helixView,
    { theta: -0.28, phi: 0.92 },
    {
      startOffset: Math.max(0.2, baseCue.start - c.start),
      endMargin: 0.5,
    },
  );
}
