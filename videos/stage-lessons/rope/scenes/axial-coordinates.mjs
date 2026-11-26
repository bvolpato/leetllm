// Scene 18: axial-coordinates: 2D image patch height/width dials (1.878 invariant, 2.000 if height dropped) + 3-axis Qwen2.5-VL.
import { dynamic, group, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  bindStepCues,
  cinemaAura,
  cinemaStars,
  clockDial,
  heroTitle,
  txt,
} from '../parts.mjs';

const ALL_CUES = [
  'rp-axial-coordinates-0-0',
  'rp-axial-coordinates-0-1',
  'rp-axial-coordinates-0-2',
  'rp-axial-coordinates-0-3',
  'rp-axial-coordinates-1-0',
  'rp-axial-coordinates-1-1',
  'rp-axial-coordinates-1-2',
  'rp-axial-coordinates-1-3',
  'rp-axial-coordinates-1-4',
  'rp-axial-coordinates-1-5',
  'rp-axial-coordinates-2-0',
  'rp-axial-coordinates-2-1',
  'rp-axial-coordinates-2-2',
  'rp-axial-coordinates-2-3',
];

const F = 0.5;

export default function axialCoordinates(s, c) {
  const step = s.value(0);
  const stars = cinemaStars(125, 18, ROLE.shift);
  const stageAura = cinemaAura(280, -20, 620, '#5ce1e620', '#ffd16614');

  const title = heroTitle(['Image patches have', 'two independent offsets'], {
    x: -860,
    y: -435,
    size: 54,
    lineHeight: 62,
    accent: ROLE.query,
    eyebrow: '2D AXIAL ROPE & MULTIMODAL AXES',
  });

  const live = dynamic(() => {
    const st = step.value;
    const shifted = st >= 7.0 && st < 8.5;
    const dropH = st >= 8.5 && st < 11.2;
    const show3Axis = st >= 11.2;

    const dh = dropH ? 0 : 1; // (1,1) vs (0,1) -> dh=1, dw=0
    const dw = 0;
    const shiftH = shifted ? 4 : 0;
    const shiftW = shifted ? 7 : 0;
    const qH = dropH ? 0 : 1 + shiftH;
    const kH = 0 + shiftH;
    const qW = 1 + shiftW;
    const kW = 1 + shiftW;
    const score = Math.cos((kH - qH) * F) + Math.cos((kW - qW) * F);

    const nodes = [];

    // Left: 3x3 2D Image Patch Grid highlighting Query (1,1) and Key (0,1)
    const gLeft = -790;
    const gTop = -175;
    const cell = 118;
    nodes.push(
      txt(
        shifted ? 'Shifted by (+4, +7)' : dropH ? 'Height ID discarded!' : '2D Patch Grid (H, W)',
        gLeft + cell * 1.5,
        gTop - 44,
        26,
        dropH ? ROLE.danger : shifted ? ROLE.shift : COSMOS.muted,
        'mono',
      ),
    );
    for (let r = 0; r < 3; r++) {
      for (let col = 0; col < 3; col++) {
        const cx = gLeft + col * cell + cell * 0.5;
        const cy = gTop + r * cell + cell * 0.5;
        const isQ = r === 1 && col === 1;
        const isK = r === 0 && col === 1;
        const border = isQ ? ROLE.query : isK ? ROLE.key : '#2c3b5e';
        nodes.push(
          rect(cell - 12, cell - 12, {
            fill: isQ ? '#11293e' : isK ? '#2c2512' : '#0f1526',
            stroke: border,
            width: isQ || isK ? 3.2 : 1.6,
            radius: 10,
          }).at(cx, cy),
          txt(
            `(${r + shiftH},${col + shiftW})`,
            cx,
            cy,
            26,
            isQ ? ROLE.query : isK ? ROLE.key : COSMOS.dim,
            'mono',
          ),
        );
      }
    }

    // Center-right: Separate Height dial (cyan) & Width dial (gold)
    nodes.push(
      clockDial({
        cx: 120,
        cy: -55,
        radius: 138,
        queryAngle: qH * F,
        keyAngle: kH * F,
        showProj: true,
        queryColor: ROLE.query,
        keyColor: ROLE.key,
        projColor: dropH ? ROLE.danger : ROLE.score,
        title: `Height axis (ΔH = ${dh})`,
        subtitle: `cos(${(dh * F).toFixed(1)}) = ${Math.cos(dh * F).toFixed(3)}`,
        titleColor: dropH ? ROLE.danger : ROLE.query,
        subColor: COSMOS.ink,
      }),
      clockDial({
        cx: 560,
        cy: -55,
        radius: 138,
        queryAngle: qW * F,
        keyAngle: kW * F,
        showProj: true,
        queryColor: ROLE.query,
        keyColor: ROLE.key,
        projColor: ROLE.score,
        title: `Width axis (ΔW = ${dw})`,
        subtitle: `cos(0.0) = 1.000`,
        titleColor: COSMOS.gold,
        subColor: COSMOS.ink,
      }),
    );

    // Bottom score readout + Qwen2.5-VL 3-axis note
    nodes.push(
      txt(
        `Axial score = ${score.toFixed(3)}`,
        -790,
        265,
        42,
        dropH ? ROLE.danger : ROLE.score,
        'mono',
        'left',
      ).glow(8, dropH ? ROLE.danger : ROLE.score),
      txt(
        show3Axis
          ? 'Qwen2.5-VL M-RoPE: 3 axes (Temporal, Height, Width)'
          : '1D raster gap equals grid width: 2D axial stays grid-invariant',
        -790,
        355,
        27,
        show3Axis ? ROLE.shift : COSMOS.muted,
        'sans',
        'left',
      ),
    );

    return group(...nodes);
  });

  s.add(stars, stageAura, title, live);
  bindStepCues(s, c, step, ALL_CUES, 0.55);
}
