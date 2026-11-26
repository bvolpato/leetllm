// Scene 31: evaluation: Cats (11) & Dogs (13): full pass (0.540 white tick) vs stale key from pos 3 (0.284) vs rebuilt at 11 (0.540).
import { dynamic, group, line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  cinemaAura,
  cinemaStars,
  clockDial,
  heroTitle,
  playAfter,
  playOn,
  signedRuler,
  txt,
} from '../parts.mjs';

const THETA = 0.5;
const REF_SCORE = Math.cos(-2 * THETA); // cos(-1) = 0.5403
const STALE_SCORE = Math.cos(-10 * THETA); // cos(-5) = 0.2837

export default function evaluation(s, c) {
  const keyPos = s.value(11); // starts at 11 (hidden/question), tries 3, then rebuilds at 11
  const mode = s.value(0); // 0 = question, 1 = stale key tried, 2 = stale score revealed, 3 = rebuilt at 11

  const stars = cinemaStars(130, 31, ROLE.score);
  const stageAura = cinemaAura(350, -30, 560, '#ffd16620', '#6ee7b716');

  const title = heroTitle(['Which version of the', 'key belongs here?'], {
    x: -860,
    y: -435,
    size: 54,
    lineHeight: 62,
    accent: COSMOS.gold,
    eyebrow: 'STALE CACHED KEY VS REBUILT KEY (θ = 0.5)',
  });

  const live = dynamic(() => {
    const kp = keyPos.value;
    const m = mode.value;
    const qPos = 13; // Dogs at 13
    const refKPos = 11; // Cats at 11
    const effGap = kp - qPos;
    const effPhase = effGap * THETA;
    const curScore = Math.cos(effPhase);

    const isStale = m >= 0.8 && m < 2.6;
    const showCacheScore = m >= 1.8;
    const isRebuilt = m >= 2.6;

    const nodes = [
      // Left dial: Full-pass reference (Dogs 13, Cats 11 -> Δ = -2 -> 0.540)
      clockDial({
        cx: -475,
        cy: -55,
        radius: 175,
        queryAngle: qPos * THETA,
        keyAngle: refKPos * THETA,
        showAxes: true,
        showProj: true,
        showAngleArc: true,
        queryColor: ROLE.query,
        keyColor: ROLE.key,
        projColor: ROLE.score,
        title: 'Full pass: q(13) · k(11)',
        subtitle: `Δ = −2  →  ${REF_SCORE.toFixed(3)}`,
        titleColor: ROLE.score,
        subColor: COSMOS.ink,
      }),
      // Right dial: Cache builder trying stale k(3) vs rebuilding k(11)
      clockDial({
        cx: 350,
        cy: -55,
        radius: 175,
        queryAngle: qPos * THETA,
        keyAngle: kp * THETA,
        showAxes: true,
        showProj: m >= 0.8,
        showAngleArc: m >= 0.8,
        queryColor: ROLE.query,
        keyColor: isStale ? ROLE.danger : isRebuilt ? ROLE.score : COSMOS.gold,
        projColor: isStale ? ROLE.danger : ROLE.score,
        title:
          m < 0.8
            ? 'Cache builder: reuse k(3)?'
            : isStale
              ? `Stale key: q(13) · k(${kp.toFixed(0)})`
              : `Rebuilt: q(13) · k(${kp.toFixed(0)})`,
        subtitle:
          m < 0.8
            ? 'Can k(3) match the white tick?'
            : isStale
              ? showCacheScore
                ? `Δ = −10 (−5 rad)  →  ${STALE_SCORE.toFixed(3)}`
                : `Δ = −10 (−5 rad)  →  ...`
              : `Δ = −2 (−1 rad)  →  ${REF_SCORE.toFixed(3)}  ✓`,
        titleColor: isStale ? ROLE.danger : isRebuilt ? ROLE.score : COSMOS.gold,
        subColor: COSMOS.ink,
      }),
      line([-60, -230], [-60, 175], { stroke: '#273454', width: 2, dash: [6, 8] }),
      // Bottom glowing signed score ruler with WHITE reference tick at 0.540!
      signedRuler({
        x: -720,
        y: 315,
        width: 1440,
        min: -1,
        max: 1,
        reference: REF_SCORE,
        value: showCacheScore ? curScore : null,
        color: isStale ? ROLE.danger : ROLE.score,
        label: 'White tick = full-pass reference (0.540)',
        valueText: showCacheScore ? `${curScore.toFixed(3)}` : '?',
      }),
    ];

    return group(...nodes);
  });

  s.add(stars, stageAura, title, live);

  // Beat 0: withhold stale answer during 2.1s prediction hold!
  playOn(s, c, 'old-copy-question', (d) => mode.to(0.2, { duration: d }), 0.25);
  // Beat 1: swing key to stale pos 3 -> reveal 0.284 after spoken phrase!
  playOn(s, c, 'try-old-key', (d) => keyPos.to(3, { duration: d }), 1.2);
  playOn(s, c, 'try-old-key', (d) => mode.to(1.2, { duration: d }), 0.3);
  playAfter(s, c, 'inspect-old-score', (d) => mode.to(2.0, { duration: d }), 0.45);
  // Beat 2: rebuild from unrotated key at pos 11 -> snaps right onto white reference tick!
  playOn(s, c, 'rebuild-key', (d) => keyPos.to(11, { duration: d }), 1.1);
  playOn(s, c, 'rebuild-key', (d) => mode.to(3.0, { duration: d }), 0.5);
}
