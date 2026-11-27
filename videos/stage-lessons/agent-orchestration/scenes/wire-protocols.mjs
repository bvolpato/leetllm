// Scene 10 (wire-protocols): "A capability call and an independent agent task"
// Orbiting 3D authorization gate paired with 3 cleanly cross-swapped stages:
//   Stage 0: Workflow framework vs Interoperable wire boundary (MCP capability server vs A2A independent agent)
//   Stage 1: Same request ID (release-17) traveling MCP lookup tool vs A2A vendor task lifecycle
//   Stage 2: Artifact freshness gate (210 s withheld until c.after('receipt-age') vs 60 s limit) + Writer auth wall
import {
  COSMOS,
  FRESH_SECONDS,
  REQUEST,
  ROLE,
  STALE_AGE_S,
  buildWriterVault3d,
  cinemaAtmosphere,
  conduitPts,
  crossSwap,
  glowArrow,
  glowRing,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  line,
  lumBar,
  orbitScene,
  renderGauge,
  rule,
  runAmbientPhase,
  samplePolyline,
  tweenCue,
  txt,
} from '../parts.mjs';

export default function wireProtocols(s, c) {
  const phase = s.value(0);
  const gateState = s.value(0); // -1 stale/blocked, 0 neutral, +1 ok
  const st0 = s.value(1);
  const st1 = s.value(0);
  const st2 = s.value(0);

  // Beat 0: Framework vs Wire Protocol (MCP vs A2A)
  const fwLit = s.value(0);
  const wireLit = s.value(0);
  const crossProc = s.value(0);
  const mcpLit = s.value(0);
  const a2aLit = s.value(0);

  // Beat 1: Duration doesn't choose; MCP lookup vs A2A vendor investigator
  const durLit = s.value(0);
  const lookupLit = s.value(0);
  const vendorLit = s.value(0);
  const taskProg = s.value(0);
  const directMsg = s.value(0);
  const streamLit = s.value(0);

  // Beat 2: Artifact age prediction (210s vs 60s) + Writer authorization wall
  const artDone = s.value(0);
  const ageReveal = s.value(0); // strictly c.after('receipt-age')!
  const ageReject = s.value(0); // strictly c.after('completed-not-proof')!
  const noAuth = s.value(0);
  const credsPol = s.value(0);
  const humanRev = s.value(0);

  const bgAtmo = cinemaAtmosphere(ROLE.eval, ROLE.writer);
  const { view: vault3d } = buildWriterVault3d(phase, gateState, {
    x: 535,
    y: 25,
    theta: -0.72,
    phi: 1.06,
    distance: 15.0,
    unit: 100,
  });

  const title = heroTitle(['Capability Call vs', 'Independent Agent Task'], {
    x: -860,
    y: -440,
    size: 50,
    lineHeight: 58,
    accent: ROLE.eval,
    eyebrow: `WIRE PROTOCOLS  /  MCP & A2A  /  ${REQUEST.request}`,
  });

  const live = guardedDynamic(s.value(1), () => {
    const ph = phase.value;
    const m0 = st0.value;
    const m1 = st1.value;
    const m2 = st2.value;
    const lx = -860;
    const nodes = [];

    // Right 3D header & invariant (steady footer, zero crossSwap flash)
    nodes.push(
      txt('UNCHANGED AUTH GATE', 535, -420, 26, ROLE.writer, 'mono').glow(6, ROLE.writer),
      txt('Both protocols stop at policy & credentials', 535, -376, 26, COSMOS.muted, 'sans'),
      txt(
        'Remote completion != fresh proof or write permission',
        535,
        395,
        26,
        COSMOS.muted,
        'sans',
      ),
    );

    // =========================================================================
    // STAGE 0 (Beat 0): Workflow Framework -> Wire Boundary -> MCP & A2A
    // =========================================================================
    if (m0 > 0.02) {
      // Top band: Workflow Framework
      nodes.push(
        lumBar(-370, -155, 980, 76, {
          color: fwLit.value > 0.3 ? ROLE.triage : COSMOS.rule,
          fillOpacity: 0.18,
          strokeWidth: 2.6,
          glow: 9,
          opacity: m0,
        }),
        txt(
          'WORKFLOW FRAMEWORK: scheduling & typed state',
          -370,
          -155,
          28,
          COSMOS.ink,
          'mono',
        ).opacity(m0),
      );

      // Middle laser wire boundary (arrows routed outside text span!)
      const wy = -35;
      nodes.push(
        line([lx, wy], [130, wy], {
          stroke: wireLit.value > 0.3 ? ROLE.mark : COSMOS.muted,
          width: wireLit.value > 0.3 ? 4 : 2.5,
          dash: [12, 8],
        })
          .glow(8, ROLE.mark)
          .opacity(m0),
        txt(
          crossProc.value > 0.3 ? 'WIRE BOUNDARY (cross-process)' : 'WIRE PROTOCOL BOUNDARY',
          -365,
          wy - 34,
          26,
          ROLE.mark,
          'mono',
        ).opacity(m0),
      );

      // Left lower: MCP
      nodes.push(
        glowArrow([-760, -110], [-760, 40], ROLE.eval, { width: 3.4, opacity: m0 }),
        lumBar(-615, 145, 480, 175, {
          color: mcpLit.value > 0.3 ? ROLE.eval : COSMOS.rule,
          fillOpacity: mcpLit.value > 0.3 ? 0.22 : 0.1,
          strokeWidth: 2.8,
          glow: mcpLit.value > 0.3 ? 11 : 4,
          opacity: m0,
        }),
        txt('MCP', -615, 92, 32, ROLE.eval, 'mono').opacity(m0),
        txt('Capability Server', -615, 138, 26, COSMOS.ink, 'sans').opacity(m0),
        txt('Tools / Resources / Prompts', -615, 184, 26, COSMOS.muted, 'mono').opacity(m0),
      );

      // Right lower: A2A
      nodes.push(
        glowArrow([30, -110], [30, 40], ROLE.health, { width: 3.4, opacity: m0 }),
        lumBar(-110, 145, 480, 175, {
          color: a2aLit.value > 0.3 ? ROLE.health : COSMOS.rule,
          fillOpacity: a2aLit.value > 0.3 ? 0.22 : 0.1,
          strokeWidth: 2.8,
          glow: a2aLit.value > 0.3 ? 11 : 4,
          opacity: m0,
        }),
        txt('A2A', -110, 92, 32, ROLE.health, 'mono').opacity(m0),
        txt('Independent Agent', -110, 138, 26, COSMOS.ink, 'sans').opacity(m0),
        txt('Discovery / Messages / Tasks', -110, 184, 26, COSMOS.muted, 'mono').opacity(m0),
      );
    }

    // =========================================================================
    // STAGE 1 (Beat 1): Dual Protocol Lanes Carrying release-17
    // =========================================================================
    if (m1 > 0.02) {
      nodes.push(
        txt(
          durLit.value > 0.3
            ? 'BOTH SUPPORT LONG WORK -> ROLE CHOOSES PROTOCOL'
            : `REQUEST ID: ${REQUEST.request}`,
          lx,
          -210,
          26,
          ROLE.mark,
          'mono',
          'left',
        ).opacity(m1),
        rule(lx, -186, 120, -186, ROLE.rule, 2).opacity(m1),
      );

      // Lane 1: MCP Deployment Lookup Tool
      const y1 = -70;
      const p1 = conduitPts([-560, y1], [-180, y1]);
      nodes.push(
        txt('MCP LANE', lx, y1 - 56, 26, ROLE.eval, 'mono', 'left').opacity(m1),
        lumBar(-710, y1, 290, 62, { color: ROLE.eval, fillOpacity: 0.18, opacity: m1 }),
        txt('Host Graph', -710, y1, 26, COSMOS.ink, 'mono').opacity(m1),
        glowingTrail(p1, {
          color: lookupLit.value > 0.3 ? ROLE.eval : COSMOS.dim,
          width: 3.6,
          opacity: m1,
          core: false,
        }),
        lumBar(-35, y1, 280, 62, {
          color: lookupLit.value > 0.3 ? ROLE.eval : COSMOS.rule,
          fillOpacity: 0.22,
          glow: lookupLit.value > 0.3 ? 11 : 4,
          opacity: m1,
        }),
        txt('Deploy Lookup API', -35, y1, 26, COSMOS.ink, 'mono').opacity(m1),
      );

      // Lane 2: A2A Vendor Investigator Task Lifecycle
      const y2 = 105;
      const p2 = conduitPts([-560, y2], [-180, y2]);
      nodes.push(
        txt('A2A LANE', lx, y2 - 56, 26, ROLE.health, 'mono', 'left').opacity(m1),
        lumBar(-710, y2, 290, 62, { color: ROLE.health, fillOpacity: 0.18, opacity: m1 }),
        txt('Client Agent', -710, y2, 26, COSMOS.ink, 'mono').opacity(m1),
        glowingTrail(p2, {
          color: vendorLit.value > 0.3 ? ROLE.health : COSMOS.dim,
          width: 3.6,
          opacity: m1,
          core: false,
        }),
        lumBar(-35, y2, 280, 62, {
          color: vendorLit.value > 0.3 ? ROLE.health : COSMOS.rule,
          fillOpacity: 0.22,
          glow: vendorLit.value > 0.3 ? 11 : 4,
          opacity: m1,
        }),
        txt('Vendor Agent', -35, y2, 26, COSMOS.ink, 'mono').opacity(m1),
      );

      // Task lifecycle sub-strip below Lane 2
      const ly = 225;
      nodes.push(
        rule(lx, ly - 30, 120, ly - 30, ROLE.rule, 2).opacity(m1),
        txt(
          streamLit.value > 0.3
            ? 'Direct message optional; streaming & push depend on capabilities'
            : directMsg.value > 0.3
              ? 'Direct message need not spawn an async task'
              : taskProg.value > 0.3
                ? 'Own task ID + progress updates + typed artifact outputs'
                : 'Pick capability server vs autonomous remote agent',
          lx,
          ly + 20,
          26,
          ROLE.health,
          'sans',
          'left',
        ).opacity(m1),
      );
    }

    // =========================================================================
    // STAGE 2 (Beat 2): Artifact Freshness Prediction (210s vs 60s) + Auth Wall
    // =========================================================================
    if (m2 > 0.02) {
      const aRev = ageReveal.value;
      const aRej = ageReject.value;
      const wBlk = noAuth.value;

      nodes.push(
        txt(
          'ARTIFACT RECEIPT  (TASK STATUS: COMPLETED)',
          lx,
          -210,
          26,
          artDone.value > 0.3 ? ROLE.health : COSMOS.muted,
          'mono',
          'left',
        ).opacity(m2),
        rule(lx, -186, 120, -186, ROLE.rule, 2).opacity(m2),
      );

      // Freshness gauge: withheld until c.after('receipt-age') reveals 210s!
      const gy = -95;
      const gW = 780;
      const frac = aRev > 0.05 ? (STALE_AGE_S / 260) * aRev : 0.08;
      const cap = FRESH_SECONDS / 260;
      const g = renderGauge(lx, gy, gW, 34, frac, {
        cap,
        color: ROLE.pass,
        overColor: ROLE.reject,
        limitColor: ROLE.mark,
        opacity: m2,
      });
      nodes.push(
        ...g.nodes,
        txt('60 s limit', g.capX, gy - 58, 26, ROLE.mark, 'mono').opacity(m2),
        txt(
          aRev > 0.3 ? `${STALE_AGE_S} s` : 'age: ???',
          lx + gW + 30,
          gy,
          36,
          aRev > 0.3 ? ROLE.reject : ROLE.mark,
          'mono',
          'left',
        )
          .glow(8, aRev > 0.3 ? ROLE.reject : ROLE.mark)
          .opacity(m2),
      );

      // Join freshness verdict (strictly after completed-not-proof)
      if (aRej > 0.02) {
        nodes.push(
          txt(
            `JOIN REJECTS STALE ARTIFACT (${STALE_AGE_S} s > ${FRESH_SECONDS} s)`,
            lx,
            gy + 68,
            26,
            ROLE.reject,
            'mono',
            'left',
          ).opacity(m2 * aRej),
        );
      } else {
        nodes.push(
          txt('How old is the observation?', lx, gy + 68, 26, ROLE.mark, 'sans', 'left').opacity(
            m2 * (1 - aRej),
          ),
        );
      }

      // Lower section: Remote transcript asks for traffic shift -> hits Writer Auth Wall
      const wy = 145;
      nodes.push(
        txt('REMOTE TRANSCRIPT REQUEST', lx, wy - 76, 26, COSMOS.muted, 'mono', 'left').opacity(m2),
        lumBar(-665, wy, 390, 68, { color: ROLE.policy, fillOpacity: 0.16, opacity: m2 }),
        txt('"shift traffic to 25%"', -665, wy, 26, COSMOS.ink, 'mono').opacity(m2),

        glowArrow([-455, wy], [-345, wy], wBlk > 0.3 ? ROLE.reject : COSMOS.muted, {
          width: 3.4,
          opacity: m2,
        }),

        line([-325, wy - 56], [-325, wy + 56], { stroke: ROLE.reject, width: 6 })
          .glow(12, ROLE.reject)
          .opacity(m2),
        txt(
          wBlk > 0.3 ? 'STOPPED AT WRITER' : 'AUTH WALL',
          -295,
          wy - 22,
          26,
          ROLE.reject,
          'mono',
          'left',
        ).opacity(m2),
        txt(
          humanRev.value > 0.3
            ? 'Policy requires human approval + writer creds'
            : credsPol.value > 0.3
              ? 'Credentials & app policy decide who writes'
              : 'Transcript text carries zero write authority',
          -295,
          wy + 24,
          26,
          humanRev.value > 0.3 ? ROLE.pass : COSMOS.muted,
          'sans',
          'left',
        ).opacity(m2),
      );
    }

    return nodes;
  });

  s.add(bgAtmo, vault3d, title, live);
  runAmbientPhase(s, c, phase, 2.2);
  orbitScene(s, c, vault3d, { theta: 0.28, phi: 0.98 });

  // Beat 0
  tweenCue(s, c, 'wire-protocols-construct-0', fwLit, 1, { duration: 0.3 });
  tweenCue(s, c, 'wire-boundary', wireLit, 1, { duration: 0.35 });
  tweenCue(s, c, 'cross-processes', crossProc, 1, { duration: 0.3 });
  tweenCue(s, c, 'mcp', mcpLit, 1, { duration: 0.35 });
  tweenCue(s, c, 'a2a', a2aLit, 1, { duration: 0.35 });

  // Beat 1
  crossSwap(s, c, 'wire-protocols-construct-1', st0, st1, { duration: 0.42 });
  tweenCue(s, c, 'wire-protocols-construct-1', durLit, 1, { duration: 0.3 });
  tweenCue(s, c, 'lookup-tool', lookupLit, 1, { duration: 0.35 });
  tweenCue(s, c, 'vendor-task', vendorLit, 1, { duration: 0.35 });
  tweenCue(s, c, 'task-progress', taskProg, 1, { duration: 0.3 });
  tweenCue(s, c, 'direct-message', directMsg, 1, { duration: 0.3 });
  tweenCue(s, c, 'streaming', streamLit, 1, { duration: 0.3 });

  // Beat 2: Prediction gates with strict c.after!
  crossSwap(s, c, 'wire-protocols-construct-2', st1, st2, { duration: 0.42 });
  tweenCue(s, c, 'wire-protocols-construct-2', artDone, 1, { duration: 0.3 });
  c.after('receipt-age', () => {
    s.play(ageReveal.to(1, { duration: 0.45 }), gateState.to(-1, { duration: 0.4 }));
  });
  tweenCue(s, c, 'completed-not-proof', ageReject, 1, { duration: 0.35, after: true });
  tweenCue(s, c, 'no-authority', noAuth, 1, { duration: 0.35 });
  tweenCue(s, c, 'credentials-policy', credsPol, 1, { duration: 0.35 });
  tweenCue(s, c, 'human-review', humanRev, 1, { duration: 0.35 });
}
