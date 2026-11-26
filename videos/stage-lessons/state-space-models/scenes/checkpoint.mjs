// Scene 12: checkpoint: Speculative rejection (77) contaminates state (63.5625 -> 33.78125) vs clean restore (50.125 -> 27.0625).
import {
  COSMOS,
  ROLE,
  aura,
  bindCueBeat,
  checkpointSnapshot,
  glowingTrail,
  group,
  guardedDynamic,
  heroTitle,
  playCue,
  txt,
  valuePill,
} from '../parts.mjs';

export default function checkpoint(s, c) {
  const stage = s.value(0); // 0=accepted 50.125, 1=provisional 77 -> 63.5625, 2=restore 50.125, 3=apply 4 -> 27.0625, 4=compare contaminated 33.78125

  const bgAura = aura(0, 0, 740, '#441a3226', '#103c3618');
  const title = heroTitle(['Speculative Branches:', 'checkpoint & restore'], {
    x: -855,
    y: -430,
    size: 52,
    lineHeight: 60,
    accent: ROLE.state,
  });

  const snap = checkpointSnapshot(2, 1); // accepted=50.125, provisional=63.5625, reference=27.0625, contaminated=33.78125
  const stageVis = s.value(1);

  const layer = guardedDynamic(stageVis, (alpha) => {
    const st = Math.round(stage.value);
    const topY = -125;
    const botY = 125;
    const nodes = [
      txt(
        'ACCEPTED CHECKPOINT (AFTER INPUT 99)',
        -855,
        -230,
        26,
        ROLE.state,
        'mono',
        'left',
      ).opacity(alpha),
      valuePill(`h = ${snap.accepted.toFixed(3)}`, -680, topY, {
        w: 300,
        h: 78,
        color: ROLE.state,
        size: 32,
        glow: 10,
        opacity: alpha,
      }),
      // Quiet timeline rails + slot outlines visible from t=0 so stage stays visually balanced
      glowingTrail(
        [
          [-520, topY],
          [760, topY],
        ],
        { color: '#243154', width: 2.5, core: false, opacity: 0.45 * alpha },
      ),
      glowingTrail(
        [
          [-680, botY],
          [760, botY],
        ],
        { color: '#1b3838', width: 2.5, core: false, opacity: 0.45 * alpha },
      ),
      ...(st < 1
        ? [
            valuePill('provisional slot', -165, topY, {
              w: 315,
              h: 78,
              color: COSMOS.rule,
              size: 28,
              glow: 0,
              opacity: 0.4 * alpha,
            }),
            valuePill('clean restore slot', -165, botY, {
              w: 315,
              h: 78,
              color: COSMOS.rule,
              size: 28,
              glow: 0,
              opacity: 0.4 * alpha,
            }),
          ]
        : []),
      txt(
        'Provisional speculative tokens mutate live state; keep an accepted snapshot to restore cleanly',
        -855,
        330,
        28,
        st >= 4 ? ROLE.delta : COSMOS.dim,
        'sans',
        'left',
      ).opacity(alpha),
    ];

    // Provisional rejected input 77 -> 63.5625
    if (st >= 1) {
      nodes.push(
        glowingTrail(
          [
            [-520, topY],
            [-330, topY],
          ],
          { color: ROLE.write, width: 4, opacity: alpha },
        ),
        txt('+77 (REJECTED)', -425, topY - 58, 26, ROLE.write, 'mono', 'center').opacity(alpha),
        valuePill(`h = ${snap.provisional.toFixed(4)}`, -165, topY, {
          w: 315,
          h: 78,
          color: ROLE.write,
          fill: '#2a1222',
          size: 30,
          glow: 10,
          opacity: alpha,
        }),
      );
    }

    // Restored clean branch below: 50.125 -> +4 -> 27.0625 (exact match to reference!)
    if (st >= 2) {
      nodes.push(
        glowingTrail(
          [
            [-680, topY + 42],
            [-680, botY - 42],
          ],
          { color: ROLE.state, width: 4.5, glow: 12, opacity: alpha },
        ),
        txt('RESTORE', -590, 0, 26, ROLE.state, 'mono', 'left').opacity(alpha),
        valuePill(`h = ${snap.accepted.toFixed(3)}`, -680, botY, {
          w: 300,
          h: 78,
          color: ROLE.state,
          size: 32,
          glow: 12,
          opacity: alpha,
        }),
      );
    }

    if (st >= 3) {
      nodes.push(
        glowingTrail(
          [
            [-520, botY],
            [-330, botY],
          ],
          { color: ROLE.state, width: 4.5, glow: 10, opacity: alpha },
        ),
        txt('+4 (ACCEPTED)', -425, botY - 58, 26, ROLE.state, 'mono', 'center').opacity(alpha),
        valuePill(`h = ${snap.reference.toFixed(4)}`, -165, botY, {
          w: 315,
          h: 78,
          color: ROLE.state,
          size: 30,
          glow: 14,
          opacity: alpha,
        }),
        txt('Matches direct reference [99, 4]', 40, botY, 28, ROLE.state, 'mono', 'left')
          .glow(6, ROLE.state)
          .opacity(alpha),
      );
    }

    // Wrong branch continuation from contaminated 63.5625 + 4 -> 33.78125
    if (st >= 4) {
      nodes.push(
        glowingTrail(
          [
            [0, topY],
            [175, topY],
          ],
          { color: ROLE.write, width: 4, opacity: alpha },
        ),
        txt('+4', 88, topY - 38, 26, ROLE.write, 'mono', 'center').opacity(alpha),
        valuePill(`h = ${snap.contaminated.toFixed(5)}`, 365, topY, {
          w: 350,
          h: 78,
          color: ROLE.write,
          fill: '#2a1222',
          size: 30,
          glow: 12,
          opacity: alpha,
        }),
        txt('CONTAMINATED', 575, topY, 28, ROLE.write, 'mono', 'left')
          .glow(8, ROLE.write)
          .opacity(alpha),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, title, layer);
  playCue(s, c, 'rejected-input', (d) => s.play(stage.to(1, { duration: d })), { dur: 0.45 });
  playCue(s, c, 'restore-checkpoint', (d) => s.play(stage.to(2, { duration: d })), { dur: 0.5 });
  playCue(s, c, 'apply-correction', (d) => s.play(stage.to(3, { duration: d })), { dur: 0.5 });
  playCue(s, c, 'wrong-branch', (d) => s.play(stage.to(4, { duration: d })), { dur: 0.5 });
  bindCueBeat(s, c, s.value(0), ['accepted-state', 'reference-state', 'ssm-checkpoint-reference']);
}
