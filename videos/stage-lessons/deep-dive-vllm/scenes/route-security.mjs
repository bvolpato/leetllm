// Scene 23: Who can send a scoring request? (Route aliases unified at gateway, authenticated ingress only through gateway, private cluster network for disaggregated KV transfer & collectives; orbiting 3D KV fabric).
import {
  COSMOS,
  ROLE,
  aura,
  buildParallelFabricRig3d,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  orbitScene,
  runPhase,
  txt,
  wireStepCues,
} from '../parts.mjs';

export default function routeSecurity(s, c) {
  const phase = s.value(0);
  // step: 0=route aliases unified, 1=client -> gateway -> scoring server, 2=private cluster KV transfer & collectives
  const step = s.value(0);

  const bgAura = aura(460, 20, 560, '#6ee7b71c', '#5ce1e618');
  const rig3d = buildParallelFabricRig3d(step, phase, { x: 475, y: 20, unit: 90 });

  const title = heroTitle(['Who Can Send a', 'Scoring Request?'], {
    x: -855,
    y: -425,
    size: 54,
    lineHeight: 62,
    accent: ROLE.good,
    eyebrow: 'SERVICE SECURITY · ROUTE ALIASES · GATEWAY · PRIVATE KV FABRIC',
  });

  const live = guardedDynamic(1, () => {
    const st = Math.round(step.value);
    const nodes = [
      txt('3D PRIVATE CLUSTER KV FABRIC', 475, -395, 26, ROLE.good, 'mono').glow(5, ROLE.good),
      txt('Worker-to-worker KV & collectives stay firewalled', 475, 400, 26, COSMOS.muted, 'mono'),
    ];

    if (st === 0) {
      nodes.push(
        glassCell(-640, -145, 410, 124, ROLE.kv, { fill: '#0e222e', glow: 8 }),
        txt('PRIMARY ROUTE', -640, -174, 26, ROLE.kv, 'mono'),
        txt('/v1/score', -640, -120, 30, COSMOS.ink, 'mono'),

        glassCell(-640, 25, 410, 124, COSMOS.gold, { fill: '#241c0e', glow: 8 }),
        txt('REGISTERED ALIAS', -640, -4, 26, COSMOS.gold, 'mono'),
        txt('/score  (unprefixed!)', -640, 50, 28, COSMOS.ink, 'mono'),

        glassCell(-195, -60, 410, 294, ROLE.good, { fill: '#0d2922', glow: 10 }),
        txt('UNIFIED GATEWAY', -195, -150, 26, ROLE.good, 'mono'),
        txt('SAME ACCESS RULE', -195, -100, 28, COSMOS.ink, 'mono'),
        txt('Auth + allowlist covers', -195, -45, 26, COSMOS.muted, 'sans'),
        txt('both names + /health,', -195, -2, 26, COSMOS.muted, 'sans'),
        txt('/metrics & admin', -195, 42, 26, COSMOS.muted, 'sans'),

        glassCell(-420, 200, 860, 108, ROLE.r0, { fill: '#101f38', glow: 6 }),
        txt(
          'Built-in --api-key covers prefixes only; audit all routes!',
          -420,
          200,
          26,
          COSMOS.ink,
          'sans',
        ),
      );
    } else if (st === 1) {
      const stages = [
        ['1. CLIENT CALLER', 'Sends scoring request with credentials', ROLE.r0],
        [
          '2. AUTHENTICATING GATEWAY',
          'Verifies caller & checks route allowlist -> FORWARDS',
          COSMOS.gold,
        ],
        [
          '3. vLLM SCORING SERVER',
          'Accepts ingress ONLY from the gateway (no direct port)',
          ROLE.good,
        ],
      ];
      stages.forEach(([k, d, col], i) => {
        const cy = -145 + i * 165;
        nodes.push(
          glassCell(-420, cy, 860, 138, col, { fill: '#101b2e', glow: 8 }),
          txt(k, -815, cy - 30, 26, col, 'mono', 'left'),
          txt(d, -815, cy + 24, 26, COSMOS.ink, 'sans', 'left'),
        );
      });
    } else {
      nodes.push(
        glassCell(-420, -145, 860, 148, ROLE.good, { fill: '#0d2922', glow: 10 }),
        txt('DISAGGREGATED / WORKER KV TRANSFER', -815, -182, 26, ROLE.good, 'mono', 'left'),
        txt('Worker A ===[ cached KV ]===> Worker B', -815, -124, 28, COSMOS.ink, 'mono', 'left'),

        glassCell(-420, 35, 860, 148, ROLE.kv, { fill: '#0e222e', glow: 8 }),
        txt('PRIVATE CLUSTER NETWORK + FIREWALL', -815, -2, 26, ROLE.kv, 'mono', 'left'),
        txt(
          'Restrict internal ports strictly to needed cluster peers',
          -815,
          56,
          26,
          COSMOS.ink,
          'sans',
          'left',
        ),

        glassCell(-420, 210, 860, 132, COSMOS.gold, { fill: '#221c0e', glow: 8 }),
        txt('SAME ISOLATION BOUNDARY APPLIES TO:', -815, 178, 26, COSMOS.gold, 'mono', 'left'),
        txt(
          'Process groups | TP | PP | DP | KV transfer',
          -815,
          232,
          26,
          COSMOS.ink,
          'mono',
          'left',
        ),
      );
    }

    nodes.push(
      txt(
        'OpenAI API compatibility is an interface, never a standalone security boundary',
        -855,
        368,
        26,
        COSMOS.muted,
        'sans',
        'left',
      ),
    );
    return group(...nodes);
  });

  s.add(bgAura, rig3d.view, title, live);
  runPhase(s, c, phase, 14);
  orbitScene(s, c, rig3d.view, { theta: -0.2, phi: 0.86 });
  wireStepCues(s, c, step, [
    ['vv-route-security-aliases', 0],
    ['vv-route-security-gateway', 1],
    ['vv-route-security-internal', 2],
  ]);
}
