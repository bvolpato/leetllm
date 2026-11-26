// Scene 13: r1-zero: DeepSeek-R1-Zero (base + pure RL with rule-based accuracy + format rewards, no PRM/ORM) -> emergent reflection + readability / language-mixing tradeoff.
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

export default function r1Zero(s, c) {
  const showRewards = s.value(0);
  const showEmergent = s.value(0);

  const bgAura = aura(0, 0, 740, '#14335c28', '#20184422');
  const title = heroTitle(['DeepSeek-R1-Zero:', 'Pure RL With Rule-Based Rewards'], {
    x: -855,
    y: -430,
    size: 48,
    lineHeight: 56,
    accent: ROLE.search,
  });

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const rw = showRewards.value;
    const em = showEmergent.value;

    const nodes = [
      txt(
        'NO COLD-START SFT  |  NO LEARNED NEURAL ORM OR PRM',
        -855,
        -220,
        26,
        ROLE.search,
        'mono',
        'left',
      ).opacity(alpha),

      rect(440, 175, { fill: '#10203a', stroke: ROLE.draft, width: 2.8, radius: 12 })
        .at(-610, -55)
        .opacity(alpha),
      txt('1. PRETRAINED BASE', -610, -100, 26, ROLE.draft, 'mono', 'center').opacity(alpha),
      txt('Starts directly from V3-Base', -610, -42, 26, COSMOS.ink, 'sans', 'center').opacity(
        alpha,
      ),

      arrow([-375, -55], [-290, -55], { stroke: ROLE.search, width: 3.5, head: 11 }).opacity(alpha),

      rect(480, 175, {
        fill: rw > 0.35 ? '#0f2d24' : '#10182d',
        stroke: ROLE.ok,
        width: 2.8,
        radius: 12,
      })
        .at(-35, -55)
        .opacity(alpha * (0.5 + 0.5 * rw)),
      txt('2. RULE REWARDS ONLY', -35, -100, 26, ROLE.ok, 'mono', 'center').opacity(alpha),
      txt('Answer accuracy + format', -35, -42, 26, COSMOS.ink, 'sans', 'center').opacity(alpha),

      arrow([220, -55], [305, -55], { stroke: ROLE.gold, width: 3.5, head: 11 }).opacity(
        alpha * (0.5 + 0.5 * em),
      ),

      rect(490, 175, {
        fill: em > 0.35 ? '#261e10' : '#10182d',
        stroke: ROLE.gold,
        width: 2.8,
        radius: 12,
      })
        .at(565, -55)
        .opacity(alpha * (0.5 + 0.5 * em)),
      txt('3. EMERGENT BEHAVIOR', 565, -100, 26, ROLE.gold, 'mono', 'center').opacity(alpha),
      txt('Reflection + self-checking', 565, -52, 26, ROLE.ok, 'sans', 'center').opacity(alpha),
      txt('BUT language mixing!', 565, -4, 26, ROLE.err, 'mono', 'center').opacity(alpha),

      chipPill(
        em > 0.35
          ? 'Motivated R1: add readable cold-start examples before RL to fix language mixing & readability!'
          : 'Rule-based verification alone can grow long self-checking traces without a neural reward model',
        0,
        195,
        {
          w: 1620,
          h: 76,
          color: em > 0.35 ? ROLE.gold : ROLE.ok,
          size: 26,
          opacity: alpha,
        },
      ),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, layer);
  playCue(s, c, 'tt-r1-zero-0', (d) => s.play(showRewards.to(0.4, { duration: d })));
  playCue(s, c, 'tt-zero-rewards', (d) => s.play(showRewards.to(1, { duration: d })));
  playCue(s, c, 'tt-r1-zero-1', (d) => s.play(showEmergent.to(1, { duration: d })));
}
