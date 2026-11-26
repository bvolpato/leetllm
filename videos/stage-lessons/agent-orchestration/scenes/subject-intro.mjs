// Scene 01 (subject-intro): "Can the new search ranker take more traffic?"
// Full-bleed orbiting 3D multi-agent DAG + live rollout dial + parallel branch meters + cost decision tracks.
import {
  COSMOS,
  DURATIONS,
  INITIAL_AGE_S,
  REQUEST,
  ROLE,
  buildOrchestrationDag3d,
  cinemaAtmosphere,
  crossSwap,
  glowArrow,
  glowDot,
  guardedDynamic,
  heroTitle,
  line,
  lumBar,
  orbitScene,
  renderArcDial,
  renderGauge,
  rule,
  runAmbientPhase,
  tweenCue,
  txt,
  values,
} from '../parts.mjs';

export default function subjectIntro(s, c) {
  const phase = s.value(0);
  const modeRollout = s.value(1);
  const modeCost = s.value(0);

  // Beat 0: Rollout question + two known receipts + withheld policy ceiling
  const dialLevel = s.value(0.25);
  const evalLit = s.value(0);
  const healthLit = s.value(0);
  const policyReveal = s.value(0);

  // Beat 1: DAG flow highlights
  const dagStage = s.value(0);
  const traceWorkers = s.value(0);
  const branchesLit = s.value(0);
  const reuniteLit = s.value(0);
  const revAgeLit = s.value(0);
  const staleWarn = s.value(0);
  const ownedLit = s.value(0);
  const arrowsLit = s.value(0);
  const joinWaits = s.value(0);
  const validatedLit = s.value(0);
  const proposalLit = s.value(0);
  const writerLit = s.value(0);
  const approvalLit = s.value(0);

  // Beat 2: Timing + revision check
  const timingLit = s.value(0);
  const revV3Lit = s.value(0);

  // Beat 3: Earn-their-cost decision tracks
  const caseResearch = s.value(0);
  const resResearch = s.value(0);
  const caseEtl = s.value(0);
  const etlDeadline = s.value(0);
  const resEtl = s.value(0);
  const caseCoupled = s.value(0);
  const resCoupled = s.value(0);
  const costWarn = s.value(0);
  const measureLit = s.value(0);

  const bgAtmo = cinemaAtmosphere(ROLE.eval, ROLE.health);
  const { view: dag3d } = buildOrchestrationDag3d(phase, dagStage, {
    x: 470,
    y: -35,
    theta: -0.7,
    phi: 1.05,
    distance: 15.0,
    unit: 106,
  });

  const title = heroTitle(['Can the Search Ranker', 'Take More Traffic?'], {
    x: -860,
    y: -440,
    size: 54,
    lineHeight: 62,
    accent: ROLE.eval,
    eyebrow: `AGENT ORCHESTRATION  /  ${REQUEST.request}  /  ${REQUEST.tenant}`,
  });

  const live = guardedDynamic(s.value(1), () => {
    const m0 = modeRollout.value;
    const m1 = modeCost.value;
    const nodes = [];

    // Right column persistent 3D DAG legend & status strip (always populated from t=0)
    nodes.push(
      txt('3D MULTI-AGENT DAG TOPOLOGY', 470, -425, 26, ROLE.eval, 'mono').glow(6, ROLE.eval),
      txt(
        'Triage -> Eval / Health / Policy -> Merge -> Review -> Writer',
        470,
        -380,
        26,
        COSMOS.muted,
        'sans',
      ),
    );

    if (m0 > 0.02) {
      const lx = -860;
      const pRev = policyReveal.value;
      const eLit = evalLit.value;
      const hLit = healthLit.value;

      // Top-left dial: 25% requested traffic share + withheld policy cap marker
      const dialCx = -715;
      const dialCy = -75;
      nodes.push(
        ...renderArcDial(dialCx, dialCy, 112, dialLevel.value, {
          color: proposalLit.value > 0.4 ? ROLE.mark : ROLE.eval,
          capFraction: pRev > 0.2 ? 0.25 : null,
          capColor: ROLE.policy,
          opacity: m0,
        }),
        txt(`${REQUEST.traffic}%`, dialCx, dialCy - 10, 48, COSMOS.ink, 'mono')
          .glow(8, ROLE.eval)
          .opacity(m0),
        txt('REQUESTED', dialCx, dialCy + 42, 26, COSMOS.muted, 'mono').opacity(m0),
      );
      if (pRev > 0.02) {
        nodes.push(
          txt('CAP 25%', dialCx, dialCy + 96, 26, ROLE.policy, 'mono')
            .glow(6, ROLE.policy)
            .opacity(m0 * pRev),
        );
      } else {
        nodes.push(
          txt('LIMIT ?', dialCx, dialCy + 96, 26, ROLE.mark, 'mono')
            .glow(6, ROLE.mark)
            .opacity(m0 * (1 - pRev)),
        );
      }

      // Three branch receipt gauges to the right of the dial
      const gx = -545;
      const gw = 580;
      const rows = [
        {
          y: -185,
          label: `EVAL ${values.eval.failures}/${values.eval.cases} (2%)`,
          sub: timingLit.value > 0.3 ? '2.0 s' : revV3Lit.value > 0.3 ? 'v3  10 s' : 'PASS <= 3%',
          level: 0.56,
          cap: 0.84,
          col: ROLE.eval,
          lit: Math.max(eLit, branchesLit.value, ownedLit.value),
        },
        {
          y: -60,
          label: `HEALTH ${values.health.errors}/10k (0.04%)`,
          sub: timingLit.value > 0.3 ? '3.0 s' : revV3Lit.value > 0.3 ? 'v3  10 s' : 'PASS <= 0.1%',
          level: 0.34,
          cap: 0.84,
          col: ROLE.health,
          lit: Math.max(hLit, branchesLit.value, ownedLit.value),
        },
        {
          y: 65,
          label: pRev > 0.3 ? `POLICY cap ${values.policy.maxTraffic}%` : 'POLICY ???',
          sub:
            pRev > 0.3
              ? timingLit.value > 0.3
                ? '1.0 s'
                : revV3Lit.value > 0.3
                  ? 'v3  10 s'
                  : 'EXACT CAP'
              : 'What limits rollout?',
          level: pRev > 0.3 ? 0.84 : 0.08,
          cap: 0.84,
          col: pRev > 0.3 ? ROLE.policy : ROLE.mark,
          lit: Math.max(pRev, branchesLit.value, ownedLit.value),
        },
      ];
      rows.forEach((r) => {
        const g = renderGauge(gx, r.y, gw, 24, r.level, {
          cap: r.cap,
          color: r.col,
          limitColor: r.lit > 0.4 ? COSMOS.ink : COSMOS.muted,
          opacity: m0,
        });
        nodes.push(
          ...g.nodes,
          txt(r.label, gx, r.y - 46, 26, r.lit > 0.4 ? r.col : COSMOS.ink, 'mono', 'left')
            .glow(r.lit > 0.4 ? 6 : 0, r.col)
            .opacity(m0),
          txt(r.sub, gx + gw, r.y - 46, 26, COSMOS.muted, 'mono', 'right').opacity(m0),
        );
      });

      // Bottom-left pipeline strip: Workers -> Join -> Proposal -> Review -> Writer
      const py = 250;
      const stages = [
        {
          x: -785,
          label: '3 READS',
          sub: traceWorkers.value > 0.3 ? 'independent' : 'v3',
          col: ROLE.eval,
          hot: Math.max(traceWorkers.value, branchesLit.value, ownedLit.value),
        },
        {
          x: -505,
          label: 'JOIN',
          sub:
            validatedLit.value > 0.3
              ? 'validated'
              : joinWaits.value > 0.3
                ? 'waits all 3'
                : 'fan-in',
          col: validatedLit.value > 0.3 ? ROLE.pass : ROLE.merge,
          hot: Math.max(reuniteLit.value, joinWaits.value, validatedLit.value),
        },
        {
          x: -225,
          label: 'PROPOSAL',
          sub: proposalLit.value > 0.3 ? '25% / v3' : '1 packet',
          col: ROLE.mark,
          hot: proposalLit.value,
        },
        {
          x: 65,
          label: 'REVIEW',
          sub: approvalLit.value > 0.3 ? 'approved' : 'human gate',
          col: ROLE.review,
          hot: approvalLit.value,
        },
        {
          x: 365,
          label: 'WRITER',
          sub: writerLit.value > 0.3 ? 'traffic only' : 'isolated',
          col: ROLE.writer,
          hot: Math.max(writerLit.value, approvalLit.value),
        },
      ];
      stages.forEach((st, i) => {
        const active = st.hot > 0.35;
        nodes.push(
          lumBar(st.x, py, 204, 72, {
            color: st.col,
            fillOpacity: active ? 0.24 : 0.1,
            strokeWidth: active ? 3 : 2,
            glow: active ? 11 : 4,
            opacity: m0,
          }),
          txt(st.label, st.x, py, 26, active ? COSMOS.ink : st.col, 'mono').opacity(m0),
          txt(st.sub, st.x, py + 58, 26, COSMOS.muted, 'sans').opacity(m0),
        );
        if (i < stages.length - 1) {
          const arrCol = arrowsLit.value > 0.4 ? ROLE.mark : COSMOS.muted;
          nodes.push(
            glowArrow([st.x + 110, py], [stages[i + 1].x - 110, py], arrCol, {
              width: arrowsLit.value > 0.4 ? 4 : 2.6,
              glow: arrowsLit.value > 0.4 ? 9 : 3,
              opacity: m0,
            }),
          );
        }
      });

      // Bottom-left metadata / timing telemetry readout (no overlap, sequential)
      const infoY = 395;
      if (timingLit.value > 0.3) {
        nodes.push(
          txt(
            `Parallel reads: 1 s / 2 s / 3 s  (v${REQUEST.version}, age ${INITIAL_AGE_S} s)`,
            lx,
            infoY,
            28,
            ROLE.mark,
            'mono',
            'left',
          )
            .glow(6, ROLE.mark)
            .opacity(m0 * timingLit.value),
        );
      } else if (revAgeLit.value > 0.3) {
        nodes.push(
          txt(
            staleWarn.value > 0.3
              ? `Each receipt tags revision v${REQUEST.version} and age ${INITIAL_AGE_S} s`
              : `Each receipt stamps revision v${REQUEST.version}`,
            lx,
            infoY,
            28,
            ROLE.eval,
            'mono',
            'left',
          ).opacity(m0 * revAgeLit.value),
        );
      } else {
        nodes.push(
          txt(
            'Scope: tenant7  |  release r17  |  version 3  |  target 25%',
            lx,
            infoY,
            26,
            COSMOS.muted,
            'mono',
            'left',
          ).opacity(m0 * (1 - Math.max(revAgeLit.value, timingLit.value))),
        );
      }

      // Bottom-right live status under 3D rig
      nodes.push(
        txt(
          writerLit.value > 0.4
            ? 'Writer mutates traffic only after explicit approval'
            : 'Independent read branches feed one validated merge',
          470,
          395,
          26,
          writerLit.value > 0.4 ? ROLE.pass : COSMOS.muted,
          'sans',
        ).opacity(m0),
      );
    }

    // Beat 3: "Decide whether extra agents earn their cost" (drawn tracks, zero bullet cards)
    if (m1 > 0.02) {
      const lx = -860;
      const topY = -205;
      nodes.push(
        txt('WHEN DO EXTRA AGENTS EARN THEIR COST?', lx, topY, 28, ROLE.mark, 'mono', 'left')
          .glow(6, ROLE.mark)
          .opacity(m1),
        rule(lx, topY + 26, 20, topY + 26, ROLE.rule, 2).opacity(m1),
      );

      // Track 1: Independent semantic research -> Specialists
      const y1 = -105;
      const r1 = caseResearch.value;
      const a1 = resResearch.value;
      nodes.push(
        txt(
          '1. Independent semantic research',
          lx,
          y1,
          28,
          r1 > 0.3 ? COSMOS.ink : COSMOS.muted,
          'sans',
          'left',
        ).opacity(m1),
        lumBar(lx + 75, y1 + 48, 150, 18, {
          color: ROLE.eval,
          fillOpacity: 0.65,
          glow: 6,
          opacity: m1 * Math.max(0.25, r1),
        }),
        lumBar(lx + 245, y1 + 48, 150, 18, {
          color: ROLE.health,
          fillOpacity: 0.65,
          glow: 6,
          opacity: m1 * Math.max(0.25, r1),
        }),
        lumBar(lx + 415, y1 + 48, 150, 18, {
          color: ROLE.policy,
          fillOpacity: 0.65,
          glow: 6,
          opacity: m1 * Math.max(0.25, r1),
        }),
      );
      if (a1 > 0.02) {
        nodes.push(
          txt('-> Bounded specialists', -330, y1 + 48, 28, ROLE.pass, 'mono', 'left')
            .glow(6, ROLE.pass)
            .opacity(m1 * a1),
        );
      }

      // Track 2: Independent deterministic ETL (6s serial vs 4s deadline) -> Parallel code
      const y2 = 45;
      const r2 = caseEtl.value;
      const dl = etlDeadline.value;
      const a2 = resEtl.value;
      const barLeft = lx;
      const scale = 72; // px per second
      nodes.push(
        txt(
          '2. Deterministic ETL (6 s serial)',
          lx,
          y2,
          28,
          r2 > 0.3 ? COSMOS.ink : COSMOS.muted,
          'sans',
          'left',
        ).opacity(m1),
        lumBar(
          barLeft + (DURATIONS.serialReads * scale) / 2,
          y2 + 48,
          DURATIONS.serialReads * scale,
          22,
          {
            color: dl > 0.3 ? ROLE.reject : ROLE.triage,
            fillOpacity: 0.55,
            glow: 7,
            opacity: m1 * Math.max(0.25, r2),
          },
        ),
      );
      if (dl > 0.02) {
        const dlX = barLeft + DURATIONS.deadline * scale;
        nodes.push(
          line([dlX, y2 + 28], [dlX, y2 + 72], { stroke: ROLE.mark, width: 4 })
            .glow(8, ROLE.mark)
            .opacity(m1 * dl),
          txt('4 s deadline', dlX + 14, y2 + 86, 26, ROLE.mark, 'mono', 'left').opacity(m1 * dl),
        );
      }
      if (a2 > 0.02) {
        nodes.push(
          txt('-> Parallel code', -330, y2 + 48, 28, ROLE.eval, 'mono', 'left')
            .glow(6, ROLE.eval)
            .opacity(m1 * a2),
        );
      }

      // Track 3: Coupled edits sharing evolving trace -> One scoped agent
      const y3 = 205;
      const r3 = caseCoupled.value;
      const a3 = resCoupled.value;
      nodes.push(
        txt(
          '3. Coupled edits (shared trace)',
          lx,
          y3,
          28,
          r3 > 0.3 ? COSMOS.ink : COSMOS.muted,
          'sans',
          'left',
        ).opacity(m1),
        glowDot(lx + 40, y3 + 48, {
          radius: 9,
          color: ROLE.policy,
          glow: 8,
          opacity: m1 * Math.max(0.25, r3),
        }),
        glowArrow([lx + 60, y3 + 48], [lx + 185, y3 + 48], ROLE.policy, {
          width: 3,
          opacity: m1 * Math.max(0.25, r3),
        }),
        glowDot(lx + 210, y3 + 48, {
          radius: 9,
          color: ROLE.policy,
          glow: 8,
          opacity: m1 * Math.max(0.25, r3),
        }),
        glowArrow([lx + 230, y3 + 48], [lx + 355, y3 + 48], ROLE.policy, {
          width: 3,
          opacity: m1 * Math.max(0.25, r3),
        }),
        glowDot(lx + 380, y3 + 48, {
          radius: 9,
          color: ROLE.policy,
          glow: 8,
          opacity: m1 * Math.max(0.25, r3),
        }),
      );
      if (a3 > 0.02) {
        nodes.push(
          txt('-> One scoped agent', -330, y3 + 48, 28, ROLE.policy, 'mono', 'left')
            .glow(6, ROLE.policy)
            .opacity(m1 * a3),
        );
      }

      // Bottom token cost + measurement gauge
      const cy = 355;
      const cGauge = renderGauge(lx, cy, 760, 26, costWarn.value > 0.3 ? 0.88 : 0.32, {
        cap: 0.65,
        color: ROLE.eval,
        overColor: ROLE.reject,
        opacity: m1,
      });
      nodes.push(
        ...cGauge.nodes,
        txt(
          measureLit.value > 0.3
            ? 'MEASURE: latency saved vs extra token cost'
            : 'Extra contexts multiply prompt token cost',
          lx,
          cy + 46,
          28,
          measureLit.value > 0.3 ? ROLE.mark : costWarn.value > 0.3 ? ROLE.reject : COSMOS.muted,
          'mono',
          'left',
        ).opacity(m1),
        txt(
          'Only split when independent work earns its overhead',
          470,
          395,
          26,
          COSMOS.muted,
          'sans',
        ).opacity(m1),
      );
    }

    return nodes;
  });

  s.add(bgAtmo, dag3d, title, live);
  runAmbientPhase(s, c, phase, 2.4);
  orbitScene(s, c, dag3d, { theta: 0.35, phi: 0.98 });

  // Beat 0: Rollout setup (withhold policy answer until c.after('policy-answer')!)
  tweenCue(s, c, 'requested-share', dialLevel, 0.25, { duration: 0.35 });
  tweenCue(s, c, 'eval-question', evalLit, 1, { duration: 0.35 });
  tweenCue(s, c, 'health-question', healthLit, 1, { duration: 0.35 });

  // Beat 1: Reveal policy answer AFTER cue, then trace DAG
  tweenCue(s, c, 'policy-answer', policyReveal, 1, { duration: 0.4, after: true });
  tweenCue(s, c, 'trace-workers', traceWorkers, 1, { duration: 0.35 });
  tweenCue(s, c, 'read-branches', branchesLit, 1, { duration: 0.35 });
  tweenCue(s, c, 'receipts-reunite', reuniteLit, 1, { duration: 0.35 });
  tweenCue(s, c, 'danger-mixed', revAgeLit, 1, { duration: 0.35 });
  tweenCue(s, c, 'danger-stale', staleWarn, 1, { duration: 0.35 });
  tweenCue(s, c, 'owned-results', ownedLit, 1, { duration: 0.35 });
  tweenCue(s, c, 'explicit', arrowsLit, 1, { duration: 0.35 });
  tweenCue(s, c, 'join-waits', joinWaits, 1, { duration: 0.35 });
  tweenCue(s, c, 'validated-join', validatedLit, 1, { duration: 0.35 });
  c.after('one-proposal', () => {
    s.play(proposalLit.to(1, { duration: 0.35 }), dagStage.to(1, { duration: 0.4 }));
  });
  tweenCue(s, c, 'separate-boundary', writerLit, 1, { duration: 0.35 });
  tweenCue(s, c, 'after-review', approvalLit, 1, { duration: 0.35, after: true });

  // Beat 2: Timing & revision check
  tweenCue(s, c, 'traffic-proposal', dialLevel, 0.25, { duration: 0.25 });
  tweenCue(s, c, 'timing-example', timingLit, 1, { duration: 0.35 });
  tweenCue(s, c, 'same-action', revV3Lit, 1, { duration: 0.35 });

  // Beat 3: Cross-swap to decision criteria tracks
  crossSwap(s, c, 'subject-intro-construct-3', modeRollout, modeCost, { duration: 0.44 });
  tweenCue(s, c, 'case-research', caseResearch, 1, { duration: 0.3 });
  tweenCue(s, c, 'research-result', resResearch, 1, { duration: 0.3, after: true });
  tweenCue(s, c, 'case-etl', caseEtl, 1, { duration: 0.3 });
  tweenCue(s, c, 'etl-deadline', etlDeadline, 1, { duration: 0.3 });
  tweenCue(s, c, 'etl-result', resEtl, 1, { duration: 0.3, after: true });
  tweenCue(s, c, 'case-coupled', caseCoupled, 1, { duration: 0.3 });
  tweenCue(s, c, 'coupled-result', resCoupled, 1, { duration: 0.3, after: true });
  tweenCue(s, c, 'extra-cost', costWarn, 1, { duration: 0.35 });
  tweenCue(s, c, 'measure', measureLit, 1, { duration: 0.35 });
}
