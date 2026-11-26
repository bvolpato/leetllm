// Scene 23: memory: 8 branches x 1000 tok + 4000 shared prompt -> someone says 5000 (1 branch!) -> AFTER retained-positions reveal 12,000 pos (1.5 GiB) vs unshared 40,000 pos (5.0 GiB)!
import {
  COSMOS,
  ROLE,
  aura,
  chipPill,
  group,
  guardedDynamic,
  heroTitle,
  lumBar,
  playCue,
  txt,
} from '../parts.mjs';

export default function memory(s, c) {
  const revealShared = s.value(0); // strictly withheld until AFTER retained-positions!
  const showCopied = s.value(0);

  const bgAura = aura(0, 0, 740, '#14335c28', '#2a162422');
  const title = heroTitle(['Parallel Branch KV Memory:', 'Shared Prompt vs Copied Prefixes'], {
    x: -855,
    y: -430,
    size: 46,
    lineHeight: 54,
    accent: ROLE.search,
  });

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const sh = revealShared.value;
    const cp = showCopied.value;

    const barX = -460;
    const maxW = 760;
    const px = maxW / 42000;

    const nodes = [
      txt(
        '8 FINISHED BRANCHES:  1 PROMPT (4,000) + 8 PRIVATE TAILS (1,000 EACH)  |  128 KiB/POS',
        -855,
        -220,
        26,
        ROLE.search,
        'mono',
        'left',
      ).opacity(alpha),

      // Wrong 1-branch count
      txt('Reported (1 tail)', -855, -105, 28, ROLE.gold, 'mono', 'left').opacity(alpha),
      lumBar(barX, -105, 5000 * px, 42, ROLE.gold, { opacity: alpha, maxTrackW: maxW }),
      txt(
        '5,000 pos (missing 7 tails!)',
        barX + maxW + 24,
        -105,
        26,
        ROLE.gold,
        'mono',
        'left',
      ).opacity(alpha),

      // True shared prompt: 4000 + 8*1000 = 12,000
      txt('Shared Prompt', -855, 5, 28, ROLE.ok, 'mono', 'left').opacity(alpha),
      lumBar(barX, 5, sh > 0.35 ? 12000 * px : 24, 42, ROLE.ok, {
        opacity: alpha * (0.48 + 0.52 * sh),
        maxTrackW: maxW,
      }),
      txt(
        sh > 0.35 ? '12,000 pos (~1.50 GiB)' : '? total positions',
        barX + maxW + 24,
        5,
        26,
        sh > 0.35 ? ROLE.ok : ROLE.gold,
        'mono',
        'left',
      ).opacity(alpha),

      // Unshared prompt copies: 8 * 5000 = 40,000
      txt('Unshared Copies', -855, 115, 28, ROLE.err, 'mono', 'left').opacity(
        alpha * (0.48 + 0.52 * cp),
      ),
      lumBar(barX, 115, cp > 0.35 ? 40000 * px : 24, 42, ROLE.err, {
        opacity: alpha * (0.48 + 0.52 * cp),
        maxTrackW: maxW,
      }),
      txt(
        cp > 0.35 ? '40,000 pos (~5.00 GiB!)' : '8 prompt copies',
        barX + maxW + 24,
        115,
        26,
        ROLE.err,
        'mono',
        'left',
      ).opacity(alpha * (0.48 + 0.52 * cp)),

      chipPill(
        cp > 0.35
          ? 'Both generated the same 8,000 tokens; copying the prompt 8x inflated live KV cache 3.3x!'
          : sh > 0.35
            ? '4,000 + 8 x 1,000 = 12,000 pos!'
            : 'Reporting 5,000 positions counted how many of the 8 private branch continuations?',
        0,
        260,
        {
          w: 1620,
          h: 76,
          color: cp > 0.35 ? ROLE.err : sh > 0.35 ? ROLE.ok : ROLE.gold,
          size: 26,
          opacity: alpha,
        },
      ),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, layer);
  playCue(s, c, 'shared-prompt', (d) => s.play(revealShared.to(0, { duration: d })));
  playCue(s, c, 'private-branches', (d) => s.play(revealShared.to(0, { duration: d })));
  // Strict prediction withholding: reveal 12,000 only after retained-positions!
  playCue(s, c, 'retained-positions', (d) => s.play(revealShared.to(1, { duration: d })), {
    after: true,
  });
  playCue(s, c, 'unshare-prefix', (d) => s.play(showCopied.to(0.5, { duration: d })));
  playCue(s, c, 'copied-total', (d) => s.play(showCopied.to(0.85, { duration: d })));
  playCue(s, c, 'kv-volume', (d) => s.play(showCopied.to(1, { duration: d })));
  playCue(s, c, 'resource-accounting', (d) => s.play(showCopied.to(1, { duration: d })));
}
