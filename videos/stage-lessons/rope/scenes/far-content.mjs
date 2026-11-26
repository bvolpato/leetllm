// Scene 21: far-content: Finite ALiBi penalty (-64 at Δ=16,384) overcome by +65 content match -> 73.1% mass.
import { dynamic, group, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  bindStepCues,
  cinemaAura,
  cinemaStars,
  heroTitle,
  shareStrip,
  softmax,
  txt,
} from '../parts.mjs';

const ALL_CUES = [
  'rp-far-content-0-0',
  'rp-far-content-0-1',
  'rp-far-content-0-2',
  'rp-far-content-0-3',
  'rp-far-content-1-0',
  'rp-far-content-1-1',
  'rp-far-content-1-2',
  'rp-far-content-1-3',
];

export default function farContent(s, c) {
  const step = s.value(0);
  const stars = cinemaStars(125, 21, ROLE.score);
  const stageAura = cinemaAura(0, 10, 700, '#6ee7b71e', '#fb923c14');

  const title = heroTitle(['A finite penalty', 'can be overcome'], {
    x: -860,
    y: -435,
    size: 56,
    lineHeight: 64,
    accent: ROLE.score,
    eyebrow: 'DISTANT CONTENT OVERCOMES RECENCY',
  });

  const live = dynamic(() => {
    const st = step.value;
    // Content boost smoothly rises from 0 to +65 across cue 2..3
    const boost = Math.max(0, Math.min(65, (st - 1.8) * 65));
    const showPaper = Math.max(0, Math.min(1, st - 5.2));
    const penalty = -64;
    const netFar = penalty + boost;
    const weights = softmax([0, netFar]); // [self, far]

    const nodes = [
      txt(
        'Gentlest head: m = 1/256   ·   Distance Δ = 16,384',
        -855,
        -225,
        28,
        ROLE.alibi,
        'mono',
        'left',
      ),
      txt(
        `Distance penalty: −16,384 / 256 = ${penalty}`,
        -855,
        -162,
        30,
        ROLE.danger,
        'mono',
        'left',
      ),
      txt(`Content advantage: +${boost.toFixed(0)}`, -855, -100, 30, ROLE.query, 'mono', 'left'),
      txt(
        `Net far logit vs self:  ${netFar >= 0 ? '+' : ''}${netFar.toFixed(1)}`,
        110,
        -132,
        36,
        netFar > 0 ? ROLE.score : ROLE.danger,
        'mono',
        'left',
      ).glow(8, netFar > 0 ? ROLE.score : ROLE.danger),
      // Full-bleed glowing 2-key softmax share bar
      txt('Two-key softmax share (self vs far key)', -855, 20, 26, COSMOS.muted, 'mono', 'left'),
      shareStrip({
        x: -855,
        y: 85,
        width: 1710,
        height: 68,
        shares: [Math.max(0.03, weights[0]), Math.max(0.03, weights[1])],
        colors: [ROLE.query, ROLE.score],
        labels: [
          `self: ${(weights[0] * 100).toFixed(1)}%`,
          `far key: ${(weights[1] * 100).toFixed(1)}%`,
        ],
      }),
      // Paper evidence row (1.3B model, train 1024 -> eval 2048, -11% mem, 11% faster)
      rect(520, 128, { fill: '#10182b', stroke: COSMOS.blue, width: 2.2, radius: 14 })
        .at(-595, 295)
        .opacity(0.35 + 0.65 * showPaper),
      txt('1.3B Model Extrapolation', -595, 265, 26, COSMOS.blue, 'mono').opacity(
        0.35 + 0.65 * showPaper,
      ),
      txt('Train 1,024  →  Eval 2,048', -595, 315, 30, COSMOS.ink, 'mono').opacity(
        0.35 + 0.65 * showPaper,
      ),

      rect(520, 128, { fill: '#102424', stroke: ROLE.score, width: 2.2, radius: 14 })
        .at(0, 295)
        .opacity(0.35 + 0.65 * showPaper),
      txt('Memory & Speed vs Sinusoidal', 0, 265, 26, ROLE.score, 'mono').opacity(
        0.35 + 0.65 * showPaper,
      ),
      txt('−11% memory  ·  11% faster', 0, 315, 30, ROLE.score, 'mono').opacity(
        0.35 + 0.65 * showPaper,
      ),

      rect(520, 128, { fill: '#221424', stroke: ROLE.danger, width: 2.2, radius: 14 })
        .at(595, 295)
        .opacity(0.35 + 0.65 * showPaper),
      txt('Causal Future Key', 595, 265, 26, ROLE.danger, 'mono').opacity(0.35 + 0.65 * showPaper),
      txt('Hard-masked  (−∞  →  0)', 595, 315, 30, ROLE.danger, 'mono').opacity(
        0.35 + 0.65 * showPaper,
      ),
    ];

    return group(...nodes);
  });

  s.add(stars, stageAura, title, live);
  bindStepCues(s, c, step, ALL_CUES, 0.55);
}
