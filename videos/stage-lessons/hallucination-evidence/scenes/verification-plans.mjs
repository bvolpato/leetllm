// Scene 17: Which question would you ask the draft? (Chain-of-Verification vs first failed stage)
import {
  COSMOS,
  aura,
  glassCell,
  glowDot,
  glowingArc,
  group,
  guardedDynamic,
  heroTitle,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function verificationPlans(s, c) {
  const phase = s.value(0);
  const showCove = s.value(0);
  const showFirstFail = s.value(0);

  const bgAura = aura(0, 10, 680, '#12335e26', '#2a1c5216');
  const title = heroTitle(['Which Question Would', 'You Ask the Draft?'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.cyan,
    eyebrow: 'CHAIN-OF-VERIFICATION (CoVe) · ISOLATED CHECKS vs FIRST FAILED STAGE',
  });

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const sc = showCove.value;
    const sf = showFirstFail.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);

    const steps = [
      { num: '1. DRAFT', sub: '"ETA 14:30 UTC"', col: COSMOS.amber },
      { num: '2. PLAN CHECK', sub: '"Which field gives ETA?"', col: COSMOS.cyan },
      { num: '3. ANSWER ALONE', sub: 'No draft anchoring!', col: COSMOS.gold },
      { num: '4. REVISE', sub: 'Drop unbacked ETA', col: COSMOS.emerald },
    ];

    const nodes = [
      txt('CHAIN-OF-VERIFICATION (4-STEP LOOP)', -855, -205, 26, COSMOS.cyan, 'mono', 'left'),
    ];

    steps.forEach((st, i) => {
      const cx = -645 + i * 430;
      nodes.push(
        glassCell(cx, -88, 360, 146, sc > 0.3 ? st.col : COSMOS.muted, {
          fill: '#10182d',
          glow: sc > 0.3 ? 8 * pulse : 3,
        }),
        txt(st.num, cx, -118, 26, st.col, 'mono'),
        txt(st.sub, cx, -64, 26, COSMOS.ink, 'sans'),
      );
      if (i < steps.length - 1) {
        nodes.push(
          glowingArc([cx + 186, -88], [cx + 244, -88], -14, {
            color: sc > 0.3 ? COSMOS.cyan : COSMOS.muted,
            width: 3.4,
          }),
        );
      }
    });

    nodes.push(
      // Bottom left: CoVe caveat (still needs a source!)
      glassCell(-445, 146, 810, 210, sc > 0.3 ? COSMOS.gold : COSMOS.muted, {
        fill: '#1d1910',
        glow: 3,
      }),
      txt('WHAT CoVe HELPS, AND WHAT IT CANNOT REPLACE', -820, 82, 26, COSMOS.gold, 'mono', 'left'),
      txt(
        '· Answering checks separately cuts self-anchoring',
        -820,
        128,
        26,
        COSMOS.ink,
        'sans',
        'left',
      ),
      txt(
        '· Tested on lists, closed-book QA & long-form text',
        -820,
        168,
        26,
        COSMOS.muted,
        'sans',
        'left',
      ),
      txt(
        '· A model reply STILL needs an admitted source!',
        -820,
        208,
        26,
        COSMOS.rose,
        'mono',
        'left',
      ),

      // Bottom right: Diagnose first failed check BEFORE adding model calls
      glassCell(455, 146, 810, 210, sf > 0.3 ? COSMOS.emerald : COSMOS.muted, {
        fill: sf > 0.3 ? '#0e2824' : '#12182b',
        glow: sf > 0.3 ? 9 * pulse : 2,
      }),
      txt(
        'FIND FIRST FAILED STAGE BEFORE ADDING CALLS',
        80,
        82,
        26,
        COSMOS.emerald,
        'mono',
        'left',
      ),
      txt(
        '· Missing runbook -> fix retrieval & admission',
        80,
        128,
        26,
        COSMOS.cyan,
        'sans',
        'left',
      ),
      txt(
        '· Valid runbook + guessed ETA -> fix claim gen',
        80,
        168,
        26,
        COSMOS.amber,
        'sans',
        'left',
      ),
      txt(
        '· Request trace separates these two failures fast',
        80,
        208,
        26,
        COSMOS.ink,
        'sans',
        'left',
      ),

      glowDot(-840, 355, { radius: 6, color: COSMOS.cyan }),
      txt(
        'Do not stack extra LLM verification calls onto a broken retrieval or admission pipeline',
        -812,
        357,
        28,
        COSMOS.muted,
        'sans',
        'left',
      ),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('verification-plans-b1', () => s.play(showCove.to(1, { duration: 0.45 })));
  c.on('verification-plans-b2', () =>
    s.play(showFirstFail.to(1, { duration: remainDuration(c, 'verification-plans-b2', 0.45) })),
  );
}
