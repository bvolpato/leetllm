// Scene 25: mcp-integration - Reuse protocol plumbing while retaining each permission boundary
// Signature Orbiting 3D MCP Optical Bridge:
//   Act 0 (Beat 0): 3 Hosts x 4 Services = 12 crossing 3D beams factoring into 3 Clients +
//                   central MCP Optical Bus + 4 Servers. Strict prediction withholding on "7"
//                   until AFTER `tu-mcp-factored`!
//   Act 1 (Beat 1): tools/list schema -> tools/call JSON-RPC + required 2026-07 metadata
//   Act 2 (Beat 2): Untrusted `readOnly` server annotation deflected at host policy boundary
import { gridPlane3d, group, line } from 'vizmatic/stage';
import {
  COSMOS,
  MCP_COUNTS,
  ROLE,
  addArc3D,
  addBox3D,
  aura,
  beamWithPhotons,
  cinemaHeader,
  cinematic3d,
  circuitBreaker,
  clampDur,
  driftValue,
  energyRail,
  fadeInHalf,
  fadeInNodes,
  fadeOutHalf,
  fadeOutNodes,
  guardedDynamic,
  hexGate,
  hideNodes,
  orbitScene,
  txt,
} from '../parts.mjs';

export default function mcpIntegration(s, c) {
  const pulse = s.value(0);
  const act = s.value(0); // 0 = 3D M*N -> M+N bridge, 1 = tools/list & tools/call, 2 = untrusted annotation
  const directOn = s.value(0);
  const factorOn = s.value(0);
  const sevenReveal = s.value(0);
  const callOn = s.value(0);
  const metaOn = s.value(0);
  const annotOn = s.value(0);

  const header = cinemaHeader(
    'MODEL CONTEXT PROTOCOL (MCP)',
    'Reuse protocol plumbing,',
    'keep permission boundaries',
    { accent: ROLE.mcp, size: 46 },
  );

  const stageAura = aura(240, 30, 640, '#a78bfa22', '#5ce1e61a');

  // 3D Orbiting M x N -> M + N MCP Bridge (Act 0)
  const rig3d = cinematic3d({
    theta: -0.78,
    phi: 0.98,
    distance: 15.8,
    unit: 110,
    focus: [0, 0, 0.72],
  }).at(280, 25);

  rig3d.add(
    gridPlane3d({
      x: [-3.6, 3.6],
      y: [-2.8, 2.8],
      z: 0,
      step: 1.2,
      color: '#25355a',
      width: 1.2,
      opacity: 0.45,
    }),
  );

  const hostYs = [-1.8, 0, 1.8];
  const srvYs = [-2.1, -0.7, 0.7, 2.1];
  const rigNodes = [];

  // 3 Host prisms on left (x=-2.9, blue)
  for (const hy of hostYs) {
    rigNodes.push(
      ...addBox3D(rig3d, -3.2, hy - 0.42, 0.04, 0.85, 0.84, 0.95, ROLE.proposal, ROLE.proposal),
    );
  }
  // 4 Service prisms on right (x=+2.35, emerald)
  for (const sy of srvYs) {
    rigNodes.push(
      ...addBox3D(rig3d, 2.35, sy - 0.36, 0.04, 0.85, 0.72, 0.95, ROLE.server, ROLE.server),
    );
  }

  // 12 Direct M x N crossing beams (hidden once factored!)
  const directBeams = [];
  let idx = 0;
  for (const hy of hostYs) {
    for (const sy of srvYs) {
      directBeams.push(
        ...addArc3D(rig3d, [-2.35, hy, 0.95], [2.35, sy, 0.95], ROLE.caution, {
          lift: 0.35 + (idx % 3) * 0.25,
          width: 2.2,
          glow: 5,
          opacity: 0.72,
          pulseVal: idx % 3 === 0 ? pulse : null,
          phaseOffset: (idx * 0.17) % 1,
        }),
      );
      idx++;
    }
  }

  // Factored MCP Optical Bus (central violet pillar + 3 client beams + 4 server beams)
  const factoredBridge = hideNodes([
    ...addBox3D(rig3d, -0.35, -2.35, 0.04, 0.7, 4.7, 1.35, ROLE.mcp, ROLE.mcp, {
      faceOpacity: 0.76,
      edgeGlow: 10,
    }),
    ...hostYs.flatMap((hy, i) =>
      addArc3D(rig3d, [-2.35, hy, 0.98], [-0.35, hy, 1.1], ROLE.proposal, {
        lift: 0.4,
        width: 3.4,
        pulseVal: pulse,
        phaseOffset: i * 0.3,
      }),
    ),
    ...srvYs.flatMap((sy, i) =>
      addArc3D(rig3d, [0.35, sy, 1.1], [2.35, sy, 0.98], ROLE.server, {
        lift: 0.4,
        width: 3.4,
        pulseVal: pulse,
        phaseOffset: 0.15 + i * 0.22,
      }),
    ),
  ]);

  // Act 0 Overlay: M x N = 12 -> M + N = ? -> 7 pieces!
  const act0 = guardedDynamic(
    () => fadeOutHalf(Math.min(1, act.value)),
    (a) => {
      const dr = directOn.value;
      const fc = factorOn.value;
      const sv = sevenReveal.value;
      const nodes = [];

      nodes.push(
        txt(
          '3 HOSTS (BLUE)   ·   MCP BUS (VIOLET)   ·   4 SERVICES (GREEN)',
          280,
          -425,
          26,
          COSMOS.muted,
          'mono',
          'center',
        ).opacity(a),
        energyRail(-855, -205, 55, ROLE.caution, { opacity: a }),
        txt('DIRECT PAIR ADAPTERS', -825, -185, 26, ROLE.caution, 'mono', 'left').opacity(a),
        txt(
          `${MCP_COUNTS.hosts} hosts x ${MCP_COUNTS.services} services`,
          -825,
          -125,
          28,
          COSMOS.ink,
          'mono',
          'left',
        ).opacity(a),
        txt(
          dr > 0.35 ? `= ${MCP_COUNTS.direct} SEPARATE ADAPTERS` : 'Tracing M x N lines...',
          -825,
          -62,
          32,
          ROLE.caution,
          'mono',
          'left',
        )
          .glow(dr > 0.35 ? 7 : 0, ROLE.caution)
          .opacity(a),
        txt('Custom glue grows quadratically', -825, 4, 26, COSMOS.muted, 'sans', 'left').opacity(
          a,
        ),
      );

      // Factored MCP count (strictly withheld until tu-mcp-factored!)
      const fOp = 0.35 + fc * 0.65;
      nodes.push(
        line([-855, 92], [-250, 92], { stroke: '#25355a', width: 2 }).opacity(a),
        energyRail(-855, 130, 365, sv > 0.5 ? ROLE.ok : ROLE.mcp, { opacity: a * fOp }),
        txt('FACTORED THROUGH MCP', -825, 150, 26, ROLE.mcp, 'mono', 'left').opacity(a * fOp),
        txt('3 clients + 4 servers', -825, 210, 28, COSMOS.ink, 'mono', 'left').opacity(a * fOp),
        txt(
          sv > 0.5 ? `= ${MCP_COUNTS.factored} INTEGRATION PIECES` : '= ?  PIECES TO MAINTAIN',
          -825,
          278,
          34,
          sv > 0.5 ? ROLE.ok : ROLE.focus,
          'mono',
          'left',
        )
          .glow(8, sv > 0.5 ? ROLE.ok : ROLE.focus)
          .opacity(a * fOp),
        txt(
          sv > 0.5 ? 'Shared discovery & invocation protocol' : 'Count clients + servers',
          -825,
          340,
          26,
          COSMOS.muted,
          'sans',
          'left',
        ).opacity(a * fOp),
      );

      return group(...nodes);
    },
  );

  // Act 1: JSON-RPC tools/list -> tools/call + pinned 2026-07 metadata
  const act1 = guardedDynamic(
    () => fadeInHalf(Math.min(1, act.value)) * fadeOutHalf(Math.max(0, act.value - 1)),
    (a) => {
      const p = pulse.value;
      const cl = callOn.value;
      const mt = metaOn.value;
      const nodes = [];

      const y = -80;
      nodes.push(
        txt(
          'JSON-RPC 2.0 DISCOVERY & INVOCATION',
          -855,
          -210,
          26,
          ROLE.mcp,
          'mono',
          'left',
        ).opacity(a),
        energyRail(-855, y - 55, y + 90, ROLE.proposal, { opacity: a }),
        txt('1. tools/list  (RESPONSE)', -825, y - 35, 28, ROLE.proposal, 'mono', 'left').opacity(
          a,
        ),
        txt('name: "get_release_status"', -825, y + 20, 26, COSMOS.ink, 'mono', 'left').opacity(a),
        txt(
          'inputSchema: { release_id: str }',
          -825,
          y + 68,
          26,
          ROLE.runtime,
          'mono',
          'left',
        ).opacity(a),
        beamWithPhotons(
          [
            [-145, y + 18],
            [95, y + 18],
          ],
          ROLE.mcp,
          p * 1.1,
          { alpha: a * (0.4 + cl * 0.6), width: 3.6 },
        ),
        energyRail(125, y - 55, y + 90, ROLE.ok, { opacity: a * (0.4 + cl * 0.6) }),
        txt('2. tools/call  (REQUEST)', 155, y - 35, 28, ROLE.ok, 'mono', 'left')
          .glow(cl > 0.35 ? 6 : 0, ROLE.ok)
          .opacity(a * (0.4 + cl * 0.6)),
        txt('name: "get_release_status"', 155, y + 20, 26, COSMOS.ink, 'mono', 'left').opacity(
          a * (0.4 + cl * 0.6),
        ),
        txt(
          'arguments: {"release_id": "reranker-v16"}',
          155,
          y + 68,
          26,
          ROLE.key,
          'mono',
          'left',
        ).opacity(a * (0.4 + cl * 0.6)),
      );

      // Pinned 2026-07 metadata strip
      const mOp = 0.35 + mt * 0.65;
      nodes.push(
        line([-855, 95], [840, 95], { stroke: '#25355a', width: 2 }).opacity(a),
        energyRail(-855, 145, 340, ROLE.key, { opacity: a * mOp }),
        txt('REQUIRED METADATA  (MCP 2026-07-28 REVISION)', -825, 168, 26, ROLE.key, 'mono', 'left')
          .glow(mt > 0.35 ? 6 : 0, ROLE.key)
          .opacity(a * mOp),
        txt(
          'protocolVersion  +  clientCapabilities   (missing -> INVALID)',
          -825,
          230,
          28,
          COSMOS.ink,
          'mono',
          'left',
        ).opacity(a * mOp),
        txt(
          'client name & version recommended · Host runs clients to local or remote servers',
          -825,
          292,
          26,
          COSMOS.muted,
          'sans',
          'left',
        ).opacity(a * mOp),
      );

      return group(...nodes);
    },
  );

  // Act 2: Untrusted Server Annotations vs Host Authorization
  const act2 = guardedDynamic(
    () => fadeInHalf(Math.max(0, act.value - 1)),
    (a) => {
      const p = pulse.value;
      const an = annotOn.value;
      const nodes = [];

      nodes.push(
        txt(
          'PROTOCOL REUSE NEVER RELAXES AUTHORIZATION',
          -855,
          -205,
          26,
          ROLE.ok,
          'mono',
          'left',
        ).opacity(a),
        energyRail(-855, -130, 55, ROLE.caution, { opacity: a }),
        txt('SERVER ANNOTATION (UNTRUSTED)', -825, -110, 28, ROLE.caution, 'mono', 'left').opacity(
          a,
        ),
        txt('readOnlyHint: true', -825, -45, 32, ROLE.caution, 'mono', 'left')
          .glow(an > 0.35 ? 7 : 0, ROLE.caution)
          .opacity(a),
        txt(
          'Untrusted unless issuer is trusted',
          -825,
          15,
          26,
          COSMOS.muted,
          'sans',
          'left',
        ).opacity(a),
        beamWithPhotons(
          [
            [-145, -35],
            [40, -35],
          ],
          ROLE.denied,
          p * 1.2,
          { alpha: a, width: 3.4 },
        ),
        circuitBreaker(125, -35, 110, an > 0.35 ? 1 : 0.4, ROLE.ok, { opacity: a }),
        hexGate(345, -35, 80, ROLE.session, { label: 'HOST', sub: 'caller auth', opacity: a }),
        energyRail(465, -130, 55, ROLE.ok, { opacity: a }),
        txt('LIVE POLICY CHECK', 495, -110, 26, ROLE.ok, 'mono', 'left').opacity(a),
        txt('principal + action', 495, -48, 28, COSMOS.ink, 'mono', 'left').opacity(a),
        txt('+ resolved resource', 495, 6, 28, ROLE.ok, 'mono', 'left').opacity(a),
        line([-855, 150], [840, 150], { stroke: '#25355a', width: 2 }).opacity(a),
        txt(
          'Diff approved schemas against current catalog · Restrict remote data · Sandbox local servers',
          0,
          245,
          26,
          COSMOS.ink,
          'sans',
          'center',
        ).opacity(a),
        txt(
          'Protocol plumbing is shared; execution authority stays with your host',
          0,
          325,
          30,
          ROLE.focus,
          'serif',
          'center',
        )
          .glow(6, ROLE.focus)
          .opacity(a),
      );

      return group(...nodes);
    },
  );

  s.add(stageAura, rig3d, header, act0, act1, act2);
  orbitScene(s, c, rig3d, { theta: -0.25, phi: 0.88 }, { startOffset: 0.1, endMargin: 0.5 });
  driftValue(s, c, pulse, 5.4, { startOffset: 0.1, endMargin: 0.5 });

  c.on('tu-mcp-integration-1', () => {
    s.play(pulse.to(0.3, { duration: clampDur(c, c.cue('tu-mcp-integration-1').start, 0.25) }));
  });
  c.on('tu-mcp-direct', () => {
    s.play(directOn.to(1, { duration: clampDur(c, c.cue('tu-mcp-direct').start, 0.35) }));
  });
  c.on('tu-mcp-factor-operation', () => {
    const t = c.cue('tu-mcp-factor-operation').start;
    s.play(factorOn.to(1, { duration: clampDur(c, t, 0.35) }));
    fadeOutNodes(s, c, t, directBeams, 0.3);
    fadeInNodes(s, c, t, factoredBridge, 0.35);
  });
  // Strict prediction withholding: reveal "7 integration pieces" AFTER tu-mcp-factored!
  c.after('tu-mcp-factored', () => {
    s.play(sevenReveal.to(1, { duration: clampDur(c, c.cue('tu-mcp-factored').end, 0.3) }));
  });
  c.on('tu-mcp-integration-2', () => {
    const t = c.cue('tu-mcp-integration-2').start;
    fadeOutNodes(s, c, t, [...rigNodes, ...directBeams, ...factoredBridge, rig3d], 0.14);
    s.play(act.to(1, { duration: clampDur(c, t, 0.55) }));
  });
  c.on('tu-mcp-call', () => {
    s.play(callOn.to(1, { duration: clampDur(c, c.cue('tu-mcp-call').start, 0.35) }));
  });
  c.on('tu-mcp-metadata', () => {
    s.play(metaOn.to(1, { duration: clampDur(c, c.cue('tu-mcp-metadata').start, 0.35) }));
  });
  c.on('tu-mcp-integration-3', () => {
    s.play(act.to(2, { duration: clampDur(c, c.cue('tu-mcp-integration-3').start, 0.35) }));
  });
  c.on('tu-mcp-untrusted-annotation', () => {
    s.play(
      annotOn.to(1, { duration: clampDur(c, c.cue('tu-mcp-untrusted-annotation').start, 0.35) }),
    );
  });
}
