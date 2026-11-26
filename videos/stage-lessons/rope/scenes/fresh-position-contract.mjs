// Scene 32: fresh-position-contract: Finale transfer challenge: q=21, k=18 in slot 2, +40 shift, wrong slot 2, copy vs double-rotate!
import { dynamic, group, par, rect } from 'vizmatic/stage';
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

const THETA = 0.4;
const REF_SCORE = Math.cos((18 - 21) * THETA); // cos(-1.2) = 0.3624
const SLOT_WRONG_SCORE = Math.cos((2 - 21) * THETA); // cos(-7.6) = 0.2508
const DOUBLE_ROT_SCORE = Math.cos((36 - 21) * THETA); // cos(6.0) = 0.9602

export default function freshPositionContract(s, c) {
  const qPos = s.value(21);
  const kEffPos = s.value(18);
  const physSlot = s.value(2);
  const stageMode = s.value(0);
  // 0: blank input prompt (answer withheld!)
  // 1: phase known (-1.2 rad)
  // 2: score revealed (0.362)
  // 3: shifted +40 -> (61, 58) still 0.362!
  // 4: wrong slot index 2 -> 0.251!
  // 5: rebuilt at 18 -> 0.362!
  // 6: moved slot 2 -> slot 0 (withhold copy vs rotate-again answer!)
  // 7: copy stored vector -> 0.362!
  // 8: rotate again (+18 -> 36) -> jumps to 0.960!

  const stars = cinemaStars(135, 32, ROLE.score);
  const stageAura = cinemaAura(350, -35, 580, '#6ee7b722', '#5ce1e614');

  const title = heroTitle(['Moving a', 'stored key'], {
    x: -860,
    y: -435,
    size: 56,
    lineHeight: 64,
    accent: ROLE.score,
    eyebrow: 'LOGICAL POSITION VS PHYSICAL SLOT (θ = 0.4)',
  });

  const live = dynamic(() => {
    const qp = qPos.value;
    const kp = kEffPos.value;
    const sl = physSlot.value;
    const sm = stageMode.value;

    const relPhase = (kp - qp) * THETA;
    const score = Math.cos(relPhase);
    const scoreVisible = sm >= 1.8 && (sm < 5.6 || sm >= 6.8);
    const isErr = (sm >= 3.8 && sm < 4.7) || sm >= 7.8;
    const accentCol = isErr ? ROLE.danger : ROLE.score;

    // Physical cache slots (slot 0, slot 1, slot 2) on upper-left
    const slotXs = [-735, -515, -295];
    const slotY = -140;
    const activeSlot = Math.round(sl);
    const nodes = [
      txt('Physical KV Cache Slots', -855, slotY - 76, 26, COSMOS.muted, 'mono', 'left'),
    ];

    [0, 1, 2].forEach((idx) => {
      const occupied = idx === activeSlot;
      nodes.push(
        rect(195, 78, {
          fill: occupied ? '#112536' : '#0d1322',
          stroke: occupied ? COSMOS.gold : '#2b395b',
          width: occupied ? 3.0 : 1.8,
          radius: 12,
        }).at(slotXs[idx], slotY),
        txt(
          `slot ${idx}`,
          slotXs[idx],
          slotY - 16,
          26,
          occupied ? COSMOS.gold : COSMOS.dim,
          'mono',
        ),
        txt(
          occupied ? `k(pos ${Math.round(qp - 3)})` : 'empty',
          slotXs[idx],
          slotY + 18,
          26,
          occupied ? COSMOS.ink : COSMOS.dim,
          'mono',
        ),
      );
    });

    // Builder input readout + equation status
    const builderText =
      sm < 0.8
        ? 'Rotation index:  [  ?  ]'
        : sm >= 3.8 && sm < 4.7
          ? 'Rotation index:  [  2  ]  (slot: WRONG!)'
          : sm >= 5.6 && sm < 6.7
            ? 'Moved to slot 0:  copy  or  rotate(18) again?'
            : sm >= 7.8
              ? 'Rotated again:  18 + 18 = 36  (DOUBLE-ROTATED!)'
              : sm >= 6.7
                ? 'Copied stored vector  →  keeps pos 18  ✓'
                : `Rotation index:  [  ${Math.round(kp)}  ]  (logical ID)`;

    nodes.push(
      txt(
        builderText,
        -855,
        10,
        30,
        sm < 0.8 || (sm >= 5.6 && sm < 6.7) ? COSMOS.gold : accentCol,
        'mono',
        'left',
      ).glow(6, sm < 0.8 || (sm >= 5.6 && sm < 6.7) ? COSMOS.gold : accentCol),
      txt(
        sm >= 0.8
          ? `Query pos m = ${Math.round(qp)}   ·   Key angle index = ${Math.round(kp)}`
          : `Query pos m = ${Math.round(qp)}   ·   Key angle index = ?`,
        -855,
        76,
        28,
        COSMOS.ink,
        'mono',
        'left',
      ),
      txt(
        sm >= 0.8
          ? `Relative phase = (${Math.round(kp)} − ${Math.round(qp)}) × 0.4 = ${relPhase.toFixed(1)} rad`
          : 'Relative phase = ?',
        -855,
        134,
        28,
        ROLE.shift,
        'mono',
        'left',
      ),
      txt(
        scoreVisible ? `Dot product = ${score.toFixed(3)}` : 'Dot product = ?',
        -855,
        200,
        40,
        accentCol,
        'mono',
        'left',
      ).glow(scoreVisible ? 8 : 0, accentCol),

      // Right: Live glowing rotary dial (withhold key angle & reference score during Beat 0 prediction!)
      clockDial({
        cx: 410,
        cy: -55,
        radius: 185,
        queryAngle: qp * THETA,
        keyAngle: sm >= 0.8 ? kp * THETA : null,
        showAxes: true,
        showProj: scoreVisible,
        showAngleArc: sm >= 0.8,
        queryColor: ROLE.query,
        keyColor: isErr ? ROLE.danger : COSMOS.gold,
        projColor: accentCol,
        title:
          sm >= 0.8
            ? `q(${Math.round(qp)}) · k_rot(${Math.round(kp)})`
            : `q(${Math.round(qp)}) · k_rot(?)`,
        subtitle:
          sm >= 7.8
            ? `Double turn → ${DOUBLE_ROT_SCORE.toFixed(3)} (miss!)`
            : sm >= 3.8 && sm < 4.7
              ? `Slot index 2 → ${SLOT_WRONG_SCORE.toFixed(3)} (miss!)`
              : scoreVisible
                ? `Matches reference ${REF_SCORE.toFixed(3)}  ✓`
                : sm >= 0.8
                  ? 'Computing cosine of relative phase...'
                  : 'Predict rotation index & dot product',
        titleColor: COSMOS.ink,
        subColor: accentCol,
      }),

      // Bottom full-width signed score ruler (withhold white reference tick until Beat 1 reveal!)
      signedRuler({
        x: -720,
        y: 335,
        width: 1440,
        min: -1,
        max: 1,
        reference: sm >= 1.8 ? REF_SCORE : null,
        value: scoreVisible ? score : null,
        color: accentCol,
        label: sm >= 1.8 ? 'White tick = full-pass reference (0.362)' : 'Signed dot product ruler',
        valueText: scoreVisible ? score.toFixed(3) : '?',
      }),
    );

    return group(...nodes);
  });

  s.add(stars, stageAura, title, live);

  // Beat 0: withhold input & score during 2.5s hold!
  playOn(s, c, 'choose-input', (d) => stageMode.to(0.2, { duration: d }), 0.25);
  // Beat 1: reveal 18 & -1.2 rad, then 0.362, then shift both +40 (61, 58)
  playOn(s, c, 'rp-fresh-position-contract-1-0', (d) => stageMode.to(1.0, { duration: d }), 0.45);
  playAfter(
    s,
    c,
    'rp-fresh-position-contract-1-1',
    (d) => stageMode.to(2.0, { duration: d }),
    0.45,
  );
  playOn(
    s,
    c,
    'rp-fresh-position-contract-1-2',
    (d) =>
      par(
        qPos.to(61, { duration: d }),
        kEffPos.to(58, { duration: d }),
        stageMode.to(3.0, { duration: d }),
      ),
    1.2,
  );
  // Beat 2: back to 21 & 18, try wrong slot index 2 -> rebuild at 18
  playOn(
    s,
    c,
    'rp-fresh-position-contract-2-0',
    (d) =>
      par(
        qPos.to(21, { duration: d }),
        kEffPos.to(2, { duration: d }),
        stageMode.to(4.0, { duration: d }),
      ),
    1.0,
  );
  playOn(
    s,
    c,
    'rp-fresh-position-contract-2-1',
    (d) => par(kEffPos.to(18, { duration: d }), stageMode.to(5.0, { duration: d })),
    0.85,
  );
  // Beat 3: move slot 2 -> slot 0, withhold copy vs double-rotate answer during 2.3s hold!
  playOn(
    s,
    c,
    'move-in-memory',
    (d) => par(physSlot.to(0, { duration: d }), stageMode.to(6.0, { duration: d })),
    0.85,
  );
  playOn(s, c, 'choose-copy', (d) => stageMode.to(6.2, { duration: d }), 0.35);
  // Beat 4: copy stored vector (0.362 ✓) -> then rotate again (+18 = 36) -> jumps to 0.960!
  playAfter(s, c, 'copy-key', (d) => stageMode.to(7.0, { duration: d }), 0.4);
  playOn(
    s,
    c,
    'rotate-again',
    (d) => par(kEffPos.to(36, { duration: d }), stageMode.to(8.0, { duration: d })),
    1.1,
  );
  playAfter(s, c, 'second-score', (d) => stageMode.to(8.5, { duration: d }), 0.35);
}
