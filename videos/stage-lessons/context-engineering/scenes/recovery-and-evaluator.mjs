// Scene 24: recovery-and-evaluator: "A restart must preserve execution uncertainty and independent checks"
// Top: Separate generator cause proposal vs independent evaluator criteria.
// Bottom: Live operation-key & fencing-token ledger (OPERATION_LEDGER: unknown -> duplicate -> stale fence = 0 effects)
// + restricted receipt-issuer authority.
import {
  COSMOS,
  OPERATION_LEDGER,
  ROLE,
  aura,
  checkMark,
  chip,
  cornerBrackets,
  crossMark,
  ease,
  glowArrow,
  group,
  guardedDynamic,
  heroTitle,
  playCue,
  txt,
} from '../parts.mjs';

export default function recoveryAndEvaluator(s, c) {
  const showEval = s.value(0.35);
  const showOpKey = s.value(0);
  const showFence = s.value(0);
  const showIssuer = s.value(0);

  const bgAura = aura(0, 20, 820, '#14335c2a', '#2c142622');
  const title = heroTitle(['Preserve uncertainty &', 'independent checks'], {
    x: -855,
    y: -435,
    size: 50,
    lineHeight: 58,
    accent: ROLE.units,
  });

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const ev = ease(showEval.value);
    const op = ease(showOpKey.value);
    const fn = ease(showFence.value);
    const is = ease(showIssuer.value);

    const nodes = [
      // Top half: Generator vs Independent Evaluator
      cornerBrackets(-475, -135, 740, 210, ROLE.evidence, {
        arm: 26,
        width: 2.8,
        opacity: alpha * (0.65 + 0.35 * ev),
      }),
      txt('GENERATOR (CAUSE PROPOSAL)', -815, -205, 26, ROLE.evidence, 'mono', 'left').opacity(
        alpha,
      ),
      txt(
        'Cites checked evidence & alternatives',
        -815,
        -145,
        28,
        COSMOS.ink,
        'sans',
        'left',
      ).opacity(alpha),
      txt(
        'Disproven lock absent; rollback = proposal',
        -815,
        -88,
        27,
        COSMOS.muted,
        'sans',
        'left',
      ).opacity(alpha),

      glowArrow([-85, -135], [45, -135], ROLE.note, { opacity: alpha }),

      cornerBrackets(465, -135, 780, 210, ROLE.note, {
        arm: 26,
        width: 2.8,
        opacity: alpha * (0.65 + 0.35 * ev),
      }),
      txt('INDEPENDENT EVALUATOR', 105, -205, 26, ROLE.note, 'mono', 'left').opacity(alpha),
      txt(
        'Deterministic schema + forbidden-action rules',
        105,
        -145,
        28,
        COSMOS.ink,
        'sans',
        'left',
      ).opacity(alpha),
      txt(
        'Semantic review (citation != causality)',
        105,
        -88,
        27,
        ROLE.units,
        'sans',
        'left',
      ).opacity(alpha),

      // Bottom half: Protected Resource Ledger (operation key + fencing token)
      txt(
        'PROTECTED RESOURCE BOUNDARY (HIGHEST FENCE = 12)',
        -855,
        20,
        26,
        op > 0.3 ? ROLE.units : COSMOS.muted,
        'mono',
        'left',
      ).opacity(alpha * (0.55 + 0.45 * op)),
    ];

    // Three ledger rows computed directly from contextOperationLedger(OPERATION_EVENTS)
    OPERATION_LEDGER.forEach((row, i) => {
      const y = 92 + i * 86;
      const rowActive = i < 2 ? op : fn;
      const col = i === 2 ? ROLE.poison : ROLE.units;
      const rowOp = alpha * (0.48 + 0.52 * rowActive);

      nodes.push(
        chip(`${row.label}  (${row.key}, fence ${row.fence})`, -515, y, {
          color: col,
          size: 26,
          h: 56,
          minW: 660,
          opacity: rowOp,
        }),
        glowArrow([-165, y], [-65, y], col, { width: 3, tip: 12, opacity: rowOp }),
        txt(row.status.toUpperCase(), -40, y, 28, col, 'mono', 'left').opacity(rowOp),
        txt(`effects: ${row.effects}`, 855, y, 28, ROLE.note, 'mono', 'right').opacity(rowOp),
      );
      if (i === 2 && fn > 0.3) nodes.push(crossMark(615, y, 24, ROLE.poison, alpha * fn));
      if (i < 2 && op > 0.3) nodes.push(checkMark(615, y, 24, ROLE.units, alpha * op));
    });

    // Bottom footer: issuer restriction
    nodes.push(
      txt(
        is > 0.3
          ? 'Restrict receipt issuers & task-status writers; append-only logs alone cannot stop forged entries.'
          : fn > 0.3
            ? 'Fencing tokens live at the protected resource; a prompt lease timestamp cannot stop another process.'
            : 'Operation keys deduplicate retries; keep unknown outcomes explicit until reconciled.',
        0,
        405,
        29,
        is > 0.3 ? ROLE.poison : ROLE.units,
        'sans',
        'center',
      ).opacity(alpha),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, layer);

  playCue(s, c, 'ce-recovery-and-evaluator-1', (d) => s.play(showEval.to(1, { duration: d })));
  playCue(s, c, 'ce-recovery-and-evaluator-2', (d) => s.play(showOpKey.to(1, { duration: d })));
  playCue(s, c, 'ce-fenced-resource', (d) => s.play(showFence.to(1, { duration: d })));
  playCue(s, c, 'ce-recovery-and-evaluator-3', (d) => s.play(showIssuer.to(1, { duration: d })));
}
