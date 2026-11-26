// Scene 23: position-precision: BF16 collapses 4096 & 4097 to 4096; FP32 restores distinct cosines (0.804 vs 0.935).
import { dynamic, group, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  bindStepCues,
  cinemaAura,
  cinemaStars,
  clockDial,
  heroTitle,
  toBfloat16,
  txt,
} from '../parts.mjs';

const ALL_CUES = [
  'rp-position-precision-0-0',
  'rp-position-precision-0-1',
  'rp-position-precision-0-2',
  'rp-position-precision-0-3',
  'rp-position-precision-0-4',
  'rp-position-precision-1-0',
  'rp-position-precision-1-1',
  'rp-position-precision-1-2',
  'rp-position-precision-1-3',
];

const BF_4096 = toBfloat16(4096); // 4096
const BF_4097 = toBfloat16(4097); // 4096 (collapsed!)
const COS_4096 = Math.cos(4096); // 0.804
const COS_4097 = Math.cos(4097); // 0.935

export default function positionPrecision(s, c) {
  const step = s.value(0);
  const stars = cinemaStars(125, 23, ROLE.danger);
  const stageAura = cinemaAura(350, 20, 560, '#ff6b8b1e', '#6ee7b716');

  const title = heroTitle(['Keep distinct indices', 'distinct before cosine'], {
    x: -860,
    y: -435,
    size: 54,
    lineHeight: 62,
    accent: ROLE.danger,
    eyebrow: 'BF16 MANTISSA COLLAPSE VS FP32 PHASE',
  });

  const live = dynamic(() => {
    const st = step.value;
    // Beat 0 (st < 5): BF16 collapse! Beat 1 (st >= 5): FP32 integer-to-phase repair!
    const repaired = st >= 5.2;
    const pA = repaired ? 4096 : BF_4096;
    const pB = repaired ? 4097 : BF_4097;
    const cA = Math.cos(pA);
    const cB = Math.cos(pB);
    const angA = pA % (Math.PI * 2);
    const angB = pB % (Math.PI * 2);

    const colState = repaired ? ROLE.score : ROLE.danger;

    const nodes = [
      // Left: Index conversion pipeline for 4096 vs 4097
      txt(
        repaired ? 'REPAIRED: int → FP32 phase' : 'BUG: int → BF16 → cos()',
        -855,
        -220,
        30,
        colState,
        'mono',
        'left',
      ).glow(6, colState),

      rect(340, 86, { fill: '#111a2e', stroke: ROLE.query, width: 2.6, radius: 12 }).at(-685, -90),
      txt('int ID = 4096', -685, -90, 30, ROLE.query, 'mono'),
      rect(340, 86, {
        fill: repaired ? '#102826' : '#2e1222',
        stroke: colState,
        width: 2.8,
        radius: 12,
      }).at(-235, -90),
      txt(`val = ${pA}`, -235, -90, 30, colState, 'mono'),

      rect(340, 86, { fill: '#1c1926', stroke: COSMOS.gold, width: 2.6, radius: 12 }).at(-685, 55),
      txt('int ID = 4097', -685, 55, 30, COSMOS.gold, 'mono'),
      rect(340, 86, {
        fill: repaired ? '#102826' : '#2e1222',
        stroke: colState,
        width: 2.8,
        radius: 12,
      }).at(-235, 55),
      txt(`val = ${pB}`, -235, 55, 30, colState, 'mono'),

      // Cosine outputs
      txt(`cos(4096) = ${cA.toFixed(3)}`, -855, 195, 34, ROLE.query, 'mono', 'left'),
      txt(
        `cos(4097) = ${cB.toFixed(3)}`,
        -855,
        255,
        34,
        repaired ? COSMOS.gold : ROLE.danger,
        'mono',
        'left',
      ).glow(6, repaired ? COSMOS.gold : ROLE.danger),
      txt(
        repaired
          ? 'Distinct arrows & phases restored in FP32!'
          : 'Identical BF16 inputs → casting cos() to FP32 cannot recover lost bit',
        -855,
        355,
        27,
        colState,
        'sans',
        'left',
      ),

      // Right: Glowing dial showing the two rays either collapsed onto one ray (BF16) or cleanly separated (FP32)!
      clockDial({
        cx: 455,
        cy: 15,
        radius: 215,
        queryAngle: angA,
        keyAngle: angB,
        showAxes: true,
        showWake: true,
        showAngleArc: repaired,
        queryColor: ROLE.query,
        keyColor: repaired ? COSMOS.gold : ROLE.danger,
        projColor: ROLE.score,
        title: repaired ? '4096 (cyan) vs 4097 (gold)' : '4096 & 4097 COLLAPSED',
        subtitle: repaired
          ? `cos: ${COS_4096.toFixed(3)} vs ${COS_4097.toFixed(3)}`
          : `Both evaluate cos(4096) = ${COS_4096.toFixed(3)}`,
        titleColor: colState,
        subColor: COSMOS.ink,
      }),
    ];

    return group(...nodes);
  });

  s.add(stars, stageAura, title, live);
  bindStepCues(s, c, step, ALL_CUES, 0.55);
}
