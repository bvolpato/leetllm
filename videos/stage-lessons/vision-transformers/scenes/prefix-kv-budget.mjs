// Scene 21: prefix-kv-budget: Fixed 512 text + 224/448/896 visual KV cache (96 -> 192 -> 576 MiB), 4-img 2x2 merge & prompt reuse.
import {
  BUDGET_224,
  BUDGET_448,
  BUDGET_4IMG,
  BUDGET_4IMG_MERGED,
  BUDGET_896,
  COSMOS,
  ROLE,
  aura,
  group,
  guardedDynamic,
  heroTitle,
  playCue,
  rect,
  txt,
} from '../parts.mjs';

export default function prefixKvBudget(s, c) {
  const showDouble = s.value(0);
  const showLargest = s.value(0);
  const showFour = s.value(0);
  const showMerged = s.value(0);
  const showPrompt = s.value(0);

  const bgAura = aura(0, 0, 760, '#14335c28', '#2a163222');
  const title = heroTitle(['Prefix KV Cache Budget:', 'Text + Visual Slot Accounting'], {
    x: -855,
    y: -430,
    size: 48,
    lineHeight: 56,
    accent: ROLE.warn,
  });

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const dbl = showDouble.value;
    const lrg = showLargest.value;
    const fr = showFour.value;
    const mrg = showMerged.value;
    const prm = showPrompt.value;

    const barX = -380;
    const maxSlots = 4608; // 512 + 4096
    const maxW = 920;
    const textW = (512 / maxSlots) * maxW;

    function stackedRow(y, label, visSlots, mibText, color, visAlpha) {
      const visW = Math.max(8, (visSlots / maxSlots) * maxW);
      return [
        txt(label, -855, y, 28, COSMOS.ink, 'mono', 'left').opacity(visAlpha),
        rect(maxW, 38, { fill: '#10182d', stroke: '#253358', width: 1.5, radius: 6 })
          .at(barX + maxW * 0.5, y)
          .opacity(visAlpha * 0.65),
        rect(textW, 38, { fill: ROLE.attn, stroke: null, radius: 5 })
          .at(barX + textW * 0.5, y)
          .opacity(visAlpha),
        rect(visW, 38, { fill: color, stroke: null, radius: 5 })
          .at(barX + textW + visW * 0.5, y)
          .glow(8, color)
          .opacity(visAlpha),
        txt(mibText, barX + maxW + 28, y, 30, color, 'mono', 'left').opacity(visAlpha),
      ];
    }

    const fourVisSlots = mrg > 0.4 ? BUDGET_4IMG_MERGED.visual : BUDGET_4IMG.visual;
    const fourMib = mrg > 0.4 ? BUDGET_4IMG_MERGED.mib : BUDGET_4IMG.mib;

    const nodes = [
      txt(
        '128 KiB / SLOT (32L x 8H x 128D x 2B x K&V)  |  BLUE = 512 TEXT SLOTS',
        -855,
        -225,
        26,
        ROLE.patch,
        'mono',
        'left',
      ).opacity(alpha),

      // Row 1: 224px baseline (512 + 256 = 768 slots = 96 MiB)
      ...stackedRow(
        -135,
        '224px (256 vis)',
        BUDGET_224.visual,
        `${BUDGET_224.mib} MiB`,
        ROLE.patch,
        alpha,
      ),

      // Row 2: 448px (withheld until prefix-double!)
      ...stackedRow(
        -45,
        '448px (1024 vis)',
        dbl > 0.4 ? BUDGET_448.visual : 256,
        dbl > 0.4 ? `${BUDGET_448.mib} MiB  (2x!)` : '? MiB (predict)',
        dbl > 0.4 ? ROLE.ok : ROLE.pos,
        alpha,
      ),

      // Row 3: 896px (512 + 4096 = 4608 slots = 576 MiB)
      ...stackedRow(
        45,
        '896px (4096 vis)',
        lrg > 0.3 ? BUDGET_896.visual : 40,
        lrg > 0.3 ? `${BUDGET_896.mib} MiB` : '4096 vis slots',
        ROLE.warn,
        alpha * (0.28 + 0.72 * lrg),
      ),

      // Row 4: 4 x 448px -> 2x2 merge (4096 -> 1024 vis slots)
      ...stackedRow(
        145,
        mrg > 0.4 ? '4x448px MERGED' : '4x448px (4096 vis)',
        fr > 0.3 ? fourVisSlots : 40,
        fr > 0.3 ? `${fourMib} MiB (${fourVisSlots} vis)` : '4 images',
        mrg > 0.4 ? ROLE.ok : ROLE.bridge,
        alpha * (0.28 + 0.72 * fr),
      ),

      // Bottom prompt change reuse callout
      txt(
        prm > 0.3
          ? 'Change system prompt -> reuse image encoder features, but decoder recomputes from changed prefix!'
          : 'KV memory grows linearly with total slots; dense prefix attention grows quadratically',
        0,
        285,
        28,
        prm > 0.3 ? ROLE.pos : COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, layer);
  playCue(s, c, 'prefix-baseline', (d) => s.play(showDouble.to(0, { duration: d })));
  // Strict prediction withholding: reveal 192 MiB only after prefix-double!
  playCue(s, c, 'prefix-double', (d) => s.play(showDouble.to(1, { duration: d })), { after: true });
  playCue(s, c, 'prefix-largest', (d) => s.play(showLargest.to(1, { duration: d })));
  playCue(s, c, 'prefix-four', (d) => s.play(showFour.to(1, { duration: d })));
  playCue(s, c, 'prefix-merge', (d) => s.play(showMerged.to(1, { duration: d })));
  playCue(s, c, 'prefix-prompt', (d) => s.play(showPrompt.to(1, { duration: d })));
}
