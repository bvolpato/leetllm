// Scene 05: Construct valid endpoints separately from allocated segments.
// Formula a_e = A * ceil(n_e / A), starts [0, 4], endpoints [3, 5], expanded vs non-expanded layout.
import {
  COSMOS,
  LAYOUT_ALIGNED4,
  ROLE,
  aura,
  buildAlignedSlotBuffer3d,
  glassCell,
  glowTex,
  group,
  guardedDynamic,
  heroTitle,
  line,
  orbitScene,
  remainAfterDuration,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function layoutBoundaries(s, c) {
  const phase = s.value(0);
  const alignVal = s.value(1);
  const focusSlot = s.value(0);
  const revealFour = s.value(0);
  const expandedMode = s.value(0);

  const bgAura = aura(470, 12, 500, '#5ce1e622', '#ffd16618');
  const { view: rig3d } = buildAlignedSlotBuffer3d(alignVal, focusSlot, phase, {
    x: 470,
    y: 12,
    unit: 94,
  });

  const title = heroTitle(['Valid Endpoints vs.', 'Allocated Segments'], {
    x: -860,
    y: -420,
    size: 54,
    lineHeight: 64,
    accent: ROLE.token,
    eyebrow: 'SEGMENT MATH · EXPANDED VS NON-EXPANDED',
    subtitle: 'psum_num_recv_tokens_per_expert[i] = start_i + real_count_i',
  });

  const formula = glowTex(String.raw`a_e = A \left\lceil \frac{n_e}{A} \right\rceil`, {
    x: -440,
    y: -85,
    size: 46,
    color: ROLE.token,
    glow: 7,
  });

  const live = guardedDynamic(1, () => {
    const isFour = Math.round(revealFour.value) >= 1;
    const isExp = Math.round(expandedMode.value) >= 1;

    const nodes = [
      txt('3D SEGMENT BOUNDARY POINTERS', 470, -415, 26, ROLE.nvlink, 'mono').glow(5, ROLE.nvlink),
      txt(
        isExp ? 'Expanded: 1 slot per valid selection' : 'Starts [0, 4]  ·  Valid endpoints [3, 5]',
        470,
        435,
        26,
        COSMOS.muted,
        'mono',
      ),
    ];

    if (!isExp) {
      nodes.push(
        glassCell(-655, 80, 390, 146, ROLE.rank0, { fill: '#0d1b33', glow: 6 }),
        txt('EXPERT 0 (n = 3)', -655, 32, 26, COSMOS.muted, 'mono'),
        txt('alloc: 4 · valid: 0..3', -655, 82, 26, ROLE.nvlink, 'mono'),
        txt('gap: slot 3', -655, 126, 26, ROLE.bad, 'mono'),

        glassCell(-225, 80, 390, 146, ROLE.brand, { fill: '#24170e', glow: 6 }),
        txt('EXPERT 1 (n = 1)', -225, 32, 26, COSMOS.muted, 'mono'),
        txt('alloc: 4 · valid: 4..5', -225, 82, 26, ROLE.brand, 'mono'),
        txt('gaps: slots 5, 6, 7', -225, 126, 26, ROLE.bad, 'mono'),

        glassCell(-440, 265, 820, 92, isFour ? ROLE.good : ROLE.nvlink, {
          fill: '#0e2228',
          glow: 7,
        }),
        txt(
          isFour
            ? `Capacity ${LAYOUT_ALIGNED4.capacity} slots  ·  Only ${LAYOUT_ALIGNED4.valid.filter(Boolean).length} valid rows`
            : `Starts [${LAYOUT_ALIGNED4.starts.join(', ')}] · Valid endpoints [${LAYOUT_ALIGNED4.endpoints.join(', ')}]`,
          -440,
          265,
          28,
          isFour ? ROLE.good : ROLE.nvlink,
          'mono',
        ),
        txt(
          'Capacity and population always use separate counts',
          -860,
          370,
          26,
          COSMOS.muted,
          'sans',
          'left',
        ),
      );
    } else {
      nodes.push(
        glassCell(-440, 42, 820, 88, ROLE.rank0, { fill: '#0e1b33', glow: 6 }),
        txt('Non-expanded: 1 dest row (a @ R1) + metadata', -440, 42, 26, ROLE.rank0, 'mono'),
        line([-440, 90], [-440, 142], { stroke: ROLE.nvlink, width: 3.5 }),
        glassCell(-655, 200, 395, 102, ROLE.nvlink, { fill: '#0d2430', glow: 7 }),
        txt('Expanded slot: a -> E2', -655, 182, 26, ROLE.nvlink, 'mono'),
        txt('valid · gate 0.7', -655, 224, 26, COSMOS.muted, 'mono'),
        glassCell(-225, 200, 395, 102, ROLE.good, { fill: '#0e241b', glow: 7 }),
        txt('Expanded slot: a -> E3', -225, 182, 26, ROLE.good, 'mono'),
        txt('valid · gate 0.3', -225, 224, 26, COSMOS.muted, 'mono'),
        txt(
          'Unused -1: no contribution  ·  Gap: no source ID',
          -860,
          335,
          26,
          ROLE.token,
          'mono',
          'left',
        ),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, rig3d, title, formula, live);
  runPhase(s, c, phase, 14);
  orbitScene(s, c, rig3d, { theta: -0.22, phi: 0.94 });

  c.on('de-layout-boundaries-b0', () =>
    s.play(focusSlot.to(4, { duration: remainDuration(c, 'de-layout-boundaries-b0', 0.85) })),
  );
  c.after('de-layout-four', () =>
    s.play(revealFour.to(1, { duration: remainAfterDuration(c, 'de-layout-four', 0.3) })),
  );
  c.on('de-layout-boundaries-b1', () => {
    const dur = remainDuration(c, 'de-layout-boundaries-b1', 0.65);
    s.play(expandedMode.to(1, { duration: dur }));
    s.play(focusSlot.to(2, { duration: dur }));
  });
}
