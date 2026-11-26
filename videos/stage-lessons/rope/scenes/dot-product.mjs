// Scene 10: dot-product: Measuring alignment: 0 -> pi/2 -> pi, then m=5, n=3, theta=0.5 -> cos(-1)=0.540.
import { dynamic, group, par } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  cinemaAura,
  cinemaStars,
  clockDial,
  glowTex,
  heroTitle,
  playAfter,
  playOn,
  signedRuler,
  txt,
} from '../parts.mjs';

export default function dotProduct(s, c) {
  const qAng = s.value(0);
  const kAng = s.value(0);
  const showScoreVal = s.value(1);

  const stars = cinemaStars(125, 10, ROLE.score);
  const stageAura = cinemaAura(320, -20, 560, '#6ee7b720', '#5ce1e614');

  const title = heroTitle(['Measuring', 'alignment'], {
    x: -860,
    y: -425,
    size: 58,
    lineHeight: 68,
    accent: ROLE.score,
    eyebrow: 'ORTHOGONAL PROJECTION',
  });

  const eq = glowTex(String.raw`\hat{q}_m \cdot \hat{k}_n = \cos\bigl((n - m)\,\theta\bigr)`, {
    x: -495,
    y: -155,
    size: 38,
    color: COSMOS.gold,
    glow: 6,
  });

  const live = dynamic(() => {
    const qa = qAng.value;
    const ka = kAng.value;
    const delta = ka - qa;
    const score = Math.cos(delta);
    const revealed = showScoreVal.value;

    const nodes = [
      clockDial({
        cx: 325,
        cy: -55,
        radius: 230,
        queryAngle: qa,
        keyAngle: ka,
        showAxes: true,
        showProj: true,
        showAngleArc: Math.abs(delta) > 0.08,
        title: `Δθ = ${delta.toFixed(2)} rad`,
        titleColor: ROLE.score,
      }),
      signedRuler({
        x: -45,
        y: 325,
        width: 740,
        min: -1,
        max: 1,
        value: revealed > 0.2 ? score : null,
        color: ROLE.score,
        label: 'Signed dot product',
        valueText: revealed > 0.2 ? `${score >= 0 ? '+' : ''}${score.toFixed(3)}` : '?',
      }),
      // Left telemetry (pure floating typography)
      txt('Query angle (mθ)', -855, 20, 26, COSMOS.muted, 'mono', 'left'),
      txt(`${qa.toFixed(2)} rad`, -855, 68, 42, ROLE.query, 'mono', 'left').glow(6, ROLE.query),
      txt('Key angle (nθ)', -520, 20, 26, COSMOS.muted, 'mono', 'left'),
      txt(`${ka.toFixed(2)} rad`, -520, 68, 42, ROLE.key, 'mono', 'left').glow(6, ROLE.key),
      txt('Relative phase (n − m)θ', -855, 180, 26, COSMOS.muted, 'mono', 'left'),
      txt(`${delta.toFixed(2)} rad`, -855, 232, 46, ROLE.score, 'mono', 'left').glow(8, ROLE.score),
      txt(
        revealed > 0.2 ? `cos(${delta.toFixed(2)}) = ${score.toFixed(3)}` : 'cos(Δθ) = ?',
        -855,
        325,
        36,
        COSMOS.ink,
        'mono',
        'left',
      ),
    ];
    return group(...nodes);
  });

  s.add(stars, stageAura, title, eq, live);

  // Beat 0: 0 -> quarter turn (pi/2) -> half turn (pi)
  playOn(s, c, 'quarter-turn', (d) => kAng.to(Math.PI / 2, { duration: d }), 1.2);
  playOn(s, c, 'half-turn', (d) => kAng.to(Math.PI, { duration: d }), 1.2);
  // Beat 1: reset key alongside query, then rotate query to m=5 (2.5 rad) and key to n=3 (1.5 rad)
  playOn(
    s,
    c,
    'reset-key',
    (d) => par(qAng.to(0, { duration: d }), kAng.to(0, { duration: d })),
    0.9,
  );
  playOn(
    s,
    c,
    'position-the-pair',
    (d) =>
      par(
        qAng.to(2.5, { duration: d }),
        kAng.to(1.5, { duration: d }),
        showScoreVal.to(0, { duration: 0.2 }),
      ),
    1.4,
  );
  // Beat 2: reveal exact cos(-1) = 0.540 after spoken phrase
  playAfter(s, c, 'read-projection', (d) => showScoreVal.to(1, { duration: d }), 0.45);
}
