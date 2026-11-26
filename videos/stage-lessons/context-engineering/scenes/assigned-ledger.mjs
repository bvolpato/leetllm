// Scene 15: assigned-ledger: "Reconstruct all retained allocation terms"
// Six category luminous bar waterfall: retained (2,400 + 760 + 186 = 3,346) vs
// omitted (8,200 + 770 + 120 = 9,090) reconstructing 12,436 raw units and 73.1% omitted with MathJax.
import {
  COSMOS,
  LEDGER,
  LEDGER_PERCENT,
  ROLE,
  allocations,
  aura,
  ease,
  fmt,
  glowTex,
  group,
  guardedDynamic,
  heroTitle,
  lumBar,
  playCue,
  txt,
} from '../parts.mjs';

export default function assignedLedger(s, c) {
  const showRetained = s.value(0.35);
  const show3346 = s.value(0);
  const showRemoved = s.value(0);
  const show9090 = s.value(0);
  const showPct = s.value(0);
  const showMeasure = s.value(0);

  const bgAura = aura(0, 20, 820, '#14335c2a', '#14352822');
  const title = heroTitle(['Reconstruct all retained', 'allocation terms'], {
    x: -855,
    y: -435,
    size: 50,
    lineHeight: 58,
    accent: ROLE.units,
  });

  const eq = glowTex(String.raw`\frac{9{,}090}{12{,}436} \times 100 = 73.1\%\;\text{omitted}`, {
    x: 430,
    y: -395,
    size: 36,
    color: ROLE.note,
    glow: 8,
  });

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const rt = ease(showRetained.value);
    const s33 = ease(show3346.value);
    const rm = ease(showRemoved.value);
    const s90 = ease(show9090.value);
    const sp = ease(showPct.value);
    const ms = ease(showMeasure.value);

    const x0 = -855;
    const barX = -260;
    const maxW = 860;
    const colors = [ROLE.evidence, ROLE.cache, ROLE.note, ROLE.poison, ROLE.tool, ROLE.units];

    const nodes = [
      eq.opacity(alpha * (0.35 + 0.65 * sp)),
      txt(
        'SIX ASSIGNED ALLOCATION CATEGORIES (TOTAL 12,436)',
        x0,
        -245,
        26,
        COSMOS.muted,
        'mono',
        'left',
      ).opacity(alpha),
    ];

    allocations.forEach((row, i) => {
      const y = -165 + i * 78;
      const kept = i < 3;
      const col = colors[i];
      const emphasis = kept ? 0.65 + 0.35 * rt : 0.48 + 0.52 * rm;
      const w = Math.max(16, (row.units / 8200) * maxW);
      const label = i === 2 ? 'Reloaded findings (90+96)' : row.id;

      nodes.push(
        txt(label, x0, y, 28, kept ? COSMOS.ink : COSMOS.muted, 'sans', 'left').opacity(
          alpha * emphasis,
        ),
        lumBar(barX, y, w, 34, col, {
          opacity: alpha * emphasis,
          track: maxW,
          trackOpacity: 0.45,
        }),
        txt(fmt(row.units), barX + maxW + 30, y, 30, col, 'mono', 'left').opacity(alpha * emphasis),
        txt(
          kept ? 'KEEP' : 'OMIT',
          855,
          y,
          26,
          kept ? ROLE.note : ROLE.poison,
          'mono',
          'right',
        ).opacity(alpha * emphasis),
      );
    });

    // Bottom totals strip
    nodes.push(
      txt(
        s33 > 0.4 ? `Retained: 2,400 + 760 + 186 = ${fmt(LEDGER.kept)}` : 'Retained total: ?',
        x0,
        320,
        32,
        ROLE.note,
        'mono',
        'left',
      ).opacity(alpha),
      txt(
        s90 > 0.4 ? `Omitted: 8,200 + 770 + 120 = ${fmt(LEDGER.removed)}` : 'Omitted total: ?',
        10,
        320,
        32,
        ROLE.poison,
        'mono',
        'left',
      ).opacity(alpha * (0.45 + 0.55 * rm)),
      txt(
        ms > 0.3
          ? 'Real call: count finished messages + schemas with model tokenizer, then test task accuracy.'
          : sp > 0.4
            ? `3,346 + 9,090 = ${fmt(LEDGER.raw)} raw units (${LEDGER_PERCENT.toFixed(1)}% omitted).`
            : 'Most savings come from archiving the 8,200-unit raw trace export.',
        0,
        405,
        29,
        ms > 0.3 ? ROLE.evidence : COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, layer);

  playCue(s, c, 'ce-assigned-ledger-1', (d) => s.play(showRetained.to(1, { duration: d })));
  playCue(s, c, 'ce-ledger-3346', (d) => s.play(show3346.to(1, { duration: d })), { after: true });
  playCue(s, c, 'ce-assigned-ledger-2', (d) => s.play(showRemoved.to(1, { duration: d })));
  playCue(s, c, 'ce-ledger-9090', (d) => s.play(show9090.to(1, { duration: d })), { after: true });
  playCue(s, c, 'ce-ledger-percent', (d) => s.play(showPct.to(1, { duration: d })), {
    after: true,
  });
  playCue(s, c, 'ce-assigned-ledger-3', (d) => s.play(showMeasure.to(1, { duration: d })));
}
