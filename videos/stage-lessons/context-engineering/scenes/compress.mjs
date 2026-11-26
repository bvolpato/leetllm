// Scene 10: compress: "Remove bulk while retaining checked state"
// Source-bound 6-category allocation rail shrinking 12,436 -> 4,236 (prune raw export) ->
// 3,346 (exclude unused tools & disproven claim), while keeping call-trace-17 linkage & reloaded findings.
import {
  COSMOS,
  LEDGER,
  ROLE,
  TRACE_EXCHANGE,
  allocations,
  aura,
  checkMark,
  ease,
  fmt,
  group,
  guardedDynamic,
  heroTitle,
  playCue,
  tokenRail,
  txt,
} from '../parts.mjs';

export default function compress(s, c) {
  const showRaw = s.value(0.4);
  const pruneExport = s.value(0);
  const linkPair = s.value(0);
  const dropOthers = s.value(0);

  const bgAura = aura(0, 0, 820, '#14335c2a', '#14352822');
  const title = heroTitle(['Remove bulk while', 'retaining checked state'], {
    x: -855,
    y: -435,
    size: 50,
    lineHeight: 58,
    accent: ROLE.note,
  });

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const rw = ease(showRaw.value);
    const pe = ease(pruneExport.value);
    const lp = ease(linkPair.value);
    const dr = ease(dropOthers.value);

    const x0 = -855;
    const railW = 1710;
    const colors = {
      evidence: ROLE.evidence,
      active: ROLE.cache,
      findings: ROLE.note,
      raw: ROLE.poison,
      unused: ROLE.tool,
      hypothesis: ROLE.units,
    };

    const segs = allocations.map((item) => {
      const isRaw = item.kind === 'raw';
      const isDrop = item.kind === 'unused' || item.kind === 'hypothesis';
      const exit = isRaw ? pe : isDrop ? dr : 0;
      return {
        units: item.units,
        color: colors[item.kind],
        alpha: 1 - 0.55 * exit,
        dy: exit * 145,
        outline: exit > 0.5,
      };
    });

    const activeTotal = dr > 0.5 ? LEDGER.kept : pe > 0.5 ? LEDGER.afterExport : LEDGER.raw;
    const removedTotal = LEDGER.raw - activeTotal;

    const nodes = [
      // Live total readout top-right
      txt('ACTIVE INPUT UNITS', 855, -430, 26, COSMOS.muted, 'mono', 'right').opacity(alpha),
      txt(fmt(activeTotal), 855, -365, 62, dr > 0.5 ? ROLE.note : ROLE.units, 'mono', 'right')
        .glow(10, dr > 0.5 ? ROLE.note : ROLE.units)
        .opacity(alpha),

      // Top rail labels
      txt('ACTIVE PACKET RAIL', x0, -245, 26, ROLE.evidence, 'mono', 'left').opacity(alpha),
      txt('ARCHIVED / EXCLUDED BELOW', x0, -20, 26, COSMOS.muted, 'mono', 'left').opacity(
        alpha * (0.5 + 0.5 * Math.max(pe, dr)),
      ),

      // Animated 6-category rail
      tokenRail({
        x0,
        y: -175,
        width: railW,
        total: LEDGER.raw,
        height: 68,
        segments: segs,
        opacity: alpha * (0.65 + 0.35 * rw),
      }),
    ];

    // 6 category breakdown rows (2 columns x 3 rows) cleanly spaced below the rails
    allocations.forEach((item, i) => {
      const col = i < 3 ? 0 : 1;
      const row = i % 3;
      const cx = col === 0 ? -855 : 40;
      const cy = 95 + row * 72;
      const excluded =
        (item.kind === 'raw' && pe > 0.5) ||
        ((item.kind === 'unused' || item.kind === 'hypothesis') && dr > 0.5);
      const colHex = excluded ? COSMOS.dim : colors[item.kind];
      nodes.push(
        txt(item.id, cx, cy, 28, colHex, 'sans', 'left').opacity(alpha * (excluded ? 0.65 : 1)),
        txt(
          `${fmt(item.units)}${excluded ? ' (out)' : ''}`,
          cx + 760,
          cy,
          28,
          colHex,
          'mono',
          'right',
        ).opacity(alpha * (excluded ? 0.65 : 1)),
      );
    });

    // Call / result linkage & removed summary at bottom
    nodes.push(
      checkMark(-830, 345, 24, ROLE.note, alpha * (0.45 + 0.55 * lp)),
      txt(
        `${TRACE_EXCHANGE.call.id} -> result.call_id=${TRACE_EXCHANGE.result.call_id}`,
        -795,
        345,
        28,
        lp > 0.3 ? ROLE.note : COSMOS.muted,
        'mono',
        'left',
      ).opacity(alpha * (0.5 + 0.5 * lp)),
      txt(
        `Removed: ${fmt(removedTotal)}   Kept: ${fmt(activeTotal)}`,
        855,
        345,
        30,
        ROLE.units,
        'mono',
        'right',
      ).opacity(alpha),
      txt(
        dr > 0.5
          ? 'Reloaded findings (186) remain counted; quality evaluation follows accounting.'
          : 'Archive bulky raw trace after preserving checked findings & source IDs.',
        0,
        420,
        28,
        COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, layer);

  playCue(s, c, 'compress-beat-1-focus-1', (d) => s.play(showRaw.to(1, { duration: d })));
  playCue(s, c, 'compress-beat-2-focus-2', (d) =>
    s.play(pruneExport.to(1, { duration: Math.max(d, 0.9) })),
  );
  playCue(s, c, 'compress-beat-2-focus-1', (d) => s.play(linkPair.to(1, { duration: d })));
  playCue(s, c, 'compress-beat-3-focus-1', (d) =>
    s.play(dropOthers.to(1, { duration: Math.max(d, 0.9) })),
  );
}
