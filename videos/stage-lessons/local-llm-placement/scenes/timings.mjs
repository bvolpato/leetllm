// Scene 21: timings: 1000 prompt tokens (600 cached + 400 uncached) / 0.2s = 2000 tok/s (NOT 5000!); 80 output / 2.0s = 40 tok/s -> missing dur = N/A.
import {
  COSMOS,
  RATES_OK,
  ROLE,
  aura,
  chipPill,
  group,
  guardedDynamic,
  heroTitle,
  playCue,
  rect,
  txt,
} from '../parts.mjs';

export default function timings(s, c) {
  const showSpan = s.value(0); // strictly withheld until select-span / selected-count!
  const showPromptRate = s.value(0);
  const showOutRate = s.value(0);
  const dropOutDur = s.value(0);

  const bgAura = aura(0, 0, 740, '#14335c28', '#14383222');
  const title = heroTitle(['Which Prompt Tokens', 'Did the Clock Actually Time?'], {
    x: -855,
    y: -430,
    size: 48,
    lineHeight: 56,
    accent: ROLE.vram,
  });

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const sp = showSpan.value;
    const pr = showPromptRate.value;
    const or = showOutRate.value;
    const dr = dropOutDur.value;

    const barX = -780;
    const totalW = 1440;
    const cachedW = totalW * 0.6;
    const uncachedW = totalW * 0.4;

    const nodes = [
      txt(
        'PROMPT RECEIPT: 1,000 TOKENS (600 CACHED + 400 UNCACHED)  |  PROMPT EVAL = 0.20 s',
        -855,
        -220,
        26,
        ROLE.vram,
        'mono',
        'left',
      ).opacity(alpha),

      // 600 cached prefix + 400 uncached suffix
      rect(cachedW - 6, 78, {
        fill: '#13243b',
        stroke: sp > 0.3 ? COSMOS.rule : ROLE.vram,
        width: 2.6,
        radius: 10,
      })
        .at(barX + cachedW * 0.5, -105)
        .opacity(alpha * (sp > 0.3 ? 0.5 : 1)),
      txt(
        '600 Cached Prefix (skipped)',
        barX + cachedW * 0.5,
        -105,
        28,
        COSMOS.muted,
        'mono',
        'center',
      ).opacity(alpha),

      rect(uncachedW - 6, 78, {
        fill: sp > 0.3 ? '#0f2d24' : '#15233d',
        stroke: sp > 0.3 ? ROLE.ok : ROLE.gold,
        width: sp > 0.3 ? 3.8 : 2.6,
        radius: 10,
      })
        .at(barX + cachedW + uncachedW * 0.5, -105)
        .glow(sp > 0.3 ? 12 : 0, ROLE.ok)
        .opacity(alpha),
      txt(
        '400 Uncached Suffix',
        barX + cachedW + uncachedW * 0.5,
        -105,
        28,
        sp > 0.3 ? ROLE.ok : ROLE.gold,
        'mono',
        'center',
      ).opacity(alpha),

      // Two rate cards below (withheld until Beat 2 cues!)
      chipPill(
        pr > 0.4
          ? `Uncached Prefill: 400 / 0.2s = ${RATES_OK.prefill} tok/s (NOT 5,000!)`
          : 'Which span belongs over the 0.20 s prompt clock?',
        -325,
        85,
        {
          w: 980,
          h: 84,
          color: pr > 0.4 ? ROLE.ok : ROLE.gold,
          fill: pr > 0.4 ? '#0f2d24' : '#261e10',
          size: 28,
          glow: 10,
          opacity: alpha,
        },
      ),
      chipPill(
        dr > 0.4
          ? 'Output Dur Missing -> Rate: N/A'
          : or > 0.3
            ? `Output: 80 / 2.0s = ${RATES_OK.output} tok/s`
            : 'Output Clock: 80 tokens',
        535,
        85,
        {
          w: 610,
          h: 84,
          color: dr > 0.4 ? ROLE.work : or > 0.3 ? ROLE.vram : COSMOS.rule,
          fill: dr > 0.4 ? '#321420' : '#10182d',
          size: 28,
          opacity: alpha,
        },
      ),

      txt(
        dr > 0.4
          ? 'Keep server version with receipt; measure TTFT and inter-token gaps directly on the client clock!'
          : 'Dividing all 1,000 tokens by 0.20 s falsely credits 600 cached tokens that were skipped',
        0,
        260,
        28,
        dr > 0.4 ? ROLE.vram : COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, layer);
  playCue(s, c, 'cached-prefix', (d) => s.play(showSpan.to(0, { duration: d })));
  playCue(s, c, 'which-time', (d) => s.play(showSpan.to(0, { duration: d })));
  // Strict prediction withholding: move bracket & reveal 2000 tok/s only in Beat 2!
  playCue(s, c, 'select-span', (d) => s.play(showSpan.to(1, { duration: d })));
  playCue(s, c, 'selected-count', (d) => s.play(showSpan.to(1, { duration: d })));
  playCue(s, c, 'prompt-result', (d) => s.play(showPromptRate.to(1, { duration: d })), {
    after: true,
  });
  playCue(s, c, 'own-duration', (d) => s.play(showOutRate.to(1, { duration: d })));
  playCue(s, c, 'remove-duration', (d) => s.play(dropOutDur.to(1, { duration: d })));
}
