// Scene 25: q4k-unpack: 256-weight superblock (8x32) = 128B codes + 12B 6-bit scale/min pairs + 4B super-factors = 144B (4.5 bpw); w_hat = 0.1*3*5 - 0.2*2 = 1.1; Q4_K vs Q4_K_M.
import {
  COSMOS,
  ROLE,
  aura,
  chipPill,
  glowTex,
  group,
  guardedDynamic,
  heroTitle,
  playCue,
  rect,
  txt,
} from '../parts.mjs';

export default function q4kUnpack(s, c) {
  const showParts = s.value(0);
  const showFormula = s.value(0);
  const showPreset = s.value(0);

  const bgAura = aura(0, 0, 740, '#14335c28', '#20184422');
  const title = heroTitle(['Inside a Q4_K Superblock:', '144 Bytes for 256 Weights (4.5 bpw)'], {
    x: -855,
    y: -430,
    size: 46,
    lineHeight: 54,
    accent: ROLE.gold,
  });

  const eq = glowTex(
    String.raw`\hat{w} = d \cdot s_i \cdot q - d_{\min} \cdot m_i = (0.1)(3)(5) - (0.2)(2) = 1.5 - 0.4 = 1.1`,
    { scale: 1.48, color: COSMOS.ink, glow: 8, glowColor: ROLE.gold },
  ).at(0, 125);
  const eqWrap = guardedDynamic(showFormula, (a) => eq.opacity(0.45 + 0.55 * a));

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const pt = showParts.value;
    const pr = showPreset.value;

    const nodes = [
      txt(
        '256 WEIGHTS = 8 SUB-BLOCKS OF 32 WEIGHTS  |  144 BYTES / 256 = 4.5 BITS/WEIGHT',
        -855,
        -220,
        26,
        ROLE.grid,
        'mono',
        'left',
      ).opacity(alpha),

      rect(760, 155, { fill: '#10203a', stroke: ROLE.weight, width: 2.8, radius: 12 })
        .at(-475, -55)
        .opacity(alpha),
      txt('128 B: 4-BIT CODES (256 nibbles)', -475, -90, 26, ROLE.weight, 'mono', 'center').opacity(
        alpha,
      ),
      txt('8 sub-blocks x 32 weights x 0.5 B', -475, -30, 26, COSMOS.ink, 'mono', 'center').opacity(
        alpha,
      ),

      rect(440, 155, { fill: '#261e10', stroke: ROLE.gold, width: 2.8, radius: 12 })
        .at(165, -55)
        .opacity(alpha * (0.5 + 0.5 * pt)),
      txt('12 B: 6-BIT (s_i, m_i)', 165, -90, 26, ROLE.gold, 'mono', 'center').opacity(alpha),
      txt('8 pairs x 12 bits = 96 bits', 165, -30, 26, COSMOS.ink, 'mono', 'center').opacity(alpha),

      rect(400, 155, { fill: '#181434', stroke: ROLE.code, width: 2.8, radius: 12 })
        .at(625, -55)
        .opacity(alpha * (0.5 + 0.5 * pt)),
      txt('4 B: SUPER-FACTORS', 625, -90, 26, ROLE.code, 'mono', 'center').opacity(alpha),
      txt('FP16 d (2B) + d_min (2B)', 625, -30, 26, COSMOS.ink, 'mono', 'center').opacity(alpha),

      chipPill(
        pr > 0.35
          ? 'Q4_K is one tensor encoding; Q4_K_M is a model preset mixing Q4_K with upgraded Q6_K/FP16 tensors!'
          : 'Two-level scaling (super-factors d, d_min + 6-bit sub-block coefficients) cuts metadata to 0.5 bpw',
        0,
        265,
        {
          w: 1640,
          h: 76,
          color: pr > 0.35 ? ROLE.ok : ROLE.gold,
          size: 26,
          opacity: alpha,
        },
      ),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, layer, eqWrap);
  playCue(s, c, 'q4k-unpack-build-0', (d) => s.play(showParts.to(0.3, { duration: d })));
  playCue(s, c, 'q4k-code-owners', (d) => s.play(showParts.to(0.6, { duration: d })));
  playCue(s, c, 'q4k-coefficients', (d) => s.play(showParts.to(0.85, { duration: d })));
  playCue(s, c, 'q4k-super-factors', (d) => s.play(showParts.to(1, { duration: d })));
  playCue(s, c, 'q4k-unpack-build-1', (d) => s.play(showFormula.to(1, { duration: d })));
  playCue(s, c, 'q4k-unpack-build-2', (d) => s.play(showPreset.to(1, { duration: d })));
}
