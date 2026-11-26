// Scene 07: fitting-and-fairness: C holds 2 of 3 pages, D needs 2 -> 4 small jobs repeatedly take page 2 while D starves.
import {
  COSMOS,
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

export default function fittingAndFairness(s, c) {
  const mode = s.value(0); // 0=strict FIFO (page 2 empty), 1=fit-scan (4 small jobs cycle), 2=remedies

  const bgAura = aura(0, 0, 740, '#14335c28', '#2a162822');
  const title = heroTitle(['Head-of-Line Blocking vs', 'Small-Job Starvation'], {
    x: -855,
    y: -430,
    size: 50,
    lineHeight: 58,
    accent: ROLE.warn,
  });

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const m = Math.round(mode.value);

    const nodes = [
      txt(
        '3-PAGE GPU POOL (C OWNS PAGES 0 & 1; PAGE 2 IS FREE)',
        -855,
        -215,
        26,
        ROLE.a,
        'mono',
        'left',
      ).opacity(alpha),

      rect(340, 120, { fill: '#1a183b', stroke: ROLE.c, width: 2.8, radius: 12 })
        .at(-675, -100)
        .opacity(alpha),
      txt('Page 0: C', -675, -100, 32, ROLE.c, 'mono', 'center').opacity(alpha),

      rect(340, 120, { fill: '#1a183b', stroke: ROLE.c, width: 2.8, radius: 12 })
        .at(-290, -100)
        .opacity(alpha),
      txt('Page 1: C', -290, -100, 32, ROLE.c, 'mono', 'center').opacity(alpha),

      rect(340, 120, {
        fill: m >= 1 ? '#103128' : '#12182b',
        stroke: m >= 1 ? ROLE.ok : ROLE.d,
        width: 3.2,
        radius: 12,
      })
        .at(95, -100)
        .glow(10, m >= 1 ? ROLE.ok : ROLE.d)
        .opacity(alpha),
      txt(
        m >= 1 ? 'Page 2: S1..S4' : 'Page 2: FREE',
        95,
        -100,
        32,
        m >= 1 ? ROLE.ok : ROLE.d,
        'mono',
        'center',
      ).opacity(alpha),

      // Waiting queue on right / bottom
      txt('WAITING QUEUE', -855, 40, 26, ROLE.d, 'mono', 'left').opacity(alpha),
      chipPill('HEAD: D  (needs 2 pages, STILL WAITING!)', -420, 125, {
        w: 840,
        h: 78,
        color: ROLE.warn,
        fill: '#2e1420',
        size: 28,
        glow: 10,
        opacity: alpha,
      }),
      chipPill(
        m >= 1 ? 'S1..S4 (1 pg each) -> ALL 4 FINISHED!' : 'Small job S1 (1 pg) behind D',
        420,
        125,
        {
          w: 780,
          h: 78,
          color: m >= 1 ? ROLE.ok : ROLE.a,
          size: 26,
          glow: m >= 1 ? 10 : 0,
          opacity: alpha,
        },
      ),

      txt(
        m >= 2
          ? 'Higher priority alone cannot give D a 2nd page: reserve capacity, wait for C, or preempt C; count expirations!'
          : m === 1
            ? 'Fit-scanning fills Page 2 four times in a row while D never moves from the front!'
            : 'Under strict FIFO, Page 2 sits idle because D at the head needs 2 free pages at once',
        0,
        295,
        28,
        m >= 2 ? ROLE.d : m === 1 ? ROLE.warn : COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, layer);
  playCue(s, c, 'fitting-and-fairness-b1', (d) => s.play(mode.to(0, { duration: d })));
  playCue(s, c, 'fairness-head', (d) => s.play(mode.to(0, { duration: d })));
  playCue(s, c, 'fairness-four', (d) => s.play(mode.to(1, { duration: d })));
  playCue(s, c, 'fitting-and-fairness-b2', (d) => s.play(mode.to(2, { duration: d })));
}
