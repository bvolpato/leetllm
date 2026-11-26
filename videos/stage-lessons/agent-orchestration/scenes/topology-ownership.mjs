// Scene 09 (topology-ownership): "Who keeps the conversation when work returns?"
// Orbiting 3D routing constellation paired with 4 cleanly cross-swapped stages:
//   Stage 0: Four topology patterns (Graph, Supervisor, Handoff, Group Chat)
//   Stage 1: Ownership trace (Tool call vs Handoff vs Next-run router + 4-hop Hierarchy packet flight)
//   Stage 2: Transfer Security Airlock (untrusted history, rebuild tools from policy, argument validation)
//   Stage 3: Framework migration & read-only enforcement (intent vs removed credentials)
import {
  COSMOS,
  ROLE,
  buildTopologyOrbit3d,
  cinemaAtmosphere,
  crossSwap,
  glowArrow,
  glowDot,
  glowRing,
  glowingArc,
  guardedDynamic,
  heroTitle,
  line,
  lumBar,
  orbitScene,
  renderStation,
  rule,
  runAmbientPhase,
  tweenCue,
  txt,
} from '../parts.mjs';

export default function topologyOwnership(s, c) {
  const phase = s.value(0);
  const st0 = s.value(1);
  const st1 = s.value(0);
  const st2 = s.value(0);
  const st3 = s.value(0);

  // Beat 0: 4 topologies
  const graphLit = s.value(0);
  const notDag = s.value(0);
  const supLit = s.value(0);
  const handLit = s.value(0);
  const histLit = s.value(0);
  const chatLit = s.value(0);

  // Beat 1: Tool call vs Handoff vs Hierarchy 4-hop trace
  const vegaAsk = s.value(0);
  const toolCall = s.value(0);
  const keepConv = s.value(0);
  const relTriage = s.value(0);
  const handCtrl = s.value(0);
  const nextRun = s.value(0);
  const startSpec = s.value(0);
  const boundAll = s.value(0);
  const hierLit = s.value(0);
  const hopStep = s.value(0); // 0 -> 1 -> 2 -> 3 -> 4 hops
  const measureLit = s.value(0);

  // Beat 2: Transfer security airlock
  const untrustedLit = s.value(0);
  const rebuildLit = s.value(0);
  const twoChecks = s.value(0);
  const enableLit = s.value(0);
  const boundGate = s.value(0);
  const guardLit = s.value(0);

  // Beat 3: Migration & enforcement
  const evolveLit = s.value(0);
  const migLit = s.value(0);
  const pinLit = s.value(0);
  const intentLit = s.value(0);
  const enforceLit = s.value(0);

  const bgAtmo = cinemaAtmosphere(ROLE.health, ROLE.eval);
  const { view: orbit3d } = buildTopologyOrbit3d(phase, {
    x: 535,
    y: 25,
    theta: -0.72,
    phi: 1.05,
    distance: 15.0,
    unit: 100,
  });

  const title = heroTitle(['Who Keeps the', 'Conversation?'], {
    x: -860,
    y: -440,
    size: 54,
    lineHeight: 62,
    accent: ROLE.health,
    eyebrow: 'TOPOLOGIES  /  SUPERVISOR, HANDOFF & HIERARCHY',
  });

  const live = guardedDynamic(s.value(1), () => {
    const m0 = st0.value;
    const m1 = st1.value;
    const m2 = st2.value;
    const m3 = st3.value;
    const lx = -860;
    const nodes = [];

    // Right 3D header (steady footer, zero crossSwap flash)
    nodes.push(
      txt('3D ROUTING CONSTELLATION', 535, -420, 26, ROLE.health, 'mono').glow(6, ROLE.health),
      txt('Hub ownership  |  Peer handoff  |  Hops', 535, -376, 26, COSMOS.muted, 'sans'),
      txt('Choose routing, bounds & creds explicitly', 535, 395, 26, COSMOS.muted, 'sans'),
    );

    // =========================================================================
    // STAGE 0 (Beat 0): Four Topology Mini-Mechanisms (drawn rings, zero boxes)
    // =========================================================================
    if (m0 > 0.02) {
      nodes.push(
        txt('FOUR ORCHESTRATION TOPOLOGIES', lx, -210, 26, ROLE.mark, 'mono', 'left').opacity(m0),
        rule(lx, -186, 120, -186, ROLE.rule, 2).opacity(m0),
      );

      // Row 1: Graph Workflow (explicit edges, can loop)
      const r1 = -100;
      nodes.push(
        ...renderStation(-810, r1, 'G', ROLE.triage, {
          radius: 18,
          active: graphLit.value > 0.3,
          labelOffset: 44,
          opacity: m0,
        }),
        glowArrow([-786, r1], [-724, r1], ROLE.eval, { width: 2.8, opacity: m0 }),
        ...renderStation(-700, r1, 'M', ROLE.merge, {
          radius: 18,
          active: notDag.value > 0.3,
          labelOffset: 44,
          opacity: m0,
        }),
        txt(
          'GRAPH WORKFLOW',
          -625,
          r1 - 16,
          26,
          graphLit.value > 0.3 ? ROLE.eval : COSMOS.ink,
          'mono',
          'left',
        ).opacity(m0),
        txt(
          notDag.value > 0.3
            ? 'Explicit edges + reducers; loops/dynamic workers allowed'
            : 'Explicit dependencies, reducers, and gates',
          -625,
          r1 + 22,
          26,
          COSMOS.muted,
          'sans',
          'left',
        ).opacity(m0),
      );

      // Row 2: Supervisor (retains conversation ownership)
      const r2 = 25;
      nodes.push(
        glowRing(-755, r2, 24, ROLE.merge, {
          width: 3.2,
          fillOpacity: supLit.value > 0.3 ? 0.35 : 0.12,
          glow: supLit.value > 0.3 ? 11 : 4,
          opacity: m0,
        }),
        glowDot(-755, r2, { radius: 6, color: ROLE.merge, opacity: m0 }),
        glowDot(-805, r2 - 20, { radius: 5, color: ROLE.eval, opacity: m0 }),
        glowDot(-705, r2 + 20, { radius: 5, color: ROLE.health, opacity: m0 }),
        txt(
          'SUPERVISOR',
          -625,
          r2 - 16,
          26,
          supLit.value > 0.3 ? ROLE.merge : COSMOS.ink,
          'mono',
          'left',
        ).opacity(m0),
        txt(
          'Retains conversation ownership; specialists return bounded results',
          -625,
          r2 + 22,
          26,
          COSMOS.muted,
          'sans',
          'left',
        ).opacity(m0),
      );

      // Row 3: Peer Handoff (moves active control)
      const r3 = 150;
      nodes.push(
        glowRing(-810, r3, 18, ROLE.eval, { opacity: m0 }),
        glowArrow([-784, r3], [-726, r3], handLit.value > 0.3 ? ROLE.mark : ROLE.eval, {
          width: 3.2,
          opacity: m0,
        }),
        glowRing(-700, r3, 18, ROLE.pass, {
          fillOpacity: handLit.value > 0.3 ? 0.35 : 0.1,
          opacity: m0,
        }),
        txt(
          'PEER HANDOFF',
          -625,
          r3 - 16,
          26,
          handLit.value > 0.3 ? ROLE.pass : COSMOS.ink,
          'mono',
          'left',
        ).opacity(m0),
        txt(
          histLit.value > 0.3
            ? 'Moves active control + application-configured history'
            : 'Transfers active turn control to the receiver',
          -625,
          r3 + 22,
          26,
          COSMOS.muted,
          'sans',
          'left',
        ).opacity(m0),
      );

      // Row 4: Selected-Speaker Group Chat
      const r4 = 275;
      nodes.push(
        glowRing(-755, r4, 24, ROLE.health, { dash: [6, 5], opacity: m0 }),
        glowDot(-755, r4 - 24, { radius: 5, color: ROLE.health, opacity: m0 }),
        glowDot(-734, r4 + 14, { radius: 5, color: ROLE.eval, opacity: m0 }),
        glowDot(-776, r4 + 14, { radius: 5, color: ROLE.policy, opacity: m0 }),
        txt(
          'GROUP CHAT',
          -625,
          r4 - 16,
          26,
          chatLit.value > 0.3 ? ROLE.health : COSMOS.ink,
          'mono',
          'left',
        ).opacity(m0),
        txt(
          'Selected-speaker routing: distinct mechanism from graphs/handoffs',
          -625,
          r4 + 22,
          26,
          COSMOS.muted,
          'sans',
          'left',
        ).opacity(m0),
      );
    }

    // =========================================================================
    // STAGE 1 (Beat 1): Tool Call vs Handoff vs 4-Hop Hierarchy
    // =========================================================================
    if (m1 > 0.02) {
      const hOn = hierLit.value;
      const hops = hopStep.value;

      // Top lane: Direct tool call vs Peer Handoff
      nodes.push(
        txt(
          vegaAsk.value > 0.3 ? 'QUERY: "Is the canary healthy?"' : 'CONVERSATION OWNERSHIP',
          lx,
          -210,
          26,
          ROLE.mark,
          'mono',
          'left',
        ).opacity(m1),
        rule(lx, -186, 120, -186, ROLE.rule, 2).opacity(m1),
      );

      // Left branch: Tool call keeps Vega
      nodes.push(
        lumBar(-650, -110, 420, 66, {
          color: toolCall.value > 0.3 || keepConv.value > 0.3 ? ROLE.eval : COSMOS.rule,
          fillOpacity: 0.18,
          glow: toolCall.value > 0.3 ? 10 : 4,
          opacity: m1,
        }),
        txt('TOOL CALL: Vega keeps chat', -650, -110, 26, COSMOS.ink, 'mono').opacity(m1),
      );

      // Right branch: Handoff + next-run app choice
      nodes.push(
        lumBar(-140, -110, 560, 66, {
          color: handCtrl.value > 0.3 || relTriage.value > 0.3 ? ROLE.pass : COSMOS.rule,
          fillOpacity: 0.18,
          glow: handCtrl.value > 0.3 ? 10 : 4,
          opacity: m1,
        }),
        txt(
          startSpec.value > 0.3
            ? 'HANDOFF + app starts next run'
            : nextRun.value > 0.3
              ? 'App picks who starts next run'
              : 'HANDOFF: move active control',
          -140,
          -110,
          26,
          COSMOS.ink,
          'mono',
        ).opacity(m1),
      );

      // Bounds strip
      if (boundAll.value > 0.02) {
        nodes.push(
          txt(
            'BOUND BOTH: inputs  |  outputs  |  turns  |  spend',
            lx,
            -32,
            26,
            ROLE.policy,
            'mono',
            'left',
          )
            .glow(5, ROLE.policy)
            .opacity(m1 * boundAll.value),
        );
      }

      // Lower arena: 4-Hop Hierarchy Flight (Vega -> Coordinator -> Health -> Coordinator -> Vega)
      const hy = 130;
      const vX = -760;
      const cX = -380;
      const hX = 0;
      nodes.push(
        txt(
          hOn > 0.3 ? 'HIERARCHY: 4 HOPS FOR THE SAME QUESTION' : 'COORDINATOR HOP TRACE',
          lx,
          30,
          26,
          hOn > 0.3 ? ROLE.reject : COSMOS.muted,
          'mono',
          'left',
        ).opacity(m1),
        ...renderStation(vX, hy, 'VEGA', ROLE.merge, {
          radius: 24,
          active: hops >= 0.5,
          labelOffset: 44,
          opacity: m1,
        }),
        ...renderStation(cX, hy, 'COORD', ROLE.policy, {
          radius: 24,
          active: hops >= 1 && hops <= 3.5,
          labelOffset: 44,
          opacity: m1,
        }),
        ...renderStation(hX, hy, 'HEALTH', ROLE.health, {
          radius: 24,
          active: hops >= 2 && hops <= 3,
          labelOffset: 44,
          opacity: m1,
        }),
      );

      // Hop 1: Vega -> Coord (top left)
      if (hops >= 0.8) {
        nodes.push(
          glowArrow([vX + 32, hy - 14], [cX - 32, hy - 14], ROLE.eval, { width: 3.4, opacity: m1 }),
          txt('1. ask', (vX + cX) / 2, hy - 44, 26, ROLE.eval, 'mono').opacity(m1),
        );
      }
      // Hop 2: Coord -> Health (top right)
      if (hops >= 1.8) {
        nodes.push(
          glowArrow([cX + 32, hy - 14], [hX - 32, hy - 14], ROLE.health, {
            width: 3.4,
            opacity: m1,
          }),
          txt('2. relay', (cX + hX) / 2, hy - 44, 26, ROLE.health, 'mono').opacity(m1),
        );
      }
      // Hop 3: Health -> Coord (bottom right)
      if (hops >= 2.8) {
        nodes.push(
          glowArrow([hX - 32, hy + 16], [cX + 32, hy + 16], ROLE.pass, { width: 3.4, opacity: m1 }),
          txt('3. verdict', (cX + hX) / 2, hy + 84, 26, ROLE.pass, 'mono').opacity(m1),
        );
      }
      // Hop 4: Coord -> Vega (bottom left)
      if (hops >= 3.8) {
        nodes.push(
          glowArrow([cX - 32, hy + 16], [vX + 32, hy + 16], ROLE.mark, { width: 3.4, opacity: m1 }),
          txt('4. return', (vX + cX) / 2, hy + 84, 26, ROLE.mark, 'mono').opacity(m1),
        );
      }

      nodes.push(
        txt(
          measureLit.value > 0.3
            ? 'Measure extra hop latency & drop'
            : 'Extra coordinator layers add round-trip hops',
          lx,
          310,
          26,
          measureLit.value > 0.3 ? ROLE.mark : COSMOS.muted,
          'sans',
          'left',
        ).opacity(m1),
      );
    }

    // =========================================================================
    // STAGE 2 (Beat 2): Transfer Security Airlock
    // =========================================================================
    if (m2 > 0.02) {
      nodes.push(
        txt('HANDOFF SECURITY AIRLOCK', lx, -210, 26, ROLE.reject, 'mono', 'left').opacity(m2),
        rule(lx, -186, 120, -186, ROLE.rule, 2).opacity(m2),
      );

      // Left: Untrusted History Tape -> Airlock Gate -> Trusted Receiver Tools
      nodes.push(
        lumBar(-685, -55, 350, 96, {
          color: untrustedLit.value > 0.3 ? ROLE.reject : COSMOS.rule,
          fillOpacity: 0.18,
          glow: 8,
          opacity: m2,
        }),
        txt('HISTORY TAPE', -685, -72, 26, ROLE.reject, 'mono').opacity(m2),
        txt('untrusted evidence', -685, -34, 26, COSMOS.muted, 'sans').opacity(m2),

        glowArrow([-500, -55], [-395, -55], ROLE.policy, { width: 3.4, opacity: m2 }),

        lumBar(-270, -55, 230, 120, {
          color: boundGate.value > 0.3 ? ROLE.mark : ROLE.eval,
          fillOpacity: 0.2,
          strokeWidth: 2.8,
          glow: 10,
          opacity: m2,
        }),
        txt('TRANSFER', -270, -76, 26, ROLE.mark, 'mono').opacity(m2),
        txt('BOUNDARY', -270, -34, 26, COSMOS.ink, 'mono').opacity(m2),

        glowArrow([-145, -55], [-40, -55], ROLE.pass, { width: 3.4, opacity: m2 }),

        lumBar(55, -55, 175, 96, {
          color: rebuildLit.value > 0.3 ? ROLE.pass : COSMOS.rule,
          fillOpacity: 0.18,
          glow: 9,
          opacity: m2,
        }),
        txt('POLICY', 55, -72, 26, ROLE.pass, 'mono').opacity(m2),
        txt('tools', 55, -34, 26, COSMOS.ink, 'sans').opacity(m2),
      );

      // Three crisp security invariants below the airlock (generous column gap)
      const checks = [
        ['1. Rebuild tools', 'From trusted app policy, never from sender text', rebuildLit.value],
        [
          '2. Two checks',
          'Argument validation != history filtering',
          Math.max(twoChecks.value, enableLit.value),
        ],
        [
          '3. At boundary',
          'Validate args at transfer boundary & raise on denial',
          Math.max(boundGate.value, guardLit.value),
        ],
      ];
      checks.forEach(([k, v, lit], i) => {
        const y = 78 + i * 74;
        nodes.push(
          glowDot(lx + 14, y, {
            radius: 7,
            color: lit > 0.3 ? ROLE.pass : COSMOS.dim,
            glow: lit > 0.3 ? 10 : 0,
            opacity: m2,
          }),
          txt(k, lx + 38, y, 26, lit > 0.3 ? ROLE.mark : COSMOS.muted, 'mono', 'left').opacity(m2),
          txt(v, lx + 350, y, 26, lit > 0.3 ? COSMOS.ink : COSMOS.muted, 'sans', 'left').opacity(
            m2,
          ),
        );
      });

      if (guardLit.value > 0.02) {
        nodes.push(
          txt(
            'Note: tool guardrails do NOT automatically cover handoffs',
            lx,
            315,
            26,
            ROLE.reject,
            'mono',
            'left',
          )
            .glow(6, ROLE.reject)
            .opacity(m2 * guardLit.value),
        );
      }
    }

    // =========================================================================
    // STAGE 3 (Beat 3): Framework Migration & Read-Only Enforcement
    // =========================================================================
    if (m3 > 0.02) {
      nodes.push(
        txt(
          'FRAMEWORKS & ENFORCEMENT BOUNDARIES',
          lx,
          -210,
          26,
          evolveLit.value > 0.3 ? ROLE.eval : COSMOS.muted,
          'mono',
          'left',
        ).opacity(m3),
        rule(lx, -186, 120, -186, ROLE.rule, 2).opacity(m3),
      );

      // Top rail: Migration contract bridge
      nodes.push(
        lumBar(-370, -85, 980, 96, {
          color: migLit.value > 0.3 || pinLit.value > 0.3 ? ROLE.eval : COSMOS.rule,
          fillOpacity: 0.16,
          glow: 8,
          opacity: m3,
        }),
        txt(
          pinLit.value > 0.3
            ? 'PIN & TEST THE EXACT RUNTIME YOU EXECUTE'
            : 'FRAMEWORK MIGRATIONS CHANGE ROUTING',
          -370,
          -102,
          26,
          ROLE.eval,
          'mono',
        ).opacity(m3),
        txt(
          'Typed-message contracts and state routing shift beyond import names',
          -370,
          -62,
          26,
          COSMOS.muted,
          'sans',
        ).opacity(m3),
      );

      // Bottom split: Prompt Intent (weak) vs Removed Credentials (enforced)
      const by = 115;
      nodes.push(
        lumBar(-635, by, 450, 125, {
          color: intentLit.value > 0.3 ? ROLE.policy : COSMOS.rule,
          fillOpacity: 0.16,
          dash: [8, 6],
          opacity: m3,
        }),
        txt('PROMPT: "read-only"', -635, by - 22, 26, ROLE.policy, 'mono').opacity(m3),
        txt('Expresses intent only', -635, by + 22, 26, COSMOS.muted, 'sans').opacity(m3),

        glowArrow([-395, by], [-325, by], ROLE.pass, { width: 3.4, opacity: m3 }),

        lumBar(-95, by, 440, 125, {
          color: enforceLit.value > 0.3 ? ROLE.pass : COSMOS.rule,
          fillOpacity: enforceLit.value > 0.3 ? 0.24 : 0.1,
          strokeWidth: 3.0,
          glow: enforceLit.value > 0.3 ? 12 : 4,
          opacity: m3,
        }),
        txt('NO WRITE CREDS', -95, by - 22, 26, ROLE.pass, 'mono').opacity(m3),
        txt('Enforces the boundary', -95, by + 22, 26, COSMOS.ink, 'sans').opacity(m3),
      );
    }

    return nodes;
  });

  s.add(bgAtmo, orbit3d, title, live);
  runAmbientPhase(s, c, phase, 2.4);
  orbitScene(s, c, orbit3d, { theta: 0.3, phi: 0.98 });

  // Beat 0
  tweenCue(s, c, 'topology-ownership-construct-0', graphLit, 1, { duration: 0.3 });
  tweenCue(s, c, 'not-dag', notDag, 1, { duration: 0.3 });
  tweenCue(s, c, 'supervisor', supLit, 1, { duration: 0.35 });
  tweenCue(s, c, 'handoff-moves', handLit, 1, { duration: 0.35 });
  tweenCue(s, c, 'configured-history', histLit, 1, { duration: 0.3 });
  tweenCue(s, c, 'group-chat', chatLit, 1, { duration: 0.35 });

  // Beat 1
  crossSwap(s, c, 'topology-ownership-construct-1', st0, st1, { duration: 0.42 });
  tweenCue(s, c, 'topology-ownership-construct-1', vegaAsk, 1, { duration: 0.3 });
  tweenCue(s, c, 'bounded-tool-call', toolCall, 1, { duration: 0.3 });
  tweenCue(s, c, 'name-tool', keepConv, 1, { duration: 0.3 });
  tweenCue(s, c, 'release-triage', relTriage, 1, { duration: 0.3 });
  tweenCue(s, c, 'handoff-active-control', handCtrl, 1, { duration: 0.35 });
  tweenCue(s, c, 'next-run', nextRun, 1, { duration: 0.3 });
  tweenCue(s, c, 'start-specialist', startSpec, 1, { duration: 0.3 });
  tweenCue(s, c, 'bound-all', boundAll, 1, { duration: 0.3 });
  tweenCue(s, c, 'hierarchy', hierLit, 1, { duration: 0.3 });
  tweenCue(s, c, 'replay-hops', hopStep, 0.5, { duration: 0.25 });
  tweenCue(s, c, 'ask-coordinator', hopStep, 1, { duration: 0.3 });
  tweenCue(s, c, 'ask-health', hopStep, 2, { duration: 0.3 });
  tweenCue(s, c, 'return-verdict', hopStep, 3, { duration: 0.3 });
  tweenCue(s, c, 'return-vega', hopStep, 4, { duration: 0.3 });
  tweenCue(s, c, 'measure-costs', measureLit, 1, { duration: 0.35 });

  // Beat 2
  crossSwap(s, c, 'topology-ownership-construct-2', st1, st2, { duration: 0.42 });
  tweenCue(s, c, 'topology-ownership-construct-2', untrustedLit, 1, { duration: 0.3 });
  tweenCue(s, c, 'rebuild-tools', rebuildLit, 1, { duration: 0.3 });
  tweenCue(s, c, 'two-checks', twoChecks, 1, { duration: 0.35, after: true });
  tweenCue(s, c, 'enablement', enableLit, 1, { duration: 0.3 });
  tweenCue(s, c, 'transfer-boundary', boundGate, 1, { duration: 0.35, after: true });
  tweenCue(s, c, 'guardrails', guardLit, 1, { duration: 0.35 });

  // Beat 3
  crossSwap(s, c, 'topology-ownership-construct-3', st2, st3, { duration: 0.42 });
  tweenCue(s, c, 'topology-ownership-construct-3', evolveLit, 1, { duration: 0.3 });
  tweenCue(s, c, 'migration', migLit, 1, { duration: 0.3 });
  tweenCue(s, c, 'pin-test', pinLit, 1, { duration: 0.3 });
  tweenCue(s, c, 'read-only-intent', intentLit, 1, { duration: 0.3 });
  tweenCue(s, c, 'enforces', enforceLit, 1, { duration: 0.35, after: true });
}
