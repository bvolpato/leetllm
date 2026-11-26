// Scene 03: budget-inventory: 27B model: 54 GB (16b) -> 27 GB (8b) -> 13.5 GB (4b) -> 10.125 GB (3b) + 0.42 GB scales vs 24 GB line.
import {
  COSMOS,
  ROLE,
  aura,
  group,
  guardedDynamic,
  heroTitle,
  lumBar,
  playCue,
  txt,
} from '../parts.mjs';

export default function budgetInventory(s, c) {
  const stepBits = s.value(0); // 0..3 -> 16, 8, 4, 3 bits
  const showScales = s.value(0);
  const showLine24 = s.value(0);

  const bgAura = aura(0, 0, 740, '#14335c28', '#20184422');
  const title = heroTitle(['27 Billion Weights:', 'Codes, Group Scales & 24 GB Headroom'], {
    x: -855,
    y: -430,
    size: 46,
    lineHeight: 54,
    accent: ROLE.gold,
  });

  const rows = [
    { label: '16-bit', gb: 54.0, col: ROLE.err, tag: '54.0 GB' },
    { label: '8-bit', gb: 27.0, col: ROLE.gold, tag: '27.0 GB' },
    {
      label: '4-bit',
      gb: 13.5,
      col: ROLE.grid,
      tag: '13.5 GB (+0.42 scales = 13.92 GB / 13.0 GiB)',
    },
    { label: '3-bit', gb: 10.125, col: ROLE.ok, tag: '10.13 GB' },
  ];

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const sb = stepBits.value;
    const sc = showScales.value;
    const l24 = showLine24.value;

    const barX = -650;
    const maxW = 1040;
    const px = maxW / 56;
    const line24X = barX + 24 * px;

    const nodes = [
      txt(
        'DECIMAL GIGABYTES (27B WEIGHTS, KEEP GB vs GiB UNITS CONSISTENT)',
        -855,
        -225,
        26,
        ROLE.grid,
        'mono',
        'left',
      ).opacity(alpha),
      lumBar(line24X - 2, 24, 4, 340, ROLE.ok, {
        opacity: alpha * (0.4 + 0.6 * l24),
        glow: 10,
      }),
      txt('24 GB CARD', line24X, -184, 26, ROLE.ok, 'mono', 'center').opacity(
        alpha * (0.4 + 0.6 * l24),
      ),
    ];

    rows.forEach((r, idx) => {
      const y = -115 + idx * 96;
      const active = sb >= idx - 0.15;
      const op = alpha * (active ? 1 : 0.46);
      const w = r.gb * px;
      nodes.push(
        txt(r.label, -855, y, 28, r.col, 'mono', 'left').opacity(op),
        lumBar(barX, y, w, 40, r.col, { opacity: op, maxTrackW: maxW }),
      );
      if (idx === 2 && sc > 0.2) {
        nodes.push(
          lumBar(barX + w + 2, y, 0.422 * px * 2.2, 40, ROLE.gold, {
            opacity: alpha * sc,
            glow: 10,
          }),
        );
      }
      nodes.push(
        txt(
          idx === 2 && sc > 0.35 ? '13.92 GB (~13.0 GiB)' : r.gb.toFixed(idx === 3 ? 2 : 1) + ' GB',
          barX + maxW + 24,
          y,
          28,
          idx === 2 && sc > 0.35 ? ROLE.gold : r.col,
          'mono',
          'left',
        ).opacity(op),
      );
    });

    nodes.push(
      txt(
        l24 > 0.35
          ? '~10 GB remains for KV cache, workspace & multimodal encoders (measure real card allocations!)'
          : sc > 0.35
            ? '1 two-byte scale per 128 weights adds ~0.42 GB (full-group ideal; check extra overhead)'
            : 'Dropping from 16-bit to 4-bit shrinks 27B weights from 54 GB to 13.5 GB',
        0,
        305,
        26,
        l24 > 0.35 ? ROLE.ok : ROLE.gold,
        'sans',
        'center',
      ).opacity(alpha),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, layer);
  playCue(s, c, 'budget-inventory-build-0', (d) => s.play(stepBits.to(0, { duration: d })));
  playCue(s, c, 'budget-bits-16', (d) => s.play(stepBits.to(0, { duration: d })));
  playCue(s, c, 'budget-bits-8', (d) => s.play(stepBits.to(1, { duration: d })));
  playCue(s, c, 'budget-bits-4', (d) => s.play(stepBits.to(2, { duration: d })));
  playCue(s, c, 'budget-bits-3', (d) => s.play(stepBits.to(3, { duration: d })));
  playCue(s, c, 'budget-inventory-build-1', (d) => s.play(showScales.to(1, { duration: d })));
  playCue(s, c, 'budget-inventory-build-2', (d) => s.play(showLine24.to(1, { duration: d })));
}
