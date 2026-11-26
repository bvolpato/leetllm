// Scene 21: Replicate expert state only through a shared collective contract.
// V2.5 NVLink weight prefetch & FP32 gradient reduction: all local ranks join; [2, 4] + [1, 3] = [3, 7].
import {
  COSMOS,
  REDUNDANT_GRAD,
  ROLE,
  aura,
  buildFabricTopologyRig3d,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  orbitScene,
  rect,
  remainAfterDuration,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function redundantExperts(s, c) {
  const phase = s.value(0);
  const hybridMode = s.value(1);
  const fenceVal = s.value(0);
  const joinedCount = s.value(1);
  const gradPhase = s.value(0);
  const revealSum = s.value(0);

  const bgAura = aura(470, 12, 500, '#5ce1e622', '#6ee7b71e');
  const { view: rig3d } = buildFabricTopologyRig3d(hybridMode, fenceVal, phase, {
    x: 470,
    y: 12,
    unit: 92,
  });

  const title = heroTitle(['Redundant Experts:', 'Shared Collective'], {
    x: -860,
    y: -420,
    size: 54,
    lineHeight: 64,
    accent: ROLE.good,
    eyebrow: 'V2.5 NVLINK WEIGHT PREFETCH & GRADIENT REDUCE',
    subtitle: 'Every rank in the local domain joins with an identical redundancy map',
  });

  const live = guardedDynamic(1, () => {
    const joined = Math.min(4, Math.round(joinedCount.value));
    const isGrad = Math.round(gradPhase.value) >= 1;
    const hasSum = Math.round(revealSum.value) >= 1;

    const nodes = [
      txt('3D NVLINK WEIGHT PREFETCH + FP32 REDUCE', 470, -415, 26, ROLE.good, 'mono').glow(
        5,
        ROLE.good,
      ),
      txt(
        hasSum
          ? `Owner FP32 grad: [2, 4] + [1, 3] = [${REDUNDANT_GRAD.join(', ')}]`
          : 'All 4 local ranks must join the collective',
        470,
        435,
        26,
        COSMOS.muted,
        'mono',
      ),
      txt('LOCAL NVLINK DOMAIN PARTICIPANTS', -860, -135, 26, ROLE.token, 'mono', 'left'),
    ];

    for (let r = 0; r < 4; r++) {
      const cx = -755 + r * 210;
      const isIdle = r === 3;
      const active = r < joined;
      const col = active ? (isIdle ? ROLE.token : ROLE.nvlink) : COSMOS.dim;
      nodes.push(
        rect(194, 152, { fill: '#0d1a2c', stroke: col, width: 2.2, radius: 8 }).at(cx, -25),
        txt(`Rank ${r}`, cx, -64, 28, col, 'mono'),
        txt(isIdle ? 'no replica' : 'replica map', cx, -18, 26, COSMOS.muted, 'sans'),
        txt(active ? 'JOINED' : 'waiting', cx, 22, 26, active ? ROLE.good : COSMOS.dim, 'mono'),
      );
    }

    if (!isGrad) {
      nodes.push(
        glassCell(-440, 175, 820, 112, ROLE.nvlink, { fill: '#0d202e', glow: 7 }),
        txt(
          'Prefetch weights & matching scales before expert run',
          -440,
          152,
          26,
          ROLE.nvlink,
          'mono',
        ),
        txt('Keep allocations alive through event dependencies', -440, 202, 26, COSMOS.ink, 'sans'),
      );
    } else {
      nodes.push(
        glassCell(-440, 148, 820, 88, ROLE.rank0, { fill: '#0e1b33', glow: 6 }),
        txt('Original owner [2, 4]  +  Replica FP32 [1, 3]', -440, 148, 27, COSMOS.ink, 'mono'),
        glassCell(-440, 274, 820, 96, hasSum ? ROLE.good : COSMOS.dim, {
          fill: hasSum ? '#0d251d' : '#111626',
          glow: hasSum ? 8 : 0,
        }),
        txt(
          hasSum
            ? `Owner accumulated gradient: [${REDUNDANT_GRAD.join(', ')}]`
            : 'Accumulating replica gradients...',
          -440,
          274,
          29,
          hasSum ? ROLE.good : COSMOS.muted,
          'mono',
        ),
        txt(
          'Initialize destination & share exact map on every rank',
          -860,
          368,
          26,
          COSMOS.muted,
          'sans',
          'left',
        ),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, rig3d, title, live);
  runPhase(s, c, phase, 14);
  orbitScene(s, c, rig3d, { theta: -0.22, phi: 0.94 });

  c.on('de-redundant-experts-b0', () =>
    s.play(joinedCount.to(4, { duration: remainDuration(c, 'de-redundant-experts-b0', 0.9) })),
  );
  c.on('de-redundant-experts-b1', () =>
    s.play(gradPhase.to(1, { duration: remainDuration(c, 'de-redundant-experts-b1', 0.5) })),
  );
  c.after('de-redundant-add', () =>
    s.play(revealSum.to(1, { duration: remainAfterDuration(c, 'de-redundant-add', 0.35) })),
  );
}
