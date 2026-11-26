// Scene 21: scaling-evidence: Forced "Wait" overthinking (Ghosal et al.), distraction/constraint degradation (Anthropic Fellows), lifetime FLOPs crossover (Snell et al.).
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

export default function scalingEvidence(s, c) {
  const step = s.value(0); // 0=forced wait, 1=distraction, 2=lifetime flops

  const bgAura = aura(0, 0, 740, '#14335c28', '#2a162422');
  const title = heroTitle(
    ['When Extra Thinking Hurts:', 'Overthinking, Distractions & Lifetime FLOPs'],
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
    const st = step.value;

    const nodes = [
      txt(
        'MORE TEST-TIME TOKENS ARE NOT MONOTONICALLY BETTER ON EVERY TASK',
        -855,
        -220,
        26,
        ROLE.search,
        'mono',
        'left',
      ).opacity(alpha),

      rect(520, 245, {
        fill: st < 0.7 ? '#321420' : '#10182d',
        stroke: st < 0.7 ? ROLE.err : ROLE.draft,
        width: 2.8,
        radius: 14,
      })
        .at(-585, -25)
        .opacity(alpha),
      txt('1. FORCED "WAIT" (GHOSAL)', -585, -108, 26, ROLE.err, 'mono', 'center').opacity(alpha),
      txt('Suppress end-of-thinking', -585, -48, 26, COSMOS.ink, 'sans', 'center').opacity(alpha),
      txt('Append "Wait..." tokens', -585, 6, 26, ROLE.gold, 'mono', 'center').opacity(alpha),
      txt('Can overturn right answers!', -585, 60, 26, ROLE.err, 'sans', 'center').opacity(alpha),

      rect(520, 245, {
        fill: st >= 0.7 && st < 1.7 ? '#261e10' : '#10182d',
        stroke: st >= 0.7 && st < 1.7 ? ROLE.gold : ROLE.search,
        width: 2.8,
        radius: 14,
      })
        .at(0, -25)
        .opacity(alpha * (0.5 + 0.5 * Math.min(1, st))),
      txt('2. DISTRACTIONS (ANTHROPIC)', 0, -108, 26, ROLE.gold, 'mono', 'center').opacity(alpha),
      txt('Constraint-tracking tasks', 0, -48, 26, COSMOS.ink, 'sans', 'center').opacity(alpha),
      txt('Longer trace = more drift', 0, 6, 26, ROLE.gold, 'sans', 'center').opacity(alpha),
      txt('Benchmark your own tasks!', 0, 60, 26, COSMOS.muted, 'sans', 'center').opacity(alpha),

      rect(520, 245, {
        fill: st >= 1.7 ? '#0f2d24' : '#10182d',
        stroke: st >= 1.7 ? ROLE.ok : ROLE.search,
        width: 2.8,
        radius: 14,
      })
        .at(585, -25)
        .opacity(alpha * (0.5 + 0.5 * Math.min(1, st / 2))),
      txt('3. LIFETIME FLOPs (SNELL)', 585, -108, 26, ROLE.ok, 'mono', 'center').opacity(alpha),
      txt('Small + search vs Big x1', 585, -48, 26, COSMOS.ink, 'sans', 'center').opacity(alpha),
      txt('1M queries pay per query!', 585, 6, 26, ROLE.ok, 'mono', 'center').opacity(alpha),
      txt('Traffic sets crossover point', 585, 60, 26, COSMOS.muted, 'sans', 'center').opacity(
        alpha,
      ),

      chipPill(
        st >= 1.7
          ? 'Balance pretraining FLOPs against expected lifetime query volume before choosing small+search vs big!'
          : 'Measure accuracy across effort levels on your own workload instead of assuming longer is always better',
        0,
        225,
        {
          w: 1620,
          h: 76,
          color: st >= 1.7 ? ROLE.ok : ROLE.gold,
          size: 26,
          opacity: alpha,
        },
      ),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, layer);
  playCue(s, c, 'tt-scaling-evidence-0', (d) => s.play(step.to(0, { duration: d })));
  playCue(s, c, 'tt-forced-extension', (d) => s.play(step.to(0.3, { duration: d })));
  playCue(s, c, 'tt-scaling-evidence-1', (d) => s.play(step.to(1.2, { duration: d })));
  playCue(s, c, 'tt-scaling-evidence-2', (d) => s.play(step.to(1.8, { duration: d })));
  playCue(s, c, 'tt-lifetime-work', (d) => s.play(step.to(2.0, { duration: d })));
}
