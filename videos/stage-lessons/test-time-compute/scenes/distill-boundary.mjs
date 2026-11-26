// Scene 16: distill-boundary: What crosses teacher->student (worked solution ONLY; discarded drafts, checker code & selection rule stay with teacher!) + Setlur et al. verification scaling.
import {
  COSMOS,
  ROLE,
  arrow,
  aura,
  chipPill,
  group,
  guardedDynamic,
  heroTitle,
  playCue,
  rect,
  txt,
} from '../parts.mjs';

export default function distillBoundary(s, c) {
  const showCross = s.value(0);
  const showVerify = s.value(0);

  const bgAura = aura(0, 0, 740, '#14335c28', '#2a162422');
  const title = heroTitle(['What Distillation Transfers:', 'Traces Move, Checkers Stay Behind'], {
    x: -855,
    y: -430,
    size: 46,
    lineHeight: 54,
    accent: ROLE.gold,
  });

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const cr = showCross.value;
    const vf = showVerify.value;

    const nodes = [
      txt(
        'TRACE DISTILLATION VS VERIFIED PRACTICE AT SERVING TIME',
        -855,
        -220,
        26,
        ROLE.search,
        'mono',
        'left',
      ).opacity(alpha),

      rect(640, 225, { fill: '#261e10', stroke: ROLE.gold, width: 2.8, radius: 14 })
        .at(-500, -40)
        .opacity(alpha),
      txt('STAYS WITH TEACHER', -500, -112, 26, ROLE.gold, 'mono', 'center').opacity(alpha),
      txt('Discarded failed drafts', -500, -52, 26, COSMOS.ink, 'sans', 'center').opacity(alpha),
      txt('External checker / calculator code', -500, 4, 26, ROLE.err, 'sans', 'center').opacity(
        alpha,
      ),
      txt('Selection & rejection rule', -500, 44, 26, COSMOS.muted, 'sans', 'center').opacity(
        alpha,
      ),

      arrow([-165, -40], [165, -40], { stroke: ROLE.ok, width: 4, head: 12 }).opacity(
        alpha * (0.5 + 0.5 * cr),
      ),
      txt('Worked solution trace', 0, -76, 26, ROLE.ok, 'mono', 'center').opacity(
        alpha * (0.5 + 0.5 * cr),
      ),

      rect(640, 225, {
        fill: vf > 0.35 ? '#0f2d24' : '#10203a',
        stroke: vf > 0.35 ? ROLE.ok : ROLE.draft,
        width: 2.8,
        radius: 14,
      })
        .at(500, -40)
        .opacity(alpha),
      txt('REACHES STUDENT', 500, -112, 26, ROLE.ok, 'mono', 'center').opacity(alpha),
      txt('Final accepted trajectory', 500, -52, 26, COSMOS.ink, 'sans', 'center').opacity(alpha),
      txt('Needs its own tool/checker!', 500, 4, 26, ROLE.ok, 'mono', 'center').opacity(alpha),
      txt('Or verified self-practice (Setlur)', 500, 44, 26, ROLE.gold, 'sans', 'center').opacity(
        alpha * (0.5 + 0.5 * vf),
      ),

      chipPill(
        vf > 0.35
          ? 'Test whether your chosen student + tool + budget catches its own errors on real production tasks!'
          : 'If a task needs exact arithmetic, give the distilled student a real calculator at serving time',
        0,
        215,
        {
          w: 1620,
          h: 76,
          color: vf > 0.35 ? ROLE.ok : ROLE.gold,
          size: 26,
          opacity: alpha,
        },
      ),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, layer);
  playCue(s, c, 'tt-distill-boundary-0', (d) => s.play(showCross.to(0.4, { duration: d })));
  playCue(s, c, 'tt-trace-transfer', (d) => s.play(showCross.to(1, { duration: d })));
  playCue(s, c, 'tt-distill-boundary-1', (d) => s.play(showVerify.to(0.6, { duration: d })));
  playCue(s, c, 'tt-distill-boundary-2', (d) => s.play(showVerify.to(1, { duration: d })));
}
