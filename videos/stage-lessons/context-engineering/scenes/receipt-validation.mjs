// Scene 23: receipt-validation: "Validate the entire graph and exact receipt contract"
// Five structural & cryptographic defenses checked before resuming:
// B0: Graph structure & cycle check (even among tasks labeled done)
// B1: Exact receipt metadata (evaluator, version, Boolean passed===true) & exact input-set equality
// B2: Relative checkpoint-root path containment (reject ../ escape)
import {
  COSMOS,
  ROLE,
  aura,
  checkMark,
  chip,
  cornerBrackets,
  crossMark,
  ease,
  group,
  guardedDynamic,
  heroTitle,
  playCue,
  txt,
} from '../parts.mjs';

export default function receiptValidation(s, c) {
  const showGraph = s.value(0.35);
  const showCycle = s.value(0);
  const showReceipt = s.value(0);
  const showInputSet = s.value(0);
  const showPath = s.value(0);

  const bgAura = aura(0, 20, 820, '#2c142626', '#14335c28');
  const title = heroTitle(['Validate the graph &', 'exact receipt contract'], {
    x: -855,
    y: -435,
    size: 50,
    lineHeight: 58,
    accent: ROLE.poison,
  });

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const gr = ease(showGraph.value);
    const cy = ease(showCycle.value);
    const rc = ease(showReceipt.value);
    const is = ease(showInputSet.value);
    const pt = ease(showPath.value);

    const nodes = [
      // Band 1 (Top): Graph Validation
      cornerBrackets(0, -160, 1710, 160, cy > 0.3 ? ROLE.poison : ROLE.evidence, {
        arm: 26,
        width: 2.8,
        opacity: alpha * (0.65 + 0.35 * gr),
      }),
      txt(
        '1. GRAPH INTEGRITY BEFORE TRUSTING "done"',
        -820,
        -202,
        26,
        ROLE.evidence,
        'mono',
        'left',
      ).opacity(alpha),
      chip('Unique IDs & valid status', -570, -125, {
        color: ROLE.note,
        size: 26,
        minW: 440,
        opacity: alpha,
      }),
      chip('All deps verified done', -40, -125, {
        color: ROLE.note,
        size: 26,
        minW: 410,
        opacity: alpha,
      }),
      chip(cy > 0.3 ? 'CYCLE IN DONE TASKS -> REJECT' : 'Acyclic DAG check', 520, -125, {
        color: cy > 0.3 ? ROLE.poison : ROLE.units,
        size: 26,
        minW: 510,
        glow: cy > 0.3 ? 12 : 6,
        opacity: alpha,
      }),

      // Band 2 (Middle): Exact Receipt Contract & Input Set Equality
      cornerBrackets(0, 45, 1710, 175, is > 0.3 ? ROLE.poison : rc > 0.3 ? ROLE.units : ROLE.rule, {
        arm: 26,
        width: 2.8,
        opacity: alpha * (0.55 + 0.45 * rc),
      }),
      txt(
        '2. EXACT RECEIPT CONTRACT & INPUT-SET EQUALITY',
        -820,
        -5,
        26,
        rc > 0.3 ? ROLE.units : COSMOS.muted,
        'mono',
        'left',
      ).opacity(alpha * (0.55 + 0.45 * rc)),
      txt(
        'task == id   |   evaluator == incident-evidence-check   |   contract == v1   |   passed === true',
        -820,
        48,
        27,
        COSMOS.ink,
        'mono',
        'left',
      ).opacity(alpha * (0.55 + 0.45 * rc)),
      is > 0.3
        ? crossMark(-795, 102, 22, ROLE.poison, alpha * is)
        : checkMark(-795, 102, 22, ROLE.note, alpha * (0.45 + 0.55 * rc)),
      txt(
        is > 0.3
          ? 'keys(manifest.inputs) != keys(receipt.inputSha256) -> FAIL even if old hashes match!'
          : 'Recompute artifact SHA-256 + every declared input SHA-256 (exact set equality)',
        -760,
        102,
        27,
        is > 0.3 ? ROLE.poison : ROLE.note,
        'mono',
        'left',
      ).opacity(alpha * (0.55 + 0.45 * Math.max(rc, is))),

      // Band 3 (Bottom): Path Containment inside Checkpoint Root
      cornerBrackets(0, 250, 1710, 155, pt > 0.3 ? ROLE.poison : ROLE.rule, {
        arm: 26,
        width: 2.8,
        opacity: alpha * (0.55 + 0.45 * pt),
      }),
      txt(
        '3. CHECKPOINT-ROOT PATH CONTAINMENT',
        -820,
        208,
        26,
        pt > 0.3 ? ROLE.poison : COSMOS.muted,
        'mono',
        'left',
      ).opacity(alpha * (0.55 + 0.45 * pt)),
      chip('ALLOWED: ./report.json', -495, 282, {
        color: ROLE.note,
        size: 27,
        minW: 480,
        opacity: alpha * (0.55 + 0.45 * pt),
      }),
      chip('REJECTED: ../etc/secrets', 235, 282, {
        color: pt > 0.3 ? ROLE.poison : ROLE.dim,
        size: 27,
        minW: 510,
        glow: pt > 0.3 ? 12 : 4,
        opacity: alpha * (0.55 + 0.45 * pt),
      }),
      pt > 0.3
        ? crossMark(545, 282, 28, ROLE.poison, alpha * pt)
        : txt('Root-bound open', 655, 282, 26, COSMOS.muted, 'mono', 'center').opacity(alpha * 0.6),

      // Footer
      txt(
        pt > 0.3
          ? 'Enforce relative root bounds at open time; trusted matching hashes certify unchanged bytes.'
          : 'Every graph edge, receipt field, input key, and file path is verified before advancing.',
        0,
        405,
        29,
        COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, layer);

  playCue(s, c, 'ce-receipt-validation-1', (d) => s.play(showGraph.to(1, { duration: d })));
  playCue(s, c, 'ce-graph-cycle', (d) => s.play(showCycle.to(1, { duration: d })));
  playCue(s, c, 'ce-receipt-validation-2', (d) => s.play(showReceipt.to(1, { duration: d })));
  playCue(s, c, 'ce-input-set-error', (d) => s.play(showInputSet.to(1, { duration: d })));
  playCue(s, c, 'ce-receipt-validation-3', (d) => s.play(showPath.to(1, { duration: d })));
}
