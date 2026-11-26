// Scene 19: Where did the new trainable weights go?: Tiny Qwen2 CPU PEFT lifecycle (7 projections -> 512 / 3920 -> 2 steps -> reload/merge).
import {
  BUDGET_TINY,
  COSMOS,
  TINY_COUNTS,
  aura,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function tinyPeft(s, c) {
  const phase = s.value(0);
  const showSetup = s.value(0);
  const showCount512 = s.value(0);
  const showBase3408 = s.value(0);
  const showStage2 = s.value(0);
  const showNoOp = s.value(0);
  const showGrads = s.value(0);
  const showSaveReload = s.value(0);
  const showWrapped = s.value(0);
  const showStage3 = s.value(0);

  const bgAura = aura(0, 10, 620, '#ffd1661c', '#6ee7b718');
  const title = heroTitle(['Tiny Qwen2 PEFT', 'Lifecycle on CPU'], {
    x: -855,
    y: -420,
    size: 54,
    lineHeight: 64,
    accent: COSMOS.gold,
    eyebrow: 'ALL-LINEAR WRAPPER VERIFICATION',
  });

  const live = guardedDynamic(1, () => {
    const p = phase.value;
    const c512 = showCount512.value > 0.4;
    const b3408 = showBase3408.value > 0.4;
    const wr = showWrapped.value > 0.4;
    const nop = showNoOp.value > 0.4;
    const grd = showGrads.value > 0.4;
    const srv = showSaveReload.value > 0.4;
    const st3 = showStage3.value > 0.4;
    const pulse = 0.75 + 0.25 * Math.sin(p * 3.8);

    const nodes = [
      txt(
        '1-LAYER QWEN2 · RANDOM WEIGHTS · CPU · r = 2',
        855,
        -380,
        26,
        COSMOS.cyan,
        'mono',
        'right',
      ),
    ];

    // 7 adapted projections arranged cleanly in 2 rows (4 attn + 3 MLP)
    BUDGET_TINY.forEach((row, i) => {
      const isTop = i < 4;
      const colIdx = isTop ? i : i - 4;
      const cx = isTop ? -615 + colIdx * 410 : -410 + colIdx * 410;
      const cy = isTop ? -140 : 48;
      const borderCol = st3 || c512 ? COSMOS.gold : COSMOS.blue;
      nodes.push(
        glassCell(cx, cy, 365, 148, borderCol, {
          fill: '#101b34',
          glow: st3 ? 10 * pulse : c512 ? 8 : 4,
        }),
        txt(`${row.name}_proj`, cx - 150, cy - 36, 28, COSMOS.cyan, 'mono', 'left'),
        txt(`${row.out} × ${row.input}`, cx - 150, cy + 16, 26, COSMOS.muted, 'mono', 'left'),
        glassCell(cx + 100, cy + 8, 120, 64, c512 ? COSMOS.gold : '#334268', {
          fill: c512 ? '#2c2210' : '#12182b',
          glow: c512 ? 9 : 0,
        }),
        txt(
          c512 ? `+${row.count}` : '?',
          cx + 100,
          cy + 8,
          30,
          c512 ? COSMOS.gold : COSMOS.dim,
          'mono',
        ),
      );
    });

    // Parameter count summary bar
    const countText = wr
      ? `${TINY_COUNTS.base.toLocaleString('en-US')} base + ${TINY_COUNTS.adapter} adapter = ${TINY_COUNTS.wrapped.toLocaleString('en-US')} wrapped (13.1%)`
      : b3408
        ? `${TINY_COUNTS.base.toLocaleString('en-US')} base + ${TINY_COUNTS.adapter} adapter = ? wrapped`
        : c512
          ? `${TINY_COUNTS.adapter} adapter params (7 layers)`
          : 'Wrapping all 7 block linear layers (lm_head excluded)';

    nodes.push(
      glassCell(
        0,
        212,
        1620,
        96,
        wr ? COSMOS.gold : showSetup.value > 0.2 ? COSMOS.cyan : COSMOS.blue,
        {
          fill: '#121a30',
          glow: showSetup.value > 0.2 ? 8 : 4,
        },
      ),
      txt(countText, 0, 212, 30, wr ? COSMOS.gold : COSMOS.ink, 'mono').glow(
        wr ? 6 : 0,
        COSMOS.gold,
      ),
    );

    // Bottom 3 lifecycle verification gates
    const gates = [
      { label: 'Step-0 identity: diff 0.0', active: nop, x: -555 },
      { label: 'Step 1 B -> Step 2 A grads', active: grd, x: 0 },
      { label: 'Save -> Reload -> Merge OK', active: srv, x: 555 },
    ];
    gates.forEach((g) => {
      const col = g.active ? COSMOS.emerald : showStage2.value > 0.2 ? COSMOS.muted : '#4a587a';
      nodes.push(
        glassCell(g.x, 368, 515, 114, col, {
          fill: g.active ? '#0e2528' : '#11182c',
          glow: g.active ? 10 : 2,
        }),
        glowDot(g.x - 220, 368, { radius: 7, color: col, opacity: g.active ? 1 : 0.4 }),
        txt(g.label, g.x + 15, 368, 26, g.active ? COSMOS.emerald : COSMOS.muted, 'mono'),
      );
    });

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('tiny-peft-1', () => s.play(showSetup.to(1, { duration: 0.35 })));
  c.on('tiny-count', () => s.play(showCount512.to(1, { duration: 0.4 })));
  c.on('tiny-base-result', () => s.play(showBase3408.to(1, { duration: 0.35 })));
  c.on('tiny-peft-2', () => s.play(showStage2.to(1, { duration: 0.35 })));
  c.on('tiny-no-op', () => s.play(showNoOp.to(1, { duration: 0.35 })));
  c.on('tiny-gradients', () => s.play(showGrads.to(1, { duration: 0.4 })));
  c.on('tiny-save-reload', () => s.play(showSaveReload.to(1, { duration: 0.4 })));
  c.on('tiny-wrapped-result', () => s.play(showWrapped.to(1, { duration: 0.35 })));
  c.on('tiny-peft-3', () =>
    s.play(showStage3.to(1, { duration: remainDuration(c, 'tiny-peft-3', 0.45) })),
  );
}
