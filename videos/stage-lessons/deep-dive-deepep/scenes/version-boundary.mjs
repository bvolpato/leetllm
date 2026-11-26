// Scene 02: Which buffer runs the dispatch?
// Traces token a across the V2 ElasticBuffer -> V2.5 EPBuffer + DeepJIT migration boundary.
import {
  COSMOS,
  ROLE,
  aura,
  buildJitAndStackRig3d,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  line,
  orbitScene,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function versionBoundary(s, c) {
  const phase = s.value(0);
  const stackStage = s.value(0);
  const v25 = s.value(0);

  const bgAura = aura(470, 12, 500, '#60a5fa20', '#fb923c1a');
  const { view: rig3d } = buildJitAndStackRig3d(stackStage, phase, { x: 470, y: 12, unit: 94 });

  const title = heroTitle(['Which Buffer Runs', 'the Dispatch?'], {
    x: -860,
    y: -420,
    size: 56,
    lineHeight: 66,
    accent: ROLE.nvlink,
    eyebrow: 'API BOUNDARY · V2 VS V2.5 SNAPSHOT',
    subtitle: 'Token a [1, 0] keeps its choices (E2 / E3) across API eras',
  });

  const live = guardedDynamic(1, () => {
    const isV25 = Math.round(v25.value) >= 1;
    const nodes = [
      txt('3D HOST EXTENSION -> DEEPJIT -> GPU', 470, -415, 26, ROLE.brand, 'mono').glow(
        5,
        ROLE.brand,
      ),
      txt(
        isV25 ? 'V2.5: host ext + DeepJIT runtime kernels' : 'V2: unified ElasticBuffer interface',
        470,
        435,
        26,
        COSMOS.muted,
        'mono',
      ),
      // Token identity header bar
      glassCell(-440, -110, 820, 72, ROLE.token, { fill: '#1c180e', glow: 6 }),
      txt(
        'Row a = [1, 0]   ·   choices E2 / E3   ·   same math',
        -440,
        -110,
        26,
        ROLE.token,
        'mono',
      ),
    ];

    if (!isV25) {
      nodes.push(
        glassCell(-655, 65, 390, 175, ROLE.rank0, { fill: '#0d1b33', glow: 7 }),
        txt('HISTORICAL V2', -655, 10, 26, COSMOS.muted, 'mono'),
        txt('ElasticBuffer', -655, 65, 34, ROLE.rank0, 'mono').glow(6, ROLE.rank0),
        txt('dispatch + combine', -655, 118, 26, COSMOS.ink, 'sans'),
        line([-455, 65], [-385, 65], { stroke: ROLE.token, width: 4 }).glow(5, ROLE.token),
        glassCell(-185, 65, 390, 175, ROLE.nvlink, { fill: '#0c212e', glow: 7 }),
        txt('4-TOKEN CPU MODEL', -185, 10, 26, COSMOS.muted, 'mono'),
        txt('Slots -> Row a', -185, 65, 32, ROLE.nvlink, 'mono'),
        txt('verifies exact value', -185, 118, 26, COSMOS.ink, 'sans'),
        txt(
          'One ElasticBuffer handles dispatch & combine at the V2 pin',
          -860,
          265,
          26,
          COSMOS.muted,
          'sans',
          'left',
        ),
      );
    } else {
      const bufs = [
        { name: 'EPBuffer', sub: 'expert dispatch', col: ROLE.good, x: -655, y: 18 },
        { name: 'BucketBuffer', sub: 'bucket transfers', col: ROLE.nvlink, x: -225, y: 18 },
        { name: 'PPBuffer', sub: 'pipeline stages', col: ROLE.rank0, x: -655, y: 158 },
        { name: 'EngramBuffer', sub: 'indexed lookup', col: ROLE.brand, x: -225, y: 158 },
      ];
      for (const b of bufs) {
        nodes.push(
          glassCell(b.x, b.y, 390, 112, b.col, { fill: '#0d1629', glow: 7 }),
          txt(b.name, b.x, b.y - 16, 30, b.col, 'mono'),
          txt(b.sub, b.x, b.y + 24, 26, COSMOS.muted, 'sans'),
        );
      }
      nodes.push(
        txt(
          'Shared allocation · DeepJIT compiles GPU kernels at runtime',
          -860,
          285,
          26,
          ROLE.nvlink,
          'sans',
          'left',
        ),
        txt(
          'Removes V1 & NVSHMEM dependency at this migration',
          -860,
          345,
          26,
          ROLE.bad,
          'mono',
          'left',
        ),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, rig3d, title, live);
  runPhase(s, c, phase, 14);
  orbitScene(s, c, rig3d, { theta: -0.22, phi: 0.94 });

  c.on('de-version-boundary-b0', () =>
    s.play(stackStage.to(1, { duration: remainDuration(c, 'de-version-boundary-b0', 0.8) })),
  );
  c.on('de-version-boundary-b1', () => {
    const dur = remainDuration(c, 'de-version-boundary-b1', 0.75);
    s.play(v25.to(1, { duration: dur }));
    s.play(stackStage.to(2, { duration: dur }));
  });
}
