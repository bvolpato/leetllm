// Scene 26: yarn-temperature: Amplitude a = 1 + 0.1*ln(4) = 1.139 scales Q&K, multiplies logits by a^2 = 1.296 (T = 0.771).
import { dynamic, group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  bindStepCues,
  cinemaAura,
  cinemaStars,
  clockDial,
  glowTex,
  heroTitle,
  shareStrip,
  softmax,
  txt,
} from '../parts.mjs';

const AMP = 1 + 0.1 * Math.log(4); // 1.1386
const LOGIT_FAC = AMP * AMP; // 1.2965
const TEMP = 1 / LOGIT_FAC; // 0.7713
const ALL_CUES = [
  'rp-yarn-temperature-0-0',
  'rp-yarn-temperature-0-1',
  'rp-yarn-temperature-0-2',
  'rp-yarn-temperature-0-3',
  'rp-yarn-temperature-1-0',
  'rp-yarn-temperature-1-1',
  'rp-yarn-temperature-1-2',
  'rp-yarn-temperature-1-3',
  'rp-yarn-temperature-2-0',
  'rp-yarn-temperature-2-1',
  'rp-yarn-temperature-2-2',
  'rp-yarn-temperature-2-3',
];

export default function yarnTemperature(s, c) {
  const step = s.value(0);
  const stars = cinemaStars(125, 26, COSMOS.gold);
  const stageAura = cinemaAura(-450, 20, 560, '#ffd16620', '#5ce1e614');

  const title = heroTitle(['Amplitude scales logits', 'and vector lengths'], {
    x: -860,
    y: -435,
    size: 54,
    lineHeight: 62,
    accent: COSMOS.gold,
    eyebrow: 'YaRN ATTENTION TEMPERATURE (s = 4)',
  });

  const eq = glowTex(
    String.raw`a = 1 + 0.1\ln(s),\quad (aq)^\top(ak) = a^2 q^\top k = \frac{q^\top k}{T}`,
    { x: 255, y: -380, size: 34, color: COSMOS.gold, glow: 5 },
  );

  const live = dynamic(() => {
    const st = step.value;
    const scaleP = Math.max(0, Math.min(1, (st - 1.5) / 2.2));
    const addKey3 = Math.max(0, Math.min(1, (st - 7.8) / 1.0));
    const curA = 1 + scaleP * (AMP - 1);
    const curFac = curA * curA;
    const curT = 1 / curFac;

    const baseLogits2 = [2.0, 0.5];
    const scaled2 = baseLogits2.map((z) => z * curFac);
    const w2 = softmax(scaled2);
    const eqW = softmax([1.0 * curFac, 1.0 * curFac]);
    const w3 = softmax([2.0 * curFac, 0.5 * curFac, 10.0 * curFac]);

    const nodes = [
      // Left: Rotating Q & K arrows physically growing in radius by a = 1.139 (breaking unit circle!)
      clockDial({
        cx: -540,
        cy: 30,
        radius: 175,
        queryAngle: 0.9,
        keyAngle: 0.35,
        queryLength: curA,
        keyLength: curA,
        showAxes: true,
        showAngleArc: true,
        title: `Amplitude a = ${curA.toFixed(3)}`,
        subtitle: `a² = ${curFac.toFixed(3)}   ·   T = ${curT.toFixed(3)}`,
        titleColor: COSMOS.gold,
        subColor: ROLE.query,
      }),
      // Right: Live logit scaling & softmax sharpening
      txt(
        'Nonuniform logits [2.0, 0.5] × a²  →  sharper shares',
        -80,
        -175,
        26,
        ROLE.query,
        'mono',
        'left',
      ),
      shareStrip({
        x: -80,
        y: -115,
        width: 860,
        height: 52,
        shares: [w2[0], w2[1]],
        colors: [ROLE.query, COSMOS.blue],
        labels: [`k₁ ${(w2[0] * 100).toFixed(1)}%`, `k₂ ${(w2[1] * 100).toFixed(1)}%`],
      }),
      txt(
        'Equal logits [1.0, 1.0] × a²  →  stay equal (50% / 50%)',
        -80,
        -20,
        26,
        COSMOS.muted,
        'mono',
        'left',
      ),
      shareStrip({
        x: -80,
        y: 36,
        width: 860,
        height: 46,
        shares: [eqW[0], eqW[1]],
        colors: [COSMOS.dim, '#465884'],
        labels: ['50.0%', '50.0%'],
      }),
      // Third key with logit 10 dominates & lowers entropy
      txt(
        addKey3 > 0.2
          ? 'Add 3rd key (logit = 10): takes 99.9%+ mass → lower entropy'
          : 'Adding a dominant distant key sharpens distribution',
        -80,
        138,
        26,
        addKey3 > 0.2 ? ROLE.score : COSMOS.dim,
        'mono',
        'left',
      ),
      shareStrip({
        x: -80,
        y: 196,
        width: 860,
        height: 52,
        shares: addKey3 > 0.2 ? [0.02, 0.02, 0.96] : [w2[0], w2[1], 0],
        colors: [ROLE.query, COSMOS.blue, ROLE.score],
        labels:
          addKey3 > 0.2
            ? ['', '', `k₃ (logit 10): ${(w3[2] * 100).toFixed(2)}%`]
            : ['k₁', 'k₂', ''],
      }),
      line([-80, 275], [780, 275], { stroke: '#2c3b5e', width: 1.6 }),
      txt(
        'With long-context training: PI reported 32k tokens  ·  YaRN reported 128k tokens',
        -80,
        325,
        26,
        COSMOS.muted,
        'sans',
        'left',
      ),
      txt(
        `Scale s = 4: a = ${AMP.toFixed(3)}, logit ×${LOGIT_FAC.toFixed(3)}, T = ${TEMP.toFixed(3)}`,
        -80,
        380,
        26,
        COSMOS.gold,
        'mono',
        'left',
      ),
    ];

    return group(...nodes);
  });

  s.add(stars, stageAura, title, eq, live);
  bindStepCues(s, c, step, ALL_CUES, 0.55);
}
