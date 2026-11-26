// Scene 19: opaque-continuation: Multi-turn reasoning continuation (OpenAI response items vs Gemini interaction ID / stateless thought signatures) + workflow loop.
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

export default function opaqueContinuation(s, c) {
  const showGemini = s.value(0);
  const showBaseline = s.value(0);

  const bgAura = aura(0, 0, 740, '#14335c28', '#20184422');
  const title = heroTitle(
    ['Opaque Reasoning Continuation:', 'Reusing State Without Raw Thoughts'],
    {
      x: -855,
      y: -430,
      size: 46,
      lineHeight: 54,
      accent: ROLE.score,
    },
  );

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const gm = showGemini.value;
    const bs = showBaseline.value;

    const nodes = [
      txt(
        'MULTI-TURN TOOL & REASONING LOOPS NEED EXACT PROVIDER STATE HANDLES',
        -855,
        -220,
        26,
        ROLE.search,
        'mono',
        'left',
      ).opacity(alpha),

      rect(760, 210, { fill: '#10203a', stroke: ROLE.draft, width: 2.8, radius: 14 })
        .at(-430, -45)
        .opacity(alpha),
      txt('OPENAI RESPONSES CONTRACT', -430, -108, 26, ROLE.draft, 'mono', 'center').opacity(alpha),
      txt(
        'Pass actual earlier response items',
        -430,
        -52,
        26,
        COSMOS.ink,
        'sans',
        'center',
      ).opacity(alpha),
      txt(
        'Inspect effective reasoning-context',
        -430,
        4,
        26,
        ROLE.search,
        'mono',
        'center',
      ).opacity(alpha),

      rect(760, 210, {
        fill: gm > 0.35 ? '#181434' : '#10182d',
        stroke: gm > 0.35 ? ROLE.score : ROLE.search,
        width: 2.8,
        radius: 14,
      })
        .at(430, -45)
        .opacity(alpha * (0.5 + 0.5 * gm)),
      txt('GEMINI INTERACTIONS CONTRACT', 430, -108, 26, ROLE.score, 'mono', 'center').opacity(
        alpha,
      ),
      txt('Stateful: pass interaction ID', 430, -52, 26, COSMOS.ink, 'sans', 'center').opacity(
        alpha,
      ),
      txt('Stateless: replay exact thought sigs', 430, 4, 26, ROLE.gold, 'mono', 'center').opacity(
        alpha,
      ),

      chipPill(
        bs > 0.35
          ? 'Start with clear criteria & baseline, alternate reasoning/tools/text, then verify returned answers!'
          : 'Preserve exact opaque blocks/signatures for the next turn; show readable summaries to humans',
        0,
        205,
        {
          w: 1620,
          h: 78,
          color: bs > 0.35 ? ROLE.ok : ROLE.score,
          size: 26,
          opacity: alpha,
        },
      ),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, layer);
  playCue(s, c, 'tt-opaque-continuation-0', (d) => s.play(showGemini.to(0, { duration: d })));
  playCue(s, c, 'tt-state-replay', (d) => s.play(showGemini.to(0.2, { duration: d })));
  playCue(s, c, 'tt-opaque-continuation-1', (d) => s.play(showGemini.to(0.6, { duration: d })));
  playCue(s, c, 'tt-signature-replay', (d) => s.play(showGemini.to(1, { duration: d })));
  playCue(s, c, 'tt-opaque-continuation-2', (d) => s.play(showBaseline.to(1, { duration: d })));
}
