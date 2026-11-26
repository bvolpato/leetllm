// Scene 14: r1-pipeline: Cold-start SFT -> Reasoning RL (+language reward) -> generate 600k+200k -> predict starting weights? -> AFTER tt-r1-weight-reset reveal ORIGINAL V3-Base (2 epochs) -> Final RL!
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

export default function r1Pipeline(s, c) {
  const revealReset = s.value(0); // strictly withheld until AFTER tt-r1-weight-reset!
  const showFinalRl = s.value(0);

  const bgAura = aura(0, 0, 740, '#14335c28', '#14383222');
  const title = heroTitle(
    ['DeepSeek-R1 Multi-Stage Pipeline:', 'Cold-Start, RL & SFT Weight Flow'],
    {
      x: -855,
      y: -430,
      size: 46,
      lineHeight: 54,
      accent: ROLE.ok,
    },
  );

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const rs = revealReset.value;
    const rl = showFinalRl.value;

    const nodes = [
      txt(
        'STAGE 1-2 GENERATE 600K REASONING + 200K GENERAL EXAMPLES',
        -855,
        -220,
        26,
        ROLE.search,
        'mono',
        'left',
      ).opacity(alpha),

      rect(370, 155, { fill: '#10203a', stroke: ROLE.draft, width: 2.8, radius: 12 })
        .at(-655, -75)
        .opacity(alpha),
      txt('V3-BASE', -655, -112, 26, ROLE.draft, 'mono', 'center').opacity(alpha),
      txt('Cold-start SFT', -655, -60, 26, COSMOS.ink, 'sans', 'center').opacity(alpha),
      txt('Readable traces', -655, -18, 26, COSMOS.muted, 'sans', 'center').opacity(alpha),

      arrow([-455, -75], [-395, -75], { stroke: ROLE.search, width: 3.5, head: 11 }).opacity(alpha),

      rect(370, 155, { fill: '#261e10', stroke: ROLE.gold, width: 2.8, radius: 12 })
        .at(-200, -75)
        .opacity(alpha),
      txt('REASONING RL', -200, -112, 26, ROLE.gold, 'mono', 'center').opacity(alpha),
      txt('+Language reward', -200, -60, 26, COSMOS.ink, 'sans', 'center').opacity(alpha),
      txt('Emits 600k traces', -200, -18, 26, ROLE.gold, 'mono', 'center').opacity(alpha),

      arrow([0, -75], [60, -75], { stroke: ROLE.ok, width: 3.5, head: 11 }).opacity(alpha),

      rect(380, 155, {
        fill: rs > 0.35 ? '#0f2d24' : '#261e10',
        stroke: rs > 0.35 ? ROLE.ok : ROLE.gold,
        width: 3,
        radius: 12,
      })
        .at(260, -75)
        .opacity(alpha),
      txt(
        'STAGE 3 SFT (2 EP)',
        260,
        -112,
        26,
        rs > 0.35 ? ROLE.ok : ROLE.gold,
        'mono',
        'center',
      ).opacity(alpha),
      txt(
        rs > 0.35 ? 'Starts: V3-BASE!' : 'Starts: which weights?',
        260,
        -60,
        26,
        rs > 0.35 ? ROLE.ok : ROLE.gold,
        'mono',
        'center',
      ).opacity(alpha),
      txt('600k + 200k mix', 260, -18, 26, COSMOS.ink, 'mono', 'center').opacity(alpha),

      arrow([465, -75], [520, -75], { stroke: ROLE.score, width: 3.5, head: 11 }).opacity(
        alpha * (0.5 + 0.5 * rl),
      ),

      rect(330, 155, {
        fill: rl > 0.35 ? '#181434' : '#10182d',
        stroke: ROLE.score,
        width: 2.8,
        radius: 12,
      })
        .at(695, -75)
        .opacity(alpha * (0.5 + 0.5 * rl)),
      txt('FINAL RL', 695, -112, 26, ROLE.score, 'mono', 'center').opacity(alpha),
      txt('Helpful: summary', 695, -60, 26, COSMOS.ink, 'sans', 'center').opacity(alpha),
      txt('Safe: full trace', 695, -18, 26, ROLE.gold, 'sans', 'center').opacity(alpha),

      chipPill(
        rl > 0.35
          ? 'Final RL checks reasoning by rules, helpfulness on summary, harmlessness across full response!'
          : rs > 0.35
            ? 'Stage 3 resets to original V3-Base weights and trains 2 epochs on 600k reasoning + 200k general!'
            : 'After curating 600k reasoning + 200k general data, which weights start the new SFT stage?',
        0,
        175,
        {
          w: 1620,
          h: 78,
          color: rs > 0.35 ? ROLE.ok : ROLE.gold,
          fill: rs > 0.35 ? '#0f2d24' : '#261e10',
          size: 26,
          glow: 10,
          opacity: alpha,
        },
      ),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, layer);
  playCue(s, c, 'tt-r1-pipeline-0', (d) => s.play(revealReset.to(0, { duration: d })));
  playCue(s, c, 'r1-language', (d) => s.play(revealReset.to(0, { duration: d })));
  playCue(s, c, 'tt-r1-data-edge', (d) => s.play(revealReset.to(0, { duration: d })));
  playCue(s, c, 'r1-weight-question', (d) => s.play(revealReset.to(0, { duration: d })));
  // Strict prediction withholding: reveal original V3-Base reset only after tt-r1-weight-reset!
  playCue(s, c, 'tt-r1-weight-reset', (d) => s.play(revealReset.to(1, { duration: d })), {
    after: true,
  });
  playCue(s, c, 'tt-r1-pipeline-1', (d) => s.play(revealReset.to(1, { duration: d })));
  playCue(s, c, 'r1-general', (d) => s.play(revealReset.to(1, { duration: d })));
  playCue(s, c, 'r1-epochs', (d) => s.play(revealReset.to(1, { duration: d })));
  playCue(s, c, 'tt-r1-pipeline-2', (d) => s.play(showFinalRl.to(0.4, { duration: d })));
  playCue(s, c, 'r1-helpfulness', (d) => s.play(showFinalRl.to(0.7, { duration: d })));
  playCue(s, c, 'r1-harmlessness', (d) => s.play(showFinalRl.to(1, { duration: d })));
}
