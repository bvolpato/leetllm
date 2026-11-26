// Scene 30: Keep the source license and dependency inventory separate.
// Beat 0: DeepSeek MIT source notice + contributors/NCCL collaborators.
// Beat 1: Separate terms for CUDA, NCCL, archived NVSHMEM, checkpoints, datasets & firmware.
import {
  COSMOS,
  ROLE,
  aura,
  buildJitAndStackRig3d,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  orbitScene,
  rect,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function ownershipLicense(s, c) {
  const phase = s.value(0);
  const stackStage = s.value(0);
  const depView = s.value(0);

  const bgAura = aura(470, 12, 500, '#60a5fa20', '#6ee7b71a');
  const { view: rig3d } = buildJitAndStackRig3d(stackStage, phase, { x: 470, y: 12, unit: 94 });

  const title = heroTitle(['Source License vs.', 'Image Inventory'], {
    x: -860,
    y: -420,
    size: 56,
    lineHeight: 66,
    accent: ROLE.rank0,
    eyebrow: 'GOVERNANCE · MIT SOURCE & RUNTIME IMAGE',
    subtitle: 'Track the source pin, dependency inventory, and image together',
  });

  const live = guardedDynamic(1, () => {
    const isDeps = Math.round(depView.value) >= 1;

    const nodes = [
      txt('3D DEPLOYMENT IMAGE LAYER STACK', 470, -415, 26, ROLE.rank0, 'mono').glow(5, ROLE.rank0),
      txt(
        isDeps
          ? 'V2.5 drops NVSHMEM; legacy V1 images still require it'
          : 'Retain MIT copyright & license notice with source',
        470,
        435,
        26,
        COSMOS.muted,
        'mono',
      ),
    ];

    const rows = isDeps
      ? [
          ['CUDA & NCCL', 'NVIDIA terms', ROLE.nvlink],
          ['Archived NVSHMEM', 'legacy V1 only', ROLE.bad],
          ['Weights & Datasets', 'model / data terms', ROLE.brand],
          ['NIC / GPU Firmware', 'vendor terms', ROLE.meta],
        ]
      : [
          ['DeepEP Source Pin', 'MIT License', ROLE.good],
          ['README Attribution', 'DeepSeek + NCCL team', ROLE.nvlink],
          ['Container Image', 'audit every layer', ROLE.token],
        ];

    nodes.push(
      txt(
        isDeps ? 'SEPARATELY GOVERNED IMAGE ARTIFACTS' : 'SOURCE REPOSITORY LICENSE',
        -860,
        -135,
        26,
        ROLE.token,
        'mono',
        'left',
      ),
    );

    rows.forEach(([left, right, col], i) => {
      const y = -66 + i * 86;
      nodes.push(
        rect(820, 68, { fill: '#0e1729', stroke: col, width: 2.2, radius: 8 }).at(-440, y),
        txt(left, -820, y, 27, COSMOS.ink, 'mono', 'left'),
        txt(right, -60, y, 26, col, 'mono', 'right'),
      );
    });

    nodes.push(
      glassCell(-440, 294, 840, 92, isDeps ? ROLE.nvlink : ROLE.good, {
        fill: '#0d1f26',
        glow: 6,
      }),
      txt(
        isDeps
          ? 'Keep source pin, dep list & image together'
          : 'Include MIT copyright notice with source',
        -440,
        294,
        26,
        isDeps ? ROLE.nvlink : ROLE.good,
        'mono',
      ),
    );

    return group(...nodes);
  });

  s.add(bgAura, rig3d, title, live);
  runPhase(s, c, phase, 14);
  orbitScene(s, c, rig3d, { theta: -0.22, phi: 0.94 });

  c.on('de-ownership-license-b0', () =>
    s.play(stackStage.to(1, { duration: remainDuration(c, 'de-ownership-license-b0', 0.7) })),
  );
  c.on('de-ownership-license-b1', () => {
    const dur = remainDuration(c, 'de-ownership-license-b1', 0.65);
    s.play(depView.to(1, { duration: dur }));
    s.play(stackStage.to(2, { duration: dur }));
  });
}
