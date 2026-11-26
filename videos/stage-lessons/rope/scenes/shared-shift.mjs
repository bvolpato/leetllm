// Scene 11: shared-shift: Move both positions +8: both arrows turn, relative angle & 0.540 stay LOCKED; then double query length.
import { dynamic, group, line, par } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  cinemaAura,
  cinemaStars,
  clockDial,
  glowDot,
  glowTex,
  heroTitle,
  playAfter,
  playOn,
  txt,
  verticalGauge,
} from '../parts.mjs';

const THETA = 0.5;

export default function sharedShift(s, c) {
  const shiftVal = s.value(0);
  const qLen = s.value(1);
  const revealLocked = s.value(0);
  const showCancel = s.value(0);

  const stars = cinemaStars(130, 11, ROLE.score);
  const stageAura = cinemaAura(255, 10, 580, '#6ee7b722', '#a78bfa16');

  const title = heroTitle(['Absolute shifts vanish.', 'Only Δ = n − m survives'], {
    x: -860,
    y: -425,
    size: 52,
    lineHeight: 64,
    accent: ROLE.score,
    eyebrow: 'RELATIVE POSITION INVARIANCE',
  });

  const eq = glowTex(String.raw`(R_m q)^\top (R_n k) = q^\top R_m^\top R_n k = q^\top R_{n-m} k`, {
    x: -440,
    y: -155,
    size: 34,
    color: COSMOS.gold,
    glow: 6,
  });

  const live = dynamic(() => {
    const sh = shiftVal.value;
    const ql = qLen.value;
    const locked = revealLocked.value;
    const cancel = showCancel.value;

    const m = 5 + sh;
    const n = 3 + sh;
    const qa = m * THETA;
    const ka = n * THETA;
    const dotVal = ql * Math.cos(ka - qa);

    // Position bracket ruler on bottom left
    const rx0 = -855;
    const rx1 = -180;
    const ry = 335;
    const mapX = (p) => rx0 + ((p - 1) / 14) * (rx1 - rx0);
    const kx = mapX(n);
    const qx = mapX(m);

    const nodes = [
      clockDial({
        cx: 265,
        cy: 15,
        radius: 215,
        queryAngle: qa,
        keyAngle: ka,
        queryLength: ql,
        showAxes: true,
        showProj: true,
        showAngleArc: true,
        title: `Dogs m = ${m.toFixed(1)}   ·   Cats n = ${n.toFixed(1)}`,
        subtitle: `Δ = n − m = −2.0   (−1.00 rad)`,
        titleColor: COSMOS.ink,
        subColor: ROLE.score,
      }),
      verticalGauge({
        x: 755,
        top: -200,
        bot: 210,
        value: Math.min(1, dotVal),
        color: ql > 1.2 ? ROLE.query : ROLE.score,
        caption: 'qₘᵀ kₙ',
        tag: ql > 1.2 ? `×${ql.toFixed(1)}` : 'LOCKED',
      }),
      // Left live numeric readouts
      txt('Dot product qₘᵀ kₙ', -855, -15, 26, COSMOS.muted, 'mono', 'left'),
      txt(
        sh > 0.2 && locked < 0.2 ? '?' : dotVal.toFixed(3),
        -855,
        45,
        62,
        ql > 1.2 ? ROLE.query : ROLE.score,
        'mono',
        'left',
      ).glow(10, ql > 1.2 ? ROLE.query : ROLE.score),
      txt(`Query length ||q|| = ${ql.toFixed(2)}`, -855, 145, 28, ROLE.query, 'mono', 'left'),
      txt(
        cancel > 0.3
          ? 'Rₘᵀ Rₙ = Rₙ₋ₘ  (absolute turn cancels)'
          : 'Shift both positions together by +8',
        -855,
        210,
        28,
        cancel > 0.3 ? ROLE.shift : COSMOS.muted,
        'mono',
        'left',
      ),
      // Fixed-width relative bracket sliding along position ruler
      line([rx0, ry], [rx1, ry], { stroke: '#35456d', width: 3 }),
      line([kx, ry - 26], [qx, ry - 26], { stroke: ROLE.score, width: 5 })
        .glow(10, ROLE.score)
        .set('blend', 'screen'),
      glowDot(kx, ry, { radius: 7, color: ROLE.key, glow: 10 }),
      glowDot(qx, ry, { radius: 7, color: ROLE.query, glow: 10 }),
      txt(`n=${Math.round(n)}`, kx, ry + 42, 26, ROLE.key, 'mono'),
      txt(`m=${Math.round(m)}`, qx, ry + 42, 26, ROLE.query, 'mono'),
    ];

    return group(...nodes);
  });

  s.add(stars, stageAura, title, eq, live);

  // Beat 0: prediction prompt: keep at (5, 3)
  playOn(s, c, 'shift-prediction', (d) => revealLocked.to(0, { duration: d }), 0.3);
  // Beat 1: slide +8 together -> reveal locked 0.540
  playOn(s, c, 'shift-both', (d) => shiftVal.to(8, { duration: d }), 1.8);
  playAfter(s, c, 'read-offset', (d) => revealLocked.to(1, { duration: d }), 0.45);
  // Beat 2: highlight R_m^T R_n cancellation
  playOn(s, c, 'cancel-rotations', (d) => showCancel.to(1, { duration: d }), 0.6);
  // Beat 3: hold positions still and double query length (1 -> 2, dot product 0.540 -> 1.081)
  playOn(
    s,
    c,
    'double-query',
    (d) => par(qLen.to(2, { duration: d }), revealLocked.to(1, { duration: 0.2 })),
    1.4,
  );
}
