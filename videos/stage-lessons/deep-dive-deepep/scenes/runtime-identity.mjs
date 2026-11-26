// Scene 26: A minimum version and a loaded-version match answer different questions.
// Beat 0: NCCL header < 2.31 requires exact loaded match (2.30.2 != 2.30.3); >= 2.31 requests runtime-version comm.
// Beat 1: V2.5 migration floor: CUDA 13.1, PyTorch 2.10, NCCL 2.32.3, Hopper+ GPU, C++20 toolchain.
import {
  COSMOS,
  ROLE,
  aura,
  buildJitAndStackRig3d,
  glassCell,
  glowTex,
  group,
  guardedDynamic,
  heroTitle,
  orbitScene,
  rect,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function runtimeIdentity(s, c) {
  const phase = s.value(0);
  const stackStage = s.value(0);
  const matchFixed = s.value(0);
  const showPrereqs = s.value(0);

  const bgAura = aura(470, 12, 500, '#60a5fa20', '#ff6b8b1a');
  const { view: rig3d } = buildJitAndStackRig3d(stackStage, phase, { x: 470, y: 12, unit: 94 });

  const title = heroTitle(['Minimum Floor vs.', 'Loaded Identity'], {
    x: -860,
    y: -420,
    size: 56,
    lineHeight: 66,
    accent: ROLE.rank0,
    eyebrow: 'RUNTIME IDENTITY · NCCL HEADERS & V2.5 FLOOR',
    subtitle: 'Two builds above the minimum can still fail an exact-version check',
  });

  const live = guardedDynamic(1, () => {
    const isFixed = Math.round(matchFixed.value) >= 1;
    const isPrereq = Math.round(showPrereqs.value) >= 1;

    const nodes = [
      txt('3D HEADER / RUNTIME / DEVICE STACK', 470, -415, 26, ROLE.rank0, 'mono').glow(
        5,
        ROLE.rank0,
      ),
      txt(
        isPrereq
          ? 'Verify GPU cap, NVLink peer map, RDMA rails & Gin'
          : 'Check the exact NCCL library the worker actually loaded',
        470,
        435,
        26,
        COSMOS.muted,
        'mono',
      ),
    ];

    if (!isPrereq) {
      nodes.push(
        txt('HISTORICAL HEADER BRANCH (< NCCL 2.31)', -860, -125, 26, ROLE.token, 'mono', 'left'),

        glassCell(-655, 8, 390, 160, ROLE.rank0, { fill: '#0d1b33', glow: 7 }),
        txt('BUILD HEADERS', -655, -36, 26, COSMOS.muted, 'mono'),
        txt('2.30.2', -655, 26, 44, ROLE.rank0, 'mono'),

        glassCell(-225, 8, 390, 160, isFixed ? ROLE.good : ROLE.bad, {
          fill: isFixed ? '#0d251d' : '#2b101a',
          glow: 7,
        }),
        txt('LOADED RUNTIME', -225, -36, 26, COSMOS.muted, 'mono'),
        txt(isFixed ? '2.30.2' : '2.30.3', -225, 26, 44, isFixed ? ROLE.good : ROLE.bad, 'mono'),

        glowTex(isFixed ? String.raw`23002 = 23002` : String.raw`23002 \neq 23003`, {
          x: -440,
          y: 175,
          size: 46,
          color: isFixed ? ROLE.good : ROLE.bad,
          glow: 7,
        }),
        txt(
          'Newer headers (>= 2.31) request a runtime-version device comm',
          -860,
          290,
          26,
          COSMOS.muted,
          'sans',
          'left',
        ),
      );
    } else {
      const rows = [
        ['CUDA Toolkit', '13.1', ROLE.nvlink],
        ['PyTorch', '2.10', ROLE.brand],
        ['NCCL', '2.32.3', ROLE.rank0],
        ['GPU / Compiler', 'Hopper+ / C++20', ROLE.good],
      ];
      nodes.push(txt('V2.5 MIGRATION SOFTWARE FLOOR', -860, -135, 26, ROLE.token, 'mono', 'left'));
      rows.forEach(([k, v, col], i) => {
        const y = -68 + i * 82;
        nodes.push(
          rect(820, 64, { fill: '#0e1729', stroke: col, width: 2.2, radius: 8 }).at(-440, y),
          txt(k, -820, y, 27, COSMOS.ink, 'mono', 'left'),
          txt(v, -60, y, 28, col, 'mono', 'right'),
        );
      });
      nodes.push(
        txt(
          'Also check NVLink peers, RDMA rails, Gin, QPs & symmetric mem',
          -860,
          292,
          26,
          ROLE.token,
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

  c.on('de-runtime-identity-b0', () => {
    const dur = remainDuration(c, 'de-runtime-identity-b0', 0.9);
    s.play(stackStage.to(1, { duration: dur }));
    s.play(matchFixed.to(1, { duration: dur }));
  });
  c.on('de-runtime-identity-b1', () => {
    const dur = remainDuration(c, 'de-runtime-identity-b1', 0.65);
    s.play(showPrereqs.to(1, { duration: dur }));
    s.play(stackStage.to(2, { duration: dur }));
  });
}
