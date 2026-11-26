// Scene 17: provider-usage: OpenAI inclusive ledger (1400 total = 1220 reasoning + 180 visible -> $0.014 at $10/1M, bill ONCE!) vs Gemini separate thought + output fields.
import {
  COSMOS,
  ROLE,
  USAGE_FRAME,
  aura,
  chipPill,
  group,
  guardedDynamic,
  heroTitle,
  lumBar,
  playCue,
  txt,
} from '../parts.mjs';

export default function providerUsage(s, c) {
  const showCharge = s.value(0);
  const showGemini = s.value(0);

  const bgAura = aura(0, 0, 740, '#14335c28', '#20184422');
  const title = heroTitle(
    ['Reading Provider Token Ledgers:', 'Inclusive vs Separate Reasoning Counts'],
    {
      x: -855,
      y: -430,
      size: 46,
      lineHeight: 54,
      accent: ROLE.gold,
    },
  );

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const ch = showCharge.value;
    const gm = showGemini.value;

    const barX = -480;
    const maxW = 860;
    const px = maxW / 1400;

    const nodes = [
      txt(
        'OPENAI RESPONSES RECORD:  output_tokens = 1,400 (INCLUDES 1,220 REASONING!)',
        -855,
        -220,
        26,
        ROLE.search,
        'mono',
        'left',
      ).opacity(alpha),

      txt('Inclusive Total', -855, -100, 28, ROLE.score, 'mono', 'left').opacity(alpha),
      lumBar(barX, -100, USAGE_FRAME.reasoning * px, 46, ROLE.score, {
        opacity: alpha,
        maxTrackW: maxW,
      }),
      lumBar(barX + USAGE_FRAME.reasoning * px + 4, -100, USAGE_FRAME.visible * px, 46, ROLE.ok, {
        opacity: alpha,
        glow: 10,
      }),
      txt('1,220 hidden + 180 vis', barX + maxW + 24, -100, 26, ROLE.gold, 'mono', 'left').opacity(
        alpha,
      ),

      chipPill(
        `BILLING ($10/1M): 1,400 x $10 / 1M = $${USAGE_FRAME.charge.toFixed(3)}  (CHARGE ONCE, NEVER DOUBLE-COUNT!)`,
        0,
        35,
        {
          w: 1580,
          h: 78,
          color: ch > 0.35 ? ROLE.ok : ROLE.gold,
          fill: ch > 0.35 ? '#0f2d24' : '#261e10',
          size: 26,
          glow: 10,
          opacity: alpha * (0.5 + 0.5 * ch),
        },
      ),
      chipPill(
        'Gemini Interactions reports thought & visible tokens separately: sum them!',
        0,
        165,
        {
          w: 1580,
          h: 78,
          color: gm > 0.35 ? ROLE.search : COSMOS.muted,
          fill: gm > 0.35 ? '#10243d' : '#10182d',
          size: 26,
          glow: gm > 0.35 ? 10 : 4,
          opacity: alpha * (0.48 + 0.52 * gm),
        },
      ),
      txt(
        'Always verify whether an endpoint output total is inclusive or additive before estimating cost',
        0,
        290,
        26,
        COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, layer);
  playCue(s, c, 'tt-provider-usage-0', (d) => s.play(showCharge.to(0, { duration: d })));
  playCue(s, c, 'tt-usage-components', (d) => s.play(showCharge.to(0.2, { duration: d })));
  playCue(s, c, 'tt-visible-count', (d) => s.play(showCharge.to(0.4, { duration: d })));
  playCue(s, c, 'tt-provider-usage-1', (d) => s.play(showCharge.to(0.7, { duration: d })));
  playCue(s, c, 'tt-output-charge', (d) => s.play(showCharge.to(0.9, { duration: d })));
  playCue(s, c, 'tt-inclusive-once', (d) => s.play(showCharge.to(1, { duration: d })));
  playCue(s, c, 'tt-provider-usage-2', (d) => s.play(showGemini.to(0.6, { duration: d })));
  playCue(s, c, 'tt-usage-separate', (d) => s.play(showGemini.to(1, { duration: d })));
}
