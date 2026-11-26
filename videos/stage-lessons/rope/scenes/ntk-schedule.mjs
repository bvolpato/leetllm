// Scene 24: ntk-schedule: Uniform PI (0.25 everywhere) vs NTK-aware uneven stretching (1.0, 0.630, 0.397, 0.250).
import { dynamic, group, rect } from 'vizmatic/stage';
import {
  CLOCK_FREQUENCIES,
  COSMOS,
  ROLE,
  bindStepCues,
  cinemaAura,
  cinemaStars,
  clockDial,
  frequencySchedules,
  glowTex,
  heroTitle,
  txt,
} from '../parts.mjs';

const SCHED = frequencySchedules(4, 8, 10000, 4096);
const BASE_128_NTK = Math.round(10000 * Math.pow(4, 128 / 126)); // ~40,890
const ALL_CUES = [
  'rp-ntk-schedule-0-0',
  'rp-ntk-schedule-0-1',
  'rp-ntk-schedule-0-2',
  'rp-ntk-schedule-0-3',
  'rp-ntk-schedule-1-0',
  'rp-ntk-schedule-1-1',
  'rp-ntk-schedule-1-2',
  'rp-ntk-schedule-1-3',
  'rp-ntk-schedule-2-0',
  'rp-ntk-schedule-2-1',
  'rp-ntk-schedule-2-2',
  'rp-ntk-schedule-2-3',
  'rp-ntk-schedule-2-4',
  'rp-ntk-schedule-2-5',
];

export default function ntkSchedule(s, c) {
  const step = s.value(0);
  const stars = cinemaStars(130, 24, ROLE.score);
  const stageAura = cinemaAura(0, -10, 720, '#5ce1e620', '#6ee7b716');

  const title = heroTitle(['Uniform vs uneven', 'frequency stretching'], {
    x: -860,
    y: -435,
    size: 54,
    lineHeight: 62,
    accent: ROLE.score,
    eyebrow: 'PI VS NTK-AWARE SCALING (s = 4, d = 8)',
  });

  const eq = glowTex(String.raw`\text{base}' = \text{base} \cdot s^{\frac{d}{d-2}}`, {
    x: 495,
    y: -380,
    size: 38,
    color: COSMOS.gold,
    glow: 6,
  });

  const live = dynamic(() => {
    const st = step.value;
    // Morph smoothly from PI (0) -> NTK (1) starting at cue 4..7
    const ntkBlend = Math.max(0, Math.min(1, (st - 4.2) / 2.6));
    const showLarge = Math.max(0, Math.min(1, st - 10.5));

    const dialXs = [-630, -210, 210, 630];
    const dialY = -140;
    const nodes = [];

    CLOCK_FREQUENCIES.forEach((origF, i) => {
      const piRatio = SCHED.pi[i] / origF; // 0.25
      const ntkRatio = SCHED.ntk[i] / origF; // 1.0, 0.630, 0.397, 0.250
      const ratio = piRatio + ntkBlend * (ntkRatio - piRatio);
      const col = ROLE.bands[i];

      nodes.push(
        clockDial({
          cx: dialXs[i],
          cy: dialY,
          radius: 92,
          queryAngle: 0,
          keyAngle: -2.2 * ratio,
          showAxes: true,
          showAngleArc: true,
          queryColor: COSMOS.ink,
          keyColor: col,
          projColor: ntkBlend > 0.5 ? ROLE.score : ROLE.alibi,
          title: `θ${i} = ${origF}`,
          subtitle: `ratio = ${ratio.toFixed(3)}×`,
          titleColor: col,
          subColor: ntkBlend > 0.5 ? ROLE.score : ROLE.alibi,
        }),
      );

      // Ratio bar cleanly below dial subtitle with generous gap
      const barY = 215;
      const maxH = 112;
      const curH = ratio * maxH;
      nodes.push(
        rect(62, curH, { fill: col, stroke: null, radius: 6 })
          .at(dialXs[i], barY - curH * 0.5)
          .opacity(0.84)
          .glow(8, col)
          .set('blend', 'screen'),
        txt(`${(ratio * 100).toFixed(0)}%`, dialXs[i], barY + 34, 26, col, 'mono'),
      );
    });

    // Bottom comparative strip: PI 16383 -> 4095.75, NTK d=128 base 10k -> 40,890, Code Llama 1M
    nodes.push(
      txt(
        ntkBlend > 0.5
          ? 'NTK-aware (8D, s=4): fast clock keeps 1.00×, slow clock drops to 0.25×'
          : 'Position Interpolation (s=4): 16,383 → 4,095.75 (0.25× in every lane)',
        -855,
        295,
        28,
        ntkBlend > 0.5 ? ROLE.score : ROLE.alibi,
        'mono',
        'left',
      ),
      txt(
        `d = 128 NTK base': 10,000 → ${BASE_128_NTK.toLocaleString('en-US')}   |   Code Llama manual base: 1,000,000`,
        -855,
        368,
        27,
        showLarge > 0.2 ? COSMOS.gold : COSMOS.dim,
        'sans',
        'left',
      ),
    );

    return group(...nodes);
  });

  s.add(stars, stageAura, title, eq, live);
  bindStepCues(s, c, step, ALL_CUES, 0.55);
}
