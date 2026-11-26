// Scene 05: retention: 16 columns (16,384 tokens) -> capped sliding (1 col) vs full-reserved sliding (+15 K & +15 V -> 22.5 GB raw KV!).
import {
  COSMOS,
  MEM_CAP_4,
  MEM_FULL_4,
  ROLE,
  aura,
  group,
  guardedDynamic,
  heroTitle,
  playCue,
  rect,
  txt,
} from '../parts.mjs';

export default function retention(s, c) {
  const showUncapped = s.value(0);
  const revealExtra = s.value(0); // strictly withheld until AFTER count-extra!
  const showTotals = s.value(0);

  const bgAura = aura(0, 0, 740, '#14335c28', '#2a162422');
  const title = heroTitle(['Attention Window vs', 'Physical KV Retention'], {
    x: -855,
    y: -430,
    size: 50,
    lineHeight: 58,
    accent: ROLE.vram,
  });

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const unc = showUncapped.value;
    const rev = revealExtra.value;
    const tot = showTotals.value;

    const nodes = [
      txt(
        '16,384-TOKEN LOG = 16 COLUMNS OF 1,024 TOKENS (YELLOW = SLIDING WINDOW)',
        -855,
        -225,
        26,
        ROLE.gold,
        'mono',
        'left',
      ).opacity(alpha),

      // Row 1: Capped sliding cache (only col 15 stored)
      txt('Capped Sliding Layer', -855, -130, 26, ROLE.ok, 'mono', 'left').opacity(alpha),
      // Row 2: Uncapped runner (reserves all 16 columns!)
      txt(
        'Uncapped Runner',
        -855,
        10,
        26,
        unc > 0.2 ? ROLE.work : COSMOS.muted,
        'mono',
        'left',
      ).opacity(alpha * (0.45 + 0.55 * unc)),
    ];

    for (let col = 0; col < 16; col++) {
      const cx = -490 + col * 84;
      const isWin = col === 15;
      // Row 1 (capped): only col 15 filled
      nodes.push(
        rect(72, 66, {
          fill: isWin ? '#103528' : '#0e1526',
          stroke: isWin ? ROLE.gold : COSMOS.rule,
          width: isWin ? 3 : 1.5,
          radius: 7,
        })
          .at(cx, -130)
          .opacity(alpha * (isWin ? 1 : 0.35)),
      );
      if (isWin) {
        nodes.push(txt('K/V', cx, -130, 26, ROLE.gold, 'mono', 'center').opacity(alpha));
      }

      // Row 2 (uncapped): fills cols 0..14 on reserve-earlier!
      const extraFilled = !isWin && rev > 0.3;
      nodes.push(
        rect(72, 66, {
          fill: isWin ? '#103528' : extraFilled ? '#331524' : '#0e1526',
          stroke: isWin ? ROLE.gold : extraFilled ? ROLE.work : COSMOS.rule,
          width: isWin || extraFilled ? 2.6 : 1.5,
          radius: 7,
        })
          .at(cx, 10)
          .opacity(alpha * (isWin ? 1 : extraFilled ? 1 : 0.4)),
      );
    }

    // Bottom readout (strictly withheld until count-extra / read-totals!)
    nodes.push(
      txt(
        rev > 0.4
          ? 'EXTRA RESERVED PER SLIDING LAYER:  +15 Key tiles & +15 Value tiles (unread by last query!)'
          : 'How many extra Key tiles and Value tiles does the uncapped runner reserve?',
        0,
        145,
        28,
        rev > 0.4 ? ROLE.work : ROLE.gold,
        'mono',
        'center',
      ).opacity(alpha),

      txt(
        tot > 0.3
          ? `40 sliding + 8 full x 4 logs:  Capped = ${MEM_CAP_4.kv.toFixed(2)} GB   vs   Uncapped = ${MEM_FULL_4.kv.toFixed(1)} GB RAW KV!`
          : 'Always check whether your inference backend physically caps sliding-window buffers',
        0,
        255,
        28,
        tot > 0.3 ? ROLE.work : COSMOS.muted,
        'mono',
        'center',
      )
        .glow(tot > 0.3 ? 8 : 0, ROLE.work)
        .opacity(alpha),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, layer);
  playCue(s, c, 'last-query', (d) => s.play(showUncapped.to(0, { duration: d })));
  playCue(s, c, 'keep-pair', (d) => s.play(showUncapped.to(0, { duration: d })));
  playCue(s, c, 'full-attention', (d) => s.play(showUncapped.to(0.25, { duration: d })));
  playCue(s, c, 'ask-reserve', (d) => s.play(showUncapped.to(1, { duration: d })));
  playCue(s, c, 'reserve-earlier', (d) => s.play(revealExtra.to(0.2, { duration: d })));
  // Strict prediction withholding: reveal 15K + 15V only after count-extra!
  playCue(s, c, 'count-extra', (d) => s.play(revealExtra.to(1, { duration: d })), { after: true });
  playCue(s, c, 'read-totals', (d) => s.play(showTotals.to(1, { duration: d })));
}
