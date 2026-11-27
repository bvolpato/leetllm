// Scene 34: How can a written principle supply a preference? (Constitutional AI: Critique -> Revision -> SFT -> RLAIF + Human Holdout)
import {
  COSMOS,
  aura,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  line,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function aiFeedback(s, c) {
  const phase = s.value(0);
  const sCai = s.value(0);
  const sRev = s.value(0);
  const sRew = s.value(0);
  const sDirect = s.value(0);
  const sHuman = s.value(0);

  const bgAura = aura(0, 20, 620, '#123e3626', '#2e1a4a18');
  const title = heroTitle(['How Can a Written Principle', 'Supply a Preference?'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: COSMOS.gold,
    eyebrow: 'CONSTITUTIONAL AI & RLAIF · CRITIQUE-REVISION SFT -> AI JUDGE -> HUMAN HOLDOUT',
  });

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);
    const ci = Math.max(0.75, sCai.value);
    const rv = sRev.value;
    const rw = sRew.value;
    const dr = sDirect.value;
    const hm = sHuman.value;

    const nodes = [
      // STAGE 1: SL-CAI (4-step horizontal flow)
      txt(
        'STAGE 1 (SL-CAI): PRINCIPLE -> CRITIQUE -> REVISION -> SFT',
        -855,
        -214,
        26,
        COSMOS.cyan,
        'mono',
        'left',
      ),

      glassCell(-655, -110, 380, 126, COSMOS.gold, { fill: '#221c0e', glow: 6, opacity: ci }),
      txt('PRINCIPLE P-7', -655, -138, 26, COSMOS.gold, 'mono'),
      txt('Cite P-7 & escalate', -655, -88, 26, COSMOS.ink, 'sans'),

      line([-460, -110], [-410, -110], { stroke: COSMOS.gold, width: 3 }),

      glassCell(-220, -110, 370, 126, COSMOS.rose, { fill: '#28101a', glow: 5, opacity: ci }),
      txt('DRAFT + CRITIQUE', -220, -138, 26, COSMOS.rose, 'mono'),
      txt('Direct grant breaks P-7', -220, -88, 26, COSMOS.ink, 'sans'),

      line([-30, -110], [20, -110], { stroke: COSMOS.emerald, width: 3 }),

      glassCell(215, -110, 380, 126, COSMOS.emerald, {
        fill: '#0e2824',
        glow: rv > 0.2 ? 10 * pulse : 5,
      }),
      txt('REVISED REPLY', 215, -138, 26, COSMOS.emerald, 'mono'),
      txt('Open ticket + cite P-7', 215, -88, 26, COSMOS.ink, 'sans'),

      line([410, -110], [460, -110], { stroke: COSMOS.cyan, width: 3 }),

      glassCell(655, -110, 380, 126, COSMOS.cyan, {
        fill: '#0f2138',
        glow: rv > 0.2 ? 9 * pulse : 4,
      }),
      txt('SUPERVISED SFT', 655, -138, 26, COSMOS.cyan, 'mono'),
      txt('Train on revised targets', 655, -88, 26, COSMOS.ink, 'sans'),

      // STAGE 2: RLAIF (Preference model + direct comparison)
      txt(
        'STAGE 2 (RLAIF): AI COMPARISONS -> REWARD MODEL -> RL',
        -855,
        16,
        26,
        COSMOS.violet,
        'mono',
        'left',
      ),

      glassCell(-445, 114, 800, 126, rw > 0.2 ? COSMOS.violet : COSMOS.dim, {
        fill: '#1b1430',
        glow: rw > 0.2 ? 9 * pulse : 4,
        opacity: Math.max(0.75, rw),
      }),
      txt('AI HARMLESSNESS + HUMAN HELPFULNESS', -810, 86, 26, COSMOS.violet, 'mono', 'left'),
      txt(
        'Fit preference model -> use as RL reward signal',
        -810,
        138,
        26,
        COSMOS.ink,
        'sans',
        'left',
      ),

      glassCell(445, 114, 800, 126, dr > 0.2 ? COSMOS.amber : COSMOS.dim, {
        fill: '#231a0f',
        glow: dr > 0.2 ? 9 * pulse : 4,
        opacity: Math.max(0.75, dr),
      }),
      txt('DIRECT AI PAIRWISE JUDGE (KEY TEST)', 80, 86, 26, COSMOS.amber, 'mono', 'left'),
      txt(
        'Must spot ticket vs invented migration exception!',
        80,
        138,
        26,
        COSMOS.ink,
        'sans',
        'left',
      ),

      // STAGE 3: Independent Human Evaluation Lane (always separate!)
      glassCell(0, 314, 1690, 152, hm > 0.2 ? COSMOS.emerald : COSMOS.dim, {
        fill: hm > 0.2 ? '#0e2624' : '#12182b',
        glow: hm > 0.2 ? 10 * pulse : 4,
        opacity: Math.max(0.75, hm),
      }),
      txt('SEPARATE HUMAN HOLDOUT EVALUATION LANE', -810, 276, 28, COSMOS.emerald, 'mono', 'left'),
      txt(
        'People review fresh access requests (including fabricated exceptions): did it cite P-7 & escalate? Reserve for eval.',
        -810,
        336,
        26,
        COSMOS.ink,
        'sans',
        'left',
      ),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('ai-feedback-b0', () =>
    s.play(sCai.to(1, { duration: remainDuration(c, 'ai-feedback-b0', 0.45) })),
  );
  c.on('pa-ai-revision', () =>
    s.play(sRev.to(1, { duration: remainDuration(c, 'pa-ai-revision', 0.5) })),
  );
  c.on('pa-ai-reward', () =>
    s.play(sRew.to(1, { duration: remainDuration(c, 'pa-ai-reward', 0.5) })),
  );
  c.on('ai-feedback-b1', () =>
    s.play(sDirect.to(1, { duration: remainDuration(c, 'ai-feedback-b1', 0.5) })),
  );
  c.on('ai-feedback-b2', () =>
    s.play(sHuman.to(1, { duration: remainDuration(c, 'ai-feedback-b2', 0.55) })),
  );
}
