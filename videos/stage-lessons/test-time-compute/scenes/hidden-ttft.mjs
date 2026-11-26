// Scene 25: hidden-ttft: Hidden reasoning tokens delay TTFT! At 80 hidden tok/s + 180 ms other: 128 hidden -> 1780 ms; 512 hidden -> 6580 ms + goodput vs raw tokens/s.
import {
  COSMOS,
  ROLE,
  TTFT_FRAME,
  aura,
  chipPill,
  group,
  guardedDynamic,
  heroTitle,
  lumBar,
  playCue,
  txt,
} from '../parts.mjs';

export default function hiddenTtft(s, c) {
  const showShort = s.value(0);
  const showLong = s.value(0);
  const showGoodput = s.value(0);

  const bgAura = aura(0, 0, 740, '#14335c28', '#2a162422');
  const title = heroTitle(
    ['Hidden Thinking Hits TTFT:', '1,780 ms vs 6,580 ms & Service Goodput'],
    {
      x: -855,
      y: -430,
      size: 46,
      lineHeight: 54,
      accent: ROLE.err,
    },
  );

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const sh = showShort.value;
    const lg = showLong.value;
    const gp = showGoodput.value;

    const barX = -460;
    const maxW = 760;
    const px = maxW / 7000;

    const nodes = [
      txt(
        'TTFT = OTHER DELAY (180 ms) + (HIDDEN TOKENS / 80 tok/s) x 1,000 ms',
        -855,
        -220,
        26,
        ROLE.search,
        'mono',
        'left',
      ).opacity(alpha),

      txt('128 hidden tok', -855, -95, 28, ROLE.gold, 'mono', 'left').opacity(alpha),
      lumBar(barX, -95, (0.15 + 0.85 * sh) * TTFT_FRAME.totals[0] * px, 44, ROLE.gold, {
        opacity: alpha,
        maxTrackW: maxW,
      }),
      txt(
        `${TTFT_FRAME.totals[0].toFixed(0)} ms (1.78 s wait)`,
        barX + maxW + 24,
        -95,
        26,
        ROLE.gold,
        'mono',
        'left',
      ).opacity(alpha * (0.48 + 0.52 * sh)),

      txt('512 hidden tok', -855, 45, 28, ROLE.err, 'mono', 'left').opacity(
        alpha * (0.48 + 0.52 * lg),
      ),
      lumBar(barX, 45, (0.15 + 0.85 * lg) * TTFT_FRAME.totals[1] * px, 44, ROLE.err, {
        opacity: alpha * (0.48 + 0.52 * lg),
        maxTrackW: maxW,
      }),
      txt(
        `${TTFT_FRAME.totals[1].toFixed(0)} ms (6.58 s wait!)`,
        barX + maxW + 24,
        45,
        26,
        ROLE.err,
        'mono',
        'left',
      ).opacity(alpha * (0.48 + 0.52 * lg)),

      chipPill(
        gp > 0.35
          ? 'Measure GOODPUT: qualified completions meeting quality + SLA per sec (not raw hidden tok/s!)'
          : 'Hidden decode runs BEFORE token 1 appears AND steals decode slots from neighboring users',
        0,
        225,
        {
          w: 1620,
          h: 78,
          color: gp > 0.35 ? ROLE.ok : ROLE.err,
          fill: gp > 0.35 ? '#0f2d24' : '#321420',
          size: 26,
          glow: 10,
          opacity: alpha,
        },
      ),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, layer);
  playCue(s, c, 'tt-hidden-ttft-0', (d) => s.play(showShort.to(0.2, { duration: d })));
  playCue(s, c, 'tt-hidden-ttft-1', (d) => s.play(showShort.to(0.5, { duration: d })));
  playCue(s, c, 'tt-clock-short', (d) => s.play(showShort.to(1, { duration: d })));
  playCue(s, c, 'tt-clock-long', (d) => s.play(showLong.to(1, { duration: d })));
  playCue(s, c, 'tt-clock-service-verdict', (d) => s.play(showLong.to(1, { duration: d })));
  playCue(s, c, 'tt-hidden-ttft-2', (d) => s.play(showGoodput.to(1, { duration: d })));
}
