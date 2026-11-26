// Scene 11 (transfer): "Three receipts. Can Vega proceed?"
// Grand finale transfer challenge with orbiting 3D DAG rig + 4 cleanly cross-swapped stages:
//   Stage 0 (Beat 0): Independent parallel reads on one ticket vs 3 coupled sequential edits
//   Stage 1 (Beat 1-2): End-to-end provenance trace + readiness board reset
//   Stage 2 (Beat 3): Double prediction transfer challenge (v3/v4/v3 mixed batch -> v3 repair Health vs v4 repair Eval+Policy + duplicate Health rejection) with strict c.after gating!
//   Stage 3 (Beat 4): Live Vega gauge at 0% awaiting review vs separate v4 writer fixture op-18 replay (change-1, effects=1)
import {
  COSMOS,
  REQUEST,
  ROLE,
  buildOrchestrationDag3d,
  cinemaAtmosphere,
  crossSwap,
  freshPacket,
  glowArrow,
  glowDot,
  glowRing,
  guardedDynamic,
  heroTitle,
  line,
  lumBar,
  orbitScene,
  reconciled,
  reconciledEffects,
  recorded,
  recordedEffects,
  renderArcDial,
  rule,
  runAmbientPhase,
  shortHash,
  tweenCue,
  txt,
} from '../parts.mjs';

export default function transfer(s, c) {
  const phase = s.value(0);
  const dagStage = s.value(0.5);
  const st0 = s.value(1); // Beat 0: Independent vs coupled
  const st1 = s.value(0); // Beats 1-2: Provenance trace & board readiness
  const st2 = s.value(0); // Beat 3: v3/v4/v3 double prediction transfer challenge
  const st3 = s.value(0); // Beat 4: Separate v4 writer op-18 replay + live gauge 0%

  // Beat 0
  const ticketLit = s.value(0);
  const stableLit = s.value(0);
  const valResLit = s.value(0);
  const coupledLit = s.value(0);
  const noOverlapLit = s.value(0);

  // Beats 1-2
  const traceLit = s.value(0);
  const askRead = s.value(0);
  const askUpd = s.value(0);
  const branchCon = s.value(0);
  const effBound = s.value(0);
  const curPol = s.value(0);
  const exactApp = s.value(0);
  const repSafe = s.value(0);
  const effRes = s.value(0);
  const liveZero = s.value(0);
  const boardReady = s.value(0);
  const lampReady = s.value(0);
  const revCarry = s.value(0);
  const srcBack = s.value(0);

  // Beat 3: Double prediction transfer challenge (strict c.after gating!)
  const bEval = s.value(0);
  const bHealth = s.value(0);
  const bPolicy = s.value(0);
  const allOk = s.value(0);
  const askOwner = s.value(0);
  const rejMixed = s.value(0); // after fresh-revision-rejection
  const trustTgt = s.value(0);
  const tgtV3Rep = s.value(0); // after revision-three-repair
  const refHealth = s.value(0); // after refresh-branch
  const revalV3 = s.value(0); // after revalidate
  const checkAge = s.value(0); // after check-scope-and-age
  const altV4 = s.value(0); // alternate-target (moves target to v4)
  const askOld2 = s.value(0); // inspect-v4
  const refV4Pair = s.value(0); // after refresh-v4-inputs
  const valV4All = s.value(0); // after validate-v4-inputs
  const rebuildRev = s.value(0); // after rebuild-review
  const dupInput = s.value(0); // fresh-duplicate-input
  const dupReject = s.value(0); // after fresh-duplicate-rejection
  const wrUnchanged = s.value(0); // after writer-unchanged

  // Beat 4: Separate v4 fixture replay
  const awaitRev = s.value(0);
  const fixWriter = s.value(0);
  const fixApp = s.value(0);
  const call1 = s.value(0);
  const replyLost = s.value(0);
  const call2 = s.value(0);
  const repResult = s.value(0); // after replay-result
  const stillZero = s.value(0);
  const capstoneLit = s.value(0);

  const v4Hash = shortHash(freshPacket.evidenceDigest, 8);
  const bgAtmo = cinemaAtmosphere(ROLE.eval, ROLE.writer);
  const { view: dag3d } = buildOrchestrationDag3d(phase, dagStage, {
    x: 540,
    y: 25,
    theta: -0.7,
    phi: 1.05,
    distance: 15.2,
    unit: 98,
  });

  const title = heroTitle(['Three Receipts.', 'Can Vega Proceed?'], {
    x: -860,
    y: -440,
    size: 52,
    lineHeight: 60,
    accent: ROLE.mark,
    eyebrow: `TRANSFER CHALLENGE  /  ${REQUEST.request}  /  END-TO-END`,
  });

  const live = guardedDynamic(s.value(1), () => {
    const m0 = st0.value;
    const m1 = st1.value;
    const m2 = st2.value;
    const m3 = st3.value;
    const lx = -860;
    const nodes = [];

    // Right 3D header & steady invariant (zero crossSwap flash)
    nodes.push(
      txt('LIVE ORCHESTRATION RIG', 540, -420, 26, ROLE.eval, 'mono').glow(6, ROLE.eval),
      txt('Vega live traffic: 0% (awaiting review)', 540, -376, 26, ROLE.mark, 'mono'),
      txt(
        'Trusted scope, validated join, single idempotent writer',
        540,
        395,
        26,
        COSMOS.muted,
        'sans',
      ),
    );

    // =========================================================================
    // STAGE 0 (Beat 0): Independent Parallel Reads vs Coupled Sequential Edits
    // =========================================================================
    if (m0 > 0.02) {
      // Top track: Independent reads sharing one ticket
      nodes.push(
        txt(
          '1. INDEPENDENT READS  (SAME RELEASE TICKET)',
          lx,
          -205,
          26,
          ticketLit.value > 0.3 ? ROLE.eval : COSMOS.muted,
          'mono',
          'left',
        ).opacity(m0),
        rule(lx, -181, 120, -181, ROLE.rule, 2).opacity(m0),
      );
      const reads = [
        { name: 'Eval', y: -125, col: ROLE.eval },
        { name: 'Health', y: -55, col: ROLE.health },
        { name: 'Policy', y: 15, col: ROLE.policy },
      ];
      reads.forEach((r) => {
        nodes.push(
          lumBar(-650, r.y, 410, 44, {
            color: r.col,
            fillOpacity: stableLit.value > 0.3 ? 0.3 : 0.14,
            glow: 7,
            opacity: m0,
          }),
          txt(`${r.name} reads r17 v3`, -650, r.y, 26, COSMOS.ink, 'mono').opacity(m0),
          glowArrow([-435, r.y], [-320, -55], valResLit.value > 0.3 ? ROLE.pass : COSMOS.muted, {
            width: 2.8,
            opacity: m0,
          }),
        );
      });
      nodes.push(
        lumBar(-160, -55, 280, 110, {
          color: valResLit.value > 0.3 ? ROLE.pass : ROLE.merge,
          fillOpacity: 0.2,
          glow: 10,
          opacity: m0,
        }),
        txt('JOIN CHECKS', -160, -72, 26, ROLE.pass, 'mono').opacity(m0),
        txt('1 ticket (v3)', -160, -34, 26, COSMOS.ink, 'mono').opacity(m0),
      );

      // Bottom track: Coupled edits staircase
      const cy = 145;
      nodes.push(
        txt(
          '2. COUPLED EDITS  (SERIAL DEPENDENCY)',
          lx,
          cy - 30,
          26,
          coupledLit.value > 0.3 ? ROLE.policy : COSMOS.muted,
          'mono',
          'left',
        ).opacity(m0),
        rule(lx, cy - 6, 120, cy - 6, ROLE.rule, 2).opacity(m0),
        lumBar(-725, cy + 56, 260, 46, { color: ROLE.policy, fillOpacity: 0.24, opacity: m0 }),
        txt('Edit 1', -725, cy + 56, 26, COSMOS.ink, 'mono').opacity(m0),
        glowArrow([-585, cy + 56], [-510, cy + 106], ROLE.policy, { width: 3.0, opacity: m0 }),
        lumBar(-370, cy + 116, 260, 46, { color: ROLE.policy, fillOpacity: 0.24, opacity: m0 }),
        txt('Edit 2 (waits 1)', -370, cy + 116, 26, COSMOS.ink, 'mono').opacity(m0),
        glowArrow([-230, cy + 116], [-155, cy + 166], ROLE.policy, { width: 3.0, opacity: m0 }),
        lumBar(-15, cy + 176, 260, 46, {
          color: noOverlapLit.value > 0.3 ? ROLE.reject : ROLE.policy,
          fillOpacity: 0.24,
          opacity: m0,
        }),
        txt('Edit 3 (waits 2)', -15, cy + 176, 26, COSMOS.ink, 'mono').opacity(m0),
        txt(
          noOverlapLit.value > 0.3
            ? 'Starting earlier still waits'
            : 'Each edit depends on prior output',
          lx,
          cy + 176,
          26,
          noOverlapLit.value > 0.3 ? ROLE.reject : COSMOS.muted,
          'sans',
          'left',
        ).opacity(m0),
      );
    }

    // =========================================================================
    // STAGE 1 (Beats 1-2): End-to-End Provenance + Readiness Lamps
    // =========================================================================
    if (m1 > 0.02) {
      nodes.push(
        txt(
          boardReady.value > 0.3 ? 'BOARD READY FOR NEW BATCH' : 'PROVENANCE & WRITER CONTRACT',
          lx,
          -205,
          26,
          ROLE.eval,
          'mono',
          'left',
        ).opacity(m1),
        rule(lx, -181, 120, -181, ROLE.rule, 2).opacity(m1),
      );

      // 4-step provenance chain
      const steps = [
        [
          '1. Branch read',
          'Read r17 & return own receipt only',
          Math.max(traceLit.value, askRead.value, askUpd.value),
          ROLE.eval,
        ],
        [
          '2. Validated join',
          'Check actual release & revision read',
          Math.max(branchCon.value, lampReady.value, revCarry.value),
          ROLE.merge,
        ],
        [
          '3. Guarded writer',
          'Current policy + exact packet approval',
          Math.max(effBound.value, curPol.value, exactApp.value),
          ROLE.writer,
        ],
        [
          '4. Lost reply',
          'Reconcile same op-key at destination',
          Math.max(repSafe.value, effRes.value, srcBack.value),
          ROLE.mark,
        ],
      ];
      steps.forEach(([k, v, lit, col], i) => {
        const y = -115 + i * 74;
        nodes.push(
          glowRing(lx + 18, y, 14, lit > 0.3 ? col : COSMOS.dim, {
            fillOpacity: lit > 0.3 ? 0.5 : 0.1,
            glow: lit > 0.3 ? 10 : 0,
            opacity: m1,
          }),
          txt(k, lx + 48, y, 26, lit > 0.3 ? col : COSMOS.muted, 'mono', 'left').opacity(m1),
          txt(v, lx + 355, y, 26, lit > 0.3 ? COSMOS.ink : COSMOS.muted, 'sans', 'left').opacity(
            m1,
          ),
        );
      });

      // Live gauge pinned at 0% + Readiness note
      const gy = 225;
      nodes.push(
        ...renderArcDial(-740, gy + 30, 74, 0.01, { color: ROLE.pass, opacity: m1 }),
        txt('0%', -740, gy + 32, 34, liveZero.value > 0.3 ? ROLE.mark : COSMOS.ink, 'mono').opacity(
          m1,
        ),
        txt(
          srcBack.value > 0.3
            ? 'Replacing a receipt -> worker returns to trusted source'
            : lampReady.value > 0.3
              ? 'Last lamp starts join; each receipt carries checked revision'
              : 'Live traffic stays 0% while Vega awaits review',
          -625,
          gy + 32,
          26,
          ROLE.mark,
          'sans',
          'left',
        ).opacity(m1),
      );
    }

    // =========================================================================
    // STAGE 2 (Beat 3): Double Prediction Transfer Challenge (v3/v4/v3 + Dup)
    // =========================================================================
    if (m2 > 0.02) {
      const isAlt = altV4.value > 0.4;
      const isDup = dupInput.value > 0.4;
      const targetStr = isAlt
        ? 'TRUSTED TARGET: v4'
        : tgtV3Rep.value > 0.3
          ? 'TRUSTED TARGET: v3'
          : trustTgt.value > 0.3
            ? 'CHECKING TRUSTED TARGET...'
            : 'MIXED BATCH RECEIVED';

      nodes.push(
        txt(targetStr, lx, -210, 26, isAlt ? ROLE.eval : ROLE.mark, 'mono', 'left').opacity(m2),
        rule(lx, -186, 120, -186, ROLE.rule, 2).opacity(m2),
      );

      // Three incoming batch slots
      const evalRev =
        valV4All.value > 0.4 ? 'v4 (OK)' : refV4Pair.value > 0.4 ? 'v3 -> REFRESH' : 'v3';
      const healthRev = isDup
        ? 'v4 x2 (DUP!)'
        : refHealth.value > 0.4 && !isAlt
          ? 'v3 (REFRESHED)'
          : 'v4';
      const polRev =
        valV4All.value > 0.4 ? 'v4 (OK)' : refV4Pair.value > 0.4 ? 'v3 -> REFRESH' : 'v3';

      const evalCol =
        isAlt && refV4Pair.value > 0.4 && valV4All.value < 0.4
          ? ROLE.reject
          : valV4All.value > 0.4 || (!isAlt && revalV3.value > 0.4)
            ? ROLE.pass
            : ROLE.eval;
      const healthCol = isDup
        ? ROLE.reject
        : !isAlt && rejMixed.value > 0.4 && refHealth.value < 0.4
          ? ROLE.reject
          : refHealth.value > 0.4 && !isAlt
            ? ROLE.pass
            : isAlt && valV4All.value > 0.4
              ? ROLE.pass
              : ROLE.health;
      const polCol =
        isAlt && refV4Pair.value > 0.4 && valV4All.value < 0.4
          ? ROLE.reject
          : valV4All.value > 0.4 || (!isAlt && revalV3.value > 0.4)
            ? ROLE.pass
            : ROLE.policy;

      const batchCards = [
        { name: 'EVAL', rev: evalRev, col: evalCol, y: -115, vis: Math.max(0.3, bEval.value) },
        {
          name: 'HEALTH',
          rev: healthRev,
          col: healthCol,
          y: -25,
          vis: Math.max(0.3, bHealth.value),
        },
        { name: 'POLICY', rev: polRev, col: polCol, y: 65, vis: Math.max(0.3, bPolicy.value) },
      ];
      batchCards.forEach((bc) => {
        nodes.push(
          lumBar(-450, bc.y, 820, 60, {
            color: bc.col,
            fillOpacity: 0.18,
            strokeWidth: 2.6,
            glow: 9,
            opacity: m2 * bc.vis,
          }),
          txt(bc.name, lx + 24, bc.y, 26, bc.col, 'mono', 'left').opacity(m2 * bc.vis),
          txt(bc.rev, -560, bc.y, 28, COSMOS.ink, 'mono', 'left').opacity(m2 * bc.vis),
          txt(
            allOk.value > 0.3 ? 'status: success' : 'arrived',
            -60,
            bc.y,
            26,
            COSMOS.muted,
            'mono',
            'right',
          ).opacity(m2 * bc.vis),
        );
      });

      // Strict prediction / verdict readout strip (mutually exclusive states, zero early reveal!)
      const vy = 185;
      let verdictText = 'Waiting for batch inspection...';
      let verdictCol = COSMOS.muted;

      if (wrUnchanged.value > 0.4) {
        verdictText = 'WRITER UNCHANGED until valid current packet + review exist';
        verdictCol = ROLE.pass;
      } else if (dupReject.value > 0.4) {
        verdictText = 'REJECT DUPLICATE HEALTH: never count 2x as extra evidence';
        verdictCol = ROLE.reject;
      } else if (isDup) {
        verdictText = 'PROBE: Health returned twice under one identity...';
        verdictCol = ROLE.mark;
      } else if (rebuildRev.value > 0.4) {
        verdictText = 'ALL 3 AT v4 -> rebuild proposal for fresh review';
        verdictCol = ROLE.pass;
      } else if (valV4All.value > 0.4) {
        verdictText = 'REVALIDATED ALL 3 v4 RECEIPTS (digest + freshness)';
        verdictCol = ROLE.pass;
      } else if (refV4Pair.value > 0.4) {
        verdictText = 'REFRESH: EVAL & POLICY';
        verdictCol = ROLE.mark;
      } else if (askOld2.value > 0.4 || isAlt) {
        verdictText = 'TARGET MOVED TO v4: Which two receipts are stale? (?)';
        verdictCol = ROLE.mark;
      } else if (checkAge.value > 0.4 || revalV3.value > 0.4) {
        verdictText = 'RECOMPUTE DIGESTS + RECHECK v3 & FRESHNESS';
        verdictCol = ROLE.pass;
      } else if (refHealth.value > 0.4 || tgtV3Rep.value > 0.4) {
        verdictText = 'ANSWER (target v3): REFRESH HEALTH RECEIPT';
        verdictCol = ROLE.pass;
      } else if (rejMixed.value > 0.4) {
        verdictText = 'JOIN REJECTS MIXED v3/v4/v3 -> check trusted target first';
        verdictCol = ROLE.reject;
      } else if (askOwner.value > 0.3) {
        verdictText = 'PREDICT: Who owns the repair? (?)';
        verdictCol = ROLE.mark;
      }

      nodes.push(
        lumBar(-370, vy, 980, 72, {
          color: verdictCol,
          fillOpacity: 0.2,
          strokeWidth: 2.8,
          glow: 10,
          opacity: m2,
        }),
        txt(verdictText, -370, vy, 26, verdictCol, 'mono').opacity(m2),
      );
    }

    // =========================================================================
    // STAGE 3 (Beat 4): Vega 0% Awaiting Review vs Separate v4 Writer Fixture
    // =========================================================================
    if (m3 > 0.02) {
      const rep = repResult.value;
      const lost = replyLost.value;

      // Top lane: Vega's real release (pinned at 0%)
      nodes.push(
        txt(
          'VEGA RELEASE (AWAITING REVIEW)',
          lx,
          -205,
          26,
          awaitRev.value > 0.3 ? ROLE.mark : COSMOS.muted,
          'mono',
          'left',
        ).opacity(m3),
        rule(lx, -181, 120, -181, ROLE.rule, 2).opacity(m3),
        lumBar(-370, -110, 980, 66, {
          color: stillZero.value > 0.3 ? ROLE.pass : ROLE.mark,
          fillOpacity: 0.16,
          glow: 8,
          opacity: m3,
        }),
        txt(
          'Packet parked at Review  |  Live traffic = 0%',
          -370,
          -110,
          28,
          COSMOS.ink,
          'mono',
        ).opacity(m3),
      );

      // Lower lane: Separate v4 Writer Fixture op-18 replay test
      nodes.push(
        txt(
          'SEPARATE WRITER FIXTURE  (v4 APPROVED)',
          lx,
          -10,
          26,
          fixWriter.value > 0.3 ? ROLE.writer : COSMOS.muted,
          'mono',
          'left',
        ).opacity(m3),
        rule(lx, 14, 120, 14, ROLE.rule, 2).opacity(m3),
        lumBar(-710, 130, 300, 145, {
          color: fixApp.value > 0.3 ? ROLE.writer : COSMOS.rule,
          fillOpacity: 0.18,
          opacity: m3,
        }),
        txt('FIXTURE WRITER', -710, 96, 26, ROLE.writer, 'mono').opacity(m3),
        txt(`${recorded.operation}  v4`, -710, 136, 26, COSMOS.ink, 'mono').opacity(m3),
        txt(v4Hash, -710, 174, 26, COSMOS.muted, 'mono').opacity(m3),

        glowArrow([-545, 96], [-290, 96], call1.value > 0.3 ? ROLE.pass : COSMOS.muted, {
          width: 3.2,
          opacity: m3,
        }),
        txt('1. apply', -418, 60, 26, lost > 0.3 ? ROLE.reject : ROLE.pass, 'mono').opacity(m3),

        glowArrow([-545, 162], [-290, 162], call2.value > 0.3 ? ROLE.mark : COSMOS.muted, {
          width: 3.2,
          opacity: m3,
        }),
        txt('2. replay', -418, 200, 26, ROLE.mark, 'mono').opacity(m3),

        lumBar(-55, 130, 440, 145, {
          color: rep > 0.3 ? ROLE.pass : ROLE.triage,
          fillOpacity: 0.2,
          glow: rep > 0.3 ? 12 : 6,
          opacity: m3,
        }),
        txt('TARGET RESULT', -55, 84, 26, COSMOS.muted, 'mono').opacity(m3),
        txt(
          rep > 0.3 ? reconciled.change : call1.value > 0.3 ? 'change-1 (?)' : 'pending...',
          -55,
          126,
          28,
          rep > 0.3 ? ROLE.pass : ROLE.mark,
          'mono',
        )
          .glow(rep > 0.3 ? 8 : 0, ROLE.pass)
          .opacity(m3),
        txt(
          rep > 0.3 ? `effects = ${reconciledEffects}` : 'reply lost?',
          -55,
          168,
          26,
          rep > 0.3 ? ROLE.pass : COSMOS.muted,
          'mono',
        ).opacity(m3),
      );

      if (capstoneLit.value > 0.02) {
        nodes.push(
          txt(
            'Next in Capstone: save exact review packet & test lost-reply replay',
            lx,
            285,
            26,
            ROLE.eval,
            'sans',
            'left',
          ).opacity(m3 * capstoneLit.value),
        );
      }
    }

    return nodes;
  });

  s.add(bgAtmo, dag3d, title, live);
  runAmbientPhase(s, c, phase, 2.8);
  orbitScene(s, c, dag3d, { theta: 0.35, phi: 0.98 });

  // Beat 0
  tweenCue(s, c, 'transfer-construct-0', ticketLit, 1, { duration: 0.3 });
  tweenCue(s, c, 'stable-inputs', stableLit, 1, { duration: 0.3 });
  tweenCue(s, c, 'validation-result', valResLit, 1, { duration: 0.35, after: true });
  tweenCue(s, c, 'coupled-steps', coupledLit, 1, { duration: 0.35 });
  tweenCue(s, c, 'no-overlap', noOverlapLit, 1, { duration: 0.35 });

  // Beat 1
  crossSwap(s, c, 'transfer-construct-1', st0, st1, { duration: 0.42 });
  tweenCue(s, c, 'transfer-construct-1', traceLit, 1, { duration: 0.3 });
  tweenCue(s, c, 'ask-read', askRead, 1, { duration: 0.3 });
  tweenCue(s, c, 'ask-update', askUpd, 1, { duration: 0.3 });
  tweenCue(s, c, 'branch-contract', branchCon, 1, { duration: 0.3 });
  tweenCue(s, c, 'effect-boundary', effBound, 1, { duration: 0.3 });
  tweenCue(s, c, 'current-policy', curPol, 1, { duration: 0.3 });
  tweenCue(s, c, 'exact-approval', exactApp, 1, { duration: 0.3, after: true });
  tweenCue(s, c, 'repeat-safe', repSafe, 1, { duration: 0.3 });
  tweenCue(s, c, 'effect-result', effRes, 1, { duration: 0.3 });
  tweenCue(s, c, 'verify-state', liveZero, 1, { duration: 0.3, after: true });

  // Beat 2
  tweenCue(s, c, 'transfer-construct-2', boardReady, 1, { duration: 0.3 });
  tweenCue(s, c, 'arrow-readiness', lampReady, 1, { duration: 0.3 });
  tweenCue(s, c, 'receipt-identity', revCarry, 1, { duration: 0.3 });
  tweenCue(s, c, 'recovery-meaning', srcBack, 1, { duration: 0.3 });

  // Beat 3: Double prediction transfer challenge (strict c.after gating!)
  crossSwap(s, c, 'transfer-construct-3', st1, st2, { duration: 0.42 });
  tweenCue(s, c, 'transfer-construct-3', bEval, 1, { duration: 0.3 });
  tweenCue(s, c, 'batch-health', bHealth, 1, { duration: 0.3 });
  tweenCue(s, c, 'batch-policy', bPolicy, 1, { duration: 0.3 });
  tweenCue(s, c, 'all-success', allOk, 1, { duration: 0.3 });
  tweenCue(s, c, 'predict-owner', askOwner, 1, { duration: 0.3 });
  tweenCue(s, c, 'fresh-revision-rejection', rejMixed, 1, { duration: 0.35, after: true });
  tweenCue(s, c, 'trusted-target', trustTgt, 1, { duration: 0.3 });
  tweenCue(s, c, 'revision-three-repair', tgtV3Rep, 1, { duration: 0.35, after: true });
  tweenCue(s, c, 'refresh-branch', refHealth, 1, { duration: 0.35, after: true });
  tweenCue(s, c, 'revalidate', revalV3, 1, { duration: 0.35, after: true });
  tweenCue(s, c, 'check-scope-and-age', checkAge, 1, { duration: 0.35, after: true });
  tweenCue(s, c, 'alternate-target', altV4, 1, { duration: 0.35 });
  tweenCue(s, c, 'inspect-v4', askOld2, 1, { duration: 0.3 });
  tweenCue(s, c, 'refresh-v4-inputs', refV4Pair, 1, { duration: 0.35, after: true });
  tweenCue(s, c, 'validate-v4-inputs', valV4All, 1, { duration: 0.35, after: true });
  tweenCue(s, c, 'rebuild-review', rebuildRev, 1, { duration: 0.35, after: true });
  tweenCue(s, c, 'fresh-duplicate-input', dupInput, 1, { duration: 0.3 });
  tweenCue(s, c, 'fresh-duplicate-rejection', dupReject, 1, { duration: 0.35, after: true });
  tweenCue(s, c, 'writer-unchanged', wrUnchanged, 1, { duration: 0.35, after: true });

  // Beat 4: Separate v4 writer fixture replay
  crossSwap(s, c, 'await-review', st2, st3, { duration: 0.42 });
  tweenCue(s, c, 'await-review', awaitRev, 1, { duration: 0.3 });
  tweenCue(s, c, 'fixture-writer', fixWriter, 1, { duration: 0.3 });
  tweenCue(s, c, 'fixture-approval', fixApp, 1, { duration: 0.3 });
  tweenCue(s, c, 'first-call', call1, 1, { duration: 0.3 });
  tweenCue(s, c, 'lost-reply', replyLost, 1, { duration: 0.3 });
  tweenCue(s, c, 'replay-call', call2, 1, { duration: 0.3 });
  c.after('replay-result', () => {
    s.play(repResult.to(1, { duration: 0.35 }), dagStage.to(1, { duration: 0.35 }));
  });
  tweenCue(s, c, 'live-zero', stillZero, 1, { duration: 0.3 });
  tweenCue(s, c, 'capstone-practice', capstoneLit, 1, { duration: 0.3 });
}
