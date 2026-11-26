// Scene 06: policy-training: Likelihood sharpening vs diverse search training (Chen et al.) + measuring coverage vs verifier-selected gap.
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

export default function policyTraining(s, c) {
  const showChen = s.value(0);
  const showTwoQ = s.value(0);

  const bgAura = aura(0, 0, 740, '#14335c28', '#20184422');
  const title = heroTitle(['Training for Search Diversity:', 'Coverage vs Selected Accuracy'], {
    x: -855,
    y: -430,
    size: 48,
    lineHeight: 56,
    accent: ROLE.score,
  });

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const ch = showChen.value;
    const tq = showTwoQ.value;

    const nodes = [
      txt(
        'EVALUATE EVERY CHECKPOINT WITH THE ACTUAL SERVING SAMPLER & VERIFIER',
        -855,
        -220,
        26,
        ROLE.search,
        'mono',
        'left',
      ).opacity(alpha),

      rect(520, 235, { fill: '#10203a', stroke: ROLE.draft, width: 2.8, radius: 14 })
        .at(-585, -35)
        .opacity(alpha),
      txt('1. STANDARD SFT / RL', -585, -108, 26, ROLE.draft, 'mono', 'center').opacity(alpha),
      txt('Rewards single target', -585, -48, 26, COSMOS.ink, 'sans', 'center').opacity(alpha),
      txt('Boosts pass@1', -585, 6, 26, ROLE.ok, 'mono', 'center').opacity(alpha),
      txt('Can narrow pass@N diversity', -585, 58, 26, ROLE.err, 'sans', 'center').opacity(alpha),

      rect(520, 235, {
        fill: ch > 0.35 ? '#0f2d24' : '#10182d',
        stroke: ch > 0.35 ? ROLE.ok : ROLE.search,
        width: 2.8,
        radius: 14,
      })
        .at(0, -35)
        .opacity(alpha * (0.5 + 0.5 * ch)),
      txt('2. DIVERSITY CAP (CHEN)', 0, -108, 26, ROLE.ok, 'mono', 'center').opacity(alpha),
      txt('Caps single-answer mass', 0, -48, 26, COSMOS.ink, 'sans', 'center').opacity(alpha),
      txt('Preserves distinct paths', 0, 6, 26, ROLE.ok, 'mono', 'center').opacity(alpha),
      txt('Helps search on hard math', 0, 58, 26, COSMOS.muted, 'sans', 'center').opacity(alpha),

      rect(520, 235, {
        fill: tq > 0.35 ? '#181434' : '#10182d',
        stroke: tq > 0.35 ? ROLE.score : ROLE.search,
        width: 2.8,
        radius: 14,
      })
        .at(585, -35)
        .opacity(alpha * (0.5 + 0.5 * tq)),
      txt('3. TWO AUDIT METRICS', 585, -108, 26, ROLE.score, 'mono', 'center').opacity(alpha),
      txt('Q1: Did ANY draft solve it?', 585, -48, 26, COSMOS.ink, 'sans', 'center').opacity(alpha),
      txt('Q2: Did verifier PICK it?', 585, 6, 26, ROLE.gold, 'sans', 'center').opacity(alpha),
      txt('Gap = selection loss!', 585, 58, 26, ROLE.score, 'mono', 'center').opacity(alpha),

      chipPill(
        tq > 0.35
          ? 'Track oracle coverage AND verifier-selected accuracy at every budget N to pinpoint failures'
          : 'A sharper model can win pass@1 while generating fewer distinct solutions for Best-of-N search',
        0,
        220,
        {
          w: 1620,
          h: 76,
          color: tq > 0.35 ? ROLE.score : ROLE.ok,
          size: 26,
          opacity: alpha,
        },
      ),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, layer);
  playCue(s, c, 'tt-policy-training-0', (d) => s.play(showChen.to(0, { duration: d })));
  playCue(s, c, 'tt-policy-training-1', (d) => s.play(showChen.to(0.5, { duration: d })));
  playCue(s, c, 'tt-training-search', (d) => s.play(showChen.to(1, { duration: d })));
  playCue(s, c, 'tt-policy-training-2', (d) => s.play(showTwoQ.to(0.6, { duration: d })));
  playCue(s, c, 'tt-selected-evaluation', (d) => s.play(showTwoQ.to(1, { duration: d })));
}
