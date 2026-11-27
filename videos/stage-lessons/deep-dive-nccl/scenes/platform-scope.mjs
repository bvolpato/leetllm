// Scene 23: A valid interface still has platform limits (MIG instances in NCCL 2.31+ / CUDA 13+: no NVLink P2P/NVLS/MNNVL; NCCL 2.32.3 optional OpenSSL 3 TLS for own sockets).
import {
  COSMOS,
  ROLE,
  aura,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  txt,
  wireStepCues,
} from '../parts.mjs';

export default function platformScope(s, c) {
  const step = s.value(0);

  const bgAura = aura(0, 20, 620, '#a78bfa1e', '#5ce1e618');
  const title = heroTitle(['Valid Interfaces Still', 'Have Platform Limits'], {
    x: -855,
    y: -415,
    size: 52,
    lineHeight: 62,
    accent: ROLE.r3,
    eyebrow: 'MIG COMMUNICATORS (2.31+) · SOCKET TLS (2.32.3)',
  });

  const live = guardedDynamic(1, () => {
    const st = step.value;
    const inTls = st >= 4;

    const nodes = [
      glassCell(-420, 0, 760, 320, !inTls ? ROLE.r3 : COSMOS.dim, {
        fill: !inTls ? '#1d1433' : '#0b101d',
        glow: !inTls ? 10 : 2,
      }),
      txt(
        'MIG COMMUNICATORS (NCCL 2.31+)',
        -420,
        -110,
        28,
        !inTls ? ROLE.r3 : COSMOS.muted,
        'mono',
      ),
      txt('Requires CUDA 13+ driver · distinct CUDA devices', -420, -40, 26, COSMOS.ink, 'sans'),
      txt('NO NVLink P2P · NO NVLS · MNNVL disabled', -420, 24, 26, ROLE.bad, 'mono'),
      txt('Measure throughput directly on MIG instances', -420, 92, 26, COSMOS.muted, 'sans'),

      glassCell(420, 0, 760, 320, inTls ? ROLE.good : COSMOS.dim, {
        fill: inTls ? '#0d2624' : '#0b101d',
        glow: inTls ? 10 : 2,
      }),
      txt(
        'SOCKET TLS ENCRYPTION (2.32.3)',
        420,
        -110,
        28,
        inTls ? ROLE.good : COSMOS.muted,
        'mono',
      ),
      txt(
        'Build with OpenSSL 3 + enable encryption API',
        420,
        -40,
        26,
        inTls ? COSMOS.ink : COSMOS.dim,
        'sans',
      ),
      txt('Covers NCCL-owned sockets ONLY', 420, 24, 26, inTls ? COSMOS.gold : COSMOS.dim, 'mono'),
      txt('External network plugins configure TLS separately', 420, 92, 26, COSMOS.muted, 'sans'),
    ];

    nodes.push(
      txt(
        'Check hardware-feature boundaries (MIG fabric limits & plugin encryption scope) before deployment',
        0,
        345,
        28,
        COSMOS.muted,
        'sans',
      ),
    );
    return group(...nodes);
  });

  s.add(bgAura, title, live);
  wireStepCues(s, c, step, [
    ['nc-platform-scope-b0-s0', 0],
    ['nc-platform-scope-b0-s1', 1],
    ['nc-platform-scope-b0-s2', 2],
    ['nc-platform-scope-b0-s3', 3],
    ['nc-platform-scope-b1-s0', 4],
    ['nc-platform-scope-b1-s1', 5],
    ['nc-platform-scope-b1-s2', 6],
  ]);
}
