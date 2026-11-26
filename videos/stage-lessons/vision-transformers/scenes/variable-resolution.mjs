// Scene 17: variable-resolution: NaFlex rectangular patch grids (128 vs 96 + 32 masked pad slots) & invariance test.
import {
  COSMOS,
  ROLE,
  aura,
  group,
  guardedDynamic,
  heroTitle,
  lumBar,
  playCue,
  rect,
  txt,
} from '../parts.mjs';

export default function variableResolution(s, c) {
  const showPad = s.value(0);
  const showCheck = s.value(0);

  const bgAura = aura(0, 0, 740, '#14345a28', '#14383622');
  const title = heroTitle(['Variable Resolution &', 'Masked Rectangular Packing'], {
    x: -855,
    y: -430,
    size: 50,
    lineHeight: 58,
    accent: ROLE.patch,
  });

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const pad = showPad.value;
    const chk = showCheck.value;
    const nodes = [
      // Left rectangular grid: 16 x 8 = 128 patches (drawn as 8 x 4 visual tiles representing 128)
      txt(
        'IMAGE A: WIDE RECTANGLE (128 VALID PATCHES)',
        -855,
        -215,
        26,
        ROLE.patch,
        'mono',
        'left',
      ).opacity(alpha),
      // Right rectangular grid: 12 x 8 = 96 valid patches + 32 masked pad slots
      txt(
        'IMAGE B: NARROWER (96 VALID + 32 MASKED PAD)',
        45,
        -215,
        26,
        ROLE.pos,
        'mono',
        'left',
      ).opacity(alpha),
    ];

    // Left 8x4 tile grid
    for (let r = 0; r < 4; r++) {
      for (let col = 0; col < 8; col++) {
        nodes.push(
          rect(72, 42, { fill: '#11304a', stroke: ROLE.patch, width: 2, radius: 6 })
            .at(-815 + col * 80, -145 + r * 50)
            .opacity(alpha),
        );
      }
    }

    // Right 6x4 valid tiles + 2x4 masked pad tiles
    for (let r = 0; r < 4; r++) {
      for (let col = 0; col < 8; col++) {
        const isPad = col >= 6;
        const fill = isPad ? '#2a1622' : '#2e2612';
        const stroke = isPad ? ROLE.warn : ROLE.pos;
        const op = isPad ? 0.22 + 0.78 * pad : 1;
        nodes.push(
          rect(72, 42, { fill, stroke, width: 2, radius: 6 })
            .at(85 + col * 80, -145 + r * 50)
            .opacity(alpha * op),
        );
        if (isPad && pad > 0.35 && r === 1 && col === 6) {
          nodes.push(
            txt('PAD', 85 + col * 80, -145 + r * 50, 26, ROLE.warn, 'mono', 'center').opacity(
              alpha * pad,
            ),
          );
        }
      }
    }

    // Sequence length bars aligned to common batch length 128
    const barX = -460;
    const maxW = 860;
    nodes.push(
      txt('COMMON BATCH SEQUENCE LENGTH = 128', -855, 85, 26, COSMOS.muted, 'mono', 'left').opacity(
        alpha,
      ),
      txt('Seq A (128)', -855, 148, 28, ROLE.patch, 'mono', 'left').opacity(alpha),
      lumBar(barX, 148, maxW, 32, ROLE.patch, { opacity: alpha, maxTrackW: maxW }),
      txt('128 valid', barX + maxW + 24, 148, 28, ROLE.patch, 'mono', 'left').opacity(alpha),

      txt('Seq B (96+32)', -855, 222, 28, ROLE.pos, 'mono', 'left').opacity(alpha),
      lumBar(barX, 222, maxW * 0.75, 32, ROLE.pos, { opacity: alpha, maxTrackW: maxW }),
      rect(maxW * 0.25 - 6, 32, { fill: '#351824', stroke: ROLE.warn, width: 2, radius: 6 })
        .at(barX + maxW * 0.875 + 2, 222)
        .opacity(alpha * (0.25 + 0.75 * pad)),
      txt(
        pad > 0.3 ? '32 MASKED' : '96 valid',
        barX + maxW + 24,
        222,
        28,
        pad > 0.3 ? ROLE.warn : ROLE.pos,
        'mono',
        'left',
      ).opacity(alpha),

      // Invariance contract test at bottom
      txt(
        chk > 0.3
          ? 'TEST: Readout(B alone) == Readout(B padded in batch) with dropout off'
          : 'NaFlex scales to a patch budget while preserving aspect ratio and grid coords',
        0,
        320,
        28,
        chk > 0.3 ? ROLE.ok : COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, layer);
  playCue(s, c, 'variable-resolution-beat-0', (d) => s.play(showPad.to(0.15, { duration: d })));
  playCue(s, c, 'variable-resolution-beat-1', (d) => s.play(showPad.to(1, { duration: d })));
  playCue(s, c, 'variable-resolution-beat-2', (d) => s.play(showCheck.to(1, { duration: d })));
}
