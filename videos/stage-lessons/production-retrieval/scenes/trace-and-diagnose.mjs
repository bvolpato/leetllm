// Scene 17 (trace-and-diagnose): "Keep a trace that locates a failed promise"
// Luminous end-to-end request trace spine linking caller scope, pinned bundle, candidates, parent,
// context, and claim, with an animated diagnostic probe localizing all 3 causal failure stages.
import { dynamic, group, line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  RUN,
  callerTag,
  cinemaAtmosphere,
  glowDot,
  glowRing,
  heroTitle,
  lumBar,
  playCue,
  runPhase,
  statusPill,
  txt,
  versionedBundle,
} from '../parts.mjs';

export default function traceAndDiagnose(s, c) {
  const bundle = versionedBundle();

  const phase = s.value(0);
  // Diagnostic mode: 0 = healthy full trace, 1 = candidate miss, 2 = parent miss, 3 = claim/limit failure
  const diagMode = s.value(0);
  const probeStage = s.value(0); // 0..3 index along [Candidates, Parent, Context, Claim]

  const title = heroTitle(['Keep a Trace That', 'Locates the Failure'], {
    x: -855,
    y: -440,
    size: 52,
    lineHeight: 62,
    accent: ROLE.policy,
    eyebrow: 'CAUSAL FAILURE ATTRIBUTION · COMPACT REQUEST TRACE',
  });

  const stageXs = [-520, -170, 180, 530];
  const stageNames = ['1. CANDIDATES', '2. PARENT', '3. CONTEXT', '4. CLAIM'];

  const live = dynamic(() => {
    const p = phase.value;
    const pulse = 0.8 + 0.2 * Math.sin(p * 3.0);
    const dm = Math.round(diagMode.value);
    const ps = probeStage.value;

    const nodes = [callerTag(1)];

    // Top: Compact Request Trace Telemetry Strip (no sensitive corpus dump!)
    const traceFields = [
      { key: 'caller scope', val: `${RUN.caller.id} / EU`, ok: true },
      { key: 'pinned index', val: bundle.bundle.childIndex, ok: true },
      {
        key: 'candidate',
        val: dm === 1 ? 'MISSING RULE' : RUN.hits[0].record.id,
        state: dm === 1 ? 'fail' : 'pass',
      },
      {
        key: 'parent',
        val: dm === 1 ? 'not resolved' : dm === 2 ? 'MISSING PARENT' : RUN.packed[0].parentId,
        state: dm === 1 ? 'skip' : dm === 2 ? 'fail' : 'pass',
      },
      {
        key: 'context',
        val: dm === 1 || dm === 2 ? 'not packed' : 'E1 · complete rule',
        state: dm === 1 || dm === 2 ? 'skip' : 'pass',
      },
      {
        key: 'claim',
        val:
          dm === 1 || dm === 2 ? 'not released' : dm === 3 ? 'INVENTED LIMIT' : RUN.answer.decision,
        state: dm === 1 || dm === 2 ? 'skip' : dm === 3 ? 'fail' : 'pass',
      },
    ];

    traceFields.forEach((f, i) => {
      const colIdx = i % 3;
      const rowIdx = Math.floor(i / 3);
      const cx = -565 + colIdx * 565;
      const cy = -182 + rowIdx * 124;
      const col =
        f.state === 'fail'
          ? ROLE.danger
          : f.state === 'skip'
            ? COSMOS.dim
            : f.state === 'pass'
              ? ROLE.admitted
              : ROLE.policy;
      nodes.push(
        lumBar(cx, cy, 525, 96, {
          color: col,
          fillAlpha: f.state === 'fail' ? 0.18 : 0.07,
          strokeWidth: f.state === 'fail' ? 2.6 : 1.8,
          glow: f.state === 'fail' ? 11 * pulse : 4,
          radius: 12,
        }),
        txt(f.key.toUpperCase(), cx - 235, cy - 22, 26, COSMOS.muted, 'mono', 'left'),
        txt(f.val, cx - 235, cy + 20, 28, col, 'mono', 'left').glow(
          f.state === 'fail' ? 7 : 0,
          col,
        ),
      );
    });

    // Lower: 4-Stage Causal Diagnostic Spine
    const spineY = 178;
    nodes.push(line([-740, spineY], [740, spineY], { stroke: '#2c3d63', width: 4.5 }));

    stageXs.forEach((sx, i) => {
      const isFail = (dm === 1 && i === 0) || (dm === 2 && i === 1) || (dm === 3 && i === 3);
      const isPass = dm === 0 || (dm === 2 && i === 0) || (dm === 3 && i < 3);
      const col = isFail ? ROLE.danger : isPass ? ROLE.admitted : COSMOS.dim;

      nodes.push(
        glowRing(sx, spineY, 34, col, {
          width: 3.4,
          glow: (isFail ? 13 : 8) * pulse,
          fillAlpha: isFail ? 0.22 : 0.1,
        }),
        glowDot(sx, spineY, { radius: 10, color: col, glow: 12 }),
        txt(stageNames[i], sx, spineY - 80, 26, col, 'mono', 'center'),
      );

      if (isFail) {
        const inspectLbl =
          i === 0
            ? 'INSPECT INGESTION & RANKING'
            : i === 1
              ? 'INSPECT VERSION / ACL / BUDGET'
              : 'REPLAY GENERATION & CLAIM CHECK';
        nodes.push(
          statusPill(inspectLbl, sx, spineY + 88, {
            color: ROLE.danger,
            width: 495,
            height: 48,
          }),
        );
      }
    });

    // Animated glowing probe photon sliding along the spine
    const clamped = Math.max(0, Math.min(3, ps));
    const i0 = Math.floor(Math.min(2.999, clamped));
    const px = stageXs[i0] + (stageXs[i0 + 1] - stageXs[i0]) * (clamped - i0);
    nodes.push(
      glowRing(px, spineY, 46, ROLE.focus, { width: 2.6, glow: 10 * pulse, fillAlpha: 0 }),
    );

    // Bottom discrete diagnosis
    const footMap = [
      {
        text: 'Locate the earliest broken stage before tuning the model or prompt',
        col: ROLE.policy,
      },
      {
        text: 'Rule absent from candidates  ->  inspect ingestion, chunking & ranking',
        col: ROLE.warn,
      },
      {
        text: 'Child found, parent missing  ->  inspect bundle version, ACL & budget',
        col: ROLE.danger,
      },
      {
        text: 'Complete E1 reached model, limit invented  ->  replay generation & claim check',
        col: ROLE.focus,
      },
    ];
    const ft = footMap[Math.max(0, Math.min(footMap.length - 1, dm))];
    nodes.push(txt(ft.text, -855, 415, 28, ft.col, 'mono', 'left').glow(7, ft.col));

    return group(...nodes);
  });

  s.add(cinemaAtmosphere(ROLE.policy, ROLE.request), title, live);
  runPhase(s, c, phase, 14);

  playCue(
    s,
    c,
    'trace-request',
    (d) => s.play(diagMode.to(0, { duration: 0.05 }), probeStage.to(3, { duration: d })),
    { dur: 1.0 },
  );
  playCue(
    s,
    c,
    'candidate-miss',
    (d) => s.play(diagMode.to(1, { duration: 0.05 }), probeStage.to(0, { duration: d })),
    { dur: 0.75 },
  );
  playCue(
    s,
    c,
    'parent-miss',
    (d) => s.play(diagMode.to(2, { duration: 0.05 }), probeStage.to(1, { duration: d })),
    { dur: 0.75 },
  );
  playCue(
    s,
    c,
    'replay-context',
    (d) => s.play(diagMode.to(3, { duration: 0.05 }), probeStage.to(3, { duration: d })),
    { dur: 0.85 },
  );
}
