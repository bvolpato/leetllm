// Scene 06: The reference and rollout snapshot own different quantities (5 logical identities + 3D role towers)
import {
  COSMOS,
  aura,
  buildRoleTowers3d,
  glassCell,
  glowTex,
  group,
  guardedDynamic,
  heroTitle,
  orbitScene,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function roleOwnership(s, c) {
  const phase = s.value(0);
  const sRoles = s.value(0);
  const sJobs = s.value(0);
  const sSnap = s.value(0);
  const sSplit = s.value(0);

  const bgAura = aura(420, 20, 560, '#14385c26', '#331c5418');
  const towers3d = buildRoleTowers3d(phase, { x: 435, y: 15, includeCritic: true });

  const title = heroTitle(['Reference & Rollout Snapshot', 'Own Different Quantities'], {
    x: -855,
    y: -415,
    size: 52,
    lineHeight: 62,
    accent: COSMOS.gold,
    eyebrow: 'PPO FIVE-IDENTITY CONTRACT · ACTOR · CRITIC · REWARD · REF · PI_OLD',
  });

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);
    const sr = Math.max(0.75, sRoles.value);
    const sj = sJobs.value;
    const sn = sSnap.value;
    const sp = sSplit.value;

    const roles = [
      {
        name: '1. ACTOR  pi_theta (TRAINABLE)',
        desc:
          sj > 0.2
            ? 'Samples next token from prefix; updated by PPO'
            : 'Generates response trajectory',
        col: COSMOS.cyan,
        fill: '#0f2138',
      },
      {
        name: '2. REWARD MODEL  r_phi (FROZEN)',
        desc: sj > 0.2 ? 'Scores finished response once at final token' : 'Learned sequence judge',
        col: COSMOS.emerald,
        fill: '#0e2624',
      },
      {
        name: '3. SFT REFERENCE  pi_ref (FROZEN)',
        desc:
          sp > 0.2
            ? 'OWNS KL DRIFT BASELINE across full run'
            : 'Long-lived baseline for drift charges',
        col: COSMOS.gold,
        fill: '#221c0e',
      },
      {
        name: '4. CRITIC  V_psi (TRAINABLE)',
        desc:
          sj > 0.2
            ? 'Predicts future return; advantage = outcome - V'
            : 'Value baseline (can share weights)',
        col: COSMOS.violet,
        fill: '#221438',
      },
      {
        name: '5. ROLLOUT SNAPSHOT  pi_old (BATCH FROZEN)',
        desc:
          sp > 0.2
            ? 'OWNS PPO RATIO DENOMINATOR during batch reuse'
            : 'Saved probabilities when batch rolled out',
        col: COSMOS.rose,
        fill: '#29101a',
      },
    ];

    const nodes = [
      txt('3D FOUR-ROLE PPO MONOLITHS', 435, -365, 26, COSMOS.cyan, 'mono'),
      txt(
        'Actor & Critic carry optimizer state; Ref & Reward stay frozen',
        435,
        396,
        26,
        COSMOS.muted,
        'sans',
      ),
    ];

    roles.forEach((role, i) => {
      const cy = -188 + i * 116;
      const isHighlight = (i === 2 || i === 4) && sp > 0.2;
      const op = i === 4 ? Math.max(0.75, sn) : sr;
      nodes.push(
        glassCell(-465, cy, 780, 96, role.col, {
          fill: role.fill,
          glow: isHighlight ? 11 * pulse : 4,
          opacity: op,
        }),
        txt(role.name, -825, cy - 18, 26, role.col, 'mono', 'left').opacity(op),
        txt(role.desc, -825, cy + 20, 26, COSMOS.ink, 'sans', 'left').opacity(op),
      );
    });

    return group(...nodes);
  });

  const eqRatio = glowTex(
    '\\rho_t = \\frac{\\pi_\\theta}{\\pi_{\\text{old}}} \\quad \\neq \\quad \\text{KL}\\!\\left(\\pi_{\\text{old}} \\parallel \\pi_{\\text{ref}}\\right)',
    {
      x: 435,
      y: 318,
      size: 30,
      color: COSMOS.gold,
      glow: 6,
    },
  );

  s.add(bgAura, towers3d, title, live, eqRatio);
  runPhase(s, c, phase, 14);
  orbitScene(s, c, towers3d, { theta: -0.24, phi: 0.92 });

  c.on('role-ownership-b0', () =>
    s.play(sRoles.to(1, { duration: remainDuration(c, 'role-ownership-b0', 0.5) })),
  );
  c.on('role-ownership-b1', () =>
    s.play(sJobs.to(1, { duration: remainDuration(c, 'role-ownership-b1', 0.55) })),
  );
  c.on('role-ownership-b2', () =>
    s.play(sSnap.to(1, { duration: remainDuration(c, 'role-ownership-b2', 0.55) })),
  );
  c.on('pa-old-snapshot', () =>
    s.play(sSplit.to(1, { duration: remainDuration(c, 'pa-old-snapshot', 0.55) })),
  );
}
