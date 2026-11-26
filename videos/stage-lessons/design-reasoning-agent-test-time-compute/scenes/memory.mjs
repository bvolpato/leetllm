// Orbiting 3D KV-Cache Prefix Sharing Rig: 8 duplicated 16,384-tok branches (40 GiB) vs
// 1 shared 12,288-tok stem + 8 divergent 4,096-tok tails (13.75 GiB)!
import { group, line3d, parametricSurface } from 'vizmatic/stage';
import {
  COSMOS,
  MEM_STATS,
  ROLE,
  addBox3D,
  aura,
  cinemaHeader,
  cinematic3d,
  clampDur,
  guardedDynamic,
  metricReadout,
  orbitScene,
  txt,
} from '../parts.mjs';

export function buildMemory(s, c) {
  s.add(aura(260, 20, 620, ROLE.agent, COSMOS.bg));
  s.add(aura(-480, 120, 520, ROLE.ok, COSMOS.bg));

  s.add(
    cinemaHeader(
      'PREFIX KV-CACHE SHARING',
      'Share the identical stem,',
      'keep eight divergent tails',
      {
        x: -860,
        y: -445,
        accent: ROLE.ok,
        size: 46,
      },
    ),
  );

  const shareOn = s.value(0);
  c.on('memory-beat-2-focus-1', () =>
    s.play(shareOn.to(1, { duration: clampDur(c, c.cue('memory-beat-2-focus-1').start, 0.7) })),
  );

  // Orbiting 3D hero on right: left tall rose tower = 40 GiB unshared, right shared gold stem + 8 emerald tail prisms = 13.75 GiB
  const view = cinematic3d({
    center: [415, -55],
    scale: 98,
    theta: -0.62,
    phi: 0.42,
    fov: 5.8,
  });

  // Ground reference plane (compact, never collides with text)
  view.add(
    parametricSurface((u, v) => [-2.2 + u * 4.4, -1.5 + v * 3.0, -1.0], [0, 1], [0, 1], {
      resolution: [5, 4],
      color: '#0e172c',
      mesh: '#273c68',
      meshOpacity: 0.42,
      meshWidth: 0.9,
      opacity: 0.24,
      shaded: false,
    }),
  );

  // Unshared 8-copy tower (40 GiB -> height 3.2)
  addBox3D(view, -2.2, -0.7, -1.0, 1.3, 1.3, 3.2, '#f43f5e44', ROLE.fail, {
    faceOpacity: 0.52,
    edgeWidth: 2.2,
    edgeGlow: 8,
  });

  // Shared 1 stem (3.75 GiB -> height 0.95) + 8 small divergent tail cubes fanning behind/above it (10 GiB total)
  addBox3D(view, 0.3, -0.6, -1.0, 1.4, 1.2, 0.95, '#ffd16655', ROLE.focus, {
    faceOpacity: 0.62,
    edgeWidth: 2.4,
    edgeGlow: 9,
  });

  for (let i = 0; i < 8; i++) {
    const col = i % 4;
    const row = Math.floor(i / 4);
    const tx = 0.05 + col * 0.56;
    const ty = -0.95 + row * 1.45;
    addBox3D(view, tx, ty, 0.25, 0.38, 0.48, 0.78, '#34d39955', ROLE.ok, {
      faceOpacity: 0.6,
      edgeWidth: 1.8,
      edgeGlow: 7,
    });
    view.add(
      line3d([1.0, 0.0, -0.05], [tx + 0.19, ty + 0.24, 0.25], {
        color: ROLE.agent,
        width: 2.0,
        opacity: 0.85,
        glow: 6,
      }),
    );
  }

  s.add(view);
  orbitScene(s, c, view, { theta: 0.55, phi: 0.06 });

  // Left-side open metrics & sharing rules
  s.add(
    guardedDynamic(
      () => 1,
      () => {
        const sh = shareOn.value;
        return group(
          metricReadout('8 UNSHARED COPIES', `${MEM_STATS.unshared.toFixed(0)} GiB`, -580, -145, {
            color: ROLE.fail,
            size: 48,
            sub: '8 x 16,384 tok x 320 KiB',
          }),
          metricReadout(
            '1 SHARED STEM + 8 TAILS',
            sh > 0.4 ? `${MEM_STATS.shared.toFixed(2)} GiB` : 'SHARING PREFIX...',
            -580,
            80,
            {
              color: ROLE.ok,
              size: 48,
              sub: '12,288 shared + 8 x 4,096',
            },
          ).opacity(0.35 + 0.65 * sh),
          txt(
            'REUSE REQUIRES MATCHING TOKENS, POSITIONS, MODEL & TENANT SCOPE',
            -840,
            390,
            26,
            ROLE.focus,
            'mono',
            'left',
          ),
          txt(
            'ROSE: 40 GiB UNSHARED  ·  GOLD: SHARED STEM  ·  EMERALD: 8 TAILS',
            310,
            468,
            26,
            COSMOS.muted,
            'mono',
            'center',
          ),
        );
      },
    ),
  );
}
