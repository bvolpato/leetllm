// Scene 11: projected-growth: 2 full 16-slot pages -> position 17 needs 4 pages -> pause background -> reserve vs write.
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
  swapVis,
  txt,
} from '../parts.mjs';

export default function projectedGrowth(s, c) {
  const view1Vis = s.value(1); // 2-page pool + pause background -> urgent finishes -> resume
  const view2Vis = s.value(0); // Reserve before sampling vs write KV on following pass + cancel/shared rules
  const revealFour = s.value(0);
  const poolStep = s.value(0); // 0=both full, 1=pause bg, 2=urgent takes p1, 3=bg resumes, 4=both free, 5=32-pos cap
  const writeStep = s.value(0); // 0=reserve, 1=write next pass, 2=cancel, 3=release, 4=shared

  const bgAura = aura(0, 0, 740, '#14335c28', '#2a162822');
  const title = heroTitle(['Projected Growth &', 'Preemption Under Full Pages'], {
    x: -855,
    y: -430,
    size: 48,
    lineHeight: 56,
    accent: ROLE.warn,
  });

  const view1 = guardedDynamic(view1Vis, (alpha) => {
    const rf = revealFour.value;
    const ps = Math.round(poolStep.value);

    const p0Label = ps === 3 ? 'BG (16/16)' : ps >= 4 ? 'FREE (0/16)' : 'URGENT (16/16)';
    const p0Col = ps === 3 ? ROLE.b : ps >= 4 ? ROLE.ok : ROLE.warn;
    const p1Label =
      ps === 0
        ? 'BG (16/16)'
        : ps === 1
          ? 'FREE (BG PAUSED)'
          : ps === 2
            ? 'URGENT (pos 17)'
            : ps === 3
              ? 'BG (pos 17)'
              : 'FREE (0/16)';
    const p1Col =
      ps === 0 ? ROLE.b : ps === 1 ? ROLE.ok : ps === 2 ? ROLE.warn : ps === 3 ? ROLE.b : ROLE.ok;

    const nodes = [
      txt(
        '2-PAGE GPU POOL (16 SLOTS / PAGE = 32 TOTAL POSITIONS)',
        -855,
        -215,
        26,
        ROLE.a,
        'mono',
        'left',
      ).opacity(alpha),

      rect(520, 145, { fill: '#15223d', stroke: p0Col, width: 3.2, radius: 14 })
        .at(-540, -85)
        .glow(10, p0Col)
        .opacity(alpha),
      txt('Physical Page 0', -540, -125, 26, COSMOS.muted, 'mono', 'center').opacity(alpha),
      txt(p0Label, -540, -68, 34, p0Col, 'mono', 'center').opacity(alpha),

      rect(520, 145, { fill: '#15223d', stroke: p1Col, width: 3.2, radius: 14 })
        .at(100, -85)
        .glow(10, p1Col)
        .opacity(alpha),
      txt('Physical Page 1', 100, -125, 26, COSMOS.muted, 'mono', 'center').opacity(alpha),
      txt(p1Label, 100, -68, 34, p1Col, 'mono', 'center').opacity(alpha),

      // Right prediction box: Need for both to advance past 16 -> 4 pages!
      chipPill(rf > 0.4 ? 'Need: 4 pages!' : 'Need: ? pages', 640, -85, {
        w: 400,
        h: 110,
        color: rf > 0.4 ? ROLE.warn : ROLE.d,
        fill: rf > 0.4 ? '#321420' : '#261e10',
        size: 32,
        glow: 12,
        opacity: alpha,
      }),

      txt(
        ps >= 5
          ? 'Pool limit = 32 positions: reject any request whose max history exceeds total pool capacity'
          : ps >= 4
            ? 'Both replies completed after 1 pause; both pages return to free pool'
            : ps === 2
              ? 'Background paused -> Urgent claims Page 1 for pos 17 and finishes first'
              : rf > 0.4
                ? 'Pos 17 opens a new page each -> 4 pages needed!'
                : 'Both pages hold 16/16 positions: how many pages would reserving pos 17 for both need?',
        0,
        150,
        28,
        ps >= 4 ? ROLE.ok : rf > 0.4 ? ROLE.warn : ROLE.d,
        'sans',
        'center',
      ).opacity(alpha),
    ];

    return group(...nodes);
  });

  const view2 = guardedDynamic(view2Vis, (alpha) => {
    const ws = Math.round(writeStep.value);
    const nodes = [
      txt(
        'SLOT LIFECYCLE: RESERVATION vs KV WRITE vs SAFE REUSE',
        -855,
        -210,
        26,
        ROLE.a,
        'mono',
        'left',
      ).opacity(alpha),

      chipPill('Pass t: Reserve slot BEFORE sampling', -460, -85, {
        w: 740,
        h: 82,
        color: ws === 0 ? ROLE.d : ROLE.a,
        size: 28,
        glow: ws === 0 ? 12 : 4,
        opacity: alpha,
      }),
      chipPill('Pass t+1: Write KV when token is INPUT', 430, -85, {
        w: 760,
        h: 82,
        color: ws >= 1 ? ROLE.ok : COSMOS.rule,
        size: 28,
        glow: ws === 1 ? 12 : 4,
        opacity: alpha * (ws >= 1 ? 1 : 0.4),
      }),

      chipPill('Cancel -> discard late output', -560, 105, {
        w: 520,
        h: 76,
        color: ws >= 2 ? ROLE.warn : COSMOS.rule,
        size: 26,
        opacity: alpha * (ws >= 2 ? 1 : 0.4),
      }),
      chipPill('Private -> wait R/W/Xfer', 0, 105, {
        w: 500,
        h: 76,
        color: ws >= 3 ? ROLE.d : COSMOS.rule,
        size: 26,
        opacity: alpha * (ws >= 3 ? 1 : 0.4),
      }),
      chipPill('Shared -> check refcount', 560, 105, {
        w: 520,
        h: 76,
        color: ws >= 4 ? ROLE.ok : COSMOS.rule,
        size: 26,
        opacity: alpha * (ws >= 4 ? 1 : 0.4),
      }),

      txt(
        'Page ownership stays locked during every running pass',
        0,
        270,
        28,
        COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
    ];
    return group(...nodes);
  });

  s.add(bgAura, title, view1, view2);
  playCue(s, c, 'projected-growth-b1', (d) => s.play(poolStep.to(0, { duration: d })));
  playCue(s, c, 'growth-next', (d) => s.play(poolStep.to(0, { duration: d })));
  // Strict prediction withholding: reveal "4 pages" only after projected-growth-b2!
  playCue(s, c, 'projected-growth-b2', (d) => s.play(revealFour.to(1, { duration: d })), {
    after: true,
  });
  playCue(s, c, 'growth-preempt', (d) => s.play(poolStep.to(1, { duration: d })));
  playCue(s, c, 'growth-reserve', (d) => s.play(poolStep.to(2, { duration: d })));
  playCue(s, c, 'growth-resume', (d) => s.play(poolStep.to(3, { duration: d })));
  playCue(s, c, 'growth-done', (d) => s.play(poolStep.to(4, { duration: d })));
  playCue(s, c, 'growth-limit', (d) => s.play(poolStep.to(5, { duration: d })));
  playCue(s, c, 'projected-growth-b3', (d) => s.play(swapVis(view1Vis, view2Vis, d)));
  playCue(s, c, 'growth-write', (d) => s.play(writeStep.to(1, { duration: d })));
  playCue(s, c, 'growth-cancel', (d) => s.play(writeStep.to(2, { duration: d })));
  playCue(s, c, 'growth-release', (d) => s.play(writeStep.to(3, { duration: d })));
  playCue(s, c, 'growth-shared', (d) => s.play(writeStep.to(4, { duration: d })));
}
